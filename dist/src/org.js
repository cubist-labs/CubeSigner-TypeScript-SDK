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
var _Org_cs, _Org_id;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Org = void 0;
const _1 = require(".");
const util_1 = require("./util");
const key_1 = require("./key");
const role_1 = require("./role");
/** An organization. */
class Org {
    /**
     * @description The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     * */
    get id() {
        return __classPrivateFieldGet(this, _Org_id, "f");
    }
    /** Human-readable name for the org */
    async name() {
        const data = await this.fetch();
        return data.name ?? undefined;
    }
    /** Set the human-readable name for the org.
     * @param {string} name The new human-readable name for the org (must be alphanumeric).
     * @example my_org_name
     * */
    async setName(name) {
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
            throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
        }
        await this.update({ name });
    }
    /** Is the org enabled? */
    async enabled() {
        const data = await this.fetch();
        return data.enabled;
    }
    /** Enable the org. */
    async enable() {
        await this.update({ enabled: true });
    }
    /** Disable the org. */
    async disable() {
        await this.update({ enabled: false });
    }
    /** Get the policy for the org. */
    async policy() {
        const data = await this.fetch();
        return (data.policy ?? []);
    }
    /** Set the policy for the org.
     * @param {OrgPolicy[]} policy The new policy for the org.
     * */
    async setPolicy(policy) {
        const p = policy;
        await this.update({ policy: p });
    }
    /** Create a new signing key.
     * @param {KeyType} type The type of key to create.
     * @param {string?} ownerId The owner of the key. Defaults to the session's user.
     * @return {Key[]} The new keys.
     * */
    async createKey(type, ownerId) {
        return (await key_1.Key.createKeys(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, type, 1, ownerId))[0];
    }
    /** Create new signing keys.
     * @param {KeyType} type The type of key to create.
     * @param {nummber} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     * */
    async createKeys(type, count, ownerId) {
        return key_1.Key.createKeys(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, type, count, ownerId);
    }
    /**
     * Derives a key of the given type using the given derivation path and mnemonic.
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {KeyType} type Type of key to derive from the mnemonic.
     * @param {string} derivationPath Mnemonic derivation path used to generate new key.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key} newly derived key.
     */
    async deriveKey(type, derivationPath, mnemonicId) {
        return (await key_1.Key.deriveKeys(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, type, [derivationPath], mnemonicId))[0];
    }
    /**
     * Derives a set of keys of the given type using the given derivation paths and mnemonic.
     *
     * The owner of the derived keys will be the owner of the mnemonic.
     *
     * @param {KeyType} type Type of key to derive from the mnemonic.
     * @param {string[]} derivationPaths Mnemonic derivation paths used to generate new key.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key[]} newly derived keys.
     */
    async deriveKeys(type, derivationPaths, mnemonicId) {
        return await key_1.Key.deriveKeys(__classPrivateFieldGet(this, _Org_cs, "f"), __classPrivateFieldGet(this, _Org_id, "f"), type, derivationPaths, mnemonicId);
    }
    /**
     * Create a new user in the organization and sends an invitation to that user
     * @param {string} email Email of the user
     * @param {string} name The full name of the user
     */
    async createUser(email, name) {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).post("/v0/org/{org_id}/invite", {
            params: { path: { org_id: this.id } },
            body: {
                email,
                name,
                skip_email: false,
            },
            parseAs: "json",
        });
        (0, util_1.assertOk)(resp);
    }
    /**
     * Create a new OIDC user
     * @param {OidcIdentity} identity The identity of the OIDC user
     * @param {string} email Email of the OIDC user
     * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
     * @return {string} User id of the new user
     */
    async createOidcUser(identity, email, opts = {}) {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).post("/v0/org/{org_id}/users", {
            params: { path: { org_id: this.id } },
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
     * Delete an existing OIDC user
     * @param {OidcIdentity} identity The identity of the OIDC user
     */
    async deleteOidcUser(identity) {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).del("/v0/org/{org_id}/users/oidc", {
            params: { path: { org_id: this.id } },
            body: identity,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Checks if a given proof of OIDC authentication is valid.
     *
     * @param {IdentityProof} proof The proof of authentication.
     */
    async verifyIdentity(proof) {
        await __classPrivateFieldGet(this, _Org_cs, "f").verifyIdentity(this.id, proof);
    }
    /**
     * List users in the organization
     * @return {UserIdInfo[]} List of users
     */
    async users() {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).get("/v0/org/{org_id}/users", {
            params: { path: { org_id: this.id } },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp).users;
    }
    /** Get a key by id.
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     * */
    async getKey(keyId) {
        return await key_1.Key.getKey(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, keyId);
    }
    /** Get all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Key} The key.
     * */
    async keys(type, page) {
        page ??= _1.Page.default();
        const listFn = async (query) => {
            const client = await __classPrivateFieldGet(this, _Org_cs, "f").management();
            const resp = await client.get("/v0/org/{org_id}/keys", {
                params: {
                    path: { org_id: this.id },
                    query: {
                        key_type: type,
                        ...query,
                    },
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        const p = new _1.Paginator(page, listFn, (r) => r.keys, (r) => r.last_evaluated_key);
        const keys = await p.fetch();
        return keys.map((k) => new key_1.Key(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, k));
    }
    /** Create a new role.
     * @param {string?} name The name of the role.
     * @return {Role} The new role.
     * */
    async createRole(name) {
        return role_1.Role.createRole(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, name);
    }
    /** Get a role by id or name.
     * @param {string} roleId The id or name of the role to get.
     * @return {Role} The role.
     * */
    async getRole(roleId) {
        return role_1.Role.getRole(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, roleId);
    }
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Role[]} The roles.
     * */
    async listRoles(page) {
        return Org.roles(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, page);
    }
    /** List all users in the org.
     * @return {User[]} The users.
     * */
    async listUsers() {
        return Org.users(__classPrivateFieldGet(this, _Org_cs, "f"), this.id);
    }
    /**
     * Get a pending MFA request by its id.
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     *
     * @deprecated Use {@link getMfaInfo()} instead.
     */
    async mfaGet(mfaId) {
        return await this.getMfaInfo(mfaId);
    }
    /**
     * Approve a pending MFA request.
     *
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     *
     * @deprecated Use {@link approveMfaRequest()} instead.
     */
    async mfaApprove(mfaId) {
        return await this.approveMfaRequest(mfaId);
    }
    /**
     * Get a pending MFA request by its id.
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    async getMfaInfo(mfaId) {
        return await __classPrivateFieldGet(this, _Org_cs, "f").mfaGet(this.id, mfaId);
    }
    /**
     * List pending MFA requests accessible to the current user.
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    async listMfaInfos() {
        return await __classPrivateFieldGet(this, _Org_cs, "f").mfaList(this.id);
    }
    /**
     * Approve a pending MFA request.
     *
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    async approveMfaRequest(mfaId) {
        return Org.mfaApprove(__classPrivateFieldGet(this, _Org_cs, "f"), __classPrivateFieldGet(this, _Org_id, "f"), mfaId);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /** Create a new org.
     * @param {CubeSigner} cs The CubeSigner instance.
     * @param {OrgInfo} data The JSON response from the API server.
     * @internal
     * */
    constructor(cs, data) {
        _Org_cs.set(this, void 0);
        /**
         * The ID of the organization.
         * @example Org#124dfe3e-3bbd-487d-80c0-53c55e8ab87a
         */
        _Org_id.set(this, void 0);
        __classPrivateFieldSet(this, _Org_cs, cs, "f");
        __classPrivateFieldSet(this, _Org_id, data.org_id, "f");
    }
    /**
     * Approve a pending MFA request.
     *
     * @param {CubeSigner} cs The CubeSigner instance to use for requests
     * @param {string} orgId The org id of the MFA request
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    static async mfaApprove(cs, orgId, mfaId) {
        return await cs.mfaApprove(orgId, mfaId);
    }
    /** Fetch org info.
     * @return {OrgInfo} The org info.
     * */
    async fetch() {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).get("/v0/org/{org_id}", {
            params: { path: { org_id: this.id } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data;
    }
    /** Update the org.
     * @param {UpdateOrgRequest} request The JSON request to send to the API server.
     * @return {UpdateOrgResponse} The JSON response from the API server.
     * */
    async update(request) {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).patch("/v0/org/{org_id}", {
            params: { path: { org_id: this.id } },
            body: request,
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp);
    }
    /** List roles.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Role[]} Org roles.
     * @internal
     * */
    static async roles(cs, orgId, page) {
        page ??= _1.Page.default();
        const listFn = async (query) => {
            const resp = await (await cs.management()).get("/v0/org/{org_id}/roles", {
                params: {
                    path: { org_id: orgId },
                    query,
                },
                parseAs: "json",
            });
            return (0, util_1.assertOk)(resp);
        };
        const p = new _1.Paginator(page, listFn, (u) => u.roles, (u) => u.last_evaluated_key);
        const roles = await p.fetch();
        return roles.map((r) => new role_1.Role(cs, orgId, r));
    }
    /** List users.
     * @param {CubeSigner} cs The CubeSigner instance to use for signing.
     * @param {string} orgId The id of the organization to which the role belongs.
     * @return {User[]} Org users.
     * @internal
     * */
    static async users(cs, orgId) {
        const resp = await (await cs.management()).get("/v0/org/{org_id}/users", {
            params: { path: { org_id: orgId } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data.users;
    }
}
exports.Org = Org;
_Org_cs = new WeakMap(), _Org_id = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBQSx3QkFRVztBQUVYLGlDQUFrQztBQUNsQywrQkFBcUM7QUFDckMsaUNBQW1EO0FBOERuRCx1QkFBdUI7QUFDdkIsTUFBYSxHQUFHO0lBUWQ7OztTQUdLO0lBQ0wsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLGVBQUksQ0FBQztJQUNsQixDQUFDO0lBRUQsc0NBQXNDO0lBQ3RDLEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7OztTQUdLO0lBQ0wsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFZO1FBQ3hCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdEMsTUFBTSxJQUFJLEtBQUssQ0FBQywrREFBK0QsQ0FBQyxDQUFDO1NBQ2xGO1FBQ0QsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQsMEJBQTBCO0lBQzFCLEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxzQkFBc0I7SUFDdEIsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsdUJBQXVCO0lBQ3ZCLEtBQUssQ0FBQyxPQUFPO1FBQ1gsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELGtDQUFrQztJQUNsQyxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBMkIsQ0FBQztJQUN2RCxDQUFDO0lBRUQ7O1NBRUs7SUFDTCxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQW1CO1FBQ2pDLE1BQU0sQ0FBQyxHQUFHLE1BQTRDLENBQUM7UUFDdkQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7O1NBSUs7SUFDTCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQWEsRUFBRSxPQUFnQjtRQUM3QyxPQUFPLENBQUMsTUFBTSxTQUFHLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksZUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFFRDs7Ozs7U0FLSztJQUNMLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBYSxFQUFFLEtBQWEsRUFBRSxPQUFnQjtRQUM3RCxPQUFPLFNBQUcsQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ2pFLENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLElBQWEsRUFBRSxjQUFzQixFQUFFLFVBQWtCO1FBQ3ZFLE9BQU8sQ0FBQyxNQUFNLFNBQUcsQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFhLEVBQUUsZUFBeUIsRUFBRSxVQUFrQjtRQUMzRSxPQUFPLE1BQU0sU0FBRyxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLGVBQUksRUFBRSx1QkFBQSxJQUFJLGVBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3JGLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFhLEVBQUUsSUFBWTtRQUMxQyxNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsVUFBVSxFQUFFLENBQzVCLENBQUMsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1lBQ2hDLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDckMsSUFBSSxFQUFFO2dCQUNKLEtBQUs7Z0JBQ0wsSUFBSTtnQkFDSixVQUFVLEVBQUUsS0FBSzthQUNsQjtZQUNELE9BQU8sRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQztRQUNILElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUNsQixRQUFzQixFQUN0QixLQUFhLEVBQ2IsT0FBOEIsRUFBRTtRQUVoQyxNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsVUFBVSxFQUFFLENBQzVCLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFO1lBQy9CLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDckMsSUFBSSxFQUFFO2dCQUNKLFFBQVE7Z0JBQ1IsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksT0FBTztnQkFDaEMsS0FBSyxFQUFFLEtBQUs7Z0JBQ1osVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSTthQUNuQztZQUNELE9BQU8sRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQXNCO1FBQ3pDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FDakIsTUFBTSx1QkFBQSxJQUFJLGVBQUksQ0FBQyxVQUFVLEVBQUUsQ0FDNUIsQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUU7WUFDbkMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUNyQyxJQUFJLEVBQUUsUUFBUTtZQUNkLE9BQU8sRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQW9CO1FBQ3ZDLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUNqQixNQUFNLHVCQUFBLElBQUksZUFBSSxDQUFDLFVBQVUsRUFBRSxDQUM1QixDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRTtZQUM5QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ3JDLE9BQU8sRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7O1NBR0s7SUFDTCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQWE7UUFDeEIsT0FBTyxNQUFNLFNBQUcsQ0FBQyxNQUFNLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7Ozs7U0FJSztJQUNMLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBYyxFQUFFLElBQWU7UUFDeEMsSUFBSSxLQUFLLE9BQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsS0FBb0IsRUFBRSxFQUFFO1lBQzVDLE1BQU0sTUFBTSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDM0MsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFO2dCQUNyRCxNQUFNLEVBQUU7b0JBQ04sSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7b0JBQ3pCLEtBQUssRUFBRTt3QkFDTCxRQUFRLEVBQUUsSUFBSTt3QkFDZCxHQUFHLEtBQUs7cUJBQ1Q7aUJBQ0Y7Z0JBQ0QsT0FBTyxFQUFFLE1BQU07YUFDaEIsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN4QixDQUFDLENBQUM7UUFDRixNQUFNLENBQUMsR0FBRyxJQUFJLFlBQVMsQ0FDckIsSUFBSSxFQUNKLE1BQU0sRUFDTixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFDYixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUM1QixDQUFDO1FBQ0YsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFNBQUcsQ0FBQyx1QkFBQSxJQUFJLGVBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7U0FHSztJQUNMLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBYTtRQUM1QixPQUFPLFdBQUksQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQ7OztTQUdLO0lBQ0wsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFjO1FBQzFCLE9BQU8sV0FBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxJQUFJLGVBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7Ozs7U0FLSztJQUNMLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBZTtRQUM3QixPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7O1NBRUs7SUFDTCxLQUFLLENBQUMsU0FBUztRQUNiLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyx1QkFBQSxJQUFJLGVBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBYTtRQUN4QixPQUFPLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBYTtRQUM1QixPQUFPLE1BQU0sSUFBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFhO1FBQzVCLE9BQU8sTUFBTSx1QkFBQSxJQUFJLGVBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFlBQVk7UUFDaEIsT0FBTyxNQUFNLHVCQUFBLElBQUksZUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQWE7UUFDbkMsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksZUFBSSxFQUFFLHVCQUFBLElBQUksZUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7OztTQUlLO0lBQ0wsWUFBWSxFQUFjLEVBQUUsSUFBYTtRQXRVaEMsMEJBQWdCO1FBQ3pCOzs7V0FHRztRQUNNLDBCQUFZO1FBa1VuQix1QkFBQSxJQUFJLFdBQU8sRUFBRSxNQUFBLENBQUM7UUFDZCx1QkFBQSxJQUFJLFdBQU8sSUFBSSxDQUFDLE1BQU0sTUFBQSxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsTUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBYyxFQUFFLEtBQWEsRUFBRSxLQUFhO1FBQ2xFLE9BQU8sTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQ7O1NBRUs7SUFDRyxLQUFLLENBQUMsS0FBSztRQUNqQixNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsVUFBVSxFQUFFLENBQzVCLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFO1lBQ3hCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDckMsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7OztTQUdLO0lBQ0csS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUF5QjtRQUM1QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsVUFBVSxFQUFFLENBQzVCLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFO1lBQzFCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDckMsSUFBSSxFQUFFLE9BQU87WUFDYixPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7O1NBTUs7SUFDRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFjLEVBQUUsS0FBYSxFQUFFLElBQWU7UUFDdkUsSUFBSSxLQUFLLE9BQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QixNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsS0FBb0IsRUFBRSxFQUFFO1lBQzVDLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FDakIsTUFBTSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQ3RCLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFO2dCQUM5QixNQUFNLEVBQUU7b0JBQ04sSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRTtvQkFDdkIsS0FBSztpQkFDTjtnQkFDRCxPQUFPLEVBQUUsTUFBTTthQUNoQixDQUFDLENBQUM7WUFDSCxPQUFPLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztRQUNGLE1BQU0sQ0FBQyxHQUFHLElBQUksWUFBUyxDQUNyQixJQUFJLEVBQ0osTUFBTSxFQUNOLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUNkLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQzVCLENBQUM7UUFDRixNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUM5QixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFXLEVBQUUsRUFBRSxDQUFDLElBQUksV0FBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQ7Ozs7O1NBS0s7SUFDRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFjLEVBQUUsS0FBYTtRQUN0RCxNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sRUFBRSxDQUFDLFVBQVUsRUFBRSxDQUN0QixDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRTtZQUM5QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbkMsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXBhRCxrQkFvYUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBDdWJlU2lnbmVyLFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgSWRlbnRpdHlQcm9vZixcbiAgUGFnZU9wdHMsXG4gIFBhZ2UsXG4gIFBhZ2VRdWVyeUFyZ3MsXG4gIFBhZ2luYXRvcixcbn0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGNvbXBvbmVudHMsIHBhdGhzIH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBhc3NlcnRPayB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB7IEtleVR5cGUsIEtleSB9IGZyb20gXCIuL2tleVwiO1xuaW1wb3J0IHsgTWZhUG9saWN5LCBSb2xlLCBSb2xlSW5mbyB9IGZyb20gXCIuL3JvbGVcIjtcblxuLyoqIE9yZ2FuaXphdGlvbiBpZCAqL1xuZXhwb3J0IHR5cGUgT3JnSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmctd2lkZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIE9yZ1BvbGljeSA9XG4gIHwgU291cmNlSXBBbGxvd2xpc3RQb2xpY3lcbiAgfCBPaWRjQXV0aFNvdXJjZXNQb2xpY3lcbiAgfCBPcmlnaW5BbGxvd2xpc3RQb2xpY3lcbiAgfCBNYXhEYWlseVVuc3Rha2VQb2xpY3k7XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gYWxsb3dsaXN0IG9mIE9JREMgSXNzdWVycyBhbmQgYXVkaWVuY2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIGludG8gdGhpcyBvcmcuXG4gKiBAZXhhbXBsZSB7XCJPaWRjQXV0aFNvdXJjZXNcIjogeyBcImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbVwiOiBbIFwiMTIzNC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbVwiIF19fVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoU291cmNlc1BvbGljeSB7XG4gIE9pZGNBdXRoU291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xufVxuXG4vKipcbiAqIE9ubHkgYWxsb3cgcmVxdWVzdHMgZnJvbSB0aGUgc3BlY2lmaWVkIG9yaWdpbnMuXG4gKiBAZXhhbXBsZSB7XCJPcmlnaW5BbGxvd2xpc3RcIjogXCIqXCJ9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JpZ2luQWxsb3dsaXN0UG9saWN5IHtcbiAgT3JpZ2luQWxsb3dsaXN0OiBzdHJpbmdbXSB8IFwiKlwiO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHNpZ25pbmcgdG8gc3BlY2lmaWMgc291cmNlIElQIGFkZHJlc3Nlcy5cbiAqIEBleGFtcGxlIHtcIlNvdXJjZUlwQWxsb3dsaXN0XCI6IFtcIjEwLjEuMi4zLzhcIiwgXCIxNjkuMjU0LjE3LjEvMTZcIl19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlSXBBbGxvd2xpc3RQb2xpY3kge1xuICBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIG51bWJlciBvZiB1bnN0YWtlcyBwZXIgZGF5LlxuICogQGV4YW1wbGUge1wiTWF4RGFpbHlVbnN0YWtlXCI6IDUgfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1heERhaWx5VW5zdGFrZVBvbGljeSB7XG4gIE1heERhaWx5VW5zdGFrZTogbnVtYmVyO1xufVxuXG50eXBlIE9yZ0luZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIk9yZ0luZm9cIl07XG50eXBlIFVzZXJJZEluZm8gPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlVzZXJJZEluZm9cIl07XG50eXBlIFVwZGF0ZU9yZ1JlcXVlc3QgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH1cIl1bXCJwYXRjaFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG50eXBlIFVwZGF0ZU9yZ1Jlc3BvbnNlID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9XCJdW1wicGF0Y2hcIl1bXCJyZXNwb25zZXNcIl1bXCIyMDBcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuZXhwb3J0IHR5cGUgT2lkY0lkZW50aXR5ID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJPSURDSWRlbnRpdHlcIl07XG5leHBvcnQgdHlwZSBNZW1iZXJSb2xlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJNZW1iZXJSb2xlXCJdO1xuXG4vKiogT3B0aW9ucyBmb3IgYSBuZXcgT0lEQyB1c2VyICovXG5leHBvcnQgaW50ZXJmYWNlIENyZWF0ZU9pZGNVc2VyT3B0aW9ucyB7XG4gIC8qKiBUaGUgcm9sZSBvZiBhbiBPSURDIHVzZXIsIGRlZmF1bHQgaXMgXCJBbGllblwiICovXG4gIG1lbWJlclJvbGU/OiBNZW1iZXJSb2xlO1xuICAvKiogT3B0aW9uYWwgTUZBIHBvbGljeSB0byBhc3NvY2lhdGUgd2l0aCB0aGUgdXNlciBhY2NvdW50ICovXG4gIG1mYVBvbGljeT86IE1mYVBvbGljeTtcbn1cblxuLyoqIEFuIG9yZ2FuaXphdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBPcmcge1xuICByZWFkb25seSAjY3M6IEN1YmVTaWduZXI7XG4gIC8qKlxuICAgKiBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICogQGV4YW1wbGUgT3JnIzEyNGRmZTNlLTNiYmQtNDg3ZC04MGMwLTUzYzU1ZThhYjg3YVxuICAgKi9cbiAgcmVhZG9ubHkgI2lkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBUaGUgb3JnIGlkXG4gICAqIEBleGFtcGxlIE9yZyNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICogKi9cbiAgZ2V0IGlkKCk6IE9yZ0lkIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKiogSHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBTZXQgdGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuZXcgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAobXVzdCBiZSBhbHBoYW51bWVyaWMpLlxuICAgKiBAZXhhbXBsZSBteV9vcmdfbmFtZVxuICAgKiAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG5hbWUgfSk7XG4gIH1cblxuICAvKiogSXMgdGhlIG9yZyBlbmFibGVkPyAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgT3JnUG9saWN5W107XG4gIH1cblxuICAvKiogU2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7T3JnUG9saWN5W119IHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogT3JnUG9saWN5W10pIHtcbiAgICBjb25zdCBwID0gcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W107XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3k6IHAgfSk7XG4gIH1cblxuICAvKiogQ3JlYXRlIGEgbmV3IHNpZ25pbmcga2V5LlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5LiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEByZXR1cm4ge0tleVtdfSBUaGUgbmV3IGtleXMuXG4gICAqICovXG4gIGFzeW5jIGNyZWF0ZUtleSh0eXBlOiBLZXlUeXBlLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICByZXR1cm4gKGF3YWl0IEtleS5jcmVhdGVLZXlzKHRoaXMuI2NzLCB0aGlzLmlkLCB0eXBlLCAxLCBvd25lcklkKSlbMF07XG4gIH1cblxuICAvKiogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICogKi9cbiAgYXN5bmMgY3JlYXRlS2V5cyh0eXBlOiBLZXlUeXBlLCBjb3VudDogbnVtYmVyLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIHJldHVybiBLZXkuY3JlYXRlS2V5cyh0aGlzLiNjcywgdGhpcy5pZCwgdHlwZSwgY291bnQsIG93bmVySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZXMgYSBrZXkgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aCBhbmQgbW5lbW9uaWMuXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXkgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gZGVyaXZhdGlvblBhdGggTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRoIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljSWQgbWF0ZXJpYWxJZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIEByZXR1cm4ge0tleX0gbmV3bHkgZGVyaXZlZCBrZXkuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXkodHlwZTogS2V5VHlwZSwgZGVyaXZhdGlvblBhdGg6IHN0cmluZywgbW5lbW9uaWNJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICByZXR1cm4gKGF3YWl0IEtleS5kZXJpdmVLZXlzKHRoaXMuI2NzLCB0aGlzLmlkLCB0eXBlLCBbZGVyaXZhdGlvblBhdGhdLCBtbmVtb25pY0lkKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlcyBhIHNldCBvZiBrZXlzIG9mIHRoZSBnaXZlbiB0eXBlIHVzaW5nIHRoZSBnaXZlbiBkZXJpdmF0aW9uIHBhdGhzIGFuZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleXMgd2lsbCBiZSB0aGUgb3duZXIgb2YgdGhlIG1uZW1vbmljLlxuICAgKlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVHlwZSBvZiBrZXkgdG8gZGVyaXZlIGZyb20gdGhlIG1uZW1vbmljLlxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBkZXJpdmF0aW9uUGF0aHMgTW5lbW9uaWMgZGVyaXZhdGlvbiBwYXRocyB1c2VkIHRvIGdlbmVyYXRlIG5ldyBrZXkuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtbmVtb25pY0lkIG1hdGVyaWFsSWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMgZGVyaXZlS2V5cyh0eXBlOiBLZXlUeXBlLCBkZXJpdmF0aW9uUGF0aHM6IHN0cmluZ1tdLCBtbmVtb25pY0lkOiBzdHJpbmcpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IEtleS5kZXJpdmVLZXlzKHRoaXMuI2NzLCB0aGlzLiNpZCwgdHlwZSwgZGVyaXZhdGlvblBhdGhzLCBtbmVtb25pY0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kcyBhbiBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZW1haWwgRW1haWwgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIGZ1bGwgbmFtZSBvZiB0aGUgdXNlclxuICAgKi9cbiAgYXN5bmMgY3JlYXRlVXNlcihlbWFpbDogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5wb3N0KFwiL3YwL29yZy97b3JnX2lkfS9pbnZpdGVcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgZW1haWwsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIHNraXBfZW1haWw6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXJcbiAgICogQHBhcmFtIHtPaWRjSWRlbnRpdHl9IGlkZW50aXR5IFRoZSBpZGVudGl0eSBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbWFpbCBFbWFpbCBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSB7Q3JlYXRlT2lkY1VzZXJPcHRpb25zfSBvcHRzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgbmV3IE9JREMgdXNlcnNcbiAgICogQHJldHVybiB7c3RyaW5nfSBVc2VyIGlkIG9mIHRoZSBuZXcgdXNlclxuICAgKi9cbiAgYXN5bmMgY3JlYXRlT2lkY1VzZXIoXG4gICAgaWRlbnRpdHk6IE9pZGNJZGVudGl0eSxcbiAgICBlbWFpbDogc3RyaW5nLFxuICAgIG9wdHM6IENyZWF0ZU9pZGNVc2VyT3B0aW9ucyA9IHt9LFxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5pZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGlkZW50aXR5LFxuICAgICAgICByb2xlOiBvcHRzLm1lbWJlclJvbGUgPz8gXCJBbGllblwiLFxuICAgICAgICBlbWFpbDogZW1haWwsXG4gICAgICAgIG1mYV9wb2xpY3k6IG9wdHMubWZhUG9saWN5ID8/IG51bGwsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApLnVzZXJfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlclxuICAgKiBAcGFyYW0ge09pZGNJZGVudGl0eX0gaWRlbnRpdHkgVGhlIGlkZW50aXR5IG9mIHRoZSBPSURDIHVzZXJcbiAgICovXG4gIGFzeW5jIGRlbGV0ZU9pZGNVc2VyKGlkZW50aXR5OiBPaWRjSWRlbnRpdHkpIHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5kZWwoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzL29pZGNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIGJvZHk6IGlkZW50aXR5LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIHByb29mIG9mIE9JREMgYXV0aGVudGljYXRpb24gaXMgdmFsaWQuXG4gICAqXG4gICAqIEBwYXJhbSB7SWRlbnRpdHlQcm9vZn0gcHJvb2YgVGhlIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKi9cbiAgYXN5bmMgdmVyaWZ5SWRlbnRpdHkocHJvb2Y6IElkZW50aXR5UHJvb2YpIHtcbiAgICBhd2FpdCB0aGlzLiNjcy52ZXJpZnlJZGVudGl0eSh0aGlzLmlkLCBwcm9vZik7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEByZXR1cm4ge1VzZXJJZEluZm9bXX0gTGlzdCBvZiB1c2Vyc1xuICAgKi9cbiAgYXN5bmMgdXNlcnMoKTogUHJvbWlzZTxVc2VySWRJbmZvW10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5pZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCkudXNlcnM7XG4gIH1cblxuICAvKiogR2V0IGEga2V5IGJ5IGlkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SWQgVGhlIGlkIG9mIHRoZSBrZXkgdG8gZ2V0LlxuICAgKiBAcmV0dXJuIHtLZXl9IFRoZSBrZXkuXG4gICAqICovXG4gIGFzeW5jIGdldEtleShrZXlJZDogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICByZXR1cm4gYXdhaXQgS2V5LmdldEtleSh0aGlzLiNjcywgdGhpcy5pZCwga2V5SWQpO1xuICB9XG5cbiAgLyoqIEdldCBhbGwga2V5cyBpbiB0aGUgb3JnLlxuICAgKiBAcGFyYW0ge0tleVR5cGU/fSB0eXBlIE9wdGlvbmFsIGtleSB0eXBlIHRvIGZpbHRlciBsaXN0IGZvci5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7S2V5fSBUaGUga2V5LlxuICAgKiAqL1xuICBhc3luYyBrZXlzKHR5cGU/OiBLZXlUeXBlLCBwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgcGFnZSA/Pz0gUGFnZS5kZWZhdWx0KCk7XG4gICAgY29uc3QgbGlzdEZuID0gYXN5bmMgKHF1ZXJ5OiBQYWdlUXVlcnlBcmdzKSA9PiB7XG4gICAgICBjb25zdCBjbGllbnQgPSBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KCk7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgY2xpZW50LmdldChcIi92MC9vcmcve29yZ19pZH0va2V5c1wiLCB7XG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0sXG4gICAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICAgIGtleV90eXBlOiB0eXBlLFxuICAgICAgICAgICAgLi4ucXVlcnksXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIGNvbnN0IHAgPSBuZXcgUGFnaW5hdG9yKFxuICAgICAgcGFnZSxcbiAgICAgIGxpc3RGbixcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgcC5mZXRjaCgpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNjcywgdGhpcy5pZCwgaykpO1xuICB9XG5cbiAgLyoqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSBuZXcgcm9sZS5cbiAgICogKi9cbiAgYXN5bmMgY3JlYXRlUm9sZShuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgcmV0dXJuIFJvbGUuY3JlYXRlUm9sZSh0aGlzLiNjcywgdGhpcy5pZCwgbmFtZSk7XG4gIH1cblxuICAvKiogR2V0IGEgcm9sZSBieSBpZCBvciBuYW1lLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybiB7Um9sZX0gVGhlIHJvbGUuXG4gICAqICovXG4gIGFzeW5jIGdldFJvbGUocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICByZXR1cm4gUm9sZS5nZXRSb2xlKHRoaXMuI2NzLCB0aGlzLmlkLCByb2xlSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIHJvbGVzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm4ge1JvbGVbXX0gVGhlIHJvbGVzLlxuICAgKiAqL1xuICBhc3luYyBsaXN0Um9sZXMocGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxSb2xlW10+IHtcbiAgICByZXR1cm4gT3JnLnJvbGVzKHRoaXMuI2NzLCB0aGlzLmlkLCBwYWdlKTtcbiAgfVxuXG4gIC8qKiBMaXN0IGFsbCB1c2VycyBpbiB0aGUgb3JnLlxuICAgKiBAcmV0dXJuIHtVc2VyW119IFRoZSB1c2Vycy5cbiAgICogKi9cbiAgYXN5bmMgbGlzdFVzZXJzKCk6IFByb21pc2U8VXNlcklkSW5mb1tdPiB7XG4gICAgcmV0dXJuIE9yZy51c2Vycyh0aGlzLiNjcywgdGhpcy5pZCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIGdldE1mYUluZm8oKX0gaW5zdGVhZC5cbiAgICovXG4gIGFzeW5jIG1mYUdldChtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldE1mYUluZm8obWZhSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBhcHByb3ZlTWZhUmVxdWVzdCgpfSBpbnN0ZWFkLlxuICAgKi9cbiAgYXN5bmMgbWZhQXBwcm92ZShtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFwcHJvdmVNZmFSZXF1ZXN0KG1mYUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IGJ5IGl0cyBpZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBnZXRNZmFJbmZvKG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2NzLm1mYUdldCh0aGlzLmlkLCBtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm9bXT59IFRoZSBNRkEgcmVxdWVzdHMuXG4gICAqL1xuICBhc3luYyBsaXN0TWZhSW5mb3MoKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mb1tdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2NzLm1mYUxpc3QodGhpcy5pZCk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZU1mYVJlcXVlc3QobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gT3JnLm1mYUFwcHJvdmUodGhpcy4jY3MsIHRoaXMuI2lkLCBtZmFJZCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKiBDcmVhdGUgYSBuZXcgb3JnLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge09yZ0luZm99IGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIGNvbnN0cnVjdG9yKGNzOiBDdWJlU2lnbmVyLCBkYXRhOiBPcmdJbmZvKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLiNpZCA9IGRhdGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3IgcmVxdWVzdHNcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmcgaWQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIG1mYUFwcHJvdmUoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcsIG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IGNzLm1mYUFwcHJvdmUob3JnSWQsIG1mYUlkKTtcbiAgfVxuXG4gIC8qKiBGZXRjaCBvcmcgaW5mby5cbiAgICogQHJldHVybiB7T3JnSW5mb30gVGhlIG9yZyBpbmZvLlxuICAgKiAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIC8qKiBVcGRhdGUgdGhlIG9yZy5cbiAgICogQHBhcmFtIHtVcGRhdGVPcmdSZXF1ZXN0fSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybiB7VXBkYXRlT3JnUmVzcG9uc2V9IFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKHJlcXVlc3Q6IFVwZGF0ZU9yZ1JlcXVlc3QpOiBQcm9taXNlPFVwZGF0ZU9yZ1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkucGF0Y2goXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5pZCB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIExpc3Qgcm9sZXMuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lcn0gY3MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdG8gdXNlIGZvciBzaWduaW5nLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb24gdG8gd2hpY2ggdGhlIHJvbGUgYmVsb25ncy5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7Um9sZVtdfSBPcmcgcm9sZXMuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBwcml2YXRlIHN0YXRpYyBhc3luYyByb2xlcyhjczogQ3ViZVNpZ25lciwgb3JnSWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxSb2xlW10+IHtcbiAgICBwYWdlID8/PSBQYWdlLmRlZmF1bHQoKTtcbiAgICBjb25zdCBsaXN0Rm4gPSBhc3luYyAocXVlcnk6IFBhZ2VRdWVyeUFyZ3MpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IGNzLm1hbmFnZW1lbnQoKVxuICAgICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0sXG4gICAgICAgICAgcXVlcnksXG4gICAgICAgIH0sXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICBjb25zdCBwID0gbmV3IFBhZ2luYXRvcihcbiAgICAgIHBhZ2UsXG4gICAgICBsaXN0Rm4sXG4gICAgICAodSkgPT4gdS5yb2xlcyxcbiAgICAgICh1KSA9PiB1Lmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgcC5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHI6IFJvbGVJbmZvKSA9PiBuZXcgUm9sZShjcywgb3JnSWQsIHIpKTtcbiAgfVxuXG4gIC8qKiBMaXN0IHVzZXJzLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSByb2xlIGJlbG9uZ3MuXG4gICAqIEByZXR1cm4ge1VzZXJbXX0gT3JnIHVzZXJzLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgdXNlcnMoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXJJZEluZm9bXT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vdXNlcnNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEudXNlcnM7XG4gIH1cbn1cbiJdfQ==