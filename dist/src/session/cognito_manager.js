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
var _CognitoSessionManager_client;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoSessionManager = void 0;
const session_manager_1 = require("./session_manager");
/** The session manager for cognito (management) sessions */
class CognitoSessionManager extends session_manager_1.SessionManager {
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
        return __classPrivateFieldGet(this, _CognitoSessionManager_client, "f");
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
        __classPrivateFieldSet(this, _CognitoSessionManager_client, this.createClient(idToken), "f");
    }
    /**
     * Loads an existing cognito (management) session from storage.
     * @param {CognitoSessionStorage} storage The storage back end to use
     * @return {Promise<SingerSession>} New token
     */
    static async loadFromStorage(storage) {
        const sessionInfo = await storage.retrieve();
        return new CognitoSessionManager(sessionInfo.env["Dev-CubeSignerStack"], sessionInfo.id_token, storage);
    }
    /**
     * Constructor.
     * @param {EnvInterface} env The environment of the session
     * @param {string} token The current token of the session
     * @param {CognitoSessionStorage} storage The storage back end to use
     */
    constructor(env, token, storage) {
        super(env, storage);
        _CognitoSessionManager_client.set(this, void 0);
        __classPrivateFieldSet(this, _CognitoSessionManager_client, this.createClient(token), "f");
    }
}
exports.CognitoSessionManager = CognitoSessionManager;
_CognitoSessionManager_client = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29nbml0b19tYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3Nlc3Npb24vY29nbml0b19tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUVBLHVEQUEyRDtBQXNCM0QsNERBQTREO0FBQzVELE1BQWEscUJBQXNCLFNBQVEsZ0NBQWtDO0lBRzNFOzs7T0FHRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQztJQUMxQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE1BQU07UUFDVixJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDdkIsT0FBTyx1QkFBQSxJQUFJLHFDQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELDJCQUEyQjtJQUMzQixLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDLENBQUMseURBQXlEO1FBQzNILE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQztZQUNuRCxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNO1lBQ3ZCLE1BQU0sRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsT0FBWSxFQUFFLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSx5REFBeUQ7U0FDN0csQ0FBQyxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUc7WUFDWixLQUFLLEVBQUUsT0FBTyxDQUFDLGFBQWE7WUFDNUIsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUTtTQUM1QixDQUFDO1FBQ0YsTUFBTSxN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Y2xpZW50XCI7XG5pbXBvcnQgeyBFbnZJbnRlcmZhY2UgfSBmcm9tIFwiLi4vZW52XCI7XG5pbXBvcnQgeyBIYXNFbnYsIFNlc3Npb25NYW5hZ2VyIH0gZnJvbSBcIi4vc2Vzc2lvbl9tYW5hZ2VyXCI7XG5pbXBvcnQgeyBTZXNzaW9uU3RvcmFnZSB9IGZyb20gXCIuL3Nlc3Npb25fc3RvcmFnZVwiO1xuXG4vKiogSlNPTiByZXByZXNlbnRhdGlvbiBvZiBvdXIgXCJtYW5hZ2VtZW50IHNlc3Npb25cIiBmaWxlIGZvcm1hdCAqL1xuZXhwb3J0IGludGVyZmFjZSBDb2duaXRvU2Vzc2lvbk9iamVjdCB7XG4gIC8qKiBUaGUgZW1haWwgYWRkcmVzcyBvZiB0aGUgdXNlciAqL1xuICBlbWFpbDogc3RyaW5nO1xuICAvKiogVGhlIElEIHRva2VuICovXG4gIGlkX3Rva2VuOiBzdHJpbmc7XG4gIC8qKiBUaGUgYWNjZXNzIHRva2VuICovXG4gIGFjY2Vzc190b2tlbjogc3RyaW5nO1xuICAvKiogVGhlIHJlZnJlc2ggdG9rZW4gKi9cbiAgcmVmcmVzaF90b2tlbjogc3RyaW5nO1xuICAvKiogVGhlIGV4cGlyYXRpb24gdGltZSBvZiB0aGUgYWNjZXNzIHRva2VuICovXG4gIGV4cGlyYXRpb246IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb2duaXRvU2Vzc2lvbkluZm8gZXh0ZW5kcyBDb2duaXRvU2Vzc2lvbk9iamVjdCwgSGFzRW52IHt9XG5cbi8qKiBUeXBlIG9mIHN0b3JhZ2UgcmVxdWlyZWQgZm9yIGNvZ25pdG8gKG1hbmFnZW1lbnQpIHNlc3Npb25zICovXG5leHBvcnQgdHlwZSBDb2duaXRvU2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxDb2duaXRvU2Vzc2lvbkluZm8+O1xuXG4vKiogVGhlIHNlc3Npb24gbWFuYWdlciBmb3IgY29nbml0byAobWFuYWdlbWVudCkgc2Vzc2lvbnMgKi9cbmV4cG9ydCBjbGFzcyBDb2duaXRvU2Vzc2lvbk1hbmFnZXIgZXh0ZW5kcyBTZXNzaW9uTWFuYWdlcjxDb2duaXRvU2Vzc2lvbkluZm8+IHtcbiAgI2NsaWVudDogQ2xpZW50O1xuXG4gIC8qKlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBjdXJyZW50IGF1dGggdG9rZW4uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzaW9uID0gYXdhaXQgdGhpcy5zdG9yYWdlLnJldHJpZXZlKCk7XG4gICAgcmV0dXJuIHNlc3Npb24uaWRfdG9rZW47XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNsaWVudCB3aXRoIHRoZSBjdXJyZW50IHNlc3Npb24gYW5kIHJlZnJlc2hlcyB0aGUgY3VycmVudFxuICAgKiBzZXNzaW9uLlxuICAgKi9cbiAgYXN5bmMgY2xpZW50KCk6IFByb21pc2U8Q2xpZW50PiB7XG4gICAgdGhpcy5yZWZyZXNoSWZOZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy4jY2xpZW50O1xuICB9XG5cbiAgLyoqIFJldm9rZXMgdGhlIHNlc3Npb24uICovXG4gIGFzeW5jIHJldm9rZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBpZHAgPSByZXF1aXJlKFwiQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXJcIik7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXZhci1yZXF1aXJlc1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgaWRwLkNvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50KHtcbiAgICAgIHJlZ2lvbjogdGhpcy5lbnYuUmVnaW9uLFxuICAgICAgc2lnbmVyOiB7IHNpZ246IGFzeW5jIChyZXF1ZXN0OiBhbnkpID0+IHJlcXVlc3QgfSwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgfSk7XG4gICAgY29uc3QgaW5wdXQgPSB7XG4gICAgICBUb2tlbjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLFxuICAgICAgQ2xpZW50SWQ6IHRoaXMuZW52LkNsaWVudElkLFxuICAgIH07XG4gICAgYXdhaXQgY2xpZW50LnNlbmQobmV3IGlkcC5SZXZva2VUb2tlbkNvbW1hbmQoaW5wdXQpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBpdCdzIHRpbWUgdG8gcmVmcmVzaCB0aGlzIHRva2VuLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGFzeW5jIGlzU3RhbGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiB0aGlzLmhhc0V4cGlyZWQobmV3IERhdGUoc2Vzc2lvbi5leHBpcmF0aW9uKS5nZXRUaW1lKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZnJlc2hlcyB0aGUgc2Vzc2lvbiBhbmQgKipVUERBVEVTL01VVEFURVMqKiBzZWxmLlxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBpZHAgPSByZXF1aXJlKFwiQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXJcIik7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXZhci1yZXF1aXJlc1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgaWRwLkNvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50KHsgcmVnaW9uOiB0aGlzLmVudi5SZWdpb24gfSk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGNsaWVudC5zZW5kKFxuICAgICAgbmV3IGlkcC5Jbml0aWF0ZUF1dGhDb21tYW5kKHtcbiAgICAgICAgQXV0aEZsb3c6IFwiUkVGUkVTSF9UT0tFTl9BVVRIXCIsXG4gICAgICAgIEF1dGhQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgUkVGUkVTSF9UT0tFTjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLFxuICAgICAgICB9LFxuICAgICAgICBDbGllbnRJZDogdGhpcy5lbnYuQ2xpZW50SWQsXG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgaWYgKFxuICAgICAgIXJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQgfHxcbiAgICAgICFyZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkV4cGlyZXNJbiB8fFxuICAgICAgIXJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuSWRUb2tlblxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVmcmVzaCBmYWlsZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZXhwaXJlc0luTXMgPSByZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkV4cGlyZXNJbiAqIDEwMDA7XG4gICAgY29uc3QgZXhwaXJhdGlvbiA9IG5ldyBEYXRlKG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgZXhwaXJlc0luTXMpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgaWRUb2tlbiA9IHJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuSWRUb2tlbjtcblxuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKDxDb2duaXRvU2Vzc2lvbkluZm8+e1xuICAgICAgLi4uc2Vzc2lvbixcbiAgICAgIGlkX3Rva2VuOiBpZFRva2VuLFxuICAgICAgYWNjZXNzX3Rva2VuOiByZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkFjY2Vzc1Rva2VuLFxuICAgICAgZXhwaXJhdGlvbixcbiAgICB9KTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudChpZFRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBjb2duaXRvIChtYW5hZ2VtZW50KSBzZXNzaW9uIGZyb20gc3RvcmFnZS5cbiAgICogQHBhcmFtIHtDb2duaXRvU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgYmFjayBlbmQgdG8gdXNlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U2luZ2VyU2Vzc2lvbj59IE5ldyB0b2tlblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGxvYWRGcm9tU3RvcmFnZShzdG9yYWdlOiBDb2duaXRvU2Vzc2lvblN0b3JhZ2UpOiBQcm9taXNlPENvZ25pdG9TZXNzaW9uTWFuYWdlcj4ge1xuICAgIGNvbnN0IHNlc3Npb25JbmZvID0gYXdhaXQgc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIHJldHVybiBuZXcgQ29nbml0b1Nlc3Npb25NYW5hZ2VyKFxuICAgICAgc2Vzc2lvbkluZm8uZW52W1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXSxcbiAgICAgIHNlc3Npb25JbmZvLmlkX3Rva2VuLFxuICAgICAgc3RvcmFnZSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge0VudkludGVyZmFjZX0gZW52IFRoZSBlbnZpcm9ubWVudCBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gdG9rZW4gVGhlIGN1cnJlbnQgdG9rZW4gb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtDb2duaXRvU2Vzc2lvblN0b3JhZ2V9IHN0b3JhZ2UgVGhlIHN0b3JhZ2UgYmFjayBlbmQgdG8gdXNlXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKGVudjogRW52SW50ZXJmYWNlLCB0b2tlbjogc3RyaW5nLCBzdG9yYWdlOiBDb2duaXRvU2Vzc2lvblN0b3JhZ2UpIHtcbiAgICBzdXBlcihlbnYsIHN0b3JhZ2UpO1xuICAgIHRoaXMuI2NsaWVudCA9IHRoaXMuY3JlYXRlQ2xpZW50KHRva2VuKTtcbiAgfVxufVxuIl19