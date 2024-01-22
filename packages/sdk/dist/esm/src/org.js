import { CubeSignerClient } from "./client";
import { SignerSessionManager } from ".";
/**
 * An organization.
 *
 * Extends {@link CubeSignerClient} and provides a few org-specific methods on top.
 */
export class Org extends CubeSignerClient {
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
        const sessionMgr = await SignerSessionManager.loadFromStorage(storage);
        return new Org(new CubeSignerClient(sessionMgr), sessionMgr.orgId);
    }
    /**
     * Constructor.
     * @param {CubeSignerClient | SignerSessionManager} csc The CubeSigner instance.
     * @param {OrgInfo| string} data Either org id or name or {@link OrgInfo}.
     */
    constructor(csc, data) {
        const mgr = csc instanceof CubeSignerClient ? csc.sessionMgr : csc;
        // NOTE: data can be OrgInfo for backward compatibility reasons
        const orgId = typeof data === "string" ? data : data?.org_id;
        super(mgr, orgId);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFDNUMsT0FBTyxFQUFXLG9CQUFvQixFQUF3QixNQUFNLEdBQUcsQ0FBQztBQTRDeEU7Ozs7R0FJRztBQUNILE1BQU0sT0FBTyxHQUFJLFNBQVEsZ0JBQWdCO0lBQ3ZDOzs7T0FHRztJQUNILElBQUksRUFBRTtRQUNKLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELHNDQUFzQztJQUN0QyxLQUFLLENBQUMsSUFBSTtRQUNSLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hDLE9BQU8sR0FBRyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUM7SUFDL0IsQ0FBQztJQUVELCtCQUErQjtJQUMvQixJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFZO1FBQ3hCLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUN2QyxNQUFNLElBQUksS0FBSyxDQUFDLCtEQUErRCxDQUFDLENBQUM7UUFDbkYsQ0FBQztRQUNELE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELDBCQUEwQjtJQUMxQixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2hDLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQsc0JBQXNCO0lBQ3RCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELHVCQUF1QjtJQUN2QixLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCxrQ0FBa0M7SUFDbEMsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQTJCLENBQUM7SUFDdEQsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBbUI7UUFDakMsTUFBTSxDQUFDLEdBQUcsTUFBNEMsQ0FBQztRQUN2RCxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsT0FBNkI7UUFDNUQsTUFBTSxVQUFVLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdkUsT0FBTyxJQUFJLEdBQUcsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksR0FBNEMsRUFBRSxJQUF1QjtRQUMvRSxNQUFNLEdBQUcsR0FBRyxHQUFHLFlBQVksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFFLEdBQTRCLENBQUM7UUFFN0YsK0RBQStEO1FBQy9ELE1BQU0sS0FBSyxHQUFHLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO1FBQzdELEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDcEIsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgT3JnSW5mbywgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIFNpZ25lclNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi5cIjtcblxuLyoqIE9yZ2FuaXphdGlvbiBpZCAqL1xuZXhwb3J0IHR5cGUgT3JnSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmctd2lkZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIE9yZ1BvbGljeSA9XG4gIHwgU291cmNlSXBBbGxvd2xpc3RQb2xpY3lcbiAgfCBPaWRjQXV0aFNvdXJjZXNQb2xpY3lcbiAgfCBPcmlnaW5BbGxvd2xpc3RQb2xpY3lcbiAgfCBNYXhEYWlseVVuc3Rha2VQb2xpY3k7XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gYWxsb3dsaXN0IG9mIE9JREMgSXNzdWVycyBhbmQgYXVkaWVuY2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIGludG8gdGhpcyBvcmcuXG4gKiBAZXhhbXBsZSB7XCJPaWRjQXV0aFNvdXJjZXNcIjogeyBcImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbVwiOiBbIFwiMTIzNC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbVwiIF19fVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoU291cmNlc1BvbGljeSB7XG4gIE9pZGNBdXRoU291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xufVxuXG4vKipcbiAqIE9ubHkgYWxsb3cgcmVxdWVzdHMgZnJvbSB0aGUgc3BlY2lmaWVkIG9yaWdpbnMuXG4gKiBAZXhhbXBsZSB7XCJPcmlnaW5BbGxvd2xpc3RcIjogXCIqXCJ9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JpZ2luQWxsb3dsaXN0UG9saWN5IHtcbiAgT3JpZ2luQWxsb3dsaXN0OiBzdHJpbmdbXSB8IFwiKlwiO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHNpZ25pbmcgdG8gc3BlY2lmaWMgc291cmNlIElQIGFkZHJlc3Nlcy5cbiAqIEBleGFtcGxlIHtcIlNvdXJjZUlwQWxsb3dsaXN0XCI6IFtcIjEwLjEuMi4zLzhcIiwgXCIxNjkuMjU0LjE3LjEvMTZcIl19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlSXBBbGxvd2xpc3RQb2xpY3kge1xuICBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIG51bWJlciBvZiB1bnN0YWtlcyBwZXIgZGF5LlxuICogQGV4YW1wbGUge1wiTWF4RGFpbHlVbnN0YWtlXCI6IDUgfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1heERhaWx5VW5zdGFrZVBvbGljeSB7XG4gIE1heERhaWx5VW5zdGFrZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFuIG9yZ2FuaXphdGlvbi5cbiAqXG4gKiBFeHRlbmRzIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBhbmQgcHJvdmlkZXMgYSBmZXcgb3JnLXNwZWNpZmljIG1ldGhvZHMgb24gdG9wLlxuICovXG5leHBvcnQgY2xhc3MgT3JnIGV4dGVuZHMgQ3ViZVNpZ25lckNsaWVudCB7XG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gVGhlIG9yZyBpZFxuICAgKiBAZXhhbXBsZSBPcmcjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBnZXQgaWQoKTogT3JnSWQge1xuICAgIHJldHVybiB0aGlzLm9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG9yZ0dldH0uXG4gICAqL1xuICBnZXQgaW5mbygpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdHZXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBvcmcgPSBhd2FpdCB0aGlzLm9yZ0dldCgpO1xuICAgIHJldHVybiBvcmcubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogR2V0IGFsbCBrZXlzIGluIHRoZSBvcmcuICovXG4gIGdldCBrZXlzKCkge1xuICAgIHJldHVybiB0aGlzLm9yZ0tleXMuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuZXcgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAobXVzdCBiZSBhbHBoYW51bWVyaWMpLlxuICAgKiBAZXhhbXBsZSBteV9vcmdfbmFtZVxuICAgKi9cbiAgYXN5bmMgc2V0TmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eW2EtekEtWjAtOV9dezMsMzB9JC8udGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3JnIG5hbWUgbXVzdCBiZSBhbHBoYW51bWVyaWMgYW5kIGJldHdlZW4gMyBhbmQgMzAgY2hhcmFjdGVyc1wiKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5vcmdVcGRhdGUoeyBuYW1lIH0pO1xuICB9XG5cbiAgLyoqIElzIHRoZSBvcmcgZW5hYmxlZD8gKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBvcmcgPSBhd2FpdCB0aGlzLm9yZ0dldCgpO1xuICAgIHJldHVybiBvcmcuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMub3JnVXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy5vcmdVcGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBvcmcgPSBhd2FpdCB0aGlzLm9yZ0dldCgpO1xuICAgIHJldHVybiAob3JnLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIHtPcmdQb2xpY3lbXX0gcG9saWN5IFRoZSBuZXcgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogT3JnUG9saWN5W10pIHtcbiAgICBjb25zdCBwID0gcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W107XG4gICAgYXdhaXQgdGhpcy5vcmdVcGRhdGUoeyBwb2xpY3k6IHAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmlldmUgdGhlIG9yZyBhc3NvY2lhdGVkIHdpdGggYSBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1Nlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzZXNzaW9uXG4gICAqIEByZXR1cm4ge09yZ30gQW4ge0BsaW5rIE9yZ30gaW5zdGFuY2UgZm9yIHRoZSBvcmcgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc2Vzc2lvbi5cbiAgICovXG4gIHN0YXRpYyBhc3luYyByZXRyaWV2ZUZyb21TdG9yYWdlKHN0b3JhZ2U6IFNpZ25lclNlc3Npb25TdG9yYWdlKTogUHJvbWlzZTxPcmc+IHtcbiAgICBjb25zdCBzZXNzaW9uTWdyID0gYXdhaXQgU2lnbmVyU2Vzc2lvbk1hbmFnZXIubG9hZEZyb21TdG9yYWdlKHN0b3JhZ2UpO1xuICAgIHJldHVybiBuZXcgT3JnKG5ldyBDdWJlU2lnbmVyQ2xpZW50KHNlc3Npb25NZ3IpLCBzZXNzaW9uTWdyLm9yZ0lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50IHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXJ9IGNzYyBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZS5cbiAgICogQHBhcmFtIHtPcmdJbmZvfCBzdHJpbmd9IGRhdGEgRWl0aGVyIG9yZyBpZCBvciBuYW1lIG9yIHtAbGluayBPcmdJbmZvfS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzYzogQ3ViZVNpZ25lckNsaWVudCB8IFNpZ25lclNlc3Npb25NYW5hZ2VyLCBkYXRhPzogT3JnSW5mbyB8IHN0cmluZykge1xuICAgIGNvbnN0IG1nciA9IGNzYyBpbnN0YW5jZW9mIEN1YmVTaWduZXJDbGllbnQgPyBjc2Muc2Vzc2lvbk1nciA6IChjc2MgYXMgU2lnbmVyU2Vzc2lvbk1hbmFnZXIpO1xuXG4gICAgLy8gTk9URTogZGF0YSBjYW4gYmUgT3JnSW5mbyBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSByZWFzb25zXG4gICAgY29uc3Qgb3JnSWQgPSB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiA/IGRhdGEgOiBkYXRhPy5vcmdfaWQ7XG4gICAgc3VwZXIobWdyLCBvcmdJZCk7XG4gIH1cbn1cbiJdfQ==