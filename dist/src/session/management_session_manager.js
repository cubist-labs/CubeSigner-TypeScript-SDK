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
var _ManagementSessionManager_client;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagementSessionManager = void 0;
const session_manager_1 = require("./session_manager");
/** The session manager for management sessions */
class ManagementSessionManager extends session_manager_1.SessionManager {
    /**
     * @return {string} The current auth token.
     * @internal
     */
    async token() {
        const session = await this.storage.retrieve();
        return session.id_token;
    }
    /**
     * Returns a client with the current session and refreshes the current
     * session.
     */
    async client() {
        this.refreshIfNeeded();
        return __classPrivateFieldGet(this, _ManagementSessionManager_client, "f");
    }
    /** Revokes the session. */
    async revoke() {
        const idp = require("@aws-sdk/client-cognito-identity-provider"); // eslint-disable-line @typescript-eslint/no-var-requires
        const session = await this.storage.retrieve();
        const client = new idp.CognitoIdentityProviderClient({
            region: this.env.Region,
            signer: { sign: async (request) => request }, // eslint-disable-line @typescript-eslint/no-explicit-any
        });
        const input = {
            Token: session.refresh_token,
            ClientId: this.env.ClientId,
        };
        await client.send(new idp.RevokeTokenCommand(input));
    }
    /**
     * Returns whether it's time to refresh this token.
     * @return {boolean} Whether it's time to refresh this token.
     * @internal
     */
    async isStale() {
        const session = await this.storage.retrieve();
        return this.hasExpired(new Date(session.expiration).getTime());
    }
    /**
     * Refreshes the session and **UPDATES/MUTATES** self.
     */
    async refresh() {
        const idp = require("@aws-sdk/client-cognito-identity-provider"); // eslint-disable-line @typescript-eslint/no-var-requires
        const session = await this.storage.retrieve();
        const client = new idp.CognitoIdentityProviderClient({ region: this.env.Region });
        const resp = await client.send(new idp.InitiateAuthCommand({
            AuthFlow: "REFRESH_TOKEN_AUTH",
            AuthParameters: {
                REFRESH_TOKEN: session.refresh_token,
            },
            ClientId: this.env.ClientId,
        }));
        if (!resp.AuthenticationResult ||
            !resp.AuthenticationResult.ExpiresIn ||
            !resp.AuthenticationResult.IdToken) {
            throw new Error("Refresh failed");
        }
        const expiresInMs = resp.AuthenticationResult.ExpiresIn * 1000;
        const expiration = new Date(new Date().getTime() + expiresInMs).toISOString();
        const idToken = resp.AuthenticationResult.IdToken;
        await this.storage.save({
            ...session,
            id_token: idToken,
            access_token: resp.AuthenticationResult.AccessToken,
            expiration,
        });
        __classPrivateFieldSet(this, _ManagementSessionManager_client, this.createClient(idToken), "f");
    }
    /**
     * Loads an existing management session from storage.
     * @param {ManagementSessionStorage} storage The storage back end to use
     * @return {Promise<SingerSession>} New token
     */
    static async loadFromStorage(storage) {
        const sessionInfo = await storage.retrieve();
        return new ManagementSessionManager(sessionInfo.env["Dev-CubeSignerStack"], sessionInfo.id_token, storage);
    }
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} token The current token of the session
     * @param {ManagementSessionStorage} storage The storage back end to use
     */
    constructor(env, token, storage) {
        super(env, storage);
        _ManagementSessionManager_client.set(this, void 0);
        __classPrivateFieldSet(this, _ManagementSessionManager_client, this.createClient(token), "f");
    }
}
exports.ManagementSessionManager = ManagementSessionManager;
_ManagementSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlbWVudF9zZXNzaW9uX21hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2Vzc2lvbi9tYW5hZ2VtZW50X3Nlc3Npb25fbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSx1REFBMkQ7QUFzQjNELGtEQUFrRDtBQUNsRCxNQUFhLHdCQUF5QixTQUFRLGdDQUFxQztJQUdqRjs7O09BR0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDMUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxNQUFNO1FBQ1YsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3ZCLE9BQU8sdUJBQUEsSUFBSSx3Q0FBUSxDQUFDO0lBQ3RCLENBQUM7SUFFRCwyQkFBMkI7SUFDM0IsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsMkNBQTJDLENBQUMsQ0FBQyxDQUFDLHlEQUF5RDtRQUMzSCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsNkJBQTZCLENBQUM7WUFDbkQsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTTtZQUN2QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQVksRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUseURBQXlEO1NBQzdHLENBQUMsQ0FBQztRQUNILE1BQU0sS0FBSyxHQUFHO1lBQ1osS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhO1lBQzVCLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVE7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dCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnRcIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcbmltcG9ydCB7IEhhc0VudiwgU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IFNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbl9zdG9yYWdlXCI7XG5cbi8qKiBKU09OIHJlcHJlc2VudGF0aW9uIG9mIG91ciBcIm1hbmFnZW1lbnQgc2Vzc2lvblwiIGZpbGUgZm9ybWF0ICovXG5leHBvcnQgaW50ZXJmYWNlIE1hbmFnZW1lbnRTZXNzaW9uT2JqZWN0IHtcbiAgLyoqIFRoZSBlbWFpbCBhZGRyZXNzIG9mIHRoZSB1c2VyICovXG4gIGVtYWlsOiBzdHJpbmc7XG4gIC8qKiBUaGUgSUQgdG9rZW4gKi9cbiAgaWRfdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSBhY2Nlc3MgdG9rZW4gKi9cbiAgYWNjZXNzX3Rva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgcmVmcmVzaCB0b2tlbiAqL1xuICByZWZyZXNoX3Rva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgZXhwaXJhdGlvbiB0aW1lIG9mIHRoZSBhY2Nlc3MgdG9rZW4gKi9cbiAgZXhwaXJhdGlvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1hbmFnZW1lbnRTZXNzaW9uSW5mbyBleHRlbmRzIE1hbmFnZW1lbnRTZXNzaW9uT2JqZWN0LCBIYXNFbnYge31cblxuLyoqIFR5cGUgb2Ygc3RvcmFnZSByZXF1aXJlZCBmb3IgbWFuYWdlbWVudCBzZXNzaW9ucyAqL1xuZXhwb3J0IHR5cGUgTWFuYWdlbWVudFNlc3Npb25TdG9yYWdlID0gU2Vzc2lvblN0b3JhZ2U8TWFuYWdlbWVudFNlc3Npb25JbmZvPjtcblxuLyoqIFRoZSBzZXNzaW9uIG1hbmFnZXIgZm9yIG1hbmFnZW1lbnQgc2Vzc2lvbnMgKi9cbmV4cG9ydCBjbGFzcyBNYW5hZ2VtZW50U2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBTZXNzaW9uTWFuYWdlcjxNYW5hZ2VtZW50U2Vzc2lvbkluZm8+IHtcbiAgI2NsaWVudDogQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHNlc3Npb24uaWRfdG9rZW47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNsaWVudCB3aXRoIHRoZSBjdXJyZW50IHNlc3Npb24gYW5kIHJlZnJlc2hlcyB0aGUgY3VycmVudFxuICAgKiBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY2xpZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgdGhpcy5yZWZyZXNoSWZOZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy4jY2xpZW50O1xuICB9XG5cbiAgLyoqIFJldm9rZXMgdGhlIHNlc3Npb24uICovXG4gIGFzeW5jIHJldm9rZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBpZHAgPSByZXF1aXJlKFwiQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXJcIik7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXZhci1yZXF1aXJlc1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgaWRwLkNvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50KHtcbiAgICAgIHJlZ2lvbjogdGhpcy5lbnYuUmVnaW9uLFxuICAgICAgc2lnbmVyOiB7IHNpZ246IGFzeW5jIChyZXF1ZXN0OiBhbnkpID0+IHJlcXVlc3QgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgfSk7XG4gICAgY29uc3QgaW5wdXQgPSB7XG4gICAgICBUb2tlbjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLFxuICAgICAgQ2xpZW50SWQ6IHRoaXMuZW52LkNsaWVudElkLFxuICAgIH07XG4gICAgYXdhaXQgY2xpZW50LnNlbmQobmV3IGlkcC5SZXZva2VUb2tlbkNvbW1hbmQoaW5wdXQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGlzU3RhbGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiB0aGlzLmhhc0V4cGlyZWQobmV3IERhdGUoc2Vzc2lvbi5leHBpcmF0aW9uKS5nZXRUaW1lKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBhbmQgKipVUERBVEVTL01VVEFURVMqKiBzZWxmLlxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBpZHAgPSByZXF1aXJlKFwiQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXJcIik7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXZhci1yZXF1aXJlc1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgaWRwLkNvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50KHsgcmVnaW9uOiB0aGlzLmVudi5SZWdpb24gfSk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5zZW5kKFxuICAgICAgbmV3IGlkcC5Jbml0aWF0ZUF1dGhDb21tYW5kKHtcbiAgICAgICAgQXV0aEZsb3c6IFwiUkVGUkVTSF9UT0tFTl9BVVRIXCIsXG4gICAgICAgIEF1dGhQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgUkVGUkVTSF9UT0tFTjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLFxuICAgICAgICB9LFxuICAgICAgICBDbGllbnRJZDogdGhpcy5lbnYuQ2xpZW50SWQsXG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgaWYgKFxuICAgICAgIXJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQgfHxcbiAgICAgICFyZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkV4cGlyZXNJbiB8fFxuICAgICAgIXJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuSWRUb2tlblxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVmcmVzaCBmYWlsZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZXhwaXJlc0luTXMgPSByZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkV4cGlyZXNJbiAqIDEwMDA7XG4gICAgY29uc3QgZXhwaXJhdGlvbiA9IG5ldyBEYXRlKG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgZXhwaXJlc0luTXMpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgaWRUb2tlbiA9IHJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuSWRUb2tlbjtcblxuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKDxNYW5hZ2VtZW50U2Vzc2lvbkluZm8+e1xuICAgICAgLi4uc2Vzc2lvbixcbiAgICAgIGlkX3Rva2VuOiBpZFRva2VuLFxuICAgICAgYWNjZXNzX3Rva2VuOiByZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkFjY2Vzc1Rva2VuLFxuICAgICAgZXhwaXJhdGlvbixcbiAgICB9KTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudChpZFRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBtYW5hZ2VtZW50IHNlc3Npb24gZnJvbSBzdG9yYWdlLlxuICAgKiBAcGFyYW0ge01hbmFnZW1lbnRTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHRva2VuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZEZyb21TdG9yYWdlKFxuICAgIHN0b3JhZ2U6IE1hbmFnZW1lbnRTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxNYW5hZ2VtZW50U2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uSW5mbyA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gbmV3IE1hbmFnZW1lbnRTZXNzaW9uTWFuYWdlcihcbiAgICAgIHNlc3Npb25JbmZvLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sXG4gICAgICBzZXNzaW9uSW5mby5pZF90b2tlbixcbiAgICAgIHN0b3JhZ2UsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIFRoZSBjdXJyZW50IHRva2VuIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7TWFuYWdlbWVudFNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzdG9yYWdlIGJhY2sgZW5kIHRvIHVzZVxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihlbnY6IEVudkludGVyZmFjZSwgdG9rZW46IHN0cmluZywgc3RvcmFnZTogTWFuYWdlbWVudFNlc3Npb25TdG9yYWdlKSB7XG4gICAgc3VwZXIoZW52LCBzdG9yYWdlKTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudCh0b2tlbik7XG4gIH1cbn1cbiJdfQ==