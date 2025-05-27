"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasskeyLoginChallenge = void 0;
exports.parseRequestOptions = parseRequestOptions;
exports.parseCreationOptions = parseCreationOptions;
exports.credentialToJSON = credentialToJSON;
const _1 = require(".");
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
        id: (0, _1.decodeBase64Url)(cred.id),
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
function parseRequestOptions(options) {
    return {
        ...options,
        challenge: (0, _1.decodeBase64Url)(options.challenge),
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
function parseCreationOptions(options) {
    return {
        ...options,
        challenge: (0, _1.decodeBase64Url)(options.challenge),
        excludeCredentials: options.excludeCredentials?.map(mapPublicKeyCredentialDescriptor),
        user: {
            id: (0, _1.decodeBase64Url)(options.user.id),
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
function credentialToJSON(cred) {
    if (isAuthenticatorAttestationResponse(cred.response)) {
        return {
            id: cred.id,
            response: {
                clientDataJSON: (0, _1.encodeToBase64Url)(cred.response.clientDataJSON),
                attestationObject: (0, _1.encodeToBase64Url)(cred.response.attestationObject),
            },
        };
    }
    if (isAuthenticatorAssertionResponse(cred.response)) {
        return {
            id: cred.id,
            response: {
                clientDataJSON: (0, _1.encodeToBase64Url)(cred.response.clientDataJSON),
                authenticatorData: (0, _1.encodeToBase64Url)(cred.response.authenticatorData),
                signature: (0, _1.encodeToBase64Url)(cred.response.signature),
            },
        };
    }
    throw new Error("Unrecognized public key credential response");
}
/**
 * Helper class for answering a passkey login challenge.
 */
class PasskeyLoginChallenge {
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
        const cred = await navigator.credentials.get({
            publicKey: this.options,
            mediation: (this.options.allowCredentials ?? []).length > 0 ? undefined : "conditional",
        });
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
        return await _1.ApiClient.passkeyLoginComplete(__classPrivateFieldGet(this, _PasskeyLoginChallenge_env, "f"), {
            challenge_id: this.challenge.challenge_id,
            credential: credentialToJSON(cred),
        });
    }
}
exports.PasskeyLoginChallenge = PasskeyLoginChallenge;
_PasskeyLoginChallenge_env = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFzc2tleS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXNza2V5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQXVDQSxrREFXQztBQVNELG9EQWFDO0FBK0JELDRDQXVCQztBQTlIRCx3QkFRVztBQUVYOzs7R0FHRztBQUNILFNBQVMsTUFBTSxDQUFJLEdBQWE7SUFDOUIsT0FBTyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUN4QyxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxnQ0FBZ0MsQ0FDdkMsSUFBOEM7SUFFOUMsT0FBTztRQUNMLEVBQUUsRUFBRSxJQUFBLGtCQUFlLEVBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUM1QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7S0FDcEMsQ0FBQztBQUNKLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixtQkFBbUIsQ0FDakMsT0FBcUQ7SUFFckQsT0FBTztRQUNMLEdBQUcsT0FBTztRQUNWLFNBQVMsRUFBRSxJQUFBLGtCQUFlLEVBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUM3QyxVQUFVLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFDdEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQzFCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUNoQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLGdDQUFnQyxDQUFDO0tBQ2xGLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0Isb0JBQW9CLENBQ2xDLE9BQXNEO0lBRXRELE9BQU87UUFDTCxHQUFJLE9B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QUFLLElBQUk7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDM0QsT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBMkIsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7T0FXRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBeUI7UUFDcEMsT0FBTyxNQUFNLFlBQVMsQ0FBQyxvQkFBb0IsQ0FBQyx1QkFBQSxJQUFJLGtDQUFLLEVBQUU7WUFDckQsWUFBWSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsWUFBWTtZQUN6QyxVQUFVLEVBQUUsZ0JBQWdCLENBQUMsSUFBSSxDQUFDO1NBQ25DLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZERCxzREF1REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBcGlDbGllbnQsXG4gIGRlY29kZUJhc2U2NFVybCxcbiAgZW5jb2RlVG9CYXNlNjRVcmwsXG4gIHR5cGUgRW52SW50ZXJmYWNlLFxuICB0eXBlIFBhc3NrZXlBc3NlcnRDaGFsbGVuZ2UsXG4gIHR5cGUgc2NoZW1hcyxcbiAgdHlwZSBTZXNzaW9uRGF0YSxcbn0gZnJvbSBcIi5cIjtcblxuLyoqXG4gKiBAcGFyYW0gdmFsIFRoZSB2YWx1ZSB0byBjaGVja1xuICogQHJldHVybnMgSWYgdGhlIHZhbHVlIGlzIGBudWxsYCwgcmV0dXJucyB1bmRlZmluZWQsIG90aGVyd2lzZSByZXR1cm5zIHRoZSB2YWx1ZVxuICovXG5mdW5jdGlvbiBub051bGw8VD4odmFsOiBUIHwgbnVsbCk6IFQgfCB1bmRlZmluZWQge1xuICByZXR1cm4gdmFsID09PSBudWxsID8gdW5kZWZpbmVkIDogdmFsO1xufVxuXG4vKipcbiAqIEBwYXJhbSBjcmVkIENyZWRlbnRpYWwgZGVzY3JpcHRvciwgYXMgcmV0dXJuZWQgYnkgdGhlIEN1YmVTaWduZXIgYmFjayBlbmRcbiAqIEByZXR1cm5zIFRoZSBjcmVkZW50aWFsIGNvbnZlcnRlZCB0byB7QGxpbmsgUHVibGljS2V5Q3JlZGVudGlhbERlc2NyaXB0b3J9XG4gKi9cbmZ1bmN0aW9uIG1hcFB1YmxpY0tleUNyZWRlbnRpYWxEZXNjcmlwdG9yKFxuICBjcmVkOiBzY2hlbWFzW1wiUHVibGljS2V5Q3JlZGVudGlhbERlc2NyaXB0b3JcIl0sXG4pOiBQdWJsaWNLZXlDcmVkZW50aWFsRGVzY3JpcHRvciB7XG4gIHJldHVybiB7XG4gICAgaWQ6IGRlY29kZUJhc2U2NFVybChjcmVkLmlkKSxcbiAgICB0eXBlOiBjcmVkLnR5cGUsXG4gICAgdHJhbnNwb3J0czogbm9OdWxsKGNyZWQudHJhbnNwb3J0cyksXG4gIH07XG59XG5cbi8qKlxuICogTWFudWFsIGltcGxlbWVudGF0aW9uIG9mIFtQdWJsaWNLZXlDcmVkZW50aWFsLnBhcnNlUmVxdWVzdE9wdGlvbnNGcm9tSlNPTl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1B1YmxpY0tleUNyZWRlbnRpYWwvcGFyc2VSZXF1ZXN0T3B0aW9uc0Zyb21KU09OX3N0YXRpYylcbiAqIChpbXBsZW1lbnRlZCBoZXJlIGJlY2F1c2Ugbm90IGFsbCBicm93c2VycyBzdXBwb3J0IGl0KVxuICpcbiAqIEBwYXJhbSBvcHRpb25zIFRoZSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBhcyByZXR1cm5lZCBieSB0aGUgQ3ViZVNpZ25lciBiYWNrIGVuZFxuICogQHJldHVybnMgUGFyc2VkIGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVJlcXVlc3RPcHRpb25zKFxuICBvcHRpb25zOiBzY2hlbWFzW1wiUHVibGljS2V5Q3JlZGVudGlhbFJlcXVlc3RPcHRpb25zXCJdLFxuKTogUHVibGljS2V5Q3JlZGVudGlhbFJlcXVlc3RPcHRpb25zIHtcbiAgcmV0dXJuIHtcbiAgICAuLi5vcHRpb25zLFxuICAgIGNoYWxsZW5nZTogZGVjb2RlQmFzZTY0VXJsKG9wdGlvbnMuY2hhbGxlbmdlKSxcbiAgICBleHRlbnNpb25zOiBub051bGwob3B0aW9ucy5leHRlbnNpb25zKSxcbiAgICBycElkOiBub051bGwob3B0aW9ucy5ycElkKSxcbiAgICB0aW1lb3V0OiBub051bGwob3B0aW9ucy50aW1lb3V0KSxcbiAgICBhbGxvd0NyZWRlbnRpYWxzOiBvcHRpb25zLmFsbG93Q3JlZGVudGlhbHM/Lm1hcChtYXBQdWJsaWNLZXlDcmVkZW50aWFsRGVzY3JpcHRvciksXG4gIH07XG59XG5cbi8qKlxuICogTWFudWFsIGltcGxlbWVudGF0aW9uIG9mIFtQdWJsaWNLZXlDcmVkZW50aWFsLnBhcnNlQ3JlYXRpb25PcHRpb25zRnJvbUpTT05dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9QdWJsaWNLZXlDcmVkZW50aWFsL3BhcnNlQ3JlYXRpb25PcHRpb25zRnJvbUpTT05fc3RhdGljKVxuICogKGltcGxlbWVudGVkIGhlcmUgYmVjYXVzZSBub3QgYWxsIGJyb3dzZXJzIHN1cHBvcnQgaXQpXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgVGhlIGNyZWRlbnRpYWwgY3JlYXRpb24gb3B0aW9ucyBhcyByZXR1cm5lZCBieSB0aGUgQ3ViZVNpZ25lciBiYWNrIGVuZFxuICogQHJldHVybnMgUGFyc2VkIGNyZWRlbnRpYWwgY3JlYXRpb24gb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDcmVhdGlvbk9wdGlvbnMoXG4gIG9wdGlvbnM6IHNjaGVtYXNbXCJQdWJsaWNLZXlDcmVkZW50aWFsQ3JlYXRpb25PcHRpb25zXCJdLFxuKTogUHVibGljS2V5Q3JlZGVudGlhbENyZWF0aW9uT3B0aW9ucyB7XG4gIHJldHVybiB7XG4gICAgLi4uKG9wdGlvbnMgYXMgdW5rbm93biBhcyBQdWJsaWNLZXlDcmVkZW50aWFsQ3JlYXRpb25PcHRpb25zKSxcbiAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChvcHRpb25zLmNoYWxsZW5nZSksXG4gICAgZXhjbHVkZUNyZWRlbnRpYWxzOiBvcHRpb25zLmV4Y2x1ZGVDcmVkZW50aWFscz8ubWFwKG1hcFB1YmxpY0tleUNyZWRlbnRpYWxEZXNjcmlwdG9yKSxcbiAgICB1c2VyOiB7XG4gICAgICBpZDogZGVjb2RlQmFzZTY0VXJsKG9wdGlvbnMudXNlci5pZCksXG4gICAgICBkaXNwbGF5TmFtZTogb3B0aW9ucy51c2VyLmRpc3BsYXlOYW1lLFxuICAgICAgbmFtZTogb3B0aW9ucy51c2VyLm5hbWUsXG4gICAgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiBUeXBlIG5hcnJvd2luZyBmcm9tIHtAbGluayBBdXRoZW50aWNhdG9yUmVzcG9uc2V9IHRvIHtAbGluayBBdXRoZW50aWNhdG9yQXR0ZXN0YXRpb25SZXNwb25zZX1cbiAqXG4gKiBAcGFyYW0gcmVzcCBUaGUgdmFsdWUgdG8gY2hlY2tcbiAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIHZhbHVlIGlzIGEge0BsaW5rIEF1dGhlbnRpY2F0b3JBdHRlc3RhdGlvblJlc3BvbnNlfVxuICovXG5mdW5jdGlvbiBpc0F1dGhlbnRpY2F0b3JBdHRlc3RhdGlvblJlc3BvbnNlKFxuICByZXNwOiBBdXRoZW50aWNhdG9yUmVzcG9uc2UsXG4pOiByZXNwIGlzIEF1dGhlbnRpY2F0b3JBdHRlc3RhdGlvblJlc3BvbnNlIHtcbiAgcmV0dXJuICEhKHJlc3AgYXMgQXV0aGVudGljYXRvckF0dGVzdGF0aW9uUmVzcG9uc2UpLmF0dGVzdGF0aW9uT2JqZWN0O1xufVxuXG4vKipcbiAqIFR5cGUgbmFycm93aW5nIGZyb20ge0BsaW5rIEF1dGhlbnRpY2F0b3JSZXNwb25zZX0gdG8ge0BsaW5rIEF1dGhlbnRpY2F0b3JBc3NlcnRpb25SZXNwb25zZX1cbiAqXG4gKiBAcGFyYW0gcmVzcCBUaGUgdmFsdWUgdG8gY2hlY2tcbiAqIEByZXR1cm5zIFdoZXRoZXIgdGhlIHZhbHVlIGlzIGEge0BsaW5rIEF1dGhlbnRpY2F0b3JBc3NlcnRpb25SZXNwb25zZX1cbiAqL1xuZnVuY3Rpb24gaXNBdXRoZW50aWNhdG9yQXNzZXJ0aW9uUmVzcG9uc2UoXG4gIHJlc3A6IEF1dGhlbnRpY2F0b3JSZXNwb25zZSxcbik6IHJlc3AgaXMgQXV0aGVudGljYXRvckFzc2VydGlvblJlc3BvbnNlIHtcbiAgY29uc3QgYXNBc3NlcnRpb24gPSByZXNwIGFzIEF1dGhlbnRpY2F0b3JBc3NlcnRpb25SZXNwb25zZTtcbiAgcmV0dXJuICEhYXNBc3NlcnRpb24uYXV0aGVudGljYXRvckRhdGEgJiYgISFhc0Fzc2VydGlvbi5zaWduYXR1cmU7XG59XG5cbi8qKlxuICogQHBhcmFtIGNyZWQgVGhlIGNyZWRlbnRpYWwgcmVzcG9uc2UgdG8gY29udmVydFxuICogQHJldHVybnMgQ29ycmVzcG9uZGluZyBzZXJpYWxpemFibGUgSlNPTiBvYmplY3QgdGhhdCB0aGUgQ3ViZVNpZ25lciBiYWNrIGVuZCBleHBlY3RzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVkZW50aWFsVG9KU09OKGNyZWQ6IFB1YmxpY0tleUNyZWRlbnRpYWwpOiBzY2hlbWFzW1wiUHVibGljS2V5Q3JlZGVudGlhbFwiXSB7XG4gIGlmIChpc0F1dGhlbnRpY2F0b3JBdHRlc3RhdGlvblJlc3BvbnNlKGNyZWQucmVzcG9uc2UpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBjcmVkLmlkLFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdHRlc3RhdGlvbk9iamVjdDogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdHRlc3RhdGlvbk9iamVjdCksXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBpZiAoaXNBdXRoZW50aWNhdG9yQXNzZXJ0aW9uUmVzcG9uc2UoY3JlZC5yZXNwb25zZSkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICByZXNwb25zZToge1xuICAgICAgICBjbGllbnREYXRhSlNPTjogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5jbGllbnREYXRhSlNPTiksXG4gICAgICAgIGF1dGhlbnRpY2F0b3JEYXRhOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmF1dGhlbnRpY2F0b3JEYXRhKSxcbiAgICAgICAgc2lnbmF0dXJlOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLnNpZ25hdHVyZSksXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgcHVibGljIGtleSBjcmVkZW50aWFsIHJlc3BvbnNlXCIpO1xufVxuXG4vKipcbiAqIEhlbHBlciBjbGFzcyBmb3IgYW5zd2VyaW5nIGEgcGFzc2tleSBsb2dpbiBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBQYXNza2V5TG9naW5DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjZW52OiBFbnZJbnRlcmZhY2U7XG4gIHJlYWRvbmx5IGNoYWxsZW5nZTogT21pdDxQYXNza2V5QXNzZXJ0Q2hhbGxlbmdlLCBcIm9wdGlvbnNcIj47XG4gIHJlYWRvbmx5IG9wdGlvbnM6IFB1YmxpY0tleUNyZWRlbnRpYWxSZXF1ZXN0T3B0aW9ucztcblxuICAvKipcbiAgICogSW50ZXJuYWwsIGNhbGxlZCBieSB7QGxpbmsgQXBpQ2xpZW50LnBhc3NrZXlMb2dpbkluaXR9LlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRhcmdldCBDdWJlU2lnbmVyIGVudmlyb25tZW50XG4gICAqIEBwYXJhbSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSB0byBhbnN3ZXJcbiAgICogQHBhcmFtIHB1cnBvc2UgT3B0aW9uYWwgZGVzY3JpcHRpdmUgcHVycG9zZSBvZiB0aGUgbmV3IHNlc3Npb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIGNoYWxsZW5nZTogUGFzc2tleUFzc2VydENoYWxsZW5nZSxcbiAgICByZWFkb25seSBwdXJwb3NlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkLFxuICApIHtcbiAgICB0aGlzLiNlbnYgPSBlbnY7XG4gICAgdGhpcy5jaGFsbGVuZ2UgPSBjaGFsbGVuZ2U7XG4gICAgdGhpcy5vcHRpb25zID0gcGFyc2VSZXF1ZXN0T3B0aW9ucyhjaGFsbGVuZ2Uub3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gZ2V0IGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHJldHVybnMgTmV3IHNlc3Npb24uXG4gICAqL1xuICBhc3luYyBnZXRDcmVkZW50aWFsQW5kQW5zd2VyKCk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7XG4gICAgICBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyxcbiAgICAgIG1lZGlhdGlvbjogKHRoaXMub3B0aW9ucy5hbGxvd0NyZWRlbnRpYWxzID8/IFtdKS5sZW5ndGggPiAwID8gdW5kZWZpbmVkIDogXCJjb25kaXRpb25hbFwiLFxuICAgIH0pO1xuICAgIGlmIChjcmVkID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJDcmVkZW50aWFsIG5vdCBmb3VuZFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCBhcyBQdWJsaWNLZXlDcmVkZW50aWFsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcmV0dXJucyBOZXcgc2Vzc2lvblxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IFB1YmxpY0tleUNyZWRlbnRpYWwpOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgcmV0dXJuIGF3YWl0IEFwaUNsaWVudC5wYXNza2V5TG9naW5Db21wbGV0ZSh0aGlzLiNlbnYsIHtcbiAgICAgIGNoYWxsZW5nZV9pZDogdGhpcy5jaGFsbGVuZ2UuY2hhbGxlbmdlX2lkLFxuICAgICAgY3JlZGVudGlhbDogY3JlZGVudGlhbFRvSlNPTihjcmVkKSxcbiAgICB9KTtcbiAgfVxufVxuIl19