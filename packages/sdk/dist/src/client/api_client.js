"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _ApiClient_processUserInfo, _ApiClient_processUserInOrgInfo;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const util_1 = require("../util");
const mfa_1 = require("../mfa");
const response_1 = require("../response");
const paginator_1 = require("../paginator");
const user_export_1 = require("../user_export");
const fetch_1 = require("../fetch");
const base_client_1 = require("./base_client");
const retry_1 = require("../retry");
/**
 * String returned by API when a user does not have an email address (for backwards compatibility)
 */
const EMAIL_NOT_FOUND = "email not found";
/**
 * An extension of BaseClient that adds specialized methods for api endpoints
 */
class ApiClient extends base_client_1.BaseClient {
    /**
     * Creates a new client using the same session manager but targeting a
     * different (child) organization.
     *
     * @param targetOrgId The ID of an organization that the new client should target
     * @returns A new client targeting a different org
     */
    withTargetOrg(targetOrgId) {
        return new _a(this.sessionMeta, this.sessionManager, targetOrgId);
    }
    // #region USERS: userGet, userTotp(ResetInit|ResetComplete|Verify|Delete), userFido(RegisterInit|RegisterComplete|Delete)
    /**
     * @returns Information about the current user.
     */
    async userGet() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me", "get");
        return this.exec(o, {}).then(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInfo));
    }
    /**
     * Initiates login via Email OTP.
     * Returns an unsigned OIDC token and sends an email to the user containing the signature of that token.
     * The OIDC token can be reconstructed by appending the signature to the partial token like so:
     *
     * token = partial_token + signature
     *
     * @param env The environment to use
     * @param orgId The org to login to
     * @param email The email to send the signature to
     * @returns The partial OIDC token that must be combined with the signature in the email
     */
    static async initEmailOtpAuth(env, orgId, email) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/email-otp", "post");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body: { email },
        })).then(fetch_1.assertOk);
    }
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered either by calling {@link TotpChallenge.answer} (or
     * {@link ApiClient.userTotpResetComplete}).
     *
     * @param issuer Optional issuer; defaults to "Cubist"
     * @param mfaReceipt MFA receipt(s) to include in HTTP headers
     * @returns A TOTP challenge that must be answered
     */
    async userTotpResetInit(issuer, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp", "post");
        const resetTotpFn = async (headers) => {
            const data = await this.exec(o, {
                headers,
                body: issuer
                    ? {
                        issuer,
                    }
                    : null,
            });
            return (0, response_1.mapResponse)(data, (totpInfo) => new mfa_1.TotpChallenge(this, totpInfo));
        };
        return await response_1.CubeSignerResponse.create(this.env, resetTotpFn, mfaReceipt);
    }
    /**
     * Answer the TOTP challenge issued by {@link userTotpResetInit}. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.
     *
     * Instead of calling this method directly, prefer {@link TotpChallenge.answer}.
     *
     * @param totpId The ID of the TOTP challenge
     * @param code The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    async userTotpResetComplete(totpId, code) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp", "patch");
        await this.exec(o, {
            body: { totp_id: totpId, code },
        });
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     *
     * @param code Current TOTP code
     * @throws An error if verification fails
     */
    async userTotpVerify(code) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp/verify", "post");
        await this.exec(o, {
            body: { code },
        });
    }
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     * @returns An empty response
     */
    async userTotpDelete(mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp", "delete");
        const deleteTotpFn = async (headers) => {
            return await this.exec(o, {
                headers,
            });
        };
        return await response_1.CubeSignerResponse.create(this.env, deleteTotpFn, mfaReceipt);
    }
    /**
     * Initiate adding a new FIDO device. MFA may be required.  This returns a {@link AddFidoChallenge}
     * that must be answered with {@link AddFidoChallenge.answer} or {@link userFidoRegisterComplete}
     * (after MFA approvals).
     *
     * @param name The name of the new device.
     * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     * @returns A challenge that must be answered in order to complete FIDO registration.
     */
    async userFidoRegisterInit(name, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/fido", "post");
        const addFidoFn = async (headers) => {
            const data = await this.exec(o, {
                headers,
                body: { name },
            });
            return (0, response_1.mapResponse)(data, (c) => new mfa_1.AddFidoChallenge(this, c));
        };
        return await response_1.CubeSignerResponse.create(this.env, addFidoFn, mfaReceipt);
    }
    /**
     * Complete a previously initiated (via {@link userFidoRegisterInit}) request to add a new FIDO device.
     *
     * Instead of calling this method directly, prefer {@link AddFidoChallenge.answer} or
     * {@link AddFidoChallenge.createCredentialAndAnswer}.
     *
     * @param challengeId The ID of the challenge returned by the remote end.
     * @param credential The answer to the challenge.
     * @returns An empty response
     */
    async userFidoRegisterComplete(challengeId, credential) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/fido", "patch");
        return this.exec(o, {
            body: {
                challenge_id: challengeId,
                credential,
            },
        });
    }
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * @param fidoId The ID of the desired FIDO key
     * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     * @returns An empty response
     */
    async userFidoDelete(fidoId, mfaReceipt) {
        const deleteFidoFn = (headers) => {
            const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/fido/{fido_id}", "delete");
            return this.exec(o, {
                headers,
                params: { path: { fido_id: fidoId } },
            });
        };
        return await response_1.CubeSignerResponse.create(this.env, deleteFidoFn, mfaReceipt);
    }
    // #endregion
    // #region ORGS: orgGet, orgUpdate, orgUpdateUserMembership, orgCreateOrg, orgQueryMetrics
    /**
     * Obtain information about an org
     *
     * @param orgId The org to get info for
     * @returns Information about the organization.
     */
    async orgGet(orgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}", "get");
        return this.exec(o, {
            params: {
                path: { org_id: orgId ?? this.orgId },
            },
        });
    }
    /**
     * Update the org.
     *
     * @param request The JSON request to send to the API server.
     * @returns Updated org information.
     */
    async orgUpdate(request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}", "patch");
        return this.exec(o, { body: request });
    }
    /**
     * Update user's membership in this org.
     *
     * @param userId The ID of the user whose membership to update.
     * @param req The update request
     * @returns Updated user membership
     */
    async orgUpdateUserMembership(userId, req) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/{user_id}/membership", "patch");
        return this.exec(o, {
            params: { path: { user_id: userId } },
            body: req,
        }).then(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo));
    }
    /**
     * Create a new organization. The new org is a child of the
     * current org and inherits its key-export policy. The new org
     * is created with one owner, the caller of this API.
     *
     * @param body The details of the request
     * @returns The new organization information
     */
    async orgCreateOrg(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/orgs", "post");
        return await this.exec(o, { body });
    }
    /**
     * Query org metrics.
     *
     * @param body The query
     * @param page Pagination options. Default to fetching the entire result set.
     * @returns Computed org metrics statistics.
     */
    orgQueryMetrics(body, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/metrics", "post");
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { body, params: { query } }), (r) => r.last_evaluated_key, (acc, next) => {
            if (!acc)
                return next;
            acc.raw_data ??= [];
            acc.raw_data.push(...(next.raw_data ?? []));
            return acc;
        });
    }
    // #endregion
    // #region ORG USERS: orgUserInvite, orgUserDelete, orgUsersList, orgUserGet, orgUserCreateOidc, orgUserDeleteOidc
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @param email Email of the user
     * @param name The full name of the user
     * @param role Optional role. Defaults to "alien".
     * @param skipEmail Optionally skip sending the invite email.
     */
    async orgUserInvite(email, name, role, skipEmail) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/invite", "post");
        await this.exec(o, {
            body: {
                email,
                name,
                role,
                skip_email: !!skipEmail,
            },
        });
    }
    /**
     * Remove the user from the org.
     *
     * @param userId The ID of the user to remove.
     * @returns An empty response
     */
    async orgUserDelete(userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/{user_id}", "delete");
        return this.exec(o, {
            params: {
                path: {
                    user_id: userId,
                },
            },
        });
    }
    /**
     * List users in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the users in the org.
     */
    orgUsersList(page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query } }), (r) => r.users.map(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo)), (r) => r.last_evaluated_key);
    }
    /**
     * Get user by id.
     *
     * @param userId The id of the user to get.
     * @returns Org user.
     */
    async orgUserGet(userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/{user_id}", "get");
        const resp = await this.exec(o, {
            params: {
                path: {
                    user_id: userId,
                },
            },
        });
        return __classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo).call(_a, resp);
    }
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     *
     * @param identityOrProof The identity or identity proof of the OIDC user
     * @param email Email of the OIDC user
     * @param opts Additional options for new OIDC users
     * @returns User id of the new user
     */
    async orgUserCreateOidc(identityOrProof, email, opts = {}) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users", "post");
        const identityOrProofFields = "id" in identityOrProof ? { proof: identityOrProof } : { identity: identityOrProof };
        const { user_id } = await this.exec(o, {
            body: {
                role: opts.memberRole ?? "Alien",
                email,
                name: opts.name,
                mfa_policy: opts.mfaPolicy,
                ...identityOrProofFields,
            },
        });
        return user_id;
    }
    /**
     * Delete an existing OIDC user.
     *
     * @param identity The identity of the OIDC user
     * @returns An empty response
     */
    async orgUserDeleteOidc(identity) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/oidc", "delete");
        return this.exec(o, {
            body: identity,
        });
    }
    // #endregion
    // #region KEYS: keyGet, keyUpdate, keyDelete, keysCreate, keysDerive, keysList, keyHistory
    /**
     * Get a key by its id.
     *
     * @param keyId The id of the key to get.
     * @returns The key information.
     */
    async keyGet(keyId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "get");
        return this.exec(o, {
            params: { path: { key_id: keyId } },
        });
    }
    /**
     * Get a key by its type and material id.
     *
     * @param keyType The key type.
     * @param materialId The material id of the key to get.
     * @returns The key information.
     */
    async keyGetByMaterialId(keyType, materialId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_type}/{material_id}", "get");
        return this.exec(o, {
            params: { path: { key_type: keyType, material_id: materialId } },
        });
    }
    /**
     * List all roles a key is in.
     *
     * @param keyId The id of the key to get.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the roles a key is in.
     */
    keyRolesList(keyId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}/roles", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
            params: {
                path: { key_id: keyId },
                query,
            },
        }), (r) => r.roles, (r) => r.last_evaluated_key);
    }
    /**
     * Update key.
     *
     * @param keyId The ID of the key to update.
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The JSON response from the API server.
     */
    async keyUpdate(keyId, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "patch");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { key_id: keyId } },
            body: request,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Deletes a key.
     *
     * @param keyId Key id
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    async keyDelete(keyId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "delete");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { key_id: keyId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Create new signing keys.
     *
     * @param keyType The type of key to create.
     * @param count The number of keys to create.
     * @param ownerId The owner of the keys. Defaults to the session's user.
     * @param props Additional key properties
     * @returns The new keys.
     */
    async keysCreate(keyType, count, ownerId, props) {
        const chain_id = 0; // not used anymore
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys", "post");
        const { keys } = await this.exec(o, {
            body: {
                count,
                chain_id,
                key_type: keyType,
                ...props,
                owner: props?.owner ?? ownerId,
                policy: props?.policy,
            },
        });
        return keys;
    }
    /**
     * Derive a set of keys of a specified type using a supplied derivation path and an existing long-lived mnemonic.
     *
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param keyType The type of key to create.
     * @param derivationPaths Derivation paths from which to derive new keys.
     * @param mnemonicId material_id of mnemonic key used to derive the new key.
     * @param props Additional options for derivation.
     *
     * @returns The newly derived keys.
     */
    async keysDerive(keyType, derivationPaths, mnemonicId, props) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/derive_key", "put");
        const { keys } = await this.exec(o, {
            body: {
                derivation_path: derivationPaths,
                mnemonic_id: mnemonicId,
                key_type: keyType,
                ...props,
                policy: props?.policy,
            },
        });
        return keys;
    }
    /**
     * Use either a new or existing mnemonic to derive keys of one or more
     * specified types via specified derivation paths.
     *
     * @param keyTypesAndDerivationPaths A list of objects specifying the keys to be derived
     * @param props Additional options for derivation.
     *
     * @returns The newly derived keys.
     */
    async keysDeriveMulti(keyTypesAndDerivationPaths, props) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/derive_keys", "put");
        const { keys } = await this.exec(o, {
            body: {
                key_types_and_derivation_paths: keyTypesAndDerivationPaths,
                ...props,
                policy: props?.policy,
            },
        });
        return keys;
    }
    /**
     * List all accessible keys in the org.
     *
     * @param type Optional key type to filter list for.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @param owner Optional key owner to filter list for.
     * @param search Optionally search by key's material ID and metadata
     * @returns Paginator for iterating over keys.
     */
    keysList(type, page, owner, search) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { key_type: type, key_owner: owner, search, ...query } } }), (r) => r.keys, (r) => r.last_evaluated_key);
    }
    /**
     * List recent historical key transactions.
     *
     * @param keyId The key id.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over historical transactions.
     */
    keyHistory(keyId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}/tx", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), () => this.exec(o, { params: { path: { key_id: keyId } } }), (r) => r.txs, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region ORG CONTACTS: contactCreate, contactGet, contactsList, contactDelete, contactUpdate
    /**
     * Creates a new contact in the organization-wide address book. The
     * user making the request is the owner of the contact, giving them edit access
     * to the contact along with the org owners.
     *
     * @param name The name for the new contact.
     * @param addresses The addresses associated with the contact.
     * @param metadata Metadata associated with the contact. Intended for use as a description.
     * @param editPolicy The edit policy for the contact, determining when and who can edit this contact.
     * @returns The newly created contact.
     */
    async contactCreate(name, addresses, metadata, editPolicy) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts", "post");
        return this.exec(o, {
            body: {
                name,
                addresses: addresses ?? {},
                metadata,
                edit_policy: editPolicy,
            },
        });
    }
    /**
     * Returns the properties of a Contact.
     *
     * @param contactId The id of the contact you want to retrieve.
     * @returns The contact.
     */
    async contactGet(contactId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts/{contact_id}", "get");
        return this.exec(o, {
            params: { path: { contact_id: contactId } },
        });
    }
    /**
     * Lists contacts in the org.
     *
     * @param page The optional pagination options. Defaults to getting every contact.
     * @returns Paginator for iterating over the contacts in the org.
     */
    contactsList(page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query } }), (r) => r.contacts, (r) => r.last_evaluated_key);
    }
    /**
     * Delete a contact, specified by its ID.
     *
     * Only the contact owner and org owners are allowed to delete contacts.
     * Additionally, the contact's edit policy (if set) must permit the deletion.
     *
     * @param contactId The contact to delete.
     * @returns An empty response.
     */
    async contactDelete(contactId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts/{contact_id}", "delete");
        return this.exec(o, {
            params: { path: { contact_id: contactId } },
        });
    }
    /**
     * Updates an existing contact in the organization-wide address book. Only
     * the contact owner or an org owner can update contacts.
     *
     * Updates will overwrite the existing value of the field.
     *
     * @param contactId The contact to update.
     * @param request The fields to update.
     * @returns The updated contact.
     */
    async contactUpdate(contactId, request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts/{contact_id}", "patch");
        return this.exec(o, {
            params: { path: { contact_id: contactId } },
            body: request,
        });
    }
    // #endregion
    // #region ROLES: roleCreate, roleRead, roleUpdate, roleDelete, rolesList
    /**
     * Create a new role.
     *
     * @param name The optional name of the role.
     * @returns The ID of the new role.
     */
    async roleCreate(name) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles", "post");
        const data = await this.exec(o, {
            body: name ? { name } : undefined,
        });
        return data.role_id;
    }
    /**
     * Get a role by its id (or name).
     *
     * @param roleId The id of the role to get.
     * @returns The role.
     */
    async roleGet(roleId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "get");
        return this.exec(o, {
            params: { path: { role_id: roleId } },
        });
    }
    /**
     * Update a role.
     *
     * @param roleId The ID of the role to update.
     * @param request The update request.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The updated role information.
     */
    async roleUpdate(roleId, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "patch");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId } },
            body: request,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Delete a role by its ID.
     *
     * @param roleId The ID of the role to delete.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    async roleDelete(roleId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "delete");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * List all roles in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over roles.
     */
    rolesList(page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query } }), (r) => r.roles, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region ROLE KEYS: roleKeysAdd, roleKeysDelete, roleKeysList
    /**
     * Add existing keys to an existing role.
     *
     * @param roleId The ID of the role
     * @param keyIds The IDs of the keys to add to the role.
     * @param policy The optional policy to apply to each key.
     */
    async roleKeysAdd(roleId, keyIds, policy) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/add_keys", "put");
        await this.exec(o, {
            params: { path: { role_id: roleId } },
            body: {
                key_ids: keyIds,
                policy,
            },
        });
    }
    /**
     * Remove an existing key from an existing role.
     *
     * @param roleId The ID of the role
     * @param keyId The ID of the key to remove from the role
     */
    async roleKeysRemove(roleId, keyId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", "delete");
        await this.exec(o, {
            params: { path: { role_id: roleId, key_id: keyId } },
        });
    }
    /**
     * List all keys in a role.
     *
     * @param roleId The ID of the role whose keys to retrieve.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the keys in the role.
     */
    roleKeysList(roleId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/keys", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
            params: {
                path: { role_id: roleId },
                query,
            },
        }), (r) => r.keys, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region ROLE USERS: roleUserAdd, roleUserRemove, roleUsersList
    /**
     * Add an existing user to an existing role.
     *
     * @param roleId The ID of the role.
     * @param userId The ID of the user to add to the role.
     */
    async roleUserAdd(roleId, userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", "put");
        await this.exec(o, {
            params: { path: { role_id: roleId, user_id: userId } },
        });
    }
    /**
     * Remove an existing user from an existing role.
     *
     * @param roleId The ID of the role.
     * @param userId The ID of the user to remove from the role.
     */
    async roleUserRemove(roleId, userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/users/{user_id}", "delete");
        await this.exec(o, {
            params: { path: { role_id: roleId, user_id: userId } },
        });
    }
    /**
     * List all users in a role.
     *
     * @param roleId The ID of the role whose users to retrieve.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the users in the role.
     */
    roleUsersList(roleId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/users", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query, path: { role_id: roleId } } }), (r) => r.users, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region SESSIONS: session(Create|CreateForRole|Refresh|Revoke|List|KeysList)
    /**
     * Create new user session (management and/or signing). The lifetime of
     * the new session is silently truncated to that of the current session.
     *
     * @param purpose The purpose of the session
     * @param scopes Session scopes.
     * @param lifetimes Lifetime settings
     * @returns New signer session info.
     */
    async sessionCreate(purpose, scopes, lifetimes) {
        lifetimes ??= defaultSignerSessionLifetime;
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "post");
        const data = await this.exec(o, {
            body: {
                purpose,
                scopes,
                auth_lifetime: lifetimes.auth,
                refresh_lifetime: lifetimes.refresh,
                session_lifetime: lifetimes.session,
                grace_lifetime: lifetimes.grace,
            },
        });
        return (0, base_client_1.signerSessionFromSessionInfo)(this.sessionMeta, data, {
            purpose,
        });
    }
    /**
     * Create new user session (management and/or signing) whose lifetime potentially
     * extends the lifetime of the current session.  MFA is always required.
     *
     * @param purpose The purpose of the session
     * @param scopes Session scopes.
     * @param lifetime Lifetime settings
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns New signer session info.
     */
    async sessionCreateExtended(purpose, scopes, lifetime, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "post");
        const requestFn = async (headers) => {
            const resp = await this.exec(o, {
                headers,
                body: {
                    purpose,
                    scopes,
                    extend_lifetimes: true,
                    auth_lifetime: lifetime.auth,
                    refresh_lifetime: lifetime.refresh,
                    session_lifetime: lifetime.session,
                    grace_lifetime: lifetime.grace,
                },
            });
            return (0, response_1.mapResponse)(resp, (sessionInfo) => (0, base_client_1.signerSessionFromSessionInfo)(this.sessionMeta, sessionInfo, {
                purpose,
            }));
        };
        return await response_1.CubeSignerResponse.create(this.env, requestFn, mfaReceipt);
    }
    /**
     * Create a new signer session for a given role.
     *
     * @param roleId Role ID
     * @param purpose The purpose of the session
     * @param scopes Session scopes. Not all scopes are valid for a role.
     * @param lifetimes Lifetime settings
     * @returns New signer session info.
     */
    async sessionCreateForRole(roleId, purpose, scopes, lifetimes) {
        lifetimes ??= defaultSignerSessionLifetime;
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/tokens", "post");
        const data = await this.exec(o, {
            params: { path: { role_id: roleId } },
            body: {
                purpose,
                scopes,
                auth_lifetime: lifetimes.auth,
                refresh_lifetime: lifetimes.refresh,
                session_lifetime: lifetimes.session,
                grace_lifetime: lifetimes.grace,
            },
        });
        return (0, base_client_1.signerSessionFromSessionInfo)(this.sessionMeta, data, {
            role_id: roleId,
            purpose,
        });
    }
    /**
     * Revoke a session.
     *
     * @param sessionId The ID of the session to revoke. This session by default
     */
    async sessionRevoke(sessionId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session/{session_id}", "delete");
        await this.exec(o, {
            params: { path: { session_id: sessionId ?? "self" } },
        });
    }
    /**
     * Revoke all sessions.
     *
     * @param selector Which sessions to revoke. If not defined, all the current user's sessions will be revoked.
     */
    async sessionRevokeAll(selector) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "delete");
        const query = typeof selector === "string" ? { role: selector } : selector;
        await this.exec(o, {
            params: { query },
        });
    }
    /**
     * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
     *
     * @param selector If set, limit to sessions for a specified user or a role.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Signer sessions for this role.
     */
    sessionsList(selector, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "get");
        const selectorQuery = typeof selector === "string" ? { role: selector } : selector;
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { ...selectorQuery, ...query } } }), (r) => r.sessions, (r) => r.last_evaluated_key);
    }
    /**
     * Returns the list of keys that this session has access to.
     *
     * @returns The list of keys.
     */
    async sessionKeysList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/token/keys", "get");
        const { keys } = await this.exec(o, {});
        return keys;
    }
    // #endregion
    // #region IDENTITY: identityProve, identityVerify, identityAdd, identityRemove, identityList
    /**
     * Obtain proof of authentication using the current CubeSigner session.
     *
     * @returns Proof of authentication
     */
    async identityProve() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/prove", "post");
        return this.exec(o, {});
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param proof The proof of authentication.
     * @throws An error if proof is invalid
     */
    async identityVerify(proof) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/verify", "post");
        await this.exec(o, {
            body: proof,
        });
    }
    /**
     * Associates an OIDC identity with the current user's account.
     *
     * @param body The request body, containing an OIDC token to prove the identity ownership.
     */
    async identityAdd(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "post");
        await this.exec(o, { body });
    }
    /**
     * Removes an OIDC identity from the current user's account.
     *
     * @param body The identity to remove.
     */
    async identityRemove(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "delete");
        await this.exec(o, { body });
    }
    /**
     * Lists associated OIDC identities with the current user.
     *
     * @returns Associated identities
     */
    async identityList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "get");
        return await this.exec(o, {});
    }
    // #endregion
    // #region MFA: mfaGet, mfaList, mfaApprove, mfaList, mfaApprove, mfaApproveTotp, mfaApproveFido(Init|Complete), mfaVoteEmail(Init|Complete)
    /**
     * Retrieves existing MFA request.
     *
     * @param mfaId MFA request ID
     * @returns MFA request information
     */
    async mfaGet(mfaId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}", "get");
        return this.exec(o, {
            params: { path: { mfa_id: mfaId } },
        });
    }
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @returns The MFA requests.
     */
    async mfaList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa", "get");
        const { mfa_requests } = await this.exec(o, {});
        return mfa_requests;
    }
    /**
     * Approve or reject a pending MFA request using the current session.
     *
     * @param mfaId The id of the MFA request
     * @param mfaVote Approve or reject the MFA request
     * @returns The result of the MFA request
     */
    async mfaVoteCs(mfaId, mfaVote) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}", "patch");
        return this.exec(o, {
            params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
        });
    }
    /**
     * Approve or reject a pending MFA request using TOTP.
     *
     * @param mfaId The ID of the MFA request
     * @param code The TOTP code
     * @param mfaVote Approve or reject the MFA request
     * @returns The current status of the MFA request
     */
    async mfaVoteTotp(mfaId, code, mfaVote) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/totp", "patch");
        return this.exec(o, {
            params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
            body: { code },
        });
    }
    /**
     * Initiate approval of an existing MFA request using FIDO. A challenge is
     * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaVoteFidoComplete}.
     *
     * @param mfaId The MFA request ID.
     * @returns A challenge that needs to be answered to complete the approval.
     */
    async mfaFidoInit(mfaId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/fido", "post");
        const challenge = await this.exec(o, {
            params: { path: { mfa_id: mfaId } },
        });
        return new mfa_1.MfaFidoChallenge(this, mfaId, challenge);
    }
    /**
     * Complete a previously initiated (via {@link mfaFidoInit}) MFA request using FIDO.
     *
     * Instead of calling this method directly, prefer {@link MfaFidoChallenge.answer} or
     * {@link MfaFidoChallenge.createCredentialAndAnswer}.
     *
     * @param mfaId The MFA request ID
     * @param mfaVote Approve or reject the MFA request
     * @param challengeId The ID of the challenge issued by {@link mfaFidoInit}
     * @param credential The answer to the challenge
     * @returns The current status of the MFA request.
     */
    async mfaVoteFidoComplete(mfaId, mfaVote, challengeId, credential) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/fido", "patch");
        return await this.exec(o, {
            params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
            body: {
                challenge_id: challengeId,
                credential,
            },
        });
    }
    /**
     * Initiate MFA approval via email OTP.
     *
     * @param mfaId The MFA request ID
     * @param mfaVote Approve or reject the MFA request
     * @returns A challenge that needs to be answered to complete the approval.
     */
    async mfaVoteEmailInit(mfaId, mfaVote) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/email", "post");
        const challenge = await this.exec(o, {
            params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
        });
        return new mfa_1.MfaEmailChallenge(this, mfaId, challenge);
    }
    /**
     * Complete a previously initiated (via {@link mfaVoteEmailInit}) MFA vote request using email OTP.
     *
     * Instead of calling this method directly, prefer {@link MfaEmailChallenge.answer} or
     * {@link MfaFidoChallenge.createCredentialAndAnswer}.
     *
     * @param mfaId The MFA request ID
     * @param partialToken The partial token returned by {@link mfaVoteEmailInit}
     * @param signature The one-time code (signature in this case) sent via email
     * @returns The current status of the MFA request.
     */
    async mfaVoteEmailComplete(mfaId, partialToken, signature) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/email", "patch");
        return await this.exec(o, {
            params: { path: { mfa_id: mfaId } },
            body: { token: `${partialToken}${signature}` },
        });
    }
    // #endregion
    // #region SIGN: signEvm, signEth2, signStake, signUnstake, signAva, signSerializedAva, signBlob, signBtc, signTaproot, signSolana, signEots, eotsCreateNonce, signMmi, signSui
    /**
     * Sign an EVM transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature (or MFA approval request).
     */
    async signEvm(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth1/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign EIP-191 typed data.
     *
     * This requires the key to have a '"AllowEip191Signing"' {@link KeyPolicy}.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature (or MFA approval request).
     */
    async signEip191(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/evm/eip191/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign EIP-712 typed data.
     *
     * This requires the key to have a '"AllowEip712Signing"' {@link KeyPolicy}.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Signature (or MFA approval request).
     */
    async signEip712(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/evm/eip712/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature
     */
    async signEth2(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth2/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    async signStake(req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth2/stake", "post");
        const sign = async (headers) => this.exec(o, {
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, sign, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    async signUnstake(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth2/unstake/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param tx Avalanche message (transaction) to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signAva(key, tx, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/ava/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: {
                tx: tx,
            },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a serialized Avalanche C-, P-, or X-chain message. See [the Avalanche
     * documentation](https://docs.avax.network/reference/standards/serialization-primitives)
     * for the specification of the serialization format.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param avaChain Avalanche chain
     * @param tx Hex encoded transaction
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signSerializedAva(key, avaChain, tx, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/ava/sign/{ava_chain}/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { ava_chain: avaChain, pubkey } },
            body: {
                tx,
            },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a raw blob.
     *
     * This requires the key to have a '"AllowRawBlobSigning"' {@link KeyPolicy}. This is because
     * signing arbitrary messages is, in general, dangerous (and you should instead
     * prefer typed end-points as used by, for example, {@link signEvm}). For Secp256k1 keys,
     * for example, you **must** call this function with a message that is 32 bytes long and
     * the output of a secure hash function.
     *
     * This function returns signatures serialized as;
     *
     * - ECDSA signatures are serialized as big-endian r and s plus recovery-id
     *    byte v, which can in general take any of the values 0, 1, 2, or 3.
     *
     * - EdDSA signatures are serialized in the standard format.
     *
     * - BLS signatures are not supported on the blob-sign endpoint.
     *
     * @param key The key to sign with (either {@link Key} or its ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBlob(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/blob/sign/{key_id}", "post");
        const key_id = typeof key === "string" ? key : key.id;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { key_id } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Bitcoin transaction input.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBtc(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Bitcoin BIP-137 message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBtcMessage(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/message/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Taproot transaction input.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signTaproot(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/taproot/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a PSBT.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signPsbt(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/psbt/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Generate an Extractable One-Time Signature
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signEots(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/eots/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Generates a set of Babylon EOTS nonces for a specified chain-id, starting at a specified block height.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What and how many nonces to create
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async eotsCreateNonce(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/eots/nonces/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Babylon staking transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID). For a deposit, this can be either a Segwit or a Taproot key. For any other request type, this just be a Taproot key.
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBabylonStakingTxn(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/staking/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Babylon staking registration request.
     *
     * @param key The Taproot key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBabylonRegistration(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/registration/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Solana message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signSolana(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/solana/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a MMI pending message.
     *
     * @param message the message info.
     * @param mfaReceipt optional MFA receipt(s).
     * @returns the updated message.
     */
    async signMmi(message, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/sign", "post");
        const signFn = async (headers) => this.exec(o, {
            params: { path: { msg_id: message.id } },
            headers,
            body: message,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a SUI transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param request What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signSui(key, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/sui/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            headers,
            body: request,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    // #endregion
    // #region USER EXPORT: userExport(Init,Complete,List,Delete)
    /**
     * List outstanding user-export requests.
     *
     * @param keyId Optional key ID. If supplied, list the outstanding request (if any) only for the specified key; otherwise, list all outstanding requests for the specified user.
     * @param userId Optional user ID. If omtted, uses the current user's ID. Only org owners can list user-export requests for users other than themselves.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the result set.
     */
    userExportList(keyId, userId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
            params: {
                query: {
                    user_id: userId,
                    key_id: keyId,
                    ...query,
                },
            },
        }), (r) => r.export_requests, (r) => r.last_evaluated_key);
    }
    /**
     * Delete an outstanding user-export request.
     *
     * @param keyId The key-id corresponding to the user-export request to delete.
     * @param userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
     */
    async userExportDelete(keyId, userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "delete");
        await this.exec(o, {
            params: {
                query: {
                    key_id: keyId,
                    user_id: userId,
                },
            },
        });
    }
    /**
     * Initiate a user-export request.
     *
     * @param keyId The key-id for which to initiate an export.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    async userExportInit(keyId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "post");
        const initFn = async (headers) => {
            return this.exec(o, {
                body: { key_id: keyId },
                headers,
            });
        };
        return await response_1.CubeSignerResponse.create(this.env, initFn, mfaReceipt);
    }
    /**
     * Complete a user-export request.
     *
     * @param keyId The key-id for which to initiate an export.
     * @param publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    async userExportComplete(keyId, publicKey, mfaReceipt) {
        // base64-encode the public key
        const subtle = await (0, user_export_1.loadSubtleCrypto)();
        const publicKeyB64 = (0, util_1.encodeToBase64)(Buffer.from(await subtle.exportKey("raw", publicKey)));
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "patch");
        // make the request
        const completeFn = async (headers) => this.exec(o, {
            body: {
                key_id: keyId,
                public_key: publicKeyB64,
            },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, completeFn, mfaReceipt);
    }
    // #endregion
    // #region KEY IMPORT: createKeyImportKey, importKeys
    /**
     * Request a fresh key-import key.
     *
     * @returns A fresh key-import key
     */
    async createKeyImportKey() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/import_key", "get");
        return await this.exec(o, {});
    }
    /**
     * Import one or more keys. To use this functionality, you must first create an
     * encrypted key-import request using the `@cubist-labs/cubesigner-sdk-key-import`
     * library. See that library's documentation for more info.
     *
     * @param body An encrypted key-import request.
     * @returns The newly imported keys.
     */
    async importKeys(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/import_key", "put");
        const { keys } = await this.exec(o, { body });
        return keys;
    }
    // #endregion
    // #region MISC: heartbeat()
    /**
     * Send a heartbeat / upcheck request.
     */
    async heartbeat() {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/cube3signer/heartbeat", "post");
        await this.exec(o, {});
    }
    // #endregion
    // #region MMI: mmi(), mmiList()
    /**
     * Call the MMI JSON RPC endpoint.
     *
     * @param method The name of the method to call.
     * @param params The list of method parameters.
     * @returns the return value of the method.
     * @internal
     */
    async mmi(method, params) {
        const o = (0, fetch_1.op)("/v0/mmi/v3/json-rpc", "post");
        const body = {
            id: 1,
            jsonrpc: "2.0",
            method: method,
            params: params,
        };
        const func = async (headers) => this.exec(o, { headers, body });
        const resp = (await response_1.CubeSignerResponse.create(this.env, func)).data();
        return resp;
    }
    /**
     * List pending MMI messages.
     *
     * @returns The list of pending MMI messages.
     */
    async mmiList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages", "get");
        const { pending_messages } = await this.exec(o, {});
        return pending_messages;
    }
    /**
     * Get a pending MMI message by its ID.
     *
     * @param msgId The ID of the pending message.
     * @returns The pending MMI message.
     */
    async mmiGet(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "get");
        return await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    /**
     * Delete the MMI message with the given ID.
     *
     * @param msgId the ID of the MMI message.
     */
    async mmiDelete(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "delete");
        await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    /**
     * Reject the MMI message with the given ID.
     *
     * @param msgId the ID of the MMI message.
     * @returns The message with updated information
     */
    async mmiReject(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/reject", "post");
        return await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    // #endregion
    /**
     * Returns public org information.
     *
     * @param env The environment to log into
     * @param orgId The org to log into
     * @returns Public org information
     */
    static async publicOrgInfo(env, orgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/info", "get");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
        })).then(fetch_1.assertOk);
    }
    /**
     * Sends an email to the given address with a list of orgs the user is a member of.
     *
     * @param env The environment to use
     * @param email The user's email
     * @returns Empty response
     */
    static async emailMyOrgs(env, email) {
        const o = (0, fetch_1.op)("/v0/email/orgs", "get");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { query: { email } },
        })).then(fetch_1.assertOk);
    }
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     *
     * @param env The environment to log into
     * @param orgId The org to log into.
     * @param token The OIDC token to exchange
     * @param scopes The scopes for the new session
     * @param lifetimes Lifetimes of the new session.
     * @param mfaReceipt Optional MFA receipt(s)
     * @param purpose Optional session description.
     * @returns The session data.
     */
    static async oidcSessionCreate(env, orgId, token, scopes, lifetimes, mfaReceipt, purpose) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc", "post");
        const loginFn = async (headers) => {
            const data = await (0, retry_1.retryOn5XX)(() => o({
                baseUrl: env.SignerApiRoot,
                params: { path: { org_id: orgId } },
                headers: {
                    ...headers,
                    Authorization: token,
                },
                body: {
                    scopes,
                    purpose,
                    tokens: lifetimes,
                },
            })).then(fetch_1.assertOk);
            return (0, response_1.mapResponse)(data, (sessionInfo) => {
                return {
                    env: {
                        ["Dev-CubeSignerStack"]: env,
                    },
                    org_id: orgId,
                    token: sessionInfo.token,
                    refresh_token: sessionInfo.refresh_token,
                    session_exp: sessionInfo.expiration,
                    purpose: "sign in via oidc",
                    session_info: sessionInfo.session_info,
                };
            });
        };
        return await response_1.CubeSignerResponse.create(env, loginFn, mfaReceipt);
    }
    /**
     * Accept an invitation to join a CubeSigner org.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     */
    static async idpAcceptInvite(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/invitation/accept", "post");
        await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for authenticating with email/password.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     * @returns Returns an OIDC token which can be used
     *   to log in via OIDC (see {@link oidcSessionCreate}).
     */
    static async idpAuthenticate(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/authenticate", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for requesting password reset.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     * @returns Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
     */
    static async idpPasswordResetRequest(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/password_reset", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for confirming a previously initiated password reset request.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param partialToken The partial token returned by {@link passwordResetRequest}
     * @param signature The one-time code (signature in this case) sent via email
     * @param newPassword The new password
     */
    static async idpPasswordResetConfirm(env, orgId, partialToken, signature, newPassword) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/password_reset", "patch");
        await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body: {
                token: `${partialToken}${signature}`,
                new_password: newPassword,
            },
        })).then(fetch_1.assertOk);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param env The environment to log into
     * @param orgId The org id in which to generate proof
     * @param token The oidc token
     * @returns Proof of authentication
     */
    static async identityProveOidc(env, orgId, token) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/prove/oidc", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            headers: {
                Authorization: token,
            },
        })).then(fetch_1.assertOk);
    }
    /**
     * Obtain all organizations a user is a member of
     *
     * @param env The environment to log into
     * @param token The oidc token identifying the user
     * @returns The organization the user belongs to
     */
    static async userOrgs(env, token) {
        const o = (0, fetch_1.op)("/v0/user/orgs", "get");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            headers: {
                Authorization: token,
            },
        })).then(fetch_1.assertOk);
    }
}
exports.ApiClient = ApiClient;
_a = ApiClient, _ApiClient_processUserInfo = function _ApiClient_processUserInfo(info) {
    if (info.email === EMAIL_NOT_FOUND) {
        info.email = null;
    }
    return info;
}, _ApiClient_processUserInOrgInfo = function _ApiClient_processUserInOrgInfo(info) {
    if (info.email === EMAIL_NOT_FOUND) {
        info.email = null;
    }
    return info;
};
const defaultSignerSessionLifetime = {
    session: 604800, // 1 week
    auth: 300, // 5 min
    refresh: 86400, // 1 day
    grace: 30, // seconds
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpX2NsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYXBpX2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFzREEsa0NBQXlDO0FBQ3pDLGdDQUE4RjtBQUM5RiwwQ0FBOEQ7QUFHOUQsNENBQStDO0FBRS9DLGdEQUFrRDtBQXlEbEQsb0NBQXdDO0FBQ3hDLCtDQUF5RTtBQUN6RSxvQ0FBc0M7QUFFdEM7O0dBRUc7QUFDSCxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztBQXFCMUM7O0dBRUc7QUFDSCxNQUFhLFNBQVUsU0FBUSx3QkFBVTtJQUN2Qzs7Ozs7O09BTUc7SUFDSCxhQUFhLENBQUMsV0FBbUI7UUFDL0IsT0FBTyxJQUFJLEVBQVMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVELDBIQUEwSDtJQUUxSDs7T0FFRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsMEJBQTBCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsdUJBQUEsRUFBUyxzQ0FBaUIsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7T0FXRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQzNCLEdBQWlCLEVBQ2pCLEtBQWEsRUFDYixLQUFhO1FBRWIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsaUNBQWlDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFeEQsT0FBTyxNQUFNLElBQUEsa0JBQVUsRUFBQyxHQUFHLEVBQUUsQ0FDM0IsQ0FBQyxDQUFDO1lBQ0EsT0FBTyxFQUFFLEdBQUcsQ0FBQyxhQUFhO1lBQzFC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QUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0gsTUFBTSw0QkFBNEIsR0FBb0I7SUFDcEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTO0lBQzFCLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUTtJQUNuQixPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVE7SUFDeEIsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVO0NBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIENyZWF0ZU9pZGNVc2VyT3B0aW9ucyxcbiAgSWRlbnRpdHlQcm9vZixcbiAgS2V5SW5Sb2xlSW5mbyxcbiAgS2V5SW5mbyxcbiAgT2lkY0lkZW50aXR5LFxuICBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICBSb2xlSW5mbyxcbiAgVXBkYXRlS2V5UmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVzcG9uc2UsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxuICBVc2VySW5PcmdJbmZvLFxuICBVc2VySW5Sb2xlSW5mbyxcbiAgR2V0VXNlcnNJbk9yZ1Jlc3BvbnNlLFxuICBVc2VySW5mbyxcbiAgU2Vzc2lvbkluZm8sXG4gIE9yZ0luZm8sXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRWlwMTkxT3I3MTJTaWduUmVzcG9uc2UsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVzcG9uc2UsXG4gIEV0aDJTaWduUmVxdWVzdCxcbiAgRXRoMlNpZ25SZXNwb25zZSxcbiAgRXRoMlN0YWtlUmVxdWVzdCxcbiAgRXRoMlN0YWtlUmVzcG9uc2UsXG4gIEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgRXRoMlVuc3Rha2VSZXNwb25zZSxcbiAgQmxvYlNpZ25SZXF1ZXN0LFxuICBCbG9iU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXF1ZXN0LFxuICBCdGNNZXNzYWdlU2lnblJlc3BvbnNlLFxuICBCdGNNZXNzYWdlU2lnblJlcXVlc3QsXG4gIFBzYnRTaWduUmVxdWVzdCxcbiAgUHNidFNpZ25SZXNwb25zZSxcbiAgU29sYW5hU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlc3BvbnNlLFxuICBBdmFTaWduUmVxdWVzdCxcbiAgQXZhU2VyaWFsaXplZFR4U2lnblJlcXVlc3QsXG4gIEF2YVR4LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgTWZhVm90ZSxcbiAgTWVtYmVyUm9sZSxcbiAgVXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2UsXG4gIFVzZXJFeHBvcnRJbml0UmVzcG9uc2UsXG4gIFVzZXJFeHBvcnRMaXN0UmVzcG9uc2UsXG4gIEVtcHR5LFxuICBVc2VyT3Jnc1Jlc3BvbnNlLFxuICBDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZSxcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbn0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgZW5jb2RlVG9CYXNlNjQgfSBmcm9tIFwiLi4vdXRpbFwiO1xuaW1wb3J0IHsgQWRkRmlkb0NoYWxsZW5nZSwgTWZhRmlkb0NoYWxsZW5nZSwgTWZhRW1haWxDaGFsbGVuZ2UsIFRvdHBDaGFsbGVuZ2UgfSBmcm9tIFwiLi4vbWZhXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyUmVzcG9uc2UsIG1hcFJlc3BvbnNlIH0gZnJvbSBcIi4uL3Jlc3BvbnNlXCI7XG5pbXBvcnQgdHlwZSB7IEtleSwgS2V5VHlwZSB9IGZyb20gXCIuLi9rZXlcIjtcbmltcG9ydCB0eXBlIHsgUGFnZU9wdHMgfSBmcm9tIFwiLi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgeyBQYWdlLCBQYWdpbmF0b3IgfSBmcm9tIFwiLi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgdHlwZSB7IEtleVBvbGljeSB9IGZyb20gXCIuLi9yb2xlXCI7XG5pbXBvcnQgeyBsb2FkU3VidGxlQ3J5cHRvIH0gZnJvbSBcIi4uL3VzZXJfZXhwb3J0XCI7XG5pbXBvcnQgdHlwZSB7XG4gIEFkZElkZW50aXR5UmVxdWVzdCxcbiAgQXZhQ2hhaW4sXG4gIEVudkludGVyZmFjZSxcbiAgRW90c0NyZWF0ZU5vbmNlUmVxdWVzdCxcbiAgRW90c0NyZWF0ZU5vbmNlUmVzcG9uc2UsXG4gIEVvdHNTaWduUmVxdWVzdCxcbiAgRW90c1NpZ25SZXNwb25zZSxcbiAgSnJwY1Jlc3BvbnNlLFxuICBKc29uQXJyYXksXG4gIExpc3RJZGVudGl0eVJlc3BvbnNlLFxuICBMaXN0S2V5Um9sZXNSZXNwb25zZSxcbiAgTGlzdEtleXNSZXNwb25zZSxcbiAgTGlzdFJvbGVLZXlzUmVzcG9uc2UsXG4gIExpc3RSb2xlVXNlcnNSZXNwb25zZSxcbiAgTGlzdFJvbGVzUmVzcG9uc2UsXG4gIE1taUpycGNNZXRob2QsXG4gIFBlbmRpbmdNZXNzYWdlSW5mbyxcbiAgUGVuZGluZ01lc3NhZ2VTaWduUmVzcG9uc2UsXG4gIFJhdGNoZXRDb25maWcsXG4gIFNjb3BlLFxuICBTZXNzaW9uRGF0YSxcbiAgU2Vzc2lvbkxpZmV0aW1lLFxuICBTZXNzaW9uc1Jlc3BvbnNlLFxuICBUYXByb290U2lnblJlcXVlc3QsXG4gIFRhcHJvb3RTaWduUmVzcG9uc2UsXG4gIEJhYnlsb25SZWdpc3RyYXRpb25SZXF1ZXN0LFxuICBCYWJ5bG9uUmVnaXN0cmF0aW9uUmVzcG9uc2UsXG4gIEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgQmFieWxvblN0YWtpbmdSZXNwb25zZSxcbiAgVXBkYXRlVXNlck1lbWJlcnNoaXBSZXF1ZXN0LFxuICBIaXN0b3JpY2FsVHgsXG4gIExpc3RIaXN0b3JpY2FsVHhSZXNwb25zZSxcbiAgUHVibGljT3JnSW5mbyxcbiAgSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgUGFzc3dvcmRSZXNldFJlcXVlc3QsXG4gIEVtYWlsT3RwUmVzcG9uc2UsXG4gIEF1dGhlbnRpY2F0aW9uUmVxdWVzdCxcbiAgQXV0aGVudGljYXRpb25SZXNwb25zZSxcbiAgQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgSW52aXRhdGlvbkFjY2VwdFJlcXVlc3QsXG4gIE1mYVJlY2VpcHRzLFxuICBTdWlTaWduUmVxdWVzdCxcbiAgU3VpU2lnblJlc3BvbnNlLFxuICBRdWVyeU1ldHJpY3NSZXF1ZXN0LFxuICBRdWVyeU1ldHJpY3NSZXNwb25zZSxcbiAgQ3JlYXRlT3JnUmVxdWVzdCxcbiAgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoLFxuICBEZXJpdmVNdWx0aXBsZUtleVR5cGVzUHJvcGVydGllcyxcbiAgQ29udGFjdEluZm8sXG4gIExpc3RDb250YWN0c1Jlc3BvbnNlLFxuICBKc29uVmFsdWUsXG4gIEVkaXRQb2xpY3ksXG4gIFVwZGF0ZUNvbnRhY3RSZXF1ZXN0LFxuICBBZGRyZXNzTWFwLFxufSBmcm9tIFwiLi4vaW5kZXhcIjtcbmltcG9ydCB7IGFzc2VydE9rLCBvcCB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgQmFzZUNsaWVudCwgc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyB9IGZyb20gXCIuL2Jhc2VfY2xpZW50XCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5cbi8qKlxuICogU3RyaW5nIHJldHVybmVkIGJ5IEFQSSB3aGVuIGEgdXNlciBkb2VzIG5vdCBoYXZlIGFuIGVtYWlsIGFkZHJlc3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSlcbiAqL1xuY29uc3QgRU1BSUxfTk9UX0ZPVU5EID0gXCJlbWFpbCBub3QgZm91bmRcIjtcblxuLyoqXG4gKiBTZXNzaW9uIHNlbGVjdG9yLlxuICovXG5leHBvcnQgdHlwZSBTZXNzaW9uU2VsZWN0b3IgPVxuICAvKipcbiAgICogU2VsZWN0cyBhbGwgc2Vzc2lvbnMgdGllZCB0byBhIHJvbGUgd2l0aCB0aGlzIElEXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgeyByb2xlOiBzdHJpbmcgfWAgaW5zdGVhZFxuICAgKi9cbiAgfCBzdHJpbmdcbiAgfCB7XG4gICAgICAvKiogU2VsZWN0cyBhbGwgc2Vzc2lvbnMgdGllZCB0byBhIHJvbGUgd2l0aCB0aGlzIElEICovXG4gICAgICByb2xlOiBzdHJpbmc7XG4gICAgfVxuICB8IHtcbiAgICAgIC8qKiBTZWxlY3RzIGFsbCBzZXNzaW9ucyB0aWVkIHRvIGEgdXNlciB3aXRoIHRoaXMgSUQuICovXG4gICAgICB1c2VyOiBzdHJpbmc7XG4gICAgfTtcblxuLyoqXG4gKiBBbiBleHRlbnNpb24gb2YgQmFzZUNsaWVudCB0aGF0IGFkZHMgc3BlY2lhbGl6ZWQgbWV0aG9kcyBmb3IgYXBpIGVuZHBvaW50c1xuICovXG5leHBvcnQgY2xhc3MgQXBpQ2xpZW50IGV4dGVuZHMgQmFzZUNsaWVudCB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IGNsaWVudCB1c2luZyB0aGUgc2FtZSBzZXNzaW9uIG1hbmFnZXIgYnV0IHRhcmdldGluZyBhXG4gICAqIGRpZmZlcmVudCAoY2hpbGQpIG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHRhcmdldE9yZ0lkIFRoZSBJRCBvZiBhbiBvcmdhbml6YXRpb24gdGhhdCB0aGUgbmV3IGNsaWVudCBzaG91bGQgdGFyZ2V0XG4gICAqIEByZXR1cm5zIEEgbmV3IGNsaWVudCB0YXJnZXRpbmcgYSBkaWZmZXJlbnQgb3JnXG4gICAqL1xuICB3aXRoVGFyZ2V0T3JnKHRhcmdldE9yZ0lkOiBzdHJpbmcpOiBBcGlDbGllbnQge1xuICAgIHJldHVybiBuZXcgQXBpQ2xpZW50KHRoaXMuc2Vzc2lvbk1ldGEsIHRoaXMuc2Vzc2lvbk1hbmFnZXIsIHRhcmdldE9yZ0lkKTtcbiAgfVxuXG4gIC8vICNyZWdpb24gVVNFUlM6IHVzZXJHZXQsIHVzZXJUb3RwKFJlc2V0SW5pdHxSZXNldENvbXBsZXRlfFZlcmlmeXxEZWxldGUpLCB1c2VyRmlkbyhSZWdpc3RlckluaXR8UmVnaXN0ZXJDb21wbGV0ZXxEZWxldGUpXG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIEluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqL1xuICBhc3luYyB1c2VyR2V0KCk6IFByb21pc2U8VXNlckluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWVcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7fSkudGhlbihBcGlDbGllbnQuI3Byb2Nlc3NVc2VySW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGVzIGxvZ2luIHZpYSBFbWFpbCBPVFAuXG4gICAqIFJldHVybnMgYW4gdW5zaWduZWQgT0lEQyB0b2tlbiBhbmQgc2VuZHMgYW4gZW1haWwgdG8gdGhlIHVzZXIgY29udGFpbmluZyB0aGUgc2lnbmF0dXJlIG9mIHRoYXQgdG9rZW4uXG4gICAqIFRoZSBPSURDIHRva2VuIGNhbiBiZSByZWNvbnN0cnVjdGVkIGJ5IGFwcGVuZGluZyB0aGUgc2lnbmF0dXJlIHRvIHRoZSBwYXJ0aWFsIHRva2VuIGxpa2Ugc286XG4gICAqXG4gICAqIHRva2VuID0gcGFydGlhbF90b2tlbiArIHNpZ25hdHVyZVxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byB1c2VcbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgdG8gbG9naW4gdG9cbiAgICogQHBhcmFtIGVtYWlsIFRoZSBlbWFpbCB0byBzZW5kIHRoZSBzaWduYXR1cmUgdG9cbiAgICogQHJldHVybnMgVGhlIHBhcnRpYWwgT0lEQyB0b2tlbiB0aGF0IG11c3QgYmUgY29tYmluZWQgd2l0aCB0aGUgc2lnbmF0dXJlIGluIHRoZSBlbWFpbFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGluaXRFbWFpbE90cEF1dGgoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBlbWFpbDogc3RyaW5nLFxuICApOiBQcm9taXNlPEVtYWlsT3RwUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGMvZW1haWwtb3RwXCIsIFwicG9zdFwiKTtcblxuICAgIHJldHVybiBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5OiB7IGVtYWlsIH0sXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgZWl0aGVyIGJ5IGNhbGxpbmcge0BsaW5rIFRvdHBDaGFsbGVuZ2UuYW5zd2VyfSAob3JcbiAgICoge0BsaW5rIEFwaUNsaWVudC51c2VyVG90cFJlc2V0Q29tcGxldGV9KS5cbiAgICpcbiAgICogQHBhcmFtIGlzc3VlciBPcHRpb25hbCBpc3N1ZXI7IGRlZmF1bHRzIHRvIFwiQ3ViaXN0XCJcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgTUZBIHJlY2VpcHQocykgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICogQHJldHVybnMgQSBUT1RQIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWRcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwUmVzZXRJbml0KFxuICAgIGlzc3Vlcj86IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFRvdHBDaGFsbGVuZ2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHJlc2V0VG90cEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IGlzc3VlclxuICAgICAgICAgID8ge1xuICAgICAgICAgICAgICBpc3N1ZXIsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiBudWxsLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKHRvdHBJbmZvKSA9PiBuZXcgVG90cENoYWxsZW5nZSh0aGlzLCB0b3RwSW5mbykpO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlc2V0VG90cEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIFRPVFAgY2hhbGxlbmdlIGlzc3VlZCBieSB7QGxpbmsgdXNlclRvdHBSZXNldEluaXR9LiBJZiBzdWNjZXNzZnVsLCB1c2VyJ3NcbiAgICogVE9UUCBjb25maWd1cmF0aW9uIHdpbGwgYmUgdXBkYXRlZCB0byB0aGF0IG9mIHRoZSBUT1RQIGNoYWxsZW5nZS5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIFRvdHBDaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHRvdHBJZCBUaGUgSUQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlXG4gICAqIEBwYXJhbSBjb2RlIFRoZSBUT1RQIGNvZGUgdGhhdCBzaG91bGQgdmVyaWZ5IGFnYWluc3QgdGhlIFRPVFAgY29uZmlndXJhdGlvbiBmcm9tIHRoZSBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyB1c2VyVG90cFJlc2V0Q29tcGxldGUodG90cElkOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIFwicGF0Y2hcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHsgdG90cF9pZDogdG90cElkLCBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSBDdXJyZW50IFRPVFAgY29kZVxuICAgKiBAdGhyb3dzIEFuIGVycm9yIGlmIHZlcmlmaWNhdGlvbiBmYWlsc1xuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBWZXJpZnkoY29kZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHAvdmVyaWZ5XCIsIFwicG9zdFwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7IGNvZGUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgVE9UUCBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogQWxsb3dlZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBGSURPIGtleSBpcyByZWdpc3RlcmVkIHdpdGggdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBNRkEgdmlhIEZJRE8gaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBEZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwgXCJkZWxldGVcIik7XG4gICAgY29uc3QgZGVsZXRlVG90cEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBkZWxldGVUb3RwRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFkZGluZyBhIG5ldyBGSURPIGRldmljZS4gTUZBIG1heSBiZSByZXF1aXJlZC4gIFRoaXMgcmV0dXJucyBhIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgd2l0aCB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yIHtAbGluayB1c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGV9XG4gICAqIChhZnRlciBNRkEgYXBwcm92YWxzKS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIG5ldyBkZXZpY2UuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEEgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBpbiBvcmRlciB0byBjb21wbGV0ZSBGSURPIHJlZ2lzdHJhdGlvbi5cbiAgICovXG4gIGFzeW5jIHVzZXJGaWRvUmVnaXN0ZXJJbml0KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEFkZEZpZG9DaGFsbGVuZ2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2ZpZG9cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IGFkZEZpZG9GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiB7IG5hbWUgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKGRhdGEsIChjKSA9PiBuZXcgQWRkRmlkb0NoYWxsZW5nZSh0aGlzLCBjKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgYWRkRmlkb0ZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIHVzZXJGaWRvUmVnaXN0ZXJJbml0fSkgcmVxdWVzdCB0byBhZGQgYSBuZXcgRklETyBkZXZpY2UuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3JcbiAgICoge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBjaGFsbGVuZ2VJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZC5cbiAgICogQHBhcmFtIGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlLlxuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9SZWdpc3RlckNvbXBsZXRlKFxuICAgIGNoYWxsZW5nZUlkOiBzdHJpbmcsXG4gICAgY3JlZGVudGlhbDogUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvXCIsIFwicGF0Y2hcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY2hhbGxlbmdlX2lkOiBjaGFsbGVuZ2VJZCxcbiAgICAgICAgY3JlZGVudGlhbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgRklETyBrZXkgZnJvbSB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIEFsbG93ZWQgb25seSBpZiBUT1RQIGlzIGFsc28gZGVmaW5lZC5cbiAgICogTUZBIHZpYSBUT1RQIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIGZpZG9JZCBUaGUgSUQgb2YgdGhlIGRlc2lyZWQgRklETyBrZXlcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHVzZXJGaWRvRGVsZXRlKFxuICAgIGZpZG9JZDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgZGVsZXRlRmlkb0ZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2ZpZG8ve2ZpZG9faWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgZmlkb19pZDogZmlkb0lkIH0gfSxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGRlbGV0ZUZpZG9GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBPUkdTOiBvcmdHZXQsIG9yZ1VwZGF0ZSwgb3JnVXBkYXRlVXNlck1lbWJlcnNoaXAsIG9yZ0NyZWF0ZU9yZywgb3JnUXVlcnlNZXRyaWNzXG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmdcbiAgICpcbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgdG8gZ2V0IGluZm8gZm9yXG4gICAqIEByZXR1cm5zIEluZm9ybWF0aW9uIGFib3V0IHRoZSBvcmdhbml6YXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdHZXQob3JnSWQ/OiBzdHJpbmcpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgb3JnX2lkOiBvcmdJZCA/PyB0aGlzLm9yZ0lkIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgb3JnIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgb3JnVXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZU9yZ1JlcXVlc3QpOiBQcm9taXNlPFVwZGF0ZU9yZ1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfVwiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7IGJvZHk6IHJlcXVlc3QgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHVzZXIncyBtZW1iZXJzaGlwIGluIHRoaXMgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcSBUaGUgdXBkYXRlIHJlcXVlc3RcbiAgICogQHJldHVybnMgVXBkYXRlZCB1c2VyIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIG9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHJlcTogVXBkYXRlVXNlck1lbWJlcnNoaXBSZXF1ZXN0LFxuICApOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzL3t1c2VyX2lkfS9tZW1iZXJzaGlwXCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgICAgYm9keTogcmVxLFxuICAgIH0pLnRoZW4oQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluT3JnSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IG9yZ2FuaXphdGlvbi4gVGhlIG5ldyBvcmcgaXMgYSBjaGlsZCBvZiB0aGVcbiAgICogY3VycmVudCBvcmcgYW5kIGluaGVyaXRzIGl0cyBrZXktZXhwb3J0IHBvbGljeS4gVGhlIG5ldyBvcmdcbiAgICogaXMgY3JlYXRlZCB3aXRoIG9uZSBvd25lciwgdGhlIGNhbGxlciBvZiB0aGlzIEFQSS5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIGRldGFpbHMgb2YgdGhlIHJlcXVlc3RcbiAgICogQHJldHVybnMgVGhlIG5ldyBvcmdhbml6YXRpb24gaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG9yZ0NyZWF0ZU9yZyhib2R5OiBDcmVhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9vcmdzXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBRdWVyeSBvcmcgbWV0cmljcy5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIHF1ZXJ5XG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdCB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIENvbXB1dGVkIG9yZyBtZXRyaWNzIHN0YXRpc3RpY3MuXG4gICAqL1xuICBvcmdRdWVyeU1ldHJpY3MoXG4gICAgYm9keTogUXVlcnlNZXRyaWNzUmVxdWVzdCxcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICk6IFBhZ2luYXRvcjxRdWVyeU1ldHJpY3NSZXNwb25zZSwgUXVlcnlNZXRyaWNzUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21ldHJpY3NcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgYm9keSwgcGFyYW1zOiB7IHF1ZXJ5IH0gfSksXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgICAoYWNjLCBuZXh0KSA9PiB7XG4gICAgICAgIGlmICghYWNjKSByZXR1cm4gbmV4dDtcbiAgICAgICAgYWNjLnJhd19kYXRhID8/PSBbXTtcbiAgICAgICAgYWNjLnJhd19kYXRhLnB1c2goLi4uKG5leHQucmF3X2RhdGEgPz8gW10pKTtcbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SRyBVU0VSUzogb3JnVXNlckludml0ZSwgb3JnVXNlckRlbGV0ZSwgb3JnVXNlcnNMaXN0LCBvcmdVc2VyR2V0LCBvcmdVc2VyQ3JlYXRlT2lkYywgb3JnVXNlckRlbGV0ZU9pZGNcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IChmaXJzdC1wYXJ0eSkgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kIGFuIGVtYWlsIGludml0YXRpb24gdG8gdGhhdCB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIG5hbWUgVGhlIGZ1bGwgbmFtZSBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0gcm9sZSBPcHRpb25hbCByb2xlLiBEZWZhdWx0cyB0byBcImFsaWVuXCIuXG4gICAqIEBwYXJhbSBza2lwRW1haWwgT3B0aW9uYWxseSBza2lwIHNlbmRpbmcgdGhlIGludml0ZSBlbWFpbC5cbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJJbnZpdGUoXG4gICAgZW1haWw6IHN0cmluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcm9sZT86IE1lbWJlclJvbGUsXG4gICAgc2tpcEVtYWlsPzogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbnZpdGVcIiwgXCJwb3N0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZW1haWwsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHJvbGUsXG4gICAgICAgIHNraXBfZW1haWw6ICEhc2tpcEVtYWlsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHVzZXIgZnJvbSB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgdXNlcnMgaW4gdGhlIG9yZy5cbiAgICovXG4gIG9yZ1VzZXJzTGlzdChwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8R2V0VXNlcnNJbk9yZ1Jlc3BvbnNlLCBVc2VySW5PcmdJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMubWFwKEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbk9yZ0luZm8pLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdldC5cbiAgICogQHJldHVybnMgT3JnIHVzZXIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VyR2V0KHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vycy97dXNlcl9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluT3JnSW5mbyhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyLiBUaGlzIGNhbiBiZSBhIGZpcnN0LXBhcnR5IFwiTWVtYmVyXCIgb3IgdGhpcmQtcGFydHkgXCJBbGllblwiLlxuICAgKlxuICAgKiBAcGFyYW0gaWRlbnRpdHlPclByb29mIFRoZSBpZGVudGl0eSBvciBpZGVudGl0eSBwcm9vZiBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSBlbWFpbCBFbWFpbCBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSBvcHRzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgbmV3IE9JREMgdXNlcnNcbiAgICogQHJldHVybnMgVXNlciBpZCBvZiB0aGUgbmV3IHVzZXJcbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJDcmVhdGVPaWRjKFxuICAgIGlkZW50aXR5T3JQcm9vZjogT2lkY0lkZW50aXR5IHwgSWRlbnRpdHlQcm9vZixcbiAgICBlbWFpbD86IHN0cmluZyB8IG51bGwsXG4gICAgb3B0czogQ3JlYXRlT2lkY1VzZXJPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBpZGVudGl0eU9yUHJvb2ZGaWVsZHMgPVxuICAgICAgXCJpZFwiIGluIGlkZW50aXR5T3JQcm9vZiA/IHsgcHJvb2Y6IGlkZW50aXR5T3JQcm9vZiB9IDogeyBpZGVudGl0eTogaWRlbnRpdHlPclByb29mIH07XG5cbiAgICBjb25zdCB7IHVzZXJfaWQgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIHJvbGU6IG9wdHMubWVtYmVyUm9sZSA/PyBcIkFsaWVuXCIsXG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lOiBvcHRzLm5hbWUsXG4gICAgICAgIG1mYV9wb2xpY3k6IG9wdHMubWZhUG9saWN5LFxuICAgICAgICAuLi5pZGVudGl0eU9yUHJvb2ZGaWVsZHMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVzZXJfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIGlkZW50aXR5IFRoZSBpZGVudGl0eSBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlT2lkYyhpZGVudGl0eTogT2lkY0lkZW50aXR5KTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkY1wiLCBcImRlbGV0ZVwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogaWRlbnRpdHksXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBLRVlTOiBrZXlHZXQsIGtleVVwZGF0ZSwga2V5RGVsZXRlLCBrZXlzQ3JlYXRlLCBrZXlzRGVyaXZlLCBrZXlzTGlzdCwga2V5SGlzdG9yeVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMga2V5R2V0KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgdHlwZSBhbmQgbWF0ZXJpYWwgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSBrZXkgdHlwZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsSWQgVGhlIG1hdGVyaWFsIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMga2V5R2V0QnlNYXRlcmlhbElkKGtleVR5cGU6IEtleVR5cGUsIG1hdGVyaWFsSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X3R5cGV9L3ttYXRlcmlhbF9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV90eXBlOiBrZXlUeXBlLCBtYXRlcmlhbF9pZDogbWF0ZXJpYWxJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgYSBrZXkgaXMgaW4uXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSByb2xlcyBhIGtleSBpcyBpbi5cbiAgICovXG4gIGtleVJvbGVzTGlzdChrZXlJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdEtleVJvbGVzUmVzcG9uc2UsIEtleUluUm9sZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfS9yb2xlc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PlxuICAgICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0sXG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLnJvbGVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBJRCBvZiB0aGUga2V5IHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKi9cbiAgYXN5bmMga2V5VXBkYXRlKFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgcmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEtleUluZm8+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIFwicGF0Y2hcIik7XG5cbiAgICBjb25zdCByZXFGbiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIEtleSBpZFxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBBIHJlc3BvbnNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZFxuICAgKi9cbiAgYXN5bmMga2V5RGVsZXRlKGtleUlkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCBcImRlbGV0ZVwiKTtcbiAgICBjb25zdCByZXFGbiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBjb3VudCBUaGUgbnVtYmVyIG9mIGtleXMgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwga2V5IHByb3BlcnRpZXNcbiAgICogQHJldHVybnMgVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5c0NyZWF0ZShcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGNvdW50OiBudW1iZXIsXG4gICAgb3duZXJJZD86IHN0cmluZyxcbiAgICBwcm9wcz86IENyZWF0ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgY2hhaW5faWQgPSAwOyAvLyBub3QgdXNlZCBhbnltb3JlXG5cbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBjb3VudCxcbiAgICAgICAgY2hhaW5faWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgb3duZXI6IHByb3BzPy5vd25lciA/PyBvd25lcklkLFxuICAgICAgICBwb2xpY3k6IHByb3BzPy5wb2xpY3ksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIHNldCBvZiBrZXlzIG9mIGEgc3BlY2lmaWVkIHR5cGUgdXNpbmcgYSBzdXBwbGllZCBkZXJpdmF0aW9uIHBhdGggYW5kIGFuIGV4aXN0aW5nIGxvbmctbGl2ZWQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGhzIERlcml2YXRpb24gcGF0aHMgZnJvbSB3aGljaCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNEZXJpdmUoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9kZXJpdmVfa2V5XCIsIFwicHV0XCIpO1xuXG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBkZXJpdmF0aW9uX3BhdGg6IGRlcml2YXRpb25QYXRocyxcbiAgICAgICAgbW5lbW9uaWNfaWQ6IG1uZW1vbmljSWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgcG9saWN5OiBwcm9wcz8ucG9saWN5LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBlaXRoZXIgYSBuZXcgb3IgZXhpc3RpbmcgbW5lbW9uaWMgdG8gZGVyaXZlIGtleXMgb2Ygb25lIG9yIG1vcmVcbiAgICogc3BlY2lmaWVkIHR5cGVzIHZpYSBzcGVjaWZpZWQgZGVyaXZhdGlvbiBwYXRocy5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzIEEgbGlzdCBvZiBvYmplY3RzIHNwZWNpZnlpbmcgdGhlIGtleXMgdG8gYmUgZGVyaXZlZFxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5c0Rlcml2ZU11bHRpKFxuICAgIGtleVR5cGVzQW5kRGVyaXZhdGlvblBhdGhzOiBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGhbXSxcbiAgICBwcm9wcz86IERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZGVyaXZlX2tleXNcIiwgXCJwdXRcIik7XG5cbiAgICBjb25zdCB7IGtleXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGtleV90eXBlc19hbmRfZGVyaXZhdGlvbl9wYXRoczoga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHMsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBwb2xpY3k6IHByb3BzPy5wb2xpY3ksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgYWNjZXNzaWJsZSBrZXlzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB0eXBlIE9wdGlvbmFsIGtleSB0eXBlIHRvIGZpbHRlciBsaXN0IGZvci5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEBwYXJhbSBvd25lciBPcHRpb25hbCBrZXkgb3duZXIgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0gc2VhcmNoIE9wdGlvbmFsbHkgc2VhcmNoIGJ5IGtleSdzIG1hdGVyaWFsIElEIGFuZCBtZXRhZGF0YVxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGtleXMuXG4gICAqL1xuICBrZXlzTGlzdChcbiAgICB0eXBlPzogS2V5VHlwZSxcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICAgb3duZXI/OiBzdHJpbmcsXG4gICAgc2VhcmNoPzogc3RyaW5nLFxuICApOiBQYWdpbmF0b3I8TGlzdEtleXNSZXNwb25zZSwgS2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeTogeyBrZXlfdHlwZTogdHlwZSwga2V5X293bmVyOiBvd25lciwgc2VhcmNoLCAuLi5xdWVyeSB9IH0gfSksXG4gICAgICAocikgPT4gci5rZXlzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCByZWNlbnQgaGlzdG9yaWNhbCBrZXkgdHJhbnNhY3Rpb25zLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleSBpZC5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgaGlzdG9yaWNhbCB0cmFuc2FjdGlvbnMuXG4gICAqL1xuICBrZXlIaXN0b3J5KGtleUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0SGlzdG9yaWNhbFR4UmVzcG9uc2UsIEhpc3RvcmljYWxUeFtdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9L3R4XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKCkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9IH0gfSksXG4gICAgICAocikgPT4gci50eHMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SRyBDT05UQUNUUzogY29udGFjdENyZWF0ZSwgY29udGFjdEdldCwgY29udGFjdHNMaXN0LCBjb250YWN0RGVsZXRlLCBjb250YWN0VXBkYXRlXG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY29udGFjdCBpbiB0aGUgb3JnYW5pemF0aW9uLXdpZGUgYWRkcmVzcyBib29rLiBUaGVcbiAgICogdXNlciBtYWtpbmcgdGhlIHJlcXVlc3QgaXMgdGhlIG93bmVyIG9mIHRoZSBjb250YWN0LCBnaXZpbmcgdGhlbSBlZGl0IGFjY2Vzc1xuICAgKiB0byB0aGUgY29udGFjdCBhbG9uZyB3aXRoIHRoZSBvcmcgb3duZXJzLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBmb3IgdGhlIG5ldyBjb250YWN0LlxuICAgKiBAcGFyYW0gYWRkcmVzc2VzIFRoZSBhZGRyZXNzZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgTWV0YWRhdGEgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LiBJbnRlbmRlZCBmb3IgdXNlIGFzIGEgZGVzY3JpcHRpb24uXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QsIGRldGVybWluaW5nIHdoZW4gYW5kIHdobyBjYW4gZWRpdCB0aGlzIGNvbnRhY3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBjcmVhdGVkIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBjb250YWN0Q3JlYXRlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhZGRyZXNzZXM/OiBBZGRyZXNzTWFwLFxuICAgIG1ldGFkYXRhPzogSnNvblZhbHVlLFxuICAgIGVkaXRQb2xpY3k/OiBFZGl0UG9saWN5LFxuICApOiBQcm9taXNlPENvbnRhY3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0c1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGFkZHJlc3NlczogYWRkcmVzc2VzID8/IHt9LFxuICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3ksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHByb3BlcnRpZXMgb2YgYSBDb250YWN0LlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBpZCBvZiB0aGUgY29udGFjdCB5b3Ugd2FudCB0byByZXRyaWV2ZS5cbiAgICogQHJldHVybnMgVGhlIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBjb250YWN0R2V0KGNvbnRhY3RJZDogc3RyaW5nKTogUHJvbWlzZTxDb250YWN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vY29udGFjdHMve2NvbnRhY3RfaWR9XCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBjb250YWN0X2lkOiBjb250YWN0SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIGNvbnRhY3RzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFRoZSBvcHRpb25hbCBwYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGdldHRpbmcgZXZlcnkgY29udGFjdC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgY29udGFjdHMgaW4gdGhlIG9yZy5cbiAgICovXG4gIGNvbnRhY3RzTGlzdChwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdENvbnRhY3RzUmVzcG9uc2UsIENvbnRhY3RJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2NvbnRhY3RzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeSB9IH0pLFxuICAgICAgKHIpID0+IHIuY29udGFjdHMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBjb250YWN0LCBzcGVjaWZpZWQgYnkgaXRzIElELlxuICAgKlxuICAgKiBPbmx5IHRoZSBjb250YWN0IG93bmVyIGFuZCBvcmcgb3duZXJzIGFyZSBhbGxvd2VkIHRvIGRlbGV0ZSBjb250YWN0cy5cbiAgICogQWRkaXRpb25hbGx5LCB0aGUgY29udGFjdCdzIGVkaXQgcG9saWN5IChpZiBzZXQpIG11c3QgcGVybWl0IHRoZSBkZWxldGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvbnRhY3RJZCBUaGUgY29udGFjdCB0byBkZWxldGUuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgY29udGFjdERlbGV0ZShjb250YWN0SWQ6IHN0cmluZyk6IFByb21pc2U8RW1wdHk+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2NvbnRhY3RzL3tjb250YWN0X2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgY29udGFjdF9pZDogY29udGFjdElkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGFuIGV4aXN0aW5nIGNvbnRhY3QgaW4gdGhlIG9yZ2FuaXphdGlvbi13aWRlIGFkZHJlc3MgYm9vay4gT25seVxuICAgKiB0aGUgY29udGFjdCBvd25lciBvciBhbiBvcmcgb3duZXIgY2FuIHVwZGF0ZSBjb250YWN0cy5cbiAgICpcbiAgICogVXBkYXRlcyB3aWxsIG92ZXJ3cml0ZSB0aGUgZXhpc3RpbmcgdmFsdWUgb2YgdGhlIGZpZWxkLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBjb250YWN0IHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIGZpZWxkcyB0byB1cGRhdGUuXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIGNvbnRhY3QuXG4gICAqL1xuICBhc3luYyBjb250YWN0VXBkYXRlKGNvbnRhY3RJZDogc3RyaW5nLCByZXF1ZXN0OiBVcGRhdGVDb250YWN0UmVxdWVzdCk6IFByb21pc2U8Q29udGFjdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2NvbnRhY3RzL3tjb250YWN0X2lkfVwiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBjb250YWN0X2lkOiBjb250YWN0SWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEVTOiByb2xlQ3JlYXRlLCByb2xlUmVhZCwgcm9sZVVwZGF0ZSwgcm9sZURlbGV0ZSwgcm9sZXNMaXN0XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVDcmVhdGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IG5hbWUgPyB7IG5hbWUgfSA6IHVuZGVmaW5lZCxcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpdHMgaWQgKG9yIG5hbWUpLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUdldChyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSB1cGRhdGUgcmVxdWVzdC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIHJvbGVVcGRhdGUoXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAgcmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxSb2xlSW5mbz4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCBcInBhdGNoXCIpO1xuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVxRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIHJvbGUgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB0byBkZWxldGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyByb2xlRGVsZXRlKHJvbGVJZDogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVxRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHJvbGVzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHJvbGVzLlxuICAgKi9cbiAgcm9sZXNMaXN0KHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0Um9sZXNSZXNwb25zZSwgUm9sZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeSB9IH0pLFxuICAgICAgKHIpID0+IHIucm9sZXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEUgS0VZUzogcm9sZUtleXNBZGQsIHJvbGVLZXlzRGVsZXRlLCByb2xlS2V5c0xpc3RcblxuICAvKipcbiAgICogQWRkIGV4aXN0aW5nIGtleXMgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGVcbiAgICogQHBhcmFtIGtleUlkcyBUaGUgSURzIG9mIHRoZSBrZXlzIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHBvbGljeSBUaGUgb3B0aW9uYWwgcG9saWN5IHRvIGFwcGx5IHRvIGVhY2gga2V5LlxuICAgKi9cbiAgYXN5bmMgcm9sZUtleXNBZGQocm9sZUlkOiBzdHJpbmcsIGtleUlkczogc3RyaW5nW10sIHBvbGljeT86IEtleVBvbGljeSkge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2FkZF9rZXlzXCIsIFwicHV0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGtleV9pZHM6IGtleUlkcyxcbiAgICAgICAgcG9saWN5LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3Rpbmcga2V5IGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGVcbiAgICogQHBhcmFtIGtleUlkIFRoZSBJRCBvZiB0aGUga2V5IHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlXG4gICAqL1xuICBhc3luYyByb2xlS2V5c1JlbW92ZShyb2xlSWQ6IHN0cmluZywga2V5SWQ6IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2tleXMve2tleV9pZH1cIiwgXCJkZWxldGVcIik7XG5cbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkLCBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBrZXlzIGluIGEgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUgd2hvc2Uga2V5cyB0byByZXRyaWV2ZS5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqL1xuICByb2xlS2V5c0xpc3Qocm9sZUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0Um9sZUtleXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5c1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PlxuICAgICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSxcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIua2V5cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRSBVU0VSUzogcm9sZVVzZXJBZGQsIHJvbGVVc2VyUmVtb3ZlLCByb2xlVXNlcnNMaXN0XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyByb2xlVXNlckFkZChyb2xlSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfdXNlci97dXNlcl9pZH1cIiwgXCJwdXRcIik7XG5cbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkLCB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyB1c2VyIGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJSZW1vdmUocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIHVzZXJzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgdXNlcnMgaW4gdGhlIHJvbGUuXG4gICAqL1xuICByb2xlVXNlcnNMaXN0KFxuICAgIHJvbGVJZDogc3RyaW5nLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3VzZXJzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeSwgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFNFU1NJT05TOiBzZXNzaW9uKENyZWF0ZXxDcmVhdGVGb3JSb2xlfFJlZnJlc2h8UmV2b2tlfExpc3R8S2V5c0xpc3QpXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKS4gVGhlIGxpZmV0aW1lIG9mXG4gICAqIHRoZSBuZXcgc2Vzc2lvbiBpcyBzaWxlbnRseSB0cnVuY2F0ZWQgdG8gdGhhdCBvZiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcHVycG9zZSBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLlxuICAgKiBAcGFyYW0gbGlmZXRpbWVzIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEByZXR1cm5zIE5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkNyZWF0ZShcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBTY29wZVtdLFxuICAgIGxpZmV0aW1lcz86IFNlc3Npb25MaWZldGltZSxcbiAgKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIGxpZmV0aW1lcyA/Pz0gZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIHB1cnBvc2UsXG4gICAgICAgIHNjb3BlcyxcbiAgICAgICAgYXV0aF9saWZldGltZTogbGlmZXRpbWVzLmF1dGgsXG4gICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IGxpZmV0aW1lcy5yZWZyZXNoLFxuICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZXMuc2Vzc2lvbixcbiAgICAgICAgZ3JhY2VfbGlmZXRpbWU6IGxpZmV0aW1lcy5ncmFjZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8odGhpcy5zZXNzaW9uTWV0YSwgZGF0YSwge1xuICAgICAgcHVycG9zZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykgd2hvc2UgbGlmZXRpbWUgcG90ZW50aWFsbHlcbiAgICogZXh0ZW5kcyB0aGUgbGlmZXRpbWUgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi4gIE1GQSBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuXG4gICAqIEBwYXJhbSBsaWZldGltZSBMaWZldGltZSBzZXR0aW5nc1xuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlRXh0ZW5kZWQoXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3BlczogU2NvcGVbXSxcbiAgICBsaWZldGltZTogU2Vzc2lvbkxpZmV0aW1lLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2Vzc2lvbkRhdGE+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHJlcXVlc3RGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgcHVycG9zZSxcbiAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgZXh0ZW5kX2xpZmV0aW1lczogdHJ1ZSxcbiAgICAgICAgICBhdXRoX2xpZmV0aW1lOiBsaWZldGltZS5hdXRoLFxuICAgICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IGxpZmV0aW1lLnJlZnJlc2gsXG4gICAgICAgICAgc2Vzc2lvbl9saWZldGltZTogbGlmZXRpbWUuc2Vzc2lvbixcbiAgICAgICAgICBncmFjZV9saWZldGltZTogbGlmZXRpbWUuZ3JhY2UsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShyZXNwLCAoc2Vzc2lvbkluZm8pID0+XG4gICAgICAgIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8odGhpcy5zZXNzaW9uTWV0YSwgc2Vzc2lvbkluZm8sIHtcbiAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVxdWVzdEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gZm9yIGEgZ2l2ZW4gcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuIE5vdCBhbGwgc2NvcGVzIGFyZSB2YWxpZCBmb3IgYSByb2xlLlxuICAgKiBAcGFyYW0gbGlmZXRpbWVzIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEByZXR1cm5zIE5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkNyZWF0ZUZvclJvbGUoXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3Blcz86IFNjb3BlW10sXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgbGlmZXRpbWVzID8/PSBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lO1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3Rva2Vuc1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBwdXJwb3NlLFxuICAgICAgICBzY29wZXMsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lcy5hdXRoLFxuICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiBsaWZldGltZXMucmVmcmVzaCxcbiAgICAgICAgc2Vzc2lvbl9saWZldGltZTogbGlmZXRpbWVzLnNlc3Npb24sXG4gICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZXMuZ3JhY2UsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8odGhpcy5zZXNzaW9uTWV0YSwgZGF0YSwge1xuICAgICAgcm9sZV9pZDogcm9sZUlkLFxuICAgICAgcHVycG9zZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgYSBzZXNzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gc2Vzc2lvbklkIFRoZSBJRCBvZiB0aGUgc2Vzc2lvbiB0byByZXZva2UuIFRoaXMgc2Vzc2lvbiBieSBkZWZhdWx0XG4gICAqL1xuICBhc3luYyBzZXNzaW9uUmV2b2tlKHNlc3Npb25JZD86IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvbi97c2Vzc2lvbl9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHNlc3Npb25faWQ6IHNlc3Npb25JZCA/PyBcInNlbGZcIiB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGFsbCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHNlbGVjdG9yIFdoaWNoIHNlc3Npb25zIHRvIHJldm9rZS4gSWYgbm90IGRlZmluZWQsIGFsbCB0aGUgY3VycmVudCB1c2VyJ3Mgc2Vzc2lvbnMgd2lsbCBiZSByZXZva2VkLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvblJldm9rZUFsbChzZWxlY3Rvcj86IFNlc3Npb25TZWxlY3Rvcikge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCBcImRlbGV0ZVwiKTtcbiAgICBjb25zdCBxdWVyeSA9IHR5cGVvZiBzZWxlY3RvciA9PT0gXCJzdHJpbmdcIiA/IHsgcm9sZTogc2VsZWN0b3IgfSA6IHNlbGVjdG9yO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcXVlcnkgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBhbGwgc2lnbmVyIHNlc3Npb25zIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgSWYgc2V0LCBsaW1pdCB0byBzZXNzaW9ucyBmb3IgYSBzcGVjaWZpZWQgdXNlciBvciBhIHJvbGUuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBTaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS5cbiAgICovXG4gIHNlc3Npb25zTGlzdChcbiAgICBzZWxlY3Rvcj86IFNlc3Npb25TZWxlY3RvcixcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICk6IFBhZ2luYXRvcjxTZXNzaW9uc1Jlc3BvbnNlLCBTZXNzaW9uSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZ2V0XCIpO1xuICAgIGNvbnN0IHNlbGVjdG9yUXVlcnkgPSB0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIgPyB7IHJvbGU6IHNlbGVjdG9yIH0gOiBzZWxlY3RvcjtcbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IC4uLnNlbGVjdG9yUXVlcnksIC4uLnF1ZXJ5IH0gfSB9KSxcbiAgICAgIChyKSA9PiByLnNlc3Npb25zLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBrZXlzIHRoYXQgdGhpcyBzZXNzaW9uIGhhcyBhY2Nlc3MgdG8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGtleXMuXG4gICAqL1xuICBhc3luYyBzZXNzaW9uS2V5c0xpc3QoKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Rva2VuL2tleXNcIiwgXCJnZXRcIik7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gSURFTlRJVFk6IGlkZW50aXR5UHJvdmUsIGlkZW50aXR5VmVyaWZ5LCBpZGVudGl0eUFkZCwgaWRlbnRpdHlSZW1vdmUsIGlkZW50aXR5TGlzdFxuXG4gIC8qKlxuICAgKiBPYnRhaW4gcHJvb2Ygb2YgYXV0aGVudGljYXRpb24gdXNpbmcgdGhlIGN1cnJlbnQgQ3ViZVNpZ25lciBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlQcm92ZSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlXCIsIFwicG9zdFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0gcHJvb2YgVGhlIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKiBAdGhyb3dzIEFuIGVycm9yIGlmIHByb29mIGlzIGludmFsaWRcbiAgICovXG4gIGFzeW5jIGlkZW50aXR5VmVyaWZ5KHByb29mOiBJZGVudGl0eVByb29mKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS92ZXJpZnlcIiwgXCJwb3N0XCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiBwcm9vZixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NvY2lhdGVzIGFuIE9JREMgaWRlbnRpdHkgd2l0aCB0aGUgY3VycmVudCB1c2VyJ3MgYWNjb3VudC5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keSwgY29udGFpbmluZyBhbiBPSURDIHRva2VuIHRvIHByb3ZlIHRoZSBpZGVudGl0eSBvd25lcnNoaXAuXG4gICAqL1xuICBhc3luYyBpZGVudGl0eUFkZChib2R5OiBBZGRJZGVudGl0eVJlcXVlc3QpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gT0lEQyBpZGVudGl0eSBmcm9tIHRoZSBjdXJyZW50IHVzZXIncyBhY2NvdW50LlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBUaGUgaWRlbnRpdHkgdG8gcmVtb3ZlLlxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlSZW1vdmUoYm9keTogT2lkY0lkZW50aXR5KSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIGFzc29jaWF0ZWQgT0lEQyBpZGVudGl0aWVzIHdpdGggdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybnMgQXNzb2NpYXRlZCBpZGVudGl0aWVzXG4gICAqL1xuICBhc3luYyBpZGVudGl0eUxpc3QoKTogUHJvbWlzZTxMaXN0SWRlbnRpdHlSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHlcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNRkE6IG1mYUdldCwgbWZhTGlzdCwgbWZhQXBwcm92ZSwgbWZhTGlzdCwgbWZhQXBwcm92ZSwgbWZhQXBwcm92ZVRvdHAsIG1mYUFwcHJvdmVGaWRvKEluaXR8Q29tcGxldGUpLCBtZmFWb3RlRW1haWwoSW5pdHxDb21wbGV0ZSlcblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgTUZBIHJlcXVlc3QgSURcbiAgICogQHJldHVybnMgTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhXCIsIFwiZ2V0XCIpO1xuXG4gICAgY29uc3QgeyBtZmFfcmVxdWVzdHMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gICAgcmV0dXJuIG1mYV9yZXF1ZXN0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFWb3RlQ3MobWZhSWQ6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgSUQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYVZvdGVUb3RwKG1mYUlkOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS90b3RwXCIsIFwicGF0Y2hcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwgb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgRklETy4gQSBjaGFsbGVuZ2UgaXNcbiAgICogcmV0dXJuZWQgd2hpY2ggbXVzdCBiZSBhbnN3ZXJlZCB2aWEge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvciB7QGxpbmsgbWZhVm90ZUZpZG9Db21wbGV0ZX0uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSUQuXG4gICAqIEByZXR1cm5zIEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgbWZhRmlkb0luaXQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhRmlkb0NoYWxsZW5nZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2ZpZG9cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgY2hhbGxlbmdlID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBNZmFGaWRvQ2hhbGxlbmdlKHRoaXMsIG1mYUlkLCBjaGFsbGVuZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgbWZhRmlkb0luaXR9KSBNRkEgcmVxdWVzdCB1c2luZyBGSURPLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElEXG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0gY2hhbGxlbmdlSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2UgaXNzdWVkIGJ5IHtAbGluayBtZmFGaWRvSW5pdH1cbiAgICogQHBhcmFtIGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBtZmFWb3RlRmlkb0NvbXBsZXRlKFxuICAgIG1mYUlkOiBzdHJpbmcsXG4gICAgbWZhVm90ZTogTWZhVm90ZSxcbiAgICBjaGFsbGVuZ2VJZDogc3RyaW5nLFxuICAgIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gICk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9maWRvXCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY2hhbGxlbmdlX2lkOiBjaGFsbGVuZ2VJZCxcbiAgICAgICAgY3JlZGVudGlhbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgTUZBIGFwcHJvdmFsIHZpYSBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSURcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUVtYWlsSW5pdChtZmFJZDogc3RyaW5nLCBtZmFWb3RlOiBNZmFWb3RlKTogUHJvbWlzZTxNZmFFbWFpbENoYWxsZW5nZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2VtYWlsXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBjaGFsbGVuZ2UgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBNZmFFbWFpbENoYWxsZW5nZSh0aGlzLCBtZmFJZCwgY2hhbGxlbmdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIG1mYVZvdGVFbWFpbEluaXR9KSBNRkEgdm90ZSByZXF1ZXN0IHVzaW5nIGVtYWlsIE9UUC5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIE1mYUVtYWlsQ2hhbGxlbmdlLmFuc3dlcn0gb3JcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSURcbiAgICogQHBhcmFtIHBhcnRpYWxUb2tlbiBUaGUgcGFydGlhbCB0b2tlbiByZXR1cm5lZCBieSB7QGxpbmsgbWZhVm90ZUVtYWlsSW5pdH1cbiAgICogQHBhcmFtIHNpZ25hdHVyZSBUaGUgb25lLXRpbWUgY29kZSAoc2lnbmF0dXJlIGluIHRoaXMgY2FzZSkgc2VudCB2aWEgZW1haWxcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIG1mYVZvdGVFbWFpbENvbXBsZXRlKFxuICAgIG1mYUlkOiBzdHJpbmcsXG4gICAgcGFydGlhbFRva2VuOiBzdHJpbmcsXG4gICAgc2lnbmF0dXJlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9lbWFpbFwiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgICBib2R5OiB7IHRva2VuOiBgJHtwYXJ0aWFsVG9rZW59JHtzaWduYXR1cmV9YCB9LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0lHTjogc2lnbkV2bSwgc2lnbkV0aDIsIHNpZ25TdGFrZSwgc2lnblVuc3Rha2UsIHNpZ25BdmEsIHNpZ25TZXJpYWxpemVkQXZhLCBzaWduQmxvYiwgc2lnbkJ0Yywgc2lnblRhcHJvb3QsIHNpZ25Tb2xhbmEsIHNpZ25Fb3RzLCBlb3RzQ3JlYXRlTm9uY2UsIHNpZ25NbWksIHNpZ25TdWlcblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV2bVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtMTkxIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXAxOTFTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRWlwMTkxU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2V2bS9laXAxOTEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTcxMiB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwNzEyU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDcxMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVpcDcxMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9ldm0vZWlwNzEyL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHZhbGlkYXRpb24gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU3Rha2UoXG4gICAgcmVxOiBFdGgyU3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlN0YWtlUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3N0YWtlXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHVuc3Rha2UvZXhpdCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblVuc3Rha2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyVW5zdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMi91bnN0YWtlL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gQXZhbGFuY2hlIFAtIG9yIFgtY2hhaW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB0eCBBdmFsYW5jaGUgbWVzc2FnZSAodHJhbnNhY3Rpb24pIHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICB0eDogQXZhVHgsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBdmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiA8QXZhU2lnblJlcXVlc3Q+e1xuICAgICAgICAgIHR4OiB0eCBhcyB1bmtub3duLFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHNlcmlhbGl6ZWQgQXZhbGFuY2hlIEMtLCBQLSwgb3IgWC1jaGFpbiBtZXNzYWdlLiBTZWUgW3RoZSBBdmFsYW5jaGVcbiAgICogZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2NzLmF2YXgubmV0d29yay9yZWZlcmVuY2Uvc3RhbmRhcmRzL3NlcmlhbGl6YXRpb24tcHJpbWl0aXZlcylcbiAgICogZm9yIHRoZSBzcGVjaWZpY2F0aW9uIG9mIHRoZSBzZXJpYWxpemF0aW9uIGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSBhdmFDaGFpbiBBdmFsYW5jaGUgY2hhaW5cbiAgICogQHBhcmFtIHR4IEhleCBlbmNvZGVkIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TZXJpYWxpemVkQXZhKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIGF2YUNoYWluOiBBdmFDaGFpbixcbiAgICB0eDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QXZhU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYXZhL3NpZ24ve2F2YV9jaGFpbn0ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgYXZhX2NoYWluOiBhdmFDaGFpbiwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogPEF2YVNlcmlhbGl6ZWRUeFNpZ25SZXF1ZXN0PntcbiAgICAgICAgICB0eCxcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSByYXcgYmxvYi5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LiBUaGlzIGlzIGJlY2F1c2VcbiAgICogc2lnbmluZyBhcmJpdHJhcnkgbWVzc2FnZXMgaXMsIGluIGdlbmVyYWwsIGRhbmdlcm91cyAoYW5kIHlvdSBzaG91bGQgaW5zdGVhZFxuICAgKiBwcmVmZXIgdHlwZWQgZW5kLXBvaW50cyBhcyB1c2VkIGJ5LCBmb3IgZXhhbXBsZSwge0BsaW5rIHNpZ25Fdm19KS4gRm9yIFNlY3AyNTZrMSBrZXlzLFxuICAgKiBmb3IgZXhhbXBsZSwgeW91ICoqbXVzdCoqIGNhbGwgdGhpcyBmdW5jdGlvbiB3aXRoIGEgbWVzc2FnZSB0aGF0IGlzIDMyIGJ5dGVzIGxvbmcgYW5kXG4gICAqIHRoZSBvdXRwdXQgb2YgYSBzZWN1cmUgaGFzaCBmdW5jdGlvbi5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHNpZ25hdHVyZXMgc2VyaWFsaXplZCBhcztcbiAgICpcbiAgICogLSBFQ0RTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGFzIGJpZy1lbmRpYW4gciBhbmQgcyBwbHVzIHJlY292ZXJ5LWlkXG4gICAqICAgIGJ5dGUgdiwgd2hpY2ggY2FuIGluIGdlbmVyYWwgdGFrZSBhbnkgb2YgdGhlIHZhbHVlcyAwLCAxLCAyLCBvciAzLlxuICAgKlxuICAgKiAtIEVkRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgaW4gdGhlIHN0YW5kYXJkIGZvcm1hdC5cbiAgICpcbiAgICogLSBCTFMgc2lnbmF0dXJlcyBhcmUgbm90IHN1cHBvcnRlZCBvbiB0aGUgYmxvYi1zaWduIGVuZHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJsb2IoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCbG9iU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vYmxvYi9zaWduL3trZXlfaWR9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGtleV9pZCA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkuaWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIHRyYW5zYWN0aW9uIGlucHV0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJpdGNvaW4gQklQLTEzNyBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0Y01lc3NhZ2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCdGNNZXNzYWdlU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNNZXNzYWdlU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL21lc3NhZ2Uvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgVGFwcm9vdCB0cmFuc2FjdGlvbiBpbnB1dC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UYXByb290KFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogVGFwcm9vdFNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VGFwcm9vdFNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2J0Yy90YXByb290L3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFBTQlQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduUHNidChcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFBzYnRTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFBzYnRTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvcHNidC9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGFuIEV4dHJhY3RhYmxlIE9uZS1UaW1lIFNpZ25hdHVyZVxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVvdHMoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFb3RzU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFb3RzU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9lb3RzL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgc2V0IG9mIEJhYnlsb24gRU9UUyBub25jZXMgZm9yIGEgc3BlY2lmaWVkIGNoYWluLWlkLCBzdGFydGluZyBhdCBhIHNwZWNpZmllZCBibG9jayBoZWlnaHQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgYW5kIGhvdyBtYW55IG5vbmNlcyB0byBjcmVhdGVcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgZW90c0NyZWF0ZU5vbmNlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRW90c0NyZWF0ZU5vbmNlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVvdHNDcmVhdGVOb25jZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9lb3RzL25vbmNlcy97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQmFieWxvbiBzdGFraW5nIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS4gRm9yIGEgZGVwb3NpdCwgdGhpcyBjYW4gYmUgZWl0aGVyIGEgU2Vnd2l0IG9yIGEgVGFwcm9vdCBrZXkuIEZvciBhbnkgb3RoZXIgcmVxdWVzdCB0eXBlLCB0aGlzIGp1c3QgYmUgYSBUYXByb290IGtleS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJhYnlsb25TdGFraW5nVHhuKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmFieWxvblN0YWtpbmdSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmFieWxvblN0YWtpbmdSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vc3Rha2luZy97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQmFieWxvbiBzdGFraW5nIHJlZ2lzdHJhdGlvbiByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBUYXByb290IGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQmFieWxvblJlZ2lzdHJhdGlvbihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJhYnlsb25SZWdpc3RyYXRpb25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmFieWxvblJlZ2lzdHJhdGlvblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9yZWdpc3RyYXRpb24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNvbGFuYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNvbGFuYShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFNvbGFuYVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U29sYW5hU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc29sYW5hL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIE1NSSBwZW5kaW5nIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIHRoZSBtZXNzYWdlIGluZm8uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IG9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyB0aGUgdXBkYXRlZCBtZXNzYWdlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1taShcbiAgICBtZXNzYWdlOiBQZW5kaW5nTWVzc2FnZUluZm8sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxQZW5kaW5nTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfS9zaWduXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtZXNzYWdlLmlkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogbWVzc2FnZSxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTVUkgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblN1aShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXF1ZXN0OiBTdWlTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFN1aVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3N1aS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBVU0VSIEVYUE9SVDogdXNlckV4cG9ydChJbml0LENvbXBsZXRlLExpc3QsRGVsZXRlKVxuICAvKipcbiAgICogTGlzdCBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0cy5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIE9wdGlvbmFsIGtleSBJRC4gSWYgc3VwcGxpZWQsIGxpc3QgdGhlIG91dHN0YW5kaW5nIHJlcXVlc3QgKGlmIGFueSkgb25seSBmb3IgdGhlIHNwZWNpZmllZCBrZXk7IG90aGVyd2lzZSwgbGlzdCBhbGwgb3V0c3RhbmRpbmcgcmVxdWVzdHMgZm9yIHRoZSBzcGVjaWZpZWQgdXNlci5cbiAgICogQHBhcmFtIHVzZXJJZCBPcHRpb25hbCB1c2VyIElELiBJZiBvbXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGxpc3QgdXNlci1leHBvcnQgcmVxdWVzdHMgZm9yIHVzZXJzIG90aGVyIHRoYW4gdGhlbXNlbHZlcy5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHJlc3VsdCBzZXQuXG4gICAqL1xuICB1c2VyRXhwb3J0TGlzdChcbiAgICBrZXlJZD86IHN0cmluZyxcbiAgICB1c2VySWQ/OiBzdHJpbmcsXG4gICAgcGFnZT86IFBhZ2VPcHRzLFxuICApOiBQYWdpbmF0b3I8VXNlckV4cG9ydExpc3RSZXNwb25zZSwgVXNlckV4cG9ydEluaXRSZXNwb25zZVtdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICAgICAgLi4ucXVlcnksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIuZXhwb3J0X3JlcXVlc3RzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5LWlkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHVzZXItZXhwb3J0IHJlcXVlc3QgdG8gZGVsZXRlLlxuICAgKiBAcGFyYW0gdXNlcklkIE9wdGlvbmFsIHVzZXIgSUQuIElmIG9taXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGRlbGV0ZSB1c2VyLWV4cG9ydCByZXF1ZXN0cyBmb3IgdXNlcnMgb3RoZXIgdGhhbiB0aGVtc2VsdmVzLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydERlbGV0ZShrZXlJZDogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydEluaXQoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRJbml0UmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgaW5pdEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGJvZHk6IHsga2V5X2lkOiBrZXlJZCB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgaW5pdEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5LWlkIGZvciB3aGljaCB0byBpbml0aWF0ZSBhbiBleHBvcnQuXG4gICAqIEBwYXJhbSBwdWJsaWNLZXkgVGhlIE5JU1QgUC0yNTYgcHVibGljIGtleSB0byB3aGljaCB0aGUgZXhwb3J0IHdpbGwgYmUgZW5jcnlwdGVkLiBUaGlzIHNob3VsZCBiZSB0aGUgYHB1YmxpY0tleWAgcHJvcGVydHkgb2YgYSB2YWx1ZSByZXR1cm5lZCBieSBgdXNlckV4cG9ydEtleWdlbmAuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1c2VyRXhwb3J0Q29tcGxldGUoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBwdWJsaWNLZXk6IENyeXB0b0tleSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlPj4ge1xuICAgIC8vIGJhc2U2NC1lbmNvZGUgdGhlIHB1YmxpYyBrZXlcbiAgICBjb25zdCBzdWJ0bGUgPSBhd2FpdCBsb2FkU3VidGxlQ3J5cHRvKCk7XG4gICAgY29uc3QgcHVibGljS2V5QjY0ID0gZW5jb2RlVG9CYXNlNjQoQnVmZmVyLmZyb20oYXdhaXQgc3VidGxlLmV4cG9ydEtleShcInJhd1wiLCBwdWJsaWNLZXkpKSk7XG5cbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwicGF0Y2hcIik7XG4gICAgLy8gbWFrZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IGNvbXBsZXRlRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgcHVibGljX2tleTogcHVibGljS2V5QjY0LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGNvbXBsZXRlRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIEtFWSBJTVBPUlQ6IGNyZWF0ZUtleUltcG9ydEtleSwgaW1wb3J0S2V5c1xuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlJbXBvcnRLZXkoKTogUHJvbWlzZTxDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW1wb3J0X2tleVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNkay1rZXktaW1wb3J0YFxuICAgKiBsaWJyYXJ5LiBTZWUgdGhhdCBsaWJyYXJ5J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBBbiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgaW1wb3J0ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGltcG9ydEtleXMoYm9keTogSW1wb3J0S2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbXBvcnRfa2V5XCIsIFwicHV0XCIpO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNSVNDOiBoZWFydGJlYXQoKVxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGhlYXJ0YmVhdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2N1YmUzc2lnbmVyL2hlYXJ0YmVhdFwiLCBcInBvc3RcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNTUk6IG1taSgpLCBtbWlMaXN0KClcbiAgLyoqXG4gICAqIENhbGwgdGhlIE1NSSBKU09OIFJQQyBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIG1ldGhvZCBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHRvIGNhbGwuXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIGxpc3Qgb2YgbWV0aG9kIHBhcmFtZXRlcnMuXG4gICAqIEByZXR1cm5zIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIG1ldGhvZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBtbWkobWV0aG9kOiBNbWlKcnBjTWV0aG9kLCBwYXJhbXM6IEpzb25BcnJheSk6IFByb21pc2U8SnJwY1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL21taS92My9qc29uLXJwY1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgYm9keSA9IHtcbiAgICAgIGlkOiAxLFxuICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgfTtcbiAgICBjb25zdCBmdW5jID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4gdGhpcy5leGVjKG8sIHsgaGVhZGVycywgYm9keSB9KTtcbiAgICBjb25zdCByZXNwID0gKGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGZ1bmMpKS5kYXRhKCk7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1NSSBtZXNzYWdlcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgcGVuZGluZyBNTUkgbWVzc2FnZXMuXG4gICAqL1xuICBhc3luYyBtbWlMaXN0KCk6IFByb21pc2U8UGVuZGluZ01lc3NhZ2VJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlc1wiLCBcImdldFwiKTtcbiAgICBjb25zdCB7IHBlbmRpbmdfbWVzc2FnZXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gICAgcmV0dXJuIHBlbmRpbmdfbWVzc2FnZXMgYXMgUGVuZGluZ01lc3NhZ2VJbmZvW107XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNTUkgbWVzc2FnZSBieSBpdHMgSUQuXG4gICAqXG4gICAqIEBwYXJhbSBtc2dJZCBUaGUgSUQgb2YgdGhlIHBlbmRpbmcgbWVzc2FnZS5cbiAgICogQHJldHVybnMgVGhlIHBlbmRpbmcgTU1JIG1lc3NhZ2UuXG4gICAqL1xuICBhc3luYyBtbWlHZXQobXNnSWQ6IHN0cmluZyk6IFByb21pc2U8UGVuZGluZ01lc3NhZ2VJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH1cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbXNnSWQgfSB9IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgTU1JIG1lc3NhZ2Ugd2l0aCB0aGUgZ2l2ZW4gSUQuXG4gICAqXG4gICAqIEBwYXJhbSBtc2dJZCB0aGUgSUQgb2YgdGhlIE1NSSBtZXNzYWdlLlxuICAgKi9cbiAgYXN5bmMgbW1pRGVsZXRlKG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1zZ0lkIH0gfSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1NSSBtZXNzYWdlIHdpdGggdGhlIGdpdmVuIElELlxuICAgKlxuICAgKiBAcGFyYW0gbXNnSWQgdGhlIElEIG9mIHRoZSBNTUkgbWVzc2FnZS5cbiAgICogQHJldHVybnMgVGhlIG1lc3NhZ2Ugd2l0aCB1cGRhdGVkIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBtbWlSZWplY3QobXNnSWQ6IHN0cmluZyk6IFByb21pc2U8UGVuZGluZ01lc3NhZ2VJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH0vcmVqZWN0XCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtc2dJZCB9IH0gfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLyoqXG4gICAqIFJldHVybnMgcHVibGljIG9yZyBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgdG8gbG9nIGludG9cbiAgICogQHJldHVybnMgUHVibGljIG9yZyBpbmZvcm1hdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHB1YmxpY09yZ0luZm8oZW52OiBFbnZJbnRlcmZhY2UsIG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFB1YmxpY09yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2luZm9cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmRzIGFuIGVtYWlsIHRvIHRoZSBnaXZlbiBhZGRyZXNzIHdpdGggYSBsaXN0IG9mIG9yZ3MgdGhlIHVzZXIgaXMgYSBtZW1iZXIgb2YuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIHVzZVxuICAgKiBAcGFyYW0gZW1haWwgVGhlIHVzZXIncyBlbWFpbFxuICAgKiBAcmV0dXJucyBFbXB0eSByZXNwb25zZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGVtYWlsTXlPcmdzKGVudjogRW52SW50ZXJmYWNlLCBlbWFpbDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL2VtYWlsL29yZ3NcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHF1ZXJ5OiB7IGVtYWlsIH0gfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGxvZyBpbnRvLlxuICAgKiBAcGFyYW0gdG9rZW4gVGhlIE9JREMgdG9rZW4gdG8gZXhjaGFuZ2VcbiAgICogQHBhcmFtIHNjb3BlcyBUaGUgc2NvcGVzIGZvciB0aGUgbmV3IHNlc3Npb25cbiAgICogQHBhcmFtIGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcGFyYW0gcHVycG9zZSBPcHRpb25hbCBzZXNzaW9uIGRlc2NyaXB0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIG9pZGNTZXNzaW9uQ3JlYXRlKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PFNjb3BlPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgICBwdXJwb3NlPzogc3RyaW5nLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgbG9naW5GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICAgIG8oe1xuICAgICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC4uLmhlYWRlcnMsXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICAgIHB1cnBvc2UsXG4gICAgICAgICAgICB0b2tlbnM6IGxpZmV0aW1lcyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICkudGhlbihhc3NlcnRPayk7XG5cbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAoc2Vzc2lvbkluZm8pOiBTZXNzaW9uRGF0YSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBlbnYsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvcmdfaWQ6IG9yZ0lkLFxuICAgICAgICAgIHRva2VuOiBzZXNzaW9uSW5mby50b2tlbixcbiAgICAgICAgICByZWZyZXNoX3Rva2VuOiBzZXNzaW9uSW5mby5yZWZyZXNoX3Rva2VuLFxuICAgICAgICAgIHNlc3Npb25fZXhwOiBzZXNzaW9uSW5mby5leHBpcmF0aW9uLFxuICAgICAgICAgIHB1cnBvc2U6IFwic2lnbiBpbiB2aWEgb2lkY1wiLFxuICAgICAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbkluZm8uc2Vzc2lvbl9pbmZvLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGVudiwgbG9naW5GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQWNjZXB0IGFuIGludml0YXRpb24gdG8gam9pbiBhIEN1YmVTaWduZXIgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcEFjY2VwdEludml0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IEludml0YXRpb25BY2NlcHRSZXF1ZXN0LFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2ludml0YXRpb24vYWNjZXB0XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmF1dGhlbnRpY2F0ZWQgZW5kcG9pbnQgZm9yIGF1dGhlbnRpY2F0aW5nIHdpdGggZW1haWwvcGFzc3dvcmQuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvblxuICAgKiBAcGFyYW0gYm9keSBUaGUgcmVxdWVzdCBib2R5XG4gICAqIEByZXR1cm5zIFJldHVybnMgYW4gT0lEQyB0b2tlbiB3aGljaCBjYW4gYmUgdXNlZFxuICAgKiAgIHRvIGxvZyBpbiB2aWEgT0lEQyAoc2VlIHtAbGluayBvaWRjU2Vzc2lvbkNyZWF0ZX0pLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcEF1dGhlbnRpY2F0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IEF1dGhlbnRpY2F0aW9uUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxBdXRoZW50aWNhdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZHAvYXV0aGVudGljYXRlXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciByZXF1ZXN0aW5nIHBhc3N3b3JkIHJlc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcmV0dXJucyBSZXR1cm5zIHRoZSBwYXJ0aWFsIHRva2VuIChgJHtoZWFkZXJ9LiR7Y2xhaW1zfS5gKSB3aGlsZSB0aGUgc2lnbmF0dXJlIGlzIHNlbnQgdmlhIGVtYWlsLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcFBhc3N3b3JkUmVzZXRSZXF1ZXN0KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogUGFzc3dvcmRSZXNldFJlcXVlc3QsXG4gICk6IFByb21pc2U8RW1haWxPdHBSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRwL3Bhc3N3b3JkX3Jlc2V0XCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciBjb25maXJtaW5nIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgcGFzc3dvcmQgcmVzZXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSBwYXJ0aWFsVG9rZW4gVGhlIHBhcnRpYWwgdG9rZW4gcmV0dXJuZWQgYnkge0BsaW5rIHBhc3N3b3JkUmVzZXRSZXF1ZXN0fVxuICAgKiBAcGFyYW0gc2lnbmF0dXJlIFRoZSBvbmUtdGltZSBjb2RlIChzaWduYXR1cmUgaW4gdGhpcyBjYXNlKSBzZW50IHZpYSBlbWFpbFxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmQgVGhlIG5ldyBwYXNzd29yZFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcFBhc3N3b3JkUmVzZXRDb25maXJtKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgcGFydGlhbFRva2VuOiBzdHJpbmcsXG4gICAgc2lnbmF0dXJlOiBzdHJpbmcsXG4gICAgbmV3UGFzc3dvcmQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZHAvcGFzc3dvcmRfcmVzZXRcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgdG9rZW46IGAke3BhcnRpYWxUb2tlbn0ke3NpZ25hdHVyZX1gLFxuICAgICAgICAgIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIGlkIGluIHdoaWNoIHRvIGdlbmVyYXRlIHByb29mXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgb2lkYyB0b2tlblxuICAgKiBAcmV0dXJucyBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkZW50aXR5UHJvdmVPaWRjKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZS9vaWRjXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IHRva2VuLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYWxsIG9yZ2FuaXphdGlvbnMgYSB1c2VyIGlzIGEgbWVtYmVyIG9mXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgb2lkYyB0b2tlbiBpZGVudGlmeWluZyB0aGUgdXNlclxuICAgKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIHRoZSB1c2VyIGJlbG9uZ3MgdG9cbiAgICovXG4gIHN0YXRpYyBhc3luYyB1c2VyT3JncyhlbnY6IEVudkludGVyZmFjZSwgdG9rZW46IHN0cmluZyk6IFByb21pc2U8VXNlck9yZ3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC91c2VyL29yZ3NcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IHRva2VuLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3N0LXByb2Nlc3MgYSB7QGxpbmsgVXNlckluZm99IHJlc3BvbnNlLiBQb3N0LXByb2Nlc3NpbmcgZW5zdXJlcyB0aGF0IHRoZSBlbWFpbCBmaWVsZCBmb3JcbiAgICogdXNlcnMgd2l0aG91dCBhbiBlbWFpbCBpcyBzZXQgdG8gYG51bGxgLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyBUaGUgaW5mbyB0byBwb3N0LXByb2Nlc3NcbiAgICogQHJldHVybnMgVGhlIHByb2Nlc3NlZCB1c2VyIGluZm9cbiAgICovXG4gIHN0YXRpYyAjcHJvY2Vzc1VzZXJJbmZvKGluZm86IFVzZXJJbmZvKTogVXNlckluZm8ge1xuICAgIGlmIChpbmZvLmVtYWlsID09PSBFTUFJTF9OT1RfRk9VTkQpIHtcbiAgICAgIGluZm8uZW1haWwgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3N0LXByb2Nlc3MgYSB7QGxpbmsgVXNlckluT3JnSW5mb30gcmVzcG9uc2UuIFBvc3QtcHJvY2Vzc2luZyBlbnN1cmVzIHRoYXQgdGhlIGVtYWlsIGZpZWxkIGZvclxuICAgKiB1c2VycyB3aXRob3V0IGFuIGVtYWlsIGlzIHNldCB0byBgbnVsbGAuXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIFRoZSBpbmZvIHRvIHBvc3QtcHJvY2Vzc1xuICAgKiBAcmV0dXJucyBUaGUgcHJvY2Vzc2VkIHVzZXIgaW5mb1xuICAgKi9cbiAgc3RhdGljICNwcm9jZXNzVXNlckluT3JnSW5mbyhpbmZvOiBVc2VySW5PcmdJbmZvKTogVXNlckluT3JnSW5mbyB7XG4gICAgaWYgKGluZm8uZW1haWwgPT09IEVNQUlMX05PVF9GT1VORCkge1xuICAgICAgaW5mby5lbWFpbCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG59XG5cbmNvbnN0IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU6IFNlc3Npb25MaWZldGltZSA9IHtcbiAgc2Vzc2lvbjogNjA0ODAwLCAvLyAxIHdlZWtcbiAgYXV0aDogMzAwLCAvLyA1IG1pblxuICByZWZyZXNoOiA4NjQwMCwgLy8gMSBkYXlcbiAgZ3JhY2U6IDMwLCAvLyBzZWNvbmRzXG59O1xuIl19