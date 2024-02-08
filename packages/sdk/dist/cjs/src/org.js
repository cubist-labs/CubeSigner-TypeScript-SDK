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
     * Set the notification endpoints for the org.
     *
     * @param {NotificationEndpointConfiguration[]} notification_endpoints Endpoints.
     */
    async setNotificationEndpoints(notification_endpoints) {
        await this.orgUpdate({
            notification_endpoints: notification_endpoints,
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL29yZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxxQ0FBNEM7QUFDNUMsd0JBS1c7QUE0Q1g7Ozs7R0FJRztBQUNILE1BQWEsR0FBSSxTQUFRLHlCQUFnQjtJQUN2Qzs7O09BR0c7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRCxzQ0FBc0M7SUFDdEMsS0FBSyxDQUFDLElBQUk7UUFDUixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxPQUFPLEdBQUcsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDO0lBQy9CLENBQUM7SUFFRCwrQkFBK0I7SUFDL0IsSUFBSSxJQUFJO1FBQ04sT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBWTtRQUN4QixJQUFJLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdkMsTUFBTSxJQUFJLEtBQUssQ0FBQywrREFBK0QsQ0FBQyxDQUFDO1FBQ25GLENBQUM7UUFDRCxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRCwwQkFBMEI7SUFDMUIsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7SUFDckIsQ0FBQztJQUVELHNCQUFzQjtJQUN0QixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCx1QkFBdUI7SUFDdkIsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUEyQixDQUFDO0lBQ3RELENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQW1CO1FBQ2pDLE1BQU0sQ0FBQyxHQUFHLE1BQTRDLENBQUM7UUFDdkQsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsd0JBQXdCLENBQUMsc0JBQTJEO1FBQ3hGLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNuQixzQkFBc0IsRUFBRSxzQkFBNEQ7U0FDckYsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLE9BQTZCO1FBQzVELE1BQU0sVUFBVSxHQUFHLE1BQU0sdUJBQW9CLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZFLE9BQU8sSUFBSSxHQUFHLENBQUMsSUFBSSx5QkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLEdBQTRDLEVBQUUsSUFBdUI7UUFDL0UsTUFBTSxHQUFHLEdBQUcsR0FBRyxZQUFZLHlCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBRSxHQUE0QixDQUFDO1FBRTdGLCtEQUErRDtRQUMvRCxNQUFNLEtBQUssR0FBRyxPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztRQUM3RCxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXpHRCxrQkF5R0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQge1xuICBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb24sXG4gIE9yZ0luZm8sXG4gIFNpZ25lclNlc3Npb25NYW5hZ2VyLFxuICBTaWduZXJTZXNzaW9uU3RvcmFnZSxcbn0gZnJvbSBcIi5cIjtcblxuLyoqIE9yZ2FuaXphdGlvbiBpZCAqL1xuZXhwb3J0IHR5cGUgT3JnSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmctd2lkZSBwb2xpY3kgKi9cbmV4cG9ydCB0eXBlIE9yZ1BvbGljeSA9XG4gIHwgU291cmNlSXBBbGxvd2xpc3RQb2xpY3lcbiAgfCBPaWRjQXV0aFNvdXJjZXNQb2xpY3lcbiAgfCBPcmlnaW5BbGxvd2xpc3RQb2xpY3lcbiAgfCBNYXhEYWlseVVuc3Rha2VQb2xpY3k7XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gYWxsb3dsaXN0IG9mIE9JREMgSXNzdWVycyBhbmQgYXVkaWVuY2VzIHRoYXQgYXJlIGFsbG93ZWQgdG8gYXV0aGVudGljYXRlIGludG8gdGhpcyBvcmcuXG4gKiBAZXhhbXBsZSB7XCJPaWRjQXV0aFNvdXJjZXNcIjogeyBcImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbVwiOiBbIFwiMTIzNC5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbVwiIF19fVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE9pZGNBdXRoU291cmNlc1BvbGljeSB7XG4gIE9pZGNBdXRoU291cmNlczogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xufVxuXG4vKipcbiAqIE9ubHkgYWxsb3cgcmVxdWVzdHMgZnJvbSB0aGUgc3BlY2lmaWVkIG9yaWdpbnMuXG4gKiBAZXhhbXBsZSB7XCJPcmlnaW5BbGxvd2xpc3RcIjogXCIqXCJ9XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3JpZ2luQWxsb3dsaXN0UG9saWN5IHtcbiAgT3JpZ2luQWxsb3dsaXN0OiBzdHJpbmdbXSB8IFwiKlwiO1xufVxuXG4vKipcbiAqIFJlc3RyaWN0IHNpZ25pbmcgdG8gc3BlY2lmaWMgc291cmNlIElQIGFkZHJlc3Nlcy5cbiAqIEBleGFtcGxlIHtcIlNvdXJjZUlwQWxsb3dsaXN0XCI6IFtcIjEwLjEuMi4zLzhcIiwgXCIxNjkuMjU0LjE3LjEvMTZcIl19XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlSXBBbGxvd2xpc3RQb2xpY3kge1xuICBTb3VyY2VJcEFsbG93bGlzdDogc3RyaW5nW107XG59XG5cbi8qKlxuICogUmVzdHJpY3QgdGhlIG51bWJlciBvZiB1bnN0YWtlcyBwZXIgZGF5LlxuICogQGV4YW1wbGUge1wiTWF4RGFpbHlVbnN0YWtlXCI6IDUgfVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE1heERhaWx5VW5zdGFrZVBvbGljeSB7XG4gIE1heERhaWx5VW5zdGFrZTogbnVtYmVyO1xufVxuXG4vKipcbiAqIEFuIG9yZ2FuaXphdGlvbi5cbiAqXG4gKiBFeHRlbmRzIHtAbGluayBDdWJlU2lnbmVyQ2xpZW50fSBhbmQgcHJvdmlkZXMgYSBmZXcgb3JnLXNwZWNpZmljIG1ldGhvZHMgb24gdG9wLlxuICovXG5leHBvcnQgY2xhc3MgT3JnIGV4dGVuZHMgQ3ViZVNpZ25lckNsaWVudCB7XG4gIC8qKlxuICAgKiBAZGVzY3JpcHRpb24gVGhlIG9yZyBpZFxuICAgKiBAZXhhbXBsZSBPcmcjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBnZXQgaWQoKTogT3JnSWQge1xuICAgIHJldHVybiB0aGlzLm9yZ0lkO1xuICB9XG5cbiAgLyoqXG4gICAqIE9idGFpbiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIFNhbWUgYXMge0BsaW5rIG9yZ0dldH0uXG4gICAqL1xuICBnZXQgaW5mbygpIHtcbiAgICByZXR1cm4gdGhpcy5vcmdHZXQuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKiBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgb3JnICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBvcmcgPSBhd2FpdCB0aGlzLm9yZ0dldCgpO1xuICAgIHJldHVybiBvcmcubmFtZSA/PyB1bmRlZmluZWQ7XG4gIH1cblxuICAvKiogR2V0IGFsbCBrZXlzIGluIHRoZSBvcmcuICovXG4gIGdldCBrZXlzKCkge1xuICAgIHJldHVybiB0aGlzLm9yZ0tleXMuYmluZCh0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGh1bWFuLXJlYWRhYmxlIG5hbWUgZm9yIHRoZSBvcmcuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuZXcgaHVtYW4tcmVhZGFibGUgbmFtZSBmb3IgdGhlIG9yZyAobXVzdCBiZSBhbHBoYW51bWVyaWMpLlxuICAgKiBAZXhhbXBsZSBteV9vcmdfbmFtZVxuICAgKi9cbiAgYXN5bmMgc2V0TmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eW2EtekEtWjAtOV9dezMsMzB9JC8udGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3JnIG5hbWUgbXVzdCBiZSBhbHBoYW51bWVyaWMgYW5kIGJldHdlZW4gMyBhbmQgMzAgY2hhcmFjdGVyc1wiKTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5vcmdVcGRhdGUoeyBuYW1lIH0pO1xuICB9XG5cbiAgLyoqIElzIHRoZSBvcmcgZW5hYmxlZD8gKi9cbiAgYXN5bmMgZW5hYmxlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCBvcmcgPSBhd2FpdCB0aGlzLm9yZ0dldCgpO1xuICAgIHJldHVybiBvcmcuZW5hYmxlZDtcbiAgfVxuXG4gIC8qKiBFbmFibGUgdGhlIG9yZy4gKi9cbiAgYXN5bmMgZW5hYmxlKCkge1xuICAgIGF3YWl0IHRoaXMub3JnVXBkYXRlKHsgZW5hYmxlZDogdHJ1ZSB9KTtcbiAgfVxuXG4gIC8qKiBEaXNhYmxlIHRoZSBvcmcuICovXG4gIGFzeW5jIGRpc2FibGUoKSB7XG4gICAgYXdhaXQgdGhpcy5vcmdVcGRhdGUoeyBlbmFibGVkOiBmYWxzZSB9KTtcbiAgfVxuXG4gIC8qKiBHZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy4gKi9cbiAgYXN5bmMgcG9saWN5KCk6IFByb21pc2U8T3JnUG9saWN5W10+IHtcbiAgICBjb25zdCBvcmcgPSBhd2FpdCB0aGlzLm9yZ0dldCgpO1xuICAgIHJldHVybiAob3JnLnBvbGljeSA/PyBbXSkgYXMgdW5rbm93biBhcyBPcmdQb2xpY3lbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBvbGljeSBmb3IgdGhlIG9yZy5cbiAgICogQHBhcmFtIHtPcmdQb2xpY3lbXX0gcG9saWN5IFRoZSBuZXcgcG9saWN5IGZvciB0aGUgb3JnLlxuICAgKi9cbiAgYXN5bmMgc2V0UG9saWN5KHBvbGljeTogT3JnUG9saWN5W10pIHtcbiAgICBjb25zdCBwID0gcG9saWN5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgbmV2ZXI+W107XG4gICAgYXdhaXQgdGhpcy5vcmdVcGRhdGUoeyBwb2xpY3k6IHAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBub3RpZmljYXRpb24gZW5kcG9pbnRzIGZvciB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0ge05vdGlmaWNhdGlvbkVuZHBvaW50Q29uZmlndXJhdGlvbltdfSBub3RpZmljYXRpb25fZW5kcG9pbnRzIEVuZHBvaW50cy5cbiAgICovXG4gIGFzeW5jIHNldE5vdGlmaWNhdGlvbkVuZHBvaW50cyhub3RpZmljYXRpb25fZW5kcG9pbnRzOiBOb3RpZmljYXRpb25FbmRwb2ludENvbmZpZ3VyYXRpb25bXSkge1xuICAgIGF3YWl0IHRoaXMub3JnVXBkYXRlKHtcbiAgICAgIG5vdGlmaWNhdGlvbl9lbmRwb2ludHM6IG5vdGlmaWNhdGlvbl9lbmRwb2ludHMgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCBuZXZlcj5bXSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZSB0aGUgb3JnIGFzc29jaWF0ZWQgd2l0aCBhIHNlc3Npb24uXG4gICAqIEBwYXJhbSB7U2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHNlc3Npb25cbiAgICogQHJldHVybiB7T3JnfSBBbiB7QGxpbmsgT3JnfSBpbnN0YW5jZSBmb3IgdGhlIG9yZyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzZXNzaW9uLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHJldHJpZXZlRnJvbVN0b3JhZ2Uoc3RvcmFnZTogU2lnbmVyU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPE9yZz4ge1xuICAgIGNvbnN0IHNlc3Npb25NZ3IgPSBhd2FpdCBTaWduZXJTZXNzaW9uTWFuYWdlci5sb2FkRnJvbVN0b3JhZ2Uoc3RvcmFnZSk7XG4gICAgcmV0dXJuIG5ldyBPcmcobmV3IEN1YmVTaWduZXJDbGllbnQoc2Vzc2lvbk1nciksIHNlc3Npb25NZ3Iub3JnSWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnQgfCBTaWduZXJTZXNzaW9uTWFuYWdlcn0gY3NjIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge09yZ0luZm98IHN0cmluZ30gZGF0YSBFaXRoZXIgb3JnIGlkIG9yIG5hbWUgb3Ige0BsaW5rIE9yZ0luZm99LlxuICAgKi9cbiAgY29uc3RydWN0b3IoY3NjOiBDdWJlU2lnbmVyQ2xpZW50IHwgU2lnbmVyU2Vzc2lvbk1hbmFnZXIsIGRhdGE/OiBPcmdJbmZvIHwgc3RyaW5nKSB7XG4gICAgY29uc3QgbWdyID0gY3NjIGluc3RhbmNlb2YgQ3ViZVNpZ25lckNsaWVudCA/IGNzYy5zZXNzaW9uTWdyIDogKGNzYyBhcyBTaWduZXJTZXNzaW9uTWFuYWdlcik7XG5cbiAgICAvLyBOT1RFOiBkYXRhIGNhbiBiZSBPcmdJbmZvIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IHJlYXNvbnNcbiAgICBjb25zdCBvcmdJZCA9IHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiID8gZGF0YSA6IGRhdGE/Lm9yZ19pZDtcbiAgICBzdXBlcihtZ3IsIG9yZ0lkKTtcbiAgfVxufVxuIl19