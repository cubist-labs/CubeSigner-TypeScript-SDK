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
     * @param {MemberRole} memberRole The type of membership of the new user
     * @return {string} User id of the new user
     */
    async createOidcUser(identity, memberRole) {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).post("/v0/org/{org_id}/users", {
            params: { path: { org_id: this.id } },
            body: {
                identity,
                role: memberRole,
            },
            parseAs: "json",
        });
        return (0, util_1.assertOk)(resp).user_id;
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
    /** List all roles in the org..
     * @return {Role[]} The roles.
     * */
    async list() {
        return Org.roles(__classPrivateFieldGet(this, _Org_cs, "f"), this.id);
    }
    /**
     * Get a pending MFA request by its id.
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    async mfaGet(mfaId) {
        const resp = await (await __classPrivateFieldGet(this, _Org_cs, "f").management()).get("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: __classPrivateFieldGet(this, _Org_id, "f"), mfa_id: mfaId } },
        });
        return (0, util_1.assertOk)(resp);
    }
    /**
     * Approve a pending MFA request.
     *
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    async mfaApprove(mfaId) {
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
        const resp = await (await cs.management()).patch("/v0/org/{org_id}/mfa/{mfa_id}", {
            params: { path: { org_id: orgId, mfa_id: mfaId } },
        });
        return (0, util_1.assertOk)(resp);
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
     * @return {Role} The role.
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
}
exports.Org = Org;
_Org_cs = new WeakMap(), _Org_id = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSxpQ0FBa0M7QUFDbEMsK0JBQXFDO0FBQ3JDLGlDQUF3QztBQTBDeEMsdUJBQXVCO0FBQ3ZCLE1BQWEsR0FBRztJQVFkOzs7U0FHSztJQUNMLElBQUksRUFBRTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxlQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVELHNDQUFzQztJQUN0QyxLQUFLLENBQUMsSUFBSTtRQUNSLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLElBQUksSUFBSSxTQUFTLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7U0FHSztJQUNMLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBWTtRQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0RBQStELENBQUMsQ0FBQztTQUNsRjtRQUNELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVELDBCQUEwQjtJQUMxQixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxrQ0FBa0M7SUFDbEMsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQTJCLENBQUM7SUFDdkQsQ0FBQztJQUVEOztTQUVLO0lBQ0wsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFtQjtRQUNqQyxNQUFNLENBQUMsR0FBRyxNQUE0QyxDQUFDO1FBQ3ZELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRDs7OztTQUlLO0lBQ0wsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFhLEVBQUUsT0FBZ0I7UUFDN0MsT0FBTyxDQUFDLE1BQU0sU0FBRyxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLGVBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4RSxDQUFDO0lBRUQ7Ozs7O1NBS0s7SUFDTCxLQUFLLENBQUMsVUFBVSxDQUFDLElBQWEsRUFBRSxLQUFhLEVBQUUsT0FBZ0I7UUFDN0QsT0FBTyxTQUFHLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksZUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBYSxFQUFFLElBQVk7UUFDMUMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUNqQixNQUFNLHVCQUFBLElBQUksZUFBSSxDQUFDLFVBQVUsRUFBRSxDQUM1QixDQUFDLElBQUksQ0FBQyx5QkFBeUIsRUFBRTtZQUNoQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ3JDLElBQUksRUFBRTtnQkFDSixLQUFLO2dCQUNMLElBQUk7Z0JBQ0osVUFBVSxFQUFFLEtBQUs7YUFDbEI7WUFDRCxPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQXNCLEVBQUUsVUFBc0I7UUFDakUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUNqQixNQUFNLHVCQUFBLElBQUksZUFBSSxDQUFDLFVBQVUsRUFBRSxDQUM1QixDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRTtZQUMvQixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ3JDLElBQUksRUFBRTtnQkFDSixRQUFRO2dCQUNSLElBQUksRUFBRSxVQUFVO2FBQ2pCO1lBQ0QsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUNqQixNQUFNLHVCQUFBLElBQUksZUFBSSxDQUFDLFVBQVUsRUFBRSxDQUM1QixDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRTtZQUM5QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ3JDLE9BQU8sRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7O1NBR0s7SUFDTCxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQWE7UUFDeEIsT0FBTyxNQUFNLFNBQUcsQ0FBQyxNQUFNLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRUQ7OztTQUdLO0lBQ0wsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFjO1FBQ3ZCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FDakIsTUFBTSx1QkFBQSxJQUFJLGVBQUksQ0FBQyxVQUFVLEVBQUUsQ0FDNUIsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUU7WUFDN0IsTUFBTSxFQUFFO2dCQUNOLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUN6QixLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUzthQUM3QztZQUNELE9BQU8sRUFBRSxNQUFNO1NBQ2hCLENBQUMsQ0FBQztRQUNILE1BQU0sSUFBSSxHQUFHLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksU0FBRyxDQUFDLHVCQUFBLElBQUksZUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7OztTQUdLO0lBQ0wsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFhO1FBQzVCLE9BQU8sV0FBSSxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLGVBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRDs7O1NBR0s7SUFDTCxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQWM7UUFDMUIsT0FBTyxXQUFJLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksZUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOztTQUVLO0lBQ0wsS0FBSyxDQUFDLElBQUk7UUFDUixPQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFhO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FDakIsTUFBTSx1QkFBQSxJQUFJLGVBQUksQ0FBQyxVQUFVLEVBQUUsQ0FDNUIsQ0FBQyxHQUFHLENBQUMsK0JBQStCLEVBQUU7WUFDckMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLHVCQUFBLElBQUksZUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtTQUN0RCxDQUFDLENBQUM7UUFDSCxPQUFPLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBYTtRQUM1QixPQUFPLEdBQUcsQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxlQUFJLEVBQUUsdUJBQUEsSUFBSSxlQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBRTdFOzs7O1NBSUs7SUFDTCxZQUFZLEVBQWMsRUFBRSxJQUFhO1FBek5oQywwQkFBZ0I7UUFDekI7OztXQUdHO1FBQ00sMEJBQVk7UUFxTm5CLHVCQUFBLElBQUksV0FBTyxFQUFFLE1BQUEsQ0FBQztRQUNkLHVCQUFBLElBQUksV0FBTyxJQUFJLENBQUMsTUFBTSxNQUFBLENBQUM7SUFDekIsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFjLEVBQUUsS0FBYSxFQUFFLEtBQWE7UUFDbEUsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUNqQixNQUFNLEVBQUUsQ0FBQyxVQUFVLEVBQUUsQ0FDdEIsQ0FBQyxLQUFLLENBQUMsK0JBQStCLEVBQUU7WUFDdkMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7U0FDbkQsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7O1NBRUs7SUFDRyxLQUFLLENBQUMsS0FBSztRQUNqQixNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsVUFBVSxFQUFFLENBQzVCLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFO1lBQ3hCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDckMsT0FBTyxFQUFFLE1BQU07U0FDaEIsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsSUFBQSxlQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7OztTQUdLO0lBQ0csS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUF5QjtRQUM1QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQ2pCLE1BQU0sdUJBQUEsSUFBSSxlQUFJLENBQUMsVUFBVSxFQUFFLENBQzVCLENBQUMsS0FBSyxDQUFDLGtCQUFrQixFQUFFO1lBQzFCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDckMsSUFBSSxFQUFFLE9BQU87WUFDYixPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUEsZUFBUSxFQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7U0FLSztJQUNHLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQWMsRUFBRSxLQUFhO1FBQ3RELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FDakIsTUFBTSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQ3RCLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFO1lBQzlCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuQyxPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxJQUFBLGVBQVEsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUM1QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBVyxFQUFFLEVBQUUsQ0FBQyxJQUFJLFdBQUksQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakUsQ0FBQztDQUNGO0FBN1JELGtCQTZSQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN1YmVTaWduZXIsIE1mYVJlcXVlc3RJbmZvIH0gZnJvbSBcIi5cIjtcbmltcG9ydCB7IGNvbXBvbmVudHMsIHBhdGhzIH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBhc3NlcnRPayB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB7IEtleVR5cGUsIEtleSB9IGZyb20gXCIuL2tleVwiO1xuaW1wb3J0IHsgUm9sZSwgUm9sZUluZm8gfSBmcm9tIFwiLi9yb2xlXCI7XG5cbi8qKiBPcmdhbml6YXRpb24gaWQgKi9cbmV4cG9ydCB0eXBlIE9yZ0lkID0gc3RyaW5nO1xuXG4vKiogT3JnLXdpZGUgcG9saWN5ICovXG5leHBvcnQgdHlwZSBPcmdQb2xpY3kgPSBTb3VyY2VJcEFsbG93bGlzdFBvbGljeSB8IE9yaWdpbkFsbG93bGlzdFBvbGljeSB8IE1heERhaWx5VW5zdGFrZVBvbGljeTtcblxuLyoqXG4gKiBPbmx5IGFsbG93IHJlcXVlc3RzIGZyb20gdGhlIHNwZWNpZmllZCBvcmlnaW5zLlxuICogQGV4YW1wbGUge1wiT3JpZ2luQWxsb3dsaXN0XCI6IFwiKlwifVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9yaWdpbkFsbG93bGlzdFBvbGljeSB7XG4gIE9yaWdpbkFsbG93bGlzdDogc3RyaW5nW10gfCBcIipcIjtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCBzaWduaW5nIHRvIHNwZWNpZmljIHNvdXJjZSBJUCBhZGRyZXNzZXMuXG4gKiBAZXhhbXBsZSB7XCJTb3VyY2VJcEFsbG93bGlzdFwiOiBbXCIxMC4xLjIuMy84XCIsIFwiMTY5LjI1NC4xNy4xLzE2XCJdfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5IHtcbiAgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSBudW1iZXIgb2YgdW5zdGFrZXMgcGVyIGRheS5cbiAqIEBleGFtcGxlIHtcIk1heERhaWx5VW5zdGFrZVwiOiA1IH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXhEYWlseVVuc3Rha2VQb2xpY3kge1xuICBNYXhEYWlseVVuc3Rha2U6IG51bWJlcjtcbn1cblxudHlwZSBPcmdJbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJPcmdJbmZvXCJdO1xudHlwZSBVc2VySWRJbmZvID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJVc2VySWRJbmZvXCJdO1xudHlwZSBVcGRhdGVPcmdSZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjAvb3JnL3tvcmdfaWR9XCJdW1wicGF0Y2hcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xudHlwZSBVcGRhdGVPcmdSZXNwb25zZSA9XG4gIHBhdGhzW1wiL3YwL29yZy97b3JnX2lkfVwiXVtcInBhdGNoXCJdW1wicmVzcG9uc2VzXCJdW1wiMjAwXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIE9pZGNJZGVudGl0eSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiT0lEQ0lkZW50aXR5XCJdO1xuZXhwb3J0IHR5cGUgTWVtYmVyUm9sZSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiTWVtYmVyUm9sZVwiXTtcblxuLyoqIEFuIG9yZ2FuaXphdGlvbi4gKi9cbmV4cG9ydCBjbGFzcyBPcmcge1xuICByZWFkb25seSAjY3M6IEN1YmVTaWduZXI7XG4gIC8qKlxuICAgKiBUaGUgSUQgb2YgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICogQGV4YW1wbGUgT3JnIzEyNGRmZTNlLTNiYmQtNDg3ZC04MGMwLTUzYzU1ZThhYjg3YVxuICAgKi9cbiAgcmVhZG9ubHkgI2lkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEBkZXNjcmlwdGlvbiBUaGUgb3JnIGlkXG4gICAqIEBleGFtcGxlIE9yZyNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICogKi9cbiAgZ2V0IGlkKCk6IE9yZ0lkIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKiogSHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lID8/IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBTZXQgdGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuZXcgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAobXVzdCBiZSBhbHBoYW51bWVyaWMpLlxuICAgKiBAZXhhbXBsZSBteV9vcmdfbmFtZVxuICAgKiAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG5hbWUgfSk7XG4gIH1cblxuICAvKiogSXMgdGhlIG9yZyBlbmFibGVkPyAqL1xuICBhc3luYyBlbmFibGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgT3JnUG9saWN5W107XG4gIH1cblxuICAvKiogU2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7T3JnUG9saWN5W119IHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogT3JnUG9saWN5W10pIHtcbiAgICBjb25zdCBwID0gcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W107XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBwb2xpY3k6IHAgfSk7XG4gIH1cblxuICAvKiogQ3JlYXRlIGEgbmV3IHNpZ25pbmcga2V5LlxuICAgKiBAcGFyYW0ge0tleVR5cGV9IHR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5LiBEZWZhdWx0cyB0byB0aGUgc2Vzc2lvbidzIHVzZXIuXG4gICAqIEByZXR1cm4ge0tleVtdfSBUaGUgbmV3IGtleXMuXG4gICAqICovXG4gIGFzeW5jIGNyZWF0ZUtleSh0eXBlOiBLZXlUeXBlLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICByZXR1cm4gKGF3YWl0IEtleS5jcmVhdGVLZXlzKHRoaXMuI2NzLCB0aGlzLmlkLCB0eXBlLCAxLCBvd25lcklkKSlbMF07XG4gIH1cblxuICAvKiogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bW1iZXJ9IGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSB7c3RyaW5nP30gb3duZXJJZCBUaGUgb3duZXIgb2YgdGhlIGtleXMuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICogKi9cbiAgYXN5bmMgY3JlYXRlS2V5cyh0eXBlOiBLZXlUeXBlLCBjb3VudDogbnVtYmVyLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIHJldHVybiBLZXkuY3JlYXRlS2V5cyh0aGlzLiNjcywgdGhpcy5pZCwgdHlwZSwgY291bnQsIG93bmVySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmRzIGFuIGludml0YXRpb24gdG8gdGhhdCB1c2VyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBlbWFpbCBFbWFpbCBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgZnVsbCBuYW1lIG9mIHRoZSB1c2VyXG4gICAqL1xuICBhc3luYyBjcmVhdGVVc2VyKGVtYWlsOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L2ludml0ZVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBlbWFpbCxcbiAgICAgICAgbmFtZSxcbiAgICAgICAgc2tpcF9lbWFpbDogZmFsc2UsXG4gICAgICB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IE9JREMgdXNlclxuICAgKiBAcGFyYW0ge09pZGNJZGVudGl0eX0gaWRlbnRpdHkgVGhlIGlkZW50aXR5IG9mIHRoZSBPSURDIHVzZXJcbiAgICogQHBhcmFtIHtNZW1iZXJSb2xlfSBtZW1iZXJSb2xlIFRoZSB0eXBlIG9mIG1lbWJlcnNoaXAgb2YgdGhlIG5ldyB1c2VyXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVXNlciBpZCBvZiB0aGUgbmV3IHVzZXJcbiAgICovXG4gIGFzeW5jIGNyZWF0ZU9pZGNVc2VyKGlkZW50aXR5OiBPaWRjSWRlbnRpdHksIG1lbWJlclJvbGU6IE1lbWJlclJvbGUpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLnBvc3QoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy5pZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGlkZW50aXR5LFxuICAgICAgICByb2xlOiBtZW1iZXJSb2xlLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKS51c2VyX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvblxuICAgKiBAcmV0dXJuIHtVc2VySWRJbmZvW119IExpc3Qgb2YgdXNlcnNcbiAgICovXG4gIGFzeW5jIHVzZXJzKCk6IFByb21pc2U8VXNlcklkSW5mb1tdPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApLnVzZXJzO1xuICB9XG5cbiAgLyoqIEdldCBhIGtleSBieSBpZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybiB7S2V5fSBUaGUga2V5LlxuICAgKiAqL1xuICBhc3luYyBnZXRLZXkoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5PiB7XG4gICAgcmV0dXJuIGF3YWl0IEtleS5nZXRLZXkodGhpcy4jY3MsIHRoaXMuaWQsIGtleUlkKTtcbiAgfVxuXG4gIC8qKiBHZXQgYWxsIGtleXMgaW4gdGhlIG9yZy5cbiAgICogQHBhcmFtIHtLZXlUeXBlP30gdHlwZSBPcHRpb25hbCBrZXkgdHlwZSB0byBmaWx0ZXIgbGlzdCBmb3IuXG4gICAqIEByZXR1cm4ge0tleX0gVGhlIGtleS5cbiAgICogKi9cbiAgYXN5bmMga2V5cyh0eXBlPzogS2V5VHlwZSk6IFByb21pc2U8S2V5W10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0sXG4gICAgICAgIHF1ZXJ5OiB0eXBlID8geyBrZXlfdHlwZTogdHlwZSB9IDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IGRhdGEgPSBhc3NlcnRPayhyZXNwKTtcbiAgICByZXR1cm4gZGF0YS5rZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNjcywgdGhpcy5pZCwgaykpO1xuICB9XG5cbiAgLyoqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSBuZXcgcm9sZS5cbiAgICogKi9cbiAgYXN5bmMgY3JlYXRlUm9sZShuYW1lPzogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgcmV0dXJuIFJvbGUuY3JlYXRlUm9sZSh0aGlzLiNjcywgdGhpcy5pZCwgbmFtZSk7XG4gIH1cblxuICAvKiogR2V0IGEgcm9sZSBieSBpZCBvciBuYW1lLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybiB7Um9sZX0gVGhlIHJvbGUuXG4gICAqICovXG4gIGFzeW5jIGdldFJvbGUocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGU+IHtcbiAgICByZXR1cm4gUm9sZS5nZXRSb2xlKHRoaXMuI2NzLCB0aGlzLmlkLCByb2xlSWQpO1xuICB9XG5cbiAgLyoqIExpc3QgYWxsIHJvbGVzIGluIHRoZSBvcmcuLlxuICAgKiBAcmV0dXJuIHtSb2xlW119IFRoZSByb2xlcy5cbiAgICogKi9cbiAgYXN5bmMgbGlzdCgpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIHJldHVybiBPcmcucm9sZXModGhpcy4jY3MsIHRoaXMuaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz59IFRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIG1mYUdldChtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCB0aGlzLiNjcy5tYW5hZ2VtZW50KClcbiAgICApLmdldChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9XCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jaWQsIG1mYV9pZDogbWZhSWQgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBtZmFBcHByb3ZlKG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIE9yZy5tZmFBcHByb3ZlKHRoaXMuI2NzLCB0aGlzLiNpZCwgbWZhSWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiogQ3JlYXRlIGEgbmV3IG9yZy5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtPcmdJbmZvfSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKiAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgZGF0YTogT3JnSW5mbykge1xuICAgIHRoaXMuI2NzID0gY3M7XG4gICAgdGhpcy4jaWQgPSBkYXRhLm9yZ19pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHJlcXVlc3RzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgb3JnIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3RJbmZvPn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIHN0YXRpYyBhc3luYyBtZmFBcHByb3ZlKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nLCBtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICBhd2FpdCBjcy5tYW5hZ2VtZW50KClcbiAgICApLnBhdGNoKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCwgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICB9XG5cbiAgLyoqIEZldGNoIG9yZyBpbmZvLlxuICAgKiBAcmV0dXJuIHtPcmdJbmZvfSBUaGUgb3JnIGluZm8uXG4gICAqICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgIGF3YWl0IHRoaXMuI2NzLm1hbmFnZW1lbnQoKVxuICAgICkuZ2V0KFwiL3YwL29yZy97b3JnX2lkfVwiLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IHRoaXMuaWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgLyoqIFVwZGF0ZSB0aGUgb3JnLlxuICAgKiBAcGFyYW0ge1VwZGF0ZU9yZ1JlcXVlc3R9IHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJuIHtVcGRhdGVPcmdSZXNwb25zZX0gVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogKi9cbiAgcHJpdmF0ZSBhc3luYyB1cGRhdGUocmVxdWVzdDogVXBkYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8VXBkYXRlT3JnUmVzcG9uc2U+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgdGhpcy4jY3MubWFuYWdlbWVudCgpXG4gICAgKS5wYXRjaChcIi92MC9vcmcve29yZ19pZH1cIiwge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLmlkIH0gfSxcbiAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICB9KTtcbiAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gIH1cblxuICAvKiogTGlzdCByb2xlcy5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyfSBjcyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvbiB0byB3aGljaCB0aGUgcm9sZSBiZWxvbmdzLlxuICAgKiBAcmV0dXJuIHtSb2xlfSBUaGUgcm9sZS5cbiAgICogQGludGVybmFsXG4gICAqICovXG4gIHByaXZhdGUgc3RhdGljIGFzeW5jIHJvbGVzKGNzOiBDdWJlU2lnbmVyLCBvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlW10+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgYXdhaXQgY3MubWFuYWdlbWVudCgpXG4gICAgKS5nZXQoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzXCIsIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGFzc2VydE9rKHJlc3ApO1xuICAgIHJldHVybiBkYXRhLnJvbGVzLm1hcCgocjogUm9sZUluZm8pID0+IG5ldyBSb2xlKGNzLCBvcmdJZCwgcikpO1xuICB9XG59XG4iXX0=