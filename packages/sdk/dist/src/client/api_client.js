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
     * Obtain information about the current user.
     *
     * @return {Promise<UserInfo>} Retrieves information about the current user.
     */
    async userGet() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me", "get");
        return this.exec(o, {}).then(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInfo));
    }
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered either by calling {@link TotpChallenge.answer} (or
     * {@link ApiClient.userTotpResetComplete}).
     *
     * @param {string} issuer Optional issuer; defaults to "Cubist"
     * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
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
     * @param {string} totpId - The ID of the TOTP challenge
     * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    async userTotpResetComplete(totpId, code) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp", "patch");
        await this.exec(o, {
            body: { totp_id: totpId, code },
        });
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * @param {string} code Current TOTP code
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
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
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
     * @param {string} name The name of the new device.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
     * @return {Promise<CubeSignerResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
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
     * @param {string} challengeId The ID of the challenge returned by the remote end.
     * @param {PublicKeyCredential} credential The answer to the challenge.
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
     * @param {string} fidoId The ID of the desired FIDO key
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
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
    // #region ORGS: orgGet, orgUpdate, orgUpdateUserMembership
    /**
     * Obtain information about an org
     *
     * @param {string | undefined} orgId The org to get info for
     * @return {OrgInfo} Information about the organization.
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
     * @param {UpdateOrgRequest} request The JSON request to send to the API server.
     * @return {UpdateOrgResponse} Updated org information.
     */
    async orgUpdate(request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}", "patch");
        return this.exec(o, { body: request });
    }
    /**
     * Update user's membership in this org.
     * @param {string} userId The ID of the user whose membership to update.
     * @param {UpdateUserMembershipRequest} req The update request
     * @return {Promise<UserInOrgInfo>} Updated user membership
     */
    async orgUpdateUserMembership(userId, req) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/{user_id}/membership", "patch");
        return this.exec(o, {
            params: { path: { user_id: userId } },
            body: req,
        }).then(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo));
    }
    // #endregion
    // #region ORG USERS: orgUserInvite, orgUserDelete, orgUsersList, orgUserGet, orgUserCreateOidc, orgUserDeleteOidc
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @param {string} email Email of the user
     * @param {string} name The full name of the user
     * @param {MemberRole} role Optional role. Defaults to "alien".
     * @param {boolean} skipEmail Optionally skip sending the invite email.
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
     * @param {string} userId The ID of the user to remove.
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
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<GetUsersInOrgResponse, UserInOrgInfo>} Paginator for iterating over the users in the org.
     */
    orgUsersList(page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users", "get");
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { path: {}, ...query } }), (r) => r.users.map(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo)), (r) => r.last_evaluated_key);
    }
    /**
     * Get user by id.
     * @param {string} userId The id of the user to get.
     * @return {UserInOrgInfo} Org user.
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
     * @param {OidcIdentity} identity The identity of the OIDC user
     * @param {string} email Email of the OIDC user
     * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
     * @return {string} User id of the new user
     */
    async orgUserCreateOidc(identity, email, opts = {}) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users", "post");
        const { user_id } = await this.exec(o, {
            body: {
                identity,
                role: opts.memberRole ?? "Alien",
                email,
                name: opts.name,
                mfa_policy: opts.mfaPolicy,
            },
        });
        return user_id;
    }
    /**
     * Delete an existing OIDC user.
     * @param {OidcIdentity} identity The identity of the OIDC user
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
     * @param {string} keyId The id of the key to get.
     * @return {KeyInfo} The key information.
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
     * @param {KeyType} keyType The key type.
     * @param {string} materialId The material id of the key to get.
     * @return {KeyInfo} The key information.
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
     * @param {string} keyId The id of the key to get.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListKeyRolesResponse, KeyInRoleInfo>} Paginator for iterating over the roles a key is in.
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
     * @param {string} keyId The ID of the key to update.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfo} The JSON response from the API server.
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
     * @param {string} keyId - Key id
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
     * @param {KeyType} keyType The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @param {KeyProperties?} props Additional key properties
     * @return {KeyInfo[]} The new keys.
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
            },
        });
        return keys;
    }
    /**
     * Derive a set of keys of a specified type using a supplied derivation path and an existing long-lived mnemonic.
     *
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {KeyType} keyType The type of key to create.
     * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
     * @param {string} mnemonicId material_id of mnemonic key used to derive the new key.
     * @param { ImportDeriveKeyProperties } props Additional options for derivation.
     *
     * @return {KeyInfo[]} The newly derived keys.
     */
    async keysDerive(keyType, derivationPaths, mnemonicId, props) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/derive_key", "put");
        const { keys } = await this.exec(o, {
            body: {
                derivation_path: derivationPaths,
                mnemonic_id: mnemonicId,
                key_type: keyType,
                // Casting `props.policy` to the proper type does not work here:
                // tsc appears to get the type wrong. Our workaround is `any`.
                ...props, // eslint-disable-line @typescript-eslint/no-explicit-any
            },
        });
        return keys;
    }
    /**
     * List all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @param {string?} owner Optional key owner to filter list for.
     * @param {string?} search Optionally search by key's material ID and metadata
     * @return {Paginator<ListKeysResponse, KeyInfo>} Paginator for iterating over keys.
     */
    keysList(type, page, owner, search) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys", "get");
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { key_type: type, key_owner: owner, search, ...query } } }), (r) => r.keys, (r) => r.last_evaluated_key);
    }
    /**
     * List recent historical key transactions.
     *
     * @param {string} keyId The key id.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListHistoricalTxResponse, HistoricalTx>} Paginator for iterating over historical transactions.
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
     * @param {string?} name The optional name of the role.
     * @return {string} The ID of the new role.
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
     * @param {string} roleId The id of the role to get.
     * @return {RoleInfo} The role.
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
     * @param {string} roleId The ID of the role to update.
     * @param {UpdateRoleRequest} request The update request.
     * @return {Promise<RoleInfo>} The updated role information.
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
     * @param {string} roleId The ID of the role to delete.
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
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {RoleInfo} Paginator for iterating over roles.
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
     * @param {string} roleId The ID of the role
     * @param {string[]} keyIds The IDs of the keys to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to each key.
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
     * @param {string} roleId The ID of the role
     * @param {string} keyId The ID of the key to remove from the role
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
     * @param {string} roleId The ID of the role whose keys to retrieve.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListRoleKeysResponse, KeyInRoleInfo>} Paginator for iterating over the keys in the role.
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
     * @param {string} roleId The ID of the role.
     * @param {string} userId The ID of the user to add to the role.
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
     * @param {string} roleId The ID of the role.
     * @param {string} userId The ID of the user to remove from the role.
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
     * @param {string} roleId The ID of the role whose users to retrieve.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListRoleUsersResponse, UserInRoleInfo>} Paginator for iterating over the users in the role.
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
     * @param {string} purpose The purpose of the session
     * @param {Scope[]} scopes Session scopes.
     * @param {SessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SessionData>} New signer session info.
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
     * @param {string} purpose The purpose of the session
     * @param {Scope[]} scopes Session scopes.
     * @param {SessionLifetime} lifetime Lifetime settings
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<CubeSignerResponse<SessionData>>} New signer session info.
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
     * @param {string} roleId Role ID
     * @param {string} purpose The purpose of the session
     * @param {Scope[]} scopes Session scopes. Not all scopes are valid for a role.
     * @param {SessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SessionData>} New signer session info.
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
     * @param {string} [sessionId] The ID of the session to revoke. This session by default
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
     * @param {string} [roleId] The ID of a role whose sessions to revoke. If not defined, all the current user's sessions will be revoked instead.
     */
    async sessionRevokeAll(roleId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "delete");
        await this.exec(o, {
            params: { query: { role: roleId } },
        });
    }
    /**
     * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
     *
     * @param {string?} roleId If set, limit to sessions for this role only.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    sessionsList(roleId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "get");
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { role: roleId, ...query } } }), (r) => r.sessions, (r) => r.last_evaluated_key);
    }
    /**
     * Returns the list of keys that this session has access to.
     * @return {KeyInfo[]} The list of keys.
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
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async identityProve() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/prove", "post");
        return this.exec(o, {});
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {IdentityProof} proof The proof of authentication.
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
     * @param {AddIdentityRequest} body The request body, containing an OIDC token to prove the identity ownership.
     */
    async identityAdd(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "post");
        await this.exec(o, { body });
    }
    /**
     * Removes an OIDC identity from the current user's account.
     *
     * @param {OidcIdentity} body The identity to remove.
     */
    async identityRemove(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "delete");
        await this.exec(o, { body });
    }
    /**
     * Lists associated OIDC identities with the current user.
     *
     * @return {ListIdentityResponse} Associated identities
     */
    async identityList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "get");
        return await this.exec(o, {});
    }
    // #endregion
    // #region MFA: mfaGet, mfaList, mfaApprove, mfaList, mfaApprove, mfaApproveTotp, mfaApproveFido(Init|Complete)
    /**
     * Retrieves existing MFA request.
     *
     * @param {string} mfaId MFA request ID
     * @return {Promise<MfaRequestInfo>} MFA request information
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
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    async mfaList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa", "get");
        const { mfa_requests } = await this.exec(o, {});
        return mfa_requests;
    }
    /**
     * Approve or reject a pending MFA request using the current session.
     *
     * @param {string} mfaId The id of the MFA request
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
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
     * @param {string} mfaId The ID of the MFA request
     * @param {string} code The TOTP code
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
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
     * @param {string} mfaId The MFA request ID.
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
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
     * @param {string} mfaId The MFA request ID
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @param {string} challengeId The ID of the challenge issued by {@link mfaFidoInit}
     * @param {PublicKeyCredential} credential The answer to the challenge
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
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
    // #endregion
    // #region SIGN: signEvm, signEth2, signStake, signUnstake, signAva, signSerializedAva, signBlob, signBtc, signTaproot, signSolana, signEots, eotsCreateNonce, signMmi
    /**
     * Sign an EVM transaction.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EvmSignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
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
     * @param {Eth2StakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its
     * material ID).
     * @param {AvaChain} avaChain Avalanche chain
     * @param {string} tx Hex encoded transaction
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcMessageSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcMessageSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {TaprootSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<TaprootSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EotsSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EotsSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EotsCreateNonceRequest} req What and how many nonces to create
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<EotsCreateNonceResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The taproot key to sign with (either {@link Key} or its material ID).
     * @param {BabylonStakingRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<TaprootSignResponse | AcceptedResponse>} The response.
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
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
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
     * @param {PendingMessageInfo} message the message info.
     * @param {MfaReceipt | undefined} mfaReceipt optional MFA receipt.
     * @return {PendingMessageSignResponse} the updated message.
     */
    async signMmi(message, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/sign", "post");
        const signFn = async (headers) => this.exec(o, {
            params: { path: { msg_id: message.id } },
            headers: headers,
            body: message,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    // #endregion
    // #region USER EXPORT: userExport(Init,Complete,List,Delete)
    /**
     * List outstanding user-export requests.
     *
     * @param {string?} keyId Optional key ID. If supplied, list the outstanding request (if any) only for the specified key; otherwise, list all outstanding requests for the specified user.
     * @param {string?} userId Optional user ID. If omtted, uses the current user's ID. Only org owners can list user-export requests for users other than themselves.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<UserExportListResponse, UserExportInitResponse>} Paginator for iterating over the result set.
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
     * @param {string} keyId The key-id corresponding to the user-export request to delete.
     * @param {string?} userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
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
     * @param {string} keyId The key-id for which to initiate an export.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<UserExportInitResponse | AcceptedResponse>} The response.
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
     * @param {string} keyId The key-id for which to initiate an export.
     * @param {CryptoKey} publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<UserExportCompleteResponse | AcceptedResponse>} The response.
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
     * @return { Promise<GetKeyImportKeyResponse> } A fresh key-import key
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
     * @param { ImportKeyRequest } body An encrypted key-import request.
     * @return { KeyInfo[] } The newly imported keys.
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
     *
     * @return { Promise<void> } The response.
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
     * @param {MmiJrpcMethod} method The name of the method to call.
     * @param {JsonArray} params The list of method parameters.
     * @return {object | null | undefined} the return value of the method.
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
     * @return { PendingMessageInfo[] } The list of pending MMI messages.
     */
    async mmiList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages", "get");
        const { pending_messages } = await this.exec(o, {});
        return pending_messages;
    }
    /**
     * Get a pending MMI message by its ID.
     *
     * @param {string} msgId The ID of the pending message.
     * @return {PendingMessageInfo} The pending MMI message.
     */
    async mmiGet(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "get");
        return await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    /**
     * Delete the MMI message with the given ID.
     *
     * @param {string} msgId the ID of the MMI message.
     */
    async mmiDelete(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "delete");
        await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    /**
     * Reject the MMI message with the given ID.
     *
     * @param {string} msgId the ID of the MMI message.
     */
    async mmiReject(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/reject", "post");
        return await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    // #endregion
    /**
     * Returns public org information.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org to log into
     * @return {Promise<PublicOrgInfo>} Public org information
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
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org to log into.
     * @param {string} token The OIDC token to exchange
     * @param {List<Scope>} scopes The scopes for the new session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @param {string} purpose Optional session description.
     * @return {Promise<CubeSignerResponse<SessionData>>} The session data.
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
            return (0, response_1.mapResponse)(data, (sessionInfo) => ({
                env: {
                    ["Dev-CubeSignerStack"]: env,
                },
                org_id: orgId,
                token: sessionInfo.token,
                session_exp: sessionInfo.expiration,
                purpose: "sign in via oidc",
                session_info: sessionInfo.session_info,
            }));
        };
        return await response_1.CubeSignerResponse.create(env, loginFn, mfaReceipt);
    }
    /**
     * Unauthenticated endpoint for authenticating with email/password.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The id of the organization
     * @param {AuthenticationRequest} body The request body
     * @return {AuthenticationResponse} Returns an OIDC token which can be used
     *   to log in via OIDC (see {@link oidcSessionCreate}).
     */
    static async idpAuthenticate(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/password", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for requesting password reset.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The id of the organization
     * @param {PasswordResetRequest} body The request body
     * @return {EmailOtpResponse} Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
     */
    static async idpPasswordResetRequest(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/password/reset", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for confirming a previously initiated password reset request.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The id of the organization
     * @param {string} partialToken The partial token returned by {@link passwordResetRequest}
     * @param {string} signature The one-time code (signature in this case) sent via email
     * @param {string} newPassword The new password
     */
    static async idpPasswordResetConfirm(env, orgId, partialToken, signature, newPassword) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/password/reset", "patch");
        await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body: {
                token: `${partialToken}.${signature}`,
                new_password: newPassword,
            },
        })).then(fetch_1.assertOk);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org id in which to generate proof
     * @param {string} token The oidc token
     * @return {Promise<IdentityProof>} Proof of authentication
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
     * @param {EnvInterface} env The environment to log into
     * @param {string} token The oidc token identifying the user
     * @return {Promise<UserOrgsResponse>} The organization the user belongs to
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpX2NsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYXBpX2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUF1REEsa0NBQXlDO0FBRXpDLGdDQUEyRTtBQUMzRSwwQ0FBOEQ7QUFHOUQsNENBQStDO0FBRS9DLGdEQUFrRDtBQXVDbEQsb0NBQXdDO0FBQ3hDLCtDQUF5RTtBQUN6RSxvQ0FBc0M7QUFFdEM7O0dBRUc7QUFDSCxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztBQUUxQzs7R0FFRztBQUNILE1BQWEsU0FBVSxTQUFRLHdCQUFVO0lBQ3ZDLDBIQUEwSDtJQUUxSDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVoRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyx1QkFBQSxFQUFTLHNDQUFpQixDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsaUJBQWlCLENBQ3JCLE1BQWUsRUFDZixVQUF1QjtRQUV2QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywrQkFBK0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0RCxNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFO1lBQ2xELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQzlCLE9BQU87Z0JBQ1AsSUFBSSxFQUFFLE1BQU07b0JBQ1YsQ0FBQyxDQUFDO3dCQUNFLE1BQU07cUJBQ1A7b0JBQ0gsQ0FBQyxDQUFDLElBQUk7YUFDVCxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUEsc0JBQVcsRUFBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksbUJBQWEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1RSxDQUFDLENBQUM7UUFDRixPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxNQUFjLEVBQUUsSUFBWTtRQUN0RCxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywrQkFBK0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN2RCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFO1NBQ2hDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBWTtRQUMvQixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxzQ0FBc0MsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU3RCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLElBQUksRUFBRSxFQUFFLElBQUksRUFBRTtTQUNmLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLFVBQXVCO1FBQzFDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLCtCQUErQixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sWUFBWSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUU7WUFDbkQsT0FBTyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO2dCQUN4QixPQUFPO2FBQ1IsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDO1FBQ0YsT0FBTyxNQUFNLDZCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3RSxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsb0JBQW9CLENBQ3hCLElBQVksRUFDWixVQUF1QjtRQUV2QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywrQkFBK0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0RCxNQUFNLFNBQVMsR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFO1lBQ2hELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQzlCLE9BQU87Z0JBQ1AsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFO2FBQ2YsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFBLHNCQUFXLEVBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLHNCQUFnQixDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsQ0FBQztRQUNGLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsS0FBSyxDQUFDLHdCQUF3QixDQUFDLFdBQW1CLEVBQUUsVUFBK0I7UUFDakYsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsK0JBQStCLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFdkQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNsQixJQUFJLEVBQUU7Z0JBQ0osWUFBWSxFQUFFLFdBQVc7Z0JBQ3pCLFVBQVU7YUFDWDtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FDbEIsTUFBYyxFQUNkLFVBQXVCO1FBRXZCLE1BQU0sWUFBWSxHQUFHLENBQUMsT0FBcUIsRUFBRSxFQUFFO1lBQzdDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHlDQUF5QyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBRWxFLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ2xCLE9BQU87Z0JBQ1AsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO2FBQ3RDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUNGLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVELGFBQWE7SUFFYiwyREFBMkQ7SUFFM0Q7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQWM7UUFDekIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsa0JBQWtCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNsQixNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTthQUNuRDtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUF5QjtRQUN2QyxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxrQkFBa0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUUxQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLHVCQUF1QixDQUMzQixNQUFjLEVBQ2QsR0FBZ0M7UUFFaEMsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsNkNBQTZDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDckUsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNsQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsSUFBSSxFQUFFLEdBQUc7U0FDVixDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUFBLEVBQVMsMkNBQXNCLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsYUFBYTtJQUViLGtIQUFrSDtJQUVsSDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FDakIsS0FBYSxFQUNiLElBQVksRUFDWixJQUFpQixFQUNqQixTQUFtQjtRQUVuQixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyx5QkFBeUIsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVoRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLElBQUksRUFBRTtnQkFDSixLQUFLO2dCQUNMLElBQUk7Z0JBQ0osSUFBSTtnQkFDSixVQUFVLEVBQUUsQ0FBQyxDQUFDLFNBQVM7YUFDeEI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFjO1FBQ2hDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGtDQUFrQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRTNELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDbEIsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUUsTUFBTTtpQkFDaEI7YUFDRjtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksQ0FBQyxJQUFlO1FBQzFCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTlDLE9BQU8sSUFBSSxxQkFBUyxDQUNsQixJQUFJLElBQUksZ0JBQUksQ0FBQyxPQUFPLEVBQUUsRUFDdEIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEtBQUssRUFBRSxFQUFFLENBQUMsRUFDM0QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLHVCQUFBLEVBQVMsMkNBQXNCLENBQUMsRUFDbkQsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FDNUIsQ0FBQztJQUNKLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFjO1FBQzdCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDOUIsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUUsTUFBTTtpQkFDaEI7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUNILE9BQU8sdUJBQUEsRUFBUywyQ0FBc0IsTUFBL0IsRUFBUyxFQUF1QixJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLGlCQUFpQixDQUNyQixRQUFzQixFQUN0QixLQUFxQixFQUNyQixPQUE4QixFQUFFO1FBRWhDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHdCQUF3QixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRS9DLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ3JDLElBQUksRUFBRTtnQkFDSixRQUFRO2dCQUNSLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxJQUFJLE9BQU87Z0JBQ2hDLEtBQUs7Z0JBQ0wsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2dCQUNmLFVBQVUsRUFBRSxJQUFJLENBQUMsU0FBUzthQUMzQjtTQUNGLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsaUJBQWlCLENBQUMsUUFBc0I7UUFDNUMsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsNkJBQTZCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFdEQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNsQixJQUFJLEVBQUUsUUFBUTtTQUNmLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxhQUFhO0lBRWIsMkZBQTJGO0lBRTNGOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFhO1FBQ3hCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGdDQUFnQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXRELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDbEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsa0JBQWtCLENBQUMsT0FBZ0IsRUFBRSxVQUFrQjtRQUMzRCxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxnREFBZ0QsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV0RSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxFQUFFO1NBQ2pFLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxZQUFZLENBQUMsS0FBYSxFQUFFLElBQWU7UUFDekMsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsc0NBQXNDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFNUQsT0FBTyxJQUFJLHFCQUFTLENBQ2xCLElBQUksSUFBSSxnQkFBSSxDQUFDLE9BQU8sRUFBRSxFQUN0QixDQUFDLEtBQUssRUFBRSxFQUFFLENBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxNQUFNLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDdkIsR0FBRyxLQUFLO2FBQ1Q7U0FDRixDQUFDLEVBQ0osQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FDNUIsQ0FBQztJQUNKLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBYSxFQUFFLE9BQXlCO1FBQ3RELE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGdDQUFnQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRXhELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDbEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ25DLElBQUksRUFBRSxPQUFPO1NBQ2QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQWE7UUFDM0IsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsZ0NBQWdDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDekQsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNqQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FDZCxPQUFnQixFQUNoQixLQUFhLEVBQ2IsT0FBZ0IsRUFDaEIsS0FBcUI7UUFFckIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsbUJBQW1CO1FBRXZDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHVCQUF1QixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTlDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2xDLElBQUksRUFBRTtnQkFDSixLQUFLO2dCQUNMLFFBQVE7Z0JBQ1IsUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLEdBQUcsS0FBSztnQkFDUixLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssSUFBSSxPQUFPO2FBQy9CO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUNkLE9BQWdCLEVBQ2hCLGVBQXlCLEVBQ3pCLFVBQWtCLEVBQ2xCLEtBQWlDO1FBRWpDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRW5ELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2xDLElBQUksRUFBRTtnQkFDSixlQUFlLEVBQUUsZUFBZTtnQkFDaEMsV0FBVyxFQUFFLFVBQVU7Z0JBQ3ZCLFFBQVEsRUFBRSxPQUFPO2dCQUNqQixnRUFBZ0U7Z0JBQ2hFLDhEQUE4RDtnQkFDOUQsR0FBSSxLQUFhLEVBQUUseURBQXlEO2FBQzdFO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILFFBQVEsQ0FDTixJQUFjLEVBQ2QsSUFBZSxFQUNmLEtBQWMsRUFDZCxNQUFlO1FBRWYsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFN0MsT0FBTyxJQUFJLHFCQUFTLENBQ2xCLElBQUksSUFBSSxnQkFBSSxDQUFDLE9BQU8sRUFBRSxFQUN0QixDQUFDLEtBQUssRUFBRSxFQUFFLENBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzdGLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUNiLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQzVCLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsVUFBVSxDQUFDLEtBQWEsRUFBRSxJQUFlO1FBQ3ZDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLG1DQUFtQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pELE9BQU8sSUFBSSxxQkFBUyxDQUNsQixJQUFJLElBQUksZ0JBQUksQ0FBQyxPQUFPLEVBQUUsRUFDdEIsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQzNELENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUNaLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQzVCLENBQUM7SUFDSixDQUFDO0lBRUQsYUFBYTtJQUViLHlFQUF5RTtJQUV6RTs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBYTtRQUM1QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUUvQyxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQzlCLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVM7U0FDbEMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFjO1FBQzFCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDbEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1NBQ3RDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQWMsRUFBRSxPQUEwQjtRQUN6RCxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxrQ0FBa0MsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyQyxJQUFJLEVBQUUsT0FBTztTQUNkLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFjO1FBQzdCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGtDQUFrQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRTNELE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDakIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1NBQ3RDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQVMsQ0FBQyxJQUFlO1FBQ3ZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHdCQUF3QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLE9BQU8sSUFBSSxxQkFBUyxDQUNsQixJQUFJLElBQUksZ0JBQUksQ0FBQyxPQUFPLEVBQUUsRUFDdEIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUM5QyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFDZCxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUM1QixDQUFDO0lBQ0osQ0FBQztJQUVELGFBQWE7SUFFYiwrREFBK0Q7SUFFL0Q7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsTUFBZ0IsRUFBRSxNQUFrQjtRQUNwRSxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywyQ0FBMkMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVqRSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNyQyxJQUFJLEVBQUU7Z0JBQ0osT0FBTyxFQUFFLE1BQU07Z0JBQ2YsTUFBTSxFQUFFLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBbUM7YUFDM0Q7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQWMsRUFBRSxLQUFhO1FBQ2hELE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGdEQUFnRCxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXpFLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDakIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7U0FDckQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILFlBQVksQ0FBQyxNQUFjLEVBQUUsSUFBZTtRQUMxQyxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyx1Q0FBdUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUU3RCxPQUFPLElBQUkscUJBQVMsQ0FDbEIsSUFBSSxJQUFJLGdCQUFJLENBQUMsT0FBTyxFQUFFLEVBQ3RCLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FDUixJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLE1BQU0sRUFBRTtnQkFDTixJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFO2dCQUN6QixLQUFLO2FBQ047U0FDRixDQUFDLEVBQ0osQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQ2IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FDNUIsQ0FBQztJQUNKLENBQUM7SUFFRCxhQUFhO0lBRWIsaUVBQWlFO0lBRWpFOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjLEVBQUUsTUFBYztRQUM5QyxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxxREFBcUQsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUzRSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1NBQ3ZELENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBYyxFQUFFLE1BQWM7UUFDakQsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsa0RBQWtELEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFM0UsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNqQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtTQUN2RCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsYUFBYSxDQUFDLE1BQWMsRUFBRSxJQUFlO1FBQzNDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHdDQUF3QyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTlELE9BQU8sSUFBSSxxQkFBUyxDQUNsQixJQUFJLElBQUksZ0JBQUksQ0FBQyxPQUFPLEVBQUUsRUFDdEIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFDekUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQ2QsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FDNUIsQ0FBQztJQUNKLENBQUM7SUFFRCxhQUFhO0lBRWIsK0VBQStFO0lBRS9FOzs7Ozs7OztPQVFHO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FDakIsT0FBZSxFQUNmLE1BQWUsRUFDZixTQUEyQjtRQUUzQixTQUFTLEtBQUssNEJBQTRCLENBQUM7UUFDM0MsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsMEJBQTBCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFakQsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUM5QixJQUFJLEVBQUU7Z0JBQ0osT0FBTztnQkFDUCxNQUFNO2dCQUNOLGFBQWEsRUFBRSxTQUFTLENBQUMsSUFBSTtnQkFDN0IsZ0JBQWdCLEVBQUUsU0FBUyxDQUFDLE9BQU87Z0JBQ25DLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUNuQyxjQUFjLEVBQUUsU0FBUyxDQUFDLEtBQUs7YUFDaEM7U0FDRixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUEsMENBQTRCLEVBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUU7WUFDMUQsT0FBTztTQUNSLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxLQUFLLENBQUMscUJBQXFCLENBQ3pCLE9BQWUsRUFDZixNQUFlLEVBQ2YsUUFBeUIsRUFDekIsVUFBdUI7UUFFdkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsMEJBQTBCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFakQsTUFBTSxTQUFTLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRTtZQUNoRCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO2dCQUM5QixPQUFPO2dCQUNQLElBQUksRUFBRTtvQkFDSixPQUFPO29CQUNQLE1BQU07b0JBQ04sZ0JBQWdCLEVBQUUsSUFBSTtvQkFDdEIsYUFBYSxFQUFFLFFBQVEsQ0FBQyxJQUFJO29CQUM1QixnQkFBZ0IsRUFBRSxRQUFRLENBQUMsT0FBTztvQkFDbEMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLE9BQU87b0JBQ2xDLGNBQWMsRUFBRSxRQUFRLENBQUMsS0FBSztpQkFDL0I7YUFDRixDQUFDLENBQUM7WUFDSCxPQUFPLElBQUEsc0JBQVcsRUFBQyxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUN2QyxJQUFBLDBDQUE0QixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFO2dCQUMxRCxPQUFPO2FBQ1IsQ0FBQyxDQUNILENBQUM7UUFDSixDQUFDLENBQUM7UUFDRixPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILEtBQUssQ0FBQyxvQkFBb0IsQ0FDeEIsTUFBYyxFQUNkLE9BQWUsRUFDZixNQUFnQixFQUNoQixTQUEyQjtRQUUzQixTQUFTLEtBQUssNEJBQTRCLENBQUM7UUFDM0MsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMseUNBQXlDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDaEUsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUM5QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsSUFBSSxFQUFFO2dCQUNKLE9BQU87Z0JBQ1AsTUFBTTtnQkFDTixhQUFhLEVBQUUsU0FBUyxDQUFDLElBQUk7Z0JBQzdCLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxPQUFPO2dCQUNuQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsT0FBTztnQkFDbkMsY0FBYyxFQUFFLFNBQVMsQ0FBQyxLQUFLO2FBQ2hDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLDBDQUE0QixFQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFO1lBQzFELE9BQU8sRUFBRSxNQUFNO1lBQ2YsT0FBTztTQUNSLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFrQjtRQUNwQyxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyx1Q0FBdUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLFVBQVUsRUFBRSxTQUFTLElBQUksTUFBTSxFQUFFLEVBQUU7U0FDdEQsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsTUFBZTtRQUNwQyxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywwQkFBMEIsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNuRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFBRTtTQUNwQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsWUFBWSxDQUFDLE1BQWUsRUFBRSxJQUFlO1FBQzNDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWhELE9BQU8sSUFBSSxxQkFBUyxDQUNsQixJQUFJLElBQUksZ0JBQUksQ0FBQyxPQUFPLEVBQUUsRUFDdEIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUMxRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFDakIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FDNUIsQ0FBQztJQUNKLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsZUFBZTtRQUNuQixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN4QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxhQUFhO0lBRWIsNkZBQTZGO0lBRTdGOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsYUFBYTtRQUNqQixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxpQ0FBaUMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUV4RCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FBQyxLQUFvQjtRQUN2QyxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxrQ0FBa0MsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLElBQUksRUFBRSxLQUFLO1NBQ1osQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLElBQXdCO1FBQ3hDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDJCQUEyQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2xELE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFrQjtRQUNyQyxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywyQkFBMkIsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNwRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxZQUFZO1FBQ2hCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDJCQUEyQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pELE9BQU8sTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQsYUFBYTtJQUViLCtHQUErRztJQUUvRzs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBYTtRQUN4QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywrQkFBK0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyRCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtTQUNwQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFNUMsTUFBTSxFQUFFLFlBQVksRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDaEQsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBYSxFQUFFLE9BQWdCO1FBQzdDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLCtCQUErQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDbEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRTtTQUNsRSxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBYSxFQUFFLElBQVksRUFBRSxPQUFnQjtRQUM3RCxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxvQ0FBb0MsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU1RCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2xCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDakUsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFO1NBQ2YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBYTtRQUM3QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxvQ0FBb0MsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUUzRCxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ25DLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtTQUNwQyxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUksc0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxLQUFLLENBQUMsbUJBQW1CLENBQ3ZCLEtBQWEsRUFDYixPQUFnQixFQUNoQixXQUFtQixFQUNuQixVQUErQjtRQUUvQixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxvQ0FBb0MsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM1RCxPQUFPLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDeEIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUNqRSxJQUFJLEVBQUU7Z0JBQ0osWUFBWSxFQUFFLFdBQVc7Z0JBQ3pCLFVBQVU7YUFDWDtTQUNGLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxhQUFhO0lBRWIsc0tBQXNLO0lBRXRLOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQ1gsR0FBaUIsRUFDakIsR0FBbUIsRUFDbkIsVUFBdUI7UUFFdkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMscUNBQXFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFNUQsTUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxHQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRSxDQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzVCLElBQUksRUFBRSxHQUFHO1lBQ1QsT0FBTztTQUNSLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQ2QsR0FBaUIsRUFDakIsR0FBc0IsRUFDdEIsVUFBdUI7UUFFdkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsMkNBQTJDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFbEUsTUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxHQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRSxDQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzVCLElBQUksRUFBRSxHQUFHO1lBQ1QsT0FBTztTQUNSLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQ2QsR0FBaUIsRUFDakIsR0FBc0IsRUFDdEIsVUFBdUI7UUFFdkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsMkNBQTJDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFbEUsTUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxHQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRSxDQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzVCLElBQUksRUFBRSxHQUFHO1lBQ1QsT0FBTztTQUNSLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUNaLEdBQWlCLEVBQ2pCLEdBQW9CLEVBQ3BCLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHFDQUFxQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzVELE1BQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUUsR0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QixJQUFJLEVBQUUsR0FBRztZQUNULE9BQU87U0FDUixDQUFDLENBQUM7UUFDTCxPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUNiLEdBQXFCLEVBQ3JCLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDZCQUE2QixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BELE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxJQUFJLEVBQUUsR0FBRztZQUNULE9BQU87U0FDUixDQUFDLENBQUM7UUFDTCxPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FDZixHQUFpQixFQUNqQixHQUF1QixFQUN2QixVQUF1QjtRQUV2QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyx3Q0FBd0MsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMvRCxNQUFNLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFFLEdBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUMxRSxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFLENBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ1gsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxFQUFFLEdBQUc7WUFDVCxPQUFPO1NBQ1IsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxNQUFNLDZCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FDWCxHQUFpQixFQUNqQixFQUFTLEVBQ1QsVUFBdUI7UUFFdkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsb0NBQW9DLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxHQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRSxDQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzVCLElBQUksRUFBa0I7Z0JBQ3BCLEVBQUUsRUFBRSxFQUFhO2FBQ2xCO1lBQ0QsT0FBTztTQUNSLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsS0FBSyxDQUFDLGlCQUFpQixDQUNyQixHQUFpQixFQUNqQixRQUFrQixFQUNsQixFQUFVLEVBQ1YsVUFBdUI7UUFFdkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsZ0RBQWdELEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkUsTUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxHQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRSxDQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDakQsSUFBSSxFQUE4QjtnQkFDaEMsRUFBRTthQUNIO1lBQ0QsT0FBTztTQUNSLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FDWixHQUFpQixFQUNqQixHQUFvQixFQUNwQixVQUF1QjtRQUV2QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxxQ0FBcUMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU1RCxNQUFNLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFFLEdBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztRQUNsRSxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFLENBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ1gsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxFQUFFLEdBQUc7WUFDVCxPQUFPO1NBQ1IsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxNQUFNLDZCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQ1gsR0FBaUIsRUFDakIsR0FBbUIsRUFDbkIsVUFBdUI7UUFFdkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsb0NBQW9DLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDM0QsTUFBTSxNQUFNLEdBQUcsT0FBTyxHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBRSxHQUFjLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUM7UUFDMUUsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRSxDQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzVCLElBQUksRUFBRSxHQUFHO1lBQ1QsT0FBTyxFQUFFLE9BQU87U0FDakIsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxNQUFNLDZCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQ2xCLEdBQWlCLEVBQ2pCLEdBQTBCLEVBQzFCLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDRDQUE0QyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25FLE1BQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUUsR0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QixJQUFJLEVBQUUsR0FBRztZQUNULE9BQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUNmLEdBQWlCLEVBQ2pCLEdBQXVCLEVBQ3ZCLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDRDQUE0QyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25FLE1BQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUUsR0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QixJQUFJLEVBQUUsR0FBRztZQUNULE9BQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUNaLEdBQWlCLEVBQ2pCLEdBQW9CLEVBQ3BCLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHlDQUF5QyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2hFLE1BQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUUsR0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QixJQUFJLEVBQUUsR0FBRztZQUNULE9BQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUNaLEdBQWlCLEVBQ2pCLEdBQW9CLEVBQ3BCLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDZDQUE2QyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sTUFBTSxHQUFHLE9BQU8sR0FBRyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUUsR0FBYyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUM1QixJQUFJLEVBQUUsR0FBRztZQUNULE9BQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUMsQ0FBQztRQUNMLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsZUFBZSxDQUNuQixHQUFpQixFQUNqQixHQUEyQixFQUMzQixVQUF1QjtRQUV2QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywrQ0FBK0MsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0RSxNQUFNLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFFLEdBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUMxRSxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFLENBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ1gsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxFQUFFLEdBQUc7WUFDVCxPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDLENBQUM7UUFDTCxPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLHFCQUFxQixDQUN6QixHQUFpQixFQUNqQixHQUEwQixFQUMxQixVQUF1QjtRQUV2QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywyQ0FBMkMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsRSxNQUFNLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFFLEdBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUMxRSxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFLENBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ1gsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxFQUFFLEdBQUc7WUFDVCxPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDLENBQUM7UUFDTCxPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FDZCxHQUFpQixFQUNqQixHQUFzQixFQUN0QixVQUF1QjtRQUV2QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyx1Q0FBdUMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM5RCxNQUFNLE1BQU0sR0FBRyxPQUFPLEdBQUcsS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFFLEdBQWMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUMxRSxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFLENBQzdDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ1gsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxFQUFFLEdBQUc7WUFDVCxPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDLENBQUM7UUFDTCxPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUNYLE9BQTJCLEVBQzNCLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGdEQUFnRCxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDN0MsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ3hDLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLElBQUksRUFBRSxPQUFPO1NBQ2QsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxNQUFNLDZCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN2RSxDQUFDO0lBQ0QsYUFBYTtJQUViLDZEQUE2RDtJQUM3RDs7Ozs7OztPQU9HO0lBQ0gsY0FBYyxDQUNaLEtBQWMsRUFDZCxNQUFlLEVBQ2YsSUFBZTtRQUVmLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sSUFBSSxxQkFBUyxDQUNsQixJQUFJLElBQUksZ0JBQUksQ0FBQyxPQUFPLEVBQUUsRUFDdEIsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ1gsTUFBTSxFQUFFO2dCQUNOLEtBQUssRUFBRTtvQkFDTCxPQUFPLEVBQUUsTUFBTTtvQkFDZixNQUFNLEVBQUUsS0FBSztvQkFDYixHQUFHLEtBQUs7aUJBQ1Q7YUFDRjtTQUNGLENBQUMsRUFDSixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFDeEIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FDNUIsQ0FBQztJQUNKLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFhLEVBQUUsTUFBZTtRQUNuRCxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxpQ0FBaUMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxRCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ2pCLE1BQU0sRUFBRTtnQkFDTixLQUFLLEVBQUU7b0JBQ0wsTUFBTSxFQUFFLEtBQUs7b0JBQ2IsT0FBTyxFQUFFLE1BQU07aUJBQ2hCO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLGNBQWMsQ0FDbEIsS0FBYSxFQUNiLFVBQXVCO1FBRXZCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGlDQUFpQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hELE1BQU0sTUFBTSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUU7WUFDN0MsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtnQkFDbEIsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDdkIsT0FBTzthQUNSLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQztRQUNGLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsa0JBQWtCLENBQ3RCLEtBQWEsRUFDYixTQUFvQixFQUNwQixVQUF1QjtRQUV2QiwrQkFBK0I7UUFDL0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLDhCQUFnQixHQUFFLENBQUM7UUFDeEMsTUFBTSxZQUFZLEdBQUcsSUFBQSxxQkFBYyxFQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFM0YsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsaUNBQWlDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDekQsbUJBQW1CO1FBQ25CLE1BQU0sVUFBVSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FDakQsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7WUFDWCxJQUFJLEVBQUU7Z0JBQ0osTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsVUFBVSxFQUFFLFlBQVk7YUFDekI7WUFDRCxPQUFPO1NBQ1IsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxNQUFNLDZCQUFrQixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBQ0QsYUFBYTtJQUViLHFEQUFxRDtJQUNyRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLGtCQUFrQjtRQUN0QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyw2QkFBNkIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNuRCxPQUFPLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUFDLElBQXNCO1FBQ3JDLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ25ELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM5QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxhQUFhO0lBRWIsNEJBQTRCO0lBQzVCOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHdDQUF3QyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9ELE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDekIsQ0FBQztJQUNELGFBQWE7SUFFYixnQ0FBZ0M7SUFDaEM7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBcUIsRUFBRSxNQUFpQjtRQUNoRCxNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM1QyxNQUFNLElBQUksR0FBRztZQUNYLEVBQUUsRUFBRSxDQUFDO1lBQ0wsT0FBTyxFQUFFLEtBQUs7WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxNQUFNO1NBQ2YsQ0FBQztRQUNGLE1BQU0sSUFBSSxHQUFHLEtBQUssRUFBRSxPQUFxQixFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sSUFBSSxHQUFHLENBQUMsTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3RFLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGtDQUFrQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hELE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEQsT0FBTyxnQkFBd0MsQ0FBQztJQUNsRCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQWE7UUFDeEIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsMkNBQTJDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDakUsT0FBTyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFhO1FBQzNCLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDJDQUEyQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQWE7UUFDM0IsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsa0RBQWtELEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDekUsT0FBTyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxhQUFhO0lBRWI7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBaUIsRUFBRSxLQUFhO1FBQ3pELE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLHVCQUF1QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLE9BQU8sTUFBTSxJQUFBLGtCQUFVLEVBQUMsR0FBRyxFQUFFLENBQzNCLENBQUMsQ0FBQztZQUNBLE9BQU8sRUFBRSxHQUFHLENBQUMsYUFBYTtZQUMxQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7U0FDcEMsQ0FBQyxDQUNILENBQUMsSUFBSSxDQUFDLGdCQUFRLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7T0FVRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQzVCLEdBQWlCLEVBQ2pCLEtBQWEsRUFDYixLQUFhLEVBQ2IsTUFBb0IsRUFDcEIsU0FBeUIsRUFDekIsVUFBdUIsRUFDdkIsT0FBZ0I7UUFFaEIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFOUMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLE9BQXFCLEVBQUUsRUFBRTtZQUM5QyxNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsa0JBQVUsRUFBQyxHQUFHLEVBQUUsQ0FDakMsQ0FBQyxDQUFDO2dCQUNBLE9BQU8sRUFBRSxHQUFHLENBQUMsYUFBYTtnQkFDMUIsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNuQyxPQUFPLEVBQUU7b0JBQ1AsR0FBRyxPQUFPO29CQUNWLGFBQWEsRUFBRSxLQUFLO2lCQUNyQjtnQkFDRCxJQUFJLEVBQUU7b0JBQ0osTUFBTTtvQkFDTixPQUFPO29CQUNQLE1BQU0sRUFBRSxTQUFTO2lCQUNsQjthQUNGLENBQUMsQ0FDSCxDQUFDLElBQUksQ0FBQyxnQkFBUSxDQUFDLENBQUM7WUFFakIsT0FBTyxJQUFBLHNCQUFXLEVBQ2hCLElBQUksRUFDSixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQ2QsQ0FBYTtnQkFDWCxHQUFHLEVBQUU7b0JBQ0gsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLEdBQUc7aUJBQzdCO2dCQUNELE1BQU0sRUFBRSxLQUFLO2dCQUNiLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSztnQkFDeEIsV0FBVyxFQUFFLFdBQVcsQ0FBQyxVQUFVO2dCQUNuQyxPQUFPLEVBQUUsa0JBQWtCO2dCQUMzQixZQUFZLEVBQUUsV0FBVyxDQUFDLFlBQVk7YUFDdkMsQ0FBQSxDQUNKLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRixPQUFPLE1BQU0sNkJBQWtCLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDbkUsQ0FBQztJQUVEOzs7Ozs7OztPQVFHO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQzFCLEdBQWlCLEVBQ2pCLEtBQWEsRUFDYixJQUEyQjtRQUUzQixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxnQ0FBZ0MsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN2RCxPQUFPLElBQUEsa0JBQVUsRUFBQyxHQUFHLEVBQUUsQ0FDckIsQ0FBQyxDQUFDO1lBQ0EsT0FBTyxFQUFFLEdBQUcsQ0FBQyxhQUFhO1lBQzFCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuQyxJQUFJO1NBQ0wsQ0FBQyxDQUNILENBQUMsSUFBSSxDQUFDLGdCQUFRLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQ2xDLEdBQWlCLEVBQ2pCLEtBQWEsRUFDYixJQUEwQjtRQUUxQixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQyxzQ0FBc0MsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM3RCxPQUFPLElBQUEsa0JBQVUsRUFBQyxHQUFHLEVBQUUsQ0FDckIsQ0FBQyxDQUFDO1lBQ0EsT0FBTyxFQUFFLEdBQUcsQ0FBQyxhQUFhO1lBQzFCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuQyxJQUFJO1NBQ0wsQ0FBQyxDQUNILENBQUMsSUFBSSxDQUFDLGdCQUFRLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUNsQyxHQUFpQixFQUNqQixLQUFhLEVBQ2IsWUFBb0IsRUFDcEIsU0FBaUIsRUFDakIsV0FBbUI7UUFFbkIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsc0NBQXNDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFBLGtCQUFVLEVBQUMsR0FBRyxFQUFFLENBQ3BCLENBQUMsQ0FBQztZQUNBLE9BQU8sRUFBRSxHQUFHLENBQUMsYUFBYTtZQUMxQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbkMsSUFBSSxFQUFFO2dCQUNKLEtBQUssRUFBRSxHQUFHLFlBQVksSUFBSSxTQUFTLEVBQUU7Z0JBQ3JDLFlBQVksRUFBRSxXQUFXO2FBQzFCO1NBQ0YsQ0FBQyxDQUNILENBQUMsSUFBSSxDQUFDLGdCQUFRLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQzVCLEdBQWlCLEVBQ2pCLEtBQWEsRUFDYixLQUFhO1FBRWIsTUFBTSxDQUFDLEdBQUcsSUFBQSxVQUFFLEVBQUMsc0NBQXNDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0QsT0FBTyxJQUFBLGtCQUFVLEVBQUMsR0FBRyxFQUFFLENBQ3JCLENBQUMsQ0FBQztZQUNBLE9BQU8sRUFBRSxHQUFHLENBQUMsYUFBYTtZQUMxQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbkMsT0FBTyxFQUFFO2dCQUNQLGFBQWEsRUFBRSxLQUFLO2FBQ3JCO1NBQ0YsQ0FBQyxDQUNILENBQUMsSUFBSSxDQUFDLGdCQUFRLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBaUIsRUFBRSxLQUFhO1FBQ3BELE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNyQyxPQUFPLElBQUEsa0JBQVUsRUFBQyxHQUFHLEVBQUUsQ0FDckIsQ0FBQyxDQUFDO1lBQ0EsT0FBTyxFQUFFLEdBQUcsQ0FBQyxhQUFhO1lBQzFCLE9BQU8sRUFBRTtnQkFDUCxhQUFhLEVBQUUsS0FBSzthQUNyQjtTQUNGLENBQUMsQ0FDSCxDQUFDLElBQUksQ0FBQyxnQkFBUSxDQUFDLENBQUM7SUFDbkIsQ0FBQztDQTZCRjtBQTEzREQsOEJBMDNEQztpRkFwQnlCLElBQWM7SUFDcEMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLGVBQWUsRUFBRSxDQUFDO1FBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3BCLENBQUM7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMsNkVBUzRCLElBQW1CO0lBQzlDLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxlQUFlLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0gsTUFBTSw0QkFBNEIsR0FBb0I7SUFDcEQsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTO0lBQzFCLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUTtJQUNuQixPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVE7SUFDeEIsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVO0NBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIENyZWF0ZU9pZGNVc2VyT3B0aW9ucyxcbiAgSWRlbnRpdHlQcm9vZixcbiAgS2V5SW5Sb2xlSW5mbyxcbiAgS2V5SW5mbyxcbiAgT2lkY0lkZW50aXR5LFxuICBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICBSb2xlSW5mbyxcbiAgVXBkYXRlS2V5UmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVzcG9uc2UsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxuICBVc2VySW5PcmdJbmZvLFxuICBVc2VySW5Sb2xlSW5mbyxcbiAgR2V0VXNlcnNJbk9yZ1Jlc3BvbnNlLFxuICBVc2VySW5mbyxcbiAgU2Vzc2lvbkluZm8sXG4gIE9yZ0luZm8sXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRWlwMTkxT3I3MTJTaWduUmVzcG9uc2UsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVzcG9uc2UsXG4gIEV0aDJTaWduUmVxdWVzdCxcbiAgRXRoMlNpZ25SZXNwb25zZSxcbiAgRXRoMlN0YWtlUmVxdWVzdCxcbiAgRXRoMlN0YWtlUmVzcG9uc2UsXG4gIEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgRXRoMlVuc3Rha2VSZXNwb25zZSxcbiAgQmxvYlNpZ25SZXF1ZXN0LFxuICBCbG9iU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXF1ZXN0LFxuICBCdGNNZXNzYWdlU2lnblJlc3BvbnNlLFxuICBCdGNNZXNzYWdlU2lnblJlcXVlc3QsXG4gIFBzYnRTaWduUmVxdWVzdCxcbiAgUHNidFNpZ25SZXNwb25zZSxcbiAgU29sYW5hU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlc3BvbnNlLFxuICBBdmFTaWduUmVxdWVzdCxcbiAgQXZhU2VyaWFsaXplZFR4U2lnblJlcXVlc3QsXG4gIEF2YVR4LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgTWZhVm90ZSxcbiAgTWVtYmVyUm9sZSxcbiAgVXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2UsXG4gIFVzZXJFeHBvcnRJbml0UmVzcG9uc2UsXG4gIFVzZXJFeHBvcnRMaXN0UmVzcG9uc2UsXG4gIEtleVByb3BlcnRpZXMsXG4gIEVtcHR5LFxuICBVc2VyT3Jnc1Jlc3BvbnNlLFxuICBDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZSxcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbn0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgZW5jb2RlVG9CYXNlNjQgfSBmcm9tIFwiLi4vdXRpbFwiO1xuaW1wb3J0IHR5cGUgeyBNZmFSZWNlaXB0IH0gZnJvbSBcIi4uL21mYVwiO1xuaW1wb3J0IHsgQWRkRmlkb0NoYWxsZW5nZSwgTWZhRmlkb0NoYWxsZW5nZSwgVG90cENoYWxsZW5nZSB9IGZyb20gXCIuLi9tZmFcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJSZXNwb25zZSwgbWFwUmVzcG9uc2UgfSBmcm9tIFwiLi4vcmVzcG9uc2VcIjtcbmltcG9ydCB0eXBlIHsgS2V5LCBLZXlUeXBlIH0gZnJvbSBcIi4uL2tleVwiO1xuaW1wb3J0IHR5cGUgeyBQYWdlT3B0cyB9IGZyb20gXCIuLi9wYWdpbmF0b3JcIjtcbmltcG9ydCB7IFBhZ2UsIFBhZ2luYXRvciB9IGZyb20gXCIuLi9wYWdpbmF0b3JcIjtcbmltcG9ydCB0eXBlIHsgS2V5UG9saWN5IH0gZnJvbSBcIi4uL3JvbGVcIjtcbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiLi4vdXNlcl9leHBvcnRcIjtcbmltcG9ydCB0eXBlIHtcbiAgQWRkSWRlbnRpdHlSZXF1ZXN0LFxuICBBdmFDaGFpbixcbiAgRW52SW50ZXJmYWNlLFxuICBFb3RzQ3JlYXRlTm9uY2VSZXF1ZXN0LFxuICBFb3RzQ3JlYXRlTm9uY2VSZXNwb25zZSxcbiAgRW90c1NpZ25SZXF1ZXN0LFxuICBFb3RzU2lnblJlc3BvbnNlLFxuICBKcnBjUmVzcG9uc2UsXG4gIEpzb25BcnJheSxcbiAgTGlzdElkZW50aXR5UmVzcG9uc2UsXG4gIExpc3RLZXlSb2xlc1Jlc3BvbnNlLFxuICBMaXN0S2V5c1Jlc3BvbnNlLFxuICBMaXN0Um9sZUtleXNSZXNwb25zZSxcbiAgTGlzdFJvbGVVc2Vyc1Jlc3BvbnNlLFxuICBMaXN0Um9sZXNSZXNwb25zZSxcbiAgTW1pSnJwY01ldGhvZCxcbiAgUGVuZGluZ01lc3NhZ2VJbmZvLFxuICBQZW5kaW5nTWVzc2FnZVNpZ25SZXNwb25zZSxcbiAgUmF0Y2hldENvbmZpZyxcbiAgU2NvcGUsXG4gIFNlc3Npb25EYXRhLFxuICBTZXNzaW9uTGlmZXRpbWUsXG4gIFNlc3Npb25zUmVzcG9uc2UsXG4gIFRhcHJvb3RTaWduUmVxdWVzdCxcbiAgVGFwcm9vdFNpZ25SZXNwb25zZSxcbiAgQmFieWxvblN0YWtpbmdSZXF1ZXN0LFxuICBCYWJ5bG9uU3Rha2luZ1Jlc3BvbnNlLFxuICBVcGRhdGVVc2VyTWVtYmVyc2hpcFJlcXVlc3QsXG4gIEhpc3RvcmljYWxUeCxcbiAgTGlzdEhpc3RvcmljYWxUeFJlc3BvbnNlLFxuICBQdWJsaWNPcmdJbmZvLFxuICBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICBQYXNzd29yZFJlc2V0UmVxdWVzdCxcbiAgRW1haWxPdHBSZXNwb25zZSxcbiAgQXV0aGVudGljYXRpb25SZXF1ZXN0LFxuICBBdXRoZW50aWNhdGlvblJlc3BvbnNlLFxufSBmcm9tIFwiLi4vaW5kZXhcIjtcbmltcG9ydCB7IGFzc2VydE9rLCBvcCB9IGZyb20gXCIuLi9mZXRjaFwiO1xuaW1wb3J0IHsgQmFzZUNsaWVudCwgc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyB9IGZyb20gXCIuL2Jhc2VfY2xpZW50XCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5cbi8qKlxuICogU3RyaW5nIHJldHVybmVkIGJ5IEFQSSB3aGVuIGEgdXNlciBkb2VzIG5vdCBoYXZlIGFuIGVtYWlsIGFkZHJlc3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSlcbiAqL1xuY29uc3QgRU1BSUxfTk9UX0ZPVU5EID0gXCJlbWFpbCBub3QgZm91bmRcIjtcblxuLyoqXG4gKiBBbiBleHRlbnNpb24gb2YgQmFzZUNsaWVudCB0aGF0IGFkZHMgc3BlY2lhbGl6ZWQgbWV0aG9kcyBmb3IgYXBpIGVuZHBvaW50c1xuICovXG5leHBvcnQgY2xhc3MgQXBpQ2xpZW50IGV4dGVuZHMgQmFzZUNsaWVudCB7XG4gIC8vICNyZWdpb24gVVNFUlM6IHVzZXJHZXQsIHVzZXJUb3RwKFJlc2V0SW5pdHxSZXNldENvbXBsZXRlfFZlcmlmeXxEZWxldGUpLCB1c2VyRmlkbyhSZWdpc3RlckluaXR8UmVnaXN0ZXJDb21wbGV0ZXxEZWxldGUpXG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVzZXJJbmZvPn0gUmV0cmlldmVzIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqL1xuICBhc3luYyB1c2VyR2V0KCk6IFByb21pc2U8VXNlckluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWVcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHt9KS50aGVuKEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIFRPVFAuIFJldHVybnMgYSB7QGxpbmsgVG90cENoYWxsZW5nZX1cbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGVpdGhlciBieSBjYWxsaW5nIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0gKG9yXG4gICAqIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBSZXNldENvbXBsZXRlfSkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpc3N1ZXIgT3B0aW9uYWwgaXNzdWVyOyBkZWZhdWx0cyB0byBcIkN1YmlzdFwiXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBSZXNldEluaXQoXG4gICAgaXNzdWVyPzogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxUb3RwQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCByZXNldFRvdHBGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBpc3N1ZXJcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgaXNzdWVyLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKGRhdGEsICh0b3RwSW5mbykgPT4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcywgdG90cEluZm8pKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXNldFRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHVzZXJUb3RwUmVzZXRJbml0fS4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3RwSWQgLSBUaGUgSUQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIC0gVGhlIFRPVFAgY29kZSB0aGF0IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwUmVzZXRDb21wbGV0ZSh0b3RwSWQ6IHN0cmluZywgY29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogeyB0b3RwX2lkOiB0b3RwSWQsIGNvZGUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyBhIGdpdmVuIFRPVFAgY29kZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqIFRocm93cyBhbiBlcnJvciBpZiB0aGUgdmVyaWZpY2F0aW9uIGZhaWxzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSBDdXJyZW50IFRPVFAgY29kZVxuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBWZXJpZnkoY29kZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHAvdmVyaWZ5XCIsIFwicG9zdFwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7IGNvZGUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgVE9UUCBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogQWxsb3dlZCBvbmx5IGlmIGF0IGxlYXN0IG9uZSBGSURPIGtleSBpcyByZWdpc3RlcmVkIHdpdGggdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBNRkEgdmlhIEZJRE8gaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwRGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwgXCJkZWxldGVcIik7XG4gICAgY29uc3QgZGVsZXRlVG90cEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBkZWxldGVUb3RwRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFkZGluZyBhIG5ldyBGSURPIGRldmljZS4gTUZBIG1heSBiZSByZXF1aXJlZC4gIFRoaXMgcmV0dXJucyBhIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgd2l0aCB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yIHtAbGluayB1c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGV9XG4gICAqIChhZnRlciBNRkEgYXBwcm92YWxzKS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIG5ldyBkZXZpY2UuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBZGRGaWRvQ2hhbGxlbmdlPj59IEEgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBpbiBvcmRlciB0byBjb21wbGV0ZSBGSURPIHJlZ2lzdHJhdGlvbi5cbiAgICovXG4gIGFzeW5jIHVzZXJGaWRvUmVnaXN0ZXJJbml0KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QWRkRmlkb0NoYWxsZW5nZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgYWRkRmlkb0ZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHsgbmFtZSB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKGMpID0+IG5ldyBBZGRGaWRvQ2hhbGxlbmdlKHRoaXMsIGMpKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBhZGRGaWRvRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgdXNlckZpZG9SZWdpc3RlckluaXR9KSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKiBAcGFyYW0ge1B1YmxpY0tleUNyZWRlbnRpYWx9IGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9SZWdpc3RlckNvbXBsZXRlKGNoYWxsZW5nZUlkOiBzdHJpbmcsIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWRvSWQgVGhlIElEIG9mIHRoZSBkZXNpcmVkIEZJRE8ga2V5XG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9EZWxldGUoXG4gICAgZmlkb0lkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IGRlbGV0ZUZpZG9GbiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvL3tmaWRvX2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGZpZG9faWQ6IGZpZG9JZCB9IH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBkZWxldGVGaWRvRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHUzogb3JnR2V0LCBvcmdVcGRhdGUsIG9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwXG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCBhbiBvcmdcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG9yZ0lkIFRoZSBvcmcgdG8gZ2V0IGluZm8gZm9yXG4gICAqIEByZXR1cm4ge09yZ0luZm99IEluZm9ybWF0aW9uIGFib3V0IHRoZSBvcmdhbml6YXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdHZXQob3JnSWQ/OiBzdHJpbmcpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgb3JnX2lkOiBvcmdJZCA/PyB0aGlzLnNlc3Npb25NZXRhLm9yZ19pZCB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIG9yZy5cbiAgICogQHBhcmFtIHtVcGRhdGVPcmdSZXF1ZXN0fSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybiB7VXBkYXRlT3JnUmVzcG9uc2V9IFVwZGF0ZWQgb3JnIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgb3JnVXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZU9yZ1JlcXVlc3QpOiBQcm9taXNlPFVwZGF0ZU9yZ1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfVwiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7IGJvZHk6IHJlcXVlc3QgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHVzZXIncyBtZW1iZXJzaGlwIGluIHRoaXMgb3JnLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB3aG9zZSBtZW1iZXJzaGlwIHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHtVcGRhdGVVc2VyTWVtYmVyc2hpcFJlcXVlc3R9IHJlcSBUaGUgdXBkYXRlIHJlcXVlc3RcbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VySW5PcmdJbmZvPn0gVXBkYXRlZCB1c2VyIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIG9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwKFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHJlcTogVXBkYXRlVXNlck1lbWJlcnNoaXBSZXF1ZXN0LFxuICApOiBQcm9taXNlPFVzZXJJbk9yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzL3t1c2VyX2lkfS9tZW1iZXJzaGlwXCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgICAgYm9keTogcmVxLFxuICAgIH0pLnRoZW4oQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluT3JnSW5mbyk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBPUkcgVVNFUlM6IG9yZ1VzZXJJbnZpdGUsIG9yZ1VzZXJEZWxldGUsIG9yZ1VzZXJzTGlzdCwgb3JnVXNlckdldCwgb3JnVXNlckNyZWF0ZU9pZGMsIG9yZ1VzZXJEZWxldGVPaWRjXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyAoZmlyc3QtcGFydHkpIHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZCBhbiBlbWFpbCBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGVtYWlsIEVtYWlsIG9mIHRoZSB1c2VyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBmdWxsIG5hbWUgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIHtNZW1iZXJSb2xlfSByb2xlIE9wdGlvbmFsIHJvbGUuIERlZmF1bHRzIHRvIFwiYWxpZW5cIi5cbiAgICogQHBhcmFtIHtib29sZWFufSBza2lwRW1haWwgT3B0aW9uYWxseSBza2lwIHNlbmRpbmcgdGhlIGludml0ZSBlbWFpbC5cbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJJbnZpdGUoXG4gICAgZW1haWw6IHN0cmluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcm9sZT86IE1lbWJlclJvbGUsXG4gICAgc2tpcEVtYWlsPzogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbnZpdGVcIiwgXCJwb3N0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZW1haWwsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHJvbGUsXG4gICAgICAgIHNraXBfZW1haWw6ICEhc2tpcEVtYWlsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHVzZXIgZnJvbSB0aGUgb3JnLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUuXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8R2V0VXNlcnNJbk9yZ1Jlc3BvbnNlLCBVc2VySW5PcmdJbmZvPn0gUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgdXNlcnMgaW4gdGhlIG9yZy5cbiAgICovXG4gIG9yZ1VzZXJzTGlzdChwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8R2V0VXNlcnNJbk9yZ1Jlc3BvbnNlLCBVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHt9LCAuLi5xdWVyeSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMubWFwKEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbk9yZ0luZm8pLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdldC5cbiAgICogQHJldHVybiB7VXNlckluT3JnSW5mb30gT3JnIHVzZXIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VyR2V0KHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vycy97dXNlcl9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluT3JnSW5mbyhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyLiBUaGlzIGNhbiBiZSBhIGZpcnN0LXBhcnR5IFwiTWVtYmVyXCIgb3IgdGhpcmQtcGFydHkgXCJBbGllblwiLlxuICAgKiBAcGFyYW0ge09pZGNJZGVudGl0eX0gaWRlbnRpdHkgVGhlIGlkZW50aXR5IG9mIHRoZSBPSURDIHVzZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGVtYWlsIEVtYWlsIG9mIHRoZSBPSURDIHVzZXJcbiAgICogQHBhcmFtIHtDcmVhdGVPaWRjVXNlck9wdGlvbnN9IG9wdHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBuZXcgT0lEQyB1c2Vyc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFVzZXIgaWQgb2YgdGhlIG5ldyB1c2VyXG4gICAqL1xuICBhc3luYyBvcmdVc2VyQ3JlYXRlT2lkYyhcbiAgICBpZGVudGl0eTogT2lkY0lkZW50aXR5LFxuICAgIGVtYWlsPzogc3RyaW5nIHwgbnVsbCxcbiAgICBvcHRzOiBDcmVhdGVPaWRjVXNlck9wdGlvbnMgPSB7fSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHsgdXNlcl9pZCB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgaWRlbnRpdHksXG4gICAgICAgIHJvbGU6IG9wdHMubWVtYmVyUm9sZSA/PyBcIkFsaWVuXCIsXG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lOiBvcHRzLm5hbWUsXG4gICAgICAgIG1mYV9wb2xpY3k6IG9wdHMubWZhUG9saWN5LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiB1c2VyX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyBPSURDIHVzZXIuXG4gICAqIEBwYXJhbSB7T2lkY0lkZW50aXR5fSBpZGVudGl0eSBUaGUgaWRlbnRpdHkgb2YgdGhlIE9JREMgdXNlclxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckRlbGV0ZU9pZGMoaWRlbnRpdHk6IE9pZGNJZGVudGl0eSkge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkY1wiLCBcImRlbGV0ZVwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogaWRlbnRpdHksXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBLRVlTOiBrZXlHZXQsIGtleVVwZGF0ZSwga2V5RGVsZXRlLCBrZXlzQ3JlYXRlLCBrZXlzRGVyaXZlLCBrZXlzTGlzdCwga2V5SGlzdG9yeVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMga2V5R2V0KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgdHlwZSBhbmQgbWF0ZXJpYWwgaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUga2V5IHR5cGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtYXRlcmlhbElkIFRoZSBtYXRlcmlhbCBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybiB7S2V5SW5mb30gVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGtleUdldEJ5TWF0ZXJpYWxJZChrZXlUeXBlOiBLZXlUeXBlLCBtYXRlcmlhbElkOiBzdHJpbmcpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV90eXBlfS97bWF0ZXJpYWxfaWR9XCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfdHlwZToga2V5VHlwZSwgbWF0ZXJpYWxfaWQ6IG1hdGVyaWFsSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHJvbGVzIGEga2V5IGlzIGluLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8TGlzdEtleVJvbGVzUmVzcG9uc2UsIEtleUluUm9sZUluZm8+fSBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSByb2xlcyBhIGtleSBpcyBpbi5cbiAgICovXG4gIGtleVJvbGVzTGlzdChrZXlJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdEtleVJvbGVzUmVzcG9uc2UsIEtleUluUm9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vcm9sZXNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIucm9sZXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0ge1VwZGF0ZUtleVJlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKi9cbiAgYXN5bmMga2V5VXBkYXRlKGtleUlkOiBzdHJpbmcsIHJlcXVlc3Q6IFVwZGF0ZUtleVJlcXVlc3QpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJwYXRjaFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCAtIEtleSBpZFxuICAgKi9cbiAgYXN5bmMga2V5RGVsZXRlKGtleUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgc2lnbmluZyBrZXlzLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHtLZXlQcm9wZXJ0aWVzP30gcHJvcHMgQWRkaXRpb25hbCBrZXkgcHJvcGVydGllc1xuICAgKiBAcmV0dXJuIHtLZXlJbmZvW119IFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNDcmVhdGUoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICAgcHJvcHM/OiBLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleUluZm9bXT4ge1xuICAgIGNvbnN0IGNoYWluX2lkID0gMDsgLy8gbm90IHVzZWQgYW55bW9yZVxuXG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY291bnQsXG4gICAgICAgIGNoYWluX2lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgIG93bmVyOiBwcm9wcz8ub3duZXIgPz8gb3duZXJJZCxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgYSBzcGVjaWZpZWQgdHlwZSB1c2luZyBhIHN1cHBsaWVkIGRlcml2YXRpb24gcGF0aCBhbmQgYW4gZXhpc3RpbmcgbG9uZy1saXZlZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBkZXJpdmF0aW9uUGF0aHMgRGVyaXZhdGlvbiBwYXRocyBmcm9tIHdoaWNoIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0geyBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzIH0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvW119IFRoZSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzRGVyaXZlKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZGVyaXZlX2tleVwiLCBcInB1dFwiKTtcblxuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZGVyaXZhdGlvbl9wYXRoOiBkZXJpdmF0aW9uUGF0aHMsXG4gICAgICAgIG1uZW1vbmljX2lkOiBtbmVtb25pY0lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgICAgLy8gQ2FzdGluZyBgcHJvcHMucG9saWN5YCB0byB0aGUgcHJvcGVyIHR5cGUgZG9lcyBub3Qgd29yayBoZXJlOlxuICAgICAgICAvLyB0c2MgYXBwZWFycyB0byBnZXQgdGhlIHR5cGUgd3JvbmcuIE91ciB3b3JrYXJvdW5kIGlzIGBhbnlgLlxuICAgICAgICAuLi4ocHJvcHMgYXMgYW55KSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwga2V5cyBpbiB0aGUgb3JnLlxuICAgKiBAcGFyYW0ge0tleVR5cGU/fSB0eXBlIE9wdGlvbmFsIGtleSB0eXBlIHRvIGZpbHRlciBsaXN0IGZvci5cbiAgICogQHBhcmFtIHtQYWdlT3B0cz99IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXIgT3B0aW9uYWwga2V5IG93bmVyIHRvIGZpbHRlciBsaXN0IGZvci5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBzZWFyY2ggT3B0aW9uYWxseSBzZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgSUQgYW5kIG1ldGFkYXRhXG4gICAqIEByZXR1cm4ge1BhZ2luYXRvcjxMaXN0S2V5c1Jlc3BvbnNlLCBLZXlJbmZvPn0gUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBrZXlzLlxuICAgKi9cbiAga2V5c0xpc3QoXG4gICAgdHlwZT86IEtleVR5cGUsXG4gICAgcGFnZT86IFBhZ2VPcHRzLFxuICAgIG93bmVyPzogc3RyaW5nLFxuICAgIHNlYXJjaD86IHN0cmluZyxcbiAgKTogUGFnaW5hdG9yPExpc3RLZXlzUmVzcG9uc2UsIEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeTogeyBrZXlfdHlwZTogdHlwZSwga2V5X293bmVyOiBvd25lciwgc2VhcmNoLCAuLi5xdWVyeSB9IH0gfSksXG4gICAgICAocikgPT4gci5rZXlzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCByZWNlbnQgaGlzdG9yaWNhbCBrZXkgdHJhbnNhY3Rpb25zLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGtleSBpZC5cbiAgICogQHBhcmFtIHtQYWdlT3B0cz99IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1BhZ2luYXRvcjxMaXN0SGlzdG9yaWNhbFR4UmVzcG9uc2UsIEhpc3RvcmljYWxUeD59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgaGlzdG9yaWNhbCB0cmFuc2FjdGlvbnMuXG4gICAqL1xuICBrZXlIaXN0b3J5KGtleUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0SGlzdG9yaWNhbFR4UmVzcG9uc2UsIEhpc3RvcmljYWxUeD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfS90eFwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAoKSA9PiB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSB9KSxcbiAgICAgIChyKSA9PiByLnR4cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRVM6IHJvbGVDcmVhdGUsIHJvbGVSZWFkLCByb2xlVXBkYXRlLCByb2xlRGVsZXRlLCByb2xlc0xpc3RcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gbmFtZSBUaGUgb3B0aW9uYWwgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgSUQgb2YgdGhlIG5ldyByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUNyZWF0ZShuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogbmFtZSA/IHsgbmFtZSB9IDogdW5kZWZpbmVkLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRhdGEucm9sZV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByb2xlIGJ5IGl0cyBpZCAob3IgbmFtZSkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIGlkIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybiB7Um9sZUluZm99IFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUdldChyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB7VXBkYXRlUm9sZVJlcXVlc3R9IHJlcXVlc3QgVGhlIHVwZGF0ZSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFJvbGVJbmZvPn0gVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIHJvbGVVcGRhdGUocm9sZUlkOiBzdHJpbmcsIHJlcXVlc3Q6IFVwZGF0ZVJvbGVSZXF1ZXN0KTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSByb2xlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUgdG8gZGVsZXRlLlxuICAgKi9cbiAgYXN5bmMgcm9sZURlbGV0ZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7Um9sZUluZm99IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgcm9sZXMuXG4gICAqL1xuICByb2xlc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlc1Jlc3BvbnNlLCBSb2xlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PiB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcXVlcnkgfSB9KSxcbiAgICAgIChyKSA9PiByLnJvbGVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFIEtFWVM6IHJvbGVLZXlzQWRkLCByb2xlS2V5c0RlbGV0ZSwgcm9sZUtleXNMaXN0XG5cbiAgLyoqXG4gICAqIEFkZCBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGtleUlkcyBUaGUgSURzIG9mIHRoZSBrZXlzIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHtLZXlQb2xpY3k/fSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byBlYWNoIGtleS5cbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzQWRkKHJvbGVJZDogc3RyaW5nLCBrZXlJZHM6IHN0cmluZ1tdLCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfa2V5c1wiLCBcInB1dFwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBrZXlfaWRzOiBrZXlJZHMsXG4gICAgICAgIHBvbGljeTogKHBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGVcbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIGtleXMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSBrZXlzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8TGlzdFJvbGVLZXlzUmVzcG9uc2UsIEtleUluUm9sZUluZm8+fSBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSBrZXlzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZUtleXNMaXN0KHJvbGVJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdFJvbGVLZXlzUmVzcG9uc2UsIEtleUluUm9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9rZXlzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PlxuICAgICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSxcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIua2V5cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRSBVU0VSUzogcm9sZVVzZXJBZGQsIHJvbGVVc2VyUmVtb3ZlLCByb2xlVXNlcnNMaXN0XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyByb2xlVXNlckFkZChyb2xlSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfdXNlci97dXNlcl9pZH1cIiwgXCJwdXRcIik7XG5cbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkLCB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyB1c2VyIGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJSZW1vdmUocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIHVzZXJzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8TGlzdFJvbGVVc2Vyc1Jlc3BvbnNlLCBVc2VySW5Sb2xlSW5mbz59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHVzZXJzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZVVzZXJzTGlzdChyb2xlSWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS91c2Vyc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5LCBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0gfSksXG4gICAgICAocikgPT4gci51c2VycyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0VTU0lPTlM6IHNlc3Npb24oQ3JlYXRlfENyZWF0ZUZvclJvbGV8UmVmcmVzaHxSZXZva2V8TGlzdHxLZXlzTGlzdClcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7U2NvcGVbXX0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLlxuICAgKiBAcGFyYW0ge1Nlc3Npb25MaWZldGltZX0gbGlmZXRpbWVzIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2Vzc2lvbkRhdGE+fSBOZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGUoXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3BlczogU2NvcGVbXSxcbiAgICBsaWZldGltZXM/OiBTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBsaWZldGltZXMgPz89IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBwdXJwb3NlLFxuICAgICAgICBzY29wZXMsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lcy5hdXRoLFxuICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiBsaWZldGltZXMucmVmcmVzaCxcbiAgICAgICAgc2Vzc2lvbl9saWZldGltZTogbGlmZXRpbWVzLnNlc3Npb24sXG4gICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZXMuZ3JhY2UsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKHRoaXMuc2Vzc2lvbk1ldGEsIGRhdGEsIHtcbiAgICAgIHB1cnBvc2UsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpIHdob3NlIGxpZmV0aW1lIHBvdGVudGlhbGx5XG4gICAqIGV4dGVuZHMgdGhlIGxpZmV0aW1lIG9mIHRoZSBjdXJyZW50IHNlc3Npb24uICBNRkEgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcHVycG9zZSBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1Njb3BlW119IHNjb3BlcyBTZXNzaW9uIHNjb3Blcy5cbiAgICogQHBhcmFtIHtTZXNzaW9uTGlmZXRpbWV9IGxpZmV0aW1lIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2Vzc2lvbkRhdGE+Pn0gTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlRXh0ZW5kZWQoXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3BlczogU2NvcGVbXSxcbiAgICBsaWZldGltZTogU2Vzc2lvbkxpZmV0aW1lLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcmVxdWVzdEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICBleHRlbmRfbGlmZXRpbWVzOiB0cnVlLFxuICAgICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lLmF1dGgsXG4gICAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWUucmVmcmVzaCxcbiAgICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZS5zZXNzaW9uLFxuICAgICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZS5ncmFjZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKHJlc3AsIChzZXNzaW9uSW5mbykgPT5cbiAgICAgICAgc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBzZXNzaW9uSW5mbywge1xuICAgICAgICAgIHB1cnBvc2UsXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXF1ZXN0Rm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbiBmb3IgYSBnaXZlbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtTY29wZVtdfSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuIE5vdCBhbGwgc2NvcGVzIGFyZSB2YWxpZCBmb3IgYSByb2xlLlxuICAgKiBAcGFyYW0ge1Nlc3Npb25MaWZldGltZX0gbGlmZXRpbWVzIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2Vzc2lvbkRhdGE+fSBOZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGVGb3JSb2xlKFxuICAgIHJvbGVJZDogc3RyaW5nLFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBzY29wZXM/OiBTY29wZVtdLFxuICAgIGxpZmV0aW1lcz86IFNlc3Npb25MaWZldGltZSxcbiAgKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIGxpZmV0aW1lcyA/Pz0gZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnNcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcHVycG9zZSxcbiAgICAgICAgc2NvcGVzLFxuICAgICAgICBhdXRoX2xpZmV0aW1lOiBsaWZldGltZXMuYXV0aCxcbiAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWVzLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IGxpZmV0aW1lcy5zZXNzaW9uLFxuICAgICAgICBncmFjZV9saWZldGltZTogbGlmZXRpbWVzLmdyYWNlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKHRoaXMuc2Vzc2lvbk1ldGEsIGRhdGEsIHtcbiAgICAgIHJvbGVfaWQ6IHJvbGVJZCxcbiAgICAgIHB1cnBvc2UsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGEgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtzZXNzaW9uSWRdIFRoZSBJRCBvZiB0aGUgc2Vzc2lvbiB0byByZXZva2UuIFRoaXMgc2Vzc2lvbiBieSBkZWZhdWx0XG4gICAqL1xuICBhc3luYyBzZXNzaW9uUmV2b2tlKHNlc3Npb25JZD86IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvbi97c2Vzc2lvbl9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHNlc3Npb25faWQ6IHNlc3Npb25JZCA/PyBcInNlbGZcIiB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGFsbCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyb2xlSWRdIFRoZSBJRCBvZiBhIHJvbGUgd2hvc2Ugc2Vzc2lvbnMgdG8gcmV2b2tlLiBJZiBub3QgZGVmaW5lZCwgYWxsIHRoZSBjdXJyZW50IHVzZXIncyBzZXNzaW9ucyB3aWxsIGJlIHJldm9rZWQgaW5zdGVhZC5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25SZXZva2VBbGwocm9sZUlkPzogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcXVlcnk6IHsgcm9sZTogcm9sZUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBhbGwgc2lnbmVyIHNlc3Npb25zIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz99IHJvbGVJZCBJZiBzZXQsIGxpbWl0IHRvIHNlc3Npb25zIGZvciB0aGlzIHJvbGUgb25seS5cbiAgICogQHBhcmFtIHtQYWdlT3B0cz99IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT59IFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgc2Vzc2lvbnNMaXN0KHJvbGVJZD86IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPFNlc3Npb25zUmVzcG9uc2UsIFNlc3Npb25JbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PiB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcXVlcnk6IHsgcm9sZTogcm9sZUlkLCAuLi5xdWVyeSB9IH0gfSksXG4gICAgICAocikgPT4gci5zZXNzaW9ucyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxpc3Qgb2Yga2V5cyB0aGF0IHRoaXMgc2Vzc2lvbiBoYXMgYWNjZXNzIHRvLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvW119IFRoZSBsaXN0IG9mIGtleXMuXG4gICAqL1xuICBhc3luYyBzZXNzaW9uS2V5c0xpc3QoKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Rva2VuL2tleXNcIiwgXCJnZXRcIik7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gSURFTlRJVFk6IGlkZW50aXR5UHJvdmUsIGlkZW50aXR5VmVyaWZ5LCBpZGVudGl0eUFkZCwgaWRlbnRpdHlSZW1vdmUsIGlkZW50aXR5TGlzdFxuXG4gIC8qKlxuICAgKiBPYnRhaW4gcHJvb2Ygb2YgYXV0aGVudGljYXRpb24gdXNpbmcgdGhlIGN1cnJlbnQgQ3ViZVNpZ25lciBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlQcm92ZSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlXCIsIFwicG9zdFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge0lkZW50aXR5UHJvb2Z9IHByb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICovXG4gIGFzeW5jIGlkZW50aXR5VmVyaWZ5KHByb29mOiBJZGVudGl0eVByb29mKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS92ZXJpZnlcIiwgXCJwb3N0XCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiBwcm9vZixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NvY2lhdGVzIGFuIE9JREMgaWRlbnRpdHkgd2l0aCB0aGUgY3VycmVudCB1c2VyJ3MgYWNjb3VudC5cbiAgICpcbiAgICogQHBhcmFtIHtBZGRJZGVudGl0eVJlcXVlc3R9IGJvZHkgVGhlIHJlcXVlc3QgYm9keSwgY29udGFpbmluZyBhbiBPSURDIHRva2VuIHRvIHByb3ZlIHRoZSBpZGVudGl0eSBvd25lcnNoaXAuXG4gICAqL1xuICBhc3luYyBpZGVudGl0eUFkZChib2R5OiBBZGRJZGVudGl0eVJlcXVlc3QpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gT0lEQyBpZGVudGl0eSBmcm9tIHRoZSBjdXJyZW50IHVzZXIncyBhY2NvdW50LlxuICAgKlxuICAgKiBAcGFyYW0ge09pZGNJZGVudGl0eX0gYm9keSBUaGUgaWRlbnRpdHkgdG8gcmVtb3ZlLlxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlSZW1vdmUoYm9keTogT2lkY0lkZW50aXR5KSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3RzIGFzc29jaWF0ZWQgT0lEQyBpZGVudGl0aWVzIHdpdGggdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybiB7TGlzdElkZW50aXR5UmVzcG9uc2V9IEFzc29jaWF0ZWQgaWRlbnRpdGllc1xuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlMaXN0KCk6IFByb21pc2U8TGlzdElkZW50aXR5UmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gTUZBOiBtZmFHZXQsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUFwcHJvdmVUb3RwLCBtZmFBcHByb3ZlRmlkbyhJbml0fENvbXBsZXRlKVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgZXhpc3RpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm9bXT59IFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhXCIsIFwiZ2V0XCIpO1xuXG4gICAgY29uc3QgeyBtZmFfcmVxdWVzdHMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gICAgcmV0dXJuIG1mYV9yZXF1ZXN0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIHtNZmFWb3RlfSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYVZvdGVDcyhtZmFJZDogc3RyaW5nLCBtZmFWb3RlOiBNZmFWb3RlKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBJRCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcGFyYW0ge01mYVZvdGV9IG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFWb3RlVG90cChtZmFJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vdG90cFwiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uIEEgY2hhbGxlbmdlIGlzXG4gICAqIHJldHVybmVkIHdoaWNoIG11c3QgYmUgYW5zd2VyZWQgdmlhIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIG1mYVZvdGVGaWRvQ29tcGxldGV9LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElELlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+fSBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIG1mYUZpZG9Jbml0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9maWRvXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGNoYWxsZW5nZSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgTWZhRmlkb0NoYWxsZW5nZSh0aGlzLCBtZmFJZCwgY2hhbGxlbmdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIG1mYUZpZG9Jbml0fSkgTUZBIHJlcXVlc3QgdXNpbmcgRklETy5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcGFyYW0ge01mYVZvdGV9IG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFsbGVuZ2VJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIG1mYUZpZG9Jbml0fVxuICAgKiBAcGFyYW0ge1B1YmxpY0tleUNyZWRlbnRpYWx9IGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUZpZG9Db21wbGV0ZShcbiAgICBtZmFJZDogc3RyaW5nLFxuICAgIG1mYVZvdGU6IE1mYVZvdGUsXG4gICAgY2hhbGxlbmdlSWQ6IHN0cmluZyxcbiAgICBjcmVkZW50aWFsOiBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICApOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZmlkb1wiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0lHTjogc2lnbkV2bSwgc2lnbkV0aDIsIHNpZ25TdGFrZSwgc2lnblVuc3Rha2UsIHNpZ25BdmEsIHNpZ25TZXJpYWxpemVkQXZhLCBzaWduQmxvYiwgc2lnbkJ0Yywgc2lnblRhcHJvb3QsIHNpZ25Tb2xhbmEsIHNpZ25Fb3RzLCBlb3RzQ3JlYXRlTm9uY2UsIHNpZ25NbWlcblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0V2bVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV2bVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC0xOTEgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDE5MVNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0Jsb2JTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdm1TaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRWlwMTkxU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZXZtL2VpcDE5MS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtNzEyIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXA3MTJTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDcxMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVpcDcxMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2V2bS9laXA3MTIvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdmFsaWRhdGlvbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIGRlcG9zaXQgKG9yIHN0YWtpbmcpIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RXRoMlN0YWtlUmVxdWVzdH0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TdGFrZShcbiAgICByZXE6IEV0aDJTdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiLCBcInBvc3RcIik7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB1bnN0YWtlL2V4aXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXRoMlVuc3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMlVuc3Rha2VSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduVW5zdGFrZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEF2YWxhbmNoZSBQLSBvciBYLWNoYWluIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0F2YVR4fSB0eCBBdmFsYW5jaGUgbWVzc2FnZSAodHJhbnNhY3Rpb24pIHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8QXZhU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25BdmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgdHg6IEF2YVR4LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBdmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiA8QXZhU2lnblJlcXVlc3Q+e1xuICAgICAgICAgIHR4OiB0eCBhcyB1bmtub3duLFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHNlcmlhbGl6ZWQgQXZhbGFuY2hlIEMtLCBQLSwgb3IgWC1jaGFpbiBtZXNzYWdlLiBTZWUgW3RoZSBBdmFsYW5jaGVcbiAgICogZG9jdW1lbnRhdGlvbl0oaHR0cHM6Ly9kb2NzLmF2YXgubmV0d29yay9yZWZlcmVuY2Uvc3RhbmRhcmRzL3NlcmlhbGl6YXRpb24tcHJpbWl0aXZlcylcbiAgICogZm9yIHRoZSBzcGVjaWZpY2F0aW9uIG9mIHRoZSBzZXJpYWxpemF0aW9uIGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0c1xuICAgKiBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7QXZhQ2hhaW59IGF2YUNoYWluIEF2YWxhbmNoZSBjaGFpblxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHggSGV4IGVuY29kZWQgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8QXZhU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TZXJpYWxpemVkQXZhKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIGF2YUNoYWluOiBBdmFDaGFpbixcbiAgICB0eDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBdmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97YXZhX2NoYWlufS97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBhdmFfY2hhaW46IGF2YUNoYWluLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiA8QXZhU2VyaWFsaXplZFR4U2lnblJlcXVlc3Q+e1xuICAgICAgICAgIHR4LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHJhdyBibG9iLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93UmF3QmxvYlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uIFRoaXMgaXMgYmVjYXVzZVxuICAgKiBzaWduaW5nIGFyYml0cmFyeSBtZXNzYWdlcyBpcywgaW4gZ2VuZXJhbCwgZGFuZ2Vyb3VzIChhbmQgeW91IHNob3VsZCBpbnN0ZWFkXG4gICAqIHByZWZlciB0eXBlZCBlbmQtcG9pbnRzIGFzIHVzZWQgYnksIGZvciBleGFtcGxlLCB7QGxpbmsgc2lnbkV2bX0pLiBGb3IgU2VjcDI1NmsxIGtleXMsXG4gICAqIGZvciBleGFtcGxlLCB5b3UgKiptdXN0KiogY2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggYSBtZXNzYWdlIHRoYXQgaXMgMzIgYnl0ZXMgbG9uZyBhbmRcbiAgICogdGhlIG91dHB1dCBvZiBhIHNlY3VyZSBoYXNoIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgc2lnbmF0dXJlcyBzZXJpYWxpemVkIGFzO1xuICAgKlxuICAgKiAtIEVDRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgYXMgYmlnLWVuZGlhbiByIGFuZCBzIHBsdXMgcmVjb3ZlcnktaWRcbiAgICogICAgYnl0ZSB2LCB3aGljaCBjYW4gaW4gZ2VuZXJhbCB0YWtlIGFueSBvZiB0aGUgdmFsdWVzIDAsIDEsIDIsIG9yIDMuXG4gICAqXG4gICAqIC0gRWREU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBpbiB0aGUgc3RhbmRhcmQgZm9ybWF0LlxuICAgKlxuICAgKiAtIEJMUyBzaWduYXR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkIG9uIHRoZSBibG9iLXNpZ24gZW5kcG9pbnQuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgSUQpLlxuICAgKiBAcGFyYW0ge0Jsb2JTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCbG9iU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCbG9iU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vYmxvYi9zaWduL3trZXlfaWR9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGtleV9pZCA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkuaWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIHRyYW5zYWN0aW9uIGlucHV0LlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCdGNTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiBCSVAtMTM3IG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0J0Y01lc3NhZ2VTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNNZXNzYWdlU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGNNZXNzYWdlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQnRjTWVzc2FnZVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNNZXNzYWdlU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL21lc3NhZ2Uvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgVGFwcm9vdCB0cmFuc2FjdGlvbiBpbnB1dC5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7VGFwcm9vdFNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFRhcHJvb3RTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRhcHJvb3QoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBUYXByb290U2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFRhcHJvb3RTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvdGFwcm9vdC9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBQU0JULlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCdGNTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblBzYnQoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBQc2J0U2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFBzYnRTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvcHNidC9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGFuIEV4dHJhY3RhYmxlIE9uZS1UaW1lIFNpZ25hdHVyZVxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFb3RzU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RW90c1NpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduRW90cyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVvdHNTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW90c1NpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vZW90cy9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHNldCBvZiBCYWJ5bG9uIEVPVFMgbm9uY2VzIGZvciBhIHNwZWNpZmllZCBjaGFpbi1pZCwgc3RhcnRpbmcgYXQgYSBzcGVjaWZpZWQgYmxvY2sgaGVpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFb3RzQ3JlYXRlTm9uY2VSZXF1ZXN0fSByZXEgV2hhdCBhbmQgaG93IG1hbnkgbm9uY2VzIHRvIGNyZWF0ZVxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFb3RzQ3JlYXRlTm9uY2VSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBlb3RzQ3JlYXRlTm9uY2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFb3RzQ3JlYXRlTm9uY2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFb3RzQ3JlYXRlTm9uY2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vZW90cy9ub25jZXMve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJhYnlsb24gc3Rha2luZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUgdGFwcm9vdCBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCYWJ5bG9uU3Rha2luZ1JlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VGFwcm9vdFNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQmFieWxvblN0YWtpbmdUeG4oXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJhYnlsb25TdGFraW5nUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9iYWJ5bG9uL3N0YWtpbmcve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNvbGFuYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtTb2xhbmFTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxTb2xhbmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNvbGFuYShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFNvbGFuYVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zb2xhbmEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgTU1JIHBlbmRpbmcgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtQZW5kaW5nTWVzc2FnZUluZm99IG1lc3NhZ2UgdGhlIG1lc3NhZ2UgaW5mby5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0IHwgdW5kZWZpbmVkfSBtZmFSZWNlaXB0IG9wdGlvbmFsIE1GQSByZWNlaXB0LlxuICAgKiBAcmV0dXJuIHtQZW5kaW5nTWVzc2FnZVNpZ25SZXNwb25zZX0gdGhlIHVwZGF0ZWQgbWVzc2FnZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NbWkoXG4gICAgbWVzc2FnZTogUGVuZGluZ01lc3NhZ2VJbmZvLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxQZW5kaW5nTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfS9zaWduXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtZXNzYWdlLmlkIH0gfSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgYm9keTogbWVzc2FnZSxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFVTRVIgRVhQT1JUOiB1c2VyRXhwb3J0KEluaXQsQ29tcGxldGUsTGlzdCxEZWxldGUpXG4gIC8qKlxuICAgKiBMaXN0IG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3RzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz99IGtleUlkIE9wdGlvbmFsIGtleSBJRC4gSWYgc3VwcGxpZWQsIGxpc3QgdGhlIG91dHN0YW5kaW5nIHJlcXVlc3QgKGlmIGFueSkgb25seSBmb3IgdGhlIHNwZWNpZmllZCBrZXk7IG90aGVyd2lzZSwgbGlzdCBhbGwgb3V0c3RhbmRpbmcgcmVxdWVzdHMgZm9yIHRoZSBzcGVjaWZpZWQgdXNlci5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSB1c2VySWQgT3B0aW9uYWwgdXNlciBJRC4gSWYgb210dGVkLCB1c2VzIHRoZSBjdXJyZW50IHVzZXIncyBJRC4gT25seSBvcmcgb3duZXJzIGNhbiBsaXN0IHVzZXItZXhwb3J0IHJlcXVlc3RzIGZvciB1c2VycyBvdGhlciB0aGFuIHRoZW1zZWx2ZXMuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHM/fSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8VXNlckV4cG9ydExpc3RSZXNwb25zZSwgVXNlckV4cG9ydEluaXRSZXNwb25zZT59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHJlc3VsdCBzZXQuXG4gICAqL1xuICB1c2VyRXhwb3J0TGlzdChcbiAgICBrZXlJZD86IHN0cmluZyxcbiAgICB1c2VySWQ/OiBzdHJpbmcsXG4gICAgcGFnZT86IFBhZ2VPcHRzLFxuICApOiBQYWdpbmF0b3I8VXNlckV4cG9ydExpc3RSZXNwb25zZSwgVXNlckV4cG9ydEluaXRSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9leHBvcnRcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PlxuICAgICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgICAgICAuLi5xdWVyeSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICAocikgPT4gci5leHBvcnRfcmVxdWVzdHMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBrZXktaWQgY29ycmVzcG9uZGluZyB0byB0aGUgdXNlci1leHBvcnQgcmVxdWVzdCB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gdXNlcklkIE9wdGlvbmFsIHVzZXIgSUQuIElmIG9taXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGRlbGV0ZSB1c2VyLWV4cG9ydCByZXF1ZXN0cyBmb3IgdXNlcnMgb3RoZXIgdGhhbiB0aGVtc2VsdmVzLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydERlbGV0ZShrZXlJZDogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckV4cG9ydEluaXRSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1c2VyRXhwb3J0SW5pdChcbiAgICBrZXlJZDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9leHBvcnRcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IGluaXRGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgICBib2R5OiB7IGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGluaXRGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0ge0NyeXB0b0tleX0gcHVibGljS2V5IFRoZSBOSVNUIFAtMjU2IHB1YmxpYyBrZXkgdG8gd2hpY2ggdGhlIGV4cG9ydCB3aWxsIGJlIGVuY3J5cHRlZC4gVGhpcyBzaG91bGQgYmUgdGhlIGBwdWJsaWNLZXlgIHByb3BlcnR5IG9mIGEgdmFsdWUgcmV0dXJuZWQgYnkgYHVzZXJFeHBvcnRLZXlnZW5gLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydENvbXBsZXRlKFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgcHVibGljS2V5OiBDcnlwdG9LZXksXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlPj4ge1xuICAgIC8vIGJhc2U2NC1lbmNvZGUgdGhlIHB1YmxpYyBrZXlcbiAgICBjb25zdCBzdWJ0bGUgPSBhd2FpdCBsb2FkU3VidGxlQ3J5cHRvKCk7XG4gICAgY29uc3QgcHVibGljS2V5QjY0ID0gZW5jb2RlVG9CYXNlNjQoQnVmZmVyLmZyb20oYXdhaXQgc3VidGxlLmV4cG9ydEtleShcInJhd1wiLCBwdWJsaWNLZXkpKSk7XG5cbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwicGF0Y2hcIik7XG4gICAgLy8gbWFrZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IGNvbXBsZXRlRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgcHVibGljX2tleTogcHVibGljS2V5QjY0LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGNvbXBsZXRlRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIEtFWSBJTVBPUlQ6IGNyZWF0ZUtleUltcG9ydEtleSwgaW1wb3J0S2V5c1xuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBAcmV0dXJuIHsgUHJvbWlzZTxHZXRLZXlJbXBvcnRLZXlSZXNwb25zZT4gfSBBIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlJbXBvcnRLZXkoKTogUHJvbWlzZTxDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW1wb3J0X2tleVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGsta2V5LWltcG9ydGBcbiAgICogbGlicmFyeS4gU2VlIHRoYXQgbGlicmFyeSdzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgaW5mby5cbiAgICpcbiAgICogQHBhcmFtIHsgSW1wb3J0S2V5UmVxdWVzdCB9IGJvZHkgQW4gZW5jcnlwdGVkIGtleS1pbXBvcnQgcmVxdWVzdC5cbiAgICogQHJldHVybiB7IEtleUluZm9bXSB9IFRoZSBuZXdseSBpbXBvcnRlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5cyhib2R5OiBJbXBvcnRLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2ltcG9ydF9rZXlcIiwgXCJwdXRcIik7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICAgIHJldHVybiBrZXlzO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE1JU0M6IGhlYXJ0YmVhdCgpXG4gIC8qKlxuICAgKiBTZW5kIGEgaGVhcnRiZWF0IC8gdXBjaGVjayByZXF1ZXN0LlxuICAgKlxuICAgKiBAcmV0dXJuIHsgUHJvbWlzZTx2b2lkPiB9IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIGhlYXJ0YmVhdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2N1YmUzc2lnbmVyL2hlYXJ0YmVhdFwiLCBcInBvc3RcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNTUk6IG1taSgpLCBtbWlMaXN0KClcbiAgLyoqXG4gICAqIENhbGwgdGhlIE1NSSBKU09OIFJQQyBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHtNbWlKcnBjTWV0aG9kfSBtZXRob2QgVGhlIG5hbWUgb2YgdGhlIG1ldGhvZCB0byBjYWxsLlxuICAgKiBAcGFyYW0ge0pzb25BcnJheX0gcGFyYW1zIFRoZSBsaXN0IG9mIG1ldGhvZCBwYXJhbWV0ZXJzLlxuICAgKiBAcmV0dXJuIHtvYmplY3QgfCBudWxsIHwgdW5kZWZpbmVkfSB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBtZXRob2QuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgbW1pKG1ldGhvZDogTW1pSnJwY01ldGhvZCwgcGFyYW1zOiBKc29uQXJyYXkpOiBQcm9taXNlPEpycGNSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9tbWkvdjMvanNvbi1ycGNcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IGJvZHkgPSB7XG4gICAgICBpZDogMSxcbiAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIHBhcmFtczogcGFyYW1zLFxuICAgIH07XG4gICAgY29uc3QgZnVuYyA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHRoaXMuZXhlYyhvLCB7IGhlYWRlcnMsIGJvZHkgfSk7XG4gICAgY29uc3QgcmVzcCA9IChhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBmdW5jKSkuZGF0YSgpO1xuICAgIHJldHVybiByZXNwO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNTUkgbWVzc2FnZXMuXG4gICAqXG4gICAqIEByZXR1cm4geyBQZW5kaW5nTWVzc2FnZUluZm9bXSB9IFRoZSBsaXN0IG9mIHBlbmRpbmcgTU1JIG1lc3NhZ2VzLlxuICAgKi9cbiAgYXN5bmMgbW1pTGlzdCgpOiBQcm9taXNlPFBlbmRpbmdNZXNzYWdlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXNcIiwgXCJnZXRcIik7XG4gICAgY29uc3QgeyBwZW5kaW5nX21lc3NhZ2VzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBwZW5kaW5nX21lc3NhZ2VzIGFzIFBlbmRpbmdNZXNzYWdlSW5mb1tdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTU1JIG1lc3NhZ2UgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnSWQgVGhlIElEIG9mIHRoZSBwZW5kaW5nIG1lc3NhZ2UuXG4gICAqIEByZXR1cm4ge1BlbmRpbmdNZXNzYWdlSW5mb30gVGhlIHBlbmRpbmcgTU1JIG1lc3NhZ2UuXG4gICAqL1xuICBhc3luYyBtbWlHZXQobXNnSWQ6IHN0cmluZyk6IFByb21pc2U8UGVuZGluZ01lc3NhZ2VJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH1cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbXNnSWQgfSB9IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGUgTU1JIG1lc3NhZ2Ugd2l0aCB0aGUgZ2l2ZW4gSUQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtc2dJZCB0aGUgSUQgb2YgdGhlIE1NSSBtZXNzYWdlLlxuICAgKi9cbiAgYXN5bmMgbW1pRGVsZXRlKG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1zZ0lkIH0gfSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgdGhlIE1NSSBtZXNzYWdlIHdpdGggdGhlIGdpdmVuIElELlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnSWQgdGhlIElEIG9mIHRoZSBNTUkgbWVzc2FnZS5cbiAgICovXG4gIGFzeW5jIG1taVJlamVjdChtc2dJZDogc3RyaW5nKTogUHJvbWlzZTxQZW5kaW5nTWVzc2FnZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfS9yZWplY3RcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1zZ0lkIH0gfSB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvKipcbiAgICogUmV0dXJucyBwdWJsaWMgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZyB0byBsb2cgaW50b1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPFB1YmxpY09yZ0luZm8+fSBQdWJsaWMgb3JnIGluZm9ybWF0aW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcHVibGljT3JnSW5mbyhlbnY6IEVudkludGVyZmFjZSwgb3JnSWQ6IHN0cmluZyk6IFByb21pc2U8UHVibGljT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW5mb1wiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIHRvIGxvZyBpbnRvLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIE9JREMgdG9rZW4gdG8gZXhjaGFuZ2VcbiAgICogQHBhcmFtIHtMaXN0PFNjb3BlPn0gc2NvcGVzIFRoZSBzY29wZXMgZm9yIHRoZSBuZXcgc2Vzc2lvblxuICAgKiBAcGFyYW0ge1JhdGNoZXRDb25maWd9IGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQgKGlkICsgY29uZmlybWF0aW9uIGNvZGUpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIE9wdGlvbmFsIHNlc3Npb24gZGVzY3JpcHRpb24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNlc3Npb25EYXRhPj59IFRoZSBzZXNzaW9uIGRhdGEuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgb2lkY1Nlc3Npb25DcmVhdGUoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICB0b2tlbjogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8U2NvcGU+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICAgcHVycG9zZT86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2Vzc2lvbkRhdGE+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGxvZ2luRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgICBvKHtcbiAgICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAuLi5oZWFkZXJzLFxuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogdG9rZW4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgICAgdG9rZW5zOiBsaWZldGltZXMsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICApLnRoZW4oYXNzZXJ0T2spO1xuXG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoXG4gICAgICAgIGRhdGEsXG4gICAgICAgIChzZXNzaW9uSW5mbykgPT5cbiAgICAgICAgICA8U2Vzc2lvbkRhdGE+e1xuICAgICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IGVudixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvcmdfaWQ6IG9yZ0lkLFxuICAgICAgICAgICAgdG9rZW46IHNlc3Npb25JbmZvLnRva2VuLFxuICAgICAgICAgICAgc2Vzc2lvbl9leHA6IHNlc3Npb25JbmZvLmV4cGlyYXRpb24sXG4gICAgICAgICAgICBwdXJwb3NlOiBcInNpZ24gaW4gdmlhIG9pZGNcIixcbiAgICAgICAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbkluZm8uc2Vzc2lvbl9pbmZvLFxuICAgICAgICAgIH0sXG4gICAgICApO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShlbnYsIGxvZ2luRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYXV0aGVudGljYXRlZCBlbmRwb2ludCBmb3IgYXV0aGVudGljYXRpbmcgd2l0aCBlbWFpbC9wYXNzd29yZC5cbiAgICpcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSB7QXV0aGVudGljYXRpb25SZXF1ZXN0fSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICogQHJldHVybiB7QXV0aGVudGljYXRpb25SZXNwb25zZX0gUmV0dXJucyBhbiBPSURDIHRva2VuIHdoaWNoIGNhbiBiZSB1c2VkXG4gICAqICAgdG8gbG9nIGluIHZpYSBPSURDIChzZWUge0BsaW5rIG9pZGNTZXNzaW9uQ3JlYXRlfSkuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaWRwQXV0aGVudGljYXRlKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogQXV0aGVudGljYXRpb25SZXF1ZXN0LFxuICApOiBQcm9taXNlPEF1dGhlbnRpY2F0aW9uUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGMvcGFzc3dvcmRcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmF1dGhlbnRpY2F0ZWQgZW5kcG9pbnQgZm9yIHJlcXVlc3RpbmcgcGFzc3dvcmQgcmVzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvblxuICAgKiBAcGFyYW0ge1Bhc3N3b3JkUmVzZXRSZXF1ZXN0fSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICogQHJldHVybiB7RW1haWxPdHBSZXNwb25zZX0gUmV0dXJucyB0aGUgcGFydGlhbCB0b2tlbiAoYCR7aGVhZGVyfS4ke2NsYWltc30uYCkgd2hpbGUgdGhlIHNpZ25hdHVyZSBpcyBzZW50IHZpYSBlbWFpbC5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZHBQYXNzd29yZFJlc2V0UmVxdWVzdChcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IFBhc3N3b3JkUmVzZXRSZXF1ZXN0LFxuICApOiBQcm9taXNlPEVtYWlsT3RwUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGMvcGFzc3dvcmQvcmVzZXRcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmF1dGhlbnRpY2F0ZWQgZW5kcG9pbnQgZm9yIGNvbmZpcm1pbmcgYSBwcmV2aW91c2x5IGluaXRpYXRlZCBwYXNzd29yZCByZXNldCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhcnRpYWxUb2tlbiBUaGUgcGFydGlhbCB0b2tlbiByZXR1cm5lZCBieSB7QGxpbmsgcGFzc3dvcmRSZXNldFJlcXVlc3R9XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgVGhlIG9uZS10aW1lIGNvZGUgKHNpZ25hdHVyZSBpbiB0aGlzIGNhc2UpIHNlbnQgdmlhIGVtYWlsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXNzd29yZCBUaGUgbmV3IHBhc3N3b3JkXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaWRwUGFzc3dvcmRSZXNldENvbmZpcm0oXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBwYXJ0aWFsVG9rZW46IHN0cmluZyxcbiAgICBzaWduYXR1cmU6IHN0cmluZyxcbiAgICBuZXdQYXNzd29yZDogc3RyaW5nLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGMvcGFzc3dvcmQvcmVzZXRcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgdG9rZW46IGAke3BhcnRpYWxUb2tlbn0uJHtzaWduYXR1cmV9YCxcbiAgICAgICAgICBuZXdfcGFzc3dvcmQ6IG5ld1Bhc3N3b3JkLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIG9yZyBpZCBpbiB3aGljaCB0byBnZW5lcmF0ZSBwcm9vZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIG9pZGMgdG9rZW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxJZGVudGl0eVByb29mPn0gUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZGVudGl0eVByb3ZlT2lkYyhcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvcHJvdmUvb2lkY1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGFsbCBvcmdhbml6YXRpb25zIGEgdXNlciBpcyBhIG1lbWJlciBvZlxuICAgKlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIG9pZGMgdG9rZW4gaWRlbnRpZnlpbmcgdGhlIHVzZXJcbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VyT3Jnc1Jlc3BvbnNlPn0gVGhlIG9yZ2FuaXphdGlvbiB0aGUgdXNlciBiZWxvbmdzIHRvXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdXNlck9yZ3MoZW52OiBFbnZJbnRlcmZhY2UsIHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJPcmdzUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvdXNlci9vcmdzXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogUG9zdC1wcm9jZXNzIGEge0BsaW5rIFVzZXJJbmZvfSByZXNwb25zZS4gUG9zdC1wcm9jZXNzaW5nIGVuc3VyZXMgdGhhdCB0aGUgZW1haWwgZmllbGQgZm9yXG4gICAqIHVzZXJzIHdpdGhvdXQgYW4gZW1haWwgaXMgc2V0IHRvIGBudWxsYC5cbiAgICpcbiAgICogQHBhcmFtIHtVc2VySW5mb30gaW5mbyBUaGUgaW5mbyB0byBwb3N0LXByb2Nlc3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VySW5mbz59IFRoZSBwcm9jZXNzZWQgdXNlciBpbmZvXG4gICAqL1xuICBzdGF0aWMgI3Byb2Nlc3NVc2VySW5mbyhpbmZvOiBVc2VySW5mbyk6IFVzZXJJbmZvIHtcbiAgICBpZiAoaW5mby5lbWFpbCA9PT0gRU1BSUxfTk9UX0ZPVU5EKSB7XG4gICAgICBpbmZvLmVtYWlsID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICAvKipcbiAgICogUG9zdC1wcm9jZXNzIGEge0BsaW5rIFVzZXJJbk9yZ0luZm99IHJlc3BvbnNlLiBQb3N0LXByb2Nlc3NpbmcgZW5zdXJlcyB0aGF0IHRoZSBlbWFpbCBmaWVsZCBmb3JcbiAgICogdXNlcnMgd2l0aG91dCBhbiBlbWFpbCBpcyBzZXQgdG8gYG51bGxgLlxuICAgKlxuICAgKiBAcGFyYW0ge1VzZXJJbk9yZ0luZm99IGluZm8gVGhlIGluZm8gdG8gcG9zdC1wcm9jZXNzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckluT3JnSW5mbz59IFRoZSBwcm9jZXNzZWQgdXNlciBpbmZvXG4gICAqL1xuICBzdGF0aWMgI3Byb2Nlc3NVc2VySW5PcmdJbmZvKGluZm86IFVzZXJJbk9yZ0luZm8pOiBVc2VySW5PcmdJbmZvIHtcbiAgICBpZiAoaW5mby5lbWFpbCA9PT0gRU1BSUxfTk9UX0ZPVU5EKSB7XG4gICAgICBpbmZvLmVtYWlsID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbn1cblxuY29uc3QgZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTogU2Vzc2lvbkxpZmV0aW1lID0ge1xuICBzZXNzaW9uOiA2MDQ4MDAsIC8vIDEgd2Vla1xuICBhdXRoOiAzMDAsIC8vIDUgbWluXG4gIHJlZnJlc2g6IDg2NDAwLCAvLyAxIGRheVxuICBncmFjZTogMzAsIC8vIHNlY29uZHNcbn07XG4iXX0=