"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _CubeSignerApi_orgId, _CubeSignerApi_sessionMgr, _OidcClient_env, _OidcClient_orgId, _OidcClient_client;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OidcClient = exports.CubeSignerApi = exports.createHttpClient = void 0;
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
const util_1 = require("./util");
const mfa_1 = require("./mfa");
const response_1 = require("./response");
const paginator_1 = require("./paginator");
const _1 = require(".");
const user_export_1 = require("./user_export");
/**
 * Creates a new HTTP client, setting the "User-Agent" header to this package's {name}@{version}.
 *
 * @param {string} baseUrl The base URL of the client (e.g., "https://gamma.signer.cubist.dev")
 * @param {string} authToken The value to send as "Authorization" header.
 * @return {Client} The new HTTP client.
 */
function createHttpClient(baseUrl, authToken) {
    return (0, openapi_fetch_1.default)({
        baseUrl,
        headers: {
            Authorization: authToken,
            ["User-Agent"]: `${_1.NAME}@${_1.VERSION}`,
        },
    });
}
exports.createHttpClient = createHttpClient;
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
class CubeSignerApi {
    /** Underlying session manager */
    get sessionMgr() {
        return __classPrivateFieldGet(this, _CubeSignerApi_sessionMgr, "f");
    }
    /** Target environment */
    get env() {
        return this.sessionMgr.env;
    }
    /**
     * Constructor.
     * @param {SignerSessionManager} sessionMgr The session manager to use
     * @param {string?} orgId Optional organization ID; if omitted, uses the org ID from the session manager.
     */
    constructor(sessionMgr, orgId) {
        _CubeSignerApi_orgId.set(this, void 0);
        _CubeSignerApi_sessionMgr.set(this, void 0);
        __classPrivateFieldSet(this, _CubeSignerApi_sessionMgr, sessionMgr, "f");
        __classPrivateFieldSet(this, _CubeSignerApi_orgId, orgId ?? sessionMgr.orgId, "f");
    }
    /**
     * Returns a new instance of this class using the same session manager but targeting a different organization.
     *
     * @param {string} orgId The organization ID.
     * @return {CubeSignerApi} A new instance of this class using the same session manager but targeting different organization.
     */
    withOrg(orgId) {
        return orgId ? new CubeSignerApi(__classPrivateFieldGet(this, _CubeSignerApi_sessionMgr, "f"), orgId) : this;
    }
    /** Org id or name */
    get orgId() {
        return __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f");
    }
    // #region USERS: userGet, userResetTotp(Init|Complete), userVerifyTotp, userRegisterFido(Init|Complete)
    /**
     * Obtain information about the current user.
     *
     * @return {Promise<UserInfo>} Retrieves information about the current user.
     */
    async userGet() {
        const client = await this.client();
        const resp = `${this.orgId}` !== "undefined"
            ? await client.get("/v0/org/{org_id}/user/me", {
                params: { path: { org_id: this.orgId } },
                parseAs: "json",
            })
            : await client.get("/v0/about_me", { parseAs: "json" });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered either by calling {@link TotpChallenge.answer} (or
     * {@link CubeSignerApi.userResetTotpComplete}).
     *
     * @param {string} issuer Optional issuer; defaults to "Cubist"
     * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
     */
    async userResetTotpInit(issuer, mfaReceipt) {
        const resetTotpFn = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v0/org/{org_id}/user/me/totp", {
                headers,
                params: { path: { org_id: this.orgId } },
                body: issuer
                    ? {
                        issuer,
                    }
                    : null,
                parseAs: "json",
            });
            const data = (0, util_1.assertOk)(resp);
            return (0, response_1.mapResponse)(data, (totpInfo) => new mfa_1.TotpChallenge(this, totpInfo));
        };
        return await response_1.CubeSignerResponse.create(resetTotpFn, mfaReceipt);
    }
    /**
     * Answer the TOTP challenge issued by {@link userResetTotpInit}. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.
     *
     * Instead of calling this method directly, prefer {@link TotpChallenge.answer}.
     *
     * @param {string} totpId - The ID of the TOTP challenge
     * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    async userResetTotpComplete(totpId, code) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}/user/me/totp", {
            parseAs: "json",
            params: { path: { org_id: this.orgId } },
            body: { totp_id: totpId, code },
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * @param {string} code Current TOTP code
     */
    async userVerifyTotp(code) {
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/user/me/totp/verify", {
            params: { path: { org_id: this.orgId } },
            body: { code },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Initiate adding a new FIDO device. MFA may be required.  This returns a {@link AddFidoChallenge}
     * that must be answered with {@link AddFidoChallenge.answer} or {@link userRegisterFidoComplete}
     * (after MFA approvals).
     *
     * @param {string} name The name of the new device.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
     * @return {Promise<CubeSignerResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
     */
    async userRegisterFidoInit(name, mfaReceipt) {
        const addFidoFn = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v0/org/{org_id}/user/me/fido", {
                headers,
                params: { path: { org_id: this.orgId } },
                body: { name },
                parseAs: "json",
            });
            const data = (0, util_1.assertOk)(resp);
            return (0, response_1.mapResponse)(data, (c) => new mfa_1.AddFidoChallenge(this, c));
        };
        return await response_1.CubeSignerResponse.create(addFidoFn, mfaReceipt);
    }
    /**
     * Complete a previously initiated (via {@link userRegisterFidoInit}) request to add a new FIDO device.
     *
     * Instead of calling this method directly, prefer {@link AddFidoChallenge.answer} or
     * {@link AddFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} challengeId The ID of the challenge returned by the remote end.
     * @param {PublicKeyCredential} credential The answer to the challenge.
     */
    async userRegisterFidoComplete(challengeId, credential) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}/user/me/fido", {
            params: { path: { org_id: this.orgId } },
            body: {
                challenge_id: challengeId,
                credential,
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    // #endregion
    // #region ORGS: orgGet, orgUpdate
    /**
     * Obtain information about the current organization.
     * @return {OrgInfo} Information about the organization.
     */
    async orgGet() {
        const client = await this.client();
        const resp = await client.get("/v0/org/{org_id}", {
            params: { path: { org_id: this.orgId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Update the org.
     * @param {UpdateOrgRequest} request The JSON request to send to the API server.
     * @return {UpdateOrgResponse} Updated org information.
     */
    async orgUpdate(request) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}", {
            params: { path: { org_id: this.orgId } },
            body: request,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    // #endregion
    // #region ORG USERS: orgUserInvite, orgUsersList, orgUserCreateOidc, orgUserDeleteOidc
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @param {string} email Email of the user
     * @param {string} name The full name of the user
     * @param {MemberRole} role Optional role. Defaults to "alien".
     */
    async orgUserInvite(email, name, role) {
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/invite", {
            params: { path: { org_id: this.orgId } },
            body: {
                email,
                name,
                role,
                skip_email: false,
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * List users.
     * @return {User[]} Org users.
     */
    async orgUsersList() {
        const client = await this.client();
        const resp = await client.get("/v0/org/{org_id}/users", {
            params: { path: { org_id: this.orgId } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data.users;
    }
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     * @param {OidcIdentity} identity The identity of the OIDC user
     * @param {string} email Email of the OIDC user
     * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
     * @return {string} User id of the new user
     */
    async orgUserCreateOidc(identity, email, opts = {}) {
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/users", {
            params: { path: { org_id: this.orgId } },
            body: {
                identity,
                role: opts.memberRole ?? "Alien",
                email: email,
                mfa_policy: opts.mfaPolicy ?? null,
            },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp).user_id;
    }
    /**
     * Delete an existing OIDC user.
     * @param {OidcIdentity} identity The identity of the OIDC user
     */
    async orgUserDeleteOidc(identity) {
        const client = await this.client();
        const resp = await client.del("/v0/org/{org_id}/users/oidc", {
            params: { path: { org_id: this.orgId } },
            body: identity,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    // #endregion
    // #region KEYS: keyGet, keyUpdate, keyDelete, keysCreate, keysDerive, keysList
    /**
     * Get a key by its id.
     *
     * @param {string} keyId The id of the key to get.
     * @return {KeyInfoApi} The key information.
     */
    async keyGet(keyId) {
        const client = await this.client();
        const resp = await client.get("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: keyId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Update key.
     * @param {string} keyId The ID of the key to update.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfoApi} The JSON response from the API server.
     */
    async keyUpdate(keyId, request) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: keyId } },
            body: request,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Deletes a key.
     *
     * @param {string} keyId - Key id
     */
    async keyDelete(keyId) {
        const client = await this.client();
        const resp = await client.del("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: keyId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Create new signing keys.
     *
     * @param {KeyType} keyType The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {KeyInfoApi[]} The new keys.
     */
    async keysCreate(keyType, count, ownerId) {
        const chain_id = 0; // not used anymore
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/keys", {
            params: { path: { org_id: this.orgId } },
            body: {
                count,
                chain_id,
                key_type: keyType,
                owner: ownerId || null,
            },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data.keys;
    }
    /**
     * Derive a set of keys of a specified type using a supplied derivation path and an existing long-lived mnemonic.
     *
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {KeyType} keyType The type of key to create.
     * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {KeyInfoApi[]} The newly derived keys.
     */
    async keysDerive(keyType, derivationPaths, mnemonicId) {
        const client = await this.client();
        const resp = await client.put("/v0/org/{org_id}/derive_key", {
            params: { path: { org_id: this.orgId } },
            body: {
                derivation_path: derivationPaths,
                mnemonic_id: mnemonicId,
                key_type: keyType,
            },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp).keys;
    }
    /**
     * List all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListKeysResponse, KeyInfoApi>} Paginator for iterating over keys.
     */
    keysList(type, page) {
        const listFn = async (query) => {
            const client = await this.client();
            const resp = await client.get("/v0/org/{org_id}/keys", {
                params: {
                    path: { org_id: this.orgId },
                    query: {
                        key_type: type,
                        ...query,
                    },
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), listFn, (r) => r.keys, (r) => r.last_evaluated_key);
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
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/roles", {
            params: { path: { org_id: this.orgId } },
            body: name ? { name } : undefined,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp).role_id;
    }
    /**
     * Get a role by its id (or name).
     * @param {string} roleId The id of the role to get.
     * @return {RoleInfo} The role.
     */
    async roleGet(roleId) {
        const client = await this.client();
        const resp = await client.get("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Update a role.
     *
     * @param {string} roleId The ID of the role to update.
     * @param {UpdateRoleRequest} request The update request.
     * @return {Promise<RoleInfo>} The updated role information.
     */
    async roleUpdate(roleId, request) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
            body: request,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Delete a role by its ID.
     *
     * @param {string} roleId The ID of the role to delete.
     */
    async roleDelete(roleId) {
        const client = await this.client();
        const resp = await client.del("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {RoleInfo} Paginator for iterating over roles.
     */
    rolesList(page) {
        const listFn = async (query) => {
            const client = await this.client();
            const resp = await client.get("/v0/org/{org_id}/roles", {
                params: {
                    path: { org_id: this.orgId },
                    query,
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), listFn, (r) => r.roles, (r) => r.last_evaluated_key);
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
        const client = await this.client();
        const resp = await client.put("/v0/org/{org_id}/roles/{role_id}/add_keys", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), role_id: roleId } },
            body: {
                key_ids: keyIds,
                policy: (policy ?? null),
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp, "Failed to add keys to role");
    }
    /**
     * Remove an existing key from an existing role.
     *
     * @param {string} roleId The ID of the role
     * @param {string} keyId The ID of the key to remove from the role
     */
    async roleKeysRemove(roleId, keyId) {
        const client = await this.client();
        const resp = await client.del("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), role_id: roleId, key_id: keyId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp, "Failed to remove key from a role");
    }
    /**
     * List all keys in a role.
     *
     * @param {string} roleId The ID of the role whose keys to retrieve.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListRoleKeysResponse, KeyInRoleInfo>} Paginator for iterating over the keys in the role.
     */
    roleKeysList(roleId, page) {
        const listFn = async (query) => {
            const client = await this.client();
            const resp = await client.get("/v0/org/{org_id}/roles/{role_id}/keys", {
                params: {
                    path: { org_id: this.orgId, role_id: roleId },
                    query,
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), listFn, (r) => r.keys, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region ROLE USERS: roleUserAdd, roleUsersList
    /**
     * Add an existing user to an existing role.
     *
     * @param {string} roleId The ID of the role.
     * @param {string} userId The ID of the user to add to the role.
     */
    async roleUserAdd(roleId, userId) {
        const client = await this.client();
        const resp = await client.put("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), role_id: roleId, user_id: userId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp, "Failed to add user to role");
    }
    /**
     * List all users in a role.
     *
     * @param {string} roleId The ID of the role whose users to retrieve.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListRoleUsersResponse, UserInRoleInfo>} Paginator for iterating over the users in the role.
     */
    roleUsersList(roleId, page) {
        const listFn = async (query) => {
            const client = await this.client();
            const resp = await client.get("/v0/org/{org_id}/roles/{role_id}/users", {
                params: {
                    path: { org_id: this.orgId, role_id: roleId },
                    query,
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), listFn, (r) => r.users, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region SESSIONS: sessionCreateForRole, sessionRefresh, sessionRevoke, sessionsList, sessionKeysList
    /**
     * Create a new signer session for a given role.
     *
     * @param {string} roleId Role ID
     * @param {string} purpose The purpose of the session
     * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
     * @param {SignerSessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SignerSessionData>} New signer session info.
     */
    async sessionCreateForRole(roleId, purpose, scopes, lifetimes) {
        lifetimes ??= defaultSignerSessionLifetime;
        const invalidScopes = (scopes || []).filter((s) => !s.startsWith("sign:"));
        if (invalidScopes.length > 0) {
            throw new Error(`Role scopes must start with 'sign:'; invalid scopes: ${invalidScopes}`);
        }
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/roles/{role_id}/tokens", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
            body: {
                purpose,
                scopes,
                auth_lifetime: lifetimes.auth,
                refresh_lifetime: lifetimes.refresh,
                session_lifetime: lifetimes.session,
                grace_lifetime: lifetimes.grace,
            },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return {
            org_id: this.orgId,
            role_id: roleId,
            purpose,
            token: data.token,
            session_info: data.session_info,
            // Keep compatibility with tokens produced by CLI
            env: {
                ["Dev-CubeSignerStack"]: __classPrivateFieldGet(this, _CubeSignerApi_sessionMgr, "f").env,
            },
        };
    }
    /**
     * Revoke a session.
     *
     * @param {string} sessionId The ID of the session to revoke.
     */
    async sessionRevoke(sessionId) {
        const client = await this.client();
        const resp = await client.del("/v0/org/{org_id}/session/{session_id}", {
            params: { path: { org_id: this.orgId, session_id: sessionId } },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
     *
     * @param {string?} roleId If set, limit to sessions for this role only.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    sessionsList(roleId, page) {
        const listFn = async (query) => {
            const client = await this.client();
            const resp = await client.get("/v0/org/{org_id}/session", {
                params: {
                    path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f") },
                    query: { role: roleId, ...query },
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), listFn, (r) => r.sessions, (r) => r.last_evaluated_key);
    }
    /**
     * Returns the list of keys that this session has access to.
     * @return {Key[]} The list of keys.
     */
    async sessionKeysList() {
        const client = await this.client();
        const resp = await client.get("/v0/org/{org_id}/token/keys", {
            params: { path: { org_id: this.orgId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp).keys;
    }
    // #endregion
    // #region IDENTITY: identityProve, identityVerify
    /**
     * Obtain proof of authentication using the current CubeSigner session.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async identityProve() {
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/identity/prove", {
            params: { path: { org_id: this.orgId } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {IdentityProof} proof The proof of authentication.
     */
    async identityVerify(proof) {
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/identity/verify", {
            params: { path: { org_id: this.orgId } },
            body: proof,
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
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
        const client = await this.client();
        const resp = await client.get("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId } },
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    async mfaList() {
        const client = await this.client();
        const resp = await client.get("/v0/org/{org_id}/mfa", {
            params: { path: { org_id: this.orgId } },
        });
        return (0, util_1.assertOk)(resp).mfa_requests;
    }
    /**
     * Approve a pending MFA request using the current session.
     *
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    async mfaApprove(mfaId) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId } },
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param {string} mfaId The MFA request to approve
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
     */
    async mfaApproveTotp(mfaId, code) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/totp", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), mfa_id: mfaId } },
            body: { code },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Initiate approval of an existing MFA request using FIDO. A challenge is
     * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaApproveFidoComplete}.
     *
     * @param {string} mfaId The MFA request ID.
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    async mfaApproveFidoInit(mfaId) {
        const client = await this.client();
        const resp = await client.post("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId } },
            parseAs: "json",
        });
        const challenge = (0, util_1.assertOk)(resp);
        return new mfa_1.MfaFidoChallenge(this, mfaId, challenge);
    }
    /**
     * Complete a previously initiated (via {@link mfaApproveFidoInit}) MFA request approval using FIDO.
     *
     * Instead of calling this method directly, prefer {@link MfaFidoChallenge.answer} or
     * {@link MfaFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} mfaId The MFA request ID
     * @param {string} challengeId The ID of the challenge issued by {@link mfaApproveFidoInit}
     * @param {PublicKeyCredential} credential The answer to the challenge
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    async mfaApproveFidoComplete(mfaId, challengeId, credential) {
        const client = await this.client();
        const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId } },
            body: {
                challenge_id: challengeId,
                credential,
            },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    // #endregion
    // #region SIGN: signEvm, signEth2, signStake, signUnstake, signAva, signBlob, signBtc, signSolana
    /**
     * Sign an EVM transaction.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EvmSignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    async signEvm(key, req, mfaReceipt) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v1/org/{org_id}/eth1/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
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
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v1/org/{org_id}/eth2/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * @param {Eth2StakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
     */
    async signStake(req, mfaReceipt) {
        const sign = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v1/org/{org_id}/eth2/stake", {
                params: { path: { org_id: this.orgId } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
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
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v1/org/{org_id}/eth2/unstake/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign an Avalanche P- or X-chain message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    async signAva(key, tx, mfaReceipt) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const req = {
                tx: tx,
            };
            const client = await this.client();
            const resp = await client.post("/v0/org/{org_id}/ava/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
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
        const key_id = typeof key === "string" ? key : key.id;
        const sign = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v1/org/{org_id}/blob/sign/{key_id}", {
                params: {
                    path: { org_id: this.orgId, key_id },
                },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
    }
    /**
     * Sign a Bitcoin message.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    async signBtc(key, req, mfaReceipt) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v0/org/{org_id}/btc/sign/{pubkey}", {
                params: {
                    path: { org_id: this.orgId, pubkey },
                },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
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
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v0/org/{org_id}/solana/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(sign, mfaReceipt);
    }
    // #endregion
    /** HTTPS client */
    async client() {
        return await __classPrivateFieldGet(this, _CubeSignerApi_sessionMgr, "f").client();
    }
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
        const listFn = async (query) => {
            const client = await this.client();
            const resp = await client.get("/v0/org/{org_id}/user/me/export", {
                params: {
                    path: { org_id: this.orgId },
                    query: {
                        user_id: userId,
                        key_id: keyId,
                        ...query,
                    },
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), listFn, (r) => r.export_requests, (r) => r.last_evaluated_key);
    }
    /**
     * Delete an outstanding user-export request.
     *
     * @param {string} keyId The key-id corresponding to the user-export request to delete.
     * @param {string?} userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
     */
    async userExportDelete(keyId, userId) {
        const client = await this.client();
        const resp = await client.del("/v0/org/{org_id}/user/me/export", {
            params: {
                path: { org_id: this.orgId },
                query: {
                    key_id: keyId,
                    user_id: userId,
                },
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Initiate a user-export request.
     *
     * @param {string} keyId The key-id for which to initiate an export.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<UserExportInitResponse | AcceptedResponse>} The response.
     */
    async userExportInit(keyId, mfaReceipt) {
        const init = async (headers) => {
            const client = await this.client();
            const resp = await client.post("/v0/org/{org_id}/user/me/export", {
                params: { path: { org_id: this.orgId } },
                body: { key_id: keyId },
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(init, mfaReceipt);
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
        // make the request
        const complete = async (headers) => {
            const client = await this.client();
            const resp = await client.patch("/v0/org/{org_id}/user/me/export", {
                params: { path: { org_id: this.orgId } },
                body: {
                    key_id: keyId,
                    public_key: publicKeyB64,
                },
                headers,
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        return await response_1.CubeSignerResponse.create(complete, mfaReceipt);
    }
}
exports.CubeSignerApi = CubeSignerApi;
_CubeSignerApi_orgId = new WeakMap(), _CubeSignerApi_sessionMgr = new WeakMap();
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using an OIDC token.
 */
class OidcClient {
    /**
     * @param {EnvInterface} env CubeSigner deployment
     * @param {string} orgId Target organization ID
     * @param {string} oidcToken User's OIDC token
     */
    constructor(env, orgId, oidcToken) {
        _OidcClient_env.set(this, void 0);
        _OidcClient_orgId.set(this, void 0);
        _OidcClient_client.set(this, void 0);
        __classPrivateFieldSet(this, _OidcClient_orgId, orgId, "f");
        __classPrivateFieldSet(this, _OidcClient_env, env, "f");
        __classPrivateFieldSet(this, _OidcClient_client, createHttpClient(env.SignerApiRoot, oidcToken), "f");
    }
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {List<string>} scopes The scopes for the new session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<CubeSignerResponse<SignerSessionData>>} The session data.
     */
    async sessionCreate(scopes, lifetimes, mfaReceipt) {
        const loginFn = async (headers) => {
            const resp = await __classPrivateFieldGet(this, _OidcClient_client, "f").post("/v0/org/{org_id}/oidc", {
                params: { path: { org_id: __classPrivateFieldGet(this, _OidcClient_orgId, "f") } },
                headers,
                body: {
                    scopes,
                    tokens: lifetimes,
                },
                parseAs: "json",
            });
            const data = (0, util_1.assertOk)(resp);
            return (0, response_1.mapResponse)(data, (sessionInfo) => ({
                env: {
                    ["Dev-CubeSignerStack"]: __classPrivateFieldGet(this, _OidcClient_env, "f"),
                },
                org_id: __classPrivateFieldGet(this, _OidcClient_orgId, "f"),
                token: sessionInfo.token,
                purpose: "sign via oidc",
                session_info: sessionInfo.session_info,
            }));
        };
        return await response_1.CubeSignerResponse.create(loginFn, mfaReceipt);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async identityProve() {
        const resp = await __classPrivateFieldGet(this, _OidcClient_client, "f").post("/v0/org/{org_id}/identity/prove/oidc", {
            params: { path: { org_id: __classPrivateFieldGet(this, _OidcClient_orgId, "f") } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
}
exports.OidcClient = OidcClient;
_OidcClient_env = new WeakMap(), _OidcClient_orgId = new WeakMap(), _OidcClient_client = new WeakMap();
const defaultSignerSessionLifetime = {
    session: 604800, // 1 week
    auth: 300, // 5 min
    refresh: 86400, // 1 day
    grace: 30, // seconds
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBeUM7QUFxRHpDLGlDQUFrRDtBQUNsRCwrQkFBc0Y7QUFDdEYseUNBQTZEO0FBRTdELDJDQUF1RTtBQUd2RSx3QkFBa0M7QUFDbEMsK0NBQWlEO0FBT2pEOzs7Ozs7R0FNRztBQUNILFNBQWdCLGdCQUFnQixDQUFDLE9BQWUsRUFBRSxTQUFpQjtJQUNqRSxPQUFPLElBQUEsdUJBQVksRUFBUTtRQUN6QixPQUFPO1FBQ1AsT0FBTyxFQUFFO1lBQ1AsYUFBYSxFQUFFLFNBQVM7WUFDeEIsQ0FBQyxZQUFZLENBQUMsRUFBRSxHQUFHLE9BQUksSUFBSSxVQUFPLEVBQUU7U0FDckM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBUkQsNENBUUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFhLGFBQWE7SUFJeEIsaUNBQWlDO0lBQ2pDLElBQUksVUFBVTtRQUNaLE9BQU8sdUJBQUEsSUFBSSxpQ0FBWSxDQUFDO0lBQzFCLENBQUM7SUFFRCx5QkFBeUI7SUFDekIsSUFBSSxHQUFHO1FBQ0wsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksVUFBZ0MsRUFBRSxLQUFjO1FBbEJuRCx1Q0FBZTtRQUNmLDRDQUFrQztRQWtCekMsdUJBQUEsSUFBSSw2QkFBZSxVQUFVLE1BQUEsQ0FBQztRQUM5Qix1QkFBQSxJQUFJLHdCQUFVLEtBQUssSUFBSSxVQUFVLENBQUMsS0FBSyxNQUFBLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsT0FBTyxDQUFDLEtBQWM7UUFDcEIsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksYUFBYSxDQUFDLHVCQUFBLElBQUksaUNBQVksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFD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LElBQUksRUFDSixDQUFDLFdBQVcsRUFBRSxFQUFFLENBQ2QsQ0FBbUI7Z0JBQ2pCLEdBQUcsRUFBRTtvQkFDSCxDQUFDLHFCQUFxQixDQUFDLEVBQUUsdUJBQUEsSUFBSSx1QkFBSztpQkFDbkM7Z0JBQ0QsTUFBTSxFQUFFLHVCQUFBLElBQUkseUJBQU87Z0JBQ25CLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSztnQkFDeEIsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLFlBQVksRUFBRSxXQUFXLENBQUMsWUFBWTthQUN2QyxDQUFBLENBQ0osQ0FBQztRQUNKLENBQUMsQ0FBQztRQUVGLE9BQU8sTUFBTSw2QkFBa0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLGFBQWE7UUFDakIsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDBCQUFRLENBQUMsSUFBSSxDQUFDLHNDQUFzQyxFQUFFO1lBQzNFLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSx1QkFBQSxJQUFJLHlCQUFPLEVBQUUsRUFBRTtZQUN6QyxPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7Q0FDRjtBQXJFRCxnQ0FxRUM7O0FBRUQsTUFBTSw0QkFBNEIsR0FBMEI7SUFDMUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTO0lBQzFCLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUTtJQUNuQixPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVE7SUFDeEIsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVO0NBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3JlYXRlQ2xpZW50IGZyb20gXCJvcGVuYXBpLWZldGNoXCI7XG5pbXBvcnQgeyBwYXRocyB9IGZyb20gXCIuL3NjaGVtYVwiO1xuaW1wb3J0IHtcbiAgU2lnbmVyU2Vzc2lvbkRhdGEsXG4gIFNpZ25lclNlc3Npb25MaWZldGltZSxcbiAgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG59IGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHtcbiAgQ3JlYXRlT2lkY1VzZXJPcHRpb25zLFxuICBJZGVudGl0eVByb29mLFxuICBLZXlJblJvbGVJbmZvLFxuICBLZXlJbmZvQXBpLFxuICBMaXN0S2V5c1Jlc3BvbnNlLFxuICBMaXN0Um9sZUtleXNSZXNwb25zZSxcbiAgTGlzdFJvbGVVc2Vyc1Jlc3BvbnNlLFxuICBMaXN0Um9sZXNSZXNwb25zZSxcbiAgT2lkY0lkZW50aXR5LFxuICBTZXNzaW9uc1Jlc3BvbnNlLFxuICBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICBSb2xlSW5mbyxcbiAgVXBkYXRlS2V5UmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVzcG9uc2UsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxuICBVc2VySWRJbmZvLFxuICBVc2VySW5Sb2xlSW5mbyxcbiAgVXNlckluZm8sXG4gIFNlc3Npb25JbmZvLFxuICBPcmdJbmZvLFxuICBSYXRjaGV0Q29uZmlnLFxuICBFdm1TaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlc3BvbnNlLFxuICBFdGgyU2lnblJlcXVlc3QsXG4gIEV0aDJTaWduUmVzcG9uc2UsXG4gIEV0aDJTdGFrZVJlcXVlc3QsXG4gIEV0aDJTdGFrZVJlc3BvbnNlLFxuICBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gIEV0aDJVbnN0YWtlUmVzcG9uc2UsXG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgQmxvYlNpZ25SZXNwb25zZSxcbiAgQnRjU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVxdWVzdCxcbiAgU29sYW5hU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlc3BvbnNlLFxuICBBdmFTaWduUmVxdWVzdCxcbiAgQXZhVHgsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZW1iZXJSb2xlLFxuICBVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSxcbiAgVXNlckV4cG9ydEluaXRSZXNwb25zZSxcbiAgVXNlckV4cG9ydExpc3RSZXNwb25zZSxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBhc3NlcnRPaywgZW5jb2RlVG9CYXNlNjQgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgeyBBZGRGaWRvQ2hhbGxlbmdlLCBNZmFGaWRvQ2hhbGxlbmdlLCBNZmFSZWNlaXB0LCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyUmVzcG9uc2UsIG1hcFJlc3BvbnNlIH0gZnJvbSBcIi4vcmVzcG9uc2VcIjtcbmltcG9ydCB7IEtleSwgS2V5VHlwZSB9IGZyb20gXCIuL2tleVwiO1xuaW1wb3J0IHsgUGFnZSwgUGFnZU9wdHMsIFBhZ2VRdWVyeUFyZ3MsIFBhZ2luYXRvciB9IGZyb20gXCIuL3BhZ2luYXRvclwiO1xuaW1wb3J0IHsgS2V5UG9saWN5IH0gZnJvbSBcIi4vcm9sZVwiO1xuaW1wb3J0IHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4vZW52XCI7XG5pbXBvcnQgeyBOQU1FLCBWRVJTSU9OIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiLi91c2VyX2V4cG9ydFwiO1xuXG4vKiogQGludGVybmFsICovXG5leHBvcnQgdHlwZSBDbGllbnQgPSBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVDbGllbnQ8cGF0aHM+PjtcblxuZXhwb3J0IHsgcGF0aHMgfTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IEhUVFAgY2xpZW50LCBzZXR0aW5nIHRoZSBcIlVzZXItQWdlbnRcIiBoZWFkZXIgdG8gdGhpcyBwYWNrYWdlJ3Mge25hbWV9QHt2ZXJzaW9ufS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmFzZVVybCBUaGUgYmFzZSBVUkwgb2YgdGhlIGNsaWVudCAoZS5nLiwgXCJodHRwczovL2dhbW1hLnNpZ25lci5jdWJpc3QuZGV2XCIpXG4gKiBAcGFyYW0ge3N0cmluZ30gYXV0aFRva2VuIFRoZSB2YWx1ZSB0byBzZW5kIGFzIFwiQXV0aG9yaXphdGlvblwiIGhlYWRlci5cbiAqIEByZXR1cm4ge0NsaWVudH0gVGhlIG5ldyBIVFRQIGNsaWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUh0dHBDbGllbnQoYmFzZVVybDogc3RyaW5nLCBhdXRoVG9rZW46IHN0cmluZyk6IENsaWVudCB7XG4gIHJldHVybiBjcmVhdGVDbGllbnQ8cGF0aHM+KHtcbiAgICBiYXNlVXJsLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEF1dGhvcml6YXRpb246IGF1dGhUb2tlbixcbiAgICAgIFtcIlVzZXItQWdlbnRcIl06IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgIH0sXG4gIH0pO1xufVxuXG4vKipcbiAqIENsaWVudCB0byB1c2UgdG8gc2VuZCByZXF1ZXN0cyB0byBDdWJlU2lnbmVyIHNlcnZpY2VzXG4gKiB3aGVuIGF1dGhlbnRpY2F0aW5nIHVzaW5nIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lckFwaSB7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSAjc2Vzc2lvbk1ncjogU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG5cbiAgLyoqIFVuZGVybHlpbmcgc2Vzc2lvbiBtYW5hZ2VyICovXG4gIGdldCBzZXNzaW9uTWdyKCk6IFNpZ25lclNlc3Npb25NYW5hZ2VyIHtcbiAgICByZXR1cm4gdGhpcy4jc2Vzc2lvbk1ncjtcbiAgfVxuXG4gIC8qKiBUYXJnZXQgZW52aXJvbm1lbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZ3IuZW52O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25NYW5hZ2VyfSBzZXNzaW9uTWdyIFRoZSBzZXNzaW9uIG1hbmFnZXIgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3JnSWQgT3B0aW9uYWwgb3JnYW5pemF0aW9uIElEOyBpZiBvbWl0dGVkLCB1c2VzIHRoZSBvcmcgSUQgZnJvbSB0aGUgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbk1ncjogU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIG9yZ0lkPzogc3RyaW5nKSB7XG4gICAgdGhpcy4jc2Vzc2lvbk1nciA9IHNlc3Npb25NZ3I7XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZCA/PyBzZXNzaW9uTWdyLm9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyB1c2luZyB0aGUgc2FtZSBzZXNzaW9uIG1hbmFnZXIgYnV0IHRhcmdldGluZyBhIGRpZmZlcmVudCBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnYW5pemF0aW9uIElELlxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyQXBpfSBBIG5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIHVzaW5nIHRoZSBzYW1lIHNlc3Npb24gbWFuYWdlciBidXQgdGFyZ2V0aW5nIGRpZmZlcmVudCBvcmdhbml6YXRpb24uXG4gICAqL1xuICB3aXRoT3JnKG9yZ0lkPzogc3RyaW5nKTogQ3ViZVNpZ25lckFwaSB7XG4gICAgcmV0dXJuIG9yZ0lkID8gbmV3IEN1YmVTaWduZXJBcGkodGhpcy4jc2Vzc2lvbk1nciwgb3JnSWQpIDogdGhpcztcbiAgfVxuXG4gIC8qKiBPcmcgaWQgb3IgbmFtZSAqL1xuICBnZXQgb3JnSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI29yZ0lkO1xuICB9XG5cbiAgLy8gI3JlZ2lvbiBVU0VSUzogdXNlckdldCwgdXNlclJlc2V0VG90cChJbml0fENvbXBsZXRlKSwgdXNlclZlcmlmeVRvdHAsIHVzZXJSZWdpc3RlckZpZG8oSW5pdHxDb21wbGV0ZSlcblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckluZm8+fSBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICovXG4gIGFzeW5jIHVzZXJHZXQoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9XG4gICAgICBgJHt0aGlzLm9yZ0lkfWAgIT09IFwidW5kZWZpbmVkXCJcbiAgICAgICAgPyBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lXCIsIHtcbiAgICAgICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgICAgICB9KVxuICAgICAgICA6IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvYWJvdXRfbWVcIiwgeyBwYXJzZUFzOiBcImpzb25cIiB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gY2hhbmdlIHVzZXIncyBUT1RQLiBSZXR1cm5zIGEge0BsaW5rIFRvdHBDaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBlaXRoZXIgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9IChvclxuICAgKiB7QGxpbmsgQ3ViZVNpZ25lckFwaS51c2VyUmVzZXRUb3RwQ29tcGxldGV9KS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGlzc3VlciBPcHRpb25hbCBpc3N1ZXI7IGRlZmF1bHRzIHRvIFwiQ3ViaXN0XCJcbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE1GQSByZWNlaXB0IHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqL1xuICBhc3luYyB1c2VyUmVzZXRUb3RwSW5pdChcbiAgICBpc3N1ZXI/OiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFRvdHBDaGFsbGVuZ2U+PiB7XG4gICAgY29uc3QgcmVzZXRUb3RwRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgICBib2R5OiBpc3N1ZXJcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgaXNzdWVyLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAodG90cEluZm8pID0+IG5ldyBUb3RwQ2hhbGxlbmdlKHRoaXMsIHRvdHBJbmZvKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShyZXNldFRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHVzZXJSZXNldFRvdHBJbml0fS4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3RwSWQgLSBUaGUgSUQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIC0gVGhlIFRPVFAgY29kZSB0aGF0IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIHVzZXJSZXNldFRvdHBDb21wbGV0ZSh0b3RwSWQ6IHN0cmluZywgY29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwge1xuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogeyB0b3RwX2lkOiB0b3RwSWQsIGNvZGUgfSxcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyBhIGdpdmVuIFRPVFAgY29kZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqIFRocm93cyBhbiBlcnJvciBpZiB0aGUgdmVyaWZpY2F0aW9uIGZhaWxzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSBDdXJyZW50IFRPVFAgY29kZVxuICAgKi9cbiAgYXN5bmMgdXNlclZlcmlmeVRvdHAoY29kZTogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cC92ZXJpZnlcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYWRkaW5nIGEgbmV3IEZJRE8gZGV2aWNlLiBNRkEgbWF5IGJlIHJlcXVpcmVkLiAgVGhpcyByZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCB3aXRoIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIHVzZXJSZWdpc3RlckZpZG9Db21wbGV0ZX1cbiAgICogKGFmdGVyIE1GQSBhcHByb3ZhbHMpLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbmV3IGRldmljZS5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0IHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEFkZEZpZG9DaGFsbGVuZ2U+Pn0gQSBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGluIG9yZGVyIHRvIGNvbXBsZXRlIEZJRE8gcmVnaXN0cmF0aW9uLlxuICAgKi9cbiAgYXN5bmMgdXNlclJlZ2lzdGVyRmlkb0luaXQoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBZGRGaWRvQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IGFkZEZpZG9GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHsgbmFtZSB9LFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKGRhdGEsIChjKSA9PiBuZXcgQWRkRmlkb0NoYWxsZW5nZSh0aGlzLCBjKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShhZGRGaWRvRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgdXNlclJlZ2lzdGVyRmlkb0luaXR9KSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKiBAcGFyYW0ge1B1YmxpY0tleUNyZWRlbnRpYWx9IGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgdXNlclJlZ2lzdGVyRmlkb0NvbXBsZXRlKGNoYWxsZW5nZUlkOiBzdHJpbmcsIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjaGFsbGVuZ2VfaWQ6IGNoYWxsZW5nZUlkLFxuICAgICAgICBjcmVkZW50aWFsLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHUzogb3JnR2V0LCBvcmdVcGRhdGVcblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IG9yZ2FuaXphdGlvbi5cbiAgICogQHJldHVybiB7T3JnSW5mb30gSW5mb3JtYXRpb24gYWJvdXQgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICovXG4gIGFzeW5jIG9yZ0dldCgpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgb3JnLlxuICAgKiBAcGFyYW0ge1VwZGF0ZU9yZ1JlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJuIHtVcGRhdGVPcmdSZXNwb25zZX0gVXBkYXRlZCBvcmcgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdVcGRhdGUocmVxdWVzdDogVXBkYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8VXBkYXRlT3JnUmVzcG9uc2U+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHIFVTRVJTOiBvcmdVc2VySW52aXRlLCBvcmdVc2Vyc0xpc3QsIG9yZ1VzZXJDcmVhdGVPaWRjLCBvcmdVc2VyRGVsZXRlT2lkY1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmQgYW4gZW1haWwgaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbWFpbCBFbWFpbCBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZnVsbCBuYW1lIG9mIHRoZSB1c2VyXG4gICAqIEBwYXJhbSB7TWVtYmVyUm9sZX0gcm9sZSBPcHRpb25hbCByb2xlLiBEZWZhdWx0cyB0byBcImFsaWVuXCIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VySW52aXRlKGVtYWlsOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcm9sZT86IE1lbWJlclJvbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vaW52aXRlXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lLFxuICAgICAgICByb2xlLFxuICAgICAgICBza2lwX2VtYWlsOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzLlxuICAgKiBAcmV0dXJuIHtVc2VyW119IE9yZyB1c2Vycy5cbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJzTGlzdCgpOiBQcm9taXNlPFVzZXJJZEluZm9bXT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEudXNlcnM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMgdXNlci4gVGhpcyBjYW4gYmUgYSBmaXJzdC1wYXJ0eSBcIk1lbWJlclwiIG9yIHRoaXJkLXBhcnR5IFwiQWxpZW5cIi5cbiAgICogQHBhcmFtIHtPaWRjSWRlbnRpdHl9IGlkZW50aXR5IFRoZSBpZGVudGl0eSBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbWFpbCBFbWFpbCBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSB7Q3JlYXRlT2lkY1VzZXJPcHRpb25zfSBvcHRzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgbmV3IE9JREMgdXNlcnNcbiAgICogQHJldHVybiB7c3RyaW5nfSBVc2VyIGlkIG9mIHRoZSBuZXcgdXNlclxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckNyZWF0ZU9pZGMoXG4gICAgaWRlbnRpdHk6IE9pZGNJZGVudGl0eSxcbiAgICBlbWFpbDogc3RyaW5nLFxuICAgIG9wdHM6IENyZWF0ZU9pZGNVc2VyT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBpZGVudGl0eSxcbiAgICAgICAgcm9sZTogb3B0cy5tZW1iZXJSb2xlID8/IFwiQWxpZW5cIixcbiAgICAgICAgZW1haWw6IGVtYWlsLFxuICAgICAgICBtZmFfcG9saWN5OiBvcHRzLm1mYVBvbGljeSA/PyBudWxsLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKS51c2VyX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBleGlzdGluZyBPSURDIHVzZXIuXG4gICAqIEBwYXJhbSB7T2lkY0lkZW50aXR5fSBpZGVudGl0eSBUaGUgaWRlbnRpdHkgb2YgdGhlIE9JREMgdXNlclxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckRlbGV0ZU9pZGMoaWRlbnRpdHk6IE9pZGNJZGVudGl0eSkge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzL29pZGNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IGlkZW50aXR5LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gS0VZUzoga2V5R2V0LCBrZXlVcGRhdGUsIGtleURlbGV0ZSwga2V5c0NyZWF0ZSwga2V5c0Rlcml2ZSwga2V5c0xpc3RcblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyBpZC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybiB7S2V5SW5mb0FwaX0gVGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGtleUdldChrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXlJbmZvQXBpPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgSUQgb2YgdGhlIGtleSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB7VXBkYXRlS2V5UmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge0tleUluZm9BcGl9IFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqL1xuICBhc3luYyBrZXlVcGRhdGUoa2V5SWQ6IHN0cmluZywgcmVxdWVzdDogVXBkYXRlS2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mb0FwaT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgLSBLZXkgaWRcbiAgICovXG4gIGFzeW5jIGtleURlbGV0ZShrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvQXBpW119IFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNDcmVhdGUoa2V5VHlwZTogS2V5VHlwZSwgY291bnQ6IG51bWJlciwgb3duZXJJZD86IHN0cmluZyk6IFByb21pc2U8S2V5SW5mb0FwaVtdPiB7XG4gICAgY29uc3QgY2hhaW5faWQgPSAwOyAvLyBub3QgdXNlZCBhbnltb3JlXG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY291bnQsXG4gICAgICAgIGNoYWluX2lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgICAgb3duZXI6IG93bmVySWQgfHwgbnVsbCxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEua2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBzZXQgb2Yga2V5cyBvZiBhIHNwZWNpZmllZCB0eXBlIHVzaW5nIGEgc3VwcGxpZWQgZGVyaXZhdGlvbiBwYXRoIGFuZCBhbiBleGlzdGluZyBsb25nLWxpdmVkIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5IHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHtLZXlUeXBlfSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGRlcml2YXRpb25QYXRocyBEZXJpdmF0aW9uIHBhdGhzIGZyb20gd2hpY2ggdG8gZGVyaXZlIG5ldyBrZXlzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWNJZCBtYXRlcmlhbElkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogQHJldHVybiB7S2V5SW5mb0FwaVtdfSBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5c0Rlcml2ZShcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICApOiBQcm9taXNlPEtleUluZm9BcGlbXT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wdXQoXCIvdjAvb3JnL3tvcmdfaWR9L2Rlcml2ZV9rZXlcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZGVyaXZhdGlvbl9wYXRoOiBkZXJpdmF0aW9uUGF0aHMsXG4gICAgICAgIG1uZW1vbmljX2lkOiBtbmVtb25pY0lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCkua2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBrZXlzIGluIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7S2V5VHlwZT99IHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzP30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7UGFnaW5hdG9yPExpc3RLZXlzUmVzcG9uc2UsIEtleUluZm9BcGk+fSBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGtleXMuXG4gICAqL1xuICBrZXlzTGlzdCh0eXBlPzogS2V5VHlwZSwgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RLZXlzUmVzcG9uc2UsIEtleUluZm9BcGk+IHtcbiAgICBjb25zdCBsaXN0Rm4gPSBhc3luYyAocXVlcnk6IFBhZ2VRdWVyeUFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0va2V5c1wiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0sXG4gICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgIGtleV90eXBlOiB0eXBlLFxuICAgICAgICAgICAgLi4ucXVlcnksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFUzogcm9sZUNyZWF0ZSwgcm9sZVJlYWQsIHJvbGVVcGRhdGUsIHJvbGVEZWxldGUsIHJvbGVzTGlzdFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmc/fSBuYW1lIFRoZSBvcHRpb25hbCBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBJRCBvZiB0aGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyByb2xlQ3JlYXRlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogbmFtZSA/IHsgbmFtZSB9IDogdW5kZWZpbmVkLFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpdHMgaWQgKG9yIG5hbWUpLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm4ge1JvbGVJbmZvfSBUaGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVHZXQocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSB7VXBkYXRlUm9sZVJlcXVlc3R9IHJlcXVlc3QgVGhlIHVwZGF0ZSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFJvbGVJbmZvPn0gVGhlIHVwZGF0ZWQgcm9sZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIHJvbGVVcGRhdGUocm9sZUlkOiBzdHJpbmcsIHJlcXVlc3Q6IFVwZGF0ZVJvbGVSZXF1ZXN0KTogUHJvbWlzZTxSb2xlSW5mbz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgcm9sZSBieSBpdHMgSUQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHRvIGRlbGV0ZS5cbiAgICovXG4gIGFzeW5jIHJvbGVEZWxldGUocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7Um9sZUluZm99IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgcm9sZXMuXG4gICAqL1xuICByb2xlc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlc1Jlc3BvbnNlLCBSb2xlSW5mbz4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0sXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci5yb2xlcyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRSBLRVlTOiByb2xlS2V5c0FkZCwgcm9sZUtleXNEZWxldGUsIHJvbGVLZXlzTGlzdFxuXG4gIC8qKlxuICAgKiBBZGQgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBrZXlJZHMgVGhlIElEcyBvZiB0aGUga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5P30gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqL1xuICBhc3luYyByb2xlS2V5c0FkZChyb2xlSWQ6IHN0cmluZywga2V5SWRzOiBzdHJpbmdbXSwgcG9saWN5PzogS2V5UG9saWN5KSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnB1dChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2FkZF9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGtleV9pZHM6IGtleUlkcyxcbiAgICAgICAgcG9saWN5OiAocG9saWN5ID8/IG51bGwpIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIHwgbnVsbCxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwLCBcIkZhaWxlZCB0byBhZGQga2V5cyB0byByb2xlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGVcbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcm9sZV9pZDogcm9sZUlkLCBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3AsIFwiRmFpbGVkIHRvIHJlbW92ZSBrZXkgZnJvbSBhIHJvbGVcIik7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwga2V5cyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIGtleXMgdG8gcmV0cmlldmUuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1BhZ2luYXRvcjxMaXN0Um9sZUtleXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mbz59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqL1xuICByb2xlS2V5c0xpc3Qocm9sZUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0Um9sZUtleXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mbz4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5c1wiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSxcbiAgICAgICAgICBxdWVyeSxcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEUgVVNFUlM6IHJvbGVVc2VyQWRkLCByb2xlVXNlcnNMaXN0XG5cbiAgLyoqXG4gICAqIEFkZCBhbiBleGlzdGluZyB1c2VyIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyByb2xlVXNlckFkZChyb2xlSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucHV0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vYWRkX3VzZXIve3VzZXJfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3AsIFwiRmFpbGVkIHRvIGFkZCB1c2VyIHRvIHJvbGVcIik7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSB1c2VycyB0byByZXRyaWV2ZS5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7UGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm8+fSBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSB1c2VycyBpbiB0aGUgcm9sZS5cbiAgICovXG4gIHJvbGVVc2Vyc0xpc3Qocm9sZUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0Um9sZVVzZXJzUmVzcG9uc2UsIFVzZXJJblJvbGVJbmZvPiB7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS91c2Vyc1wiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSxcbiAgICAgICAgICBxdWVyeSxcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLnVzZXJzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBTRVNTSU9OUzogc2Vzc2lvbkNyZWF0ZUZvclJvbGUsIHNlc3Npb25SZWZyZXNoLCBzZXNzaW9uUmV2b2tlLCBzZXNzaW9uc0xpc3QsIHNlc3Npb25LZXlzTGlzdFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gZm9yIGEgZ2l2ZW4gcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gT25seSBgc2lnbjoqYCBzY29wZXMgYXJlIGFsbG93ZWQuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkxpZmV0aW1lfSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uRGF0YT59IE5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkNyZWF0ZUZvclJvbGUoXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3Blcz86IHN0cmluZ1tdLFxuICAgIGxpZmV0aW1lcz86IFNpZ25lclNlc3Npb25MaWZldGltZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICAgIGxpZmV0aW1lcyA/Pz0gZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTtcbiAgICBjb25zdCBpbnZhbGlkU2NvcGVzID0gKHNjb3BlcyB8fCBbXSkuZmlsdGVyKChzKSA9PiAhcy5zdGFydHNXaXRoKFwic2lnbjpcIikpO1xuICAgIGlmIChpbnZhbGlkU2NvcGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUm9sZSBzY29wZXMgbXVzdCBzdGFydCB3aXRoICdzaWduOic7IGludmFsaWQgc2NvcGVzOiAke2ludmFsaWRTY29wZXN9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBwdXJwb3NlLFxuICAgICAgICBzY29wZXMsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lcy5hdXRoLFxuICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiBsaWZldGltZXMucmVmcmVzaCxcbiAgICAgICAgc2Vzc2lvbl9saWZldGltZTogbGlmZXRpbWVzLnNlc3Npb24sXG4gICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZXMuZ3JhY2UsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiB7XG4gICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgICBwdXJwb3NlLFxuICAgICAgdG9rZW46IGRhdGEudG9rZW4sXG4gICAgICBzZXNzaW9uX2luZm86IGRhdGEuc2Vzc2lvbl9pbmZvLFxuICAgICAgLy8gS2VlcCBjb21wYXRpYmlsaXR5IHdpdGggdG9rZW5zIHByb2R1Y2VkIGJ5IENMSVxuICAgICAgZW52OiB7XG4gICAgICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IHRoaXMuI3Nlc3Npb25NZ3IuZW52LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhIHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXNzaW9uSWQgVGhlIElEIG9mIHRoZSBzZXNzaW9uIHRvIHJldm9rZS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25SZXZva2Uoc2Vzc2lvbklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uL3tzZXNzaW9uX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHNlc3Npb25faWQ6IHNlc3Npb25JZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBhbGwgc2lnbmVyIHNlc3Npb25zIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz99IHJvbGVJZCBJZiBzZXQsIGxpbWl0IHRvIHNlc3Npb25zIGZvciB0aGlzIHJvbGUgb25seS5cbiAgICogQHBhcmFtIHtQYWdlT3B0cz99IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbkluZm9bXT59IFNpZ25lciBzZXNzaW9ucyBmb3IgdGhpcyByb2xlLlxuICAgKi9cbiAgc2Vzc2lvbnNMaXN0KHJvbGVJZD86IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPFNlc3Npb25zUmVzcG9uc2UsIFNlc3Npb25JbmZvPiB7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQgfSxcbiAgICAgICAgICBxdWVyeTogeyByb2xlOiByb2xlSWQsIC4uLnF1ZXJ5IH0sXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci5zZXNzaW9ucyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxpc3Qgb2Yga2V5cyB0aGF0IHRoaXMgc2Vzc2lvbiBoYXMgYWNjZXNzIHRvLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIGxpc3Qgb2Yga2V5cy5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25LZXlzTGlzdCgpOiBQcm9taXNlPEtleUluZm9BcGlbXT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3Rva2VuL2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKS5rZXlzO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gSURFTlRJVFk6IGlkZW50aXR5UHJvdmUsIGlkZW50aXR5VmVyaWZ5XG5cbiAgLyoqXG4gICAqIE9idGFpbiBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbiB1c2luZyB0aGUgY3VycmVudCBDdWJlU2lnbmVyIHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBpZGVudGl0eVByb3ZlKCk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge0lkZW50aXR5UHJvb2Z9IHByb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICovXG4gIGFzeW5jIGlkZW50aXR5VmVyaWZ5KHByb29mOiBJZGVudGl0eVByb29mKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3ZlcmlmeVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogcHJvb2YsXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE1GQTogbWZhR2V0LCBtZmFMaXN0LCBtZmFBcHByb3ZlLCBtZmFMaXN0LCBtZmFBcHByb3ZlLCBtZmFBcHByb3ZlVG90cCwgbWZhQXBwcm92ZUZpZG8oSW5pdHxDb21wbGV0ZSlcblxuICAvKipcbiAgICogUmV0cmlldmVzIGV4aXN0aW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgTUZBIHJlcXVlc3QgSURcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBtZmFHZXQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm9bXT59IFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBtZmFMaXN0KCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm9bXT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L21mYVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKS5tZmFfcmVxdWVzdHM7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFBcHByb3ZlKG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCB0byBhcHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYUFwcHJvdmVUb3RwKG1mYUlkOiBzdHJpbmcsIGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS90b3RwXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIG1mYV9pZDogbWZhSWQgfSB9LFxuICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwgb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgRklETy4gQSBjaGFsbGVuZ2UgaXNcbiAgICogcmV0dXJuZWQgd2hpY2ggbXVzdCBiZSBhbnN3ZXJlZCB2aWEge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvciB7QGxpbmsgbWZhQXBwcm92ZUZpZG9Db21wbGV0ZX0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSUQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhRmlkb0NoYWxsZW5nZT59IEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgbWZhQXBwcm92ZUZpZG9Jbml0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2ZpZG9cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGNoYWxsZW5nZSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBuZXcgTWZhRmlkb0NoYWxsZW5nZSh0aGlzLCBtZmFJZCwgY2hhbGxlbmdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIG1mYUFwcHJvdmVGaWRvSW5pdH0pIE1GQSByZXF1ZXN0IGFwcHJvdmFsIHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3JcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIGlzc3VlZCBieSB7QGxpbmsgbWZhQXBwcm92ZUZpZG9Jbml0fVxuICAgKiBAcGFyYW0ge1B1YmxpY0tleUNyZWRlbnRpYWx9IGNyZWRlbnRpYWwgVGhlIGFuc3dlciB0byB0aGUgY2hhbGxlbmdlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgbWZhQXBwcm92ZUZpZG9Db21wbGV0ZShcbiAgICBtZmFJZDogc3RyaW5nLFxuICAgIGNoYWxsZW5nZUlkOiBzdHJpbmcsXG4gICAgY3JlZGVudGlhbDogUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2ZpZG9cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY2hhbGxlbmdlX2lkOiBjaGFsbGVuZ2VJZCxcbiAgICAgICAgY3JlZGVudGlhbCxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBTSUdOOiBzaWduRXZtLCBzaWduRXRoMiwgc2lnblN0YWtlLCBzaWduVW5zdGFrZSwgc2lnbkF2YSwgc2lnbkJsb2IsIHNpZ25CdGMsIHNpZ25Tb2xhbmFcblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0V2bVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV2bVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdmFsaWRhdGlvbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0V0aDJTdGFrZVJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdGgyU3Rha2VSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU3Rha2UoXG4gICAgcmVxOiBFdGgyU3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdW5zdGFrZS9leGl0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0V0aDJVbnN0YWtlUmVxdWVzdH0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJVbnN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblVuc3Rha2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJVbnN0YWtlUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3Vuc3Rha2Uve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gQXZhbGFuY2hlIFAtIG9yIFgtY2hhaW4gbWVzc2FnZS5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7QXZhVHh9IHR4IEF2YWxhbmNoZSBtZXNzYWdlICh0cmFuc2FjdGlvbikgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxBdmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICB0eDogQXZhVHgsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlcSA9IDxBdmFTaWduUmVxdWVzdD57XG4gICAgICAgIHR4OiB0eCBhcyB1bmtub3duLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2F2YS9zaWduL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dSYXdCbG9iU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS4gVGhpcyBpcyBiZWNhdXNlXG4gICAqIHNpZ25pbmcgYXJiaXRyYXJ5IG1lc3NhZ2VzIGlzLCBpbiBnZW5lcmFsLCBkYW5nZXJvdXMgKGFuZCB5b3Ugc2hvdWxkIGluc3RlYWRcbiAgICogcHJlZmVyIHR5cGVkIGVuZC1wb2ludHMgYXMgdXNlZCBieSwgZm9yIGV4YW1wbGUsIHtAbGluayBzaWduRXZtfSkuIEZvciBTZWNwMjU2azEga2V5cyxcbiAgICogZm9yIGV4YW1wbGUsIHlvdSAqKm11c3QqKiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBhIG1lc3NhZ2UgdGhhdCBpcyAzMiBieXRlcyBsb25nIGFuZFxuICAgKiB0aGUgb3V0cHV0IG9mIGEgc2VjdXJlIGhhc2ggZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBzaWduYXR1cmVzIHNlcmlhbGl6ZWQgYXM7XG4gICAqXG4gICAqIC0gRUNEU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBhcyBiaWctZW5kaWFuIHIgYW5kIHMgcGx1cyByZWNvdmVyeS1pZFxuICAgKiAgICBieXRlIHYsIHdoaWNoIGNhbiBpbiBnZW5lcmFsIHRha2UgYW55IG9mIHRoZSB2YWx1ZXMgMCwgMSwgMiwgb3IgMy5cbiAgICpcbiAgICogLSBFZERTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGluIHRoZSBzdGFuZGFyZCBmb3JtYXQuXG4gICAqXG4gICAqIC0gQkxTIHNpZ25hdHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gdGhlIGJsb2Itc2lnbiBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBJRCkuXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEJsb2JTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJsb2IoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCbG9iU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJsb2JTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5X2lkID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5pZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoKTtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MS9vcmcve29yZ19pZH0vYmxvYi9zaWduL3trZXlfaWR9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZCB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCdGNTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9idGMvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBwdWJrZXkgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNvbGFuYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtTb2xhbmFTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxTb2xhbmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNvbGFuYShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFNvbGFuYVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9zb2xhbmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8qKiBIVFRQUyBjbGllbnQgKi9cbiAgcHJpdmF0ZSBhc3luYyBjbGllbnQoKTogUHJvbWlzZTxDbGllbnQ+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2Vzc2lvbk1nci5jbGllbnQoKTtcbiAgfVxuXG4gIC8vICNyZWdpb24gVVNFUiBFWFBPUlQ6IHVzZXJFeHBvcnQoSW5pdCxDb21wbGV0ZSxMaXN0LERlbGV0ZSlcbiAgLyoqXG4gICAqIExpc3Qgb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdHMuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30ga2V5SWQgT3B0aW9uYWwga2V5IElELiBJZiBzdXBwbGllZCwgbGlzdCB0aGUgb3V0c3RhbmRpbmcgcmVxdWVzdCAoaWYgYW55KSBvbmx5IGZvciB0aGUgc3BlY2lmaWVkIGtleTsgb3RoZXJ3aXNlLCBsaXN0IGFsbCBvdXRzdGFuZGluZyByZXF1ZXN0cyBmb3IgdGhlIHNwZWNpZmllZCB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IHVzZXJJZCBPcHRpb25hbCB1c2VyIElELiBJZiBvbXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGxpc3QgdXNlci1leHBvcnQgcmVxdWVzdHMgZm9yIHVzZXJzIG90aGVyIHRoYW4gdGhlbXNlbHZlcy5cbiAgICogQHBhcmFtIHtQYWdlT3B0cz99IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1BhZ2luYXRvcjxVc2VyRXhwb3J0TGlzdFJlc3BvbnNlLCBVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPn0gUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgcmVzdWx0IHNldC5cbiAgICovXG4gIHVzZXJFeHBvcnRMaXN0KFxuICAgIGtleUlkPzogc3RyaW5nLFxuICAgIHVzZXJJZD86IHN0cmluZyxcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICk6IFBhZ2luYXRvcjxVc2VyRXhwb3J0TGlzdFJlc3BvbnNlLCBVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPiB7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSxcbiAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci5leHBvcnRfcmVxdWVzdHMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBrZXktaWQgY29ycmVzcG9uZGluZyB0byB0aGUgdXNlci1leHBvcnQgcmVxdWVzdCB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gdXNlcklkIE9wdGlvbmFsIHVzZXIgSUQuIElmIG9taXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGRlbGV0ZSB1c2VyLWV4cG9ydCByZXF1ZXN0cyBmb3IgdXNlcnMgb3RoZXIgdGhhbiB0aGVtc2VsdmVzLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydERlbGV0ZShrZXlJZDogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudCgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSxcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUga2V5LWlkIGZvciB3aGljaCB0byBpbml0aWF0ZSBhbiBleHBvcnQuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VyRXhwb3J0SW5pdFJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVzZXJFeHBvcnRJbml0KFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRJbml0UmVzcG9uc2U+PiB7XG4gICAgY29uc3QgaW5pdCA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogeyBrZXlfaWQ6IGtleUlkIH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShpbml0LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUga2V5LWlkIGZvciB3aGljaCB0byBpbml0aWF0ZSBhbiBleHBvcnQuXG4gICAqIEBwYXJhbSB7Q3J5cHRvS2V5fSBwdWJsaWNLZXkgVGhlIE5JU1QgUC0yNTYgcHVibGljIGtleSB0byB3aGljaCB0aGUgZXhwb3J0IHdpbGwgYmUgZW5jcnlwdGVkLiBUaGlzIHNob3VsZCBiZSB0aGUgYHB1YmxpY0tleWAgcHJvcGVydHkgb2YgYSB2YWx1ZSByZXR1cm5lZCBieSBgdXNlckV4cG9ydEtleWdlbmAuXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1c2VyRXhwb3J0Q29tcGxldGUoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBwdWJsaWNLZXk6IENyeXB0b0tleSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2U+PiB7XG4gICAgLy8gYmFzZTY0LWVuY29kZSB0aGUgcHVibGljIGtleVxuICAgIGNvbnN0IHN1YnRsZSA9IGF3YWl0IGxvYWRTdWJ0bGVDcnlwdG8oKTtcbiAgICBjb25zdCBwdWJsaWNLZXlCNjQgPSBlbmNvZGVUb0Jhc2U2NChCdWZmZXIuZnJvbShhd2FpdCBzdWJ0bGUuZXhwb3J0S2V5KFwicmF3XCIsIHB1YmxpY0tleSkpKTtcblxuICAgIC8vIG1ha2UgdGhlIHJlcXVlc3RcbiAgICBjb25zdCBjb21wbGV0ZSA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHB1YmxpY19rZXk6IHB1YmxpY0tleUI2NCxcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGNvbXBsZXRlLCBtZmFSZWNlaXB0KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG59XG5cbi8qKlxuICogQ2xpZW50IHRvIHVzZSB0byBzZW5kIHJlcXVlc3RzIHRvIEN1YmVTaWduZXIgc2VydmljZXNcbiAqIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYW4gT0lEQyB0b2tlbi5cbiAqL1xuZXhwb3J0IGNsYXNzIE9pZGNDbGllbnQge1xuICByZWFkb25seSAjZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSAjY2xpZW50OiBDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7RW52SW50ZXJmYWNlfSBlbnYgQ3ViZVNpZ25lciBkZXBsb3ltZW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUYXJnZXQgb3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvaWRjVG9rZW4gVXNlcidzIE9JREMgdG9rZW5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGVudjogRW52SW50ZXJmYWNlLCBvcmdJZDogc3RyaW5nLCBvaWRjVG9rZW46IHN0cmluZykge1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jZW52ID0gZW52O1xuICAgIHRoaXMuI2NsaWVudCA9IGNyZWF0ZUh0dHBDbGllbnQoZW52LlNpZ25lckFwaVJvb3QsIG9pZGNUb2tlbik7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBmb3IgdGhlIG5ldyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCAoaWQgKyBjb25maXJtYXRpb24gY29kZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2lnbmVyU2Vzc2lvbkRhdGE+Pn0gVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGUoXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNpZ25lclNlc3Npb25EYXRhPj4ge1xuICAgIGNvbnN0IGxvZ2luRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICB0b2tlbnM6IGxpZmV0aW1lcyxcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShcbiAgICAgICAgZGF0YSxcbiAgICAgICAgKHNlc3Npb25JbmZvKSA9PlxuICAgICAgICAgIDxTaWduZXJTZXNzaW9uRGF0YT57XG4gICAgICAgICAgICBlbnY6IHtcbiAgICAgICAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogdGhpcy4jZW52LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9yZ19pZDogdGhpcy4jb3JnSWQsXG4gICAgICAgICAgICB0b2tlbjogc2Vzc2lvbkluZm8udG9rZW4sXG4gICAgICAgICAgICBwdXJwb3NlOiBcInNpZ24gdmlhIG9pZGNcIixcbiAgICAgICAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbkluZm8uc2Vzc2lvbl9pbmZvLFxuICAgICAgICAgIH0sXG4gICAgICApO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShsb2dpbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlQcm92ZSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlL29pZGNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cbn1cblxuY29uc3QgZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTogU2lnbmVyU2Vzc2lvbkxpZmV0aW1lID0ge1xuICBzZXNzaW9uOiA2MDQ4MDAsIC8vIDEgd2Vla1xuICBhdXRoOiAzMDAsIC8vIDUgbWluXG4gIHJlZnJlc2g6IDg2NDAwLCAvLyAxIGRheVxuICBncmFjZTogMzAsIC8vIHNlY29uZHNcbn07XG4iXX0=