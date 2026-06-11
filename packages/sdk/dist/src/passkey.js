var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PasskeyLoginChallenge_env;
import { ApiClient, decodeBase64Url, encodeToBase64Url, } from "./index.js";
/**
 * @param val The value to check
 * @returns If the value is `null`, returns undefined, otherwise returns the value
 */
function noNull(val) {
    return val === null ? undefined : val;
}
/**
 * @param cred Credential descriptor, as returned by the CubeSigner back end
 * @returns The credential converted to {@link PublicKeyCredentialDescriptor}
 */
function mapPublicKeyCredentialDescriptor(cred) {
    return {
        id: decodeBase64Url(cred.id),
        type: cred.type,
        transports: noNull(cred.transports),
    };
}
/**
 * Manual implementation of [PublicKeyCredential.parseRequestOptionsFromJSON](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseRequestOptionsFromJSON_static)
 * (implemented here because not all browsers support it)
 *
 * @param options The credential request options as returned by the CubeSigner back end
 * @returns Parsed credential request options
 */
export function parseRequestOptions(options) {
    return {
        ...options,
        challenge: decodeBase64Url(options.challenge),
        extensions: noNull(options.extensions),
        rpId: noNull(options.rpId),
        timeout: noNull(options.timeout),
        allowCredentials: options.allowCredentials?.map(mapPublicKeyCredentialDescriptor),
    };
}
/**
 * Manual implementation of [PublicKeyCredential.parseCreationOptionsFromJSON](https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseCreationOptionsFromJSON_static)
 * (implemented here because not all browsers support it)
 *
 * @param options The credential creation options as returned by the CubeSigner back end
 * @returns Parsed credential creation options
 */
export function parseCreationOptions(options) {
    return {
        ...options,
        challenge: decodeBase64Url(options.challenge),
        excludeCredentials: options.excludeCredentials?.map(mapPublicKeyCredentialDescriptor),
        user: {
            id: decodeBase64Url(options.user.id),
            displayName: options.user.displayName,
            name: options.user.name,
        },
    };
}
/**
 * Type narrowing from {@link AuthenticatorResponse} to {@link AuthenticatorAttestationResponse}
 *
 * @param resp The value to check
 * @returns Whether the value is a {@link AuthenticatorAttestationResponse}
 */
function isAuthenticatorAttestationResponse(resp) {
    return !!resp.attestationObject;
}
/**
 * Type narrowing from {@link AuthenticatorResponse} to {@link AuthenticatorAssertionResponse}
 *
 * @param resp The value to check
 * @returns Whether the value is a {@link AuthenticatorAssertionResponse}
 */
function isAuthenticatorAssertionResponse(resp) {
    const asAssertion = resp;
    return !!asAssertion.authenticatorData && !!asAssertion.signature;
}
/**
 * @param cred The credential response to convert
 * @returns Corresponding serializable JSON object that the CubeSigner back end expects
 */
export function credentialToJSON(cred) {
    if (isAuthenticatorAttestationResponse(cred.response)) {
        return {
            id: cred.id,
            clientExtensionResults: cred.getClientExtensionResults(),
            response: {
                clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
                attestationObject: encodeToBase64Url(cred.response.attestationObject),
            },
        };
    }
    if (isAuthenticatorAssertionResponse(cred.response)) {
        return {
            id: cred.id,
            clientExtensionResults: cred.getClientExtensionResults(),
            response: {
                clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
                authenticatorData: encodeToBase64Url(cred.response.authenticatorData),
                signature: encodeToBase64Url(cred.response.signature),
            },
        };
    }
    throw new Error("Unrecognized public key credential response");
}
/**
 * Helper class for answering a passkey login challenge.
 */
export class PasskeyLoginChallenge {
    /**
     * Internal, called by {@link ApiClient.passkeyLoginInit}.
     *
     * @param env Target CubeSigner environment
     * @param challenge The challenge to answer
     * @param purpose Optional descriptive purpose of the new session
     */
    constructor(env, challenge, purpose) {
        this.purpose = purpose;
        _PasskeyLoginChallenge_env.set(this, void 0);
        __classPrivateFieldSet(this, _PasskeyLoginChallenge_env, env, "f");
        this.challenge = challenge;
        this.options = parseRequestOptions(challenge.options);
    }
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     *
     * @returns New session.
     */
    async getCredentialAndAnswer() {
        const cred = await navigator.credentials.get({ publicKey: this.options });
        if (cred === null)
            throw new Error("Credential not found");
        return await this.answer(cred);
    }
    /**
     * Answers this challenge using a given credential `cred`.
     * To obtain this credential, for example, call
     *
     * ```
     * const cred = await navigator.credentials.get({ publicKey: this.options });
     * ```
     *
     * @param cred Credential created by calling the `CredentialContainer`'s `get` method
     *             based on the public key credential request options from this challenge.
     * @returns New session
     */
    async answer(cred) {
        return await ApiClient.passkeyLoginComplete(__classPrivateFieldGet(this, _PasskeyLoginChallenge_env, "f"), {
            challenge_id: this.challenge.challenge_id,
            credential: credentialToJSON(cred),
        });
    }
}
_PasskeyLoginChallenge_env = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzc2tleS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXNza2V5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLE9BQU8sRUFDTCxTQUFTLEVBQ1QsZUFBZSxFQUNmLGlCQUFpQixHQU1sQixNQUFNLFlBQVksQ0FBQztBQUVwQjs7O0dBR0c7QUFDSCxTQUFTLE1BQU0sQ0FBSSxHQUFhO0lBQzlCLE9BQU8sR0FBRyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDeEMsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsZ0NBQWdDLENBQ3ZDLElBQThDO0lBRTlDLE9BQU87UUFDTCxFQUFFLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDNUIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1FBQ2YsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0tBQ3BDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUNqQyxPQUFxRDtJQUVyRCxPQUFPO1FBQ0wsR0FBRyxPQUFPO1FBQ1YsU0FBUyxFQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1FBQzdDLFVBQVUsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztRQUN0QyxJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7UUFDMUIsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ2hDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsZ0NBQWdDLENBQUM7S0FDbEYsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQ2xDLE9BQXNEO0lBRXRELE9BQU87UUFD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LE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUEyQixDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUF5QjtRQUNwQyxPQUFPLE1BQU0sU0FBUyxDQUFDLG9CQUFvQixDQUFDLHVCQUFBLElBQUksa0NBQUssRUFBRTtZQUNyRCxZQUFZLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZO1lBQ3pDLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7U0FDbkMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQXBpQ2xpZW50LFxuICBkZWNvZGVCYXNlNjRVcmwsXG4gIGVuY29kZVRvQmFzZTY0VXJsLFxuICB0eXBlIE11bHRpUmVnaW9uRW52LFxuICB0eXBlIEVudkludGVyZmFjZSxcbiAgdHlwZSBQYXNza2V5QXNzZXJ0Q2hhbGxlbmdlLFxuICB0eXBlIHNjaGVtYXMsXG4gIHR5cGUgU2Vzc2lvbkRhdGEsXG59IGZyb20gXCIuL2luZGV4LnRzXCI7XG5cbi8qKlxuICogQHBhcmFtIHZhbCBUaGUgdmFsdWUgdG8gY2hlY2tcbiAqIEByZXR1cm5zIElmIHRoZSB2YWx1ZSBpcyBgbnVsbGAsIHJldHVybnMgdW5kZWZpbmVkLCBvdGhlcndpc2UgcmV0dXJucyB0aGUgdmFsdWVcbiAqL1xuZnVuY3Rpb24gbm9OdWxsPFQ+KHZhbDogVCB8IG51bGwpOiBUIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIHZhbCA9PT0gbnVsbCA/IHVuZGVmaW5lZCA6IHZhbDtcbn1cblxuLyoqXG4gKiBAcGFyYW0gY3JlZCBDcmVkZW50aWFsIGRlc2NyaXB0b3IsIGFzIHJldHVybmVkIGJ5IHRoZSBDdWJlU2lnbmVyIGJhY2sgZW5kXG4gKiBAcmV0dXJucyBUaGUgY3JlZGVudGlhbCBjb252ZXJ0ZWQgdG8ge0BsaW5rIFB1YmxpY0tleUNyZWRlbnRpYWxEZXNjcmlwdG9yfVxuICovXG5mdW5jdGlvbiBtYXBQdWJsaWNLZXlDcmVkZW50aWFsRGVzY3JpcHRvcihcbiAgY3JlZDogc2NoZW1hc1tcIlB1YmxpY0tleUNyZWRlbnRpYWxEZXNjcmlwdG9yXCJdLFxuKTogUHVibGljS2V5Q3JlZGVudGlhbERlc2NyaXB0b3Ige1xuICByZXR1cm4ge1xuICAgIGlkOiBkZWNvZGVCYXNlNjRVcmwoY3JlZC5pZCksXG4gICAgdHlwZTogY3JlZC50eXBlLFxuICAgIHRyYW5zcG9ydHM6IG5vTnVsbChjcmVkLnRyYW5zcG9ydHMpLFxuICB9O1xufVxuXG4vKipcbiAqIE1hbnVhbCBpbXBsZW1lbnRhdGlvbiBvZiBbUHVibGljS2V5Q3JlZGVudGlhbC5wYXJzZVJlcXVlc3RPcHRpb25zRnJvbUpTT05dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9QdWJsaWNLZXlDcmVkZW50aWFsL3BhcnNlUmVxdWVzdE9wdGlvbnNGcm9tSlNPTl9zdGF0aWMpXG4gKiAoaW1wbGVtZW50ZWQgaGVyZSBiZWNhdXNlIG5vdCBhbGwgYnJvd3NlcnMgc3VwcG9ydCBpdClcbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBUaGUgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgYXMgcmV0dXJuZWQgYnkgdGhlIEN1YmVTaWduZXIgYmFjayBlbmRcbiAqIEByZXR1cm5zIFBhcnNlZCBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VSZXF1ZXN0T3B0aW9ucyhcbiAgb3B0aW9uczogc2NoZW1hc1tcIlB1YmxpY0tleUNyZWRlbnRpYWxSZXF1ZXN0T3B0aW9uc1wiXSxcbik6IFB1YmxpY0tleUNyZWRlbnRpYWxSZXF1ZXN0T3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgLi4ub3B0aW9ucyxcbiAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChvcHRpb25zLmNoYWxsZW5nZSksXG4gICAgZXh0ZW5zaW9uczogbm9OdWxsKG9wdGlvbnMuZXh0ZW5zaW9ucyksXG4gICAgcnBJZDogbm9OdWxsKG9wdGlvbnMucnBJZCksXG4gICAgdGltZW91dDogbm9OdWxsKG9wdGlvbnMudGltZW91dCksXG4gICAgYWxsb3dDcmVkZW50aWFsczogb3B0aW9ucy5hbGxvd0NyZWRlbnRpYWxzPy5tYXAobWFwUHVibGljS2V5Q3JlZGVudGlhbERlc2NyaXB0b3IpLFxuICB9O1xufVxuXG4vKipcbiAqIE1hbnVhbCBpbXBsZW1lbnRhdGlvbiBvZiBbUHVibGljS2V5Q3JlZGVudGlhbC5wYXJzZUNyZWF0aW9uT3B0aW9uc0Zyb21KU09OXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvUHVibGljS2V5Q3JlZGVudGlhbC9wYXJzZUNyZWF0aW9uT3B0aW9uc0Zyb21KU09OX3N0YXRpYylcbiAqIChpbXBsZW1lbnRlZCBoZXJlIGJlY2F1c2Ugbm90IGFsbCBicm93c2VycyBzdXBwb3J0IGl0KVxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBjcmVkZW50aWFsIGNyZWF0aW9uIG9wdGlvbnMgYXMgcmV0dXJuZWQgYnkgdGhlIEN1YmVTaWduZXIgYmFjayBlbmRcbiAqIEByZXR1cm5zIFBhcnNlZCBjcmVkZW50aWFsIGNyZWF0aW9uIG9wdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ3JlYXRpb25PcHRpb25zKFxuICBvcHRpb25zOiBzY2hlbWFzW1wiUHVibGljS2V5Q3JlZGVudGlhbENyZWF0aW9uT3B0aW9uc1wiXSxcbik6IFB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnMge1xuICByZXR1cm4ge1xuICAgIC4uLihvcHRpb25zIGFzIHVua25vd24gYXMgUHVibGljS2V5Q3JlZGVudGlhbENyZWF0aW9uT3B0aW9ucyksXG4gICAgY2hhbGxlbmdlOiBkZWNvZGVCYXNlNjRVcmwob3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIGV4Y2x1ZGVDcmVkZW50aWFsczogb3B0aW9ucy5leGNsdWRlQ3JlZGVudGlhbHM/Lm1hcChtYXBQdWJsaWNLZXlDcmVkZW50aWFsRGVzY3JpcHRvciksXG4gICAgdXNlcjoge1xuICAgICAgaWQ6IGRlY29kZUJhc2U2NFVybChvcHRpb25zLnVzZXIuaWQpLFxuICAgICAgZGlzcGxheU5hbWU6IG9wdGlvbnMudXNlci5kaXNwbGF5TmFtZSxcbiAgICAgIG5hbWU6IG9wdGlvbnMudXNlci5uYW1lLFxuICAgIH0sXG4gIH07XG59XG5cbi8qKlxuICogVHlwZSBuYXJyb3dpbmcgZnJvbSB7QGxpbmsgQXV0aGVudGljYXRvclJlc3BvbnNlfSB0byB7QGxpbmsgQXV0aGVudGljYXRvckF0dGVzdGF0aW9uUmVzcG9uc2V9XG4gKlxuICogQHBhcmFtIHJlc3AgVGhlIHZhbHVlIHRvIGNoZWNrXG4gKiBAcmV0dXJucyBXaGV0aGVyIHRoZSB2YWx1ZSBpcyBhIHtAbGluayBBdXRoZW50aWNhdG9yQXR0ZXN0YXRpb25SZXNwb25zZX1cbiAqL1xuZnVuY3Rpb24gaXNBdXRoZW50aWNhdG9yQXR0ZXN0YXRpb25SZXNwb25zZShcbiAgcmVzcDogQXV0aGVudGljYXRvclJlc3BvbnNlLFxuKTogcmVzcCBpcyBBdXRoZW50aWNhdG9yQXR0ZXN0YXRpb25SZXNwb25zZSB7XG4gIHJldHVybiAhIShyZXNwIGFzIEF1dGhlbnRpY2F0b3JBdHRlc3RhdGlvblJlc3BvbnNlKS5hdHRlc3RhdGlvbk9iamVjdDtcbn1cblxuLyoqXG4gKiBUeXBlIG5hcnJvd2luZyBmcm9tIHtAbGluayBBdXRoZW50aWNhdG9yUmVzcG9uc2V9IHRvIHtAbGluayBBdXRoZW50aWNhdG9yQXNzZXJ0aW9uUmVzcG9uc2V9XG4gKlxuICogQHBhcmFtIHJlc3AgVGhlIHZhbHVlIHRvIGNoZWNrXG4gKiBAcmV0dXJucyBXaGV0aGVyIHRoZSB2YWx1ZSBpcyBhIHtAbGluayBBdXRoZW50aWNhdG9yQXNzZXJ0aW9uUmVzcG9uc2V9XG4gKi9cbmZ1bmN0aW9uIGlzQXV0aGVudGljYXRvckFzc2VydGlvblJlc3BvbnNlKFxuICByZXNwOiBBdXRoZW50aWNhdG9yUmVzcG9uc2UsXG4pOiByZXNwIGlzIEF1dGhlbnRpY2F0b3JBc3NlcnRpb25SZXNwb25zZSB7XG4gIGNvbnN0IGFzQXNzZXJ0aW9uID0gcmVzcCBhcyBBdXRoZW50aWNhdG9yQXNzZXJ0aW9uUmVzcG9uc2U7XG4gIHJldHVybiAhIWFzQXNzZXJ0aW9uLmF1dGhlbnRpY2F0b3JEYXRhICYmICEhYXNBc3NlcnRpb24uc2lnbmF0dXJlO1xufVxuXG4vKipcbiAqIEBwYXJhbSBjcmVkIFRoZSBjcmVkZW50aWFsIHJlc3BvbnNlIHRvIGNvbnZlcnRcbiAqIEByZXR1cm5zIENvcnJlc3BvbmRpbmcgc2VyaWFsaXphYmxlIEpTT04gb2JqZWN0IHRoYXQgdGhlIEN1YmVTaWduZXIgYmFjayBlbmQgZXhwZWN0c1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlZGVudGlhbFRvSlNPTihjcmVkOiBQdWJsaWNLZXlDcmVkZW50aWFsKTogc2NoZW1hc1tcIlB1YmxpY0tleUNyZWRlbnRpYWxcIl0ge1xuICBpZiAoaXNBdXRoZW50aWNhdG9yQXR0ZXN0YXRpb25SZXNwb25zZShjcmVkLnJlc3BvbnNlKSkge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogY3JlZC5pZCxcbiAgICAgIGNsaWVudEV4dGVuc2lvblJlc3VsdHM6IGNyZWQuZ2V0Q2xpZW50RXh0ZW5zaW9uUmVzdWx0cygpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdHRlc3RhdGlvbk9iamVjdDogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdHRlc3RhdGlvbk9iamVjdCksXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBpZiAoaXNBdXRoZW50aWNhdG9yQXNzZXJ0aW9uUmVzcG9uc2UoY3JlZC5yZXNwb25zZSkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICBjbGllbnRFeHRlbnNpb25SZXN1bHRzOiBjcmVkLmdldENsaWVudEV4dGVuc2lvblJlc3VsdHMoKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIGNsaWVudERhdGFKU09OOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmNsaWVudERhdGFKU09OKSxcbiAgICAgICAgYXV0aGVudGljYXRvckRhdGE6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuYXV0aGVudGljYXRvckRhdGEpLFxuICAgICAgICBzaWduYXR1cmU6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2Uuc2lnbmF0dXJlKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVzcG9uc2VcIik7XG59XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIGZvciBhbnN3ZXJpbmcgYSBwYXNza2V5IGxvZ2luIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIFBhc3NrZXlMb2dpbkNoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNlbnY6IEVudkludGVyZmFjZSB8IE11bHRpUmVnaW9uRW52O1xuICByZWFkb25seSBjaGFsbGVuZ2U6IE9taXQ8UGFzc2tleUFzc2VydENoYWxsZW5nZSwgXCJvcHRpb25zXCI+O1xuICByZWFkb25seSBvcHRpb25zOiBQdWJsaWNLZXlDcmVkZW50aWFsUmVxdWVzdE9wdGlvbnM7XG5cbiAgLyoqXG4gICAqIEludGVybmFsLCBjYWxsZWQgYnkge0BsaW5rIEFwaUNsaWVudC5wYXNza2V5TG9naW5Jbml0fS5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUYXJnZXQgQ3ViZVNpZ25lciBlbnZpcm9ubWVudFxuICAgKiBAcGFyYW0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgdG8gYW5zd2VyXG4gICAqIEBwYXJhbSBwdXJwb3NlIE9wdGlvbmFsIGRlc2NyaXB0aXZlIHB1cnBvc2Ugb2YgdGhlIG5ldyBzZXNzaW9uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBlbnY6IEVudkludGVyZmFjZSB8IE11bHRpUmVnaW9uRW52LFxuICAgIGNoYWxsZW5nZTogUGFzc2tleUFzc2VydENoYWxsZW5nZSxcbiAgICByZWFkb25seSBwdXJwb3NlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLFxuICApIHtcbiAgICB0aGlzLiNlbnYgPSBlbnY7XG4gICAgdGhpcy5jaGFsbGVuZ2UgPSBjaGFsbGVuZ2U7XG4gICAgdGhpcy5vcHRpb25zID0gcGFyc2VSZXF1ZXN0T3B0aW9ucyhjaGFsbGVuZ2Uub3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gZ2V0IGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHJldHVybnMgTmV3IHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBnZXRDcmVkZW50aWFsQW5kQW5zd2VyKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIGlmIChjcmVkID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJDcmVkZW50aWFsIG5vdCBmb3VuZFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCBhcyBQdWJsaWNLZXlDcmVkZW50aWFsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcmV0dXJucyBOZXcgc2Vzc2lvblxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IFB1YmxpY0tleUNyZWRlbnRpYWwpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5wYXNza2V5TG9naW5Db21wbGV0ZSh0aGlzLiNlbnYsIHtcbiAgICAgIGNoYWxsZW5nZV9pZDogdGhpcy5jaGFsbGVuZ2UuY2hhbGxlbmdlX2lkLFxuICAgICAgY3JlZGVudGlhbDogY3JlZGVudGlhbFRvSlNPTihjcmVkKSxcbiAgICB9KTtcbiAgfVxufVxuIl19