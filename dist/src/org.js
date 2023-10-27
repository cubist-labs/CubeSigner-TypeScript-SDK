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
     * @return {Key} The key.
     * */
    async keys(type) {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).get("/v0/org/{org_id}/keys", {
            params: {
                path: { org_id: this.id },
                query: type ? { key_type: type } : undefined,
            },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data.keys.map((k) => new key_1.Key(__classPrivateFieldGet(this, _Org_cs, "f"), this.id, k));
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
    /** List all roles in the org.
     * @return {Role[]} The roles.
     * */
    async listRoles() {
        return Org.roles(__classPrivateFieldGet(this, _Org_cs, "f"), this.id);
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
     * @return {Role[]} Org roles.
     * @internal
     * */
    static async roles(cs, orgId) {
        const resp = await (await cs.management()).get("/v0/org/{org_id}/roles", {
            params: { path: { org_id: orgId } },
            parseAs: "json",
        });
        const data = (0, util_1.assertOk)(resp);
        return data.roles.map((r) => new role_1.Role(cs, orgId, r));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFDbEMsK0JBQXFDO0FBQ3JDLGlDQUFtRDtBQThEbkQsdUJBQXVCO0FBQ3ZCLE1BQWEsR0FBRztJQVFkOzs7U0FHSztJQUNMLElBQUksRUFBRTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxlQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVELHNDQUFzQztJQUN0QyxLQUFLLENBQUMsSUFBSTtRQUNSLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxTQUFTLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7U0FHSztJQUNMLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBWTtRQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0RBQStELENBQUMsQ0FBQztTQUNsRjtRQUNELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELDBCQUEwQjtJQUMxQixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9B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O1FBQzVCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUF0WUQsa0JBc1lDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3ViZVNpZ25lciwgTWZhUmVxdWVzdEluZm8sIElkZW50aXR5UHJvb2YgfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cywgcGF0aHMgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IGFzc2VydE9rIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHsgS2V5VHlwZSwgS2V5IH0gZnJvbSBcIi4va2V5XCI7XG5pbXBvcnQgeyBNZmFQb2xpY3ksIFJvbGUsIFJvbGVJbmZvIH0gZnJvbSBcIi4vcm9sZVwiO1xuXG4vKiogT3JnYW5pemF0aW9uIGlkICovXG5leHBvcnQgdHlwZSBPcmdJZCA9IHN0cmluZztcblxuLyoqIE9yZy13aWRlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgT3JnUG9saWN5ID1cbiAgfCBTb3VyY2VJcEFsbG93bGlzdFBvbGljeVxuICB8IE9pZGNBdXRoU291cmNlc1BvbGljeVxuICB8IE9yaWdpbkFsbG93bGlzdFBvbGljeVxuICB8IE1heERhaWx5VW5zdGFrZVBvbGljeTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBhbGxvd2xpc3Qgb2YgT0lEQyBJc3N1ZXJzIGFuZCBhdWRpZW5jZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBhdXRoZW50aWNhdGUgaW50byB0aGlzIG9yZy5cbiAqIEBleGFtcGxlIHtcIk9pZGNBdXRoU291cmNlc1wiOiB7IFwiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tXCI6IFsgXCIxMjM0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXCIgXX19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhTb3VyY2VzUG9saWN5IHtcbiAgT2lkY0F1dGhTb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT47XG59XG5cbi8qKlxuICogT25seSBhbGxvdyByZXF1ZXN0cyBmcm9tIHRoZSBzcGVjaWZpZWQgb3JpZ2lucy5cbiAqIEBleGFtcGxlIHtcIk9yaWdpbkFsbG93bGlzdFwiOiBcIipcIn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmlnaW5BbGxvd2xpc3RQb2xpY3kge1xuICBPcmlnaW5BbGxvd2xpc3Q6IHN0cmluZ1tdIHwgXCIqXCI7XG59XG5cbi8qKlxuICogUmVzdHJpY3Qgc2lnbmluZyB0byBzcGVjaWZpYyBzb3VyY2UgSVAgYWRkcmVzc2VzLlxuICogQGV4YW1wbGUge1wiU291cmNlSXBBbGxvd2xpc3RcIjogW1wiMTAuMS4yLjMvOFwiLCBcIjE2OS4yNTQuMTcuMS8xNlwiXX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VJcEFsbG93bGlzdFBvbGljeSB7XG4gIFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgbnVtYmVyIG9mIHVuc3Rha2VzIHBlciBkYXkuXG4gKiBAZXhhbXBsZSB7XCJNYXhEYWlseVVuc3Rha2VcIjogNSB9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF4RGFpbHlVbnN0YWtlUG9saWN5IHtcbiAgTWF4RGFpbHlVbnN0YWtlOiBudW1iZXI7XG59XG5cbnR5cGUgT3JnSW5mbyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiT3JnSW5mb1wiXTtcbnR5cGUgVXNlcklkSW5mbyA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiVXNlcklkSW5mb1wiXTtcbnR5cGUgVXBkYXRlT3JnUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YwL29yZy97b3JnX2lkfVwiXVtcInBhdGNoXCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbnR5cGUgVXBkYXRlT3JnUmVzcG9uc2UgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH1cIl1bXCJwYXRjaFwiXVtcInJlc3BvbnNlc1wiXVtcIjIwMFwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuXG5leHBvcnQgdHlwZSBPaWRjSWRlbnRpdHkgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIk9JRENJZGVudGl0eVwiXTtcbmV4cG9ydCB0eXBlIE1lbWJlclJvbGUgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIk1lbWJlclJvbGVcIl07XG5cbi8qKiBPcHRpb25zIGZvciBhIG5ldyBPSURDIHVzZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlT2lkY1VzZXJPcHRpb25zIHtcbiAgLyoqIFRoZSByb2xlIG9mIGFuIE9JREMgdXNlciwgZGVmYXVsdCBpcyBcIkFsaWVuXCIgKi9cbiAgbWVtYmVyUm9sZT86IE1lbWJlclJvbGU7XG4gIC8qKiBPcHRpb25hbCBNRkEgcG9saWN5IHRvIGFzc29jaWF0ZSB3aXRoIHRoZSB1c2VyIGFjY291bnQgKi9cbiAgbWZhUG9saWN5PzogTWZhUG9saWN5O1xufVxuXG4vKiogQW4gb3JnYW5pemF0aW9uLiAqL1xuZXhwb3J0IGNsYXNzIE9yZyB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgLyoqXG4gICAqIFRoZSBJRCBvZiB0aGUgb3JnYW5pemF0aW9uLlxuICAgKiBAZXhhbXBsZSBPcmcjMTI0ZGZlM2UtM2JiZC00ODdkLTgwYzAtNTNjNTVlOGFiODdhXG4gICAqL1xuICByZWFkb25seSAjaWQ6IHN0cmluZztcblxuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIFRoZSBvcmcgaWRcbiAgICogQGV4YW1wbGUgT3JnI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKiAqL1xuICBnZXQgaWQoKTogT3JnSWQge1xuICAgIHJldHVybiB0aGlzLiNpZDtcbiAgfVxuXG4gIC8qKiBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIFNldCB0aGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5ldyBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnIChtdXN0IGJlIGFscGhhbnVtZXJpYykuXG4gICAqIEBleGFtcGxlIG15X29yZ19uYW1lXG4gICAqICovXG4gIGFzeW5jIHNldE5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKCEvXlthLXpBLVowLTlfXXszLDMwfSQvLnRlc3QobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9yZyBuYW1lIG11c3QgYmUgYWxwaGFudW1lcmljIGFuZCBiZXR3ZWVuIDMgYW5kIDMwIGNoYXJhY3RlcnNcIik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbmFtZSB9KTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUgb3JnIGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUgb3JnLiAqL1xuICBhc3luYyBlbmFibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiB0cnVlIH0pO1xuICB9XG5cbiAgLyoqIERpc2FibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZGlzYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVuYWJsZWQ6IGZhbHNlIH0pO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgcG9saWN5IGZvciB0aGUgb3JnLiAqL1xuICBhc3luYyBwb2xpY3koKTogUHJvbWlzZTxPcmdQb2xpY3lbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIChkYXRhLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIHtPcmdQb2xpY3lbXX0gcG9saWN5IFRoZSBuZXcgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKiAqL1xuICBhc3luYyBzZXRQb2xpY3kocG9saWN5OiBPcmdQb2xpY3lbXSkge1xuICAgIGNvbnN0IHAgPSBwb2xpY3kgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXTtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHBvbGljeTogcCB9KTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgYSBuZXcgc2lnbmluZyBrZXkuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXkuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICogKi9cbiAgYXN5bmMgY3JlYXRlS2V5KHR5cGU6IEtleVR5cGUsIG93bmVySWQ/OiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIHJldHVybiAoYXdhaXQgS2V5LmNyZWF0ZUtleXModGhpcy4jY3MsIHRoaXMuaWQsIHR5cGUsIDEsIG93bmVySWQpKVswXTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICogQHBhcmFtIHtLZXlUeXBlfSB0eXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7bnVtbWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIG5ldyBrZXlzLlxuICAgKiAqL1xuICBhc3luYyBjcmVhdGVLZXlzKHR5cGU6IEtleVR5cGUsIGNvdW50OiBudW1iZXIsIG93bmVySWQ/OiBzdHJpbmcpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgcmV0dXJuIEtleS5jcmVhdGVLZXlzKHRoaXMuI2NzLCB0aGlzLmlkLCB0eXBlLCBjb3VudCwgb3duZXJJZCk7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlcyBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkZXJpdmF0aW9uUGF0aCBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGggdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWNJZCBtYXRlcmlhbElkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogQHJldHVybiB7S2V5fSBuZXdseSBkZXJpdmVkIGtleS5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleSh0eXBlOiBLZXlUeXBlLCBkZXJpdmF0aW9uUGF0aDogc3RyaW5nLCBtbmVtb25pY0lkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIHJldHVybiAoYXdhaXQgS2V5LmRlcml2ZUtleXModGhpcy4jY3MsIHRoaXMuaWQsIHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQpKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmVzIGEgc2V0IG9mIGtleXMgb2YgdGhlIGdpdmVuIHR5cGUgdXNpbmcgdGhlIGdpdmVuIGRlcml2YXRpb24gcGF0aHMgYW5kIG1uZW1vbmljLlxuICAgKlxuICAgKiBUaGUgb3duZXIgb2YgdGhlIGRlcml2ZWQga2V5cyB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGRlcml2YXRpb25QYXRocyBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGhzIHVzZWQgdG8gZ2VuZXJhdGUgbmV3IGtleS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1uZW1vbmljSWQgbWF0ZXJpYWxJZCBvZiBtbmVtb25pYyBrZXkgdXNlZCB0byBkZXJpdmUgdGhlIG5ldyBrZXkuXG4gICAqXG4gICAqIEByZXR1cm4ge0tleVtdfSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBkZXJpdmVLZXlzKHR5cGU6IEtleVR5cGUsIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sIG1uZW1vbmljSWQ6IHN0cmluZyk6IFByb21pc2U8S2V5W10+IHtcbiAgICByZXR1cm4gYXdhaXQgS2V5LmRlcml2ZUtleXModGhpcy4jY3MsIHRoaXMuI2lkLCB0eXBlLCBkZXJpdmF0aW9uUGF0aHMsIG1uZW1vbmljSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmRzIGFuIGludml0YXRpb24gdG8gdGhhdCB1c2VyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbWFpbCBFbWFpbCBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZnVsbCBuYW1lIG9mIHRoZSB1c2VyXG4gICAqL1xuICBhc3luYyBjcmVhdGVVc2VyKGVtYWlsOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2ludml0ZVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBlbWFpbCxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgc2tpcF9lbWFpbDogZmFsc2UsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMgdXNlclxuICAgKiBAcGFyYW0ge09pZGNJZGVudGl0eX0gaWRlbnRpdHkgVGhlIGlkZW50aXR5IG9mIHRoZSBPSURDIHVzZXJcbiAgICogQHBhcmFtIHtzdHJpbmd9IGVtYWlsIEVtYWlsIG9mIHRoZSBPSURDIHVzZXJcbiAgICogQHBhcmFtIHtDcmVhdGVPaWRjVXNlck9wdGlvbnN9IG9wdHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBuZXcgT0lEQyB1c2Vyc1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFVzZXIgaWQgb2YgdGhlIG5ldyB1c2VyXG4gICAqL1xuICBhc3luYyBjcmVhdGVPaWRjVXNlcihcbiAgICBpZGVudGl0eTogT2lkY0lkZW50aXR5LFxuICAgIGVtYWlsOiBzdHJpbmcsXG4gICAgb3B0czogQ3JlYXRlT2lkY1VzZXJPcHRpb25zID0ge30sXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vdXNlcnNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgaWRlbnRpdHksXG4gICAgICAgIHJvbGU6IG9wdHMubWVtYmVyUm9sZSA/PyBcIkFsaWVuXCIsXG4gICAgICAgIGVtYWlsOiBlbWFpbCxcbiAgICAgICAgbWZhX3BvbGljeTogb3B0cy5tZmFQb2xpY3kgPz8gbnVsbCxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCkudXNlcl9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyXG4gICAqIEBwYXJhbSB7T2lkY0lkZW50aXR5fSBpZGVudGl0eSBUaGUgaWRlbnRpdHkgb2YgdGhlIE9JREMgdXNlclxuICAgKi9cbiAgYXN5bmMgZGVsZXRlT2lkY1VzZXIoaWRlbnRpdHk6IE9pZGNJZGVudGl0eSkge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmRlbChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkY1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keTogaWRlbnRpdHksXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIGEgZ2l2ZW4gcHJvb2Ygb2YgT0lEQyBhdXRoZW50aWNhdGlvbiBpcyB2YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHtJZGVudGl0eVByb29mfSBwcm9vZiBUaGUgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqL1xuICBhc3luYyB2ZXJpZnlJZGVudGl0eShwcm9vZjogSWRlbnRpdHlQcm9vZikge1xuICAgIGF3YWl0IHRoaXMuI2NzLnZlcmlmeUlkZW50aXR5KHRoaXMuaWQsIHByb29mKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHVzZXJzIGluIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHJldHVybiB7VXNlcklkSW5mb1tdfSBMaXN0IG9mIHVzZXJzXG4gICAqL1xuICBhc3luYyB1c2VycygpOiBQcm9taXNlPFVzZXJJZEluZm9bXT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vdXNlcnNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKS51c2VycztcbiAgfVxuXG4gIC8qKiBHZXQgYSBrZXkgYnkgaWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm4ge0tleX0gVGhlIGtleS5cbiAgICogKi9cbiAgYXN5bmMgZ2V0S2V5KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIHJldHVybiBhd2FpdCBLZXkuZ2V0S2V5KHRoaXMuI2NzLCB0aGlzLmlkLCBrZXlJZCk7XG4gIH1cblxuICAvKiogR2V0IGFsbCBrZXlzIGluIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7S2V5VHlwZT99IHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcmV0dXJuIHtLZXl9IFRoZSBrZXkuXG4gICAqICovXG4gIGFzeW5jIGtleXModHlwZT86IEtleVR5cGUpOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS9rZXlzXCIsIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy5pZCB9LFxuICAgICAgICBxdWVyeTogdHlwZSA/IHsga2V5X3R5cGU6IHR5cGUgfSA6IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEua2V5cy5tYXAoKGspID0+IG5ldyBLZXkodGhpcy4jY3MsIHRoaXMuaWQsIGspKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBuYW1lIFRoZSBuYW1lIG9mIHRoZSByb2xlLlxuICAgKiBAcmV0dXJuIHtSb2xlfSBUaGUgbmV3IHJvbGUuXG4gICAqICovXG4gIGFzeW5jIGNyZWF0ZVJvbGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIHJldHVybiBSb2xlLmNyZWF0ZVJvbGUodGhpcy4jY3MsIHRoaXMuaWQsIG5hbWUpO1xuICB9XG5cbiAgLyoqIEdldCBhIHJvbGUgYnkgaWQgb3IgbmFtZS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHJvbGVJZCBUaGUgaWQgb3IgbmFtZSBvZiB0aGUgcm9sZSB0byBnZXQuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSByb2xlLlxuICAgKiAqL1xuICBhc3luYyBnZXRSb2xlKHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgcmV0dXJuIFJvbGUuZ2V0Um9sZSh0aGlzLiNjcywgdGhpcy5pZCwgcm9sZUlkKTtcbiAgfVxuXG4gIC8qKiBMaXN0IGFsbCByb2xlcyBpbiB0aGUgb3JnLlxuICAgKiBAcmV0dXJuIHtSb2xlW119IFRoZSByb2xlcy5cbiAgICogKi9cbiAgYXN5bmMgbGlzdFJvbGVzKCk6IFByb21pc2U8Um9sZVtdPiB7XG4gICAgcmV0dXJuIE9yZy5yb2xlcyh0aGlzLiNjcywgdGhpcy5pZCk7XG4gIH1cblxuICAvKiogTGlzdCBhbGwgdXNlcnMgaW4gdGhlIG9yZy5cbiAgICogQHJldHVybiB7VXNlcltdfSBUaGUgdXNlcnMuXG4gICAqICovXG4gIGFzeW5jIGxpc3RVc2VycygpOiBQcm9taXNlPFVzZXJJZEluZm9bXT4ge1xuICAgIHJldHVybiBPcmcudXNlcnModGhpcy4jY3MsIHRoaXMuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBnZXRNZmFJbmZvKCl9IGluc3RlYWQuXG4gICAqL1xuICBhc3luYyBtZmFHZXQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRNZmFJbmZvKG1mYUlkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgYXBwcm92ZU1mYVJlcXVlc3QoKX0gaW5zdGVhZC5cbiAgICovXG4gIGFzeW5jIG1mYUFwcHJvdmUobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hcHByb3ZlTWZhUmVxdWVzdChtZmFJZCk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCBieSBpdHMgaWQuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgZ2V0TWZhSW5mbyhtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNjcy5tZmFHZXQodGhpcy5pZCwgbWZhSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+fSBUaGUgTUZBIHJlcXVlc3RzLlxuICAgKi9cbiAgYXN5bmMgbGlzdE1mYUluZm9zKCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm9bXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNjcy5tZmFMaXN0KHRoaXMuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGFwcHJvdmVNZmFSZXF1ZXN0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIE9yZy5tZmFBcHByb3ZlKHRoaXMuI2NzLCB0aGlzLiNpZCwgbWZhSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogQ3JlYXRlIGEgbmV3IG9yZy5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtPcmdJbmZvfSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgZGF0YTogT3JnSW5mbykge1xuICAgIHRoaXMuI2NzID0gY3M7XG4gICAgdGhpcy4jaWQgPSBkYXRhLm9yZ19pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHJlcXVlc3RzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIHN0YXRpYyBhc3luYyBtZmFBcHByb3ZlKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCBjcy5tZmFBcHByb3ZlKG9yZ0lkLCBtZmFJZCk7XG4gIH1cblxuICAvKiogRmV0Y2ggb3JnIGluZm8uXG4gICAqIEByZXR1cm4ge09yZ0luZm99IFRoZSBvcmcgaW5mby5cbiAgICogKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5pZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICAvKiogVXBkYXRlIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7VXBkYXRlT3JnUmVxdWVzdH0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEByZXR1cm4ge1VwZGF0ZU9yZ1Jlc3BvbnNlfSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShyZXF1ZXN0OiBVcGRhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxVcGRhdGVPcmdSZXNwb25zZT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKiBMaXN0IHJvbGVzLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3Igc2lnbmluZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uIHRvIHdoaWNoIHRoZSByb2xlIGJlbG9uZ3MuXG4gICAqIEByZXR1cm4ge1JvbGVbXX0gT3JnIHJvbGVzLlxuICAgKiBAaW50ZXJuYWxcbiAgICogKi9cbiAgcHJpdmF0ZSBzdGF0aWMgYXN5bmMgcm9sZXMoY3M6IEN1YmVTaWduZXIsIG9yZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXNzZXJ0T2socmVzcCk7XG4gICAgcmV0dXJuIGRhdGEucm9sZXMubWFwKChyOiBSb2xlSW5mbykgPT4gbmV3IFJvbGUoY3MsIG9yZ0lkLCByKSk7XG4gIH1cblxuICAvKiogTGlzdCB1c2Vycy5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUgcm9sZSBiZWxvbmdzLlxuICAgKiBAcmV0dXJuIHtVc2VyW119IE9yZyB1c2Vycy5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIHVzZXJzKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySWRJbmZvW10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhLnVzZXJzO1xuICB9XG59XG4iXX0=