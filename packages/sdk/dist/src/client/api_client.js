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
    // #region ORGS: orgGet, orgUpdate, orgUpdateUserMembership
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
     * List all keys in the org.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpX2NsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYXBpX2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFzREEsa0NBQXlDO0FBQ3pDLGdDQUE4RjtBQUM5RiwwQ0FBOEQ7QUFHOUQsNENBQStDO0FBRS9DLGdEQUFrRDtBQTRDbEQsb0NBQXdDO0FBQ3hDLCtDQUF5RTtBQUN6RSxvQ0FBc0M7QUFFdEM7O0dBRUc7QUFDSCxNQUFNLGVBQWUsR0FBRyxpQkFBaUIsQ0FBQztBQXFCMUM7O0dBRUc7QUFDSCxNQUFhLFNBQVUsU0FBUSx3QkFBVTtJQUN2QywwSEFBMEg7SUFFMUg7O09BRUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sQ0FBQyxHQUFHLElBQUEsVUFBRSxFQUFDLDBCQUEwQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWhELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHVCQUFBLEVBQVMsc0NBQWlCLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsaUJBQWlCLENBQ3JCLE1BQWUsRUFDZixVQUF3QjtRQUV4QixNQUFNLENBQUMsR0FBRyxJQUFBLFVBQUUsRUFBQywrQkFBK0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN0RCxNQUFNLFdBQVcsR0FBRyxLQUFLLEVBQUUsT0FBcUIsRUFBRSxFQUFFO1lBQ2xELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQzlCLE9BQU87Z0JBQ1AsSUFBSSxFQUFFLE1BQU07b0JBQ1YsQ0FBQyxDQUFDO3dCQUNFLE1BQU07cUJBQ1A7b0JBQ0gsQ0FBQyxDQUFDLElBQUk7YUFDVCxDQUFDLENBQUM7WUFDSCxPQUFPLElBQUEsc0JBQVcsRUFBQyxJQUFJLEVBQUUsQ0FB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QztRQUNuQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztJQUNwQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLDZFQVM0QixJQUFtQjtJQUM5QyxJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssZUFBZSxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUdILE1BQU0sNEJBQTRCLEdBQW9CO0lBQ3BELE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUztJQUMxQixJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVE7SUFDbkIsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRO0lBQ3hCLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVTtDQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBDcmVhdGVPaWRjVXNlck9wdGlvbnMsXG4gIElkZW50aXR5UHJvb2YsXG4gIEtleUluUm9sZUluZm8sXG4gIEtleUluZm8sXG4gIE9pZGNJZGVudGl0eSxcbiAgUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgUm9sZUluZm8sXG4gIFVwZGF0ZUtleVJlcXVlc3QsXG4gIFVwZGF0ZU9yZ1JlcXVlc3QsXG4gIFVwZGF0ZU9yZ1Jlc3BvbnNlLFxuICBVcGRhdGVSb2xlUmVxdWVzdCxcbiAgVXNlckluT3JnSW5mbyxcbiAgVXNlckluUm9sZUluZm8sXG4gIEdldFVzZXJzSW5PcmdSZXNwb25zZSxcbiAgVXNlckluZm8sXG4gIFNlc3Npb25JbmZvLFxuICBPcmdJbmZvLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlLFxuICBFdm1TaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlc3BvbnNlLFxuICBFdGgyU2lnblJlcXVlc3QsXG4gIEV0aDJTaWduUmVzcG9uc2UsXG4gIEV0aDJTdGFrZVJlcXVlc3QsXG4gIEV0aDJTdGFrZVJlc3BvbnNlLFxuICBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gIEV0aDJVbnN0YWtlUmVzcG9uc2UsXG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgQmxvYlNpZ25SZXNwb25zZSxcbiAgQnRjU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVxdWVzdCxcbiAgQnRjTWVzc2FnZVNpZ25SZXNwb25zZSxcbiAgQnRjTWVzc2FnZVNpZ25SZXF1ZXN0LFxuICBQc2J0U2lnblJlcXVlc3QsXG4gIFBzYnRTaWduUmVzcG9uc2UsXG4gIFNvbGFuYVNpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlcXVlc3QsXG4gIEF2YVNlcmlhbGl6ZWRUeFNpZ25SZXF1ZXN0LFxuICBBdmFUeCxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIE1mYVZvdGUsXG4gIE1lbWJlclJvbGUsXG4gIFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlLFxuICBVc2VyRXhwb3J0SW5pdFJlc3BvbnNlLFxuICBVc2VyRXhwb3J0TGlzdFJlc3BvbnNlLFxuICBFbXB0eSxcbiAgVXNlck9yZ3NSZXNwb25zZSxcbiAgQ3JlYXRlS2V5SW1wb3J0S2V5UmVzcG9uc2UsXG4gIEltcG9ydEtleVJlcXVlc3QsXG59IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IGVuY29kZVRvQmFzZTY0IH0gZnJvbSBcIi4uL3V0aWxcIjtcbmltcG9ydCB7IEFkZEZpZG9DaGFsbGVuZ2UsIE1mYUZpZG9DaGFsbGVuZ2UsIE1mYUVtYWlsQ2hhbGxlbmdlLCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4uL21mYVwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lclJlc3BvbnNlLCBtYXBSZXNwb25zZSB9IGZyb20gXCIuLi9yZXNwb25zZVwiO1xuaW1wb3J0IHR5cGUgeyBLZXksIEtleVR5cGUgfSBmcm9tIFwiLi4va2V5XCI7XG5pbXBvcnQgdHlwZSB7IFBhZ2VPcHRzIH0gZnJvbSBcIi4uL3BhZ2luYXRvclwiO1xuaW1wb3J0IHsgUGFnZSwgUGFnaW5hdG9yIH0gZnJvbSBcIi4uL3BhZ2luYXRvclwiO1xuaW1wb3J0IHR5cGUgeyBLZXlQb2xpY3kgfSBmcm9tIFwiLi4vcm9sZVwiO1xuaW1wb3J0IHsgbG9hZFN1YnRsZUNyeXB0byB9IGZyb20gXCIuLi91c2VyX2V4cG9ydFwiO1xuaW1wb3J0IHR5cGUge1xuICBBZGRJZGVudGl0eVJlcXVlc3QsXG4gIEF2YUNoYWluLFxuICBFbnZJbnRlcmZhY2UsXG4gIEVvdHNDcmVhdGVOb25jZVJlcXVlc3QsXG4gIEVvdHNDcmVhdGVOb25jZVJlc3BvbnNlLFxuICBFb3RzU2lnblJlcXVlc3QsXG4gIEVvdHNTaWduUmVzcG9uc2UsXG4gIEpycGNSZXNwb25zZSxcbiAgSnNvbkFycmF5LFxuICBMaXN0SWRlbnRpdHlSZXNwb25zZSxcbiAgTGlzdEtleVJvbGVzUmVzcG9uc2UsXG4gIExpc3RLZXlzUmVzcG9uc2UsXG4gIExpc3RSb2xlS2V5c1Jlc3BvbnNlLFxuICBMaXN0Um9sZVVzZXJzUmVzcG9uc2UsXG4gIExpc3RSb2xlc1Jlc3BvbnNlLFxuICBNbWlKcnBjTWV0aG9kLFxuICBQZW5kaW5nTWVzc2FnZUluZm8sXG4gIFBlbmRpbmdNZXNzYWdlU2lnblJlc3BvbnNlLFxuICBSYXRjaGV0Q29uZmlnLFxuICBTY29wZSxcbiAgU2Vzc2lvbkRhdGEsXG4gIFNlc3Npb25MaWZldGltZSxcbiAgU2Vzc2lvbnNSZXNwb25zZSxcbiAgVGFwcm9vdFNpZ25SZXF1ZXN0LFxuICBUYXByb290U2lnblJlc3BvbnNlLFxuICBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gIEJhYnlsb25TdGFraW5nUmVzcG9uc2UsXG4gIFVwZGF0ZVVzZXJNZW1iZXJzaGlwUmVxdWVzdCxcbiAgSGlzdG9yaWNhbFR4LFxuICBMaXN0SGlzdG9yaWNhbFR4UmVzcG9uc2UsXG4gIFB1YmxpY09yZ0luZm8sXG4gIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gIFBhc3N3b3JkUmVzZXRSZXF1ZXN0LFxuICBFbWFpbE90cFJlc3BvbnNlLFxuICBBdXRoZW50aWNhdGlvblJlcXVlc3QsXG4gIEF1dGhlbnRpY2F0aW9uUmVzcG9uc2UsXG4gIENyZWF0ZUtleVByb3BlcnRpZXMsXG4gIEludml0YXRpb25BY2NlcHRSZXF1ZXN0LFxuICBNZmFSZWNlaXB0cyxcbiAgU3VpU2lnblJlcXVlc3QsXG4gIFN1aVNpZ25SZXNwb25zZSxcbn0gZnJvbSBcIi4uL2luZGV4XCI7XG5pbXBvcnQgeyBhc3NlcnRPaywgb3AgfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7IEJhc2VDbGllbnQsIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8gfSBmcm9tIFwiLi9iYXNlX2NsaWVudFwiO1xuaW1wb3J0IHsgcmV0cnlPbjVYWCB9IGZyb20gXCIuLi9yZXRyeVwiO1xuXG4vKipcbiAqIFN0cmluZyByZXR1cm5lZCBieSBBUEkgd2hlbiBhIHVzZXIgZG9lcyBub3QgaGF2ZSBhbiBlbWFpbCBhZGRyZXNzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpXG4gKi9cbmNvbnN0IEVNQUlMX05PVF9GT1VORCA9IFwiZW1haWwgbm90IGZvdW5kXCI7XG5cbi8qKlxuICogU2Vzc2lvbiBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IHR5cGUgU2Vzc2lvblNlbGVjdG9yID1cbiAgLyoqXG4gICAqIFNlbGVjdHMgYWxsIHNlc3Npb25zIHRpZWQgdG8gYSByb2xlIHdpdGggdGhpcyBJRFxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBVc2UgYHsgcm9sZTogc3RyaW5nIH1gIGluc3RlYWRcbiAgICovXG4gIHwgc3RyaW5nXG4gIHwge1xuICAgICAgLyoqIFNlbGVjdHMgYWxsIHNlc3Npb25zIHRpZWQgdG8gYSByb2xlIHdpdGggdGhpcyBJRCAqL1xuICAgICAgcm9sZTogc3RyaW5nO1xuICAgIH1cbiAgfCB7XG4gICAgICAvKiogU2VsZWN0cyBhbGwgc2Vzc2lvbnMgdGllZCB0byBhIHVzZXIgd2l0aCB0aGlzIElELiAqL1xuICAgICAgdXNlcjogc3RyaW5nO1xuICAgIH07XG5cbi8qKlxuICogQW4gZXh0ZW5zaW9uIG9mIEJhc2VDbGllbnQgdGhhdCBhZGRzIHNwZWNpYWxpemVkIG1ldGhvZHMgZm9yIGFwaSBlbmRwb2ludHNcbiAqL1xuZXhwb3J0IGNsYXNzIEFwaUNsaWVudCBleHRlbmRzIEJhc2VDbGllbnQge1xuICAvLyAjcmVnaW9uIFVTRVJTOiB1c2VyR2V0LCB1c2VyVG90cChSZXNldEluaXR8UmVzZXRDb21wbGV0ZXxWZXJpZnl8RGVsZXRlKSwgdXNlckZpZG8oUmVnaXN0ZXJJbml0fFJlZ2lzdGVyQ29tcGxldGV8RGVsZXRlKVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKi9cbiAgYXN5bmMgdXNlckdldCgpOiBQcm9taXNlPFVzZXJJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7fSkudGhlbihBcGlDbGllbnQuI3Byb2Nlc3NVc2VySW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gY2hhbmdlIHVzZXIncyBUT1RQLiBSZXR1cm5zIGEge0BsaW5rIFRvdHBDaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBlaXRoZXIgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9IChvclxuICAgKiB7QGxpbmsgQXBpQ2xpZW50LnVzZXJUb3RwUmVzZXRDb21wbGV0ZX0pLlxuICAgKlxuICAgKiBAcGFyYW0gaXNzdWVyIE9wdGlvbmFsIGlzc3VlcjsgZGVmYXVsdHMgdG8gXCJDdWJpc3RcIlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBIFRPVFAgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZFxuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBSZXNldEluaXQoXG4gICAgaXNzdWVyPzogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VG90cENoYWxsZW5nZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcmVzZXRUb3RwRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogaXNzdWVyXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIGlzc3VlcixcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA6IG51bGwsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAodG90cEluZm8pID0+IG5ldyBUb3RwQ2hhbGxlbmdlKHRoaXMsIHRvdHBJbmZvKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVzZXRUb3RwRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgVE9UUCBjaGFsbGVuZ2UgaXNzdWVkIGJ5IHtAbGluayB1c2VyVG90cFJlc2V0SW5pdH0uIElmIHN1Y2Nlc3NmdWwsIHVzZXInc1xuICAgKiBUT1RQIGNvbmZpZ3VyYXRpb24gd2lsbCBiZSB1cGRhdGVkIHRvIHRoYXQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gdG90cElkIFRoZSBJRCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2VcbiAgICogQHBhcmFtIGNvZGUgVGhlIFRPVFAgY29kZSB0aGF0IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwUmVzZXRDb21wbGV0ZSh0b3RwSWQ6IHN0cmluZywgY29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogeyB0b3RwX2lkOiB0b3RwSWQsIGNvZGUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyBhIGdpdmVuIFRPVFAgY29kZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlIEN1cnJlbnQgVE9UUCBjb2RlXG4gICAqIEB0aHJvd3MgQW4gZXJyb3IgaWYgdmVyaWZpY2F0aW9uIGZhaWxzXG4gICAqL1xuICBhc3luYyB1c2VyVG90cFZlcmlmeShjb2RlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cC92ZXJpZnlcIiwgXCJwb3N0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyB1c2VyVG90cERlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCBcImRlbGV0ZVwiKTtcbiAgICBjb25zdCBkZWxldGVUb3RwRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGRlbGV0ZVRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYWRkaW5nIGEgbmV3IEZJRE8gZGV2aWNlLiBNRkEgbWF5IGJlIHJlcXVpcmVkLiAgVGhpcyByZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCB3aXRoIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIHVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZX1cbiAgICogKGFmdGVyIE1GQSBhcHByb3ZhbHMpLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbmV3IGRldmljZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICogQHJldHVybnMgQSBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGluIG9yZGVyIHRvIGNvbXBsZXRlIEZJRE8gcmVnaXN0cmF0aW9uLlxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9SZWdpc3RlckluaXQoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QWRkRmlkb0NoYWxsZW5nZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgYWRkRmlkb0ZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHsgbmFtZSB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKGMpID0+IG5ldyBBZGRGaWRvQ2hhbGxlbmdlKHRoaXMsIGMpKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBhZGRGaWRvRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgdXNlckZpZG9SZWdpc3RlckluaXR9KSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKiBAcGFyYW0gY3JlZGVudGlhbCBUaGUgYW5zd2VyIHRvIHRoZSBjaGFsbGVuZ2UuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGUoXG4gICAgY2hhbGxlbmdlSWQ6IHN0cmluZyxcbiAgICBjcmVkZW50aWFsOiBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICApOiBQcm9taXNlPEVtcHR5PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2ZpZG9cIiwgXCJwYXRjaFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBjaGFsbGVuZ2VfaWQ6IGNoYWxsZW5nZUlkLFxuICAgICAgICBjcmVkZW50aWFsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBGSURPIGtleSBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogQWxsb3dlZCBvbmx5IGlmIFRPVFAgaXMgYWxzbyBkZWZpbmVkLlxuICAgKiBNRkEgdmlhIFRPVFAgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gZmlkb0lkIFRoZSBJRCBvZiB0aGUgZGVzaXJlZCBGSURPIGtleVxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9EZWxldGUoXG4gICAgZmlkb0lkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBkZWxldGVGaWRvRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkby97Zmlkb19pZH1cIiwgXCJkZWxldGVcIik7XG5cbiAgICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBmaWRvX2lkOiBmaWRvSWQgfSB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgZGVsZXRlRmlkb0ZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SR1M6IG9yZ0dldCwgb3JnVXBkYXRlLCBvcmdVcGRhdGVVc2VyTWVtYmVyc2hpcFxuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnXG4gICAqXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGdldCBpbmZvIGZvclxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgYXN5bmMgb3JnR2V0KG9yZ0lkPzogc3RyaW5nKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IG9yZ19pZDogb3JnSWQgPz8gdGhpcy5zZXNzaW9uTWV0YS5vcmdfaWQgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybnMgVXBkYXRlZCBvcmcgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdVcGRhdGUocmVxdWVzdDogVXBkYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8VXBkYXRlT3JnUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIFwicGF0Y2hcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHsgYm9keTogcmVxdWVzdCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdXNlcidzIG1lbWJlcnNoaXAgaW4gdGhpcyBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0gcmVxIFRoZSB1cGRhdGUgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIHVzZXIgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgb3JnVXBkYXRlVXNlck1lbWJlcnNoaXAoXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgcmVxOiBVcGRhdGVVc2VyTWVtYmVyc2hpcFJlcXVlc3QsXG4gICk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9L21lbWJlcnNoaXBcIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHVzZXJfaWQ6IHVzZXJJZCB9IH0sXG4gICAgICBib2R5OiByZXEsXG4gICAgfSkudGhlbihBcGlDbGllbnQuI3Byb2Nlc3NVc2VySW5PcmdJbmZvKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SRyBVU0VSUzogb3JnVXNlckludml0ZSwgb3JnVXNlckRlbGV0ZSwgb3JnVXNlcnNMaXN0LCBvcmdVc2VyR2V0LCBvcmdVc2VyQ3JlYXRlT2lkYywgb3JnVXNlckRlbGV0ZU9pZGNcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IChmaXJzdC1wYXJ0eSkgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kIGFuIGVtYWlsIGludml0YXRpb24gdG8gdGhhdCB1c2VyLlxuICAgKlxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIG5hbWUgVGhlIGZ1bGwgbmFtZSBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0gcm9sZSBPcHRpb25hbCByb2xlLiBEZWZhdWx0cyB0byBcImFsaWVuXCIuXG4gICAqIEBwYXJhbSBza2lwRW1haWwgT3B0aW9uYWxseSBza2lwIHNlbmRpbmcgdGhlIGludml0ZSBlbWFpbC5cbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJJbnZpdGUoXG4gICAgZW1haWw6IHN0cmluZyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcm9sZT86IE1lbWJlclJvbGUsXG4gICAgc2tpcEVtYWlsPzogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbnZpdGVcIiwgXCJwb3N0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZW1haWwsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHJvbGUsXG4gICAgICAgIHNraXBfZW1haWw6ICEhc2tpcEVtYWlsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHVzZXIgZnJvbSB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgdXNlcnMgaW4gdGhlIG9yZy5cbiAgICovXG4gIG9yZ1VzZXJzTGlzdChwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8R2V0VXNlcnNJbk9yZ1Jlc3BvbnNlLCBVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHt9LCAuLi5xdWVyeSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMubWFwKEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbk9yZ0luZm8pLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdldC5cbiAgICogQHJldHVybnMgT3JnIHVzZXIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VyR2V0KHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vycy97dXNlcl9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluT3JnSW5mbyhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyLiBUaGlzIGNhbiBiZSBhIGZpcnN0LXBhcnR5IFwiTWVtYmVyXCIgb3IgdGhpcmQtcGFydHkgXCJBbGllblwiLlxuICAgKlxuICAgKiBAcGFyYW0gaWRlbnRpdHlPclByb29mIFRoZSBpZGVudGl0eSBvciBpZGVudGl0eSBwcm9vZiBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSBlbWFpbCBFbWFpbCBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSBvcHRzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgbmV3IE9JREMgdXNlcnNcbiAgICogQHJldHVybnMgVXNlciBpZCBvZiB0aGUgbmV3IHVzZXJcbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJDcmVhdGVPaWRjKFxuICAgIGlkZW50aXR5T3JQcm9vZjogT2lkY0lkZW50aXR5IHwgSWRlbnRpdHlQcm9vZixcbiAgICBlbWFpbD86IHN0cmluZyB8IG51bGwsXG4gICAgb3B0czogQ3JlYXRlT2lkY1VzZXJPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBpZGVudGl0eU9yUHJvb2ZGaWVsZHMgPVxuICAgICAgXCJpZFwiIGluIGlkZW50aXR5T3JQcm9vZiA/IHsgcHJvb2Y6IGlkZW50aXR5T3JQcm9vZiB9IDogeyBpZGVudGl0eTogaWRlbnRpdHlPclByb29mIH07XG5cbiAgICBjb25zdCB7IHVzZXJfaWQgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIHJvbGU6IG9wdHMubWVtYmVyUm9sZSA/PyBcIkFsaWVuXCIsXG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lOiBvcHRzLm5hbWUsXG4gICAgICAgIG1mYV9wb2xpY3k6IG9wdHMubWZhUG9saWN5LFxuICAgICAgICAuLi5pZGVudGl0eU9yUHJvb2ZGaWVsZHMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVzZXJfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIGlkZW50aXR5IFRoZSBpZGVudGl0eSBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlT2lkYyhpZGVudGl0eTogT2lkY0lkZW50aXR5KTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkY1wiLCBcImRlbGV0ZVwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogaWRlbnRpdHksXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBLRVlTOiBrZXlHZXQsIGtleVVwZGF0ZSwga2V5RGVsZXRlLCBrZXlzQ3JlYXRlLCBrZXlzRGVyaXZlLCBrZXlzTGlzdCwga2V5SGlzdG9yeVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMga2V5R2V0KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgdHlwZSBhbmQgbWF0ZXJpYWwgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSBrZXkgdHlwZS5cbiAgICogQHBhcmFtIG1hdGVyaWFsSWQgVGhlIG1hdGVyaWFsIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMga2V5R2V0QnlNYXRlcmlhbElkKGtleVR5cGU6IEtleVR5cGUsIG1hdGVyaWFsSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X3R5cGV9L3ttYXRlcmlhbF9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV90eXBlOiBrZXlUeXBlLCBtYXRlcmlhbF9pZDogbWF0ZXJpYWxJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgYSBrZXkgaXMgaW4uXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSByb2xlcyBhIGtleSBpcyBpbi5cbiAgICovXG4gIGtleVJvbGVzTGlzdChrZXlJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdEtleVJvbGVzUmVzcG9uc2UsIEtleUluUm9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vcm9sZXNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIucm9sZXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm5zIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqL1xuICBhc3luYyBrZXlVcGRhdGUoa2V5SWQ6IHN0cmluZywgcmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIEtleSBpZFxuICAgKi9cbiAgYXN5bmMga2V5RGVsZXRlKGtleUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgc2lnbmluZyBrZXlzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXlzLiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIGtleSBwcm9wZXJ0aWVzXG4gICAqIEByZXR1cm5zIFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNDcmVhdGUoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICAgcHJvcHM/OiBDcmVhdGVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleUluZm9bXT4ge1xuICAgIGNvbnN0IGNoYWluX2lkID0gMDsgLy8gbm90IHVzZWQgYW55bW9yZVxuXG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHBvbGljeSA9IChwcm9wcz8ucG9saWN5ID8/IG51bGwpIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIHwgbnVsbDtcbiAgICBjb25zdCB7IGtleXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGNvdW50LFxuICAgICAgICBjaGFpbl9pZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBvd25lcjogcHJvcHM/Lm93bmVyID8/IG93bmVySWQsXG4gICAgICAgIHBvbGljeSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgYSBzcGVjaWZpZWQgdHlwZSB1c2luZyBhIHN1cHBsaWVkIGRlcml2YXRpb24gcGF0aCBhbmQgYW4gZXhpc3RpbmcgbG9uZy1saXZlZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBkZXJpdmF0aW9uUGF0aHMgRGVyaXZhdGlvbiBwYXRocyBmcm9tIHdoaWNoIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5c0Rlcml2ZShcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2Rlcml2ZV9rZXlcIiwgXCJwdXRcIik7XG5cbiAgICBjb25zdCBwb2xpY3kgPSAocHJvcHM/LnBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGw7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBkZXJpdmF0aW9uX3BhdGg6IGRlcml2YXRpb25QYXRocyxcbiAgICAgICAgbW5lbW9uaWNfaWQ6IG1uZW1vbmljSWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgcG9saWN5LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIGtleXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHBhcmFtIG93bmVyIE9wdGlvbmFsIGtleSBvd25lciB0byBmaWx0ZXIgbGlzdCBmb3IuXG4gICAqIEBwYXJhbSBzZWFyY2ggT3B0aW9uYWxseSBzZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgSUQgYW5kIG1ldGFkYXRhXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIga2V5cy5cbiAgICovXG4gIGtleXNMaXN0KFxuICAgIHR5cGU/OiBLZXlUeXBlLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBvd25lcj86IHN0cmluZyxcbiAgICBzZWFyY2g/OiBzdHJpbmcsXG4gICk6IFBhZ2luYXRvcjxMaXN0S2V5c1Jlc3BvbnNlLCBLZXlJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PlxuICAgICAgICB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcXVlcnk6IHsga2V5X3R5cGU6IHR5cGUsIGtleV9vd25lcjogb3duZXIsIHNlYXJjaCwgLi4ucXVlcnkgfSB9IH0pLFxuICAgICAgKHIpID0+IHIua2V5cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcmVjZW50IGhpc3RvcmljYWwga2V5IHRyYW5zYWN0aW9ucy5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBrZXkgaWQuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGhpc3RvcmljYWwgdHJhbnNhY3Rpb25zLlxuICAgKi9cbiAga2V5SGlzdG9yeShrZXlJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdEhpc3RvcmljYWxUeFJlc3BvbnNlLCBIaXN0b3JpY2FsVHg+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vdHhcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKCkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9IH0gfSksXG4gICAgICAocikgPT4gci50eHMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEVTOiByb2xlQ3JlYXRlLCByb2xlUmVhZCwgcm9sZVVwZGF0ZSwgcm9sZURlbGV0ZSwgcm9sZXNMaXN0XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgb3B0aW9uYWwgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVDcmVhdGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IG5hbWUgPyB7IG5hbWUgfSA6IHVuZGVmaW5lZCxcbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpdHMgaWQgKG9yIG5hbWUpLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUdldChyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSB1cGRhdGUgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIHJvbGVVcGRhdGUocm9sZUlkOiBzdHJpbmcsIHJlcXVlc3Q6IFVwZGF0ZVJvbGVSZXF1ZXN0KTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSByb2xlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUgdG8gZGVsZXRlLlxuICAgKi9cbiAgYXN5bmMgcm9sZURlbGV0ZShyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgcm9sZXMuXG4gICAqL1xuICByb2xlc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlc1Jlc3BvbnNlLCBSb2xlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PiB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcXVlcnkgfSB9KSxcbiAgICAgIChyKSA9PiByLnJvbGVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFIEtFWVM6IHJvbGVLZXlzQWRkLCByb2xlS2V5c0RlbGV0ZSwgcm9sZUtleXNMaXN0XG5cbiAgLyoqXG4gICAqIEFkZCBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlXG4gICAqIEBwYXJhbSBrZXlJZHMgVGhlIElEcyBvZiB0aGUga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byBlYWNoIGtleS5cbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzQWRkKHJvbGVJZDogc3RyaW5nLCBrZXlJZHM6IHN0cmluZ1tdLCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfa2V5c1wiLCBcInB1dFwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBrZXlfaWRzOiBrZXlJZHMsXG4gICAgICAgIHBvbGljeTogKHBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGVcbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIGtleXMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSBrZXlzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUga2V5cyBpbiB0aGUgcm9sZS5cbiAgICovXG4gIHJvbGVLZXlzTGlzdChyb2xlSWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlS2V5c1Jlc3BvbnNlLCBLZXlJblJvbGVJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5c1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0sXG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEUgVVNFUlM6IHJvbGVVc2VyQWRkLCByb2xlVXNlclJlbW92ZSwgcm9sZVVzZXJzTGlzdFxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJBZGQocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vYWRkX3VzZXIve3VzZXJfaWR9XCIsIFwicHV0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVVc2VyUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3VzZXJzL3t1c2VyX2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQsIHVzZXJfaWQ6IHVzZXJJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSB1c2VycyB0byByZXRyaWV2ZS5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHVzZXJzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZVVzZXJzTGlzdChyb2xlSWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS91c2Vyc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5LCBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0gfSksXG4gICAgICAocikgPT4gci51c2VycyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0VTU0lPTlM6IHNlc3Npb24oQ3JlYXRlfENyZWF0ZUZvclJvbGV8UmVmcmVzaHxSZXZva2V8TGlzdHxLZXlzTGlzdClcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybnMgTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlKFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBzY29wZXM6IFNjb3BlW10sXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgbGlmZXRpbWVzID8/PSBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lO1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcHVycG9zZSxcbiAgICAgICAgc2NvcGVzLFxuICAgICAgICBhdXRoX2xpZmV0aW1lOiBsaWZldGltZXMuYXV0aCxcbiAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWVzLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IGxpZmV0aW1lcy5zZXNzaW9uLFxuICAgICAgICBncmFjZV9saWZldGltZTogbGlmZXRpbWVzLmdyYWNlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBkYXRhLCB7XG4gICAgICBwdXJwb3NlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKSB3aG9zZSBsaWZldGltZSBwb3RlbnRpYWxseVxuICAgKiBleHRlbmRzIHRoZSBsaWZldGltZSBvZiB0aGUgY3VycmVudCBzZXNzaW9uLiAgTUZBIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy5cbiAgICogQHBhcmFtIGxpZmV0aW1lIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBOZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGVFeHRlbmRlZChcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBTY29wZVtdLFxuICAgIGxpZmV0aW1lOiBTZXNzaW9uTGlmZXRpbWUsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcmVxdWVzdEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICBleHRlbmRfbGlmZXRpbWVzOiB0cnVlLFxuICAgICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lLmF1dGgsXG4gICAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWUucmVmcmVzaCxcbiAgICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZS5zZXNzaW9uLFxuICAgICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZS5ncmFjZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKHJlc3AsIChzZXNzaW9uSW5mbykgPT5cbiAgICAgICAgc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBzZXNzaW9uSW5mbywge1xuICAgICAgICAgIHB1cnBvc2UsXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXF1ZXN0Rm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbiBmb3IgYSBnaXZlbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gTm90IGFsbCBzY29wZXMgYXJlIHZhbGlkIGZvciBhIHJvbGUuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybnMgTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlRm9yUm9sZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzPzogU2NvcGVbXSxcbiAgICBsaWZldGltZXM/OiBTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBsaWZldGltZXMgPz89IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIHB1cnBvc2UsXG4gICAgICAgIHNjb3BlcyxcbiAgICAgICAgYXV0aF9saWZldGltZTogbGlmZXRpbWVzLmF1dGgsXG4gICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IGxpZmV0aW1lcy5yZWZyZXNoLFxuICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZXMuc2Vzc2lvbixcbiAgICAgICAgZ3JhY2VfbGlmZXRpbWU6IGxpZmV0aW1lcy5ncmFjZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBkYXRhLCB7XG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgICBwdXJwb3NlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhIHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uSWQgVGhlIElEIG9mIHRoZSBzZXNzaW9uIHRvIHJldm9rZS4gVGhpcyBzZXNzaW9uIGJ5IGRlZmF1bHRcbiAgICovXG4gIGFzeW5jIHNlc3Npb25SZXZva2Uoc2Vzc2lvbklkPzogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uL3tzZXNzaW9uX2lkfVwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgc2Vzc2lvbl9pZDogc2Vzc2lvbklkID8/IFwic2VsZlwiIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgYWxsIHNlc3Npb25zLlxuICAgKlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgV2hpY2ggc2Vzc2lvbnMgdG8gcmV2b2tlLiBJZiBub3QgZGVmaW5lZCwgYWxsIHRoZSBjdXJyZW50IHVzZXIncyBzZXNzaW9ucyB3aWxsIGJlIHJldm9rZWQuXG4gICAqL1xuICBhc3luYyBzZXNzaW9uUmV2b2tlQWxsKHNlbGVjdG9yPzogU2Vzc2lvblNlbGVjdG9yKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZGVsZXRlXCIpO1xuICAgIGNvbnN0IHF1ZXJ5ID0gdHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiID8geyByb2xlOiBzZWxlY3RvciB9IDogc2VsZWN0b3I7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBxdWVyeSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGFsbCBzaWduZXIgc2Vzc2lvbnMgb3B0aW9uYWxseSBmaWx0ZXJlZCBieSBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBzZWxlY3RvciBJZiBzZXQsIGxpbWl0IHRvIHNlc3Npb25zIGZvciBhIHNwZWNpZmllZCB1c2VyIG9yIGEgcm9sZS5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgc2Vzc2lvbnNMaXN0KFxuICAgIHNlbGVjdG9yPzogU2Vzc2lvblNlbGVjdG9yLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPFNlc3Npb25zUmVzcG9uc2UsIFNlc3Npb25JbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZ2V0XCIpO1xuICAgIGNvbnN0IHNlbGVjdG9yUXVlcnkgPSB0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIgPyB7IHJvbGU6IHNlbGVjdG9yIH0gOiBzZWxlY3RvcjtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeTogeyAuLi5zZWxlY3RvclF1ZXJ5LCAuLi5xdWVyeSB9IH0gfSksXG4gICAgICAocikgPT4gci5zZXNzaW9ucyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxpc3Qgb2Yga2V5cyB0aGF0IHRoaXMgc2Vzc2lvbiBoYXMgYWNjZXNzIHRvLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBrZXlzLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbktleXNMaXN0KCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS90b2tlbi9rZXlzXCIsIFwiZ2V0XCIpO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIElERU5USVRZOiBpZGVudGl0eVByb3ZlLCBpZGVudGl0eVZlcmlmeSwgaWRlbnRpdHlBZGQsIGlkZW50aXR5UmVtb3ZlLCBpZGVudGl0eUxpc3RcblxuICAvKipcbiAgICogT2J0YWluIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uIHVzaW5nIHRoZSBjdXJyZW50IEN1YmVTaWduZXIgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIGFzeW5jIGlkZW50aXR5UHJvdmUoKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZVwiLCBcInBvc3RcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBnaXZlbiBpZGVudGl0eSBwcm9vZiBpcyB2YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHByb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICogQHRocm93cyBBbiBlcnJvciBpZiBwcm9vZiBpcyBpbnZhbGlkXG4gICAqL1xuICBhc3luYyBpZGVudGl0eVZlcmlmeShwcm9vZjogSWRlbnRpdHlQcm9vZikge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvdmVyaWZ5XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogcHJvb2YsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXNzb2NpYXRlcyBhbiBPSURDIGlkZW50aXR5IHdpdGggdGhlIGN1cnJlbnQgdXNlcidzIGFjY291bnQuXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHksIGNvbnRhaW5pbmcgYW4gT0lEQyB0b2tlbiB0byBwcm92ZSB0aGUgaWRlbnRpdHkgb3duZXJzaGlwLlxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlBZGQoYm9keTogQWRkSWRlbnRpdHlSZXF1ZXN0KSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eVwiLCBcInBvc3RcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIE9JREMgaWRlbnRpdHkgZnJvbSB0aGUgY3VycmVudCB1c2VyJ3MgYWNjb3VudC5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIGlkZW50aXR5IHRvIHJlbW92ZS5cbiAgICovXG4gIGFzeW5jIGlkZW50aXR5UmVtb3ZlKGJvZHk6IE9pZGNJZGVudGl0eSkge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHlcIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0cyBhc3NvY2lhdGVkIE9JREMgaWRlbnRpdGllcyB3aXRoIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIEFzc29jaWF0ZWQgaWRlbnRpdGllc1xuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlMaXN0KCk6IFByb21pc2U8TGlzdElkZW50aXR5UmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gTUZBOiBtZmFHZXQsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUFwcHJvdmVUb3RwLCBtZmFBcHByb3ZlRmlkbyhJbml0fENvbXBsZXRlKSwgbWZhVm90ZUVtYWlsKEluaXR8Q29tcGxldGUpXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBleGlzdGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm5zIE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBtZmFHZXQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3RzLlxuICAgKi9cbiAgYXN5bmMgbWZhTGlzdCgpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYVwiLCBcImdldFwiKTtcblxuICAgIGNvbnN0IHsgbWZhX3JlcXVlc3RzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBtZmFfcmVxdWVzdHM7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUNzKG1mYUlkOiBzdHJpbmcsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIElEIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFWb3RlVG90cChtZmFJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vdG90cFwiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uIEEgY2hhbGxlbmdlIGlzXG4gICAqIHJldHVybmVkIHdoaWNoIG11c3QgYmUgYW5zd2VyZWQgdmlhIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIG1mYVZvdGVGaWRvQ29tcGxldGV9LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElELlxuICAgKiBAcmV0dXJucyBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIG1mYUZpZG9Jbml0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9maWRvXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGNoYWxsZW5nZSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgTWZhRmlkb0NoYWxsZW5nZSh0aGlzLCBtZmFJZCwgY2hhbGxlbmdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIG1mYUZpZG9Jbml0fSkgTUZBIHJlcXVlc3QgdXNpbmcgRklETy5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcGFyYW0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIGlzc3VlZCBieSB7QGxpbmsgbWZhRmlkb0luaXR9XG4gICAqIEBwYXJhbSBjcmVkZW50aWFsIFRoZSBhbnN3ZXIgdG8gdGhlIGNoYWxsZW5nZVxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUZpZG9Db21wbGV0ZShcbiAgICBtZmFJZDogc3RyaW5nLFxuICAgIG1mYVZvdGU6IE1mYVZvdGUsXG4gICAgY2hhbGxlbmdlSWQ6IHN0cmluZyxcbiAgICBjcmVkZW50aWFsOiBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICApOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZmlkb1wiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIE1GQSBhcHByb3ZhbCB2aWEgZW1haWwgT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElEXG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIG1mYVZvdGVFbWFpbEluaXQobWZhSWQ6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhRW1haWxDaGFsbGVuZ2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9lbWFpbFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgY2hhbGxlbmdlID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgTWZhRW1haWxDaGFsbGVuZ2UodGhpcywgbWZhSWQsIGNoYWxsZW5nZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCAodmlhIHtAbGluayBtZmFWb3RlRW1haWxJbml0fSkgTUZBIHZvdGUgcmVxdWVzdCB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBNZmFFbWFpbENoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElEXG4gICAqIEBwYXJhbSBwYXJ0aWFsVG9rZW4gVGhlIHBhcnRpYWwgdG9rZW4gcmV0dXJuZWQgYnkge0BsaW5rIG1mYVZvdGVFbWFpbEluaXR9XG4gICAqIEBwYXJhbSBzaWduYXR1cmUgVGhlIG9uZS10aW1lIGNvZGUgKHNpZ25hdHVyZSBpbiB0aGlzIGNhc2UpIHNlbnQgdmlhIGVtYWlsXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBtZmFWb3RlRW1haWxDb21wbGV0ZShcbiAgICBtZmFJZDogc3RyaW5nLFxuICAgIHBhcnRpYWxUb2tlbjogc3RyaW5nLFxuICAgIHNpZ25hdHVyZTogc3RyaW5nLFxuICApOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZW1haWxcIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSB9LFxuICAgICAgYm9keTogeyB0b2tlbjogYCR7cGFydGlhbFRva2VufSR7c2lnbmF0dXJlfWAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFNJR046IHNpZ25Fdm0sIHNpZ25FdGgyLCBzaWduU3Rha2UsIHNpZ25VbnN0YWtlLCBzaWduQXZhLCBzaWduU2VyaWFsaXplZEF2YSwgc2lnbkJsb2IsIHNpZ25CdGMsIHNpZ25UYXByb290LCBzaWduU29sYW5hLCBzaWduRW90cywgZW90c0NyZWF0ZU5vbmNlLCBzaWduTW1pLCBzaWduU3VpXG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRVZNIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25Fdm0oXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdm1TaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTE5MSB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwMTkxU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDE5MShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVpcDE5MVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9ldm0vZWlwMTkxL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC03MTIgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDcxMlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXA3MTIoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFaXA3MTJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZXZtL2VpcDcxMi9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB2YWxpZGF0aW9uIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV0aDIoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gZGVwb3NpdCAob3Igc3Rha2luZykgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblN0YWtlKFxuICAgIHJlcTogRXRoMlN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiLCBcInBvc3RcIik7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB1bnN0YWtlL2V4aXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25VbnN0YWtlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEF2YWxhbmNoZSBQLSBvciBYLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gdHggQXZhbGFuY2hlIG1lc3NhZ2UgKHRyYW5zYWN0aW9uKSB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25BdmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgdHg6IEF2YVR4LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QXZhU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYXZhL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogPEF2YVNpZ25SZXF1ZXN0PntcbiAgICAgICAgICB0eDogdHggYXMgdW5rbm93bixcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzZXJpYWxpemVkIEF2YWxhbmNoZSBDLSwgUC0sIG9yIFgtY2hhaW4gbWVzc2FnZS4gU2VlIFt0aGUgQXZhbGFuY2hlXG4gICAqIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5hdmF4Lm5ldHdvcmsvcmVmZXJlbmNlL3N0YW5kYXJkcy9zZXJpYWxpemF0aW9uLXByaW1pdGl2ZXMpXG4gICAqIGZvciB0aGUgc3BlY2lmaWNhdGlvbiBvZiB0aGUgc2VyaWFsaXphdGlvbiBmb3JtYXQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gYXZhQ2hhaW4gQXZhbGFuY2hlIGNoYWluXG4gICAqIEBwYXJhbSB0eCBIZXggZW5jb2RlZCB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU2VyaWFsaXplZEF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICBhdmFDaGFpbjogQXZhQ2hhaW4sXG4gICAgdHg6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2F2YS9zaWduL3thdmFfY2hhaW59L3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGF2YV9jaGFpbjogYXZhQ2hhaW4sIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IDxBdmFTZXJpYWxpemVkVHhTaWduUmVxdWVzdD57XG4gICAgICAgICAgdHgsXG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dSYXdCbG9iU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS4gVGhpcyBpcyBiZWNhdXNlXG4gICAqIHNpZ25pbmcgYXJiaXRyYXJ5IG1lc3NhZ2VzIGlzLCBpbiBnZW5lcmFsLCBkYW5nZXJvdXMgKGFuZCB5b3Ugc2hvdWxkIGluc3RlYWRcbiAgICogcHJlZmVyIHR5cGVkIGVuZC1wb2ludHMgYXMgdXNlZCBieSwgZm9yIGV4YW1wbGUsIHtAbGluayBzaWduRXZtfSkuIEZvciBTZWNwMjU2azEga2V5cyxcbiAgICogZm9yIGV4YW1wbGUsIHlvdSAqKm11c3QqKiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBhIG1lc3NhZ2UgdGhhdCBpcyAzMiBieXRlcyBsb25nIGFuZFxuICAgKiB0aGUgb3V0cHV0IG9mIGEgc2VjdXJlIGhhc2ggZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBzaWduYXR1cmVzIHNlcmlhbGl6ZWQgYXM7XG4gICAqXG4gICAqIC0gRUNEU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBhcyBiaWctZW5kaWFuIHIgYW5kIHMgcGx1cyByZWNvdmVyeS1pZFxuICAgKiAgICBieXRlIHYsIHdoaWNoIGNhbiBpbiBnZW5lcmFsIHRha2UgYW55IG9mIHRoZSB2YWx1ZXMgMCwgMSwgMiwgb3IgMy5cbiAgICpcbiAgICogLSBFZERTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGluIHRoZSBzdGFuZGFyZCBmb3JtYXQuXG4gICAqXG4gICAqIC0gQkxTIHNpZ25hdHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gdGhlIGJsb2Itc2lnbiBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmxvYlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBrZXlfaWQgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5LmlkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiB0cmFuc2FjdGlvbiBpbnB1dC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGMoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCdGNTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJ0Y1NpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2J0Yy9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIEJJUC0xMzcgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGNNZXNzYWdlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQnRjTWVzc2FnZVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2J0Yy9tZXNzYWdlL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFRhcHJvb3QgdHJhbnNhY3Rpb24gaW5wdXQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduVGFwcm9vdChcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFRhcHJvb3RTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFRhcHJvb3RTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvdGFwcm9vdC9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBQU0JULlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblBzYnQoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBQc2J0U2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxQc2J0U2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL3BzYnQvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhbiBFeHRyYWN0YWJsZSBPbmUtVGltZSBTaWduYXR1cmVcbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Fb3RzKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRW90c1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW90c1NpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vZW90cy9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHNldCBvZiBCYWJ5bG9uIEVPVFMgbm9uY2VzIGZvciBhIHNwZWNpZmllZCBjaGFpbi1pZCwgc3RhcnRpbmcgYXQgYSBzcGVjaWZpZWQgYmxvY2sgaGVpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IGFuZCBob3cgbWFueSBub25jZXMgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIGVvdHNDcmVhdGVOb25jZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVvdHNDcmVhdGVOb25jZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFb3RzQ3JlYXRlTm9uY2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vZW90cy9ub25jZXMve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJhYnlsb24gc3Rha2luZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUgdGFwcm9vdCBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJhYnlsb25TdGFraW5nVHhuKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmFieWxvblN0YWtpbmdSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmFieWxvblN0YWtpbmdSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vc3Rha2luZy97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgU29sYW5hIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU29sYW5hKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogU29sYW5hU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zb2xhbmEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgTU1JIHBlbmRpbmcgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIG1lc3NhZ2UgdGhlIG1lc3NhZ2UgaW5mby5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgb3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIHRoZSB1cGRhdGVkIG1lc3NhZ2UuXG4gICAqL1xuICBhc3luYyBzaWduTW1pKFxuICAgIG1lc3NhZ2U6IFBlbmRpbmdNZXNzYWdlSW5mbyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFBlbmRpbmdNZXNzYWdlU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbW1pL3YzL21lc3NhZ2VzL3ttc2dfaWR9L3NpZ25cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1lc3NhZ2UuaWQgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBtZXNzYWdlLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNVSSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU3VpKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcXVlc3Q6IFN1aVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U3VpU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc3VpL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFVTRVIgRVhQT1JUOiB1c2VyRXhwb3J0KEluaXQsQ29tcGxldGUsTGlzdCxEZWxldGUpXG4gIC8qKlxuICAgKiBMaXN0IG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3RzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgT3B0aW9uYWwga2V5IElELiBJZiBzdXBwbGllZCwgbGlzdCB0aGUgb3V0c3RhbmRpbmcgcmVxdWVzdCAoaWYgYW55KSBvbmx5IGZvciB0aGUgc3BlY2lmaWVkIGtleTsgb3RoZXJ3aXNlLCBsaXN0IGFsbCBvdXRzdGFuZGluZyByZXF1ZXN0cyBmb3IgdGhlIHNwZWNpZmllZCB1c2VyLlxuICAgKiBAcGFyYW0gdXNlcklkIE9wdGlvbmFsIHVzZXIgSUQuIElmIG9tdHRlZCwgdXNlcyB0aGUgY3VycmVudCB1c2VyJ3MgSUQuIE9ubHkgb3JnIG93bmVycyBjYW4gbGlzdCB1c2VyLWV4cG9ydCByZXF1ZXN0cyBmb3IgdXNlcnMgb3RoZXIgdGhhbiB0aGVtc2VsdmVzLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgcmVzdWx0IHNldC5cbiAgICovXG4gIHVzZXJFeHBvcnRMaXN0KFxuICAgIGtleUlkPzogc3RyaW5nLFxuICAgIHVzZXJJZD86IHN0cmluZyxcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICk6IFBhZ2luYXRvcjxVc2VyRXhwb3J0TGlzdFJlc3BvbnNlLCBVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLmV4cG9ydF9yZXF1ZXN0cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleS1pZCBjb3JyZXNwb25kaW5nIHRvIHRoZSB1c2VyLWV4cG9ydCByZXF1ZXN0IHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIHVzZXJJZCBPcHRpb25hbCB1c2VyIElELiBJZiBvbWl0dGVkLCB1c2VzIHRoZSBjdXJyZW50IHVzZXIncyBJRC4gT25seSBvcmcgb3duZXJzIGNhbiBkZWxldGUgdXNlci1leHBvcnQgcmVxdWVzdHMgZm9yIHVzZXJzIG90aGVyIHRoYW4gdGhlbXNlbHZlcy5cbiAgICovXG4gIGFzeW5jIHVzZXJFeHBvcnREZWxldGUoa2V5SWQ6IHN0cmluZywgdXNlcklkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBrZXktaWQgZm9yIHdoaWNoIHRvIGluaXRpYXRlIGFuIGV4cG9ydC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVzZXJFeHBvcnRJbml0KFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9leHBvcnRcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IGluaXRGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgICBib2R5OiB7IGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGluaXRGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0gcHVibGljS2V5IFRoZSBOSVNUIFAtMjU2IHB1YmxpYyBrZXkgdG8gd2hpY2ggdGhlIGV4cG9ydCB3aWxsIGJlIGVuY3J5cHRlZC4gVGhpcyBzaG91bGQgYmUgdGhlIGBwdWJsaWNLZXlgIHByb3BlcnR5IG9mIGEgdmFsdWUgcmV0dXJuZWQgYnkgYHVzZXJFeHBvcnRLZXlnZW5gLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydENvbXBsZXRlKFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgcHVibGljS2V5OiBDcnlwdG9LZXksXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZT4+IHtcbiAgICAvLyBiYXNlNjQtZW5jb2RlIHRoZSBwdWJsaWMga2V5XG4gICAgY29uc3Qgc3VidGxlID0gYXdhaXQgbG9hZFN1YnRsZUNyeXB0bygpO1xuICAgIGNvbnN0IHB1YmxpY0tleUI2NCA9IGVuY29kZVRvQmFzZTY0KEJ1ZmZlci5mcm9tKGF3YWl0IHN1YnRsZS5leHBvcnRLZXkoXCJyYXdcIiwgcHVibGljS2V5KSkpO1xuXG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcInBhdGNoXCIpO1xuICAgIC8vIG1ha2UgdGhlIHJlcXVlc3RcbiAgICBjb25zdCBjb21wbGV0ZUZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHB1YmxpY19rZXk6IHB1YmxpY0tleUI2NCxcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBjb21wbGV0ZUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBLRVkgSU1QT1JUOiBjcmVhdGVLZXlJbXBvcnRLZXksIGltcG9ydEtleXNcbiAgLyoqXG4gICAqIFJlcXVlc3QgYSBmcmVzaCBrZXktaW1wb3J0IGtleS5cbiAgICpcbiAgICogQHJldHVybnMgQSBmcmVzaCBrZXktaW1wb3J0IGtleVxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5SW1wb3J0S2V5KCk6IFByb21pc2U8Q3JlYXRlS2V5SW1wb3J0S2V5UmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2ltcG9ydF9rZXlcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7fSk7XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0IG9uZSBvciBtb3JlIGtleXMuIFRvIHVzZSB0aGlzIGZ1bmN0aW9uYWxpdHksIHlvdSBtdXN0IGZpcnN0IGNyZWF0ZSBhblxuICAgKiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0IHVzaW5nIHRoZSBgQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrLWtleS1pbXBvcnRgXG4gICAqIGxpYnJhcnkuIFNlZSB0aGF0IGxpYnJhcnkncyBkb2N1bWVudGF0aW9uIGZvciBtb3JlIGluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IEFuIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBpbXBvcnRlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5cyhib2R5OiBJbXBvcnRLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2ltcG9ydF9rZXlcIiwgXCJwdXRcIik7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICAgIHJldHVybiBrZXlzO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE1JU0M6IGhlYXJ0YmVhdCgpXG4gIC8qKlxuICAgKiBTZW5kIGEgaGVhcnRiZWF0IC8gdXBjaGVjayByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgaGVhcnRiZWF0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vY3ViZTNzaWduZXIvaGVhcnRiZWF0XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE1NSTogbW1pKCksIG1taUxpc3QoKVxuICAvKipcbiAgICogQ2FsbCB0aGUgTU1JIEpTT04gUlBDIGVuZHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0gbWV0aG9kIFRoZSBuYW1lIG9mIHRoZSBtZXRob2QgdG8gY2FsbC5cbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgbGlzdCBvZiBtZXRob2QgcGFyYW1ldGVycy5cbiAgICogQHJldHVybnMgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgbWV0aG9kLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIG1taShtZXRob2Q6IE1taUpycGNNZXRob2QsIHBhcmFtczogSnNvbkFycmF5KTogUHJvbWlzZTxKcnBjUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvbW1pL3YzL2pzb24tcnBjXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBib2R5ID0ge1xuICAgICAgaWQ6IDEsXG4gICAgICBqc29ucnBjOiBcIjIuMFwiLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICBwYXJhbXM6IHBhcmFtcyxcbiAgICB9O1xuICAgIGNvbnN0IGZ1bmMgPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB0aGlzLmV4ZWMobywgeyBoZWFkZXJzLCBib2R5IH0pO1xuICAgIGNvbnN0IHJlc3AgPSAoYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgZnVuYykpLmRhdGEoKTtcbiAgICByZXR1cm4gcmVzcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTU1JIG1lc3NhZ2VzLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBwZW5kaW5nIE1NSSBtZXNzYWdlcy5cbiAgICovXG4gIGFzeW5jIG1taUxpc3QoKTogUHJvbWlzZTxQZW5kaW5nTWVzc2FnZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbW1pL3YzL21lc3NhZ2VzXCIsIFwiZ2V0XCIpO1xuICAgIGNvbnN0IHsgcGVuZGluZ19tZXNzYWdlcyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgICByZXR1cm4gcGVuZGluZ19tZXNzYWdlcyBhcyBQZW5kaW5nTWVzc2FnZUluZm9bXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwZW5kaW5nIE1NSSBtZXNzYWdlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIG1zZ0lkIFRoZSBJRCBvZiB0aGUgcGVuZGluZyBtZXNzYWdlLlxuICAgKiBAcmV0dXJucyBUaGUgcGVuZGluZyBNTUkgbWVzc2FnZS5cbiAgICovXG4gIGFzeW5jIG1taUdldChtc2dJZDogc3RyaW5nKTogUHJvbWlzZTxQZW5kaW5nTWVzc2FnZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtc2dJZCB9IH0gfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoZSBNTUkgbWVzc2FnZSB3aXRoIHRoZSBnaXZlbiBJRC5cbiAgICpcbiAgICogQHBhcmFtIG1zZ0lkIHRoZSBJRCBvZiB0aGUgTU1JIG1lc3NhZ2UuXG4gICAqL1xuICBhc3luYyBtbWlEZWxldGUobXNnSWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbW1pL3YzL21lc3NhZ2VzL3ttc2dfaWR9XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbXNnSWQgfSB9IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCB0aGUgTU1JIG1lc3NhZ2Ugd2l0aCB0aGUgZ2l2ZW4gSUQuXG4gICAqXG4gICAqIEBwYXJhbSBtc2dJZCB0aGUgSUQgb2YgdGhlIE1NSSBtZXNzYWdlLlxuICAgKiBAcmV0dXJucyBUaGUgbWVzc2FnZSB3aXRoIHVwZGF0ZWQgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1taVJlamVjdChtc2dJZDogc3RyaW5nKTogUHJvbWlzZTxQZW5kaW5nTWVzc2FnZUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfS9yZWplY3RcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1zZ0lkIH0gfSB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvKipcbiAgICogUmV0dXJucyBwdWJsaWMgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBsb2cgaW50b1xuICAgKiBAcmV0dXJucyBQdWJsaWMgb3JnIGluZm9ybWF0aW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcHVibGljT3JnSW5mbyhlbnY6IEVudkludGVyZmFjZSwgb3JnSWQ6IHN0cmluZyk6IFByb21pc2U8UHVibGljT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW5mb1wiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGxvZyBpbnRvLlxuICAgKiBAcGFyYW0gdG9rZW4gVGhlIE9JREMgdG9rZW4gdG8gZXhjaGFuZ2VcbiAgICogQHBhcmFtIHNjb3BlcyBUaGUgc2NvcGVzIGZvciB0aGUgbmV3IHNlc3Npb25cbiAgICogQHBhcmFtIGxpZmV0aW1lcyBMaWZldGltZXMgb2YgdGhlIG5ldyBzZXNzaW9uLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcGFyYW0gcHVycG9zZSBPcHRpb25hbCBzZXNzaW9uIGRlc2NyaXB0aW9uLlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIG9pZGNTZXNzaW9uQ3JlYXRlKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBzY29wZXM6IEFycmF5PFNjb3BlPixcbiAgICBsaWZldGltZXM/OiBSYXRjaGV0Q29uZmlnLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgICBwdXJwb3NlPzogc3RyaW5nLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgbG9naW5GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICAgIG8oe1xuICAgICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIC4uLmhlYWRlcnMsXG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiB0b2tlbixcbiAgICAgICAgICB9LFxuICAgICAgICAgIGJvZHk6IHtcbiAgICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICAgIHB1cnBvc2UsXG4gICAgICAgICAgICB0b2tlbnM6IGxpZmV0aW1lcyxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgICkudGhlbihhc3NlcnRPayk7XG5cbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAoc2Vzc2lvbkluZm8pOiBTZXNzaW9uRGF0YSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgZW52OiB7XG4gICAgICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiBlbnYsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvcmdfaWQ6IG9yZ0lkLFxuICAgICAgICAgIHRva2VuOiBzZXNzaW9uSW5mby50b2tlbixcbiAgICAgICAgICByZWZyZXNoX3Rva2VuOiBzZXNzaW9uSW5mby5yZWZyZXNoX3Rva2VuLFxuICAgICAgICAgIHNlc3Npb25fZXhwOiBzZXNzaW9uSW5mby5leHBpcmF0aW9uLFxuICAgICAgICAgIHB1cnBvc2U6IFwic2lnbiBpbiB2aWEgb2lkY1wiLFxuICAgICAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbkluZm8uc2Vzc2lvbl9pbmZvLFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGVudiwgbG9naW5GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQWNjZXB0IGFuIGludml0YXRpb24gdG8gam9pbiBhIEN1YmVTaWduZXIgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcEFjY2VwdEludml0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IEludml0YXRpb25BY2NlcHRSZXF1ZXN0LFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2ludml0YXRpb24vYWNjZXB0XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmF1dGhlbnRpY2F0ZWQgZW5kcG9pbnQgZm9yIGF1dGhlbnRpY2F0aW5nIHdpdGggZW1haWwvcGFzc3dvcmQuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvblxuICAgKiBAcGFyYW0gYm9keSBUaGUgcmVxdWVzdCBib2R5XG4gICAqIEByZXR1cm5zIFJldHVybnMgYW4gT0lEQyB0b2tlbiB3aGljaCBjYW4gYmUgdXNlZFxuICAgKiAgIHRvIGxvZyBpbiB2aWEgT0lEQyAoc2VlIHtAbGluayBvaWRjU2Vzc2lvbkNyZWF0ZX0pLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcEF1dGhlbnRpY2F0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IEF1dGhlbnRpY2F0aW9uUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxBdXRoZW50aWNhdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZHAvYXV0aGVudGljYXRlXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciByZXF1ZXN0aW5nIHBhc3N3b3JkIHJlc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcmV0dXJucyBSZXR1cm5zIHRoZSBwYXJ0aWFsIHRva2VuIChgJHtoZWFkZXJ9LiR7Y2xhaW1zfS5gKSB3aGlsZSB0aGUgc2lnbmF0dXJlIGlzIHNlbnQgdmlhIGVtYWlsLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcFBhc3N3b3JkUmVzZXRSZXF1ZXN0KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogUGFzc3dvcmRSZXNldFJlcXVlc3QsXG4gICk6IFByb21pc2U8RW1haWxPdHBSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRwL3Bhc3N3b3JkX3Jlc2V0XCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciBjb25maXJtaW5nIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgcGFzc3dvcmQgcmVzZXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSBwYXJ0aWFsVG9rZW4gVGhlIHBhcnRpYWwgdG9rZW4gcmV0dXJuZWQgYnkge0BsaW5rIHBhc3N3b3JkUmVzZXRSZXF1ZXN0fVxuICAgKiBAcGFyYW0gc2lnbmF0dXJlIFRoZSBvbmUtdGltZSBjb2RlIChzaWduYXR1cmUgaW4gdGhpcyBjYXNlKSBzZW50IHZpYSBlbWFpbFxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmQgVGhlIG5ldyBwYXNzd29yZFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcFBhc3N3b3JkUmVzZXRDb25maXJtKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgcGFydGlhbFRva2VuOiBzdHJpbmcsXG4gICAgc2lnbmF0dXJlOiBzdHJpbmcsXG4gICAgbmV3UGFzc3dvcmQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZHAvcGFzc3dvcmRfcmVzZXRcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgdG9rZW46IGAke3BhcnRpYWxUb2tlbn0ke3NpZ25hdHVyZX1gLFxuICAgICAgICAgIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIGlkIGluIHdoaWNoIHRvIGdlbmVyYXRlIHByb29mXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgb2lkYyB0b2tlblxuICAgKiBAcmV0dXJucyBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkZW50aXR5UHJvdmVPaWRjKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZS9vaWRjXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IHRva2VuLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYWxsIG9yZ2FuaXphdGlvbnMgYSB1c2VyIGlzIGEgbWVtYmVyIG9mXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgb2lkYyB0b2tlbiBpZGVudGlmeWluZyB0aGUgdXNlclxuICAgKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIHRoZSB1c2VyIGJlbG9uZ3MgdG9cbiAgICovXG4gIHN0YXRpYyBhc3luYyB1c2VyT3JncyhlbnY6IEVudkludGVyZmFjZSwgdG9rZW46IHN0cmluZyk6IFByb21pc2U8VXNlck9yZ3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC91c2VyL29yZ3NcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IHRva2VuLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3N0LXByb2Nlc3MgYSB7QGxpbmsgVXNlckluZm99IHJlc3BvbnNlLiBQb3N0LXByb2Nlc3NpbmcgZW5zdXJlcyB0aGF0IHRoZSBlbWFpbCBmaWVsZCBmb3JcbiAgICogdXNlcnMgd2l0aG91dCBhbiBlbWFpbCBpcyBzZXQgdG8gYG51bGxgLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyBUaGUgaW5mbyB0byBwb3N0LXByb2Nlc3NcbiAgICogQHJldHVybnMgVGhlIHByb2Nlc3NlZCB1c2VyIGluZm9cbiAgICovXG4gIHN0YXRpYyAjcHJvY2Vzc1VzZXJJbmZvKGluZm86IFVzZXJJbmZvKTogVXNlckluZm8ge1xuICAgIGlmIChpbmZvLmVtYWlsID09PSBFTUFJTF9OT1RfRk9VTkQpIHtcbiAgICAgIGluZm8uZW1haWwgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3N0LXByb2Nlc3MgYSB7QGxpbmsgVXNlckluT3JnSW5mb30gcmVzcG9uc2UuIFBvc3QtcHJvY2Vzc2luZyBlbnN1cmVzIHRoYXQgdGhlIGVtYWlsIGZpZWxkIGZvclxuICAgKiB1c2VycyB3aXRob3V0IGFuIGVtYWlsIGlzIHNldCB0byBgbnVsbGAuXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIFRoZSBpbmZvIHRvIHBvc3QtcHJvY2Vzc1xuICAgKiBAcmV0dXJucyBUaGUgcHJvY2Vzc2VkIHVzZXIgaW5mb1xuICAgKi9cbiAgc3RhdGljICNwcm9jZXNzVXNlckluT3JnSW5mbyhpbmZvOiBVc2VySW5PcmdJbmZvKTogVXNlckluT3JnSW5mbyB7XG4gICAgaWYgKGluZm8uZW1haWwgPT09IEVNQUlMX05PVF9GT1VORCkge1xuICAgICAgaW5mby5lbWFpbCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG59XG5cbmNvbnN0IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU6IFNlc3Npb25MaWZldGltZSA9IHtcbiAgc2Vzc2lvbjogNjA0ODAwLCAvLyAxIHdlZWtcbiAgYXV0aDogMzAwLCAvLyA1IG1pblxuICByZWZyZXNoOiA4NjQwMCwgLy8gMSBkYXlcbiAgZ3JhY2U6IDMwLCAvLyBzZWNvbmRzXG59O1xuIl19