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
                path: { org_id: orgId ?? this.sessionMeta.org_id },
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
     * @returns Computed org metrics statistics.
     */
    async orgQueryMetrics(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/metrics", "post");
        return await this.exec(o, { body });
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { path: {}, ...query } }), (r) => r.users.map(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo)), (r) => r.last_evaluated_key);
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
            params: {
                path: { key_id: keyId },
                ...query,
            },
        }), (r) => r.roles, (r) => r.last_evaluated_key);
    }
    /**
     * Update key.
     *
     * @param keyId The ID of the key to update.
     * @param request The JSON request to send to the API server.
     * @returns The JSON response from the API server.
     */
    async keyUpdate(keyId, request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "patch");
        return this.exec(o, {
            params: { path: { key_id: keyId } },
            body: request,
        });
    }
    /**
     * Deletes a key.
     *
     * @param keyId Key id
     */
    async keyDelete(keyId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "delete");
        await this.exec(o, {
            params: { path: { key_id: keyId } },
        });
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
        const policy = (props?.policy ?? null);
        const { keys } = await this.exec(o, {
            body: {
                count,
                chain_id,
                key_type: keyType,
                ...props,
                owner: props?.owner ?? ownerId,
                policy,
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
        const policy = (props?.policy ?? null);
        const { keys } = await this.exec(o, {
            body: {
                derivation_path: derivationPaths,
                mnemonic_id: mnemonicId,
                key_type: keyType,
                ...props,
                policy,
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
        const policy = (props?.policy ?? null);
        const { keys } = await this.exec(o, {
            body: {
                key_types_and_derivation_paths: keyTypesAndDerivationPaths,
                ...props,
                policy,
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { key_type: type, key_owner: owner, search, ...query } } }), (r) => r.keys, (r) => r.last_evaluated_key);
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), () => this.exec(o, { params: { path: { key_id: keyId } } }), (r) => r.txs, (r) => r.last_evaluated_key);
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
     * @returns The updated role information.
     */
    async roleUpdate(roleId, request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "patch");
        return this.exec(o, {
            params: { path: { role_id: roleId } },
            body: request,
        });
    }
    /**
     * Delete a role by its ID.
     *
     * @param roleId The ID of the role to delete.
     */
    async roleDelete(roleId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "delete");
        await this.exec(o, {
            params: { path: { role_id: roleId } },
        });
    }
    /**
     * List all roles in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over roles.
     */
    rolesList(page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles", "get");
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query } }), (r) => r.roles, (r) => r.last_evaluated_key);
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
                policy: (policy ?? null),
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query, path: { role_id: roleId } } }), (r) => r.users, (r) => r.last_evaluated_key);
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { ...selectorQuery, ...query } } }), (r) => r.sessions, (r) => r.last_evaluated_key);
    }
    /**
     * Returns the list of keys that this session has access to.
     *
     * @returns The list of keys.
     */
    async sessionKeysList() {
        return this.keysList().fetchAll();
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
     * @param key The taproot key to sign with (either {@link Key} or its material ID).
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
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpX2NsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYXBpX2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFzREEsa0NBQXlDO0FBQ3pDLGdDQUE4RjtBQUM5RiwwQ0FBOEQ7QUFHOUQsNENBQStDO0FBRS9DLGdEQUFrRDtBQWlEbEQsb0NBQXdDO0FBQ3hDLCtDQUF5RTtBQUN6RSxvQ0FBc0M7QUFFdEM7O0dBRUc7QUFDSCxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztBQXFCMUM7O0dBRUc7QUFDSCxNQUFhLFNBQVUsU0FBUSx3QkFBVTtJQUN2QywwSEFBMEg7SUFFMUg7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWhELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUFBLEVBQVMsc0NBQWlCLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUMzQixHQUFpQixFQUNqQixLQUFhLEVBQ2IsS0FBYTtRQUViLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGlDQUFpQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXhELE9BQU8sTUFBTSxJQUFBLGtCQUFVLEVBQUMsR0FBRyxFQUFFLENBQzNCLENBQUMsQ0FBQztZQUNBLE9BQU8sRUFBRSxHQUFHLENBQUMsYUFBYTtZQUMxQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbkMsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFO1NBQ2hCLENBQUMsQ0FDSCxDQUFDLElBQUksQ0FBQyxnQkFBUSxDQUFD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LENBQ0gsQ0FBQyxJQUFJLENBQUMsZ0JBQVEsQ0FBQyxDQUFDO0lBQ25CLENBQUM7Q0E2QkY7QUF0akVELDhCQXNqRUM7aUZBcEJ5QixJQUFjO0lBQ3BDLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxlQUFlLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLDZFQVM0QixJQUFtQjtJQUM5QyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssZUFBZSxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdILE1BQU0sNEJBQTRCLEdBQW9CO0lBQ3BELE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUztJQUMxQixJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVE7SUFDbkIsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRO0lBQ3hCLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVTtDQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBDcmVhdGVPaWRjVXNlck9wdGlvbnMsXG4gIElkZW50aXR5UHJvb2YsXG4gIEtleUluUm9sZUluZm8sXG4gIEtleUluZm8sXG4gIE9pZGNJZGVudGl0eSxcbiAgUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgUm9sZUluZm8sXG4gIFVwZGF0ZUtleVJlcXVlc3QsXG4gIFVwZGF0ZU9yZ1JlcXVlc3QsXG4gIFVwZGF0ZU9yZ1Jlc3BvbnNlLFxuICBVcGRhdGVSb2xlUmVxdWVzdCxcbiAgVXNlckluT3JnSW5mbyxcbiAgVXNlckluUm9sZUluZm8sXG4gIEdldFVzZXJzSW5PcmdSZXNwb25zZSxcbiAgVXNlckluZm8sXG4gIFNlc3Npb25JbmZvLFxuICBPcmdJbmZvLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlLFxuICBFdm1TaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlc3BvbnNlLFxuICBFdGgyU2lnblJlcXVlc3QsXG4gIEV0aDJTaWduUmVzcG9uc2UsXG4gIEV0aDJTdGFrZVJlcXVlc3QsXG4gIEV0aDJTdGFrZVJlc3BvbnNlLFxuICBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gIEV0aDJVbnN0YWtlUmVzcG9uc2UsXG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgQmxvYlNpZ25SZXNwb25zZSxcbiAgQnRjU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVxdWVzdCxcbiAgQnRjTWVzc2FnZVNpZ25SZXNwb25zZSxcbiAgQnRjTWVzc2FnZVNpZ25SZXF1ZXN0LFxuICBQc2J0U2lnblJlcXVlc3QsXG4gIFBzYnRTaWduUmVzcG9uc2UsXG4gIFNvbGFuYVNpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlcXVlc3QsXG4gIEF2YVNlcmlhbGl6ZWRUeFNpZ25SZXF1ZXN0LFxuICBBdmFUeCxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIE1mYVZvdGUsXG4gIE1lbWJlclJvbGUsXG4gIFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlLFxuICBVc2VyRXhwb3J0SW5pdFJlc3BvbnNlLFxuICBVc2VyRXhwb3J0TGlzdFJlc3BvbnNlLFxuICBFbXB0eSxcbiAgVXNlck9yZ3NSZXNwb25zZSxcbiAgQ3JlYXRlS2V5SW1wb3J0S2V5UmVzcG9uc2UsXG4gIEltcG9ydEtleVJlcXVlc3QsXG59IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IGVuY29kZVRvQmFzZTY0IH0gZnJvbSBcIi4uL3V0aWxcIjtcbmltcG9ydCB7IEFkZEZpZG9DaGFsbGVuZ2UsIE1mYUZpZG9DaGFsbGVuZ2UsIE1mYUVtYWlsQ2hhbGxlbmdlLCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4uL21mYVwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lclJlc3BvbnNlLCBtYXBSZXNwb25zZSB9IGZyb20gXCIuLi9yZXNwb25zZVwiO1xuaW1wb3J0IHR5cGUgeyBLZXksIEtleVR5cGUgfSBmcm9tIFwiLi4va2V5XCI7XG5pbXBvcnQgdHlwZSB7IFBhZ2VPcHRzIH0gZnJvbSBcIi4uL3BhZ2luYXRvclwiO1xuaW1wb3J0IHsgUGFnZSwgUGFnaW5hdG9yIH0gZnJvbSBcIi4uL3BhZ2luYXRvclwiO1xuaW1wb3J0IHR5cGUgeyBLZXlQb2xpY3kgfSBmcm9tIFwiLi4vcm9sZVwiO1xuaW1wb3J0IHsgbG9hZFN1YnRsZUNyeXB0byB9IGZyb20gXCIuLi91c2VyX2V4cG9ydFwiO1xuaW1wb3J0IHR5cGUge1xuICBBZGRJZGVudGl0eVJlcXVlc3QsXG4gIEF2YUNoYWluLFxuICBFbnZJbnRlcmZhY2UsXG4gIEVvdHNDcmVhdGVOb25jZVJlcXVlc3QsXG4gIEVvdHNDcmVhdGVOb25jZVJlc3BvbnNlLFxuICBFb3RzU2lnblJlcXVlc3QsXG4gIEVvdHNTaWduUmVzcG9uc2UsXG4gIEpycGNSZXNwb25zZSxcbiAgSnNvbkFycmF5LFxuICBMaXN0SWRlbnRpdHlSZXNwb25zZSxcbiAgTGlzdEtleVJvbGVzUmVzcG9uc2UsXG4gIExpc3RLZXlzUmVzcG9uc2UsXG4gIExpc3RSb2xlS2V5c1Jlc3BvbnNlLFxuICBMaXN0Um9sZVVzZXJzUmVzcG9uc2UsXG4gIExpc3RSb2xlc1Jlc3BvbnNlLFxuICBNbWlKcnBjTWV0aG9kLFxuICBQZW5kaW5nTWVzc2FnZUluZm8sXG4gIFBlbmRpbmdNZXNzYWdlU2lnblJlc3BvbnNlLFxuICBSYXRjaGV0Q29uZmlnLFxuICBTY29wZSxcbiAgU2Vzc2lvbkRhdGEsXG4gIFNlc3Npb25MaWZldGltZSxcbiAgU2Vzc2lvbnNSZXNwb25zZSxcbiAgVGFwcm9vdFNpZ25SZXF1ZXN0LFxuICBUYXByb290U2lnblJlc3BvbnNlLFxuICBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gIEJhYnlsb25TdGFraW5nUmVzcG9uc2UsXG4gIFVwZGF0ZVVzZXJNZW1iZXJzaGlwUmVxdWVzdCxcbiAgSGlzdG9yaWNhbFR4LFxuICBMaXN0SGlzdG9yaWNhbFR4UmVzcG9uc2UsXG4gIFB1YmxpY09yZ0luZm8sXG4gIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gIFBhc3N3b3JkUmVzZXRSZXF1ZXN0LFxuICBFbWFpbE90cFJlc3BvbnNlLFxuICBBdXRoZW50aWNhdGlvblJlcXVlc3QsXG4gIEF1dGhlbnRpY2F0aW9uUmVzcG9uc2UsXG4gIENyZWF0ZUtleVByb3BlcnRpZXMsXG4gIEludml0YXRpb25BY2NlcHRSZXF1ZXN0LFxuICBNZmFSZWNlaXB0cyxcbiAgU3VpU2lnblJlcXVlc3QsXG4gIFN1aVNpZ25SZXNwb25zZSxcbiAgUXVlcnlNZXRyaWNzUmVxdWVzdCxcbiAgUXVlcnlNZXRyaWNzUmVzcG9uc2UsXG4gIENyZWF0ZU9yZ1JlcXVlc3QsXG4gIEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aCxcbiAgRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG59IGZyb20gXCIuLi9pbmRleFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2ssIG9wIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyBCYXNlQ2xpZW50LCBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvIH0gZnJvbSBcIi4vYmFzZV9jbGllbnRcIjtcbmltcG9ydCB7IHJldHJ5T241WFggfSBmcm9tIFwiLi4vcmV0cnlcIjtcblxuLyoqXG4gKiBTdHJpbmcgcmV0dXJuZWQgYnkgQVBJIHdoZW4gYSB1c2VyIGRvZXMgbm90IGhhdmUgYW4gZW1haWwgYWRkcmVzcyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KVxuICovXG5jb25zdCBFTUFJTF9OT1RfRk9VTkQgPSBcImVtYWlsIG5vdCBmb3VuZFwiO1xuXG4vKipcbiAqIFNlc3Npb24gc2VsZWN0b3IuXG4gKi9cbmV4cG9ydCB0eXBlIFNlc3Npb25TZWxlY3RvciA9XG4gIC8qKlxuICAgKiBTZWxlY3RzIGFsbCBzZXNzaW9ucyB0aWVkIHRvIGEgcm9sZSB3aXRoIHRoaXMgSURcbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVXNlIGB7IHJvbGU6IHN0cmluZyB9YCBpbnN0ZWFkXG4gICAqL1xuICB8IHN0cmluZ1xuICB8IHtcbiAgICAgIC8qKiBTZWxlY3RzIGFsbCBzZXNzaW9ucyB0aWVkIHRvIGEgcm9sZSB3aXRoIHRoaXMgSUQgKi9cbiAgICAgIHJvbGU6IHN0cmluZztcbiAgICB9XG4gIHwge1xuICAgICAgLyoqIFNlbGVjdHMgYWxsIHNlc3Npb25zIHRpZWQgdG8gYSB1c2VyIHdpdGggdGhpcyBJRC4gKi9cbiAgICAgIHVzZXI6IHN0cmluZztcbiAgICB9O1xuXG4vKipcbiAqIEFuIGV4dGVuc2lvbiBvZiBCYXNlQ2xpZW50IHRoYXQgYWRkcyBzcGVjaWFsaXplZCBtZXRob2RzIGZvciBhcGkgZW5kcG9pbnRzXG4gKi9cbmV4cG9ydCBjbGFzcyBBcGlDbGllbnQgZXh0ZW5kcyBCYXNlQ2xpZW50IHtcbiAgLy8gI3JlZ2lvbiBVU0VSUzogdXNlckdldCwgdXNlclRvdHAoUmVzZXRJbml0fFJlc2V0Q29tcGxldGV8VmVyaWZ5fERlbGV0ZSksIHVzZXJGaWRvKFJlZ2lzdGVySW5pdHxSZWdpc3RlckNvbXBsZXRlfERlbGV0ZSlcblxuICAvKipcbiAgICogQHJldHVybnMgSW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICovXG4gIGFzeW5jIHVzZXJHZXQoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge30pLnRoZW4oQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlcyBsb2dpbiB2aWEgRW1haWwgT1RQLlxuICAgKiBSZXR1cm5zIGFuIHVuc2lnbmVkIE9JREMgdG9rZW4gYW5kIHNlbmRzIGFuIGVtYWlsIHRvIHRoZSB1c2VyIGNvbnRhaW5pbmcgdGhlIHNpZ25hdHVyZSBvZiB0aGF0IHRva2VuLlxuICAgKiBUaGUgT0lEQyB0b2tlbiBjYW4gYmUgcmVjb25zdHJ1Y3RlZCBieSBhcHBlbmRpbmcgdGhlIHNpZ25hdHVyZSB0byB0aGUgcGFydGlhbCB0b2tlbiBsaWtlIHNvOlxuICAgKlxuICAgKiB0b2tlbiA9IHBhcnRpYWxfdG9rZW4gKyBzaWduYXR1cmVcbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gdXNlXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGxvZ2luIHRvXG4gICAqIEBwYXJhbSBlbWFpbCBUaGUgZW1haWwgdG8gc2VuZCB0aGUgc2lnbmF0dXJlIHRvXG4gICAqIEByZXR1cm5zIFRoZSBwYXJ0aWFsIE9JREMgdG9rZW4gdGhhdCBtdXN0IGJlIGNvbWJpbmVkIHdpdGggdGhlIHNpZ25hdHVyZSBpbiB0aGUgZW1haWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpbml0RW1haWxPdHBBdXRoKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgZW1haWw6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxFbWFpbE90cFJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9vaWRjL2VtYWlsLW90cFwiLCBcInBvc3RcIik7XG5cbiAgICByZXR1cm4gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogeyBlbWFpbCB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIFRPVFAuIFJldHVybnMgYSB7QGxpbmsgVG90cENoYWxsZW5nZX1cbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGVpdGhlciBieSBjYWxsaW5nIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0gKG9yXG4gICAqIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBSZXNldENvbXBsZXRlfSkuXG4gICAqXG4gICAqIEBwYXJhbSBpc3N1ZXIgT3B0aW9uYWwgaXNzdWVyOyBkZWZhdWx0cyB0byBcIkN1YmlzdFwiXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEEgVE9UUCBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkXG4gICAqL1xuICBhc3luYyB1c2VyVG90cFJlc2V0SW5pdChcbiAgICBpc3N1ZXI/OiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxUb3RwQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCByZXNldFRvdHBGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBpc3N1ZXJcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgaXNzdWVyLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKGRhdGEsICh0b3RwSW5mbykgPT4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcywgdG90cEluZm8pKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXNldFRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHVzZXJUb3RwUmVzZXRJbml0fS4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB0b3RwSWQgVGhlIElEIG9mIHRoZSBUT1RQIGNoYWxsZW5nZVxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlIHRoYXQgc2hvdWxkIHZlcmlmeSBhZ2FpbnN0IHRoZSBUT1RQIGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBSZXNldENvbXBsZXRlKHRvdHBJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCBcInBhdGNoXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7IHRvdHBfaWQ6IHRvdHBJZCwgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvZGUgQ3VycmVudCBUT1RQIGNvZGVcbiAgICogQHRocm93cyBBbiBlcnJvciBpZiB2ZXJpZmljYXRpb24gZmFpbHNcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwVmVyaWZ5KGNvZGU6IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwL3ZlcmlmeVwiLCBcInBvc3RcIik7XG5cbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIFRPVFAgZnJvbSB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIEFsbG93ZWQgb25seSBpZiBhdCBsZWFzdCBvbmUgRklETyBrZXkgaXMgcmVnaXN0ZXJlZCB3aXRoIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogTUZBIHZpYSBGSURPIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwRGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIFwiZGVsZXRlXCIpO1xuICAgIGNvbnN0IGRlbGV0ZVRvdHBGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgZGVsZXRlVG90cEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhZGRpbmcgYSBuZXcgRklETyBkZXZpY2UuIE1GQSBtYXkgYmUgcmVxdWlyZWQuICBUaGlzIHJldHVybnMgYSB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZX1cbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIHdpdGgge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvciB7QGxpbmsgdXNlckZpZG9SZWdpc3RlckNvbXBsZXRlfVxuICAgKiAoYWZ0ZXIgTUZBIGFwcHJvdmFscykuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBuZXcgZGV2aWNlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgaW4gb3JkZXIgdG8gY29tcGxldGUgRklETyByZWdpc3RyYXRpb24uXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb1JlZ2lzdGVySW5pdChcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBZGRGaWRvQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBhZGRGaWRvRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogeyBuYW1lIH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAoYykgPT4gbmV3IEFkZEZpZG9DaGFsbGVuZ2UodGhpcywgYykpO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGFkZEZpZG9GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCAodmlhIHtAbGluayB1c2VyRmlkb1JlZ2lzdGVySW5pdH0pIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gY2hhbGxlbmdlSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqIEBwYXJhbSBjcmVkZW50aWFsIFRoZSBhbnN3ZXIgdG8gdGhlIGNoYWxsZW5nZS5cbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZShcbiAgICBjaGFsbGVuZ2VJZDogc3RyaW5nLFxuICAgIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gICk6IFByb21pc2U8RW1wdHk+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSBmaWRvSWQgVGhlIElEIG9mIHRoZSBkZXNpcmVkIEZJRE8ga2V5XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb0RlbGV0ZShcbiAgICBmaWRvSWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IGRlbGV0ZUZpZG9GbiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvL3tmaWRvX2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGZpZG9faWQ6IGZpZG9JZCB9IH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBkZWxldGVGaWRvRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHUzogb3JnR2V0LCBvcmdVcGRhdGUsIG9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwLCBvcmdDcmVhdGVPcmcsIG9yZ1F1ZXJ5TWV0cmljc1xuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnXG4gICAqXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGdldCBpbmZvIGZvclxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgYXN5bmMgb3JnR2V0KG9yZ0lkPzogc3RyaW5nKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IG9yZ19pZDogb3JnSWQgPz8gdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybnMgVXBkYXRlZCBvcmcgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdVcGRhdGUocmVxdWVzdDogVXBkYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8VXBkYXRlT3JnUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIFwicGF0Y2hcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHsgYm9keTogcmVxdWVzdCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdXNlcidzIG1lbWJlcnNoaXAgaW4gdGhpcyBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0gcmVxIFRoZSB1cGRhdGUgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIHVzZXIgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgb3JnVXBkYXRlVXNlck1lbWJlcnNoaXAoXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgcmVxOiBVcGRhdGVVc2VyTWVtYmVyc2hpcFJlcXVlc3QsXG4gICk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9L21lbWJlcnNoaXBcIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHVzZXJfaWQ6IHVzZXJJZCB9IH0sXG4gICAgICBib2R5OiByZXEsXG4gICAgfSkudGhlbihBcGlDbGllbnQuI3Byb2Nlc3NVc2VySW5PcmdJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgb3JnYW5pemF0aW9uLiBUaGUgbmV3IG9yZyBpcyBhIGNoaWxkIG9mIHRoZVxuICAgKiBjdXJyZW50IG9yZyBhbmQgaW5oZXJpdHMgaXRzIGtleS1leHBvcnQgcG9saWN5LiBUaGUgbmV3IG9yZ1xuICAgKiBpcyBjcmVhdGVkIHdpdGggb25lIG93bmVyLCB0aGUgY2FsbGVyIG9mIHRoaXMgQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBUaGUgZGV0YWlscyBvZiB0aGUgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBUaGUgbmV3IG9yZ2FuaXphdGlvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgb3JnQ3JlYXRlT3JnKGJvZHk6IENyZWF0ZU9yZ1JlcXVlc3QpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29yZ3NcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBUaGUgcXVlcnlcbiAgICogQHJldHVybnMgQ29tcHV0ZWQgb3JnIG1ldHJpY3Mgc3RhdGlzdGljcy5cbiAgICovXG4gIGFzeW5jIG9yZ1F1ZXJ5TWV0cmljcyhib2R5OiBRdWVyeU1ldHJpY3NSZXF1ZXN0KTogUHJvbWlzZTxRdWVyeU1ldHJpY3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWV0cmljc1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7IGJvZHkgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBPUkcgVVNFUlM6IG9yZ1VzZXJJbnZpdGUsIG9yZ1VzZXJEZWxldGUsIG9yZ1VzZXJzTGlzdCwgb3JnVXNlckdldCwgb3JnVXNlckNyZWF0ZU9pZGMsIG9yZ1VzZXJEZWxldGVPaWRjXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyAoZmlyc3QtcGFydHkpIHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZCBhbiBlbWFpbCBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIGVtYWlsIEVtYWlsIG9mIHRoZSB1c2VyXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBmdWxsIG5hbWUgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIHJvbGUgT3B0aW9uYWwgcm9sZS4gRGVmYXVsdHMgdG8gXCJhbGllblwiLlxuICAgKiBAcGFyYW0gc2tpcEVtYWlsIE9wdGlvbmFsbHkgc2tpcCBzZW5kaW5nIHRoZSBpbnZpdGUgZW1haWwuXG4gICAqL1xuICBhc3luYyBvcmdVc2VySW52aXRlKFxuICAgIGVtYWlsOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHJvbGU/OiBNZW1iZXJSb2xlLFxuICAgIHNraXBFbWFpbD86IGJvb2xlYW4sXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW52aXRlXCIsIFwicG9zdFwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lLFxuICAgICAgICByb2xlLFxuICAgICAgICBza2lwX2VtYWlsOiAhIXNraXBFbWFpbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHRoZSB1c2VyIGZyb20gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlLlxuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckRlbGV0ZSh1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8RW1wdHk+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzL3t1c2VyX2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHtcbiAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdXNlcnMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHVzZXJzIGluIHRoZSBvcmcuXG4gICAqL1xuICBvcmdVc2Vyc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPEdldFVzZXJzSW5PcmdSZXNwb25zZSwgVXNlckluT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBwYXRoOiB7fSwgLi4ucXVlcnkgfSB9KSxcbiAgICAgIChyKSA9PiByLnVzZXJzLm1hcChBcGlDbGllbnQuI3Byb2Nlc3NVc2VySW5PcmdJbmZvKSxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IGlkLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBnZXQuXG4gICAqIEByZXR1cm5zIE9yZyB1c2VyLlxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckdldCh1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZ2V0XCIpO1xuXG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbk9yZ0luZm8ocmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMgdXNlci4gVGhpcyBjYW4gYmUgYSBmaXJzdC1wYXJ0eSBcIk1lbWJlclwiIG9yIHRoaXJkLXBhcnR5IFwiQWxpZW5cIi5cbiAgICpcbiAgICogQHBhcmFtIGlkZW50aXR5T3JQcm9vZiBUaGUgaWRlbnRpdHkgb3IgaWRlbnRpdHkgcHJvb2Ygb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0gb3B0cyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIG5ldyBPSURDIHVzZXJzXG4gICAqIEByZXR1cm5zIFVzZXIgaWQgb2YgdGhlIG5ldyB1c2VyXG4gICAqL1xuICBhc3luYyBvcmdVc2VyQ3JlYXRlT2lkYyhcbiAgICBpZGVudGl0eU9yUHJvb2Y6IE9pZGNJZGVudGl0eSB8IElkZW50aXR5UHJvb2YsXG4gICAgZW1haWw/OiBzdHJpbmcgfCBudWxsLFxuICAgIG9wdHM6IENyZWF0ZU9pZGNVc2VyT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnNcIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgaWRlbnRpdHlPclByb29mRmllbGRzID1cbiAgICAgIFwiaWRcIiBpbiBpZGVudGl0eU9yUHJvb2YgPyB7IHByb29mOiBpZGVudGl0eU9yUHJvb2YgfSA6IHsgaWRlbnRpdHk6IGlkZW50aXR5T3JQcm9vZiB9O1xuXG4gICAgY29uc3QgeyB1c2VyX2lkIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICByb2xlOiBvcHRzLm1lbWJlclJvbGUgPz8gXCJBbGllblwiLFxuICAgICAgICBlbWFpbCxcbiAgICAgICAgbmFtZTogb3B0cy5uYW1lLFxuICAgICAgICBtZmFfcG9saWN5OiBvcHRzLm1mYVBvbGljeSxcbiAgICAgICAgLi4uaWRlbnRpdHlPclByb29mRmllbGRzLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiB1c2VyX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyBPSURDIHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSBpZGVudGl0eSBUaGUgaWRlbnRpdHkgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckRlbGV0ZU9pZGMoaWRlbnRpdHk6IE9pZGNJZGVudGl0eSk6IFByb21pc2U8RW1wdHk+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzL29pZGNcIiwgXCJkZWxldGVcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IGlkZW50aXR5LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gS0VZUzoga2V5R2V0LCBrZXlVcGRhdGUsIGtleURlbGV0ZSwga2V5c0NyZWF0ZSwga2V5c0Rlcml2ZSwga2V5c0xpc3QsIGtleUhpc3RvcnlcblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGtleUdldChrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIHR5cGUgYW5kIG1hdGVyaWFsIGlkLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUga2V5IHR5cGUuXG4gICAqIEBwYXJhbSBtYXRlcmlhbElkIFRoZSBtYXRlcmlhbCBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGtleUdldEJ5TWF0ZXJpYWxJZChrZXlUeXBlOiBLZXlUeXBlLCBtYXRlcmlhbElkOiBzdHJpbmcpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV90eXBlfS97bWF0ZXJpYWxfaWR9XCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfdHlwZToga2V5VHlwZSwgbWF0ZXJpYWxfaWQ6IG1hdGVyaWFsSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHJvbGVzIGEga2V5IGlzIGluLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgcm9sZXMgYSBrZXkgaXMgaW4uXG4gICAqL1xuICBrZXlSb2xlc0xpc3Qoa2V5SWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RLZXlSb2xlc1Jlc3BvbnNlLCBLZXlJblJvbGVJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9L3JvbGVzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PlxuICAgICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0sXG4gICAgICAgICAgICAuLi5xdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLnJvbGVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBJRCBvZiB0aGUga2V5IHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJucyBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKi9cbiAgYXN5bmMga2V5VXBkYXRlKGtleUlkOiBzdHJpbmcsIHJlcXVlc3Q6IFVwZGF0ZUtleVJlcXVlc3QpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJwYXRjaFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBLZXkgaWRcbiAgICovXG4gIGFzeW5jIGtleURlbGV0ZShrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBrZXkgcHJvcGVydGllc1xuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzQ3JlYXRlKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBvd25lcklkPzogc3RyaW5nLFxuICAgIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBjaGFpbl9pZCA9IDA7IC8vIG5vdCB1c2VkIGFueW1vcmVcblxuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5c1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBwb2xpY3kgPSAocHJvcHM/LnBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGw7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBjb3VudCxcbiAgICAgICAgY2hhaW5faWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgb3duZXI6IHByb3BzPy5vd25lciA/PyBvd25lcklkLFxuICAgICAgICBwb2xpY3ksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIHNldCBvZiBrZXlzIG9mIGEgc3BlY2lmaWVkIHR5cGUgdXNpbmcgYSBzdXBwbGllZCBkZXJpdmF0aW9uIHBhdGggYW5kIGFuIGV4aXN0aW5nIGxvbmctbGl2ZWQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gZGVyaXZhdGlvblBhdGhzIERlcml2YXRpb24gcGF0aHMgZnJvbSB3aGljaCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqIEBwYXJhbSBtbmVtb25pY0lkIG1hdGVyaWFsX2lkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNEZXJpdmUoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9kZXJpdmVfa2V5XCIsIFwicHV0XCIpO1xuXG4gICAgY29uc3QgcG9saWN5ID0gKHByb3BzPy5wb2xpY3kgPz8gbnVsbCkgYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfCBudWxsO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZGVyaXZhdGlvbl9wYXRoOiBkZXJpdmF0aW9uUGF0aHMsXG4gICAgICAgIG1uZW1vbmljX2lkOiBtbmVtb25pY0lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgIHBvbGljeSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2UgZWl0aGVyIGEgbmV3IG9yIGV4aXN0aW5nIG1uZW1vbmljIHRvIGRlcml2ZSBrZXlzIG9mIG9uZSBvciBtb3JlXG4gICAqIHNwZWNpZmllZCB0eXBlcyB2aWEgc3BlY2lmaWVkIGRlcml2YXRpb24gcGF0aHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyBBIGxpc3Qgb2Ygb2JqZWN0cyBzcGVjaWZ5aW5nIHRoZSBrZXlzIHRvIGJlIGRlcml2ZWRcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgZGVyaXZhdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNEZXJpdmVNdWx0aShcbiAgICBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRoczogS2V5VHlwZUFuZERlcml2YXRpb25QYXRoW10sXG4gICAgcHJvcHM/OiBEZXJpdmVNdWx0aXBsZUtleVR5cGVzUHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2Rlcml2ZV9rZXlzXCIsIFwicHV0XCIpO1xuXG4gICAgY29uc3QgcG9saWN5ID0gKHByb3BzPy5wb2xpY3kgPz8gbnVsbCkgYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W10gfCBudWxsO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAga2V5X3R5cGVzX2FuZF9kZXJpdmF0aW9uX3BhdGhzOiBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyxcbiAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgIHBvbGljeSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHBhcmFtIG93bmVyIE9wdGlvbmFsIGtleSBvd25lciB0byBmaWx0ZXIgbGlzdCBmb3IuXG4gICAqIEBwYXJhbSBzZWFyY2ggT3B0aW9uYWxseSBzZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgSUQgYW5kIG1ldGFkYXRhXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIga2V5cy5cbiAgICovXG4gIGtleXNMaXN0KFxuICAgIHR5cGU/OiBLZXlUeXBlLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBvd25lcj86IHN0cmluZyxcbiAgICBzZWFyY2g/OiBzdHJpbmcsXG4gICk6IFBhZ2luYXRvcjxMaXN0S2V5c1Jlc3BvbnNlLCBLZXlJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PlxuICAgICAgICB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcXVlcnk6IHsga2V5X3R5cGU6IHR5cGUsIGtleV9vd25lcjogb3duZXIsIHNlYXJjaCwgLi4ucXVlcnkgfSB9IH0pLFxuICAgICAgKHIpID0+IHIua2V5cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcmVjZW50IGhpc3RvcmljYWwga2V5IHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBrZXkgaWQuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGhpc3RvcmljYWwgdHJhbnNhY3Rpb25zLlxuICAgKi9cbiAga2V5SGlzdG9yeShrZXlJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdEhpc3RvcmljYWxUeFJlc3BvbnNlLCBIaXN0b3JpY2FsVHg+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vdHhcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKCkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9IH0gfSksXG4gICAgICAocikgPT4gci50eHMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEVTOiByb2xlQ3JlYXRlLCByb2xlUmVhZCwgcm9sZVVwZGF0ZSwgcm9sZURlbGV0ZSwgcm9sZXNMaXN0XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVDcmVhdGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IG5hbWUgPyB7IG5hbWUgfSA6IHVuZGVmaW5lZCxcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpdHMgaWQgKG9yIG5hbWUpLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUdldChyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSB1cGRhdGUgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIHJvbGVVcGRhdGUocm9sZUlkOiBzdHJpbmcsIHJlcXVlc3Q6IFVwZGF0ZVJvbGVSZXF1ZXN0KTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSByb2xlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUgdG8gZGVsZXRlLlxuICAgKi9cbiAgYXN5bmMgcm9sZURlbGV0ZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgcm9sZXMuXG4gICAqL1xuICByb2xlc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlc1Jlc3BvbnNlLCBSb2xlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PiB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcXVlcnkgfSB9KSxcbiAgICAgIChyKSA9PiByLnJvbGVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFIEtFWVM6IHJvbGVLZXlzQWRkLCByb2xlS2V5c0RlbGV0ZSwgcm9sZUtleXNMaXN0XG5cbiAgLyoqXG4gICAqIEFkZCBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlXG4gICAqIEBwYXJhbSBrZXlJZHMgVGhlIElEcyBvZiB0aGUga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byBlYWNoIGtleS5cbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzQWRkKHJvbGVJZDogc3RyaW5nLCBrZXlJZHM6IHN0cmluZ1tdLCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfa2V5c1wiLCBcInB1dFwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBrZXlfaWRzOiBrZXlJZHMsXG4gICAgICAgIHBvbGljeTogKHBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGVcbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIGtleXMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSBrZXlzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUga2V5cyBpbiB0aGUgcm9sZS5cbiAgICovXG4gIHJvbGVLZXlzTGlzdChyb2xlSWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlS2V5c1Jlc3BvbnNlLCBLZXlJblJvbGVJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5c1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0sXG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEUgVVNFUlM6IHJvbGVVc2VyQWRkLCByb2xlVXNlclJlbW92ZSwgcm9sZVVzZXJzTGlzdFxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJBZGQocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vYWRkX3VzZXIve3VzZXJfaWR9XCIsIFwicHV0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVVc2VyUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3VzZXJzL3t1c2VyX2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQsIHVzZXJfaWQ6IHVzZXJJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSB1c2VycyB0byByZXRyaWV2ZS5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHVzZXJzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZVVzZXJzTGlzdChyb2xlSWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS91c2Vyc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5LCBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0gfSksXG4gICAgICAocikgPT4gci51c2VycyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0VTU0lPTlM6IHNlc3Npb24oQ3JlYXRlfENyZWF0ZUZvclJvbGV8UmVmcmVzaHxSZXZva2V8TGlzdHxLZXlzTGlzdClcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybnMgTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlKFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBzY29wZXM6IFNjb3BlW10sXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgbGlmZXRpbWVzID8/PSBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lO1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcHVycG9zZSxcbiAgICAgICAgc2NvcGVzLFxuICAgICAgICBhdXRoX2xpZmV0aW1lOiBsaWZldGltZXMuYXV0aCxcbiAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWVzLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IGxpZmV0aW1lcy5zZXNzaW9uLFxuICAgICAgICBncmFjZV9saWZldGltZTogbGlmZXRpbWVzLmdyYWNlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBkYXRhLCB7XG4gICAgICBwdXJwb3NlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKSB3aG9zZSBsaWZldGltZSBwb3RlbnRpYWxseVxuICAgKiBleHRlbmRzIHRoZSBsaWZldGltZSBvZiB0aGUgY3VycmVudCBzZXNzaW9uLiAgTUZBIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy5cbiAgICogQHBhcmFtIGxpZmV0aW1lIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBOZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGVFeHRlbmRlZChcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBTY29wZVtdLFxuICAgIGxpZmV0aW1lOiBTZXNzaW9uTGlmZXRpbWUsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcmVxdWVzdEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICBleHRlbmRfbGlmZXRpbWVzOiB0cnVlLFxuICAgICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lLmF1dGgsXG4gICAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWUucmVmcmVzaCxcbiAgICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZS5zZXNzaW9uLFxuICAgICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZS5ncmFjZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKHJlc3AsIChzZXNzaW9uSW5mbykgPT5cbiAgICAgICAgc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBzZXNzaW9uSW5mbywge1xuICAgICAgICAgIHB1cnBvc2UsXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXF1ZXN0Rm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbiBmb3IgYSBnaXZlbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gTm90IGFsbCBzY29wZXMgYXJlIHZhbGlkIGZvciBhIHJvbGUuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybnMgTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlRm9yUm9sZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzPzogU2NvcGVbXSxcbiAgICBsaWZldGltZXM/OiBTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBsaWZldGltZXMgPz89IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIHB1cnBvc2UsXG4gICAgICAgIHNjb3BlcyxcbiAgICAgICAgYXV0aF9saWZldGltZTogbGlmZXRpbWVzLmF1dGgsXG4gICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IGxpZmV0aW1lcy5yZWZyZXNoLFxuICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZXMuc2Vzc2lvbixcbiAgICAgICAgZ3JhY2VfbGlmZXRpbWU6IGxpZmV0aW1lcy5ncmFjZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBkYXRhLCB7XG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgICBwdXJwb3NlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhIHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uSWQgVGhlIElEIG9mIHRoZSBzZXNzaW9uIHRvIHJldm9rZS4gVGhpcyBzZXNzaW9uIGJ5IGRlZmF1bHRcbiAgICovXG4gIGFzeW5jIHNlc3Npb25SZXZva2Uoc2Vzc2lvbklkPzogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uL3tzZXNzaW9uX2lkfVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgc2Vzc2lvbl9pZDogc2Vzc2lvbklkID8/IFwic2VsZlwiIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgYWxsIHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgV2hpY2ggc2Vzc2lvbnMgdG8gcmV2b2tlLiBJZiBub3QgZGVmaW5lZCwgYWxsIHRoZSBjdXJyZW50IHVzZXIncyBzZXNzaW9ucyB3aWxsIGJlIHJldm9rZWQuXG4gICAqL1xuICBhc3luYyBzZXNzaW9uUmV2b2tlQWxsKHNlbGVjdG9yPzogU2Vzc2lvblNlbGVjdG9yKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZGVsZXRlXCIpO1xuICAgIGNvbnN0IHF1ZXJ5ID0gdHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiID8geyByb2xlOiBzZWxlY3RvciB9IDogc2VsZWN0b3I7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBxdWVyeSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGFsbCBzaWduZXIgc2Vzc2lvbnMgb3B0aW9uYWxseSBmaWx0ZXJlZCBieSBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBzZWxlY3RvciBJZiBzZXQsIGxpbWl0IHRvIHNlc3Npb25zIGZvciBhIHNwZWNpZmllZCB1c2VyIG9yIGEgcm9sZS5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgc2Vzc2lvbnNMaXN0KFxuICAgIHNlbGVjdG9yPzogU2Vzc2lvblNlbGVjdG9yLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPFNlc3Npb25zUmVzcG9uc2UsIFNlc3Npb25JbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZ2V0XCIpO1xuICAgIGNvbnN0IHNlbGVjdG9yUXVlcnkgPSB0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIgPyB7IHJvbGU6IHNlbGVjdG9yIH0gOiBzZWxlY3RvcjtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeTogeyAuLi5zZWxlY3RvclF1ZXJ5LCAuLi5xdWVyeSB9IH0gfSksXG4gICAgICAocikgPT4gci5zZXNzaW9ucyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxpc3Qgb2Yga2V5cyB0aGF0IHRoaXMgc2Vzc2lvbiBoYXMgYWNjZXNzIHRvLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBrZXlzLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbktleXNMaXN0KCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgcmV0dXJuIHRoaXMua2V5c0xpc3QoKS5mZXRjaEFsbCgpO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gSURFTlRJVFk6IGlkZW50aXR5UHJvdmUsIGlkZW50aXR5VmVyaWZ5LCBpZGVudGl0eUFkZCwgaWRlbnRpdHlSZW1vdmUsIGlkZW50aXR5TGlzdFxuXG4gIC8qKlxuICAgKiBPYnRhaW4gcHJvb2Ygb2YgYXV0aGVudGljYXRpb24gdXNpbmcgdGhlIGN1cnJlbnQgQ3ViZVNpZ25lciBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlQcm92ZSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlXCIsIFwicG9zdFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0gcHJvb2YgVGhlIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKiBAdGhyb3dzIEFuIGVycm9yIGlmIHByb29mIGlzIGludmFsaWRcbiAgICovXG4gIGFzeW5jIGlkZW50aXR5VmVyaWZ5KHByb29mOiBJZGVudGl0eVByb29mKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS92ZXJpZnlcIiwgXCJwb3N0XCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiBwcm9vZixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NvY2lhdGVzIGFuIE9JREMgaWRlbnRpdHkgd2l0aCB0aGUgY3VycmVudCB1c2VyJ3MgYWNjb3VudC5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keSwgY29udGFpbmluZyBhbiBPSURDIHRva2VuIHRvIHByb3ZlIHRoZSBpZGVudGl0eSBvd25lcnNoaXAuXG4gICAqL1xuICBhc3luYyBpZGVudGl0eUFkZChib2R5OiBBZGRJZGVudGl0eVJlcXVlc3QpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gT0lEQyBpZGVudGl0eSBmcm9tIHRoZSBjdXJyZW50IHVzZXIncyBhY2NvdW50LlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBUaGUgaWRlbnRpdHkgdG8gcmVtb3ZlLlxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlSZW1vdmUoYm9keTogT2lkY0lkZW50aXR5KSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIGFzc29jaWF0ZWQgT0lEQyBpZGVudGl0aWVzIHdpdGggdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybnMgQXNzb2NpYXRlZCBpZGVudGl0aWVzXG4gICAqL1xuICBhc3luYyBpZGVudGl0eUxpc3QoKTogUHJvbWlzZTxMaXN0SWRlbnRpdHlSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHlcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNRkE6IG1mYUdldCwgbWZhTGlzdCwgbWZhQXBwcm92ZSwgbWZhTGlzdCwgbWZhQXBwcm92ZSwgbWZhQXBwcm92ZVRvdHAsIG1mYUFwcHJvdmVGaWRvKEluaXR8Q29tcGxldGUpLCBtZmFWb3RlRW1haWwoSW5pdHxDb21wbGV0ZSlcblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgTUZBIHJlcXVlc3QgSURcbiAgICogQHJldHVybnMgTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhXCIsIFwiZ2V0XCIpO1xuXG4gICAgY29uc3QgeyBtZmFfcmVxdWVzdHMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gICAgcmV0dXJuIG1mYV9yZXF1ZXN0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFWb3RlQ3MobWZhSWQ6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgSUQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYVZvdGVUb3RwKG1mYUlkOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS90b3RwXCIsIFwicGF0Y2hcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwgb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgRklETy4gQSBjaGFsbGVuZ2UgaXNcbiAgICogcmV0dXJuZWQgd2hpY2ggbXVzdCBiZSBhbnN3ZXJlZCB2aWEge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvciB7QGxpbmsgbWZhVm90ZUZpZG9Db21wbGV0ZX0uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSUQuXG4gICAqIEByZXR1cm5zIEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgbWZhRmlkb0luaXQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhRmlkb0NoYWxsZW5nZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2ZpZG9cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgY2hhbGxlbmdlID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBNZmFGaWRvQ2hhbGxlbmdlKHRoaXMsIG1mYUlkLCBjaGFsbGVuZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgbWZhRmlkb0luaXR9KSBNRkEgcmVxdWVzdCB1c2luZyBGSURPLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElEXG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0gY2hhbGxlbmdlSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2UgaXNzdWVkIGJ5IHtAbGluayBtZmFGaWRvSW5pdH1cbiAgICogQHBhcmFtIGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBtZmFWb3RlRmlkb0NvbXBsZXRlKFxuICAgIG1mYUlkOiBzdHJpbmcsXG4gICAgbWZhVm90ZTogTWZhVm90ZSxcbiAgICBjaGFsbGVuZ2VJZDogc3RyaW5nLFxuICAgIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gICk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9maWRvXCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY2hhbGxlbmdlX2lkOiBjaGFsbGVuZ2VJZCxcbiAgICAgICAgY3JlZGVudGlhbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgTUZBIGFwcHJvdmFsIHZpYSBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSURcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUVtYWlsSW5pdChtZmFJZDogc3RyaW5nLCBtZmFWb3RlOiBNZmFWb3RlKTogUHJvbWlzZTxNZmFFbWFpbENoYWxsZW5nZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2VtYWlsXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBjaGFsbGVuZ2UgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBNZmFFbWFpbENoYWxsZW5nZSh0aGlzLCBtZmFJZCwgY2hhbGxlbmdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIG1mYVZvdGVFbWFpbEluaXR9KSBNRkEgdm90ZSByZXF1ZXN0IHVzaW5nIGVtYWlsIE9UUC5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIE1mYUVtYWlsQ2hhbGxlbmdlLmFuc3dlcn0gb3JcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSURcbiAgICogQHBhcmFtIHBhcnRpYWxUb2tlbiBUaGUgcGFydGlhbCB0b2tlbiByZXR1cm5lZCBieSB7QGxpbmsgbWZhVm90ZUVtYWlsSW5pdH1cbiAgICogQHBhcmFtIHNpZ25hdHVyZSBUaGUgb25lLXRpbWUgY29kZSAoc2lnbmF0dXJlIGluIHRoaXMgY2FzZSkgc2VudCB2aWEgZW1haWxcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIG1mYVZvdGVFbWFpbENvbXBsZXRlKFxuICAgIG1mYUlkOiBzdHJpbmcsXG4gICAgcGFydGlhbFRva2VuOiBzdHJpbmcsXG4gICAgc2lnbmF0dXJlOiBzdHJpbmcsXG4gICk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9lbWFpbFwiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgICBib2R5OiB7IHRva2VuOiBgJHtwYXJ0aWFsVG9rZW59JHtzaWduYXR1cmV9YCB9LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0lHTjogc2lnbkV2bSwgc2lnbkV0aDIsIHNpZ25TdGFrZSwgc2lnblVuc3Rha2UsIHNpZ25BdmEsIHNpZ25TZXJpYWxpemVkQXZhLCBzaWduQmxvYiwgc2lnbkJ0Yywgc2lnblRhcHJvb3QsIHNpZ25Tb2xhbmEsIHNpZ25Fb3RzLCBlb3RzQ3JlYXRlTm9uY2UsIHNpZ25NbWksIHNpZ25TdWlcblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV2bVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtMTkxIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXAxOTFTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRWlwMTkxU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2V2bS9laXAxOTEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTcxMiB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwNzEyU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDcxMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVpcDcxMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9ldm0vZWlwNzEyL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHZhbGlkYXRpb24gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU3Rha2UoXG4gICAgcmVxOiBFdGgyU3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlN0YWtlUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3N0YWtlXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHVuc3Rha2UvZXhpdCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblVuc3Rha2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyVW5zdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMi91bnN0YWtlL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gQXZhbGFuY2hlIFAtIG9yIFgtY2hhaW4gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB0eCBBdmFsYW5jaGUgbWVzc2FnZSAodHJhbnNhY3Rpb24pIHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICB0eDogQXZhVHgsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBdmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiA8QXZhU2lnblJlcXVlc3Q+e1xuICAgICAgICAgIHR4OiB0eCBhcyB1bmtub3duLFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHNlcmlhbGl6ZWQgQXZhbGFuY2hlIEMtLCBQLSwgb3IgWC1jaGFpbiBtZXNzYWdlLiBTZWUgW3RoZSBBdmFsYW5jaGVcbiAgICogZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2NzLmF2YXgubmV0d29yay9yZWZlcmVuY2Uvc3RhbmRhcmRzL3NlcmlhbGl6YXRpb24tcHJpbWl0aXZlcylcbiAgICogZm9yIHRoZSBzcGVjaWZpY2F0aW9uIG9mIHRoZSBzZXJpYWxpemF0aW9uIGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSBhdmFDaGFpbiBBdmFsYW5jaGUgY2hhaW5cbiAgICogQHBhcmFtIHR4IEhleCBlbmNvZGVkIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TZXJpYWxpemVkQXZhKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIGF2YUNoYWluOiBBdmFDaGFpbixcbiAgICB0eDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QXZhU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYXZhL3NpZ24ve2F2YV9jaGFpbn0ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgYXZhX2NoYWluOiBhdmFDaGFpbiwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogPEF2YVNlcmlhbGl6ZWRUeFNpZ25SZXF1ZXN0PntcbiAgICAgICAgICB0eCxcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSByYXcgYmxvYi5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LiBUaGlzIGlzIGJlY2F1c2VcbiAgICogc2lnbmluZyBhcmJpdHJhcnkgbWVzc2FnZXMgaXMsIGluIGdlbmVyYWwsIGRhbmdlcm91cyAoYW5kIHlvdSBzaG91bGQgaW5zdGVhZFxuICAgKiBwcmVmZXIgdHlwZWQgZW5kLXBvaW50cyBhcyB1c2VkIGJ5LCBmb3IgZXhhbXBsZSwge0BsaW5rIHNpZ25Fdm19KS4gRm9yIFNlY3AyNTZrMSBrZXlzLFxuICAgKiBmb3IgZXhhbXBsZSwgeW91ICoqbXVzdCoqIGNhbGwgdGhpcyBmdW5jdGlvbiB3aXRoIGEgbWVzc2FnZSB0aGF0IGlzIDMyIGJ5dGVzIGxvbmcgYW5kXG4gICAqIHRoZSBvdXRwdXQgb2YgYSBzZWN1cmUgaGFzaCBmdW5jdGlvbi5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHNpZ25hdHVyZXMgc2VyaWFsaXplZCBhcztcbiAgICpcbiAgICogLSBFQ0RTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGFzIGJpZy1lbmRpYW4gciBhbmQgcyBwbHVzIHJlY292ZXJ5LWlkXG4gICAqICAgIGJ5dGUgdiwgd2hpY2ggY2FuIGluIGdlbmVyYWwgdGFrZSBhbnkgb2YgdGhlIHZhbHVlcyAwLCAxLCAyLCBvciAzLlxuICAgKlxuICAgKiAtIEVkRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgaW4gdGhlIHN0YW5kYXJkIGZvcm1hdC5cbiAgICpcbiAgICogLSBCTFMgc2lnbmF0dXJlcyBhcmUgbm90IHN1cHBvcnRlZCBvbiB0aGUgYmxvYi1zaWduIGVuZHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJsb2IoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCbG9iU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vYmxvYi9zaWduL3trZXlfaWR9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGtleV9pZCA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkuaWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIHRyYW5zYWN0aW9uIGlucHV0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJpdGNvaW4gQklQLTEzNyBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0Y01lc3NhZ2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCdGNNZXNzYWdlU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNNZXNzYWdlU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL21lc3NhZ2Uvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgVGFwcm9vdCB0cmFuc2FjdGlvbiBpbnB1dC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UYXByb290KFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogVGFwcm9vdFNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VGFwcm9vdFNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2J0Yy90YXByb290L3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFBTQlQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduUHNidChcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFBzYnRTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFBzYnRTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvcHNidC9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGFuIEV4dHJhY3RhYmxlIE9uZS1UaW1lIFNpZ25hdHVyZVxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVvdHMoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFb3RzU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFb3RzU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9lb3RzL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgc2V0IG9mIEJhYnlsb24gRU9UUyBub25jZXMgZm9yIGEgc3BlY2lmaWVkIGNoYWluLWlkLCBzdGFydGluZyBhdCBhIHNwZWNpZmllZCBibG9jayBoZWlnaHQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgYW5kIGhvdyBtYW55IG5vbmNlcyB0byBjcmVhdGVcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgZW90c0NyZWF0ZU5vbmNlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRW90c0NyZWF0ZU5vbmNlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVvdHNDcmVhdGVOb25jZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9lb3RzL25vbmNlcy97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQmFieWxvbiBzdGFraW5nIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSB0YXByb290IGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQmFieWxvblN0YWtpbmdUeG4oXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCYWJ5bG9uU3Rha2luZ1Jlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9zdGFraW5nL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTb2xhbmEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Tb2xhbmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBTb2xhbmFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNvbGFuYVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBNTUkgcGVuZGluZyBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSB0aGUgbWVzc2FnZSBpbmZvLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBvcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgdGhlIHVwZGF0ZWQgbWVzc2FnZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NbWkoXG4gICAgbWVzc2FnZTogUGVuZGluZ01lc3NhZ2VJbmZvLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8UGVuZGluZ01lc3NhZ2VTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH0vc2lnblwiLCBcInBvc3RcIik7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbWVzc2FnZS5pZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IG1lc3NhZ2UsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgU1VJIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcXVlc3QgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TdWkoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxdWVzdDogU3VpU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTdWlTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zdWkvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gVVNFUiBFWFBPUlQ6IHVzZXJFeHBvcnQoSW5pdCxDb21wbGV0ZSxMaXN0LERlbGV0ZSlcbiAgLyoqXG4gICAqIExpc3Qgb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBPcHRpb25hbCBrZXkgSUQuIElmIHN1cHBsaWVkLCBsaXN0IHRoZSBvdXRzdGFuZGluZyByZXF1ZXN0IChpZiBhbnkpIG9ubHkgZm9yIHRoZSBzcGVjaWZpZWQga2V5OyBvdGhlcndpc2UsIGxpc3QgYWxsIG91dHN0YW5kaW5nIHJlcXVlc3RzIGZvciB0aGUgc3BlY2lmaWVkIHVzZXIuXG4gICAqIEBwYXJhbSB1c2VySWQgT3B0aW9uYWwgdXNlciBJRC4gSWYgb210dGVkLCB1c2VzIHRoZSBjdXJyZW50IHVzZXIncyBJRC4gT25seSBvcmcgb3duZXJzIGNhbiBsaXN0IHVzZXItZXhwb3J0IHJlcXVlc3RzIGZvciB1c2VycyBvdGhlciB0aGFuIHRoZW1zZWx2ZXMuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgdXNlckV4cG9ydExpc3QoXG4gICAga2V5SWQ/OiBzdHJpbmcsXG4gICAgdXNlcklkPzogc3RyaW5nLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPFVzZXJFeHBvcnRMaXN0UmVzcG9uc2UsIFVzZXJFeHBvcnRJbml0UmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICAgICAgLi4ucXVlcnksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIuZXhwb3J0X3JlcXVlc3RzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5LWlkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHVzZXItZXhwb3J0IHJlcXVlc3QgdG8gZGVsZXRlLlxuICAgKiBAcGFyYW0gdXNlcklkIE9wdGlvbmFsIHVzZXIgSUQuIElmIG9taXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGRlbGV0ZSB1c2VyLWV4cG9ydCByZXF1ZXN0cyBmb3IgdXNlcnMgb3RoZXIgdGhhbiB0aGVtc2VsdmVzLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydERlbGV0ZShrZXlJZDogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydEluaXQoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRJbml0UmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgaW5pdEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGJvZHk6IHsga2V5X2lkOiBrZXlJZCB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgaW5pdEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5LWlkIGZvciB3aGljaCB0byBpbml0aWF0ZSBhbiBleHBvcnQuXG4gICAqIEBwYXJhbSBwdWJsaWNLZXkgVGhlIE5JU1QgUC0yNTYgcHVibGljIGtleSB0byB3aGljaCB0aGUgZXhwb3J0IHdpbGwgYmUgZW5jcnlwdGVkLiBUaGlzIHNob3VsZCBiZSB0aGUgYHB1YmxpY0tleWAgcHJvcGVydHkgb2YgYSB2YWx1ZSByZXR1cm5lZCBieSBgdXNlckV4cG9ydEtleWdlbmAuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1c2VyRXhwb3J0Q29tcGxldGUoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBwdWJsaWNLZXk6IENyeXB0b0tleSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlPj4ge1xuICAgIC8vIGJhc2U2NC1lbmNvZGUgdGhlIHB1YmxpYyBrZXlcbiAgICBjb25zdCBzdWJ0bGUgPSBhd2FpdCBsb2FkU3VidGxlQ3J5cHRvKCk7XG4gICAgY29uc3QgcHVibGljS2V5QjY0ID0gZW5jb2RlVG9CYXNlNjQoQnVmZmVyLmZyb20oYXdhaXQgc3VidGxlLmV4cG9ydEtleShcInJhd1wiLCBwdWJsaWNLZXkpKSk7XG5cbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwicGF0Y2hcIik7XG4gICAgLy8gbWFrZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IGNvbXBsZXRlRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgcHVibGljX2tleTogcHVibGljS2V5QjY0LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGNvbXBsZXRlRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIEtFWSBJTVBPUlQ6IGNyZWF0ZUtleUltcG9ydEtleSwgaW1wb3J0S2V5c1xuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlJbXBvcnRLZXkoKTogUHJvbWlzZTxDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW1wb3J0X2tleVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNkay1rZXktaW1wb3J0YFxuICAgKiBsaWJyYXJ5LiBTZWUgdGhhdCBsaWJyYXJ5J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBBbiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgaW1wb3J0ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGltcG9ydEtleXMoYm9keTogSW1wb3J0S2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbXBvcnRfa2V5XCIsIFwicHV0XCIpO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNSVNDOiBoZWFydGJlYXQoKVxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGhlYXJ0YmVhdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2N1YmUzc2lnbmVyL2hlYXJ0YmVhdFwiLCBcInBvc3RcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNTUk6IG1taSgpLCBtbWlMaXN0KClcbiAgLyoqXG4gICAqIENhbGwgdGhlIE1NSSBKU09OIFJQQyBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIG1ldGhvZCBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHRvIGNhbGwuXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIGxpc3Qgb2YgbWV0aG9kIHBhcmFtZXRlcnMuXG4gICAqIEByZXR1cm5zIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIG1ldGhvZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBtbWkobWV0aG9kOiBNbWlKcnBjTWV0aG9kLCBwYXJhbXM6IEpzb25BcnJheSk6IFByb21pc2U8SnJwY1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL21taS92My9qc29uLXJwY1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgYm9keSA9IHtcbiAgICAgIGlkOiAxLFxuICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgfTtcbiAgICBjb25zdCBmdW5jID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4gdGhpcy5leGVjKG8sIHsgaGVhZGVycywgYm9keSB9KTtcbiAgICBjb25zdCByZXNwID0gKGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGZ1bmMpKS5kYXRhKCk7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1NSSBtZXNzYWdlcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxpc3Qgb2YgcGVuZGluZyBNTUkgbWVzc2FnZXMuXG4gICAqL1xuICBhc3luYyBtbWlMaXN0KCk6IFByb21pc2U8UGVuZGluZ01lc3NhZ2VJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlc1wiLCBcImdldFwiKTtcbiAgICBjb25zdCB7IHBlbmRpbmdfbWVzc2FnZXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gICAgcmV0dXJuIHBlbmRpbmdfbWVzc2FnZXMgYXMgUGVuZGluZ01lc3NhZ2VJbmZvW107XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNTUkgbWVzc2FnZSBieSBpdHMgSUQuXG4gICAqXG4gICAqIEBwYXJhbSBtc2dJZCBUaGUgSUQgb2YgdGhlIHBlbmRpbmcgbWVzc2FnZS5cbiAgICogQHJldHVybnMgVGhlIHBlbmRpbmcgTU1JIG1lc3NhZ2UuXG4gICAqL1xuICBhc3luYyBtbWlHZXQobXNnSWQ6IHN0cmluZyk6IFByb21pc2U8UGVuZGluZ01lc3NhZ2VJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH1cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbXNnSWQgfSB9IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgTU1JIG1lc3NhZ2Ugd2l0aCB0aGUgZ2l2ZW4gSUQuXG4gICAqXG4gICAqIEBwYXJhbSBtc2dJZCB0aGUgSUQgb2YgdGhlIE1NSSBtZXNzYWdlLlxuICAgKi9cbiAgYXN5bmMgbW1pRGVsZXRlKG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1zZ0lkIH0gfSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1NSSBtZXNzYWdlIHdpdGggdGhlIGdpdmVuIElELlxuICAgKlxuICAgKiBAcGFyYW0gbXNnSWQgdGhlIElEIG9mIHRoZSBNTUkgbWVzc2FnZS5cbiAgICogQHJldHVybnMgVGhlIG1lc3NhZ2Ugd2l0aCB1cGRhdGVkIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBtbWlSZWplY3QobXNnSWQ6IHN0cmluZyk6IFByb21pc2U8UGVuZGluZ01lc3NhZ2VJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH0vcmVqZWN0XCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtc2dJZCB9IH0gfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLyoqXG4gICAqIFJldHVybnMgcHVibGljIG9yZyBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgdG8gbG9nIGludG9cbiAgICogQHJldHVybnMgUHVibGljIG9yZyBpbmZvcm1hdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHB1YmxpY09yZ0luZm8oZW52OiBFbnZJbnRlcmZhY2UsIG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFB1YmxpY09yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2luZm9cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBsb2cgaW50by5cbiAgICogQHBhcmFtIHRva2VuIFRoZSBPSURDIHRva2VuIHRvIGV4Y2hhbmdlXG4gICAqIEBwYXJhbSBzY29wZXMgVGhlIHNjb3BlcyBmb3IgdGhlIG5ldyBzZXNzaW9uXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHBhcmFtIHB1cnBvc2UgT3B0aW9uYWwgc2Vzc2lvbiBkZXNjcmlwdGlvbi5cbiAgICogQHJldHVybnMgVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBvaWRjU2Vzc2lvbkNyZWF0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxTY29wZT4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICAgcHVycG9zZT86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2Vzc2lvbkRhdGE+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGxvZ2luRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgICBvKHtcbiAgICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAuLi5oZWFkZXJzLFxuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogdG9rZW4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgICAgdG9rZW5zOiBsaWZldGltZXMsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICApLnRoZW4oYXNzZXJ0T2spO1xuXG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKHNlc3Npb25JbmZvKTogU2Vzc2lvbkRhdGEgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVudjoge1xuICAgICAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogZW52LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgICAgICB0b2tlbjogc2Vzc2lvbkluZm8udG9rZW4sXG4gICAgICAgICAgcmVmcmVzaF90b2tlbjogc2Vzc2lvbkluZm8ucmVmcmVzaF90b2tlbixcbiAgICAgICAgICBzZXNzaW9uX2V4cDogc2Vzc2lvbkluZm8uZXhwaXJhdGlvbixcbiAgICAgICAgICBwdXJwb3NlOiBcInNpZ24gaW4gdmlhIG9pZGNcIixcbiAgICAgICAgICBzZXNzaW9uX2luZm86IHNlc3Npb25JbmZvLnNlc3Npb25faW5mbyxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShlbnYsIGxvZ2luRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjY2VwdCBhbiBpbnZpdGF0aW9uIHRvIGpvaW4gYSBDdWJlU2lnbmVyIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZHBBY2NlcHRJbnZpdGUoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBib2R5OiBJbnZpdGF0aW9uQWNjZXB0UmVxdWVzdCxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbnZpdGF0aW9uL2FjY2VwdFwiLCBcInBvc3RcIik7XG4gICAgYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciBhdXRoZW50aWNhdGluZyB3aXRoIGVtYWlsL3Bhc3N3b3JkLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGFuIE9JREMgdG9rZW4gd2hpY2ggY2FuIGJlIHVzZWRcbiAgICogICB0byBsb2cgaW4gdmlhIE9JREMgKHNlZSB7QGxpbmsgb2lkY1Nlc3Npb25DcmVhdGV9KS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZHBBdXRoZW50aWNhdGUoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBib2R5OiBBdXRoZW50aWNhdGlvblJlcXVlc3QsXG4gICk6IFByb21pc2U8QXV0aGVudGljYXRpb25SZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRwL2F1dGhlbnRpY2F0ZVwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHksXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYXV0aGVudGljYXRlZCBlbmRwb2ludCBmb3IgcmVxdWVzdGluZyBwYXNzd29yZCByZXNldC5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICogQHJldHVybnMgUmV0dXJucyB0aGUgcGFydGlhbCB0b2tlbiAoYCR7aGVhZGVyfS4ke2NsYWltc30uYCkgd2hpbGUgdGhlIHNpZ25hdHVyZSBpcyBzZW50IHZpYSBlbWFpbC5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZHBQYXNzd29yZFJlc2V0UmVxdWVzdChcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IFBhc3N3b3JkUmVzZXRSZXF1ZXN0LFxuICApOiBQcm9taXNlPEVtYWlsT3RwUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkcC9wYXNzd29yZF9yZXNldFwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHksXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYXV0aGVudGljYXRlZCBlbmRwb2ludCBmb3IgY29uZmlybWluZyBhIHByZXZpb3VzbHkgaW5pdGlhdGVkIHBhc3N3b3JkIHJlc2V0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvblxuICAgKiBAcGFyYW0gcGFydGlhbFRva2VuIFRoZSBwYXJ0aWFsIHRva2VuIHJldHVybmVkIGJ5IHtAbGluayBwYXNzd29yZFJlc2V0UmVxdWVzdH1cbiAgICogQHBhcmFtIHNpZ25hdHVyZSBUaGUgb25lLXRpbWUgY29kZSAoc2lnbmF0dXJlIGluIHRoaXMgY2FzZSkgc2VudCB2aWEgZW1haWxcbiAgICogQHBhcmFtIG5ld1Bhc3N3b3JkIFRoZSBuZXcgcGFzc3dvcmRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZHBQYXNzd29yZFJlc2V0Q29uZmlybShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHBhcnRpYWxUb2tlbjogc3RyaW5nLFxuICAgIHNpZ25hdHVyZTogc3RyaW5nLFxuICAgIG5ld1Bhc3N3b3JkOiBzdHJpbmcsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRwL3Bhc3N3b3JkX3Jlc2V0XCIsIFwicGF0Y2hcIik7XG4gICAgYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIHRva2VuOiBgJHtwYXJ0aWFsVG9rZW59JHtzaWduYXR1cmV9YCxcbiAgICAgICAgICBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyBpZCBpbiB3aGljaCB0byBnZW5lcmF0ZSBwcm9vZlxuICAgKiBAcGFyYW0gdG9rZW4gVGhlIG9pZGMgdG9rZW5cbiAgICogQHJldHVybnMgUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZGVudGl0eVByb3ZlT2lkYyhcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvcHJvdmUvb2lkY1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGFsbCBvcmdhbml6YXRpb25zIGEgdXNlciBpcyBhIG1lbWJlciBvZlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gdG9rZW4gVGhlIG9pZGMgdG9rZW4gaWRlbnRpZnlpbmcgdGhlIHVzZXJcbiAgICogQHJldHVybnMgVGhlIG9yZ2FuaXphdGlvbiB0aGUgdXNlciBiZWxvbmdzIHRvXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdXNlck9yZ3MoZW52OiBFbnZJbnRlcmZhY2UsIHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJPcmdzUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvdXNlci9vcmdzXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogUG9zdC1wcm9jZXNzIGEge0BsaW5rIFVzZXJJbmZvfSByZXNwb25zZS4gUG9zdC1wcm9jZXNzaW5nIGVuc3VyZXMgdGhhdCB0aGUgZW1haWwgZmllbGQgZm9yXG4gICAqIHVzZXJzIHdpdGhvdXQgYW4gZW1haWwgaXMgc2V0IHRvIGBudWxsYC5cbiAgICpcbiAgICogQHBhcmFtIGluZm8gVGhlIGluZm8gdG8gcG9zdC1wcm9jZXNzXG4gICAqIEByZXR1cm5zIFRoZSBwcm9jZXNzZWQgdXNlciBpbmZvXG4gICAqL1xuICBzdGF0aWMgI3Byb2Nlc3NVc2VySW5mbyhpbmZvOiBVc2VySW5mbyk6IFVzZXJJbmZvIHtcbiAgICBpZiAoaW5mby5lbWFpbCA9PT0gRU1BSUxfTk9UX0ZPVU5EKSB7XG4gICAgICBpbmZvLmVtYWlsID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICAvKipcbiAgICogUG9zdC1wcm9jZXNzIGEge0BsaW5rIFVzZXJJbk9yZ0luZm99IHJlc3BvbnNlLiBQb3N0LXByb2Nlc3NpbmcgZW5zdXJlcyB0aGF0IHRoZSBlbWFpbCBmaWVsZCBmb3JcbiAgICogdXNlcnMgd2l0aG91dCBhbiBlbWFpbCBpcyBzZXQgdG8gYG51bGxgLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyBUaGUgaW5mbyB0byBwb3N0LXByb2Nlc3NcbiAgICogQHJldHVybnMgVGhlIHByb2Nlc3NlZCB1c2VyIGluZm9cbiAgICovXG4gIHN0YXRpYyAjcHJvY2Vzc1VzZXJJbk9yZ0luZm8oaW5mbzogVXNlckluT3JnSW5mbyk6IFVzZXJJbk9yZ0luZm8ge1xuICAgIGlmIChpbmZvLmVtYWlsID09PSBFTUFJTF9OT1RfRk9VTkQpIHtcbiAgICAgIGluZm8uZW1haWwgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxufVxuXG5jb25zdCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lOiBTZXNzaW9uTGlmZXRpbWUgPSB7XG4gIHNlc3Npb246IDYwNDgwMCwgLy8gMSB3ZWVrXG4gIGF1dGg6IDMwMCwgLy8gNSBtaW5cbiAgcmVmcmVzaDogODY0MDAsIC8vIDEgZGF5XG4gIGdyYWNlOiAzMCwgLy8gc2Vjb25kc1xufTtcbiJdfQ==