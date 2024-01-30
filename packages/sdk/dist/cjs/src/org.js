"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Org = void 0;
const client_1 = require("./client");
const _1 = require(".");
/**
 * An organization.
 *
 * Extends {@link CubeSignerClient} and provides a few org-specific methods on top.
 */
class Org extends client_1.CubeSignerClient {
    /**
     * @description The org id
     * @example Org#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    get id() {
        return this.orgId;
    }
    /**
     * Obtain information about the current organization.
     *
     * Same as {@link orgGet}.
     */
    get info() {
        return this.orgGet.bind(this);
    }
    /** Human-readable name for the org */
    async name() {
        const org = await this.orgGet();
        return org.name ?? undefined;
    }
    /** Get all keys in the org. */
    get keys() {
        return this.orgKeys.bind(this);
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
        await this.orgUpdate({ name });
    }
    /** Is the org enabled? */
    async enabled() {
        const org = await this.orgGet();
        return org.enabled;
    }
    /** Enable the org. */
    async enable() {
        await this.orgUpdate({ enabled: true });
    }
    /** Disable the org. */
    async disable() {
        await this.orgUpdate({ enabled: false });
    }
    /** Get the policy for the org. */
    async policy() {
        const org = await this.orgGet();
        return (org.policy ?? []);
    }
    /**
     * Set the policy for the org.
     * @param {OrgPolicy[]} policy The new policy for the org.
     */
    async setPolicy(policy) {
        const p = policy;
        await this.orgUpdate({ policy: p });
    }
    /**
     * Retrieve the org associated with a session.
     * @param {SessionStorage} storage The session
     * @return {Org} An {@link Org} instance for the org associated with this session.
     */
    static async retrieveFromStorage(storage) {
        const sessionMgr = await _1.SignerSessionManager.loadFromStorage(storage);
        return new Org(new client_1.CubeSignerClient(sessionMgr), sessionMgr.orgId);
    }
    /**
     * Constructor.
     * @param {CubeSignerClient | SignerSessionManager} csc The CubeSigner instance.
     * @param {OrgInfo| string} data Either org id or name or {@link OrgInfo}.
     */
    constructor(csc, data) {
        const mgr = csc instanceof client_1.CubeSignerClient ? csc.sessionMgr : csc;
        // NOTE: data can be OrgInfo for backward compatibility reasons
        const orgId = typeof data === "string" ? data : data?.org_id;
        super(mgr, orgId);
    }
}
exports.Org = Org;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBNEM7QUFDNUMsd0JBQXdFO0FBNEN4RTs7OztHQUlHO0FBQ0gsTUFBYSxHQUFJLFNBQVEseUJBQWdCO0lBQ3ZDOzs7T0FHRztJQUNILElBQUksRUFBRTtRQUNKLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELHNDQUFzQztJQUN0QyxLQUFLLENBQUMsSUFBSTtRQUNSLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hDLE9BQU8sR0FBRyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUM7SUFDL0IsQ0FBQztJQUVELCtCQUErQjtJQUMvQixJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFZO1FBQ3hCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELDBCQUEwQjtJQUMxQixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxrQ0FBa0M7SUFDbEMsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQTJCLENBQUM7SUFDdEQsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBbUI7UUFDakMsTUFBTSxDQUFDLEdBQUcsTUFBNEMsQ0FBQztRQUN2RCxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBNkI7UUFDNUQsTUFBTSxVQUFVLEdBQUcsTUFBTSx1QkFBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkUsT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLHlCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksR0FBNEMsRUFBRSxJQUF1QjtRQUMvRSxNQUFNLEdBQUcsR0FBRyxHQUFHLFlBQVkseUJBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFFLEdBQTRCLENBQUM7UUFFN0YsK0RBQStEO1FBQy9ELE1BQU0sS0FBSyxHQUFHLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO1FBQzdELEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEIsQ0FBQztDQUNGO0FBOUZELGtCQThGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IE9yZ0luZm8sIFNpZ25lclNlc3Npb25NYW5hZ2VyLCBTaWduZXJTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuXCI7XG5cbi8qKiBPcmdhbml6YXRpb24gaWQgKi9cbmV4cG9ydCB0eXBlIE9yZ0lkID0gc3RyaW5nO1xuXG4vKiogT3JnLXdpZGUgcG9saWN5ICovXG5leHBvcnQgdHlwZSBPcmdQb2xpY3kgPVxuICB8IFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5XG4gIHwgT2lkY0F1dGhTb3VyY2VzUG9saWN5XG4gIHwgT3JpZ2luQWxsb3dsaXN0UG9saWN5XG4gIHwgTWF4RGFpbHlVbnN0YWtlUG9saWN5O1xuXG4vKipcbiAqIFByb3ZpZGVzIGFuIGFsbG93bGlzdCBvZiBPSURDIElzc3VlcnMgYW5kIGF1ZGllbmNlcyB0aGF0IGFyZSBhbGxvd2VkIHRvIGF1dGhlbnRpY2F0ZSBpbnRvIHRoaXMgb3JnLlxuICogQGV4YW1wbGUge1wiT2lkY0F1dGhTb3VyY2VzXCI6IHsgXCJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb21cIjogWyBcIjEyMzQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb21cIiBdfX1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPaWRjQXV0aFNvdXJjZXNQb2xpY3kge1xuICBPaWRjQXV0aFNvdXJjZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPjtcbn1cblxuLyoqXG4gKiBPbmx5IGFsbG93IHJlcXVlc3RzIGZyb20gdGhlIHNwZWNpZmllZCBvcmlnaW5zLlxuICogQGV4YW1wbGUge1wiT3JpZ2luQWxsb3dsaXN0XCI6IFwiKlwifVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9yaWdpbkFsbG93bGlzdFBvbGljeSB7XG4gIE9yaWdpbkFsbG93bGlzdDogc3RyaW5nW10gfCBcIipcIjtcbn1cblxuLyoqXG4gKiBSZXN0cmljdCBzaWduaW5nIHRvIHNwZWNpZmljIHNvdXJjZSBJUCBhZGRyZXNzZXMuXG4gKiBAZXhhbXBsZSB7XCJTb3VyY2VJcEFsbG93bGlzdFwiOiBbXCIxMC4xLjIuMy84XCIsIFwiMTY5LjI1NC4xNy4xLzE2XCJdfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNvdXJjZUlwQWxsb3dsaXN0UG9saWN5IHtcbiAgU291cmNlSXBBbGxvd2xpc3Q6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHRoZSBudW1iZXIgb2YgdW5zdGFrZXMgcGVyIGRheS5cbiAqIEBleGFtcGxlIHtcIk1heERhaWx5VW5zdGFrZVwiOiA1IH1cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNYXhEYWlseVVuc3Rha2VQb2xpY3kge1xuICBNYXhEYWlseVVuc3Rha2U6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBbiBvcmdhbml6YXRpb24uXG4gKlxuICogRXh0ZW5kcyB7QGxpbmsgQ3ViZVNpZ25lckNsaWVudH0gYW5kIHByb3ZpZGVzIGEgZmV3IG9yZy1zcGVjaWZpYyBtZXRob2RzIG9uIHRvcC5cbiAqL1xuZXhwb3J0IGNsYXNzIE9yZyBleHRlbmRzIEN1YmVTaWduZXJDbGllbnQge1xuICAvKipcbiAgICogQGRlc2NyaXB0aW9uIFRoZSBvcmcgaWRcbiAgICogQGV4YW1wbGUgT3JnI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgZ2V0IGlkKCk6IE9yZ0lkIHtcbiAgICByZXR1cm4gdGhpcy5vcmdJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgb3JnYW5pemF0aW9uLlxuICAgKlxuICAgKiBTYW1lIGFzIHtAbGluayBvcmdHZXR9LlxuICAgKi9cbiAgZ2V0IGluZm8oKSB7XG4gICAgcmV0dXJuIHRoaXMub3JnR2V0LmJpbmQodGhpcyk7XG4gIH1cblxuICAvKiogSHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3Qgb3JnID0gYXdhaXQgdGhpcy5vcmdHZXQoKTtcbiAgICByZXR1cm4gb3JnLm5hbWUgPz8gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqIEdldCBhbGwga2V5cyBpbiB0aGUgb3JnLiAqL1xuICBnZXQga2V5cygpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdLZXlzLmJpbmQodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBodW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBUaGUgbmV3IGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcgKG11c3QgYmUgYWxwaGFudW1lcmljKS5cbiAgICogQGV4YW1wbGUgbXlfb3JnX25hbWVcbiAgICovXG4gIGFzeW5jIHNldE5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgaWYgKCEvXlthLXpBLVowLTlfXXszLDMwfSQvLnRlc3QobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9yZyBuYW1lIG11c3QgYmUgYWxwaGFudW1lcmljIGFuZCBiZXR3ZWVuIDMgYW5kIDMwIGNoYXJhY3RlcnNcIik7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMub3JnVXBkYXRlKHsgbmFtZSB9KTtcbiAgfVxuXG4gIC8qKiBJcyB0aGUgb3JnIGVuYWJsZWQ/ICovXG4gIGFzeW5jIGVuYWJsZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgb3JnID0gYXdhaXQgdGhpcy5vcmdHZXQoKTtcbiAgICByZXR1cm4gb3JnLmVuYWJsZWQ7XG4gIH1cblxuICAvKiogRW5hYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGVuYWJsZSgpIHtcbiAgICBhd2FpdCB0aGlzLm9yZ1VwZGF0ZSh7IGVuYWJsZWQ6IHRydWUgfSk7XG4gIH1cblxuICAvKiogRGlzYWJsZSB0aGUgb3JnLiAqL1xuICBhc3luYyBkaXNhYmxlKCkge1xuICAgIGF3YWl0IHRoaXMub3JnVXBkYXRlKHsgZW5hYmxlZDogZmFsc2UgfSk7XG4gIH1cblxuICAvKiogR2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuICovXG4gIGFzeW5jIHBvbGljeSgpOiBQcm9taXNlPE9yZ1BvbGljeVtdPiB7XG4gICAgY29uc3Qgb3JnID0gYXdhaXQgdGhpcy5vcmdHZXQoKTtcbiAgICByZXR1cm4gKG9yZy5wb2xpY3kgPz8gW10pIGFzIHVua25vd24gYXMgT3JnUG9saWN5W107XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBwb2xpY3kgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7T3JnUG9saWN5W119IHBvbGljeSBUaGUgbmV3IHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICovXG4gIGFzeW5jIHNldFBvbGljeShwb2xpY3k6IE9yZ1BvbGljeVtdKSB7XG4gICAgY29uc3QgcCA9IHBvbGljeSBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdO1xuICAgIGF3YWl0IHRoaXMub3JnVXBkYXRlKHsgcG9saWN5OiBwIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIHRoZSBvcmcgYXNzb2NpYXRlZCB3aXRoIGEgc2Vzc2lvbi5cbiAgICogQHBhcmFtIHtTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc2Vzc2lvblxuICAgKiBAcmV0dXJuIHtPcmd9IEFuIHtAbGluayBPcmd9IGluc3RhbmNlIGZvciB0aGUgb3JnIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHNlc3Npb24uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcmV0cmlldmVGcm9tU3RvcmFnZShzdG9yYWdlOiBTaWduZXJTZXNzaW9uU3RvcmFnZSk6IFByb21pc2U8T3JnPiB7XG4gICAgY29uc3Qgc2Vzc2lvbk1nciA9IGF3YWl0IFNpZ25lclNlc3Npb25NYW5hZ2VyLmxvYWRGcm9tU3RvcmFnZShzdG9yYWdlKTtcbiAgICByZXR1cm4gbmV3IE9yZyhuZXcgQ3ViZVNpZ25lckNsaWVudChzZXNzaW9uTWdyKSwgc2Vzc2lvbk1nci5vcmdJZCk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckNsaWVudCB8IFNpZ25lclNlc3Npb25NYW5hZ2VyfSBjc2MgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7T3JnSW5mb3wgc3RyaW5nfSBkYXRhIEVpdGhlciBvcmcgaWQgb3IgbmFtZSBvciB7QGxpbmsgT3JnSW5mb30uXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjc2M6IEN1YmVTaWduZXJDbGllbnQgfCBTaWduZXJTZXNzaW9uTWFuYWdlciwgZGF0YT86IE9yZ0luZm8gfCBzdHJpbmcpIHtcbiAgICBjb25zdCBtZ3IgPSBjc2MgaW5zdGFuY2VvZiBDdWJlU2lnbmVyQ2xpZW50ID8gY3NjLnNlc3Npb25NZ3IgOiAoY3NjIGFzIFNpZ25lclNlc3Npb25NYW5hZ2VyKTtcblxuICAgIC8vIE5PVEU6IGRhdGEgY2FuIGJlIE9yZ0luZm8gZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgcmVhc29uc1xuICAgIGNvbnN0IG9yZ0lkID0gdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgPyBkYXRhIDogZGF0YT8ub3JnX2lkO1xuICAgIHN1cGVyKG1nciwgb3JnSWQpO1xuICB9XG59XG4iXX0=