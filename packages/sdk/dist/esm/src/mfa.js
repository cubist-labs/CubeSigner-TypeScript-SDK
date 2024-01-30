/* eslint-disable @typescript-eslint/no-explicit-any */
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
var _TotpChallenge_api, _TotpChallenge_totpInfo, _AddFidoChallenge_api, _MfaFidoChallenge_api;
import { decodeBase64Url, encodeToBase64Url } from "./util";
/** TOTP challenge that must be answered before user's TOTP is updated */
export class TotpChallenge {
    /** The id of the challenge */
    get totpId() {
        return __classPrivateFieldGet(this, _TotpChallenge_totpInfo, "f").totp_id;
    }
    /** The new TOTP configuration */
    get totpUrl() {
        return __classPrivateFieldGet(this, _TotpChallenge_totpInfo, "f").totp_url;
    }
    /**
     * @param {CubeSignerApi} api Used when answering the challenge.
     * @param {TotpInfo} totpInfo TOTP challenge information.
     */
    constructor(api, totpInfo) {
        _TotpChallenge_api.set(this, void 0);
        _TotpChallenge_totpInfo.set(this, void 0);
        __classPrivateFieldSet(this, _TotpChallenge_api, api, "f");
        __classPrivateFieldSet(this, _TotpChallenge_totpInfo, totpInfo, "f");
    }
    /**
     * Answer the challenge with the code that corresponds to `this.totpUrl`.
     * @param {string} code 6-digit code that corresponds to `this.totpUrl`.
     */
    async answer(code) {
        if (!/^\d{1,6}$/.test(code)) {
            throw new Error(`Invalid TOTP code: ${code}; it must be a 6-digit string`);
        }
        await __classPrivateFieldGet(this, _TotpChallenge_api, "f").userTotpResetComplete(this.totpId, code);
    }
}
_TotpChallenge_api = new WeakMap(), _TotpChallenge_totpInfo = new WeakMap();
/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
export class AddFidoChallenge {
    /**
     * Constructor
     * @param {CubeSignerApi} api The API client used to request to add a FIDO device
     * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
     */
    constructor(api, challenge) {
        _AddFidoChallenge_api.set(this, void 0);
        __classPrivateFieldSet(this, _AddFidoChallenge_api, api, "f");
        this.challengeId = challenge.challenge_id;
        // fix options returned from the server: rename fields and decode base64 fields to uint8[]
        this.options = {
            ...challenge.options,
            challenge: decodeBase64Url(challenge.options.challenge),
        };
        if (challenge.options.user) {
            this.options.user.id = decodeBase64Url(challenge.options.user.id);
        }
        for (const credential of this.options.excludeCredentials ?? []) {
            credential.id = decodeBase64Url(credential.id);
        }
    }
    /**
     * Answers this challenge by using the `CredentialsContainer` API to create a credential
     * based on the the public key credential creation options from this challenge.
     */
    async createCredentialAndAnswer() {
        const cred = await navigator.credentials.create({ publicKey: this.options });
        await this.answer(cred);
    }
    /**
     * Answers this challenge using a given credential `cred`;
     * the credential should be obtained by calling
     *
     * ```
     * const cred = await navigator.credentials.create({ publicKey: this.options });
     * ```
     *
     * @param {any} cred Credential created by calling the `CredentialContainer`'s `create` method
     *                   based on the public key creation options from this challenge.
     */
    async answer(cred) {
        const answer = {
            id: cred.id,
            response: {
                clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
                attestationObject: encodeToBase64Url(cred.response.attestationObject),
            },
        };
        await __classPrivateFieldGet(this, _AddFidoChallenge_api, "f").userFidoRegisterComplete(this.challengeId, answer);
    }
}
_AddFidoChallenge_api = new WeakMap();
/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
export class MfaFidoChallenge {
    /**
     * @param {CubeSignerApi} api The API client used to initiate MFA approval using FIDO
     * @param {string} mfaId The MFA request id.
     * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
     */
    constructor(api, mfaId, challenge) {
        _MfaFidoChallenge_api.set(this, void 0);
        __classPrivateFieldSet(this, _MfaFidoChallenge_api, api, "f");
        this.mfaId = mfaId;
        this.challengeId = challenge.challenge_id;
        // fix options returned from the server: rename fields and decode base64 fields into uint8[]
        this.options = {
            ...challenge.options,
            challenge: decodeBase64Url(challenge.options.challenge),
        };
        for (const credential of this.options.allowCredentials ?? []) {
            credential.id = decodeBase64Url(credential.id);
            if (credential.transports === null) {
                delete credential.transports;
            }
        }
    }
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     *
     * @param {MfaVote} vote Approve or reject the MFA request. Defaults to "approve".
     */
    async createCredentialAndAnswer(vote) {
        const cred = await navigator.credentials.get({ publicKey: this.options });
        return await this.answer(cred, vote);
    }
    /**
     * Answers this challenge using a given credential `cred`.
     * To obtain this credential, for example, call
     *
     * ```
     * const cred = await navigator.credentials.get({ publicKey: this.options });
     * ```
     *
     * @param {any} cred Credential created by calling the `CredentialContainer`'s `get` method
     *                   based on the public key credential request options from this challenge.
     * @param {MfaVote} vote Approve or reject. Defaults to "approve".
     */
    async answer(cred, vote = "approve") {
        const answer = {
            id: cred.id,
            response: {
                clientDataJSON: encodeToBase64Url(cred.response.clientDataJSON),
                authenticatorData: encodeToBase64Url(cred.response.authenticatorData),
                signature: encodeToBase64Url(cred.response.signature),
            },
        };
        return await __classPrivateFieldGet(this, _MfaFidoChallenge_api, "f").mfaVoteFidoComplete(this.mfaId, vote, this.challengeId, answer);
    }
}
_MfaFidoChallenge_api = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1REFBdUQ7Ozs7Ozs7Ozs7Ozs7QUFVdkQsT0FBTyxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQWE1RCx5RUFBeUU7QUFDekUsTUFBTSxPQUFPLGFBQWE7SUFJeEIsOEJBQThCO0lBQzlCLElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLE9BQU8sQ0FBQztJQUNoQyxDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLFFBQVEsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxHQUFrQixFQUFFLFFBQWtCO1FBakJ6QyxxQ0FBb0I7UUFDcEIsMENBQW9CO1FBaUIzQix1QkFBQSxJQUFJLHNCQUFRLEdBQUcsTUFBQSxDQUFDO1FBQ2hCLHVCQUFBLElBQUksMkJBQWEsUUFBUSxNQUFBLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWTtRQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLElBQUksK0JBQStCLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsTUFBTSx1QkFBQSxJQUFJLDBCQUFLLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQ0Y7O0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQUszQjs7OztPQUlHO0lBQ0gsWUFBWSxHQUFrQixFQUFFLFNBQThCO1FBVHJELHdDQUFvQjtRQVUzQix1QkFBQSxJQUFJLHlCQUFR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SUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFTLEVBQUUsT0FBZ0IsU0FBUztRQUMvQyxNQUFNLE1BQU0sR0FBd0I7WUFDbEMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ1gsUUFBUSxFQUFFO2dCQUNSLGNBQWMsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQztnQkFDL0QsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDckUsU0FBUyxFQUFFLGlCQUFpQixDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO2FBQ3REO1NBQ0YsQ0FBQztRQUNGLE9BQU8sTUFBTSx1QkFBQSxJQUFJLDZCQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG5cbmltcG9ydCB7XG4gIEFwaUFkZEZpZG9DaGFsbGVuZ2UsXG4gIEFwaU1mYUZpZG9DaGFsbGVuZ2UsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZmFWb3RlLFxuICBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICBUb3RwSW5mbyxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBkZWNvZGVCYXNlNjRVcmwsIGVuY29kZVRvQmFzZTY0VXJsIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckFwaSB9IGZyb20gXCIuL2FwaVwiO1xuXG4vKiogTUZBIHJlY2VpcHQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWZhUmVjZWlwdCB7XG4gIC8qKiBNRkEgcmVxdWVzdCBJRCAqL1xuICBtZmFJZDogc3RyaW5nO1xuICAvKiogQ29ycmVzcG9uZGluZyBvcmcgSUQgKi9cbiAgbWZhT3JnSWQ6IHN0cmluZztcbiAgLyoqIE1GQSBjb25maXJtYXRpb24gY29kZSAqL1xuICBtZmFDb25mOiBzdHJpbmc7XG59XG5cbi8qKiBUT1RQIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYmVmb3JlIHVzZXIncyBUT1RQIGlzIHVwZGF0ZWQgKi9cbmV4cG9ydCBjbGFzcyBUb3RwQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaTogQ3ViZVNpZ25lckFwaTtcbiAgcmVhZG9ubHkgI3RvdHBJbmZvOiBUb3RwSW5mbztcblxuICAvKiogVGhlIGlkIG9mIHRoZSBjaGFsbGVuZ2UgKi9cbiAgZ2V0IHRvdHBJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdG90cEluZm8udG90cF9pZDtcbiAgfVxuXG4gIC8qKiBUaGUgbmV3IFRPVFAgY29uZmlndXJhdGlvbiAqL1xuICBnZXQgdG90cFVybCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdG90cEluZm8udG90cF91cmw7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQXBpfSBhcGkgVXNlZCB3aGVuIGFuc3dlcmluZyB0aGUgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0ge1RvdHBJbmZvfSB0b3RwSW5mbyBUT1RQIGNoYWxsZW5nZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaTogQ3ViZVNpZ25lckFwaSwgdG90cEluZm86IFRvdHBJbmZvKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIHRoaXMuI3RvdHBJbmZvID0gdG90cEluZm87XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBjaGFsbGVuZ2Ugd2l0aCB0aGUgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSA2LWRpZ2l0IGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eXFxkezEsNn0kLy50ZXN0KGNvZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVE9UUCBjb2RlOiAke2NvZGV9OyBpdCBtdXN0IGJlIGEgNi1kaWdpdCBzdHJpbmdgKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlclRvdHBSZXNldENvbXBsZXRlKHRoaXMudG90cElkLCBjb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGNyZWF0aW5nIGEgcmVxdWVzdCB0byBhZGQgYSBuZXcgRklETyBkZXZpY2UuXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBBZGRGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaTogQ3ViZVNpZ25lckFwaTtcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJBcGl9IGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIHJlcXVlc3QgdG8gYWRkIGEgRklETyBkZXZpY2VcbiAgICogQHBhcmFtIHtBcGlBZGRGaWRvQ2hhbGxlbmdlfSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaTogQ3ViZVNpZ25lckFwaSwgY2hhbGxlbmdlOiBBcGlBZGRGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIHRoaXMuY2hhbGxlbmdlSWQgPSBjaGFsbGVuZ2UuY2hhbGxlbmdlX2lkO1xuXG4gICAgLy8gZml4IG9wdGlvbnMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyOiByZW5hbWUgZmllbGRzIGFuZCBkZWNvZGUgYmFzZTY0IGZpZWxkcyB0byB1aW50OFtdXG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uY2hhbGxlbmdlLm9wdGlvbnMsXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG5cbiAgICBpZiAoY2hhbGxlbmdlLm9wdGlvbnMudXNlcikge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXIuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMudXNlci5pZCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjcmVkZW50aWFsIG9mIHRoaXMub3B0aW9ucy5leGNsdWRlQ3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGNyZWF0ZSBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcigpIHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmNyZWF0ZSh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIGF3YWl0IHRoaXMuYW5zd2VyKGNyZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgdXNpbmcgYSBnaXZlbiBjcmVkZW50aWFsIGBjcmVkYDtcbiAgICogdGhlIGNyZWRlbnRpYWwgc2hvdWxkIGJlIG9idGFpbmVkIGJ5IGNhbGxpbmdcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gY3JlZCBDcmVkZW50aWFsIGNyZWF0ZWQgYnkgY2FsbGluZyB0aGUgYENyZWRlbnRpYWxDb250YWluZXJgJ3MgYGNyZWF0ZWAgbWV0aG9kXG4gICAqICAgICAgICAgICAgICAgICAgIGJhc2VkIG9uIHRoZSBwdWJsaWMga2V5IGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjcmVkOiBhbnkpIHtcbiAgICBjb25zdCBhbnN3ZXIgPSA8UHVibGljS2V5Q3JlZGVudGlhbD57XG4gICAgICBpZDogY3JlZC5pZCxcbiAgICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIGNsaWVudERhdGFKU09OOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmNsaWVudERhdGFKU09OKSxcbiAgICAgICAgYXR0ZXN0YXRpb25PYmplY3Q6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuYXR0ZXN0YXRpb25PYmplY3QpLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGF3YWl0IHRoaXMuI2FwaS51c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGUodGhpcy5jaGFsbGVuZ2VJZCwgYW5zd2VyKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGluaXRpYXRpbmcgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE8uXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaTogQ3ViZVNpZ25lckFwaTtcbiAgcmVhZG9ubHkgbWZhSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJBcGl9IGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIGluaXRpYXRlIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgaWQuXG4gICAqIEBwYXJhbSB7QXBpTWZhRmlkb0NoYWxsZW5nZX0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaTogQ3ViZVNpZ25lckFwaSwgbWZhSWQ6IHN0cmluZywgY2hhbGxlbmdlOiBBcGlNZmFGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIHRoaXMubWZhSWQgPSBtZmFJZDtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgaW50byB1aW50OFtdXG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uY2hhbGxlbmdlLm9wdGlvbnMsXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmFsbG93Q3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgICBpZiAoY3JlZGVudGlhbC50cmFuc3BvcnRzID09PSBudWxsKSB7XG4gICAgICAgIGRlbGV0ZSBjcmVkZW50aWFsLnRyYW5zcG9ydHM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGdldCBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcih2b3RlPzogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFuc3dlcihjcmVkLCB2b3RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0ge01mYVZvdGV9IHZvdGUgQXBwcm92ZSBvciByZWplY3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSwgdm90ZTogTWZhVm90ZSA9IFwiYXBwcm92ZVwiKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGFuc3dlciA9IDxQdWJsaWNLZXlDcmVkZW50aWFsPntcbiAgICAgIGlkOiBjcmVkLmlkLFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdXRoZW50aWNhdG9yRGF0YTogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdXRoZW50aWNhdG9yRGF0YSksXG4gICAgICAgIHNpZ25hdHVyZTogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5zaWduYXR1cmUpLFxuICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGkubWZhVm90ZUZpZG9Db21wbGV0ZSh0aGlzLm1mYUlkLCB2b3RlLCB0aGlzLmNoYWxsZW5nZUlkLCBhbnN3ZXIpO1xuICB9XG59XG4iXX0=