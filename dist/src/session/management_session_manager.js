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
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
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
        const session = await this.storage.retrieve();
        const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: this.env.Region,
            signer: { sign: async (request) => request }, // eslint-disable-line @typescript-eslint/no-explicit-any
        });
        const input = {
            Token: session.refresh_token,
            ClientId: this.env.ClientId,
        };
        await client.send(new client_cognito_identity_provider_1.RevokeTokenCommand(input));
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
        const session = await this.storage.retrieve();
        const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({ region: this.env.Region });
        const resp = await client.send(new client_cognito_identity_provider_1.InitiateAuthCommand({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlbWVudF9zZXNzaW9uX21hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvc2Vzc2lvbi9tYW5hZ2VtZW50X3Nlc3Npb25fbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFFQSx1REFBMkQ7QUFFM0QsZ0dBSW1EO0FBcUJuRCxrREFBa0Q7QUFDbEQsTUFBYSx3QkFBeUIsU0FBUSxnQ0FBcUM7SUFHakY7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsT0FBTyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQzFCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsTUFBTTtRQUNWLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUN2QixPQUFPLHVCQUFBLElBQUksd0NBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsMkJBQTJCO0lBQzNCLEtBQUssQ0FBQyxNQUFNO1FBQ1YsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksZ0VBQTZCLENBQUM7WUFDL0MsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTTtZQUN2QixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQVksRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUseURBQXlEO1NBQzdHLENBQUMsQ0FBQztRQUNILE1BQU0sS0FBSyxHQUFHO1lBQ1osS0FBSyxFQUFFLE9BQU8sQ0FBQyxhQUFhO1lBQzVCLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVE7U0FDNUIsQ0FBQztRQUNGLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLHFEQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM5QyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxnRUFBNkIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDOUUsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUM1QixJQUFJLHNEQUFtQixDQUFDO1lBQ3RCLFFBQVEsRUFBRSxvQkFBb0I7WUFDOUIsY0FBYyxFQUFFO2dCQUNkLGFBQWEsRUFBRSxPQUFPLENBQUMsYUFBYTthQUNyQztZQUNELFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVE7U0FDNUIsQ0FBQyxDQUNILENBQUM7UUFFRixJQUNFLENBQUMsSUFBSSxDQUFDLG9CQUFvQjtZQUMxQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxTQUFTO1lBQ3BDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFDbEM7WUFDQSxNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDbkM7UUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztRQUMvRCxNQUFNLFVBQVUsR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzlFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7UUFFbEQsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBd0I7WUFDN0MsR0FBRyxPQUFPO1lBQ1YsUUFBUSxFQUFFLE9BQU87WUFDakIsWUFBWSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxXQUFXO1lBQ25ELFVBQVU7U0FDWCxDQUFDLENBQUM7UUFDSCx1QkFBQSxJQUFJLG9DQUFXLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQUEsQ0FBQztJQUM1QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUMxQixPQUFpQztRQUVqQyxNQUFNLFdBQVcsR0FBRyxNQUFNLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxPQUFPLElBQUksd0JBQXdCLENBQ2pDLFdBQVcsQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsRUFDdEMsV0FBVyxDQUFDLFFBQVEsRUFDcEIsT0FBTyxDQUNSLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFvQixHQUFpQixFQUFFLEtBQWEsRUFBRSxPQUFpQztRQUNyRixLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBeEd0QixtREFBZ0I7UUF5R2QsdUJBQUEsSUFBSSxvQ0FBVyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFBLENBQUM7SUFDMUMsQ0FBQztDQUNGO0FBNUdELDREQTRHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENsaWVudCB9IGZyb20gXCIuLi9jbGllbnRcIjtcbmltcG9ydCB7IEVudkludGVyZmFjZSB9IGZyb20gXCIuLi9lbnZcIjtcbmltcG9ydCB7IEhhc0VudiwgU2Vzc2lvbk1hbmFnZXIgfSBmcm9tIFwiLi9zZXNzaW9uX21hbmFnZXJcIjtcbmltcG9ydCB7IFNlc3Npb25TdG9yYWdlIH0gZnJvbSBcIi4vc2Vzc2lvbl9zdG9yYWdlXCI7XG5pbXBvcnQge1xuICBDb2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCxcbiAgSW5pdGlhdGVBdXRoQ29tbWFuZCxcbiAgUmV2b2tlVG9rZW5Db21tYW5kLFxufSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXJcIjtcblxuLyoqIEpTT04gcmVwcmVzZW50YXRpb24gb2Ygb3VyIFwibWFuYWdlbWVudCBzZXNzaW9uXCIgZmlsZSBmb3JtYXQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFuYWdlbWVudFNlc3Npb25PYmplY3Qge1xuICAvKiogVGhlIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIHVzZXIgKi9cbiAgZW1haWw6IHN0cmluZztcbiAgLyoqIFRoZSBJRCB0b2tlbiAqL1xuICBpZF90b2tlbjogc3RyaW5nO1xuICAvKiogVGhlIGFjY2VzcyB0b2tlbiAqL1xuICBhY2Nlc3NfdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSByZWZyZXNoIHRva2VuICovXG4gIHJlZnJlc2hfdG9rZW46IHN0cmluZztcbiAgLyoqIFRoZSBleHBpcmF0aW9uIHRpbWUgb2YgdGhlIGFjY2VzcyB0b2tlbiAqL1xuICBleHBpcmF0aW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWFuYWdlbWVudFNlc3Npb25JbmZvIGV4dGVuZHMgTWFuYWdlbWVudFNlc3Npb25PYmplY3QsIEhhc0VudiB7fVxuXG4vKiogVHlwZSBvZiBzdG9yYWdlIHJlcXVpcmVkIGZvciBtYW5hZ2VtZW50IHNlc3Npb25zICovXG5leHBvcnQgdHlwZSBNYW5hZ2VtZW50U2Vzc2lvblN0b3JhZ2UgPSBTZXNzaW9uU3RvcmFnZTxNYW5hZ2VtZW50U2Vzc2lvbkluZm8+O1xuXG4vKiogVGhlIHNlc3Npb24gbWFuYWdlciBmb3IgbWFuYWdlbWVudCBzZXNzaW9ucyAqL1xuZXhwb3J0IGNsYXNzIE1hbmFnZW1lbnRTZXNzaW9uTWFuYWdlciBleHRlbmRzIFNlc3Npb25NYW5hZ2VyPE1hbmFnZW1lbnRTZXNzaW9uSW5mbz4ge1xuICAjY2xpZW50OiBDbGllbnQ7XG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGN1cnJlbnQgYXV0aCB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gc2Vzc2lvbi5pZF90b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgY2xpZW50IHdpdGggdGhlIGN1cnJlbnQgc2Vzc2lvbiBhbmQgcmVmcmVzaGVzIHRoZSBjdXJyZW50XG4gICAqIHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBjbGllbnQoKTogUHJvbWlzZTxDbGllbnQ+IHtcbiAgICB0aGlzLnJlZnJlc2hJZk5lZWRlZCgpO1xuICAgIHJldHVybiB0aGlzLiNjbGllbnQ7XG4gIH1cblxuICAvKiogUmV2b2tlcyB0aGUgc2Vzc2lvbi4gKi9cbiAgYXN5bmMgcmV2b2tlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICBjb25zdCBjbGllbnQgPSBuZXcgQ29nbml0b0lkZW50aXR5UHJvdmlkZXJDbGllbnQoe1xuICAgICAgcmVnaW9uOiB0aGlzLmVudi5SZWdpb24sXG4gICAgICBzaWduZXI6IHsgc2lnbjogYXN5bmMgKHJlcXVlc3Q6IGFueSkgPT4gcmVxdWVzdCB9LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICB9KTtcbiAgICBjb25zdCBpbnB1dCA9IHtcbiAgICAgIFRva2VuOiBzZXNzaW9uLnJlZnJlc2hfdG9rZW4sXG4gICAgICBDbGllbnRJZDogdGhpcy5lbnYuQ2xpZW50SWQsXG4gICAgfTtcbiAgICBhd2FpdCBjbGllbnQuc2VuZChuZXcgUmV2b2tlVG9rZW5Db21tYW5kKGlucHV0KSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB3aGV0aGVyIGl0J3MgdGltZSB0byByZWZyZXNoIHRoaXMgdG9rZW4uXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgaXQncyB0aW1lIHRvIHJlZnJlc2ggdGhpcyB0b2tlbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBpc1N0YWxlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCB0aGlzLnN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gdGhpcy5oYXNFeHBpcmVkKG5ldyBEYXRlKHNlc3Npb24uZXhwaXJhdGlvbikuZ2V0VGltZSgpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoZXMgdGhlIHNlc3Npb24gYW5kICoqVVBEQVRFUy9NVVRBVEVTKiogc2VsZi5cbiAgICovXG4gIGFzeW5jIHJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHRoaXMuc3RvcmFnZS5yZXRyaWV2ZSgpO1xuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDb2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCh7IHJlZ2lvbjogdGhpcy5lbnYuUmVnaW9uIH0pO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjbGllbnQuc2VuZChcbiAgICAgIG5ldyBJbml0aWF0ZUF1dGhDb21tYW5kKHtcbiAgICAgICAgQXV0aEZsb3c6IFwiUkVGUkVTSF9UT0tFTl9BVVRIXCIsXG4gICAgICAgIEF1dGhQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgUkVGUkVTSF9UT0tFTjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLFxuICAgICAgICB9LFxuICAgICAgICBDbGllbnRJZDogdGhpcy5lbnYuQ2xpZW50SWQsXG4gICAgICB9KSxcbiAgICApO1xuXG4gICAgaWYgKFxuICAgICAgIXJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQgfHxcbiAgICAgICFyZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkV4cGlyZXNJbiB8fFxuICAgICAgIXJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuSWRUb2tlblxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVmcmVzaCBmYWlsZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZXhwaXJlc0luTXMgPSByZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkV4cGlyZXNJbiAqIDEwMDA7XG4gICAgY29uc3QgZXhwaXJhdGlvbiA9IG5ldyBEYXRlKG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgZXhwaXJlc0luTXMpLnRvSVNPU3RyaW5nKCk7XG4gICAgY29uc3QgaWRUb2tlbiA9IHJlc3AuQXV0aGVudGljYXRpb25SZXN1bHQuSWRUb2tlbjtcblxuICAgIGF3YWl0IHRoaXMuc3RvcmFnZS5zYXZlKDxNYW5hZ2VtZW50U2Vzc2lvbkluZm8+e1xuICAgICAgLi4uc2Vzc2lvbixcbiAgICAgIGlkX3Rva2VuOiBpZFRva2VuLFxuICAgICAgYWNjZXNzX3Rva2VuOiByZXNwLkF1dGhlbnRpY2F0aW9uUmVzdWx0LkFjY2Vzc1Rva2VuLFxuICAgICAgZXhwaXJhdGlvbixcbiAgICB9KTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudChpZFRva2VuKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhbiBleGlzdGluZyBtYW5hZ2VtZW50IHNlc3Npb24gZnJvbSBzdG9yYWdlLlxuICAgKiBAcGFyYW0ge01hbmFnZW1lbnRTZXNzaW9uU3RvcmFnZX0gc3RvcmFnZSBUaGUgc3RvcmFnZSBiYWNrIGVuZCB0byB1c2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxTaW5nZXJTZXNzaW9uPn0gTmV3IHRva2VuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgbG9hZEZyb21TdG9yYWdlKFxuICAgIHN0b3JhZ2U6IE1hbmFnZW1lbnRTZXNzaW9uU3RvcmFnZSxcbiAgKTogUHJvbWlzZTxNYW5hZ2VtZW50U2Vzc2lvbk1hbmFnZXI+IHtcbiAgICBjb25zdCBzZXNzaW9uSW5mbyA9IGF3YWl0IHN0b3JhZ2UucmV0cmlldmUoKTtcbiAgICByZXR1cm4gbmV3IE1hbmFnZW1lbnRTZXNzaW9uTWFuYWdlcihcbiAgICAgIHNlc3Npb25JbmZvLmVudltcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl0sXG4gICAgICBzZXNzaW9uSW5mby5pZF90b2tlbixcbiAgICAgIHN0b3JhZ2UsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtFbnZJbnRlcmZhY2V9IGVudiBUaGUgZW52aXJvbm1lbnQgb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IHRva2VuIFRoZSBjdXJyZW50IHRva2VuIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSB7TWFuYWdlbWVudFNlc3Npb25TdG9yYWdlfSBzdG9yYWdlIFRoZSBzdG9yYWdlIGJhY2sgZW5kIHRvIHVzZVxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihlbnY6IEVudkludGVyZmFjZSwgdG9rZW46IHN0cmluZywgc3RvcmFnZTogTWFuYWdlbWVudFNlc3Npb25TdG9yYWdlKSB7XG4gICAgc3VwZXIoZW52LCBzdG9yYWdlKTtcbiAgICB0aGlzLiNjbGllbnQgPSB0aGlzLmNyZWF0ZUNsaWVudCh0b2tlbik7XG4gIH1cbn1cbiJdfQ==