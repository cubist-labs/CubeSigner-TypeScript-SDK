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
var _OpClient_op, _OpClient_client, _OpClient_eventEmitter, _OpClient_retry, _CubeSignerApi_orgId, _CubeSignerApi_sessionMgr, _CubeSignerApi_eventEmitter, _CubeSignerApi_retrySettings, _OidcClient_env, _OidcClient_orgId, _OidcClient_client, _OidcClient_retrySettings;
import createClient from "openapi-fetch";
import { delay, encodeToBase64 } from "./util";
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
     * @param {number[]} retrySettings Retry settings. By default, retries 3 times, sleeping 100ms
     *  after the first failed attempt, 200ms after the second, and finally 400ms after the third,
     */
    constructor(op, client, eventEmitter, retrySettings) {
        _OpClient_op.set(this, void 0);
        _OpClient_client.set(this, void 0);
        _OpClient_eventEmitter.set(this, void 0);
        _OpClient_retry.set(this, void 0);
        __classPrivateFieldSet(this, _OpClient_op, op, "f");
        __classPrivateFieldSet(this, _OpClient_client, client, "f"); // either works
        __classPrivateFieldSet(this, _OpClient_eventEmitter, eventEmitter, "f");
        __classPrivateFieldSet(this, _OpClient_retry, retrySettings ?? {
            codes: [...Array(100).keys()].map((i) => 500 + i),
            delaysMs: [100, 200, 400],
        }, "f");
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
                requestId: errResp?.request_id,
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
    /**
     * @param {number[]} delaysMs Delays in milliseconds between retries.
     * @return {OpClient<Op>} Returns the same client as this except with different retry delays.
     */
    withRetries(delaysMs) {
        return this.withRetrySettings({
            codes: __classPrivateFieldGet(this, _OpClient_retry, "f").codes,
            delaysMs,
        });
    }
    /**
     * @param {RetrySettings} retrySettings New retry settings
     * @return {OpClient<Op>} Returns the same client as this except with different retry settings.
     */
    withRetrySettings(retrySettings) {
        return new OpClient(this.op, __classPrivateFieldGet(this, _OpClient_client, "f"), __classPrivateFieldGet(this, _OpClient_eventEmitter, "f"), retrySettings);
    }
    // not private only so that the test can call it
    /**
     * Internal.
     *
     * Executes a given request, potentially retrying on 5xx errors. The
     * retry configuration can be set via the constructor.
     * On all other errors, throws {@link ErrResponse} (as well as after exhausting all retries).
     * On success, returns the response body.
     *
     * @param {ReqFn<T>} req The request to execute and then retry on 5xx errors
     * @return {Promise<FetchResponseSuccessData<T>>}
     * @internal
     */
    async execute(req) {
        let resp = await req();
        let i = 0;
        while (__classPrivateFieldGet(this, _OpClient_retry, "f").codes.includes(resp.response?.status) && i < __classPrivateFieldGet(this, _OpClient_retry, "f").delaysMs.length) {
            await delay(__classPrivateFieldGet(this, _OpClient_retry, "f").delaysMs[i]);
            resp = await req();
            i++;
        }
        return await this.assertOk(resp);
    }
    /* eslint-disable valid-jsdoc */
    /**
     * Invoke HTTP GET
     */
    async get(url, init) {
        return await this.execute(() => __classPrivateFieldGet(this, _OpClient_client, "f").get(url, init));
    }
    /** Invoke HTTP POST */
    async post(url, init) {
        return await this.execute(() => __classPrivateFieldGet(this, _OpClient_client, "f").post(url, init));
    }
    /** Invoke HTTP PATCH */
    async patch(url, init) {
        return await this.execute(() => __classPrivateFieldGet(this, _OpClient_client, "f").patch(url, init));
    }
    /** Invoke HTTP DELETE */
    async del(url, init) {
        return await this.execute(() => __classPrivateFieldGet(this, _OpClient_client, "f").del(url, init));
    }
    /** Invoke HTTP PUT */
    async put(url, init) {
        return await this.execute(() => __classPrivateFieldGet(this, _OpClient_client, "f").put(url, init));
    }
}
_OpClient_op = new WeakMap(), _OpClient_client = new WeakMap(), _OpClient_eventEmitter = new WeakMap(), _OpClient_retry = new WeakMap();
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
     * @param {RetrySettings} retrySettings Retry settings. By default, retries 3 times, sleeping 100ms
     *   after the first failed attempt, 200ms after the second, and finally 400ms after the third,
     */
    constructor(sessionMgr, orgId, retrySettings) {
        _CubeSignerApi_orgId.set(this, void 0);
        _CubeSignerApi_sessionMgr.set(this, void 0);
        _CubeSignerApi_eventEmitter.set(this, void 0);
        _CubeSignerApi_retrySettings.set(this, void 0);
        __classPrivateFieldSet(this, _CubeSignerApi_sessionMgr, sessionMgr, "f");
        __classPrivateFieldSet(this, _CubeSignerApi_eventEmitter, new EventEmitter([sessionMgr.events]), "f");
        __classPrivateFieldSet(this, _CubeSignerApi_orgId, orgId ?? sessionMgr.orgId, "f");
        __classPrivateFieldSet(this, _CubeSignerApi_retrySettings, retrySettings, "f");
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
        return new OpClient(op, fetchClient, __classPrivateFieldGet(this, _CubeSignerApi_eventEmitter, "f"), __classPrivateFieldGet(this, _CubeSignerApi_retrySettings, "f"));
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
                email,
                name: opts.name,
                mfa_policy: opts.mfaPolicy,
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
     * @param {KeyProperties?} props Additional key properties
     * @return {KeyInfoApi[]} The new keys.
     */
    async keysCreate(keyType, count, ownerId, props) {
        const chain_id = 0; // not used anymore
        const client = await this.client("createKey");
        const data = await client.post("/v0/org/{org_id}/keys", {
            params: { path: { org_id: this.orgId } },
            body: {
                count,
                chain_id,
                key_type: keyType,
                ...props,
                owner: props?.owner ?? ownerId,
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
_CubeSignerApi_orgId = new WeakMap(), _CubeSignerApi_sessionMgr = new WeakMap(), _CubeSignerApi_eventEmitter = new WeakMap(), _CubeSignerApi_retrySettings = new WeakMap();
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using an OIDC token.
 */
export class OidcClient {
    /**
     * @param {EnvInterface} env CubeSigner deployment
     * @param {string} orgId Target organization ID
     * @param {string} oidcToken User's OIDC token
     * @param {RetrySettings} retrySettings Retry settings. By default, retries 3 times, sleeping 100ms
     *  after the first failed attempt, 200ms after the second, and finally 400ms after the third.
     */
    constructor(env, orgId, oidcToken, retrySettings) {
        _OidcClient_env.set(this, void 0);
        _OidcClient_orgId.set(this, void 0);
        _OidcClient_client.set(this, void 0);
        _OidcClient_retrySettings.set(this, void 0);
        __classPrivateFieldSet(this, _OidcClient_orgId, orgId, "f");
        __classPrivateFieldSet(this, _OidcClient_env, env, "f");
        __classPrivateFieldSet(this, _OidcClient_client, createHttpClient(env.SignerApiRoot, oidcToken), "f");
        __classPrivateFieldSet(this, _OidcClient_retrySettings, retrySettings, "f");
    }
    /**
     * HTTP client restricted to a single operation.
     *
     * @param {Op} op The operation to restrict the client to
     * @return {OpClient<Op>} The client restricted to {@link op}
     */
    client(op) {
        return new OpClient(op, __classPrivateFieldGet(this, _OidcClient_client, "f"), new EventEmitter([]), __classPrivateFieldGet(this, _OidcClient_retrySettings, "f"));
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
_OidcClient_env = new WeakMap(), _OidcClient_orgId = new WeakMap(), _OidcClient_client = new WeakMap(), _OidcClient_retrySettings = new WeakMap();
const defaultSignerSessionLifetime = {
    session: 604800, // 1 week
    auth: 300, // 5 min
    refresh: 86400, // 1 day
    grace: 30, // seconds
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2FwaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxPQUFPLFlBTU4sTUFBTSxlQUFlLENBQUM7QUE0RHZCLE9BQU8sRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQy9DLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBYyxhQUFhLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDdEYsT0FBTyxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUM3RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRXRDLE9BQU8sRUFBRSxJQUFJLEVBQTJCLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd2RSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDakQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUN4QyxPQUFPLEVBQUUsSUFBSSxFQUFpQixPQUFPLEVBQUUsTUFBTSxTQUFTLENBQUM7QUE2RHZEOzs7OztHQUtHO0FBQ0gsTUFBTSxPQUFPLFFBQVE7SUFNbkI7Ozs7OztPQU1HO0lBQ0gsWUFDRSxFQUFNLEVBQ04sTUFBZ0MsRUFDaEMsWUFBMEIsRUFDMUIsYUFBNkI7UUFoQnRCLCtCQUFRO1FBQ1IsbUNBQXlCO1FBQ3pCLHlDQUE0QjtRQUM1QixrQ0FBc0I7UUFlN0IsdUJBQUEsSUFBSSxnQkFBTyxFQUFFLE1BQUEsQ0FBQztRQUNkLHVCQUFBLElBQUksb0JBQVcsTUFBeUIsTUFBQSxDQUFDLENBQUMsZUFBZTtRQUN6RCx1QkFBQSxJQUFJLDBCQUFpQixZQUFZLE1BQUEsQ0FBQztRQUNsQyx1QkFBQSxJQUFJLG1CQUFVLGFBQWEsSUFBSTtZQUM3QixLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMs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QUM7Q0FDRjs7QUFFRCxNQUFNLDRCQUE0QixHQUEwQjtJQUMxRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVM7SUFDMUIsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRO0lBQ25CLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUTtJQUN4QixLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVU7Q0FDdEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjcmVhdGVDbGllbnQsIHtcbiAgRmV0Y2hPcHRpb25zLFxuICBGZXRjaFJlc3BvbnNlLFxuICBGaWx0ZXJLZXlzLFxuICBIdHRwTWV0aG9kLFxuICBQYXRoc1dpdGgsXG59IGZyb20gXCJvcGVuYXBpLWZldGNoXCI7XG5pbXBvcnQgeyBwYXRocywgb3BlcmF0aW9ucyB9IGZyb20gXCIuL3NjaGVtYVwiO1xuaW1wb3J0IHtcbiAgU2lnbmVyU2Vzc2lvbkRhdGEsXG4gIFNpZ25lclNlc3Npb25MaWZldGltZSxcbiAgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsXG59IGZyb20gXCIuL3Nlc3Npb24vc2lnbmVyX3Nlc3Npb25fbWFuYWdlclwiO1xuaW1wb3J0IHtcbiAgQ3JlYXRlT2lkY1VzZXJPcHRpb25zLFxuICBJZGVudGl0eVByb29mLFxuICBLZXlJblJvbGVJbmZvLFxuICBLZXlJbmZvQXBpLFxuICBMaXN0S2V5c1Jlc3BvbnNlLFxuICBMaXN0S2V5Um9sZXNSZXNwb25zZSxcbiAgTGlzdFJvbGVLZXlzUmVzcG9uc2UsXG4gIExpc3RSb2xlVXNlcnNSZXNwb25zZSxcbiAgTGlzdFJvbGVzUmVzcG9uc2UsXG4gIE9pZGNJZGVudGl0eSxcbiAgU2Vzc2lvbnNSZXNwb25zZSxcbiAgUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgUm9sZUluZm8sXG4gIFVwZGF0ZUtleVJlcXVlc3QsXG4gIFVwZGF0ZU9yZ1JlcXVlc3QsXG4gIFVwZGF0ZU9yZ1Jlc3BvbnNlLFxuICBVcGRhdGVSb2xlUmVxdWVzdCxcbiAgVXNlckluT3JnSW5mbyxcbiAgVXNlckluUm9sZUluZm8sXG4gIFVzZXJJbmZvLFxuICBTZXNzaW9uSW5mbyxcbiAgT3JnSW5mbyxcbiAgUmF0Y2hldENvbmZpZyxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFaXAxOTFPcjcxMlNpZ25SZXNwb25zZSxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgRXRoMlNpZ25SZXF1ZXN0LFxuICBFdGgyU2lnblJlc3BvbnNlLFxuICBFdGgyU3Rha2VSZXF1ZXN0LFxuICBFdGgyU3Rha2VSZXNwb25zZSxcbiAgRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICBFdGgyVW5zdGFrZVJlc3BvbnNlLFxuICBCbG9iU2lnblJlcXVlc3QsXG4gIEJsb2JTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXNwb25zZSxcbiAgQnRjU2lnblJlcXVlc3QsXG4gIFNvbGFuYVNpZ25SZXF1ZXN0LFxuICBTb2xhbmFTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXNwb25zZSxcbiAgQXZhU2lnblJlcXVlc3QsXG4gIEF2YVR4LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgTWZhVm90ZSxcbiAgTWVtYmVyUm9sZSxcbiAgVXNlckV4cG9ydENvbXBsZXRlUmVzcG9uc2UsXG4gIFVzZXJFeHBvcnRJbml0UmVzcG9uc2UsXG4gIFVzZXJFeHBvcnRMaXN0UmVzcG9uc2UsXG4gIEVtcHR5LFxuICBFcnJvclJlc3BvbnNlLFxufSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IGRlbGF5LCBlbmNvZGVUb0Jhc2U2NCB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB7IEFkZEZpZG9DaGFsbGVuZ2UsIE1mYUZpZG9DaGFsbGVuZ2UsIE1mYVJlY2VpcHQsIFRvdHBDaGFsbGVuZ2UgfSBmcm9tIFwiLi9tZmFcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJSZXNwb25zZSwgbWFwUmVzcG9uc2UgfSBmcm9tIFwiLi9yZXNwb25zZVwiO1xuaW1wb3J0IHsgRXJyUmVzcG9uc2UgfSBmcm9tIFwiLi9lcnJvclwiO1xuaW1wb3J0IHsgS2V5LCBLZXlUeXBlIH0gZnJvbSBcIi4va2V5XCI7XG5pbXBvcnQgeyBQYWdlLCBQYWdlT3B0cywgUGFnZVF1ZXJ5QXJncywgUGFnaW5hdG9yIH0gZnJvbSBcIi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgeyBLZXlQb2xpY3kgfSBmcm9tIFwiLi9yb2xlXCI7XG5pbXBvcnQgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi9lbnZcIjtcbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiLi91c2VyX2V4cG9ydFwiO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBOQU1FLCBLZXlQcm9wZXJ0aWVzLCBWRVJTSU9OIH0gZnJvbSBcIi4vaW5kZXhcIjtcblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IHR5cGUgQ2xpZW50ID0gUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlQ2xpZW50PHBhdGhzPj47XG5cbmV4cG9ydCB7IHBhdGhzLCBvcGVyYXRpb25zIH07XG5cbi8qKlxuICogT21pdCByb3V0ZXMgaW4ge0BsaW5rIFR9IHdob3NlIG1ldGhvZHMgYXJlIGFsbCAnbmV2ZXInXG4gKi9cbnR5cGUgT21pdE5ldmVyUGF0aHM8VCBleHRlbmRzIHBhdGhzPiA9IHtcbiAgLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzICovIC8vICdtJywgYnV0IGl0J3MgbmVlZGVkXG4gIFtwIGluIGtleW9mIFQgYXMgVFtwXSBleHRlbmRzIHsgW20gaW4ga2V5b2YgVFtwXV06IG5ldmVyIH0gPyBuZXZlciA6IHBdOiBUW3BdO1xufTtcblxuLyoqXG4gKiBGaWx0ZXIgb3V0IG1ldGhvZHMgdGhhdCBkb24ndCBtYXRjaCBvcGVyYXRpb24ge0BsaW5rIE9wfVxuICovXG50eXBlIEZpbHRlclBhdGhzPE9wIGV4dGVuZHMga2V5b2Ygb3BlcmF0aW9ucz4gPSB7XG4gIFtwIGluIGtleW9mIHBhdGhzXToge1xuICAgIFttIGluIEh0dHBNZXRob2QgYXMgbSBleHRlbmRzIGtleW9mIHBhdGhzW3BdID8gbSA6IG5ldmVyXTogbSBleHRlbmRzIGtleW9mIHBhdGhzW3BdXG4gICAgICA/IG9wZXJhdGlvbnNbT3BdIGV4dGVuZHMgcGF0aHNbcF1bbV1cbiAgICAgICAgPyBwYXRoc1twXVttXSBleHRlbmRzIG9wZXJhdGlvbnNbT3BdXG4gICAgICAgICAgPyBvcGVyYXRpb25zW09wXVxuICAgICAgICAgIDogbmV2ZXJcbiAgICAgICAgOiBuZXZlclxuICAgICAgOiBuZXZlcjtcbiAgfTtcbn07XG5cbnR5cGUgUGF0aHM8T3AgZXh0ZW5kcyBrZXlvZiBvcGVyYXRpb25zPiA9IE9taXROZXZlclBhdGhzPEZpbHRlclBhdGhzPE9wPj47XG5cbi8qKlxuICogT3Blbi1mZXRjaCBjbGllbnQgcmVzdHJpY3RlZCB0byB0aGUgcm91dGUgdGhhdCBjb3JyZXNwb25kcyB0byBvcGVyYXRpb24ge0BsaW5rIE9wfVxuICovXG5leHBvcnQgdHlwZSBGZXRjaENsaWVudDxPcCBleHRlbmRzIGtleW9mIG9wZXJhdGlvbnM+ID0gUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlQ2xpZW50PFBhdGhzPE9wPj4+O1xuXG4vKipcbiAqIFR5cGUgYWxpYXMgZm9yIHRoZSB0eXBlIG9mIHRoZSByZXNwb25zZSBib2R5ICh0aGUgXCJkYXRhXCIgZmllbGQgb2ZcbiAqIHtAbGluayBGZXRjaFJlc3BvbnNlPFQ+fSkgd2hlbiB0aGF0IHJlc3BvbnNlIGlzIHN1Y2Nlc3NmdWwuXG4gKi9cbmV4cG9ydCB0eXBlIEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPiA9IFJlcXVpcmVkPEZldGNoUmVzcG9uc2U8VD4+W1wiZGF0YVwiXTtcblxuLyoqXG4gKiBJbnRlcm5hbCB0eXBlIGZvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2Ugb2YgYSBmZXRjaCByZXNwb25zZS5cbiAqL1xudHlwZSBSZXFGbjxUPiA9ICgpID0+IFByb21pc2U8RmV0Y2hSZXNwb25zZTxUPj47XG5cbi8qKlxuICogUmV0cnkgc2V0dGluZ3MuXG4gKlxuICogQnkgZGVmYXVsdCwge0BsaW5rIE9wQ2xpZW50fSByZXRyaWVzIG9uIDV4eCBjb2RlcyB3aXRoIGRlbGF5cyBvZlxuICogMTAwbXMsIDIwMG1zLCBhbmQgNDAwbXMgYmV0d2VlbiByZXRyaWVzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFJldHJ5U2V0dGluZ3Mge1xuICAvKiogSFRUUCBzdGF0dXMgY29kZXMgb24gd2hpY2ggdG8gcmV0cnkgKi9cbiAgY29kZXM6IG51bWJlcltdO1xuICAvKiogRGVsYXlzIGluIG1pbGxpc2Vjb25kcyBiZXR3ZWVuIHJldHJpZXMgKi9cbiAgZGVsYXlzTXM6IG51bWJlcltdO1xufVxuXG4vKipcbiAqIFdyYXBwZXIgYXJvdW5kIGFuIG9wZW4tZmV0Y2ggY2xpZW50IHJlc3RyaWN0ZWQgdG8gYSBzaW5nbGUgb3BlcmF0aW9uLlxuICogVGhlIHJlc3RyaWN0aW9uIGFwcGxpZXMgb25seSB3aGVuIHR5cGUgY2hlY2tpbmcsIHRoZSBhY3R1YWxcbiAqIGNsaWVudCBkb2VzIG5vdCByZXN0cmljdCBhbnl0aGluZyBhdCBydW50aW1lLlxuICogY2xpZW50IGRvZXMgbm90IHJlc3RyaWN0IGFueXRoaW5nIGF0IHJ1bnRpbWVcbiAqL1xuZXhwb3J0IGNsYXNzIE9wQ2xpZW50PE9wIGV4dGVuZHMga2V5b2Ygb3BlcmF0aW9ucz4ge1xuICByZWFkb25seSAjb3A6IE9wO1xuICByZWFkb25seSAjY2xpZW50OiBGZXRjaENsaWVudDxPcD47XG4gIHJlYWRvbmx5ICNldmVudEVtaXR0ZXI6IEV2ZW50RW1pdHRlcjtcbiAgcmVhZG9ubHkgI3JldHJ5OiBSZXRyeVNldHRpbmdzO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09wfSBvcCBUaGUgb3BlcmF0aW9uIHRoaXMgY2xpZW50IHNob3VsZCBiZSByZXN0cmljdGVkIHRvXG4gICAqIEBwYXJhbSB7RmV0Y2hDbGllbnQ8T3A+IHwgQ2xpZW50fSBjbGllbnQgb3Blbi1mZXRjaCBjbGllbnQgKGVpdGhlciByZXN0cmljdGVkIHRvIHtAbGluayBPcH0gb3Igbm90KVxuICAgKiBAcGFyYW0ge0V2ZW50RW1pdHRlcn0gZXZlbnRFbWl0dGVyIFRoZSBjbGllbnQtbG9jYWwgZXZlbnQgZGlzcGF0Y2hlci5cbiAgICogQHBhcmFtIHtudW1iZXJbXX0gcmV0cnlTZXR0aW5ncyBSZXRyeSBzZXR0aW5ncy4gQnkgZGVmYXVsdCwgcmV0cmllcyAzIHRpbWVzLCBzbGVlcGluZyAxMDBtc1xuICAgKiAgYWZ0ZXIgdGhlIGZpcnN0IGZhaWxlZCBhdHRlbXB0LCAyMDBtcyBhZnRlciB0aGUgc2Vjb25kLCBhbmQgZmluYWxseSA0MDBtcyBhZnRlciB0aGUgdGhpcmQsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBvcDogT3AsXG4gICAgY2xpZW50OiBGZXRjaENsaWVudDxPcD4gfCBDbGllbnQsXG4gICAgZXZlbnRFbWl0dGVyOiBFdmVudEVtaXR0ZXIsXG4gICAgcmV0cnlTZXR0aW5ncz86IFJldHJ5U2V0dGluZ3MsXG4gICkge1xuICAgIHRoaXMuI29wID0gb3A7XG4gICAgdGhpcy4jY2xpZW50ID0gY2xpZW50IGFzIEZldGNoQ2xpZW50PE9wPjsgLy8gZWl0aGVyIHdvcmtzXG4gICAgdGhpcy4jZXZlbnRFbWl0dGVyID0gZXZlbnRFbWl0dGVyO1xuICAgIHRoaXMuI3JldHJ5ID0gcmV0cnlTZXR0aW5ncyA/PyB7XG4gICAgICBjb2RlczogWy4uLkFycmF5KDEwMCkua2V5cygpXS5tYXAoKGkpID0+IDUwMCArIGkpLFxuICAgICAgZGVsYXlzTXM6IFsxMDAsIDIwMCwgNDAwXSxcbiAgICB9O1xuICB9XG5cbiAgLyoqIFRoZSBvcGVyYXRpb24gdGhpcyBjbGllbnQgaXMgcmVzdHJpY3RlZCB0byAqL1xuICBnZXQgb3AoKSB7XG4gICAgcmV0dXJuIHRoaXMuI29wO1xuICB9XG5cbiAgLyoqXG4gICAqIEluc3BlY3RzIHRoZSByZXNwb25zZSBhbmQgcmV0dXJucyB0aGUgcmVzcG9uc2UgYm9keSBpZiB0aGUgcmVxdWVzdCB3YXMgc3VjY2Vzc2Z1bC5cbiAgICogT3RoZXJ3aXNlLCBkaXNwYXRjaGVzIHRoZSBlcnJvciB0byBldmVudCBsaXN0ZW5lcnMsIHRoZW4gdGhyb3dzIHtAbGluayBFcnJSZXNwb25zZX0uXG4gICAqXG4gICAqIEBwYXJhbSB7RmV0Y2hSZXNwb25zZTxUPn0gcmVzcCBUaGUgcmVzcG9uc2UgdG8gY2hlY2tcbiAgICogQHJldHVybiB7RmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhPFQ+fSBUaGUgcmVzcG9uc2UgZGF0YSBjb3JyZXNwb25kaW5nIHRvIHJlc3BvbnNlIHR5cGUge0BsaW5rIFR9LlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBhc3NlcnRPazxUPihyZXNwOiBGZXRjaFJlc3BvbnNlPFQ+KTogUHJvbWlzZTxGZXRjaFJlc3BvbnNlU3VjY2Vzc0RhdGE8VD4+IHtcbiAgICBpZiAocmVzcC5lcnJvcikge1xuICAgICAgY29uc3QgZXJyUmVzcCA9IHJlc3AuZXJyb3IgYXMgdW5rbm93biBhcyBFcnJvclJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyUmVzcG9uc2Uoe1xuICAgICAgICBvcGVyYXRpb246IHRoaXMub3AsXG4gICAgICAgIHJlcXVlc3RJZDogZXJyUmVzcD8ucmVxdWVzdF9pZCxcbiAgICAgICAgbWVzc2FnZTogZXJyUmVzcD8ubWVzc2FnZSxcbiAgICAgICAgc3RhdHVzVGV4dDogcmVzcC5yZXNwb25zZT8uc3RhdHVzVGV4dCxcbiAgICAgICAgc3RhdHVzOiByZXNwLnJlc3BvbnNlPy5zdGF0dXMsXG4gICAgICAgIHVybDogcmVzcC5yZXNwb25zZT8udXJsLFxuICAgICAgICBlcnJvckNvZGU6IGVyclJlc3A/LmVycm9yX2NvZGUsXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IHRoaXMuI2V2ZW50RW1pdHRlci5jbGFzc2lmeUFuZEVtaXRFcnJvcihlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgaWYgKHJlc3AuZGF0YSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXNwb25zZSBkYXRhIGlzIHVuZGVmaW5lZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3AuZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge251bWJlcltdfSBkZWxheXNNcyBEZWxheXMgaW4gbWlsbGlzZWNvbmRzIGJldHdlZW4gcmV0cmllcy5cbiAgICogQHJldHVybiB7T3BDbGllbnQ8T3A+fSBSZXR1cm5zIHRoZSBzYW1lIGNsaWVudCBhcyB0aGlzIGV4Y2VwdCB3aXRoIGRpZmZlcmVudCByZXRyeSBkZWxheXMuXG4gICAqL1xuICB3aXRoUmV0cmllcyhkZWxheXNNczogbnVtYmVyW10pOiBPcENsaWVudDxPcD4ge1xuICAgIHJldHVybiB0aGlzLndpdGhSZXRyeVNldHRpbmdzKHtcbiAgICAgIGNvZGVzOiB0aGlzLiNyZXRyeS5jb2RlcyxcbiAgICAgIGRlbGF5c01zLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UmV0cnlTZXR0aW5nc30gcmV0cnlTZXR0aW5ncyBOZXcgcmV0cnkgc2V0dGluZ3NcbiAgICogQHJldHVybiB7T3BDbGllbnQ8T3A+fSBSZXR1cm5zIHRoZSBzYW1lIGNsaWVudCBhcyB0aGlzIGV4Y2VwdCB3aXRoIGRpZmZlcmVudCByZXRyeSBzZXR0aW5ncy5cbiAgICovXG4gIHdpdGhSZXRyeVNldHRpbmdzKHJldHJ5U2V0dGluZ3M6IFJldHJ5U2V0dGluZ3MpOiBPcENsaWVudDxPcD4ge1xuICAgIHJldHVybiBuZXcgT3BDbGllbnQodGhpcy5vcCwgdGhpcy4jY2xpZW50LCB0aGlzLiNldmVudEVtaXR0ZXIsIHJldHJ5U2V0dGluZ3MpO1xuICB9XG5cbiAgLy8gbm90IHByaXZhdGUgb25seSBzbyB0aGF0IHRoZSB0ZXN0IGNhbiBjYWxsIGl0XG4gIC8qKlxuICAgKiBJbnRlcm5hbC5cbiAgICpcbiAgICogRXhlY3V0ZXMgYSBnaXZlbiByZXF1ZXN0LCBwb3RlbnRpYWxseSByZXRyeWluZyBvbiA1eHggZXJyb3JzLiBUaGVcbiAgICogcmV0cnkgY29uZmlndXJhdGlvbiBjYW4gYmUgc2V0IHZpYSB0aGUgY29uc3RydWN0b3IuXG4gICAqIE9uIGFsbCBvdGhlciBlcnJvcnMsIHRocm93cyB7QGxpbmsgRXJyUmVzcG9uc2V9IChhcyB3ZWxsIGFzIGFmdGVyIGV4aGF1c3RpbmcgYWxsIHJldHJpZXMpLlxuICAgKiBPbiBzdWNjZXNzLCByZXR1cm5zIHRoZSByZXNwb25zZSBib2R5LlxuICAgKlxuICAgKiBAcGFyYW0ge1JlcUZuPFQ+fSByZXEgVGhlIHJlcXVlc3QgdG8gZXhlY3V0ZSBhbmQgdGhlbiByZXRyeSBvbiA1eHggZXJyb3JzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RmV0Y2hSZXNwb25zZVN1Y2Nlc3NEYXRhPFQ+Pn1cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBleGVjdXRlPFQ+KHJlcTogUmVxRm48VD4pOiBQcm9taXNlPEZldGNoUmVzcG9uc2VTdWNjZXNzRGF0YTxUPj4ge1xuICAgIGxldCByZXNwID0gYXdhaXQgcmVxKCk7XG4gICAgbGV0IGkgPSAwO1xuICAgIHdoaWxlICh0aGlzLiNyZXRyeS5jb2Rlcy5pbmNsdWRlcyhyZXNwLnJlc3BvbnNlPy5zdGF0dXMpICYmIGkgPCB0aGlzLiNyZXRyeS5kZWxheXNNcy5sZW5ndGgpIHtcbiAgICAgIGF3YWl0IGRlbGF5KHRoaXMuI3JldHJ5LmRlbGF5c01zW2ldKTtcbiAgICAgIHJlc3AgPSBhd2FpdCByZXEoKTtcbiAgICAgIGkrKztcbiAgICB9XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSB2YWxpZC1qc2RvYyAqL1xuXG4gIC8qKlxuICAgKiBJbnZva2UgSFRUUCBHRVRcbiAgICovXG4gIGFzeW5jIGdldChcbiAgICB1cmw6IFBhdGhzV2l0aDxQYXRoczxPcD4sIFwiZ2V0XCI+LFxuICAgIGluaXQ6IEZldGNoT3B0aW9uczxGaWx0ZXJLZXlzPFBhdGhzPE9wPltQYXRoc1dpdGg8UGF0aHM8T3A+LCBcImdldFwiPl0sIFwiZ2V0XCI+PixcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZSgoKSA9PiB0aGlzLiNjbGllbnQuZ2V0KHVybCwgaW5pdCkpO1xuICB9XG5cbiAgLyoqIEludm9rZSBIVFRQIFBPU1QgKi9cbiAgYXN5bmMgcG9zdChcbiAgICB1cmw6IFBhdGhzV2l0aDxQYXRoczxPcD4sIFwicG9zdFwiPixcbiAgICBpbml0OiBGZXRjaE9wdGlvbnM8RmlsdGVyS2V5czxQYXRoczxPcD5bUGF0aHNXaXRoPFBhdGhzPE9wPiwgXCJwb3N0XCI+XSwgXCJwb3N0XCI+PixcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZSgoKSA9PiB0aGlzLiNjbGllbnQucG9zdCh1cmwsIGluaXQpKTtcbiAgfVxuXG4gIC8qKiBJbnZva2UgSFRUUCBQQVRDSCAqL1xuICBhc3luYyBwYXRjaChcbiAgICB1cmw6IFBhdGhzV2l0aDxQYXRoczxPcD4sIFwicGF0Y2hcIj4sXG4gICAgaW5pdDogRmV0Y2hPcHRpb25zPEZpbHRlcktleXM8UGF0aHM8T3A+W1BhdGhzV2l0aDxQYXRoczxPcD4sIFwicGF0Y2hcIj5dLCBcInBhdGNoXCI+PixcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZSgoKSA9PiB0aGlzLiNjbGllbnQucGF0Y2godXJsLCBpbml0KSk7XG4gIH1cblxuICAvKiogSW52b2tlIEhUVFAgREVMRVRFICovXG4gIGFzeW5jIGRlbChcbiAgICB1cmw6IFBhdGhzV2l0aDxQYXRoczxPcD4sIFwiZGVsZXRlXCI+LFxuICAgIGluaXQ6IEZldGNoT3B0aW9uczxGaWx0ZXJLZXlzPFBhdGhzPE9wPltQYXRoc1dpdGg8UGF0aHM8T3A+LCBcImRlbGV0ZVwiPl0sIFwiZGVsZXRlXCI+PixcbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlY3V0ZSgoKSA9PiB0aGlzLiNjbGllbnQuZGVsKHVybCwgaW5pdCkpO1xuICB9XG5cbiAgLyoqIEludm9rZSBIVFRQIFBVVCAqL1xuICBhc3luYyBwdXQoXG4gICAgdXJsOiBQYXRoc1dpdGg8UGF0aHM8T3A+LCBcInB1dFwiPixcbiAgICBpbml0OiBGZXRjaE9wdGlvbnM8RmlsdGVyS2V5czxQYXRoczxPcD5bUGF0aHNXaXRoPFBhdGhzPE9wPiwgXCJwdXRcIj5dLCBcInB1dFwiPj4sXG4gICkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWN1dGUoKCkgPT4gdGhpcy4jY2xpZW50LnB1dCh1cmwsIGluaXQpKTtcbiAgfVxuXG4gIC8qIGVzbGludC1lbmFibGUgdmFsaWQtanNkb2MgKi9cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IEhUVFAgY2xpZW50LCBzZXR0aW5nIHRoZSBcIlVzZXItQWdlbnRcIiBoZWFkZXIgdG8gdGhpcyBwYWNrYWdlJ3Mge25hbWV9QHt2ZXJzaW9ufS5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gYmFzZVVybCBUaGUgYmFzZSBVUkwgb2YgdGhlIGNsaWVudCAoZS5nLiwgXCJodHRwczovL2dhbW1hLnNpZ25lci5jdWJpc3QuZGV2XCIpXG4gKiBAcGFyYW0ge3N0cmluZ30gYXV0aFRva2VuIFRoZSB2YWx1ZSB0byBzZW5kIGFzIFwiQXV0aG9yaXphdGlvblwiIGhlYWRlci5cbiAqIEByZXR1cm4ge0NsaWVudH0gVGhlIG5ldyBIVFRQIGNsaWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUh0dHBDbGllbnQoYmFzZVVybDogc3RyaW5nLCBhdXRoVG9rZW46IHN0cmluZyk6IENsaWVudCB7XG4gIHJldHVybiBjcmVhdGVDbGllbnQ8cGF0aHM+KHtcbiAgICBiYXNlVXJsLFxuICAgIGNhY2hlOiBcIm5vLXN0b3JlXCIsXG4gICAgaGVhZGVyczoge1xuICAgICAgQXV0aG9yaXphdGlvbjogYXV0aFRva2VuLFxuICAgICAgW1wiVXNlci1BZ2VudFwiXTogYCR7TkFNRX1AJHtWRVJTSU9OfWAsXG4gICAgICBbXCJYLUN1YmlzdC1Ucy1TZGtcIl06IGAke05BTUV9QCR7VkVSU0lPTn1gLFxuICAgIH0sXG4gIH0pO1xufVxuXG4vKipcbiAqIENsaWVudCB0byB1c2UgdG8gc2VuZCByZXF1ZXN0cyB0byBDdWJlU2lnbmVyIHNlcnZpY2VzXG4gKiB3aGVuIGF1dGhlbnRpY2F0aW5nIHVzaW5nIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICovXG5leHBvcnQgY2xhc3MgQ3ViZVNpZ25lckFwaSB7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSAjc2Vzc2lvbk1ncjogU2lnbmVyU2Vzc2lvbk1hbmFnZXI7XG4gIHJlYWRvbmx5ICNldmVudEVtaXR0ZXI6IEV2ZW50RW1pdHRlcjtcbiAgcmVhZG9ubHkgI3JldHJ5U2V0dGluZ3M/OiBSZXRyeVNldHRpbmdzO1xuXG4gIC8qKiBVbmRlcmx5aW5nIHNlc3Npb24gbWFuYWdlciAqL1xuICBnZXQgc2Vzc2lvbk1ncigpOiBTaWduZXJTZXNzaW9uTWFuYWdlciB7XG4gICAgcmV0dXJuIHRoaXMuI3Nlc3Npb25NZ3I7XG4gIH1cblxuICAvKiogVGFyZ2V0IGVudmlyb25tZW50ICovXG4gIGdldCBlbnYoKTogRW52SW50ZXJmYWNlIHtcbiAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWdyLmVudjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTWFuYWdlcn0gc2Vzc2lvbk1nciBUaGUgc2Vzc2lvbiBtYW5hZ2VyIHRvIHVzZVxuICAgKiBAcGFyYW0ge3N0cmluZz99IG9yZ0lkIE9wdGlvbmFsIG9yZ2FuaXphdGlvbiBJRDsgaWYgb21pdHRlZCwgdXNlcyB0aGUgb3JnIElEIGZyb20gdGhlIHNlc3Npb24gbWFuYWdlci5cbiAgICogQHBhcmFtIHtSZXRyeVNldHRpbmdzfSByZXRyeVNldHRpbmdzIFJldHJ5IHNldHRpbmdzLiBCeSBkZWZhdWx0LCByZXRyaWVzIDMgdGltZXMsIHNsZWVwaW5nIDEwMG1zXG4gICAqICAgYWZ0ZXIgdGhlIGZpcnN0IGZhaWxlZCBhdHRlbXB0LCAyMDBtcyBhZnRlciB0aGUgc2Vjb25kLCBhbmQgZmluYWxseSA0MDBtcyBhZnRlciB0aGUgdGhpcmQsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzZXNzaW9uTWdyOiBTaWduZXJTZXNzaW9uTWFuYWdlciwgb3JnSWQ/OiBzdHJpbmcsIHJldHJ5U2V0dGluZ3M/OiBSZXRyeVNldHRpbmdzKSB7XG4gICAgdGhpcy4jc2Vzc2lvbk1nciA9IHNlc3Npb25NZ3I7XG4gICAgdGhpcy4jZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcihbc2Vzc2lvbk1nci5ldmVudHNdKTtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkID8/IHNlc3Npb25NZ3Iub3JnSWQ7XG4gICAgdGhpcy4jcmV0cnlTZXR0aW5ncyA9IHJldHJ5U2V0dGluZ3M7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBpbnN0YW5jZSBvZiB0aGlzIGNsYXNzIHVzaW5nIHRoZSBzYW1lIHNlc3Npb24gbWFuYWdlciBidXQgdGFyZ2V0aW5nIGEgZGlmZmVyZW50IG9yZ2FuaXphdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmdhbml6YXRpb24gSUQuXG4gICAqIEByZXR1cm4ge0N1YmVTaWduZXJBcGl9IEEgbmV3IGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgdXNpbmcgdGhlIHNhbWUgc2Vzc2lvbiBtYW5hZ2VyIGJ1dCB0YXJnZXRpbmcgZGlmZmVyZW50IG9yZ2FuaXphdGlvbi5cbiAgICovXG4gIHdpdGhPcmcob3JnSWQ/OiBzdHJpbmcpOiBDdWJlU2lnbmVyQXBpIHtcbiAgICByZXR1cm4gb3JnSWQgPyBuZXcgQ3ViZVNpZ25lckFwaSh0aGlzLiNzZXNzaW9uTWdyLCBvcmdJZCkgOiB0aGlzO1xuICB9XG5cbiAgLyoqIE9yZyBpZCBvciBuYW1lICovXG4gIGdldCBvcmdJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jb3JnSWQ7XG4gIH1cblxuICAvKipcbiAgICogSFRUUCBjbGllbnQgcmVzdHJpY3RlZCB0byBhIHNpbmdsZSBvcGVyYXRpb24uIFRoZSByZXN0cmljdGlvbiBhcHBsaWVzIG9ubHlcbiAgICogd2hlbiB0eXBlIGNoZWNraW5nLCB0aGUgYWN0dWFsIGNsaWVudCBkb2VzIG5vdCByZXN0cmljdCBhbnl0aGluZyBhdCBydW50aW1lLlxuICAgKlxuICAgKiBAcGFyYW0ge09wfSBvcCBUaGUgb3BlcmF0aW9uIHRvIHJlc3RyaWN0IHRoZSBjbGllbnQgdG9cbiAgICogQHJldHVybiB7UHJvbWlzZTxPcENsaWVudDxPcD4+fSBUaGUgY2xpZW50IHJlc3RyaWN0ZWQgdG8ge0BsaW5rIG9wfVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBjbGllbnQ8T3AgZXh0ZW5kcyBrZXlvZiBvcGVyYXRpb25zPihvcDogT3ApOiBQcm9taXNlPE9wQ2xpZW50PE9wPj4ge1xuICAgIGNvbnN0IGZldGNoQ2xpZW50ID0gYXdhaXQgdGhpcy4jc2Vzc2lvbk1nci5jbGllbnQob3ApO1xuICAgIHJldHVybiBuZXcgT3BDbGllbnQob3AsIGZldGNoQ2xpZW50LCB0aGlzLiNldmVudEVtaXR0ZXIsIHRoaXMuI3JldHJ5U2V0dGluZ3MpO1xuICB9XG5cbiAgLy8gI3JlZ2lvbiBVU0VSUzogdXNlckdldCwgdXNlclRvdHAoUmVzZXRJbml0fFJlc2V0Q29tcGxldGV8VmVyaWZ5fERlbGV0ZSksIHVzZXJGaWRvKFJlZ2lzdGVySW5pdHxSZWdpc3RlckNvbXBsZXRlfERlbGV0ZSlcblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VXNlckluZm8+fSBSZXRyaWV2ZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdXNlci5cbiAgICovXG4gIGFzeW5jIHVzZXJHZXQoKTogUHJvbWlzZTxVc2VySW5mbz4ge1xuICAgIGlmIChgJHt0aGlzLm9yZ0lkfWAgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiYWJvdXRNZUxlZ2FjeVwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL2Fib3V0X21lXCIsIHt9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJhYm91dE1lXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWVcIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgVE9UUC4gUmV0dXJucyBhIHtAbGluayBUb3RwQ2hhbGxlbmdlfVxuICAgKiB0aGF0IG11c3QgYmUgYW5zd2VyZWQgZWl0aGVyIGJ5IGNhbGxpbmcge0BsaW5rIFRvdHBDaGFsbGVuZ2UuYW5zd2VyfSAob3JcbiAgICoge0BsaW5rIEN1YmVTaWduZXJBcGkudXNlclRvdHBSZXNldENvbXBsZXRlfSkuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpc3N1ZXIgT3B0aW9uYWwgaXNzdWVyOyBkZWZhdWx0cyB0byBcIkN1YmlzdFwiXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBSZXNldEluaXQoXG4gICAgaXNzdWVyPzogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxUb3RwQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IHJlc2V0VG90cEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1c2VyUmVzZXRUb3RwSW5pdFwiKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogaXNzdWVyXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIGlzc3VlcixcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA6IG51bGwsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAodG90cEluZm8pID0+IG5ldyBUb3RwQ2hhbGxlbmdlKHRoaXMsIHRvdHBJbmZvKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShyZXNldFRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHVzZXJUb3RwUmVzZXRJbml0fS4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0b3RwSWQgLSBUaGUgSUQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIC0gVGhlIFRPVFAgY29kZSB0aGF0IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwUmVzZXRDb21wbGV0ZSh0b3RwSWQ6IHN0cmluZywgY29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1c2VyUmVzZXRUb3RwQ29tcGxldGVcIik7XG4gICAgYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHsgdG90cF9pZDogdG90cElkLCBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZpZXMgYSBnaXZlbiBUT1RQIGNvZGUgYWdhaW5zdCB0aGUgY3VycmVudCB1c2VyJ3MgVE9UUCBjb25maWd1cmF0aW9uLlxuICAgKiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIHZlcmlmaWNhdGlvbiBmYWlscy5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgQ3VycmVudCBUT1RQIGNvZGVcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwVmVyaWZ5KGNvZGU6IHN0cmluZykge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlclZlcmlmeVRvdHBcIik7XG4gICAgYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cC92ZXJpZnlcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBEZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHQpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBkZWxldGVUb3RwRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVzZXJEZWxldGVUb3RwXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IG51bGwsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGRlbGV0ZVRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYWRkaW5nIGEgbmV3IEZJRE8gZGV2aWNlLiBNRkEgbWF5IGJlIHJlcXVpcmVkLiAgVGhpcyByZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCB3aXRoIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIHVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZX1cbiAgICogKGFmdGVyIE1GQSBhcHByb3ZhbHMpLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbmV3IGRldmljZS5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0IHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEFkZEZpZG9DaGFsbGVuZ2U+Pn0gQSBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGluIG9yZGVyIHRvIGNvbXBsZXRlIEZJRE8gcmVnaXN0cmF0aW9uLlxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9SZWdpc3RlckluaXQoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBZGRGaWRvQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IGFkZEZpZG9GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlclJlZ2lzdGVyRmlkb0luaXRcIik7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHsgbmFtZSB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKGMpID0+IG5ldyBBZGRGaWRvQ2hhbGxlbmdlKHRoaXMsIGMpKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKGFkZEZpZG9GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCAodmlhIHtAbGluayB1c2VyRmlkb1JlZ2lzdGVySW5pdH0pIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhbGxlbmdlSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqIEBwYXJhbSB7UHVibGljS2V5Q3JlZGVudGlhbH0gY3JlZGVudGlhbCBUaGUgYW5zd2VyIHRvIHRoZSBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGUoY2hhbGxlbmdlSWQ6IHN0cmluZywgY3JlZGVudGlhbDogUHVibGljS2V5Q3JlZGVudGlhbCkge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlclJlZ2lzdGVyRmlkb0NvbXBsZXRlXCIpO1xuICAgIGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBmaWRvSWQgVGhlIElEIG9mIHRoZSBkZXNpcmVkIEZJRE8ga2V5XG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9EZWxldGUoXG4gICAgZmlkb0lkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IGRlbGV0ZUZpZG9GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXNlckRlbGV0ZUZpZG9cIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvL3tmaWRvX2lkfVwiLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgZmlkb19pZDogZmlkb0lkIH0gfSxcbiAgICAgICAgYm9keTogbnVsbCxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoZGVsZXRlRmlkb0ZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SR1M6IG9yZ0dldCwgb3JnVXBkYXRlXG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCBvcmdhbml6YXRpb24uXG4gICAqIEByZXR1cm4ge09yZ0luZm99IEluZm9ybWF0aW9uIGFib3V0IHRoZSBvcmdhbml6YXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdHZXQoKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJnZXRPcmdcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7VXBkYXRlT3JnUmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge1VwZGF0ZU9yZ1Jlc3BvbnNlfSBVcGRhdGVkIG9yZyBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIG9yZ1VwZGF0ZShyZXF1ZXN0OiBVcGRhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxVcGRhdGVPcmdSZXNwb25zZT4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwidXBkYXRlT3JnXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHIFVTRVJTOiBvcmdVc2VySW52aXRlLCBvcmdVc2Vyc0xpc3QsIG9yZ1VzZXJDcmVhdGVPaWRjLCBvcmdVc2VyRGVsZXRlT2lkY1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmQgYW4gZW1haWwgaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbWFpbCBFbWFpbCBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZnVsbCBuYW1lIG9mIHRoZSB1c2VyXG4gICAqIEBwYXJhbSB7TWVtYmVyUm9sZX0gcm9sZSBPcHRpb25hbCByb2xlLiBEZWZhdWx0cyB0byBcImFsaWVuXCIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VySW52aXRlKGVtYWlsOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcm9sZT86IE1lbWJlclJvbGUpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImludml0ZVwiKTtcbiAgICBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vaW52aXRlXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lLFxuICAgICAgICByb2xlLFxuICAgICAgICBza2lwX2VtYWlsOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2Vycy5cbiAgICogQHJldHVybiB7VXNlcltdfSBPcmcgdXNlcnMuXG4gICAqL1xuICBhc3luYyBvcmdVc2Vyc0xpc3QoKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvW10+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImxpc3RVc2Vyc0luT3JnXCIpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiByZXNwLnVzZXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqIEBwYXJhbSB7T2lkY0lkZW50aXR5fSBpZGVudGl0eSBUaGUgaWRlbnRpdHkgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZW1haWwgRW1haWwgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0ge0NyZWF0ZU9pZGNVc2VyT3B0aW9uc30gb3B0cyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIG5ldyBPSURDIHVzZXJzXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVXNlciBpZCBvZiB0aGUgbmV3IHVzZXJcbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJDcmVhdGVPaWRjKFxuICAgIGlkZW50aXR5OiBPaWRjSWRlbnRpdHksXG4gICAgZW1haWw/OiBzdHJpbmcgfCBudWxsLFxuICAgIG9wdHM6IENyZWF0ZU9pZGNVc2VyT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiY3JlYXRlT2lkY1VzZXJcIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBpZGVudGl0eSxcbiAgICAgICAgcm9sZTogb3B0cy5tZW1iZXJSb2xlID8/IFwiQWxpZW5cIixcbiAgICAgICAgZW1haWwsXG4gICAgICAgIG5hbWU6IG9wdHMubmFtZSxcbiAgICAgICAgbWZhX3BvbGljeTogb3B0cy5tZmFQb2xpY3ksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBkYXRhLnVzZXJfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICogQHBhcmFtIHtPaWRjSWRlbnRpdHl9IGlkZW50aXR5IFRoZSBpZGVudGl0eSBvZiB0aGUgT0lEQyB1c2VyXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlT2lkYyhpZGVudGl0eTogT2lkY0lkZW50aXR5KSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJkZWxldGVPaWRjVXNlclwiKTtcbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkY1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogaWRlbnRpdHksXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBLRVlTOiBrZXlHZXQsIGtleVVwZGF0ZSwga2V5RGVsZXRlLCBrZXlzQ3JlYXRlLCBrZXlzRGVyaXZlLCBrZXlzTGlzdFxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvQXBpfSBUaGUga2V5IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMga2V5R2V0KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleUluZm9BcGk+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImdldEtleUluT3JnXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgYSBrZXkgaXMgaW4uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1BhZ2luYXRvcjxMaXN0S2V5Um9sZXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mbz59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHJvbGVzIGEga2V5IGlzIGluLlxuICAgKi9cbiAga2V5Um9sZXNMaXN0KGtleUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0S2V5Um9sZXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mbz4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJsaXN0S2V5Um9sZXNcIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfS9yb2xlc1wiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBrZXlfaWQ6IGtleUlkIH0sXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLnJvbGVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBJRCBvZiB0aGUga2V5IHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHtVcGRhdGVLZXlSZXF1ZXN0fSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybiB7S2V5SW5mb0FwaX0gVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICovXG4gIGFzeW5jIGtleVVwZGF0ZShrZXlJZDogc3RyaW5nLCByZXF1ZXN0OiBVcGRhdGVLZXlSZXF1ZXN0KTogUHJvbWlzZTxLZXlJbmZvQXBpPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1cGRhdGVLZXlcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgLSBLZXkgaWRcbiAgICovXG4gIGFzeW5jIGtleURlbGV0ZShrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJkZWxldGVLZXlcIik7XG4gICAgYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgc2lnbmluZyBrZXlzLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHBhcmFtIHtLZXlQcm9wZXJ0aWVzP30gcHJvcHMgQWRkaXRpb25hbCBrZXkgcHJvcGVydGllc1xuICAgKiBAcmV0dXJuIHtLZXlJbmZvQXBpW119IFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGtleXNDcmVhdGUoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBjb3VudDogbnVtYmVyLFxuICAgIG93bmVySWQ/OiBzdHJpbmcsXG4gICAgcHJvcHM/OiBLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleUluZm9BcGlbXT4ge1xuICAgIGNvbnN0IGNoYWluX2lkID0gMDsgLy8gbm90IHVzZWQgYW55bW9yZVxuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiY3JlYXRlS2V5XCIpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0va2V5c1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjb3VudCxcbiAgICAgICAgY2hhaW5faWQsXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgb3duZXI6IHByb3BzPy5vd25lciA/PyBvd25lcklkLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gZGF0YS5rZXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIHNldCBvZiBrZXlzIG9mIGEgc3BlY2lmaWVkIHR5cGUgdXNpbmcgYSBzdXBwbGllZCBkZXJpdmF0aW9uIHBhdGggYW5kIGFuIGV4aXN0aW5nIGxvbmctbGl2ZWQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gZGVyaXZhdGlvblBhdGhzIERlcml2YXRpb24gcGF0aHMgZnJvbSB3aGljaCB0byBkZXJpdmUgbmV3IGtleXMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtbmVtb25pY0lkIG1hdGVyaWFsSWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtLZXlJbmZvQXBpW119IFRoZSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzRGVyaXZlKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSxcbiAgICBtbmVtb25pY0lkOiBzdHJpbmcsXG4gICk6IFByb21pc2U8S2V5SW5mb0FwaVtdPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJkZXJpdmVLZXlcIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wdXQoXCIvdjAvb3JnL3tvcmdfaWR9L2Rlcml2ZV9rZXlcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZGVyaXZhdGlvbl9wYXRoOiBkZXJpdmF0aW9uUGF0aHMsXG4gICAgICAgIG1uZW1vbmljX2lkOiBtbmVtb25pY0lkLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGEua2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBrZXlzIGluIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7S2V5VHlwZT99IHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzP30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7UGFnaW5hdG9yPExpc3RLZXlzUmVzcG9uc2UsIEtleUluZm9BcGk+fSBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGtleXMuXG4gICAqL1xuICBrZXlzTGlzdCh0eXBlPzogS2V5VHlwZSwgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RLZXlzUmVzcG9uc2UsIEtleUluZm9BcGk+IHtcbiAgICBjb25zdCBsaXN0Rm4gPSBhc3luYyAocXVlcnk6IFBhZ2VRdWVyeUFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibGlzdEtleXNJbk9yZ1wiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSxcbiAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAga2V5X3R5cGU6IHR5cGUsXG4gICAgICAgICAgICAuLi5xdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci5rZXlzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRVM6IHJvbGVDcmVhdGUsIHJvbGVSZWFkLCByb2xlVXBkYXRlLCByb2xlRGVsZXRlLCByb2xlc0xpc3RcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gbmFtZSBUaGUgb3B0aW9uYWwgbmFtZSBvZiB0aGUgcm9sZS5cbiAgICogQHJldHVybiB7c3RyaW5nfSBUaGUgSUQgb2YgdGhlIG5ldyByb2xlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUNyZWF0ZShuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImNyZWF0ZVJvbGVcIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQgfSB9LFxuICAgICAgYm9keTogbmFtZSA/IHsgbmFtZSB9IDogdW5kZWZpbmVkLFxuICAgIH0pO1xuICAgIHJldHVybiBkYXRhLnJvbGVfaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpdHMgaWQgKG9yIG5hbWUpLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm4ge1JvbGVJbmZvfSBUaGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVHZXQocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJnZXRSb2xlXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHtVcGRhdGVSb2xlUmVxdWVzdH0gcmVxdWVzdCBUaGUgdXBkYXRlIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Um9sZUluZm8+fSBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVwZGF0ZShyb2xlSWQ6IHN0cmluZywgcmVxdWVzdDogVXBkYXRlUm9sZVJlcXVlc3QpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1cGRhdGVSb2xlXCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIHJvbGUgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB0byBkZWxldGUuXG4gICAqL1xuICBhc3luYyByb2xlRGVsZXRlKHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJkZWxldGVSb2xlXCIpO1xuICAgIGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7Um9sZUluZm99IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgcm9sZXMuXG4gICAqL1xuICByb2xlc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlc1Jlc3BvbnNlLCBSb2xlSW5mbz4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJsaXN0Um9sZXNcIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9LFxuICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci5yb2xlcyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRSBLRVlTOiByb2xlS2V5c0FkZCwgcm9sZUtleXNEZWxldGUsIHJvbGVLZXlzTGlzdFxuXG4gIC8qKlxuICAgKiBBZGQgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBrZXlJZHMgVGhlIElEcyBvZiB0aGUga2V5cyB0byBhZGQgdG8gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7S2V5UG9saWN5P30gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqL1xuICBhc3luYyByb2xlS2V5c0FkZChyb2xlSWQ6IHN0cmluZywga2V5SWRzOiBzdHJpbmdbXSwgcG9saWN5PzogS2V5UG9saWN5KSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJhZGRLZXlzVG9Sb2xlXCIpO1xuICAgIGF3YWl0IGNsaWVudC5wdXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfa2V5c1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBrZXlfaWRzOiBrZXlJZHMsXG4gICAgICAgIHBvbGljeTogKHBvbGljeSA/PyBudWxsKSBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSB8IG51bGwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGVcbiAgICovXG4gIGFzeW5jIHJvbGVLZXlzUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCBrZXlJZDogc3RyaW5nKSB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJyZW1vdmVLZXlGcm9tUm9sZVwiKTtcbiAgICBhd2FpdCBjbGllbnQuZGVsKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCByb2xlX2lkOiByb2xlSWQsIGtleV9pZDoga2V5SWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIGtleXMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSBrZXlzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8TGlzdFJvbGVLZXlzUmVzcG9uc2UsIEtleUluUm9sZUluZm8+fSBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSBrZXlzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZUtleXNMaXN0KHJvbGVJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdFJvbGVLZXlzUmVzcG9uc2UsIEtleUluUm9sZUluZm8+IHtcbiAgICBjb25zdCBsaXN0Rm4gPSBhc3luYyAocXVlcnk6IFBhZ2VRdWVyeUFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibGlzdFJvbGVLZXlzXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9rZXlzXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9LFxuICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci5rZXlzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFIFVTRVJTOiByb2xlVXNlckFkZCwgcm9sZVVzZXJSZW1vdmUsIHJvbGVVc2Vyc0xpc3RcblxuICAvKipcbiAgICogQWRkIGFuIGV4aXN0aW5nIHVzZXIgdG8gYW4gZXhpc3Rpbmcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIGFkZCB0byB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVVc2VyQWRkKHJvbGVJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiYWRkVXNlclRvUm9sZVwiKTtcbiAgICBhd2FpdCBjbGllbnQucHV0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vYWRkX3VzZXIve3VzZXJfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgYW4gZXhpc3RpbmcgdXNlciBmcm9tIGFuIGV4aXN0aW5nIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUgZnJvbSB0aGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVVc2VyUmVtb3ZlKHJvbGVJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZykge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwicmVtb3ZlVXNlckZyb21Sb2xlXCIpO1xuICAgIGF3YWl0IGNsaWVudC5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS91c2Vycy97dXNlcl9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCByb2xlX2lkOiByb2xlSWQsIHVzZXJfaWQ6IHVzZXJJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgdXNlcnMgaW4gYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZSB3aG9zZSB1c2VycyB0byByZXRyaWV2ZS5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7UGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm8+fSBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSB1c2VycyBpbiB0aGUgcm9sZS5cbiAgICovXG4gIHJvbGVVc2Vyc0xpc3Qocm9sZUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0Um9sZVVzZXJzUmVzcG9uc2UsIFVzZXJJblJvbGVJbmZvPiB7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImxpc3RSb2xlVXNlcnNcIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3VzZXJzXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHJvbGVfaWQ6IHJvbGVJZCB9LFxuICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci51c2VycyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0VTU0lPTlM6IHNlc3Npb24oQ3JlYXRlfENyZWF0ZUZvclJvbGV8UmVmcmVzaHxSZXZva2V8TGlzdHxLZXlzTGlzdClcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHNjb3BlcyBTZXNzaW9uIHNjb3Blcy5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9uTGlmZXRpbWV9IGxpZmV0aW1lcyBMaWZldGltZSBzZXR0aW5nc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNpZ25lclNlc3Npb25EYXRhPn0gTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlKFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBzY29wZXM6IHN0cmluZ1tdLFxuICAgIGxpZmV0aW1lcz86IFNpZ25lclNlc3Npb25MaWZldGltZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICAgIGxpZmV0aW1lcyA/Pz0gZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImNyZWF0ZVNlc3Npb25cIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIHB1cnBvc2UsXG4gICAgICAgIHNjb3BlcyxcbiAgICAgICAgYXV0aF9saWZldGltZTogbGlmZXRpbWVzLmF1dGgsXG4gICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IGxpZmV0aW1lcy5yZWZyZXNoLFxuICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZXMuc2Vzc2lvbixcbiAgICAgICAgZ3JhY2VfbGlmZXRpbWU6IGxpZmV0aW1lcy5ncmFjZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9yZ19pZDogdGhpcy5vcmdJZCxcbiAgICAgIHJvbGVfaWQ6IHVuZGVmaW5lZCxcbiAgICAgIHB1cnBvc2UsXG4gICAgICB0b2tlbjogZGF0YS50b2tlbixcbiAgICAgIHNlc3Npb25faW5mbzogZGF0YS5zZXNzaW9uX2luZm8sXG4gICAgICBzZXNzaW9uX2V4cDogZGF0YS5leHBpcmF0aW9uISxcbiAgICAgIC8vIEtlZXAgY29tcGF0aWJpbGl0eSB3aXRoIHRva2VucyBwcm9kdWNlZCBieSBDTElcbiAgICAgIGVudjoge1xuICAgICAgICBbXCJEZXYtQ3ViZVNpZ25lclN0YWNrXCJdOiB0aGlzLiNzZXNzaW9uTWdyLmVudixcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gZm9yIGEgZ2l2ZW4gcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gT25seSBgc2lnbjoqYCBzY29wZXMgYXJlIGFsbG93ZWQuXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbkxpZmV0aW1lfSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uRGF0YT59IE5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkNyZWF0ZUZvclJvbGUoXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3Blcz86IHN0cmluZ1tdLFxuICAgIGxpZmV0aW1lcz86IFNpZ25lclNlc3Npb25MaWZldGltZSxcbiAgKTogUHJvbWlzZTxTaWduZXJTZXNzaW9uRGF0YT4ge1xuICAgIGxpZmV0aW1lcyA/Pz0gZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTtcbiAgICBjb25zdCBpbnZhbGlkU2NvcGVzID0gKHNjb3BlcyB8fCBbXSkuZmlsdGVyKChzKSA9PiAhcy5zdGFydHNXaXRoKFwic2lnbjpcIikpO1xuICAgIGlmIChpbnZhbGlkU2NvcGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUm9sZSBzY29wZXMgbXVzdCBzdGFydCB3aXRoICdzaWduOic7IGludmFsaWQgc2NvcGVzOiAke2ludmFsaWRTY29wZXN9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJjcmVhdGVSb2xlVG9rZW5cIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcHVycG9zZSxcbiAgICAgICAgc2NvcGVzLFxuICAgICAgICBhdXRoX2xpZmV0aW1lOiBsaWZldGltZXMuYXV0aCxcbiAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWVzLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IGxpZmV0aW1lcy5zZXNzaW9uLFxuICAgICAgICBncmFjZV9saWZldGltZTogbGlmZXRpbWVzLmdyYWNlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgb3JnX2lkOiB0aGlzLm9yZ0lkLFxuICAgICAgcm9sZV9pZDogcm9sZUlkLFxuICAgICAgcHVycG9zZSxcbiAgICAgIHRva2VuOiBkYXRhLnRva2VuLFxuICAgICAgc2Vzc2lvbl9pbmZvOiBkYXRhLnNlc3Npb25faW5mbyxcbiAgICAgIHNlc3Npb25fZXhwOiBkYXRhLmV4cGlyYXRpb24hLFxuICAgICAgLy8gS2VlcCBjb21wYXRpYmlsaXR5IHdpdGggdG9rZW5zIHByb2R1Y2VkIGJ5IENMSVxuICAgICAgZW52OiB7XG4gICAgICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IHRoaXMuI3Nlc3Npb25NZ3IuZW52LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhIHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZXNzaW9uSWQgVGhlIElEIG9mIHRoZSBzZXNzaW9uIHRvIHJldm9rZS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25SZXZva2Uoc2Vzc2lvbklkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInJldm9rZVNlc3Npb25cIik7XG4gICAgYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvbi97c2Vzc2lvbl9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBzZXNzaW9uX2lkOiBzZXNzaW9uSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBwYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIGFsbCBzaWduZXIgc2Vzc2lvbnMgb3B0aW9uYWxseSBmaWx0ZXJlZCBieSBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gcm9sZUlkIElmIHNldCwgbGltaXQgdG8gc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZSBvbmx5LlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzP30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxTaWduZXJTZXNzaW9uSW5mb1tdPn0gU2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuXG4gICAqL1xuICBzZXNzaW9uc0xpc3Qocm9sZUlkPzogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8U2Vzc2lvbnNSZXNwb25zZSwgU2Vzc2lvbkluZm8+IHtcbiAgICBjb25zdCBsaXN0Rm4gPSBhc3luYyAocXVlcnk6IFBhZ2VRdWVyeUFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibGlzdFNlc3Npb25zXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQgfSxcbiAgICAgICAgICBxdWVyeTogeyByb2xlOiByb2xlSWQsIC4uLnF1ZXJ5IH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLnNlc3Npb25zLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBrZXlzIHRoYXQgdGhpcyBzZXNzaW9uIGhhcyBhY2Nlc3MgdG8uXG4gICAqIEByZXR1cm4ge0tleVtdfSBUaGUgbGlzdCBvZiBrZXlzLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbktleXNMaXN0KCk6IFByb21pc2U8S2V5SW5mb0FwaVtdPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJsaXN0VG9rZW5LZXlzXCIpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS90b2tlbi9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3Aua2V5cztcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIElERU5USVRZOiBpZGVudGl0eVByb3ZlLCBpZGVudGl0eVZlcmlmeVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gcHJvb2Ygb2YgYXV0aGVudGljYXRpb24gdXNpbmcgdGhlIGN1cnJlbnQgQ3ViZVNpZ25lciBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlQcm92ZSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImNyZWF0ZVByb29mQ3ViZVNpZ25lclwiKTtcbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgZ2l2ZW4gaWRlbnRpdHkgcHJvb2YgaXMgdmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7SWRlbnRpdHlQcm9vZn0gcHJvb2YgVGhlIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlWZXJpZnkocHJvb2Y6IElkZW50aXR5UHJvb2YpIHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInZlcmlmeVByb29mXCIpO1xuICAgIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS92ZXJpZnlcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgIGJvZHk6IHByb29mLFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gTUZBOiBtZmFHZXQsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUFwcHJvdmVUb3RwLCBtZmFBcHByb3ZlRmlkbyhJbml0fENvbXBsZXRlKVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgZXhpc3RpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gTUZBIHJlcXVlc3QgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIG1mYUdldChtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwibWZhR2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTUZBIHJlcXVlc3RzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mb1tdPn0gVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYUxpc3QoKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mb1tdPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJtZmFMaXN0XCIpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9tZmFcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzcC5tZmFfcmVxdWVzdHM7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFWb3RlQ3MobWZhSWQ6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcIm1mYVZvdGVDc1wiKTtcbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBJRCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcGFyYW0ge01mYVZvdGV9IG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFWb3RlVG90cChtZmFJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJtZmFWb3RlVG90cFwiKTtcbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vdG90cFwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uIEEgY2hhbGxlbmdlIGlzXG4gICAqIHJldHVybmVkIHdoaWNoIG11c3QgYmUgYW5zd2VyZWQgdmlhIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIG1mYUFwcHJvdmVGaWRvQ29tcGxldGV9LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElELlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+fSBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIG1mYUZpZG9Jbml0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcIm1mYUZpZG9Jbml0XCIpO1xuICAgIGNvbnN0IGNoYWxsZW5nZSA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZmlkb1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIG1mYV9pZDogbWZhSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgTWZhRmlkb0NoYWxsZW5nZSh0aGlzLCBtZmFJZCwgY2hhbGxlbmdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIG1mYUFwcHJvdmVGaWRvSW5pdH0pIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3JcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSURcbiAgICogQHBhcmFtIHtNZmFWb3RlfSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gY2hhbGxlbmdlSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2UgaXNzdWVkIGJ5IHtAbGluayBtZmFBcHByb3ZlRmlkb0luaXR9XG4gICAqIEBwYXJhbSB7UHVibGljS2V5Q3JlZGVudGlhbH0gY3JlZGVudGlhbCBUaGUgYW5zd2VyIHRvIHRoZSBjaGFsbGVuZ2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBtZmFWb3RlRmlkb0NvbXBsZXRlKFxuICAgIG1mYUlkOiBzdHJpbmcsXG4gICAgbWZhVm90ZTogTWZhVm90ZSxcbiAgICBjaGFsbGVuZ2VJZDogc3RyaW5nLFxuICAgIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gICk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcIm1mYVZvdGVGaWRvQ29tcGxldGVcIik7XG4gICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wYXRjaChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2ZpZG9cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkLCBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgY2hhbGxlbmdlX2lkOiBjaGFsbGVuZ2VJZCxcbiAgICAgICAgY3JlZGVudGlhbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBTSUdOOiBzaWduRXZtLCBzaWduRXRoMiwgc2lnblN0YWtlLCBzaWduVW5zdGFrZSwgc2lnbkF2YSwgc2lnbkJsb2IsIHNpZ25CdGMsIHNpZ25Tb2xhbmFcblxuICAvKipcbiAgICogU2lnbiBhbiBFVk0gdHJhbnNhY3Rpb24uXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0V2bVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV2bVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiZXRoMVNpZ25cIik7XG4gICAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTE5MSB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwMTkxU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV2bVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFaXAxOTFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiZWlwMTkxU2lnblwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vZXZtL2VpcDE5MS9zaWduL3twdWJrZXl9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHB1YmtleSB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtNzEyIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXA3MTJTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCbG9iU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXZtU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDcxMihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVpcDcxMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJlaXA3MTJTaWduXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9ldm0vZWlwNzEyL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIHZhbGlkYXRpb24gbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXRoMlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdGgyU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV0aDIoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImV0aDJTaWduXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiBkZXBvc2l0IChvciBzdGFraW5nKSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0V0aDJTdGFrZVJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxFdGgyU3Rha2VSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU3Rha2UoXG4gICAgcmVxOiBFdGgyU3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJzdGFrZVwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQucG9zdChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB1bnN0YWtlL2V4aXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7RXRoMlVuc3Rha2VSZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMlVuc3Rha2VSZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduVW5zdGFrZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1bnN0YWtlXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3Vuc3Rha2Uve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEF2YWxhbmNoZSBQLSBvciBYLWNoYWluIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge0F2YVR4fSB0eCBBdmFsYW5jaGUgbWVzc2FnZSAodHJhbnNhY3Rpb24pIHRvIHNpZ25cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8QXZhU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25BdmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgdHg6IEF2YVR4LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBdmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlcSA9IDxBdmFTaWduUmVxdWVzdD57XG4gICAgICAgIHR4OiB0eCBhcyB1bmtub3duLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiYXZhU2lnblwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vYXZhL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMub3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dSYXdCbG9iU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS4gVGhpcyBpcyBiZWNhdXNlXG4gICAqIHNpZ25pbmcgYXJiaXRyYXJ5IG1lc3NhZ2VzIGlzLCBpbiBnZW5lcmFsLCBkYW5nZXJvdXMgKGFuZCB5b3Ugc2hvdWxkIGluc3RlYWRcbiAgICogcHJlZmVyIHR5cGVkIGVuZC1wb2ludHMgYXMgdXNlZCBieSwgZm9yIGV4YW1wbGUsIHtAbGluayBzaWduRXZtfSkuIEZvciBTZWNwMjU2azEga2V5cyxcbiAgICogZm9yIGV4YW1wbGUsIHlvdSAqKm11c3QqKiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBhIG1lc3NhZ2UgdGhhdCBpcyAzMiBieXRlcyBsb25nIGFuZFxuICAgKiB0aGUgb3V0cHV0IG9mIGEgc2VjdXJlIGhhc2ggZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBzaWduYXR1cmVzIHNlcmlhbGl6ZWQgYXM7XG4gICAqXG4gICAqIC0gRUNEU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBhcyBiaWctZW5kaWFuIHIgYW5kIHMgcGx1cyByZWNvdmVyeS1pZFxuICAgKiAgICBieXRlIHYsIHdoaWNoIGNhbiBpbiBnZW5lcmFsIHRha2UgYW55IG9mIHRoZSB2YWx1ZXMgMCwgMSwgMiwgb3IgMy5cbiAgICpcbiAgICogLSBFZERTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGluIHRoZSBzdGFuZGFyZCBmb3JtYXQuXG4gICAqXG4gICAqIC0gQkxTIHNpZ25hdHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gdGhlIGJsb2Itc2lnbiBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBJRCkuXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEJsb2JTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJsb2IoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCbG9iU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJsb2JTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5X2lkID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5pZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcImJsb2JTaWduXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ibG9iL3NpZ24ve2tleV9pZH1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwga2V5X2lkIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtCdGNTaWduUmVxdWVzdH0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0ge01mYVJlY2VpcHR9IG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHRcbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IHRoaXMuY2xpZW50KFwiYnRjU2lnblwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQucG9zdChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0sXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUoc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgU29sYW5hIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge1NvbGFuYVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFNvbGFuYVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU29sYW5hKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogU29sYW5hU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNvbGFuYVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJzb2xhbmFTaWduXCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9zb2xhbmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCwgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFVTRVIgRVhQT1JUOiB1c2VyRXhwb3J0KEluaXQsQ29tcGxldGUsTGlzdCxEZWxldGUpXG4gIC8qKlxuICAgKiBMaXN0IG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3RzLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz99IGtleUlkIE9wdGlvbmFsIGtleSBJRC4gSWYgc3VwcGxpZWQsIGxpc3QgdGhlIG91dHN0YW5kaW5nIHJlcXVlc3QgKGlmIGFueSkgb25seSBmb3IgdGhlIHNwZWNpZmllZCBrZXk7IG90aGVyd2lzZSwgbGlzdCBhbGwgb3V0c3RhbmRpbmcgcmVxdWVzdHMgZm9yIHRoZSBzcGVjaWZpZWQgdXNlci5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSB1c2VySWQgT3B0aW9uYWwgdXNlciBJRC4gSWYgb210dGVkLCB1c2VzIHRoZSBjdXJyZW50IHVzZXIncyBJRC4gT25seSBvcmcgb3duZXJzIGNhbiBsaXN0IHVzZXItZXhwb3J0IHJlcXVlc3RzIGZvciB1c2VycyBvdGhlciB0aGFuIHRoZW1zZWx2ZXMuXG4gICAqIEBwYXJhbSB7UGFnZU9wdHM/fSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtQYWdpbmF0b3I8VXNlckV4cG9ydExpc3RSZXNwb25zZSwgVXNlckV4cG9ydEluaXRSZXNwb25zZT59IFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHJlc3VsdCBzZXQuXG4gICAqL1xuICB1c2VyRXhwb3J0TGlzdChcbiAgICBrZXlJZD86IHN0cmluZyxcbiAgICB1c2VySWQ/OiBzdHJpbmcsXG4gICAgcGFnZT86IFBhZ2VPcHRzLFxuICApOiBQYWdpbmF0b3I8VXNlckV4cG9ydExpc3RSZXNwb25zZSwgVXNlckV4cG9ydEluaXRSZXNwb25zZT4ge1xuICAgIGNvbnN0IGxpc3RGbiA9IGFzeW5jIChxdWVyeTogUGFnZVF1ZXJ5QXJncykgPT4ge1xuICAgICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJ1c2VyRXhwb3J0TGlzdFwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0sXG4gICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgICAuLi5xdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICBsaXN0Rm4sXG4gICAgICAocikgPT4gci5leHBvcnRfcmVxdWVzdHMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBrZXktaWQgY29ycmVzcG9uZGluZyB0byB0aGUgdXNlci1leHBvcnQgcmVxdWVzdCB0byBkZWxldGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gdXNlcklkIE9wdGlvbmFsIHVzZXIgSUQuIElmIG9taXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGRlbGV0ZSB1c2VyLWV4cG9ydCByZXF1ZXN0cyBmb3IgdXNlcnMgb3RoZXIgdGhhbiB0aGVtc2VsdmVzLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydERlbGV0ZShrZXlJZDogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVzZXJFeHBvcnREZWxldGVcIik7XG4gICAgYXdhaXQgY2xpZW50LmRlbChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9leHBvcnRcIiwge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0sXG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBrZXktaWQgZm9yIHdoaWNoIHRvIGluaXRpYXRlIGFuIGV4cG9ydC5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVzZXJFeHBvcnRJbml0UmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydEluaXQoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdCxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VXNlckV4cG9ydEluaXRSZXNwb25zZT4+IHtcbiAgICBjb25zdCBpbml0Rm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVzZXJFeHBvcnRJbml0XCIpO1xuICAgICAgcmV0dXJuIGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHsga2V5X2lkOiBrZXlJZCB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShpbml0Rm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBrZXktaWQgZm9yIHdoaWNoIHRvIGluaXRpYXRlIGFuIGV4cG9ydC5cbiAgICogQHBhcmFtIHtDcnlwdG9LZXl9IHB1YmxpY0tleSBUaGUgTklTVCBQLTI1NiBwdWJsaWMga2V5IHRvIHdoaWNoIHRoZSBleHBvcnQgd2lsbCBiZSBlbmNyeXB0ZWQuIFRoaXMgc2hvdWxkIGJlIHRoZSBgcHVibGljS2V5YCBwcm9wZXJ0eSBvZiBhIHZhbHVlIHJldHVybmVkIGJ5IGB1c2VyRXhwb3J0S2V5Z2VuYC5cbiAgICogQHBhcmFtIHtNZmFSZWNlaXB0fSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVzZXJFeHBvcnRDb21wbGV0ZShcbiAgICBrZXlJZDogc3RyaW5nLFxuICAgIHB1YmxpY0tleTogQ3J5cHRvS2V5LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZT4+IHtcbiAgICAvLyBiYXNlNjQtZW5jb2RlIHRoZSBwdWJsaWMga2V5XG4gICAgY29uc3Qgc3VidGxlID0gYXdhaXQgbG9hZFN1YnRsZUNyeXB0bygpO1xuICAgIGNvbnN0IHB1YmxpY0tleUI2NCA9IGVuY29kZVRvQmFzZTY0KEJ1ZmZlci5mcm9tKGF3YWl0IHN1YnRsZS5leHBvcnRLZXkoXCJyYXdcIiwgcHVibGljS2V5KSkpO1xuXG4gICAgLy8gbWFrZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IGNvbXBsZXRlRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLmNsaWVudChcInVzZXJFeHBvcnRDb21wbGV0ZVwiKTtcbiAgICAgIHJldHVybiBhd2FpdCBjbGllbnQucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLm9yZ0lkIH0gfSxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgcHVibGljX2tleTogcHVibGljS2V5QjY0LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShjb21wbGV0ZUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNSVNDOiBoZWFydGJlYXQoKVxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICpcbiAgICogQHJldHVybiB7IFByb21pc2U8dm9pZD4gfSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBoZWFydGJlYXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgdGhpcy5jbGllbnQoXCJjdWJlM3NpZ25lckhlYXJ0YmVhdFwiKTtcbiAgICBhd2FpdCBjbGllbnQucG9zdChcIi92MS9vcmcve29yZ19pZH0vY3ViZTNzaWduZXIvaGVhcnRiZWF0XCIsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5vcmdJZCB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG59XG5cbi8qKlxuICogQ2xpZW50IHRvIHVzZSB0byBzZW5kIHJlcXVlc3RzIHRvIEN1YmVTaWduZXIgc2VydmljZXNcbiAqIHdoZW4gYXV0aGVudGljYXRpbmcgdXNpbmcgYW4gT0lEQyB0b2tlbi5cbiAqL1xuZXhwb3J0IGNsYXNzIE9pZGNDbGllbnQge1xuICByZWFkb25seSAjZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSAjY2xpZW50OiBDbGllbnQ7XG4gIHJlYWRvbmx5ICNyZXRyeVNldHRpbmdzPzogUmV0cnlTZXR0aW5ncztcblxuICAvKipcbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBDdWJlU2lnbmVyIGRlcGxveW1lbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRhcmdldCBvcmdhbml6YXRpb24gSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9pZGNUb2tlbiBVc2VyJ3MgT0lEQyB0b2tlblxuICAgKiBAcGFyYW0ge1JldHJ5U2V0dGluZ3N9IHJldHJ5U2V0dGluZ3MgUmV0cnkgc2V0dGluZ3MuIEJ5IGRlZmF1bHQsIHJldHJpZXMgMyB0aW1lcywgc2xlZXBpbmcgMTAwbXNcbiAgICogIGFmdGVyIHRoZSBmaXJzdCBmYWlsZWQgYXR0ZW1wdCwgMjAwbXMgYWZ0ZXIgdGhlIHNlY29uZCwgYW5kIGZpbmFsbHkgNDAwbXMgYWZ0ZXIgdGhlIHRoaXJkLlxuICAgKi9cbiAgY29uc3RydWN0b3IoZW52OiBFbnZJbnRlcmZhY2UsIG9yZ0lkOiBzdHJpbmcsIG9pZGNUb2tlbjogc3RyaW5nLCByZXRyeVNldHRpbmdzPzogUmV0cnlTZXR0aW5ncykge1xuICAgIHRoaXMuI29yZ0lkID0gb3JnSWQ7XG4gICAgdGhpcy4jZW52ID0gZW52O1xuICAgIHRoaXMuI2NsaWVudCA9IGNyZWF0ZUh0dHBDbGllbnQoZW52LlNpZ25lckFwaVJvb3QsIG9pZGNUb2tlbik7XG4gICAgdGhpcy4jcmV0cnlTZXR0aW5ncyA9IHJldHJ5U2V0dGluZ3M7XG4gIH1cblxuICAvKipcbiAgICogSFRUUCBjbGllbnQgcmVzdHJpY3RlZCB0byBhIHNpbmdsZSBvcGVyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB7T3B9IG9wIFRoZSBvcGVyYXRpb24gdG8gcmVzdHJpY3QgdGhlIGNsaWVudCB0b1xuICAgKiBAcmV0dXJuIHtPcENsaWVudDxPcD59IFRoZSBjbGllbnQgcmVzdHJpY3RlZCB0byB7QGxpbmsgb3B9XG4gICAqL1xuICBwcml2YXRlIGNsaWVudDxPcCBleHRlbmRzIGtleW9mIG9wZXJhdGlvbnM+KG9wOiBPcCk6IE9wQ2xpZW50PE9wPiB7XG4gICAgcmV0dXJuIG5ldyBPcENsaWVudChvcCwgdGhpcy4jY2xpZW50LCBuZXcgRXZlbnRFbWl0dGVyKFtdKSwgdGhpcy4jcmV0cnlTZXR0aW5ncyk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBDdWJlU2lnbmVyIHNlc3Npb24gdG9rZW4uXG4gICAqIEBwYXJhbSB7TGlzdDxzdHJpbmc+fSBzY29wZXMgVGhlIHNjb3BlcyBmb3IgdGhlIG5ldyBzZXNzaW9uXG4gICAqIEBwYXJhbSB7UmF0Y2hldENvbmZpZ30gbGlmZXRpbWVzIExpZmV0aW1lcyBvZiB0aGUgbmV3IHNlc3Npb24uXG4gICAqIEBwYXJhbSB7TWZhUmVjZWlwdH0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdCAoaWQgKyBjb25maXJtYXRpb24gY29kZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2lnbmVyU2Vzc2lvbkRhdGE+Pn0gVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGUoXG4gICAgc2NvcGVzOiBBcnJheTxzdHJpbmc+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHQsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNpZ25lclNlc3Npb25EYXRhPj4ge1xuICAgIGNvbnN0IGxvZ2luRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSB0aGlzLmNsaWVudChcIm9pZGNBdXRoXCIpO1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGNsaWVudC5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgdG9rZW5zOiBsaWZldGltZXMsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShcbiAgICAgICAgZGF0YSxcbiAgICAgICAgKHNlc3Npb25JbmZvKSA9PlxuICAgICAgICAgIDxTaWduZXJTZXNzaW9uRGF0YT57XG4gICAgICAgICAgICBlbnY6IHtcbiAgICAgICAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogdGhpcy4jZW52LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9yZ19pZDogdGhpcy4jb3JnSWQsXG4gICAgICAgICAgICB0b2tlbjogc2Vzc2lvbkluZm8udG9rZW4sXG4gICAgICAgICAgICBwdXJwb3NlOiBcInNpZ24gdmlhIG9pZGNcIixcbiAgICAgICAgICAgIHNlc3Npb25faW5mbzogc2Vzc2lvbkluZm8uc2Vzc2lvbl9pbmZvLFxuICAgICAgICAgIH0sXG4gICAgICApO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShsb2dpbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBhbiBPSURDIHRva2VuIGZvciBhIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPElkZW50aXR5UHJvb2Y+fSBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlQcm92ZSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBjbGllbnQgPSB0aGlzLmNsaWVudChcImNyZWF0ZVByb29mT2lkY1wiKTtcbiAgICByZXR1cm4gYXdhaXQgY2xpZW50LnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlL29pZGNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgfSk7XG4gIH1cbn1cblxuY29uc3QgZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTogU2lnbmVyU2Vzc2lvbkxpZmV0aW1lID0ge1xuICBzZXNzaW9uOiA2MDQ4MDAsIC8vIDEgd2Vla1xuICBhdXRoOiAzMDAsIC8vIDUgbWluXG4gIHJlZnJlc2g6IDg2NDAwLCAvLyAxIGRheVxuICBncmFjZTogMzAsIC8vIHNlY29uZHNcbn07XG4iXX0=