"use strict";
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
var _TotpChallenge_csc, _TotpChallenge_totpInfo, _AddFidoChallenge_csc, _MfaFidoChallenge_csc;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaFidoChallenge = exports.AddFidoChallenge = exports.TotpChallenge = void 0;
const util_1 = require("./util");
/** TOTP challenge that must be answered before user's TOTP is updated */
class TotpChallenge {
    /** The id of the challenge */
    get totpId() {
        return __classPrivateFieldGet(this, _TotpChallenge_totpInfo, "f").totp_id;
    }
    /** The new TOTP configuration */
    get totpUrl() {
        return __classPrivateFieldGet(this, _TotpChallenge_totpInfo, "f").totp_url;
    }
    /**
     * @param {CubeSignerClient} csc Used when answering the challenge.
     * @param {TotpInfo} totpInfo TOTP challenge information.
     */
    constructor(csc, totpInfo) {
        _TotpChallenge_csc.set(this, void 0);
        _TotpChallenge_totpInfo.set(this, void 0);
        __classPrivateFieldSet(this, _TotpChallenge_csc, csc, "f");
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
        await __classPrivateFieldGet(this, _TotpChallenge_csc, "f").userResetTotpComplete(this.totpId, code);
    }
}
exports.TotpChallenge = TotpChallenge;
_TotpChallenge_csc = new WeakMap(), _TotpChallenge_totpInfo = new WeakMap();
/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
class AddFidoChallenge {
    /**
     * Constructor
     * @param {CubeSignerClient} csc CubeSigner instance used to request to add a FIDO device
     * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
     */
    constructor(csc, challenge) {
        _AddFidoChallenge_csc.set(this, void 0);
        __classPrivateFieldSet(this, _AddFidoChallenge_csc, csc, "f");
        this.challengeId = challenge.challenge_id;
        // fix options returned from the server: rename fields and decode base64 fields to uint8[]
        this.options = {
            ...challenge.options,
            challenge: (0, util_1.decodeBase64Url)(challenge.options.challenge),
        };
        this.options.pubKeyCredParams ??= challenge.options.pub_key_cred_params;
        this.options.excludeCredentials ??= challenge.options.exclude_credentials;
        this.options.authenticatorSelection ??= challenge.options.authenticator_selection;
        delete this.options.pub_key_cred_params;
        delete this.options.exclude_credentials;
        delete this.options.authenticator_selection;
        if (challenge.options.user) {
            this.options.user.id = (0, util_1.decodeBase64Url)(challenge.options.user.id);
        }
        for (const credential of this.options.excludeCredentials ?? []) {
            credential.id = (0, util_1.decodeBase64Url)(credential.id);
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
                clientDataJSON: (0, util_1.encodeToBase64Url)(cred.response.clientDataJSON),
                attestationObject: (0, util_1.encodeToBase64Url)(cred.response.attestationObject),
            },
        };
        await __classPrivateFieldGet(this, _AddFidoChallenge_csc, "f").userRegisterFidoComplete(this.challengeId, answer);
    }
}
exports.AddFidoChallenge = AddFidoChallenge;
_AddFidoChallenge_csc = new WeakMap();
/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
class MfaFidoChallenge {
    /**
     * @param {CubeSignerClient} csc The session used to initiate MFA approval using FIDO
     * @param {string} mfaId The MFA request id.
     * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
     */
    constructor(csc, mfaId, challenge) {
        _MfaFidoChallenge_csc.set(this, void 0);
        __classPrivateFieldSet(this, _MfaFidoChallenge_csc, csc, "f");
        this.mfaId = mfaId;
        this.challengeId = challenge.challenge_id;
        // fix options returned from the server: rename fields and decode base64 fields into uint8[]
        this.options = {
            ...challenge.options,
            challenge: (0, util_1.decodeBase64Url)(challenge.options.challenge),
        };
        this.options.rpId ??= challenge.options.rp_id;
        this.options.allowCredentials ??= challenge.options.allow_credentials;
        this.options.userVerification ??= challenge.options.user_verification;
        delete this.options.rp_id;
        delete this.options.allow_credentials;
        delete this.options.user_verification;
        for (const credential of this.options.allowCredentials ?? []) {
            credential.id = (0, util_1.decodeBase64Url)(credential.id);
            if (credential.transports === null) {
                delete credential.transports;
            }
        }
    }
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     */
    async createCredentialAndAnswer() {
        const cred = await navigator.credentials.get({ publicKey: this.options });
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
     * @param {any} cred Credential created by calling the `CredentialContainer`'s `get` method
     *                   based on the public key credential request options from this challenge.
     */
    async answer(cred) {
        const answer = {
            id: cred.id,
            response: {
                clientDataJSON: (0, util_1.encodeToBase64Url)(cred.response.clientDataJSON),
                authenticatorData: (0, util_1.encodeToBase64Url)(cred.response.authenticatorData),
                signature: (0, util_1.encodeToBase64Url)(cred.response.signature),
            },
        };
        return await __classPrivateFieldGet(this, _MfaFidoChallenge_csc, "f").mfaApproveFidoComplete(this.mfaId, this.challengeId, answer);
    }
}
exports.MfaFidoChallenge = MfaFidoChallenge;
_MfaFidoChallenge_csc = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFVdkQsaUNBQTREO0FBWTVELHlFQUF5RTtBQUN6RSxNQUFhLGFBQWE7SUFJeEIsOEJBQThCO0lBQzlCLElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLE9BQU8sQ0FBQztJQUNoQyxDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLFFBQVEsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxHQUFxQixFQUFFLFFBQWtCO1FBakI1QyxxQ0FBdUI7UUFDdkIsMENBQW9CO1FBaUIzQix1QkFBQSxJQUFJLHNCQUFRLEdBQUcsTUFBQSxDQUFDO1FBQ2hCLHVCQUFBLElBQUksMkJBQWEsUUFBUSxNQUFBLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWTtRQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixJQUFJLCtCQUErQixDQUFDLENBQUM7U0FDNUU7UUFFRCxNQUFNLHVCQUFBLElBQUksMEJBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNELENBQUM7Q0FDRjtBQWxDRCxzQ0FrQ0M7O0FBRUQ7OztHQUdHO0FBQ0gsTUFBYSxnQkFBZ0I7SUFLM0I7Ozs7T0FJRztJQUNILFlBQVksR0FBcUIsRUFBRSxTQUE4QjtRQVR4RCx3Q0FBdUI7UUFVOUIsdUJBQUEsSUFBSSx5QkFBUSxHQUFHLE1BQUEsQ0FBQztRQUNoQixJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMs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QUMsaUJBQWlCLENBQUM7Z0JBQ3JFLFNBQVMsRUFBRSxJQUFBLHdCQUFpQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO2FBQ3REO1NBQ0YsQ0FBQztRQUNGLE9BQU8sTUFBTSx1QkFBQSxJQUFJLDZCQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3RGLENBQUM7Q0FDRjtBQW5FRCw0Q0FtRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG5cbmltcG9ydCB7XG4gIEFwaUFkZEZpZG9DaGFsbGVuZ2UsXG4gIEFwaU1mYUZpZG9DaGFsbGVuZ2UsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICBUb3RwSW5mbyxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50XCI7XG5pbXBvcnQgeyBkZWNvZGVCYXNlNjRVcmwsIGVuY29kZVRvQmFzZTY0VXJsIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG4vKiogTUZBIHJlY2VpcHQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWZhUmVjZWlwdCB7XG4gIC8qKiBNRkEgcmVxdWVzdCBJRCAqL1xuICBtZmFJZDogc3RyaW5nO1xuICAvKiogQ29ycmVzcG9uZGluZyBvcmcgSUQgKi9cbiAgbWZhT3JnSWQ6IHN0cmluZztcbiAgLyoqIE1GQSBjb25maXJtYXRpb24gY29kZSAqL1xuICBtZmFDb25mOiBzdHJpbmc7XG59XG5cbi8qKiBUT1RQIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYmVmb3JlIHVzZXIncyBUT1RQIGlzIHVwZGF0ZWQgKi9cbmV4cG9ydCBjbGFzcyBUb3RwQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2NzYzogQ3ViZVNpZ25lckNsaWVudDtcbiAgcmVhZG9ubHkgI3RvdHBJbmZvOiBUb3RwSW5mbztcblxuICAvKiogVGhlIGlkIG9mIHRoZSBjaGFsbGVuZ2UgKi9cbiAgZ2V0IHRvdHBJZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdG90cEluZm8udG90cF9pZDtcbiAgfVxuXG4gIC8qKiBUaGUgbmV3IFRPVFAgY29uZmlndXJhdGlvbiAqL1xuICBnZXQgdG90cFVybCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdG90cEluZm8udG90cF91cmw7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50fSBjc2MgVXNlZCB3aGVuIGFuc3dlcmluZyB0aGUgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0ge1RvdHBJbmZvfSB0b3RwSW5mbyBUT1RQIGNoYWxsZW5nZSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzYzogQ3ViZVNpZ25lckNsaWVudCwgdG90cEluZm86IFRvdHBJbmZvKSB7XG4gICAgdGhpcy4jY3NjID0gY3NjO1xuICAgIHRoaXMuI3RvdHBJbmZvID0gdG90cEluZm87XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBjaGFsbGVuZ2Ugd2l0aCB0aGUgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSA2LWRpZ2l0IGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eXFxkezEsNn0kLy50ZXN0KGNvZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVE9UUCBjb2RlOiAke2NvZGV9OyBpdCBtdXN0IGJlIGEgNi1kaWdpdCBzdHJpbmdgKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLiNjc2MudXNlclJlc2V0VG90cENvbXBsZXRlKHRoaXMudG90cElkLCBjb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGNyZWF0aW5nIGEgcmVxdWVzdCB0byBhZGQgYSBuZXcgRklETyBkZXZpY2UuXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBBZGRGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2NzYzogQ3ViZVNpZ25lckNsaWVudDtcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNzYyBDdWJlU2lnbmVyIGluc3RhbmNlIHVzZWQgdG8gcmVxdWVzdCB0byBhZGQgYSBGSURPIGRldmljZVxuICAgKiBAcGFyYW0ge0FwaUFkZEZpZG9DaGFsbGVuZ2V9IGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoY3NjOiBDdWJlU2lnbmVyQ2xpZW50LCBjaGFsbGVuZ2U6IEFwaUFkZEZpZG9DaGFsbGVuZ2UpIHtcbiAgICB0aGlzLiNjc2MgPSBjc2M7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG5cbiAgICAvLyBmaXggb3B0aW9ucyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXI6IHJlbmFtZSBmaWVsZHMgYW5kIGRlY29kZSBiYXNlNjQgZmllbGRzIHRvIHVpbnQ4W11cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAuLi5jaGFsbGVuZ2Uub3B0aW9ucyxcbiAgICAgIGNoYWxsZW5nZTogZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLmNoYWxsZW5nZSksXG4gICAgfTtcbiAgICB0aGlzLm9wdGlvbnMucHViS2V5Q3JlZFBhcmFtcyA/Pz0gY2hhbGxlbmdlLm9wdGlvbnMucHViX2tleV9jcmVkX3BhcmFtcztcbiAgICB0aGlzLm9wdGlvbnMuZXhjbHVkZUNyZWRlbnRpYWxzID8/PSBjaGFsbGVuZ2Uub3B0aW9ucy5leGNsdWRlX2NyZWRlbnRpYWxzO1xuICAgIHRoaXMub3B0aW9ucy5hdXRoZW50aWNhdG9yU2VsZWN0aW9uID8/PSBjaGFsbGVuZ2Uub3B0aW9ucy5hdXRoZW50aWNhdG9yX3NlbGVjdGlvbjtcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLnB1Yl9rZXlfY3JlZF9wYXJhbXM7XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5leGNsdWRlX2NyZWRlbnRpYWxzO1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuYXV0aGVudGljYXRvcl9zZWxlY3Rpb247XG5cbiAgICBpZiAoY2hhbGxlbmdlLm9wdGlvbnMudXNlcikge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXIuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMudXNlci5pZCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjcmVkZW50aWFsIG9mIHRoaXMub3B0aW9ucy5leGNsdWRlQ3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGNyZWF0ZSBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcigpIHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmNyZWF0ZSh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIGF3YWl0IHRoaXMuYW5zd2VyKGNyZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgdXNpbmcgYSBnaXZlbiBjcmVkZW50aWFsIGBjcmVkYDtcbiAgICogdGhlIGNyZWRlbnRpYWwgc2hvdWxkIGJlIG9idGFpbmVkIGJ5IGNhbGxpbmdcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gY3JlZCBDcmVkZW50aWFsIGNyZWF0ZWQgYnkgY2FsbGluZyB0aGUgYENyZWRlbnRpYWxDb250YWluZXJgJ3MgYGNyZWF0ZWAgbWV0aG9kXG4gICAqICAgICAgICAgICAgICAgICAgIGJhc2VkIG9uIHRoZSBwdWJsaWMga2V5IGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjcmVkOiBhbnkpIHtcbiAgICBjb25zdCBhbnN3ZXIgPSA8UHVibGljS2V5Q3JlZGVudGlhbD57XG4gICAgICBpZDogY3JlZC5pZCxcbiAgICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIGNsaWVudERhdGFKU09OOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmNsaWVudERhdGFKU09OKSxcbiAgICAgICAgYXR0ZXN0YXRpb25PYmplY3Q6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuYXR0ZXN0YXRpb25PYmplY3QpLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGF3YWl0IHRoaXMuI2NzYy51c2VyUmVnaXN0ZXJGaWRvQ29tcGxldGUodGhpcy5jaGFsbGVuZ2VJZCwgYW5zd2VyKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGluaXRpYXRpbmcgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE8uXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2NzYzogQ3ViZVNpZ25lckNsaWVudDtcbiAgcmVhZG9ubHkgbWZhSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNzYyBUaGUgc2Vzc2lvbiB1c2VkIHRvIGluaXRpYXRlIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgaWQuXG4gICAqIEBwYXJhbSB7QXBpTWZhRmlkb0NoYWxsZW5nZX0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzYzogQ3ViZVNpZ25lckNsaWVudCwgbWZhSWQ6IHN0cmluZywgY2hhbGxlbmdlOiBBcGlNZmFGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jY3NjID0gY3NjO1xuICAgIHRoaXMubWZhSWQgPSBtZmFJZDtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgaW50byB1aW50OFtdXG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uY2hhbGxlbmdlLm9wdGlvbnMsXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG4gICAgdGhpcy5vcHRpb25zLnJwSWQgPz89IGNoYWxsZW5nZS5vcHRpb25zLnJwX2lkO1xuICAgIHRoaXMub3B0aW9ucy5hbGxvd0NyZWRlbnRpYWxzID8/PSBjaGFsbGVuZ2Uub3B0aW9ucy5hbGxvd19jcmVkZW50aWFscztcbiAgICB0aGlzLm9wdGlvbnMudXNlclZlcmlmaWNhdGlvbiA/Pz0gY2hhbGxlbmdlLm9wdGlvbnMudXNlcl92ZXJpZmljYXRpb247XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5ycF9pZDtcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLmFsbG93X2NyZWRlbnRpYWxzO1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMudXNlcl92ZXJpZmljYXRpb247XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmFsbG93Q3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgICBpZiAoY3JlZGVudGlhbC50cmFuc3BvcnRzID09PSBudWxsKSB7XG4gICAgICAgIGRlbGV0ZSBjcmVkZW50aWFsLnRyYW5zcG9ydHM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGdldCBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFuc3dlcihjcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBhbnN3ZXIgPSA8UHVibGljS2V5Q3JlZGVudGlhbD57XG4gICAgICBpZDogY3JlZC5pZCxcbiAgICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIGNsaWVudERhdGFKU09OOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmNsaWVudERhdGFKU09OKSxcbiAgICAgICAgYXV0aGVudGljYXRvckRhdGE6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuYXV0aGVudGljYXRvckRhdGEpLFxuICAgICAgICBzaWduYXR1cmU6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2Uuc2lnbmF0dXJlKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jY3NjLm1mYUFwcHJvdmVGaWRvQ29tcGxldGUodGhpcy5tZmFJZCwgdGhpcy5jaGFsbGVuZ2VJZCwgYW5zd2VyKTtcbiAgfVxufVxuIl19