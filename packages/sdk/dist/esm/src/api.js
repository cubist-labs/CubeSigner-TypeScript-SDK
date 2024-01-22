var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _OpClient_op, _OpClient_client, _OpClient_eventEmitter, _CubeSignerApi_orgId, _CubeSignerApi_sessionMgr, _CubeSignerApi_eventEmitter, _OidcClient_env, _OidcClient_orgId, _OidcClient_client;
import createClient from "openapi-fetch";
import { encodeToBase64 } from "./util";
import { AddFidoChallenge, MfaFidoChallenge, TotpChallenge } from "./mfa";
import { CubeSignerResponse, mapResponse } from "./response";
import { ErrResponse } from "./error";
import { Page, Paginator } from "./paginator";
import { loadSubtleCrypto } from "./user_export";
import { EventEmitter } from "./events";
import { NAME, VERSION } from "./index";
/**
 * Wrapper around an open-fetch client restricted to a single operation.
 * The restriction applies only when type checking, the actual
 * client does not restrict anything at runtime.
 * client does not restrict anything at runtime
 */
export class OpClient {
    /**
     * @param {Op} op The operation this client should be restricted to
     * @param {FetchClient<Op> | Client} client open-fetch client (either restricted to {@link Op} or not)
     * @param {EventEmitter} eventEmitter The client-local event dispatcher.
     */
    constructor(op, client, eventEmitter) {
        _OpClient_op.set(this, void 0);
        _OpClient_client.set(this, void 0);
        _OpClient_eventEmitter.set(this, void 0);
        __classPrivateFieldSet(this, _OpClient_op, op, "f");
        __classPrivateFieldSet(this, _OpClient_client, client, "f"); // either works
        __classPrivateFieldSet(this, _OpClient_eventEmitter, eventEmitter, "f");
    }
    /** The operation this client is restricted to */
    get op() {
        return __classPrivateFieldGet(this, _OpClient_op, "f");
    }
    /**
     * Inspects the response and returns the response body if the request was successful.
     * Otherwise, dispatches the error to event listeners, then throws {@link ErrResponse}.
     *
     * @param {FetchResponse<T>} resp The response to check
     * @return {FetchResponseSuccessData<T>} The response data corresponding to response type {@link T}.
     */
    async assertOk(resp) {
        if (resp.error) {
            const errResp = resp.error;
            const error = new ErrResponse({
                operation: this.op,
                message: errResp?.message,
                statusText: resp.response?.statusText,
                status: resp.response?.status,
                url: resp.response?.url,
                errorCode: errResp?.error_code,
            });
            await __classPrivateFieldGet(this, _OpClient_eventEmitter, "f").classifyAndEmitError(error);
            throw error;
        }
        if (resp.data === undefined) {
            throw new Error("Response data is undefined");
        }
        return resp.data;
    }
    /* eslint-disable valid-jsdoc */
    /**
     * Invoke HTTP GET
     */
    async get(url, init) {
        const resp = await __classPrivateFieldGet(this, _OpClient_client, "f").get(url, init);
        return await this.assertOk(resp);
    }
    /** Invoke HTTP POST */
    async post(url, init) {
        const resp = await __classPrivateFieldGet(this, _OpClient_client, "f").post(url, init);
        return await this.assertOk(resp);
    }
    /** Invoke HTTP PATCH */
    async patch(url, init) {
        const resp = await __classPrivateFieldGet(this, _OpClient_client, "f").patch(url, init);
        return await this.assertOk(resp);
    }
    /** Invoke HTTP DELETE */
    async del(url, init) {
        const resp = await __classPrivateFieldGet(this, _OpClient_client, "f").del(url, init);
        return await this.assertOk(resp);
    }
    /** Invoke HTTP PUT */
    async put(url, init) {
        const resp = await __classPrivateFieldGet(this, _OpClient_client, "f").put(url, init);
        return await this.assertOk(resp);
    }
}
_OpClient_op = new WeakMap(), _OpClient_client = new WeakMap(), _OpClient_eventEmitter = new WeakMap();
/**
 * Creates a new HTTP client, setting the "User-Agent" header to this package's {name}@{version}.
 *
 * @param {string} baseUrl The base URL of the client (e.g., "https://gamma.signer.cubist.dev")
 * @param {string} authToken The value to send as "Authorization" header.
 * @return {Client} The new HTTP client.
 */
export function createHttpClient(baseUrl, authToken) {
    return createClient({
        baseUrl,
        cache: "no-store",
        headers: {
            Authorization: authToken,
            ["User-Agent"]: `${NAME}@${VERSION}`,
            ["X-Cubist-Ts-Sdk"]: `${NAME}@${VERSION}`,
        },
    });
}
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export class CubeSignerApi {
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
        _CubeSignerApi_eventEmitter.set(this, void 0);
        __classPrivateFieldSet(this, _CubeSignerApi_sessionMgr, sessionMgr, "f");
        __classPrivateFieldSet(this, _CubeSignerApi_eventEmitter, new EventEmitter([sessionMgr.events]), "f");
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
    /**
     * HTTP client restricted to a single operation. The restriction applies only
     * when type checking, the actual client does not restrict anything at runtime.
     *
     * @param {Op} op The operation to restrict the client to
     * @return {Promise<OpClient<Op>>} The client restricted to {@link op}
     */
    async client(op) {
        const fetchClient = await __classPrivateFieldGet(this, _CubeSignerApi_sessionMgr, "f").client(op);
        return new OpClient(op, fetchClient, __classPrivateFieldGet(this, _CubeSignerApi_eventEmitter, "f"));
    }
    // #region USERS: userGet, userTotp(ResetInit|ResetComplete|Verify|Delete), userFido(RegisterInit|RegisterComplete|Delete)
    /**
     * Obtain information about the current user.
     *
     * @return {Promise<UserInfo>} Retrieves information about the current user.
     */
    async userGet() {
        if (`${this.orgId}` === "undefined") {
            const client = await this.client("aboutMeLegacy");
            return await client.get("/v0/about_me", {});
        }
        else {
            const client = await this.client("aboutMe");
            return await client.get("/v0/org/{org_id}/user/me", {
                params: { path: { org_id: this.orgId } },
            });
        }
    }
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered either by calling {@link TotpChallenge.answer} (or
     * {@link CubeSignerApi.userTotpResetComplete}).
     *
     * @param {string} issuer Optional issuer; defaults to "Cubist"
     * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
     */
    async userTotpResetInit(issuer, mfaReceipt) {
        const resetTotpFn = async (headers) => {
            const client = await this.client("userResetTotpInit");
            const data = await client.post("/v0/org/{org_id}/user/me/totp", {
                headers,
                params: { path: { org_id: this.orgId } },
                body: issuer
                    ? {
                        issuer,
                    }
                    : null,
            });
            return mapResponse(data, (totpInfo) => new TotpChallenge(this, totpInfo));
        };
        return await CubeSignerResponse.create(resetTotpFn, mfaReceipt);
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
        const client = await this.client("userResetTotpComplete");
        await client.patch("/v0/org/{org_id}/user/me/totp", {
            params: { path: { org_id: this.orgId } },
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
        const client = await this.client("userVerifyTotp");
        await client.post("/v0/org/{org_id}/user/me/totp/verify", {
            params: { path: { org_id: this.orgId } },
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
        const deleteTotpFn = async (headers) => {
            const client = await this.client("userDeleteTotp");
            return await client.del("/v0/org/{org_id}/user/me/totp", {
                headers,
                params: { path: { org_id: this.orgId } },
                body: null,
            });
        };
        return await CubeSignerResponse.create(deleteTotpFn, mfaReceipt);
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
        const addFidoFn = async (headers) => {
            const client = await this.client("userRegisterFidoInit");
            const data = await client.post("/v0/org/{org_id}/user/me/fido", {
                headers,
                params: { path: { org_id: this.orgId } },
                body: { name },
            });
            return mapResponse(data, (c) => new AddFidoChallenge(this, c));
        };
        return await CubeSignerResponse.create(addFidoFn, mfaReceipt);
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
        const client = await this.client("userRegisterFidoComplete");
        await client.patch("/v0/org/{org_id}/user/me/fido", {
            params: { path: { org_id: this.orgId } },
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
        const deleteFidoFn = async (headers) => {
            const client = await this.client("userDeleteFido");
            return await client.del("/v0/org/{org_id}/user/me/fido/{fido_id}", {
                headers,
                params: { path: { org_id: this.orgId, fido_id: fidoId } },
                body: null,
            });
        };
        return await CubeSignerResponse.create(deleteFidoFn, mfaReceipt);
    }
    // #endregion
    // #region ORGS: orgGet, orgUpdate
    /**
     * Obtain information about the current organization.
     * @return {OrgInfo} Information about the organization.
     */
    async orgGet() {
        const client = await this.client("getOrg");
        return await client.get("/v0/org/{org_id}", {
            params: { path: { org_id: this.orgId } },
        });
    }
    /**
     * Update the org.
     * @param {UpdateOrgRequest} request The JSON request to send to the API server.
     * @return {UpdateOrgResponse} Updated org information.
     */
    async orgUpdate(request) {
        const client = await this.client("updateOrg");
        return await client.patch("/v0/org/{org_id}", {
            params: { path: { org_id: this.orgId } },
            body: request,
        });
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
        const client = await this.client("invite");
        await client.post("/v0/org/{org_id}/invite", {
            params: { path: { org_id: this.orgId } },
            body: {
                email,
                name,
                role,
                skip_email: false,
            },
        });
    }
    /**
     * List users.
     * @return {User[]} Org users.
     */
    async orgUsersList() {
        const client = await this.client("listUsersInOrg");
        const resp = await client.get("/v0/org/{org_id}/users", {
            params: { path: { org_id: this.orgId } },
        });
        return resp.users;
    }
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     * @param {OidcIdentity} identity The identity of the OIDC user
     * @param {string} email Email of the OIDC user
     * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
     * @return {string} User id of the new user
     */
    async orgUserCreateOidc(identity, email, opts = {}) {
        const client = await this.client("createOidcUser");
        const data = await client.post("/v0/org/{org_id}/users", {
            params: { path: { org_id: this.orgId } },
            body: {
                identity,
                role: opts.memberRole ?? "Alien",
                email: email,
                mfa_policy: opts.mfaPolicy ?? null,
            },
        });
        return data.user_id;
    }
    /**
     * Delete an existing OIDC user.
     * @param {OidcIdentity} identity The identity of the OIDC user
     */
    async orgUserDeleteOidc(identity) {
        const client = await this.client("deleteOidcUser");
        return await client.del("/v0/org/{org_id}/users/oidc", {
            params: { path: { org_id: this.orgId } },
            body: identity,
        });
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
        const client = await this.client("getKeyInOrg");
        return await client.get("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: keyId } },
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
        const listFn = async (query) => {
            const client = await this.client("listKeyRoles");
            return await client.get("/v0/org/{org_id}/keys/{key_id}/roles", {
                params: {
                    path: { org_id: this.orgId, key_id: keyId },
                    query,
                },
            });
        };
        return new Paginator(page ?? Page.default(), listFn, (r) => r.roles, (r) => r.last_evaluated_key);
    }
    /**
     * Update key.
     * @param {string} keyId The ID of the key to update.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfoApi} The JSON response from the API server.
     */
    async keyUpdate(keyId, request) {
        const client = await this.client("updateKey");
        return await client.patch("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: keyId } },
            body: request,
        });
    }
    /**
     * Deletes a key.
     *
     * @param {string} keyId - Key id
     */
    async keyDelete(keyId) {
        const client = await this.client("deleteKey");
        await client.del("/v0/org/{org_id}/keys/{key_id}", {
            params: { path: { org_id: this.orgId, key_id: keyId } },
        });
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
        const client = await this.client("createKey");
        const data = await client.post("/v0/org/{org_id}/keys", {
            params: { path: { org_id: this.orgId } },
            body: {
                count,
                chain_id,
                key_type: keyType,
                owner: ownerId || null,
            },
        });
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
        const client = await this.client("deriveKey");
        const data = await client.put("/v0/org/{org_id}/derive_key", {
            params: { path: { org_id: this.orgId } },
            body: {
                derivation_path: derivationPaths,
                mnemonic_id: mnemonicId,
                key_type: keyType,
            },
        });
        return data.keys;
    }
    /**
     * List all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListKeysResponse, KeyInfoApi>} Paginator for iterating over keys.
     */
    keysList(type, page) {
        const listFn = async (query) => {
            const client = await this.client("listKeysInOrg");
            return await client.get("/v0/org/{org_id}/keys", {
                params: {
                    path: { org_id: this.orgId },
                    query: {
                        key_type: type,
                        ...query,
                    },
                },
            });
        };
        return new Paginator(page ?? Page.default(), listFn, (r) => r.keys, (r) => r.last_evaluated_key);
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
        const client = await this.client("createRole");
        const data = await client.post("/v0/org/{org_id}/roles", {
            params: { path: { org_id: this.orgId } },
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
        const client = await this.client("getRole");
        return await client.get("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
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
        const client = await this.client("updateRole");
        return await client.patch("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
            body: request,
        });
    }
    /**
     * Delete a role by its ID.
     *
     * @param {string} roleId The ID of the role to delete.
     */
    async roleDelete(roleId) {
        const client = await this.client("deleteRole");
        await client.del("/v0/org/{org_id}/roles/{role_id}", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
        });
    }
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {RoleInfo} Paginator for iterating over roles.
     */
    rolesList(page) {
        const listFn = async (query) => {
            const client = await this.client("listRoles");
            return await client.get("/v0/org/{org_id}/roles", {
                params: {
                    path: { org_id: this.orgId },
                    query,
                },
            });
        };
        return new Paginator(page ?? Page.default(), listFn, (r) => r.roles, (r) => r.last_evaluated_key);
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
        const client = await this.client("addKeysToRole");
        await client.put("/v0/org/{org_id}/roles/{role_id}/add_keys", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), role_id: roleId } },
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
        const client = await this.client("removeKeyFromRole");
        await client.del("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), role_id: roleId, key_id: keyId } },
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
        const listFn = async (query) => {
            const client = await this.client("listRoleKeys");
            return await client.get("/v0/org/{org_id}/roles/{role_id}/keys", {
                params: {
                    path: { org_id: this.orgId, role_id: roleId },
                    query,
                },
            });
        };
        return new Paginator(page ?? Page.default(), listFn, (r) => r.keys, (r) => r.last_evaluated_key);
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
        const client = await this.client("addUserToRole");
        await client.put("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), role_id: roleId, user_id: userId } },
        });
    }
    /**
     * Remove an existing user from an existing role.
     *
     * @param {string} roleId The ID of the role.
     * @param {string} userId The ID of the user to remove from the role.
     */
    async roleUserRemove(roleId, userId) {
        const client = await this.client("removeUserFromRole");
        await client.del("/v0/org/{org_id}/roles/{role_id}/users/{user_id}", {
            params: { path: { org_id: this.orgId, role_id: roleId, user_id: userId } },
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
        const listFn = async (query) => {
            const client = await this.client("listRoleUsers");
            return await client.get("/v0/org/{org_id}/roles/{role_id}/users", {
                params: {
                    path: { org_id: this.orgId, role_id: roleId },
                    query,
                },
            });
        };
        return new Paginator(page ?? Page.default(), listFn, (r) => r.users, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region SESSIONS: session(Create|CreateForRole|Refresh|Revoke|List|KeysList)
    /**
     * Create new user session (management and/or signing)
     *
     * @param {string} purpose The purpose of the session
     * @param {string[]} scopes Session scopes.
     * @param {SignerSessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SignerSessionData>} New signer session info.
     */
    async sessionCreate(purpose, scopes, lifetimes) {
        lifetimes ??= defaultSignerSessionLifetime;
        const client = await this.client("createSession");
        const data = await client.post("/v0/org/{org_id}/session", {
            params: { path: { org_id: this.orgId } },
            body: {
                purpose,
                scopes,
                auth_lifetime: lifetimes.auth,
                refresh_lifetime: lifetimes.refresh,
                session_lifetime: lifetimes.session,
                grace_lifetime: lifetimes.grace,
            },
        });
        return {
            org_id: this.orgId,
            role_id: undefined,
            purpose,
            token: data.token,
            session_info: data.session_info,
            session_exp: data.expiration,
            // Keep compatibility with tokens produced by CLI
            env: {
                ["Dev-CubeSignerStack"]: __classPrivateFieldGet(this, _CubeSignerApi_sessionMgr, "f").env,
            },
        };
    }
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
        const client = await this.client("createRoleToken");
        const data = await client.post("/v0/org/{org_id}/roles/{role_id}/tokens", {
            params: { path: { org_id: this.orgId, role_id: roleId } },
            body: {
                purpose,
                scopes,
                auth_lifetime: lifetimes.auth,
                refresh_lifetime: lifetimes.refresh,
                session_lifetime: lifetimes.session,
                grace_lifetime: lifetimes.grace,
            },
        });
        return {
            org_id: this.orgId,
            role_id: roleId,
            purpose,
            token: data.token,
            session_info: data.session_info,
            session_exp: data.expiration,
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
        const client = await this.client("revokeSession");
        await client.del("/v0/org/{org_id}/session/{session_id}", {
            params: { path: { org_id: this.orgId, session_id: sessionId } },
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
        const listFn = async (query) => {
            const client = await this.client("listSessions");
            return await client.get("/v0/org/{org_id}/session", {
                params: {
                    path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f") },
                    query: { role: roleId, ...query },
                },
            });
        };
        return new Paginator(page ?? Page.default(), listFn, (r) => r.sessions, (r) => r.last_evaluated_key);
    }
    /**
     * Returns the list of keys that this session has access to.
     * @return {Key[]} The list of keys.
     */
    async sessionKeysList() {
        const client = await this.client("listTokenKeys");
        const resp = await client.get("/v0/org/{org_id}/token/keys", {
            params: { path: { org_id: this.orgId } },
        });
        return resp.keys;
    }
    // #endregion
    // #region IDENTITY: identityProve, identityVerify
    /**
     * Obtain proof of authentication using the current CubeSigner session.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async identityProve() {
        const client = await this.client("createProofCubeSigner");
        return await client.post("/v0/org/{org_id}/identity/prove", {
            params: { path: { org_id: this.orgId } },
        });
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {IdentityProof} proof The proof of authentication.
     */
    async identityVerify(proof) {
        const client = await this.client("verifyProof");
        await client.post("/v0/org/{org_id}/identity/verify", {
            params: { path: { org_id: this.orgId } },
            body: proof,
        });
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
        const client = await this.client("mfaGet");
        return await client.get("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId } },
        });
    }
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    async mfaList() {
        const client = await this.client("mfaList");
        const resp = await client.get("/v0/org/{org_id}/mfa", {
            params: { path: { org_id: this.orgId } },
        });
        return resp.mfa_requests;
    }
    /**
     * Approve or reject a pending MFA request using the current session.
     *
     * @param {string} mfaId The id of the MFA request
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    async mfaVoteCs(mfaId, mfaVote) {
        const client = await this.client("mfaVoteCs");
        return await client.patch("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
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
        const client = await this.client("mfaVoteTotp");
        return await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/totp", {
            params: { path: { org_id: __classPrivateFieldGet(this, _CubeSignerApi_orgId, "f"), mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
            body: { code },
        });
    }
    /**
     * Initiate approval of an existing MFA request using FIDO. A challenge is
     * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaApproveFidoComplete}.
     *
     * @param {string} mfaId The MFA request ID.
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    async mfaFidoInit(mfaId) {
        const client = await this.client("mfaFidoInit");
        const challenge = await client.post("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId } },
        });
        return new MfaFidoChallenge(this, mfaId, challenge);
    }
    /**
     * Complete a previously initiated (via {@link mfaApproveFidoInit}) MFA request using FIDO.
     *
     * Instead of calling this method directly, prefer {@link MfaFidoChallenge.answer} or
     * {@link MfaFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} mfaId The MFA request ID
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @param {string} challengeId The ID of the challenge issued by {@link mfaApproveFidoInit}
     * @param {PublicKeyCredential} credential The answer to the challenge
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    async mfaVoteFidoComplete(mfaId, mfaVote, challengeId, credential) {
        const client = await this.client("mfaVoteFidoComplete");
        return await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
            params: { path: { org_id: this.orgId, mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
            body: {
                challenge_id: challengeId,
                credential,
            },
        });
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
        const signFn = async (headers) => {
            const client = await this.client("eth1Sign");
            return await client.post("/v1/org/{org_id}/eth1/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => {
            const client = await this.client("eip191Sign");
            return await client.post("/v0/org/{org_id}/evm/eip191/sign/{pubkey}", {
                params: {
                    path: { org_id: this.orgId, pubkey },
                },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => {
            const client = await this.client("eip712Sign");
            return await client.post("/v0/org/{org_id}/evm/eip712/sign/{pubkey}", {
                params: {
                    path: { org_id: this.orgId, pubkey },
                },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
            const client = await this.client("eth2Sign");
            return await client.post("/v1/org/{org_id}/eth2/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(sign, mfaReceipt);
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
            const client = await this.client("stake");
            return await client.post("/v1/org/{org_id}/eth2/stake", {
                params: { path: { org_id: this.orgId } },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(sign, mfaReceipt);
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
        const signFn = async (headers) => {
            const client = await this.client("unstake");
            return await client.post("/v1/org/{org_id}/eth2/unstake/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
        const signFn = async (headers) => {
            const req = {
                tx: tx,
            };
            const client = await this.client("avaSign");
            return await client.post("/v0/org/{org_id}/ava/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
        const signFn = async (headers) => {
            const client = await this.client("blobSign");
            return await client.post("/v1/org/{org_id}/blob/sign/{key_id}", {
                params: {
                    path: { org_id: this.orgId, key_id },
                },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
        const signFn = async (headers) => {
            const client = await this.client("btcSign");
            return await client.post("/v0/org/{org_id}/btc/sign/{pubkey}", {
                params: {
                    path: { org_id: this.orgId, pubkey },
                },
                body: req,
                headers: headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
        const signFn = async (headers) => {
            const client = await this.client("solanaSign");
            return await client.post("/v0/org/{org_id}/solana/sign/{pubkey}", {
                params: { path: { org_id: this.orgId, pubkey } },
                body: req,
                headers,
            });
        };
        return await CubeSignerResponse.create(signFn, mfaReceipt);
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
        const listFn = async (query) => {
            const client = await this.client("userExportList");
            return await client.get("/v0/org/{org_id}/user/me/export", {
                params: {
                    path: { org_id: this.orgId },
                    query: {
                        user_id: userId,
                        key_id: keyId,
                        ...query,
                    },
                },
            });
        };
        return new Paginator(page ?? Page.default(), listFn, (r) => r.export_requests, (r) => r.last_evaluated_key);
    }
    /**
     * Delete an outstanding user-export request.
     *
     * @param {string} keyId The key-id corresponding to the user-export request to delete.
     * @param {string?} userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
     */
    async userExportDelete(keyId, userId) {
        const client = await this.client("userExportDelete");
        await client.del("/v0/org/{org_id}/user/me/export", {
            params: {
                path: { org_id: this.orgId },
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
        const initFn = async (headers) => {
            const client = await this.client("userExportInit");
            return await client.post("/v0/org/{org_id}/user/me/export", {
                params: { path: { org_id: this.orgId } },
                body: { key_id: keyId },
                headers,
            });
        };
        return await CubeSignerResponse.create(initFn, mfaReceipt);
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
        const subtle = await loadSubtleCrypto();
        const publicKeyB64 = encodeToBase64(Buffer.from(await subtle.exportKey("raw", publicKey)));
        // make the request
        const completeFn = async (headers) => {
            const client = await this.client("userExportComplete");
            return await client.patch("/v0/org/{org_id}/user/me/export", {
                params: { path: { org_id: this.orgId } },
                body: {
                    key_id: keyId,
                    public_key: publicKeyB64,
                },
                headers,
            });
        };
        return await CubeSignerResponse.create(completeFn, mfaReceipt);
    }
    // #endregion
    // #region MISC: heartbeat()
    /**
     * Send a heartbeat / upcheck request.
     *
     * @return { Promise<void> } The response.
     */
    async heartbeat() {
        const client = await this.client("cube3signerHeartbeat");
        await client.post("/v1/org/{org_id}/cube3signer/heartbeat", {
            params: {
                path: { org_id: this.orgId },
            },
        });
    }
}
_CubeSignerApi_orgId = new WeakMap(), _CubeSignerApi_sessionMgr = new WeakMap(), _CubeSignerApi_eventEmitter = new WeakMap();
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using an OIDC token.
 */
export class OidcClient {
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
     * HTTP client restricted to a single operation.
     *
     * @param {Op} op The operation to restrict the client to
     * @return {OpClient<Op>} The client restricted to {@link op}
     */
    client(op) {
        return new OpClient(op, __classPrivateFieldGet(this, _OidcClient_client, "f"), new EventEmitter([]));
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
            const client = this.client("oidcAuth");
            const data = await client.post("/v0/org/{org_id}/oidc", {
                params: { path: { org_id: __classPrivateFieldGet(this, _OidcClient_orgId, "f") } },
                headers,
                body: {
                    scopes,
                    tokens: lifetimes,
                },
            });
            return mapResponse(data, (sessionInfo) => ({
                env: {
                    ["Dev-CubeSignerStack"]: __classPrivateFieldGet(this, _OidcClient_env, "f"),
                },
                org_id: __classPrivateFieldGet(this, _OidcClient_orgId, "f"),
                token: sessionInfo.token,
                purpose: "sign via oidc",
                session_info: sessionInfo.session_info,
            }));
        };
        return await CubeSignerResponse.create(loginFn, mfaReceipt);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    async identityProve() {
        const client = this.client("createProofOidc");
        return await client.post("/v0/org/{org_id}/identity/prove/oidc", {
            params: { path: { org_id: __classPrivateFieldGet(this, _OidcClient_orgId, "f") } },
        });
    }
}
_OidcClient_env = new WeakMap(), _OidcClient_orgId = new WeakMap(), _OidcClient_client = new WeakMap();
const defaultSignerSessionLifetime = {
    session: 604800, // 1 week
    auth: 300, // 5 min
    refresh: 86400, // 1 day
    grace: 30, // seconds
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLFlBTU4sTUFBTSxlQUFlLENBQUM7QUE0RHZCLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDeEMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFjLGFBQWEsRUFBRSxNQUFNLE9BQU8sQ0FBQztBQUN0RixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsV0FBVyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQzdELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFFdEMsT0FBTyxFQUFFLElBQUksRUFBMkIsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3ZFLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNqRCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3hDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBMkN4Qzs7Ozs7R0FLRztBQUNILE1BQU0sT0FBTyxRQUFRO0lBS25COzs7O09BSUc7SUFDSCxZQUFZLEVBQU0sRUFBRSxNQUFnQyxFQUFFLFlBQTBCO1FBVHZFLCtCQUFRO1FBQ1IsbUNBQXlCO1FBQ3pCLHlDQUE0QjtRQVFuQyx1QkFBQSxJQUFJLGdCQUFPLEVBQUUsTUFBQSxDQUFDO1FBQ2QsdUJBQUEsSUFBSSxvQkFBVyxNQUF5QixNQUFBLENBQUMsQ0FBQyxlQUFlO1FBQ3pELHVCQUFBLElBQUksMEJBQWlCLFlBQVksTUFBQSxDQUFDO0lBQ3BDLENBQUM7SUFFRCxpREFBaUQ7SUFDakQsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLG9CQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNLLEtBQUssQ0FBQyxRQUFRLENB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LENBQUMsQ0FBQztZQUNILE9BQU8sV0FBVyxDQUNoQixJQUFJLEVBQ0osQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUNkLENBQW1CO2dCQUNqQixHQUFHLEVBQUU7b0JBQ0gsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLHVCQUFBLElBQUksdUJBQUs7aUJBQ25DO2dCQUNELE1BQU0sRUFBRSx1QkFBQSxJQUFJLHlCQUFPO2dCQUNuQixLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUs7Z0JBQ3hCLE9BQU8sRUFBRSxlQUFlO2dCQUN4QixZQUFZLEVBQUUsV0FBVyxDQUFDLFlBQVk7YUFDdkMsQ0FBQSxDQUNKLENBQUM7UUFDSixDQUFDLENBQUM7UUFFRixPQUFPLE1BQU0sa0JBQWtCLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxhQUFhO1FBQ2pCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUM5QyxPQUFPLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxzQ0FBc0MsRUFBRTtZQUMvRCxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsdUJBQUEsSUFBSSx5QkFBTyxFQUFFLEVBQUU7U0FDMUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGOztBQUVELE1BQU0sNEJBQTRCLEdBQTBCO0lBQzFELE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUztJQUMxQixJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVE7SUFDbkIsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRO0lBQ3hCLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVTtDQUN0QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNyZWF0ZUNsaWVudCwge1xuICBGZXRjaE9wdGlvbnMsXG4gIEZldGNoUmVzcG9uc2UsXG4gIEZpbHRlcktleXMsXG4gIEh0dHBNZXRob2QsXG4gIFBhdGhzV2l0aCxcbn0gZnJvbSBcIm9wZW5hcGktZmV0Y2hcIjtcbmltcG9ydCB7IHBhdGhzLCBvcGVyYXRpb25zIH0gZnJvbSBcIi4vc2NoZW1hXCI7XG5pbXBvcnQge1xuICBTaWduZXJTZXNzaW9uRGF0YSxcbiAgU2lnbmVyU2Vzc2lvbkxpZmV0aW1lLFxuICBTaWduZXJTZXNzaW9uTWFuYWdlcixcbn0gZnJvbSBcIi4vc2Vzc2lvbi9zaWduZXJfc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQge1xuICBDcmVhdGVPaWRjVXNlck9wdGlvbnMsXG4gIElkZW50aXR5UHJvb2YsXG4gIEtleUluUm9sZUluZm8sXG4gIEtleUluZm9BcGksXG4gIExpc3RLZXlzUmVzcG9uc2UsXG4gIExpc3RLZXlSb2xlc1Jlc3BvbnNlLFxuICBMaXN0Um9sZUtleXNSZXNwb25zZSxcbiAgTGlzdFJvbGVVc2Vyc1Jlc3BvbnNlLFxuICBMaXN0Um9sZXNSZXNwb25zZSxcbiAgT2lkY0lkZW50aXR5LFxuICBTZXNzaW9uc1Jlc3BvbnNlLFxuICBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICBSb2xlSW5mbyxcbiAgVXBkYXRlS2V5UmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVxdWVzdCxcbiAgVXBkYXRlT3JnUmVzcG9uc2UsXG4gIFVwZGF0ZVJvbGVSZXF1ZXN0LFxuICBVc2VySWRJbmZvLFxuICBVc2VySW5Sb2xlSW5mbyxcbiAgVXNlckluZm8sXG4gIFNlc3Npb25JbmZvLFxuICBPcmdJbmZvLFxuICBSYXRjaGV0Q29uZmlnLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlLFxuICBFdm1TaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlc3BvbnNlLFxuICBFdGgyU2lnblJlcXVlc3QsXG4gIEV0aDJTaWduUmVzcG9uc2UsXG4gIEV0aDJTdGFrZVJlcXVlc3QsXG4gIEV0aDJTdGFrZVJlc3BvbnNlLFxuICBFdGgyVW5zdGFrZVJlcXVlc3QsXG4gIEV0aDJVbnN0YWtlUmVzcG9uc2UsXG4gIEJsb2JTaWduUmVxdWVzdCxcbiAgQmxvYlNpZ25SZXNwb25zZSxcbiAgQnRjU2lnblJlc3BvbnNlLFxuICBCdGNTaWduUmVxdWVzdCxcbiAgU29sYW5hU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlc3BvbnNlLFxuICBBdmFTaWduUmVxdWVzdCxcbiAgQXZhVHgsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZmFWb3RlLFxuICBNZW1iZXJSb2xlLFxuICBVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSxcbiAgVXNlckV4cG9ydEluaXRSZXNwb25zZSxcbiAgVXNlckV4cG9ydExpc3RSZXNwb25zZSxcbiAgRW1wdHksXG4gIEVycm9yUmVzcG9uc2UsXG59IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgZW5jb2RlVG9CYXNlNjQgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgeyBBZGRGaWRvQ2hhbGxlbmdlLCBNZmFGaWRvQ2hhbGxlbmdlLCBNZmFSZWNlaXB0LCBUb3RwQ2hhbGxlbmdlIH0gZnJvbSBcIi4vbWZhXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyUmVzcG9uc2UsIG1hcFJlc3BvbnNlIH0gZnJvbSBcIi4vcmVzcG9uc2VcIjtcbmltcG9ydCB7IEVyclJlc3BvbnNlIH0gZnJvbSBcIi4vZXJyb3JcIjtcbmltcG9ydCB7IEtleSwgS2V5VHlwZSB9IGZyb20gXCIuL2tleVwiO1xuaW1wb3J0IHsgUGFnZSwgUGFnZU9wdHMsIFBhZ2VRdWVyeUFyZ3MsIFBhZ2luYXRvciB9IGZyb20gXCIuL3BhZ2luYXRvclwiO1xuaW1wb3J0IHsgS2V5UG9saWN5IH0gZnJvbSBcIi4vcm9sZVwiO1xuaW1wb3J0IHsgRW52SW50ZXJmYWNlIH0gZnJvbSBcIi4vZW52XCI7XG5pbXBvcnQgeyBsb2FkU3VidGxlQ3J5cHRvIH0gZnJvbSBcIi4vdXNlcl9leHBvcnRcIjtcbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCIuL2V2ZW50c1wiO1xuaW1wb3J0IHsgTkFNRSwgVkVSU0lPTiB9IGZyb20gXCIuL2luZGV4XCI7XG5cbi8qKiBAaW50ZXJuYWwgKi9cbmV4cG9ydCB0eXBlIENsaWVudCA9IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUNsaWVudDxwYXRocz4+O1xuXG5leHBvcnQgeyBwYXRocywgb3BlcmF0aW9ucyB9O1xuXG4vKipcbiAqIE9taXQgcm91dGVzIGluIHtAbGluayBUfSB3aG9zZSBtZXRob2RzIGFyZSBhbGwgJ25ldmVyJ1xuICovXG50eXBlIE9taXROZXZlclBhdGhzPFQgZXh0ZW5kcyBwYXRocz4gPSB7XG4gIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFycyAqLyAvLyAnbScsIGJ1dCBpdCdzIG5lZWRlZFxuICBbcCBpbiBrZXlvZiBUIGFzIFRbcF0gZXh0ZW5kcyB7IFttIGluIGtleW9mIFRbcF1dOiBuZXZlciB9ID8gbmV2ZXIgOiBwXTogVFtwXTtcbn07XG5cbi8qKlxuICogRmlsdGVyIG91dCBtZXRob2RzIHRoYXQgZG9uJ3QgbWF0Y2ggb3BlcmF0aW9uIHtAbGluayBPcH1cbiAqL1xudHlwZSBGaWx0ZXJQYXRoczxPcCBleHRlbmRzIGtleW9mIG9wZXJhdGlvbnM+ID0ge1xuICBbcCBpbiBrZXlvZiBwYXRoc106IHtcbiAgICBbbSBpbiBIdHRwTWV0aG9kIGFzIG0gZXh0ZW5kcyBrZXlvZiBwYXRoc1twXSA/IG0gOiBuZXZlcl06IG0gZXh0ZW5kcyBrZXlvZiBwYXRoc1twXVxuICAgICAgPyBvcGVyYXRpb25zW09wXSBleHRlbmRzIHBhdGhzW3BdW21dXG4gICAgICAgID8gcGF0aHNbcF1bbV0gZXh0ZW5kcyBvcGVyYXRpb25zW09wXVxuICAgICAgICAgID8gb3BlcmF0aW9uc1tPcF1cbiAgICAgICAgICA6IG5ldmVyXG4gICAgICAgIDogbmV2ZXJcbiAgICAgIDogbmV2ZXI7XG4gIH07XG59O1xuXG50eXBlIFBhdGhzPE9wIGV4dGVuZHMga2V5b2Ygb3BlcmF0aW9ucz4gPSBPbWl0TmV2ZXJQYXRoczxGaWx0ZXJQYXRoczxPcD4+O1xuXG4vKipcbiAqIE9wZW4tZmV0Y2ggY2xpZW50IHJlc3RyaWN0ZWQgdG8gdGhlIHJvdXRlIHRoYXQgY29ycmVzcG9uZHMgdG8gb3BlcmF0aW9uIHtAbGluayBPcH1cbiAqL1xuZXhwb3J0IHR5cGUgRmV0Y2hDbGllbnQ8T3AgZXh0ZW5kcyBrZXlvZiBvcGVyYXRpb25zPiA9IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZUNsaWVudDxQYXRoczxPcD4+PjtcblxuLyoqXG4gKiBUeXBlIGFsaWFzIGZvciB0aGUgdHlwZSBvZiB0aGUgcmVzcG9uc2UgYm9keSAodGhlIFwiZGF0YVwiIGZpZWxkIG9mXG4gKiB7QGxpbmsgRmV0Y2hSZXNwb25zZTxUPn0pIHdoZW4gdGhhdCByZXNwb25zZSBpcyBzdWNjZXNzZnVsLlxuICovXG5leHBvcnQgdHlwZSBGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD4gPSBSZXF1aXJlZDxGZXRjaFJlc3BvbnNlPFQ+PltcImRhdGFcIl07XG5cbi8qKlxuICogV3JhcHBlciBhcm91bmQgYW4gb3Blbi1mZXRjaCBjbGllbnQgcmVzdHJpY3RlZCB0byBhIHNpbmdsZSBvcGVyYXRpb24uXG4gKiBUaGUgcmVzdHJpY3Rpb24gYXBwbGllcyBvbmx5IHdoZW4gdHlwZSBjaGVja2luZywgdGhlIGFjdHVhbFxuICogY2xpZW50IGRvZXMgbm90IHJlc3RyaWN0IGFueXRoaW5nIGF0IHJ1bnRpbWUuXG4gKiBjbGllbnQgZG9lcyBub3QgcmVzdHJpY3QgYW55dGhpbmcgYXQgcnVudGltZVxuICovXG5leHBvcnQgY2xhc3MgT3BDbGllbnQ8T3AgZXh0ZW5kcyBrZXlvZiBvcGVyYXRpb25zPiB7XG4gIHJlYWRvbmx5ICNvcDogT3A7XG4gIHJlYWRvbmx5ICNjbGllbnQ6IEZldGNoQ2xpZW50PE9wPjtcbiAgcmVhZG9ubHkgI2V2ZW50RW1pdHRlcjogRXZlbnRFbWl0dGVyO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09wfSBvcCBUaGUgb3BlcmF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBiZSByZXN0cmljdGVkIHRvXG4gICAqIEBwYXJhbSB7RmV0Y2hDbGllbnQ8T3A+IHwgQ2xpZW50fSBjbGllbnQgb3Blbi1mZXRjaCBjbGllbnQgKGVpdGhlciByZXN0cmljdGVkIHRvIHtAbGluayBPcH0gb3Igbm90KVxuICAgKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gZXZlbnRFbWl0dGVyIFRoZSBjbGllbnQtbG9jYWwgZXZlbnQgZGlzcGF0Y2hlci5cbiAgICovXG4gIGNvbnN0cnVjdG9yKG9wOiBPcCwgY2xpZW50OiBGZXRjaENsaWVudDxPcD4gfCBDbGllbnQsIGV2ZW50RW1pdHRlcjogRXZlbnRFbWl0dGVyKSB7XG4gICAgdGhpcy4jb3AgPSBvcDtcbiAgICB0aGlzLiNjbGllbnQgPSBjbGllbnQgYXMgRmV0Y2hDbGllbnQ8T3A+OyAvLyBlaXRoZXIgd29ya3NcbiAgICB0aGlzLiNldmVudEVtaXR0ZXIgPSBldmVudEVtaXR0ZXI7XG4gIH1cblxuICAvKiogVGhlIG9wZXJhdGlvbiB0aGlzIGNsaWVudCBpcyByZXN0cmljdGVkIHRvICovXG4gIGdldCBvcCgpIHtcbiAgICByZXR1cm4gdGhpcy4jb3A7XG4gIH1cblxuICAvKipcbiAgICogSW5zcGVjdHMgdGhlIHJlc3BvbnNlIGFuZCByZXR1cm5zIHRoZSByZXNwb25zZSBib2R5IGlmIHRoZSByZXF1ZXN0IHdhcyBzdWNjZXNzZnVsLlxuICAgKiBPdGhlcndpc2UsIGRpc3BhdGNoZXMgdGhlIGVycm9yIHRvIGV2ZW50IGxpc3RlbmVycywgdGhlbiB0aHJvd3Mge0BsaW5rIEVyclJlc3BvbnNlfS5cbiAgICpcbiAgICogQHBhcmFtIHtGZXRjaFJlc3BvbnNlPFQ+fSByZXNwIFRoZSByZXNwb25zZSB0byBjaGVja1xuICAgKiBAcmV0dXJuIHtGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD59IFRoZSByZXNwb25zZSBkYXRhIGNvcnJlc3BvbmRpbmcgdG8gcmVzcG9uc2UgdHlwZSB7QGxpbmsgVH0uXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGFzc2VydE9rPFQ+KHJlc3A6IEZldGNoUmVzcG9uc2U8VD4pOiBQcm9taXNlPEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPj4ge1xuICAgIGlmIChyZXNwLmVycm9yKSB7XG4gICAgICBjb25zdCBlcnJSZXNwID0gcmVzcC5lcnJvciBhcyB1bmtub3duIGFzIEVycm9yUmVzcG9uc2UgfCB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJSZXNwb25zZSh7XG4gICAgICAgIG9wZXJhdGlvbjogdGhpcy5vcCxcbiAgICAgICAgbWVzc2FnZTogZXJyUmVzcD8ubWVzc2FnZSxcbiAgICAgICAgc3RhdHVzVGV4dDogcmVzcC5yZXNwb25zZT8uc3RhdHVzVGV4dCxcbiAgICAgICAgc3RhdHVzOiByZXNwLnJlc3BvbnNlPy5zdGF0dXMsXG4gICAgICAgIHVybDogcmVzcC5yZXNwb25zZT8udXJsLFxuICAgICAgICBlcnJvckNvZGU6IGVyclJlc3A/LmVycm9yX2NvZGUsXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHRoaXMuI2V2ZW50RW1pdHRlci5jbGFzc2lmeUFuZEVtaXRFcnJvcihlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgaWYgKHJlc3AuZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXNwb25zZSBkYXRhIGlzIHVuZGVmaW5lZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3AuZGF0YTtcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIHZhbGlkLWpzZG9jICovXG5cbiAgLyoqXG4gICAqIEludm9rZSBIVFRQIEdFVFxuICAgKi9cbiAgYXN5bmMgZ2V0KFxuICAgIHVybDogUGF0aHNXaXRoPFBhdGhzPE9wPiwgXCJnZXRcIj4sXG4gICAgaW5pdDogRmV0Y2hPcHRpb25zPEZpbHRlcktleXM8UGF0aHM8T3A+W1BhdGhzV2l0aDxQYXRoczxPcD4sIFwiZ2V0XCI+XSwgXCJnZXRcIj4+LFxuICApIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY2xpZW50LmdldCh1cmwsIGluaXQpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIEludm9rZSBIVFRQIFBPU1QgKi9cbiAgYXN5bmMgcG9zdChcbiAgICB1cmw6IFBhdGhzV2l0aDxQYXRoczxPcD4sIFwicG9zdFwiPixcbiAgICBpbml0OiBGZXRjaE9wdGlvbnM8RmlsdGVyS2V5czxQYXRoczxPcD5bUGF0aHNXaXRoPFBhdGhzPE9wPiwgXCJwb3N0XCI+XSwgXCJwb3N0XCI+PixcbiAgKSB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2NsaWVudC5wb3N0KHVybCwgaW5pdCk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiogSW52b2tlIEhUVFAgUEFUQ0ggKi9cbiAgYXN5bmMgcGF0Y2goXG4gICAgdXJsOiBQYXRoc1dpdGg8UGF0aHM8T3A+LCBcInBhdGNoXCI+LFxuICAgIGluaXQ6IEZldGNoT3B0aW9uczxGaWx0ZXJLZXlzPFBhdGhzPE9wPltQYXRoc1dpdGg8UGF0aHM8T3A+LCBcInBhdGNoXCI+XSwgXCJwYXRjaFwiPj4sXG4gICkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNjbGllbnQucGF0Y2godXJsLCBpbml0KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKiBJbnZva2UgSFRUUCBERUxFVEUgKi9cbiAgYXN5bmMgZGVsKFxuICAgIHVybDogUGF0aHNXaXRoPFBhdGhzPE9wPiwgXCJkZWxldGVcIj4sXG4gICAgaW5pdDogRmV0Y2hPcHRpb25zPEZpbHRlcktleXM8UGF0aHM8T3A+W1BhdGhzV2l0aDxQYXRoczxPcD4sIFwiZGVsZXRlXCI+XSwgXCJkZWxldGVcIj4+LFxuICApIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY2xpZW50LmRlbCh1cmwsIGluaXQpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIEludm9rZSBIVFRQIFBVVCAqL1xuICBhc3luYyBwdXQoXG4gICAgdXJsOiBQYXRoc1dpdGg8UGF0aHM8T3A+LCBcInB1dFwiPixcbiAgICBpbml0OiBGZXRjaE9wdGlvbnM8RmlsdGVyS2V5czxQYXRoczxPcD5bUGF0aHNXaXRoPFBhdGhzPE9wPiwgXCJwdXRcIj5dLCBcInB1dFwiPj4sXG4gICkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNjbGllbnQucHV0KHVybCwgaW5pdCk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiBlc2xpbnQtZW5hYmxlIHZhbGlkLWpzZG9jICovXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBIVFRQIGNsaWVudCwgc2V0dGluZyB0aGUgXCJVc2VyLUFnZW50XCIgaGVhZGVyIHRvIHRoaXMgcGFja2FnZSdzIHtuYW1lfUB7dmVyc2lvbn0uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGJhc2VVcmwgVGhlIGJhc2UgVVJMIG9mIHRoZSBjbGllbnQgKGUuZy4sIFwiaHR0cHM6Ly9nYW1tYS5zaWduZXIuY3ViaXN0LmRldlwiKVxuICogQHBhcmFtIHtzdHJpbmd9IGF1dGhUb2tlbiBUaGUgdmFsdWUgdG8gc2VuZCBhcyBcIkF1dGhvcml6YXRpb25cIiBoZWFkZXIuXG4gKiBAcmV0dXJuIHtDbGllbnR9IFRoZSBuZXcgSFRUUCBjbGllbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVIdHRwQ2xpZW50KGJhc2VVcmw6IHN0cmluZywgYXV0aFRva2VuOiBzdHJpbmcpOiBDbGllbnQge1xuICByZXR1cm4gY3JlYXRlQ2xpZW50PHBhdGhzPih7XG4gICAgYmFzZVVybCxcbiAgICBjYWNoZTogXCJuby1zdG9yZVwiLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEF1dGhvcml6YXRpb246IGF1dGhUb2tlbixcbiAgICAgIFtcIlVzZXItQWdlbnRcIl06IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgICAgW1wiWC1DdWJpc3QtVHMtU2RrXCJdOiBgJHtOQU1FfUAke1ZFUlNJT059YCxcbiAgICB9LFxuICB9KTtcbn1cblxuLyoqXG4gKiBDbGllbnQgdG8gdXNlIHRvIHNlbmQgcmVxdWVzdHMgdG8gQ3ViZVNpZ25lciBzZXJ2aWNlc1xuICogd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEN1YmVTaWduZXJBcGkge1xuICByZWFkb25seSAjb3JnSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3Nlc3Npb25NZ3I6IFNpZ25lclNlc3Npb25NYW5hZ2VyO1xuICByZWFkb25seSAjZXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXI7XG5cbiAgLyoqIFVuZGVybHlpbmcgc2Vzc2lvbiBtYW5hZ2VyICovXG4gIGdldCBzZXNzaW9uTWdyKCk6IFNpZ25lclNlc3Npb25NYW5hZ2VyIHtcbiAgICByZXR1cm4gdGhpcy4jc2Vzc2lvbk1ncjtcbiAgfVxuXG4gIC8qKiBUYXJnZXQgZW52aXJvbm1lbnQgKi9cbiAgZ2V0IGVudigpOiBFbnZJbnRlcmZhY2Uge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25NZ3IuZW52O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25NYW5hZ2VyfSBzZXNzaW9uTWdyIFRoZSBzZXNzaW9uIG1hbmFnZXIgdG8gdXNlXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3JnSWQgT3B0aW9uYWwgb3JnYW5pemF0aW9uIElEOyBpZiBvbWl0dGVkLCB1c2VzIHRoZSBvcmcgSUQgZnJvbSB0aGUgc2Vzc2lvbiBtYW5hZ2VyLlxuICAgKi9cbiAgY29uc3RydWN0b3Ioc2Vzc2lvbk1ncjogU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIG9yZ0lkPzogc3RyaW5nKSB7XG4gICAgdGhpcy4jc2Vzc2lvbk1nciA9IHNlc3Npb25NZ3I7XG4gICAgdGhpcy4jZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcihbc2Vzc2lvbk1nci5ldmVudHNdKTtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkID8/IHNlc3Npb25NZ3Iub3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIHVzaW5nIHRoZSBzYW1lIHNlc3Npb24gbWFuYWdlciBidXQgdGFyZ2V0aW5nIGEgZGlmZmVyZW50IG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmdhbml6YXRpb24gSUQuXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJBcGl9IEEgbmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgdXNpbmcgdGhlIHNhbWUgc2Vzc2lvbiBtYW5hZ2VyIGJ1dCB0YXJnZXRpbmcgZGlmZmVyZW50IG9yZ2FuaXphdGlvbi5cbiAgICovXG4gIHdpdGhPcmcob3JnSWQ/OiBzdHJpbmcpOiBDdWJlU2lnbmVyQXBpIHtcbiAgICByZXR1cm4gb3JnSWQgPyBuZXcgQ3ViZVNpZ25lckFwaSh0aGlzLiNzZXNzaW9uTWdyLCBvcmdJZCkgOiB0aGlzO1xuICB9XG5cbiAgLyoqIE9yZyBpZCBvciBuYW1lICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogSFRUUCBjbGllbnQgcmVzdHJpY3RlZCB0byBhIHNpbmdsZSBvcGVyYXRpb24uIFRoZSByZXN0cmljdGlvbiBhcHBsaWVzIG9ubHlcbiAgICogd2hlbiB0eXBlIGNoZWNraW5nLCB0aGUgYWN0dWFsIGNsaWVudCBkb2VzIG5vdCByZXN0cmljdCBhbnl0aGluZyBhdCBydW50aW1lLlxuICAgKlxuICAgKiBAcGFyYW0ge09wfSBvcCBUaGUgb3BlcmF0aW9uIHRvIHJlc3RyaWN0IHRoZSBjbGllbnQgdG9cbiAgICogQHJldHVybiB7UHJvbWlzZTxPcENsaWVudDxPcD4+fSBUaGUgY2xpZW50IHJlc3RyaWN0ZWQgdG8ge0BsaW5rIG9wfVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjbGllbnQ8T3AgZXh0ZW5kcyBrZXlvZiBvcGVyYXRpb25zPihvcDogT3ApOiBQcm9taXNlPE9wQ2xpZW50PE9wPj4ge1xuICAgIGNvbnN0IGZldGNoQ2xpZW50ID0gYXdhaXQgdGhpcy4jc2Vzc2lvbk1nci5jbGllbnQob3ApO1xuICAgIHJldHVybiBuZXcgT3BDbGllbnQob3AsIGZldGNoQ2xpZW50LCB0aGlzLiNldmVudEVtaXR0ZXIpO1xuICB9XG5cbiAgLy8gI3JlZ2lvbiBVU0VSUzogdXNlckdldCwgdXNlclRvdHAoUmVzZXRJbml0fFJlc2V0Q29tcGxldGV8VmVyaWZ5fERlbGV0ZSksIHVzZXJGaWRvKFJlZ2lzdGVySW5pdHxSZWdpc3RlckNvbXBsZXRlfERlbGV0ZSlcblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckluZm8+fSBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICovXG4gIGFzeW5jIHVzZXJHZXQoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIGlmIChgJHt0aGlzLm9yZ0lkfWAgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiYWJvdXRNZUxlZ2FjeVwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL2Fib3V0X21lXCIsIHt9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJhYm91dE1lXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWVcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgZWl0aGVyIGJ5IGNhbGxpbmcge0BsaW5rIFRvdHBDaGFsbGVuZ2UuYW5zd2VyfSAob3JcbiAgICoge0BsaW5rIEN1YmVTaWduZXJBcGkudXNlclRvdHBSZXNldENvbXBsZXRlfSkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpc3N1ZXIgT3B0aW9uYWwgaXNzdWVyOyBkZWZhdWx0cyB0byBcIkN1YmlzdFwiXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBSZXNldEluaXQoXG4gICAgaXNzdWVyPzogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxUb3RwQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IHJlc2V0VG90cEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1c2VyUmVzZXRUb3RwSW5pdFwiKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogaXNzdWVyXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIGlzc3VlcixcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA6IG51bGwsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAodG90cEluZm8pID0+IG5ldyBUb3RwQ2hhbGxlbmdlKHRoaXMsIHRvdHBJbmZvKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShyZXNldFRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHVzZXJUb3RwUmVzZXRJbml0fS4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3RwSWQgLSBUaGUgSUQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIC0gVGhlIFRPVFAgY29kZSB0aGF0IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwUmVzZXRDb21wbGV0ZSh0b3RwSWQ6IHN0cmluZywgY29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1c2VyUmVzZXRUb3RwQ29tcGxldGVcIik7XG4gICAgYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHsgdG90cF9pZDogdG90cElkLCBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgQ3VycmVudCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwVmVyaWZ5KGNvZGU6IHN0cmluZykge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlclZlcmlmeVRvdHBcIik7XG4gICAgYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cC92ZXJpZnlcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBEZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHQpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBkZWxldGVUb3RwRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVzZXJEZWxldGVUb3RwXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IG51bGwsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGRlbGV0ZVRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYWRkaW5nIGEgbmV3IEZJRE8gZGV2aWNlLiBNRkEgbWF5IGJlIHJlcXVpcmVkLiAgVGhpcyByZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCB3aXRoIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIHVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZX1cbiAgICogKGFmdGVyIE1GQSBhcHByb3ZhbHMpLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbmV3IGRldmljZS5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0IHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEFkZEZpZG9DaGFsbGVuZ2U+Pn0gQSBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGluIG9yZGVyIHRvIGNvbXBsZXRlIEZJRE8gcmVnaXN0cmF0aW9uLlxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9SZWdpc3RlckluaXQoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBZGRGaWRvQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IGFkZEZpZG9GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlclJlZ2lzdGVyRmlkb0luaXRcIik7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHsgbmFtZSB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKGMpID0+IG5ldyBBZGRGaWRvQ2hhbGxlbmdlKHRoaXMsIGMpKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGFkZEZpZG9GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCAodmlhIHtAbGluayB1c2VyRmlkb1JlZ2lzdGVySW5pdH0pIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhbGxlbmdlSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqIEBwYXJhbSB7UHVibGljS2V5Q3JlZGVudGlhbH0gY3JlZGVudGlhbCBUaGUgYW5zd2VyIHRvIHRoZSBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGUoY2hhbGxlbmdlSWQ6IHN0cmluZywgY3JlZGVudGlhbDogUHVibGljS2V5Q3JlZGVudGlhbCkge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlclJlZ2lzdGVyRmlkb0NvbXBsZXRlXCIpO1xuICAgIGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWRvSWQgVGhlIElEIG9mIHRoZSBkZXNpcmVkIEZJRE8ga2V5XG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9EZWxldGUoXG4gICAgZmlkb0lkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IGRlbGV0ZUZpZG9GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlckRlbGV0ZUZpZG9cIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvL3tmaWRvX2lkfVwiLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgZmlkb19pZDogZmlkb0lkIH0gfSxcbiAgICAgICAgYm9keTogbnVsbCxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoZGVsZXRlRmlkb0ZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SR1M6IG9yZ0dldCwgb3JnVXBkYXRlXG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm4ge09yZ0luZm99IEluZm9ybWF0aW9uIGFib3V0IHRoZSBvcmdhbml6YXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdHZXQoKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJnZXRPcmdcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7VXBkYXRlT3JnUmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge1VwZGF0ZU9yZ1Jlc3BvbnNlfSBVcGRhdGVkIG9yZyBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIG9yZ1VwZGF0ZShyZXF1ZXN0OiBVcGRhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxVcGRhdGVPcmdSZXNwb25zZT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXBkYXRlT3JnXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHIFVTRVJTOiBvcmdVc2VySW52aXRlLCBvcmdVc2Vyc0xpc3QsIG9yZ1VzZXJDcmVhdGVPaWRjLCBvcmdVc2VyRGVsZXRlT2lkY1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmQgYW4gZW1haWwgaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbWFpbCBFbWFpbCBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZnVsbCBuYW1lIG9mIHRoZSB1c2VyXG4gICAqIEBwYXJhbSB7TWVtYmVyUm9sZX0gcm9sZSBPcHRpb25hbCByb2xlLiBEZWZhdWx0cyB0byBcImFsaWVuXCIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VySW52aXRlKGVtYWlsOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcm9sZT86IE1lbWJlclJvbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImludml0ZVwiKTtcbiAgICBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vaW52aXRlXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lLFxuICAgICAgICByb2xlLFxuICAgICAgICBza2lwX2VtYWlsOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2Vycy5cbiAgICogQHJldHVybiB7VXNlcltdfSBPcmcgdXNlcnMuXG4gICAqL1xuICBhc3luYyBvcmdVc2Vyc0xpc3QoKTogUHJvbWlzZTxVc2VySWRJbmZvW10+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImxpc3RVc2Vyc0luT3JnXCIpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnVzZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqIEBwYXJhbSB7T2lkY0lkZW50aXR5fSBpZGVudGl0eSBUaGUgaWRlbnRpdHkgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZW1haWwgRW1haWwgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0ge0NyZWF0ZU9pZGNVc2VyT3B0aW9uc30gb3B0cyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIG5ldyBPSURDIHVzZXJzXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVXNlciBpZCBvZiB0aGUgbmV3IHVzZXJcbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJDcmVhdGVPaWRjKFxuICAgIGlkZW50aXR5OiBPaWRjSWRlbnRpdHksXG4gICAgZW1haWw6IHN0cmluZyxcbiAgICBvcHRzOiBDcmVhdGVPaWRjVXNlck9wdGlvbnMgPSB7fSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImNyZWF0ZU9pZGNVc2VyXCIpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vdXNlcnNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgaWRlbnRpdHksXG4gICAgICAgIHJvbGU6IG9wdHMubWVtYmVyUm9sZSA/PyBcIkFsaWVuXCIsXG4gICAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgICAgbWZhX3BvbGljeTogb3B0cy5tZmFQb2xpY3kgPz8gbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGEudXNlcl9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyLlxuICAgKiBAcGFyYW0ge09pZGNJZGVudGl0eX0gaWRlbnRpdHkgVGhlIGlkZW50aXR5IG9mIHRoZSBPSURDIHVzZXJcbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJEZWxldGVPaWRjKGlkZW50aXR5OiBPaWRjSWRlbnRpdHkpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImRlbGV0ZU9pZGNVc2VyXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS91c2Vycy9vaWRjXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiBpZGVudGl0eSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIEtFWVM6IGtleUdldCwga2V5VXBkYXRlLCBrZXlEZWxldGUsIGtleXNDcmVhdGUsIGtleXNEZXJpdmUsIGtleXNMaXN0XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm4ge0tleUluZm9BcGl9IFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBrZXlHZXQoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5SW5mb0FwaT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiZ2V0S2V5SW5PcmdcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBrZXlfaWQ6IGtleUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCByb2xlcyBhIGtleSBpcyBpbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7UGFnaW5hdG9yPExpc3RLZXlSb2xlc1Jlc3BvbnNlLCBLZXlJblJvbGVJbmZvPn0gUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgcm9sZXMgYSBrZXkgaXMgaW4uXG4gICAqL1xuICBrZXlSb2xlc0xpc3Qoa2V5SWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RLZXlSb2xlc1Jlc3BvbnNlLCBLZXlJblJvbGVJbmZvPiB7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImxpc3RLZXlSb2xlc1wiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9L3JvbGVzXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgICBxdWVyeSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgbGlzdEZuLFxuICAgICAgKHIpID0+IHIucm9sZXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0ge1VwZGF0ZUtleVJlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvQXBpfSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKi9cbiAgYXN5bmMga2V5VXBkYXRlKGtleUlkOiBzdHJpbmcsIHJlcXVlc3Q6IFVwZGF0ZUtleVJlcXVlc3QpOiBQcm9taXNlPEtleUluZm9BcGk+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVwZGF0ZUtleVwiKTtcbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYSBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCAtIEtleSBpZFxuICAgKi9cbiAgYXN5bmMga2V5RGVsZXRlKGtleUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImRlbGV0ZUtleVwiKTtcbiAgICBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvQXBpW119IFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNDcmVhdGUoa2V5VHlwZTogS2V5VHlwZSwgY291bnQ6IG51bWJlciwgb3duZXJJZD86IHN0cmluZyk6IFByb21pc2U8S2V5SW5mb0FwaVtdPiB7XG4gICAgY29uc3QgY2hhaW5faWQgPSAwOyAvLyBub3QgdXNlZCBhbnltb3JlXG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJjcmVhdGVLZXlcIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNvdW50LFxuICAgICAgICBjaGFpbl9pZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIG93bmVyOiBvd25lcklkIHx8IG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBkYXRhLmtleXM7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgYSBzcGVjaWZpZWQgdHlwZSB1c2luZyBhIHN1cHBsaWVkIGRlcml2YXRpb24gcGF0aCBhbmQgYW4gZXhpc3RpbmcgbG9uZy1saXZlZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBkZXJpdmF0aW9uUGF0aHMgRGVyaXZhdGlvbiBwYXRocyBmcm9tIHdoaWNoIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljSWQgbWF0ZXJpYWxJZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIEByZXR1cm4ge0tleUluZm9BcGlbXX0gVGhlIG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNEZXJpdmUoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLFxuICAgIG1uZW1vbmljSWQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvQXBpW10+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImRlcml2ZUtleVwiKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnB1dChcIi92MC9vcmcve29yZ19pZH0vZGVyaXZlX2tleVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBkZXJpdmF0aW9uX3BhdGg6IGRlcml2YXRpb25QYXRocyxcbiAgICAgICAgbW5lbW9uaWNfaWQ6IG1uZW1vbmljSWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gZGF0YS5rZXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIGtleXMgaW4gdGhlIG9yZy5cbiAgICogQHBhcmFtIHtLZXlUeXBlP30gdHlwZSBPcHRpb25hbCBrZXkgdHlwZSB0byBmaWx0ZXIgbGlzdCBmb3IuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHM/fSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8TGlzdEtleXNSZXNwb25zZSwgS2V5SW5mb0FwaT59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIga2V5cy5cbiAgICovXG4gIGtleXNMaXN0KHR5cGU/OiBLZXlUeXBlLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdEtleXNSZXNwb25zZSwgS2V5SW5mb0FwaT4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJsaXN0S2V5c0luT3JnXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9LFxuICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICBrZXlfdHlwZTogdHlwZSxcbiAgICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFUzogcm9sZUNyZWF0ZSwgcm9sZVJlYWQsIHJvbGVVcGRhdGUsIHJvbGVEZWxldGUsIHJvbGVzTGlzdFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmc/fSBuYW1lIFRoZSBvcHRpb25hbCBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBJRCBvZiB0aGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyByb2xlQ3JlYXRlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiY3JlYXRlUm9sZVwiKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiBuYW1lID8geyBuYW1lIH0gOiB1bmRlZmluZWQsXG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGEucm9sZV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSByb2xlIGJ5IGl0cyBpZCAob3IgbmFtZSkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIGlkIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybiB7Um9sZUluZm99IFRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUdldChyb2xlSWQ6IHN0cmluZyk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImdldFJvbGVcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGEgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0ge1VwZGF0ZVJvbGVSZXF1ZXN0fSByZXF1ZXN0IFRoZSB1cGRhdGUgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxSb2xlSW5mbz59IFRoZSB1cGRhdGVkIHJvbGUgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyByb2xlVXBkYXRlKHJvbGVJZDogc3RyaW5nLCByZXF1ZXN0OiBVcGRhdGVSb2xlUmVxdWVzdCk6IFByb21pc2U8Um9sZUluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVwZGF0ZVJvbGVcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgcm9sZSBieSBpdHMgSUQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHRvIGRlbGV0ZS5cbiAgICovXG4gIGFzeW5jIHJvbGVEZWxldGUocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImRlbGV0ZVJvbGVcIik7XG4gICAgYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCByb2xlcyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtSb2xlSW5mb30gUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciByb2xlcy5cbiAgICovXG4gIHJvbGVzTGlzdChwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdFJvbGVzUmVzcG9uc2UsIFJvbGVJbmZvPiB7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImxpc3RSb2xlc1wiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0sXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLnJvbGVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFIEtFWVM6IHJvbGVLZXlzQWRkLCByb2xlS2V5c0RlbGV0ZSwgcm9sZUtleXNMaXN0XG5cbiAgLyoqXG4gICAqIEFkZCBleGlzdGluZyBrZXlzIHRvIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGtleUlkcyBUaGUgSURzIG9mIHRoZSBrZXlzIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHtLZXlQb2xpY3k/fSBwb2xpY3kgVGhlIG9wdGlvbmFsIHBvbGljeSB0byBhcHBseSB0byBlYWNoIGtleS5cbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzQWRkKHJvbGVJZDogc3RyaW5nLCBrZXlJZHM6IHN0cmluZ1tdLCBwb2xpY3k/OiBLZXlQb2xpY3kpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImFkZEtleXNUb1JvbGVcIik7XG4gICAgYXdhaXQgY2xpZW50LnB1dChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2FkZF9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGtleV9pZHM6IGtleUlkcyxcbiAgICAgICAgcG9saWN5OiAocG9saWN5ID8/IG51bGwpIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIHwgbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIGtleSBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgSUQgb2YgdGhlIGtleSB0byByZW1vdmUgZnJvbSB0aGUgcm9sZVxuICAgKi9cbiAgYXN5bmMgcm9sZUtleXNSZW1vdmUocm9sZUlkOiBzdHJpbmcsIGtleUlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInJlbW92ZUtleUZyb21Sb2xlXCIpO1xuICAgIGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCwga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwga2V5cyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIGtleXMgdG8gcmV0cmlldmUuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1BhZ2luYXRvcjxMaXN0Um9sZUtleXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mbz59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIGtleXMgaW4gdGhlIHJvbGUuXG4gICAqL1xuICByb2xlS2V5c0xpc3Qocm9sZUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0Um9sZUtleXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mbz4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJsaXN0Um9sZUtleXNcIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2tleXNcIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0sXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEUgVVNFUlM6IHJvbGVVc2VyQWRkLCByb2xlVXNlclJlbW92ZSwgcm9sZVVzZXJzTGlzdFxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJBZGQocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJhZGRVc2VyVG9Sb2xlXCIpO1xuICAgIGF3YWl0IGNsaWVudC5wdXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfdXNlci97dXNlcl9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCwgcm9sZV9pZDogcm9sZUlkLCB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyB1c2VyIGZyb20gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIHJlbW92ZSBmcm9tIHRoZSByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJSZW1vdmUocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJyZW1vdmVVc2VyRnJvbVJvbGVcIik7XG4gICAgYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3VzZXJzL3t1c2VyX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIHVzZXJzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8TGlzdFJvbGVVc2Vyc1Jlc3BvbnNlLCBVc2VySW5Sb2xlSW5mbz59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHVzZXJzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZVVzZXJzTGlzdChyb2xlSWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm8+IHtcbiAgICBjb25zdCBsaXN0Rm4gPSBhc3luYyAocXVlcnk6IFBhZ2VRdWVyeUFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibGlzdFJvbGVVc2Vyc1wiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdXNlcnNcIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0sXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLnVzZXJzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBTRVNTSU9OUzogc2Vzc2lvbihDcmVhdGV8Q3JlYXRlRm9yUm9sZXxSZWZyZXNofFJldm9rZXxMaXN0fEtleXNMaXN0KVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZylcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb25MaWZldGltZX0gbGlmZXRpbWVzIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2lnbmVyU2Vzc2lvbkRhdGE+fSBOZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGUoXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3Blczogc3RyaW5nW10sXG4gICAgbGlmZXRpbWVzPzogU2lnbmVyU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25EYXRhPiB7XG4gICAgbGlmZXRpbWVzID8/PSBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lO1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiY3JlYXRlU2Vzc2lvblwiKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcHVycG9zZSxcbiAgICAgICAgc2NvcGVzLFxuICAgICAgICBhdXRoX2xpZmV0aW1lOiBsaWZldGltZXMuYXV0aCxcbiAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWVzLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IGxpZmV0aW1lcy5zZXNzaW9uLFxuICAgICAgICBncmFjZV9saWZldGltZTogbGlmZXRpbWVzLmdyYWNlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgb3JnX2lkOiB0aGlzLm9yZ0lkLFxuICAgICAgcm9sZV9pZDogdW5kZWZpbmVkLFxuICAgICAgcHVycG9zZSxcbiAgICAgIHRva2VuOiBkYXRhLnRva2VuLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBkYXRhLnNlc3Npb25faW5mbyxcbiAgICAgIHNlc3Npb25fZXhwOiBkYXRhLmV4cGlyYXRpb24hLFxuICAgICAgLy8gS2VlcCBjb21wYXRpYmlsaXR5IHdpdGggdG9rZW5zIHByb2R1Y2VkIGJ5IENMSVxuICAgICAgZW52OiB7XG4gICAgICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IHRoaXMuI3Nlc3Npb25NZ3IuZW52LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbiBmb3IgYSBnaXZlbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLiBPbmx5IGBzaWduOipgIHNjb3BlcyBhcmUgYWxsb3dlZC5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTGlmZXRpbWV9IGxpZmV0aW1lcyBMaWZldGltZSBzZXR0aW5nc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25EYXRhPn0gTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlRm9yUm9sZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzPzogc3RyaW5nW10sXG4gICAgbGlmZXRpbWVzPzogU2lnbmVyU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNpZ25lclNlc3Npb25EYXRhPiB7XG4gICAgbGlmZXRpbWVzID8/PSBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lO1xuICAgIGNvbnN0IGludmFsaWRTY29wZXMgPSAoc2NvcGVzIHx8IFtdKS5maWx0ZXIoKHMpID0+ICFzLnN0YXJ0c1dpdGgoXCJzaWduOlwiKSk7XG4gICAgaWYgKGludmFsaWRTY29wZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBSb2xlIHNjb3BlcyBtdXN0IHN0YXJ0IHdpdGggJ3NpZ246JzsgaW52YWxpZCBzY29wZXM6ICR7aW52YWxpZFNjb3Blc31gKTtcbiAgICB9XG5cbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImNyZWF0ZVJvbGVUb2tlblwiKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS90b2tlbnNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBwdXJwb3NlLFxuICAgICAgICBzY29wZXMsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lcy5hdXRoLFxuICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiBsaWZldGltZXMucmVmcmVzaCxcbiAgICAgICAgc2Vzc2lvbl9saWZldGltZTogbGlmZXRpbWVzLnNlc3Npb24sXG4gICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZXMuZ3JhY2UsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgICBwdXJwb3NlLFxuICAgICAgdG9rZW46IGRhdGEudG9rZW4sXG4gICAgICBzZXNzaW9uX2luZm86IGRhdGEuc2Vzc2lvbl9pbmZvLFxuICAgICAgc2Vzc2lvbl9leHA6IGRhdGEuZXhwaXJhdGlvbiEsXG4gICAgICAvLyBLZWVwIGNvbXBhdGliaWxpdHkgd2l0aCB0b2tlbnMgcHJvZHVjZWQgYnkgQ0xJXG4gICAgICBlbnY6IHtcbiAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogdGhpcy4jc2Vzc2lvbk1nci5lbnYsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGEgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlc3Npb25JZCBUaGUgSUQgb2YgdGhlIHNlc3Npb24gdG8gcmV2b2tlLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvblJldm9rZShzZXNzaW9uSWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwicmV2b2tlU2Vzc2lvblwiKTtcbiAgICBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uL3tzZXNzaW9uX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHNlc3Npb25faWQ6IHNlc3Npb25JZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgYWxsIHNpZ25lciBzZXNzaW9ucyBvcHRpb25hbGx5IGZpbHRlcmVkIGJ5IGEgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmc/fSByb2xlSWQgSWYgc2V0LCBsaW1pdCB0byBzZXNzaW9ucyBmb3IgdGhpcyByb2xlIG9ubHkuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHM/fSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25JbmZvW10+fSBTaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS5cbiAgICovXG4gIHNlc3Npb25zTGlzdChyb2xlSWQ/OiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxTZXNzaW9uc1Jlc3BvbnNlLCBTZXNzaW9uSW5mbz4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJsaXN0U2Vzc2lvbnNcIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9LFxuICAgICAgICAgIHF1ZXJ5OiB7IHJvbGU6IHJvbGVJZCwgLi4ucXVlcnkgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgbGlzdEZuLFxuICAgICAgKHIpID0+IHIuc2Vzc2lvbnMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBsaXN0IG9mIGtleXMgdGhhdCB0aGlzIHNlc3Npb24gaGFzIGFjY2VzcyB0by5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBsaXN0IG9mIGtleXMuXG4gICAqL1xuICBhc3luYyBzZXNzaW9uS2V5c0xpc3QoKTogUHJvbWlzZTxLZXlJbmZvQXBpW10+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImxpc3RUb2tlbktleXNcIik7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3Rva2VuL2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5rZXlzO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gSURFTlRJVFk6IGlkZW50aXR5UHJvdmUsIGlkZW50aXR5VmVyaWZ5XG5cbiAgLyoqXG4gICAqIE9idGFpbiBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbiB1c2luZyB0aGUgY3VycmVudCBDdWJlU2lnbmVyIHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBpZGVudGl0eVByb3ZlKCk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiY3JlYXRlUHJvb2ZDdWJlU2lnbmVyXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvcHJvdmVcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBnaXZlbiBpZGVudGl0eSBwcm9vZiBpcyB2YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtJZGVudGl0eVByb29mfSBwcm9vZiBUaGUgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqL1xuICBhc3luYyBpZGVudGl0eVZlcmlmeShwcm9vZjogSWRlbnRpdHlQcm9vZikge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidmVyaWZ5UHJvb2ZcIik7XG4gICAgYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3ZlcmlmeVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogcHJvb2YsXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNRkE6IG1mYUdldCwgbWZhTGlzdCwgbWZhQXBwcm92ZSwgbWZhTGlzdCwgbWZhQXBwcm92ZSwgbWZhQXBwcm92ZVRvdHAsIG1mYUFwcHJvdmVGaWRvKEluaXR8Q29tcGxldGUpXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBleGlzdGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbWZhR2V0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJtZmFHZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIG1mYV9pZDogbWZhSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+fSBUaGUgTUZBIHJlcXVlc3RzLlxuICAgKi9cbiAgYXN5bmMgbWZhTGlzdCgpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcIm1mYUxpc3RcIik7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L21mYVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLm1mYV9yZXF1ZXN0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIHtNZmFWb3RlfSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYVZvdGVDcyhtZmFJZDogc3RyaW5nLCBtZmFWb3RlOiBNZmFWb3RlKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibWZhVm90ZUNzXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIElEIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYVZvdGVUb3RwKG1mYUlkOiBzdHJpbmcsIGNvZGU6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcIm1mYVZvdGVUb3RwXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS90b3RwXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwgb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgRklETy4gQSBjaGFsbGVuZ2UgaXNcbiAgICogcmV0dXJuZWQgd2hpY2ggbXVzdCBiZSBhbnN3ZXJlZCB2aWEge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvciB7QGxpbmsgbWZhQXBwcm92ZUZpZG9Db21wbGV0ZX0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSUQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhRmlkb0NoYWxsZW5nZT59IEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgbWZhRmlkb0luaXQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhRmlkb0NoYWxsZW5nZT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibWZhRmlkb0luaXRcIik7XG4gICAgY29uc3QgY2hhbGxlbmdlID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9maWRvXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBNZmFGaWRvQ2hhbGxlbmdlKHRoaXMsIG1mYUlkLCBjaGFsbGVuZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgbWZhQXBwcm92ZUZpZG9Jbml0fSkgTUZBIHJlcXVlc3QgdXNpbmcgRklETy5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcGFyYW0ge01mYVZvdGV9IG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjaGFsbGVuZ2VJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIG1mYUFwcHJvdmVGaWRvSW5pdH1cbiAgICogQHBhcmFtIHtQdWJsaWNLZXlDcmVkZW50aWFsfSBjcmVkZW50aWFsIFRoZSBhbnN3ZXIgdG8gdGhlIGNoYWxsZW5nZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIG1mYVZvdGVGaWRvQ29tcGxldGUoXG4gICAgbWZhSWQ6IHN0cmluZyxcbiAgICBtZmFWb3RlOiBNZmFWb3RlLFxuICAgIGNoYWxsZW5nZUlkOiBzdHJpbmcsXG4gICAgY3JlZGVudGlhbDogUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibWZhVm90ZUZpZG9Db21wbGV0ZVwiKTtcbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZmlkb1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjaGFsbGVuZ2VfaWQ6IGNoYWxsZW5nZUlkLFxuICAgICAgICBjcmVkZW50aWFsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFNJR046IHNpZ25Fdm0sIHNpZ25FdGgyLCBzaWduU3Rha2UsIHNpZ25VbnN0YWtlLCBzaWduQXZhLCBzaWduQmxvYiwgc2lnbkJ0Yywgc2lnblNvbGFuYVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEVWTSB0cmFuc2FjdGlvbi5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXZtU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxFdm1TaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRXZtU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJldGgxU2lnblwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQucG9zdChcIi92MS9vcmcve29yZ19pZH0vZXRoMS9zaWduL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtMTkxIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXAxOTFTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDE5MShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVpcDE5MVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJlaXAxOTFTaWduXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9ldm0vZWlwMTkxL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC03MTIgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDcxMlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0Jsb2JTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdm1TaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRWlwNzEyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImVpcDcxMlNpZ25cIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2V2bS9laXA3MTIvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBwdWJrZXkgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdmFsaWRhdGlvbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gU2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduRXRoMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiZXRoMlNpZ25cIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIGRlcG9zaXQgKG9yIHN0YWtpbmcpIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7RXRoMlN0YWtlUmVxdWVzdH0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TdGFrZShcbiAgICByZXE6IEV0aDJTdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInN0YWtlXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3N0YWtlXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHVuc3Rha2UvZXhpdCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyVW5zdGFrZVJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdGgyVW5zdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25VbnN0YWtlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyVW5zdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVuc3Rha2VcIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gQXZhbGFuY2hlIFAtIG9yIFgtY2hhaW4gbWVzc2FnZS5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7QXZhVHh9IHR4IEF2YWxhbmNoZSBtZXNzYWdlICh0cmFuc2FjdGlvbikgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxBdmFTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICB0eDogQXZhVHgsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVxID0gPEF2YVNpZ25SZXF1ZXN0PntcbiAgICAgICAgdHg6IHR4IGFzIHVua25vd24sXG4gICAgICB9O1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJhdmFTaWduXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSByYXcgYmxvYi5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LiBUaGlzIGlzIGJlY2F1c2VcbiAgICogc2lnbmluZyBhcmJpdHJhcnkgbWVzc2FnZXMgaXMsIGluIGdlbmVyYWwsIGRhbmdlcm91cyAoYW5kIHlvdSBzaG91bGQgaW5zdGVhZFxuICAgKiBwcmVmZXIgdHlwZWQgZW5kLXBvaW50cyBhcyB1c2VkIGJ5LCBmb3IgZXhhbXBsZSwge0BsaW5rIHNpZ25Fdm19KS4gRm9yIFNlY3AyNTZrMSBrZXlzLFxuICAgKiBmb3IgZXhhbXBsZSwgeW91ICoqbXVzdCoqIGNhbGwgdGhpcyBmdW5jdGlvbiB3aXRoIGEgbWVzc2FnZSB0aGF0IGlzIDMyIGJ5dGVzIGxvbmcgYW5kXG4gICAqIHRoZSBvdXRwdXQgb2YgYSBzZWN1cmUgaGFzaCBmdW5jdGlvbi5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHNpZ25hdHVyZXMgc2VyaWFsaXplZCBhcztcbiAgICpcbiAgICogLSBFQ0RTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGFzIGJpZy1lbmRpYW4gciBhbmQgcyBwbHVzIHJlY292ZXJ5LWlkXG4gICAqICAgIGJ5dGUgdiwgd2hpY2ggY2FuIGluIGdlbmVyYWwgdGFrZSBhbnkgb2YgdGhlIHZhbHVlcyAwLCAxLCAyLCBvciAzLlxuICAgKlxuICAgKiAtIEVkRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgaW4gdGhlIHN0YW5kYXJkIGZvcm1hdC5cbiAgICpcbiAgICogLSBCTFMgc2lnbmF0dXJlcyBhcmUgbm90IHN1cHBvcnRlZCBvbiB0aGUgYmxvYi1zaWduIGVuZHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIElEKS5cbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8QmxvYlNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQmxvYihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJsb2JTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmxvYlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBrZXlfaWQgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5LmlkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiYmxvYlNpZ25cIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBrZXlfaWQgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0J0Y1NpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEJ0Y1NpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQnRjKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQnRjU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJ0Y1NpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJidGNTaWduXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9idGMvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBwdWJrZXkgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTb2xhbmEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7U29sYW5hU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8U29sYW5hU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Tb2xhbmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBTb2xhbmFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U29sYW5hU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInNvbGFuYVNpZ25cIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gVVNFUiBFWFBPUlQ6IHVzZXJFeHBvcnQoSW5pdCxDb21wbGV0ZSxMaXN0LERlbGV0ZSlcbiAgLyoqXG4gICAqIExpc3Qgb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdHMuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30ga2V5SWQgT3B0aW9uYWwga2V5IElELiBJZiBzdXBwbGllZCwgbGlzdCB0aGUgb3V0c3RhbmRpbmcgcmVxdWVzdCAoaWYgYW55KSBvbmx5IGZvciB0aGUgc3BlY2lmaWVkIGtleTsgb3RoZXJ3aXNlLCBsaXN0IGFsbCBvdXRzdGFuZGluZyByZXF1ZXN0cyBmb3IgdGhlIHNwZWNpZmllZCB1c2VyLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IHVzZXJJZCBPcHRpb25hbCB1c2VyIElELiBJZiBvbXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGxpc3QgdXNlci1leHBvcnQgcmVxdWVzdHMgZm9yIHVzZXJzIG90aGVyIHRoYW4gdGhlbXNlbHZlcy5cbiAgICogQHBhcmFtIHtQYWdlT3B0cz99IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1BhZ2luYXRvcjxVc2VyRXhwb3J0TGlzdFJlc3BvbnNlLCBVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPn0gUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgcmVzdWx0IHNldC5cbiAgICovXG4gIHVzZXJFeHBvcnRMaXN0KFxuICAgIGtleUlkPzogc3RyaW5nLFxuICAgIHVzZXJJZD86IHN0cmluZyxcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICk6IFBhZ2luYXRvcjxVc2VyRXhwb3J0TGlzdFJlc3BvbnNlLCBVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPiB7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVzZXJFeHBvcnRMaXN0XCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSxcbiAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLmV4cG9ydF9yZXF1ZXN0cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGtleS1pZCBjb3JyZXNwb25kaW5nIHRvIHRoZSB1c2VyLWV4cG9ydCByZXF1ZXN0IHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSB1c2VySWQgT3B0aW9uYWwgdXNlciBJRC4gSWYgb21pdHRlZCwgdXNlcyB0aGUgY3VycmVudCB1c2VyJ3MgSUQuIE9ubHkgb3JnIG93bmVycyBjYW4gZGVsZXRlIHVzZXItZXhwb3J0IHJlcXVlc3RzIGZvciB1c2VycyBvdGhlciB0aGFuIHRoZW1zZWx2ZXMuXG4gICAqL1xuICBhc3luYyB1c2VyRXhwb3J0RGVsZXRlKGtleUlkOiBzdHJpbmcsIHVzZXJJZD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlckV4cG9ydERlbGV0ZVwiKTtcbiAgICBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSxcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckV4cG9ydEluaXRSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1c2VyRXhwb3J0SW5pdChcbiAgICBrZXlJZDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGluaXRGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlckV4cG9ydEluaXRcIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogeyBrZXlfaWQ6IGtleUlkIH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGluaXRGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0ge0NyeXB0b0tleX0gcHVibGljS2V5IFRoZSBOSVNUIFAtMjU2IHB1YmxpYyBrZXkgdG8gd2hpY2ggdGhlIGV4cG9ydCB3aWxsIGJlIGVuY3J5cHRlZC4gVGhpcyBzaG91bGQgYmUgdGhlIGBwdWJsaWNLZXlgIHByb3BlcnR5IG9mIGEgdmFsdWUgcmV0dXJuZWQgYnkgYHVzZXJFeHBvcnRLZXlnZW5gLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydENvbXBsZXRlKFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgcHVibGljS2V5OiBDcnlwdG9LZXksXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlPj4ge1xuICAgIC8vIGJhc2U2NC1lbmNvZGUgdGhlIHB1YmxpYyBrZXlcbiAgICBjb25zdCBzdWJ0bGUgPSBhd2FpdCBsb2FkU3VidGxlQ3J5cHRvKCk7XG4gICAgY29uc3QgcHVibGljS2V5QjY0ID0gZW5jb2RlVG9CYXNlNjQoQnVmZmVyLmZyb20oYXdhaXQgc3VidGxlLmV4cG9ydEtleShcInJhd1wiLCBwdWJsaWNLZXkpKSk7XG5cbiAgICAvLyBtYWtlIHRoZSByZXF1ZXN0XG4gICAgY29uc3QgY29tcGxldGVGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlckV4cG9ydENvbXBsZXRlXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9leHBvcnRcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICBwdWJsaWNfa2V5OiBwdWJsaWNLZXlCNjQsXG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGNvbXBsZXRlRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE1JU0M6IGhlYXJ0YmVhdCgpXG4gIC8qKlxuICAgKiBTZW5kIGEgaGVhcnRiZWF0IC8gdXBjaGVjayByZXF1ZXN0LlxuICAgKlxuICAgKiBAcmV0dXJuIHsgUHJvbWlzZTx2b2lkPiB9IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIGhlYXJ0YmVhdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImN1YmUzc2lnbmVySGVhcnRiZWF0XCIpO1xuICAgIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9jdWJlM3NpZ25lci9oZWFydGJlYXRcIiwge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG4gIC8vICNlbmRyZWdpb25cbn1cblxuLyoqXG4gKiBDbGllbnQgdG8gdXNlIHRvIHNlbmQgcmVxdWVzdHMgdG8gQ3ViZVNpZ25lciBzZXJ2aWNlc1xuICogd2hlbiBhdXRoZW50aWNhdGluZyB1c2luZyBhbiBPSURDIHRva2VuLlxuICovXG5leHBvcnQgY2xhc3MgT2lkY0NsaWVudCB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZTtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNjbGllbnQ6IENsaWVudDtcblxuICAvKipcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBDdWJlU2lnbmVyIGRlcGxveW1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRhcmdldCBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBVc2VyJ3MgT0lEQyB0b2tlblxuICAgKi9cbiAgY29uc3RydWN0b3IoZW52OiBFbnZJbnRlcmZhY2UsIG9yZ0lkOiBzdHJpbmcsIG9pZGNUb2tlbjogc3RyaW5nKSB7XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNlbnYgPSBlbnY7XG4gICAgdGhpcy4jY2xpZW50ID0gY3JlYXRlSHR0cENsaWVudChlbnYuU2lnbmVyQXBpUm9vdCwgb2lkY1Rva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIVFRQIGNsaWVudCByZXN0cmljdGVkIHRvIGEgc2luZ2xlIG9wZXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtPcH0gb3AgVGhlIG9wZXJhdGlvbiB0byByZXN0cmljdCB0aGUgY2xpZW50IHRvXG4gICAqIEByZXR1cm4ge09wQ2xpZW50PE9wPn0gVGhlIGNsaWVudCByZXN0cmljdGVkIHRvIHtAbGluayBvcH1cbiAgICovXG4gIHByaXZhdGUgY2xpZW50PE9wIGV4dGVuZHMga2V5b2Ygb3BlcmF0aW9ucz4ob3A6IE9wKTogT3BDbGllbnQ8T3A+IHtcbiAgICByZXR1cm4gbmV3IE9wQ2xpZW50KG9wLCB0aGlzLiNjbGllbnQsIG5ldyBFdmVudEVtaXR0ZXIoW10pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIEN1YmVTaWduZXIgc2Vzc2lvbiB0b2tlbi5cbiAgICogQHBhcmFtIHtMaXN0PHN0cmluZz59IHNjb3BlcyBUaGUgc2NvcGVzIGZvciB0aGUgbmV3IHNlc3Npb25cbiAgICogQHBhcmFtIHtSYXRjaGV0Q29uZmlnfSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0IChpZCArIGNvbmZpcm1hdGlvbiBjb2RlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTaWduZXJTZXNzaW9uRGF0YT4+fSBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkNyZWF0ZShcbiAgICBzY29wZXM6IEFycmF5PHN0cmluZz4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2lnbmVyU2Vzc2lvbkRhdGE+PiB7XG4gICAgY29uc3QgbG9naW5GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY2xpZW50KFwib2lkY0F1dGhcIik7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICB0b2tlbnM6IGxpZmV0aW1lcyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKFxuICAgICAgICBkYXRhLFxuICAgICAgICAoc2Vzc2lvbkluZm8pID0+XG4gICAgICAgICAgPFNpZ25lclNlc3Npb25EYXRhPntcbiAgICAgICAgICAgIGVudjoge1xuICAgICAgICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiB0aGlzLiNlbnYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3JnX2lkOiB0aGlzLiNvcmdJZCxcbiAgICAgICAgICAgIHRva2VuOiBzZXNzaW9uSW5mby50b2tlbixcbiAgICAgICAgICAgIHB1cnBvc2U6IFwic2lnbiB2aWEgb2lkY1wiLFxuICAgICAgICAgICAgc2Vzc2lvbl9pbmZvOiBzZXNzaW9uSW5mby5zZXNzaW9uX2luZm8sXG4gICAgICAgICAgfSxcbiAgICAgICk7XG4gICAgfTtcblxuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGxvZ2luRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8SWRlbnRpdHlQcm9vZj59IFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBhc3luYyBpZGVudGl0eVByb3ZlKCk6IFByb21pc2U8SWRlbnRpdHlQcm9vZj4ge1xuICAgIGNvbnN0IGNsaWVudCA9IHRoaXMuY2xpZW50KFwiY3JlYXRlUHJvb2ZPaWRjXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvcHJvdmUvb2lkY1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkIH0gfSxcbiAgICB9KTtcbiAgfVxufVxuXG5jb25zdCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lOiBTaWduZXJTZXNzaW9uTGlmZXRpbWUgPSB7XG4gIHNlc3Npb246IDYwNDgwMCwgLy8gMSB3ZWVrXG4gIGF1dGg6IDMwMCwgLy8gNSBtaW5cbiAgcmVmcmVzaDogODY0MDAsIC8vIDEgZGF5XG4gIGdyYWNlOiAzMCwgLy8gc2Vjb25kc1xufTtcbiJdfQ==