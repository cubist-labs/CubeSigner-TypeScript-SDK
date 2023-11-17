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
var _Org_csc, _Org_id;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Org = void 0;
const key_1 = require("./key");
const role_1 = require("./role");
/** An organization. */
class Org {
    /**
     * @description The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    get id() {
        return __classPrivateFieldGet(this, _Org_id, "f");
    }
    /** Human-readable name for the org */
    async name() {
        const data = await __classPrivateFieldGet(this, _Org_csc, "f").orgGet();
        return data.name ?? undefined;
    }
    /**
     * Set the human-readable name for the org.
     * @param {string} name The new human-readable name for the org (must be alphanumeric).
     * @example my_org_name
     */
    async setName(name) {
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(name)) {
            throw new Error("Org name must be alphanumeric and between 3 and 30 characters");
        }
        await __classPrivateFieldGet(this, _Org_csc, "f").orgUpdate({ name });
    }
    /** Is the org enabled? */
    async enabled() {
        const data = await __classPrivateFieldGet(this, _Org_csc, "f").orgGet();
        return data.enabled;
    }
    /** Enable the org. */
    async enable() {
        await __classPrivateFieldGet(this, _Org_csc, "f").orgUpdate({ enabled: true });
    }
    /** Disable the org. */
    async disable() {
        await __classPrivateFieldGet(this, _Org_csc, "f").orgUpdate({ enabled: false });
    }
    /** Get the policy for the org. */
    async policy() {
        const data = await __classPrivateFieldGet(this, _Org_csc, "f").orgGet();
        return (data.policy ?? []);
    }
    /** Set the policy for the org.
     * @param {OrgPolicy[]} policy The new policy for the org.
     * */
    async setPolicy(policy) {
        const p = policy;
        await __classPrivateFieldGet(this, _Org_csc, "f").orgUpdate({ policy: p });
    }
    /**
     * Create a new signing key.
     * @param {KeyType} type The type of key to create.
     * @param {string?} ownerId The owner of the key. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    async createKey(type, ownerId) {
        return (await this.createKeys(type, 1, ownerId))[0];
    }
    /**
     * Create new signing keys.
     * @param {KeyType} type The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    async createKeys(type, count, ownerId) {
        const keys = await __classPrivateFieldGet(this, _Org_csc, "f").keysCreate(type, count, ownerId);
        return keys.map((k) => new key_1.Key(__classPrivateFieldGet(this, _Org_csc, "f"), k));
    }
    /**
     * Derive a key of the given type using the given derivation path and mnemonic.
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {KeyType} type Type of key to derive from the mnemonic.
     * @param {string} derivationPath Mnemonic derivation path used to generate new key.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key} newly derived key.
     */
    async deriveKey(type, derivationPath, mnemonicId) {
        return (await this.deriveKeys(type, [derivationPath], mnemonicId))[0];
    }
    /**
     * Derive a set of keys of the given type using the given derivation paths and mnemonic.
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
        const keys = await __classPrivateFieldGet(this, _Org_csc, "f").keysDerive(type, derivationPaths, mnemonicId);
        return keys.map((k) => new key_1.Key(__classPrivateFieldGet(this, _Org_csc, "f"), k));
    }
    /** Create a new user in the organization and sends an invitation to that user. */
    get createUser() {
        return __classPrivateFieldGet(this, _Org_csc, "f").orgUserInvite.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /** Create a new OIDC user */
    get createOidcUser() {
        return __classPrivateFieldGet(this, _Org_csc, "f").orgUserCreateOidc.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /** Delete an existing OIDC user */
    get deleteOidcUser() {
        return __classPrivateFieldGet(this, _Org_csc, "f").orgUserDeleteOidc.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /** Checks if a given proof of OIDC authentication is valid. */
    get verifyIdentity() {
        return __classPrivateFieldGet(this, _Org_csc, "f").identityVerify.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /**  List users in the organization */
    get users() {
        return __classPrivateFieldGet(this, _Org_csc, "f").orgUsersList.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /**
     * Get a key by id.
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     */
    async getKey(keyId) {
        const keyInfo = await __classPrivateFieldGet(this, _Org_csc, "f").keyGet(keyId);
        return new key_1.Key(__classPrivateFieldGet(this, _Org_csc, "f"), keyInfo);
    }
    /**
     * Get all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Key} The key.
     */
    async keys(type, page) {
        const paginator = __classPrivateFieldGet(this, _Org_csc, "f").keysList(type, page);
        const keys = await paginator.fetch();
        return keys.map((k) => new key_1.Key(__classPrivateFieldGet(this, _Org_csc, "f"), k));
    }
    /**
     * Create a new role.
     *
     * @param {string?} name The name of the role.
     * @return {Role} The new role.
     */
    async createRole(name) {
        const roleId = await __classPrivateFieldGet(this, _Org_csc, "f").roleCreate(name);
        const roleInfo = await __classPrivateFieldGet(this, _Org_csc, "f").roleGet(roleId);
        return new role_1.Role(__classPrivateFieldGet(this, _Org_csc, "f"), roleInfo);
    }
    /**
     * Get a role by id or name.
     *
     * @param {string} roleId The id or name of the role to get.
     * @return {Role} The role.
     */
    async getRole(roleId) {
        const roleInfo = await __classPrivateFieldGet(this, _Org_csc, "f").roleGet(roleId);
        return new role_1.Role(__classPrivateFieldGet(this, _Org_csc, "f"), roleInfo);
    }
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Role[]} The roles.
     */
    async listRoles(page) {
        const roles = await __classPrivateFieldGet(this, _Org_csc, "f").rolesList(page).fetch();
        return roles.map((r) => new role_1.Role(__classPrivateFieldGet(this, _Org_csc, "f"), r));
    }
    /** List all users in the org. */
    get listUsers() {
        return __classPrivateFieldGet(this, _Org_csc, "f").orgUsersList.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /**
     * Get a pending MFA request by its id.
     *
     * @deprecated Use {@link getMfaInfo()} instead.
     */
    get mfaGet() {
        return __classPrivateFieldGet(this, _Org_csc, "f").mfaGet.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /**
     * Approve a pending MFA request.
     *
     * @deprecated Use {@link approveMfaRequest()} instead.
     */
    get mfaApprove() {
        return __classPrivateFieldGet(this, _Org_csc, "f").mfaApprove.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /** Get a pending MFA request by its id. */
    get getMfaInfo() {
        return __classPrivateFieldGet(this, _Org_csc, "f").mfaGet.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /** List pending MFA requests accessible to the current user. */
    get listMfaInfos() {
        return __classPrivateFieldGet(this, _Org_csc, "f").mfaList.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    /** Approve a pending MFA request. */
    get approveMfaRequest() {
        return __classPrivateFieldGet(this, _Org_csc, "f").mfaApprove.bind(__classPrivateFieldGet(this, _Org_csc, "f"));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Create a new org.
     * @param {CubeSignerClient} csc The CubeSigner instance.
     * @param {OrgInfo} data The JSON response from the API server.
     * @internal
     */
    constructor(csc, data) {
        _Org_csc.set(this, void 0);
        /**
         * The ID of the organization.
         * @example Org#124dfe3e-3bbd-487d-80c0-53c55e8ab87a
         */
        _Org_id.set(this, void 0);
        __classPrivateFieldSet(this, _Org_csc, csc.withOrg(data.org_id), "f");
        __classPrivateFieldSet(this, _Org_id, data.org_id, "f");
    }
}
exports.Org = Org;
_Org_csc = new WeakMap(), _Org_id = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSwrQkFBcUM7QUFDckMsaUNBQThCO0FBNkM5Qix1QkFBdUI7QUFDdkIsTUFBYSxHQUFHO0lBU2Q7OztPQUdHO0lBQ0gsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLGVBQUksQ0FBQztJQUNsQixDQUFDO0lBRUQsc0NBQXNDO0lBQ3RDLEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGdCQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdEMsT0FBTyxJQUFJLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBWTtRQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3RDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0RBQStELENBQUMsQ0FBQztTQUNsRjtRQUNELE1BQU0sdUJBQUEsSUFBSSxnQkFBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELDBCQUEwQjtJQUMxQixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxnQkFBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSx1QkFBQSxJQUFJLGdCQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztR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Q0FBQztJQUVELGdFQUFnRTtJQUNoRSxJQUFJLFlBQVk7UUFDZCxPQUFPLHVCQUFBLElBQUksZ0JBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksZ0JBQUssQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxxQ0FBcUM7SUFDckMsSUFBSSxpQkFBaUI7UUFDbkIsT0FBTyx1QkFBQSxJQUFJLGdCQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyx1QkFBQSxJQUFJLGdCQUFLLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFFN0U7Ozs7O09BS0c7SUFDSCxZQUFZLEdBQXFCLEVBQUUsSUFBYTtRQXJQdkMsMkJBQXVCO1FBRWhDOzs7V0FHRztRQUNNLDBCQUFZO1FBZ1BuQix1QkFBQSxJQUFJLFlBQVEsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQUEsQ0FBQztRQUNyQyx1QkFBQSxJQUFJLFdBQU8sSUFBSSxDQUFDLE1BQU0sTUFBQSxDQUFDO0lBQ3pCLENBQUM7Q0FDRjtBQTFQRCxrQkEwUEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPcmdJbmZvIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBLZXlUeXBlLCBLZXkgfSBmcm9tIFwiLi9rZXlcIjtcbmltcG9ydCB7IFJvbGUgfSBmcm9tIFwiLi9yb2xlXCI7XG5pbXBvcnQgeyBQYWdlT3B0cyB9IGZyb20gXCIuL3BhZ2luYXRvclwiO1xuXG4vKiogT3JnYW5pemF0aW9uIGlkICovXG5leHBvcnQgdHlwZSBPcmdJZCA9IHN0cmluZztcblxuLyoqIE9yZy13aWRlIHBvbGljeSAqL1xuZXhwb3J0IHR5cGUgT3JnUG9saWN5ID1cbiAgfCBTb3VyY2VJcEFsbG93bGlzdFBvbGljeVxuICB8IE9pZGNBdXRoU291cmNlc1BvbGljeVxuICB8IE9yaWdpbkFsbG93bGlzdFBvbGljeVxuICB8IE1heERhaWx5VW5zdGFrZVBvbGljeTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBhbGxvd2xpc3Qgb2YgT0lEQyBJc3N1ZXJzIGFuZCBhdWRpZW5jZXMgdGhhdCBhcmUgYWxsb3dlZCB0byBhdXRoZW50aWNhdGUgaW50byB0aGlzIG9yZy5cbiAqIEBleGFtcGxlIHtcIk9pZGNBdXRoU291cmNlc1wiOiB7IFwiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tXCI6IFsgXCIxMjM0LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tXCIgXX19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT2lkY0F1dGhTb3VyY2VzUG9saWN5IHtcbiAgT2lkY0F1dGhTb3VyY2VzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT47XG59XG5cbi8qKlxuICogT25seSBhbGxvdyByZXF1ZXN0cyBmcm9tIHRoZSBzcGVjaWZpZWQgb3JpZ2lucy5cbiAqIEBleGFtcGxlIHtcIk9yaWdpbkFsbG93bGlzdFwiOiBcIipcIn1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcmlnaW5BbGxvd2xpc3RQb2xpY3kge1xuICBPcmlnaW5BbGxvd2xpc3Q6IHN0cmluZ1tdIHwgXCIqXCI7XG59XG5cbi8qKlxuICogUmVzdHJpY3Qgc2lnbmluZyB0byBzcGVjaWZpYyBzb3VyY2UgSVAgYWRkcmVzc2VzLlxuICogQGV4YW1wbGUge1wiU291cmNlSXBBbGxvd2xpc3RcIjogW1wiMTAuMS4yLjMvOFwiLCBcIjE2OS4yNTQuMTcuMS8xNlwiXX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VJcEFsbG93bGlzdFBvbGljeSB7XG4gIFNvdXJjZUlwQWxsb3dsaXN0OiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCB0aGUgbnVtYmVyIG9mIHVuc3Rha2VzIHBlciBkYXkuXG4gKiBAZXhhbXBsZSB7XCJNYXhEYWlseVVuc3Rha2VcIjogNSB9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWF4RGFpbHlVbnN0YWtlUG9saWN5IHtcbiAgTWF4RGFpbHlVbnN0YWtlOiBudW1iZXI7XG59XG5cbi8qKiBBbiBvcmdhbml6YXRpb24uICovXG5leHBvcnQgY2xhc3MgT3JnIHtcbiAgcmVhZG9ubHkgI2NzYzogQ3ViZVNpZ25lckNsaWVudDtcblxuICAvKipcbiAgICogVGhlIElEIG9mIHRoZSBvcmdhbml6YXRpb24uXG4gICAqIEBleGFtcGxlIE9yZyMxMjRkZmUzZS0zYmJkLTQ4N2QtODBjMC01M2M1NWU4YWI4N2FcbiAgICovXG4gIHJlYWRvbmx5ICNpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gVGhlIG9yZyBpZFxuICAgKiBAZXhhbXBsZSBPcmcjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBnZXQgaWQoKTogT3JnSWQge1xuICAgIHJldHVybiB0aGlzLiNpZDtcbiAgfVxuXG4gIC8qKiBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jY3NjLm9yZ0dldCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5ldyBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnIChtdXN0IGJlIGFscGhhbnVtZXJpYykuXG4gICAqIEBleGFtcGxlIG15X29yZ19uYW1lXG4gICAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZykge1xuICAgIGlmICghL15bYS16QS1aMC05X117MywzMH0kLy50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcmcgbmFtZSBtdXN0IGJlIGFscGhhbnVtZXJpYyBhbmQgYmV0d2VlbiAzIGFuZCAzMCBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLiNjc2Mub3JnVXBkYXRlKHsgbmFtZSB9KTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUgb3JnIGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2NzYy5vcmdHZXQoKTtcbiAgICByZXR1cm4gZGF0YS5lbmFibGVkO1xuICB9XG5cbiAgLyoqIEVuYWJsZSB0aGUgb3JnLiAqL1xuICBhc3luYyBlbmFibGUoKSB7XG4gICAgYXdhaXQgdGhpcy4jY3NjLm9yZ1VwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUgb3JnLiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMuI2NzYy5vcmdVcGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jY3NjLm9yZ0dldCgpO1xuICAgIHJldHVybiAoZGF0YS5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgT3JnUG9saWN5W107XG4gIH1cblxuICAvKiogU2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7T3JnUG9saWN5W119IHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogT3JnUG9saWN5W10pIHtcbiAgICBjb25zdCBwID0gcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W107XG4gICAgYXdhaXQgdGhpcy4jY3NjLm9yZ1VwZGF0ZSh7IHBvbGljeTogcCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmluZyBrZXkuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG93bmVySWQgVGhlIG93bmVyIG9mIHRoZSBrZXkuIERlZmF1bHRzIHRvIHRoZSBzZXNzaW9uJ3MgdXNlci5cbiAgICogQHJldHVybiB7S2V5W119IFRoZSBuZXcga2V5cy5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUtleSh0eXBlOiBLZXlUeXBlLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXk+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY3JlYXRlS2V5cyh0eXBlLCAxLCBvd25lcklkKSlbMF07XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBzaWduaW5nIGtleXMuXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gY3JlYXRlLlxuICAgKiBAcGFyYW0ge251bWJlcn0gY291bnQgVGhlIG51bWJlciBvZiBrZXlzIHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIHtzdHJpbmc/fSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcmV0dXJuIHtLZXlbXX0gVGhlIG5ldyBrZXlzLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlS2V5cyh0eXBlOiBLZXlUeXBlLCBjb3VudDogbnVtYmVyLCBvd25lcklkPzogc3RyaW5nKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNjc2Mua2V5c0NyZWF0ZSh0eXBlLCBjb3VudCwgb3duZXJJZCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2NzYywgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlcml2ZSBhIGtleSBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRoIGFuZCBtbmVtb25pYy5cbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSB7S2V5VHlwZX0gdHlwZSBUeXBlIG9mIGtleSB0byBkZXJpdmUgZnJvbSB0aGUgbW5lbW9uaWMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBkZXJpdmF0aW9uUGF0aCBNbmVtb25pYyBkZXJpdmF0aW9uIHBhdGggdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWNJZCBtYXRlcmlhbElkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogQHJldHVybiB7S2V5fSBuZXdseSBkZXJpdmVkIGtleS5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleSh0eXBlOiBLZXlUeXBlLCBkZXJpdmF0aW9uUGF0aDogc3RyaW5nLCBtbmVtb25pY0lkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5kZXJpdmVLZXlzKHR5cGUsIFtkZXJpdmF0aW9uUGF0aF0sIG1uZW1vbmljSWQpKVswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXJpdmUgYSBzZXQgb2Yga2V5cyBvZiB0aGUgZ2l2ZW4gdHlwZSB1c2luZyB0aGUgZ2l2ZW4gZGVyaXZhdGlvbiBwYXRocyBhbmQgbW5lbW9uaWMuXG4gICAqXG4gICAqIFRoZSBvd25lciBvZiB0aGUgZGVyaXZlZCBrZXlzIHdpbGwgYmUgdGhlIG93bmVyIG9mIHRoZSBtbmVtb25pYy5cbiAgICpcbiAgICogQHBhcmFtIHtLZXlUeXBlfSB0eXBlIFR5cGUgb2Yga2V5IHRvIGRlcml2ZSBmcm9tIHRoZSBtbmVtb25pYy5cbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gZGVyaXZhdGlvblBhdGhzIE1uZW1vbmljIGRlcml2YXRpb24gcGF0aHMgdXNlZCB0byBnZW5lcmF0ZSBuZXcga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbW5lbW9uaWNJZCBtYXRlcmlhbElkIG9mIG1uZW1vbmljIGtleSB1c2VkIHRvIGRlcml2ZSB0aGUgbmV3IGtleS5cbiAgICpcbiAgICogQHJldHVybiB7S2V5W119IG5ld2x5IGRlcml2ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGRlcml2ZUtleXModHlwZTogS2V5VHlwZSwgZGVyaXZhdGlvblBhdGhzOiBzdHJpbmdbXSwgbW5lbW9uaWNJZDogc3RyaW5nKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCB0aGlzLiNjc2Mua2V5c0Rlcml2ZSh0eXBlLCBkZXJpdmF0aW9uUGF0aHMsIG1uZW1vbmljSWQpO1xuICAgIHJldHVybiBrZXlzLm1hcCgoaykgPT4gbmV3IEtleSh0aGlzLiNjc2MsIGspKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgYSBuZXcgdXNlciBpbiB0aGUgb3JnYW5pemF0aW9uIGFuZCBzZW5kcyBhbiBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci4gKi9cbiAgZ2V0IGNyZWF0ZVVzZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5vcmdVc2VySW52aXRlLmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKiBDcmVhdGUgYSBuZXcgT0lEQyB1c2VyICovXG4gIGdldCBjcmVhdGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jY3NjLm9yZ1VzZXJDcmVhdGVPaWRjLmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKiBEZWxldGUgYW4gZXhpc3RpbmcgT0lEQyB1c2VyICovXG4gIGdldCBkZWxldGVPaWRjVXNlcigpIHtcbiAgICByZXR1cm4gdGhpcy4jY3NjLm9yZ1VzZXJEZWxldGVPaWRjLmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKiBDaGVja3MgaWYgYSBnaXZlbiBwcm9vZiBvZiBPSURDIGF1dGhlbnRpY2F0aW9uIGlzIHZhbGlkLiAqL1xuICBnZXQgdmVyaWZ5SWRlbnRpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5pZGVudGl0eVZlcmlmeS5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKiogIExpc3QgdXNlcnMgaW4gdGhlIG9yZ2FuaXphdGlvbiAqL1xuICBnZXQgdXNlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5vcmdVc2Vyc0xpc3QuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpZC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHJldHVybiB7S2V5fSBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5KGtleUlkOiBzdHJpbmcpOiBQcm9taXNlPEtleT4ge1xuICAgIGNvbnN0IGtleUluZm8gPSBhd2FpdCB0aGlzLiNjc2Mua2V5R2V0KGtleUlkKTtcbiAgICByZXR1cm4gbmV3IEtleSh0aGlzLiNjc2MsIGtleUluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwga2V5cyBpbiB0aGUgb3JnLlxuICAgKiBAcGFyYW0ge0tleVR5cGU/fSB0eXBlIE9wdGlvbmFsIGtleSB0eXBlIHRvIGZpbHRlciBsaXN0IGZvci5cbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybiB7S2V5fSBUaGUga2V5LlxuICAgKi9cbiAgYXN5bmMga2V5cyh0eXBlPzogS2V5VHlwZSwgcGFnZT86IFBhZ2VPcHRzKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IHBhZ2luYXRvciA9IHRoaXMuI2NzYy5rZXlzTGlzdCh0eXBlLCBwYWdlKTtcbiAgICBjb25zdCBrZXlzID0gYXdhaXQgcGFnaW5hdG9yLmZldGNoKCk7XG4gICAgcmV0dXJuIGtleXMubWFwKChrKSA9PiBuZXcgS2V5KHRoaXMuI2NzYywgaykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZz99IG5hbWUgVGhlIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm4ge1JvbGV9IFRoZSBuZXcgcm9sZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVJvbGUobmFtZT86IHN0cmluZyk6IFByb21pc2U8Um9sZT4ge1xuICAgIGNvbnN0IHJvbGVJZCA9IGF3YWl0IHRoaXMuI2NzYy5yb2xlQ3JlYXRlKG5hbWUpO1xuICAgIGNvbnN0IHJvbGVJbmZvID0gYXdhaXQgdGhpcy4jY3NjLnJvbGVHZXQocm9sZUlkKTtcbiAgICByZXR1cm4gbmV3IFJvbGUodGhpcy4jY3NjLCByb2xlSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgcm9sZSBieSBpZCBvciBuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcm9sZUlkIFRoZSBpZCBvciBuYW1lIG9mIHRoZSByb2xlIHRvIGdldC5cbiAgICogQHJldHVybiB7Um9sZX0gVGhlIHJvbGUuXG4gICAqL1xuICBhc3luYyBnZXRSb2xlKHJvbGVJZDogc3RyaW5nKTogUHJvbWlzZTxSb2xlPiB7XG4gICAgY29uc3Qgcm9sZUluZm8gPSBhd2FpdCB0aGlzLiNjc2Mucm9sZUdldChyb2xlSWQpO1xuICAgIHJldHVybiBuZXcgUm9sZSh0aGlzLiNjc2MsIHJvbGVJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCByb2xlcyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0ge1BhZ2VPcHRzfSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJuIHtSb2xlW119IFRoZSByb2xlcy5cbiAgICovXG4gIGFzeW5jIGxpc3RSb2xlcyhwYWdlPzogUGFnZU9wdHMpOiBQcm9taXNlPFJvbGVbXT4ge1xuICAgIGNvbnN0IHJvbGVzID0gYXdhaXQgdGhpcy4jY3NjLnJvbGVzTGlzdChwYWdlKS5mZXRjaCgpO1xuICAgIHJldHVybiByb2xlcy5tYXAoKHIpID0+IG5ldyBSb2xlKHRoaXMuI2NzYywgcikpO1xuICB9XG5cbiAgLyoqIExpc3QgYWxsIHVzZXJzIGluIHRoZSBvcmcuICovXG4gIGdldCBsaXN0VXNlcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5vcmdVc2Vyc0xpc3QuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIGdldE1mYUluZm8oKX0gaW5zdGVhZC5cbiAgICovXG4gIGdldCBtZmFHZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5tZmFHZXQuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0LlxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIGFwcHJvdmVNZmFSZXF1ZXN0KCl9IGluc3RlYWQuXG4gICAqL1xuICBnZXQgbWZhQXBwcm92ZSgpIHtcbiAgICByZXR1cm4gdGhpcy4jY3NjLm1mYUFwcHJvdmUuYmluZCh0aGlzLiNjc2MpO1xuICB9XG5cbiAgLyoqIEdldCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgYnkgaXRzIGlkLiAqL1xuICBnZXQgZ2V0TWZhSW5mbygpIHtcbiAgICByZXR1cm4gdGhpcy4jY3NjLm1mYUdldC5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvKiogTGlzdCBwZW5kaW5nIE1GQSByZXF1ZXN0cyBhY2Nlc3NpYmxlIHRvIHRoZSBjdXJyZW50IHVzZXIuICovXG4gIGdldCBsaXN0TWZhSW5mb3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NzYy5tZmFMaXN0LmJpbmQodGhpcy4jY3NjKTtcbiAgfVxuXG4gIC8qKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdC4gKi9cbiAgZ2V0IGFwcHJvdmVNZmFSZXF1ZXN0KCkge1xuICAgIHJldHVybiB0aGlzLiNjc2MubWZhQXBwcm92ZS5iaW5kKHRoaXMuI2NzYyk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgb3JnLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNzYyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtPcmdJbmZvfSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoY3NjOiBDdWJlU2lnbmVyQ2xpZW50LCBkYXRhOiBPcmdJbmZvKSB7XG4gICAgdGhpcy4jY3NjID0gY3NjLndpdGhPcmcoZGF0YS5vcmdfaWQpO1xuICAgIHRoaXMuI2lkID0gZGF0YS5vcmdfaWQ7XG4gIH1cbn1cbiJdfQ==