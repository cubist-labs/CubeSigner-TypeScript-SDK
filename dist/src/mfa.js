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
var _TotpChallenge_api, _TotpChallenge_totpInfo, _AddFidoChallenge_api, _MfaFidoChallenge_api;
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
exports.TotpChallenge = TotpChallenge;
_TotpChallenge_api = new WeakMap(), _TotpChallenge_totpInfo = new WeakMap();
/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
class AddFidoChallenge {
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
            challenge: (0, util_1.decodeBase64Url)(challenge.options.challenge),
        };
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
        await __classPrivateFieldGet(this, _AddFidoChallenge_api, "f").userFidoRegisterComplete(this.challengeId, answer);
    }
}
exports.AddFidoChallenge = AddFidoChallenge;
_AddFidoChallenge_api = new WeakMap();
/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
class MfaFidoChallenge {
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
            challenge: (0, util_1.decodeBase64Url)(challenge.options.challenge),
        };
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
        return await __classPrivateFieldGet(this, _MfaFidoChallenge_api, "f").mfaApproveFidoComplete(this.mfaId, this.challengeId, answer);
    }
}
exports.MfaFidoChallenge = MfaFidoChallenge;
_MfaFidoChallenge_api = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFTdkQsaUNBQTREO0FBYTVELHlFQUF5RTtBQUN6RSxNQUFhLGFBQWE7SUFJeEIsOEJBQThCO0lBQzlCLElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLE9BQU8sQ0FBQztJQUNoQyxDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwrQkFBVSxDQUFDLFFBQVEsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxHQUFrQixFQUFFLFFBQWtCO1FBakJ6QyxxQ0FBb0I7UUFDcEIsMENBQW9CO1FBaUIzQix1QkFBQSxJQUFJLHNCQUFRLEdBQUcsTUFBQSxDQUFDO1FBQ2hCLHVCQUFBLElBQUksMkJBQWEsUUFBUSxNQUFBLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBWTtRQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLElBQUksK0JBQStCLENBQUMsQ0FBQztRQUM3RSxDQUFDO1FBRUQsTUFBTSx1QkFBQSxJQUFJLDBCQUFLLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzRCxDQUFDO0NBQ0Y7QUFsQ0Qsc0NBa0NDOztBQUVEOzs7R0FHRztBQUNILE1BQWEsZ0JBQWdCO0lBSzNCOzs7O09BSUc7SUFDSCxZQUFZLEdBQWtCLEVBQUUsU0FBOEI7UUFUckQsd0NBQW9CO1FBVTNCLHVCQUFBLElBQUkseUJBQVEsR0FBRyxNQUFBLENBQUM7UUFDaEIsSUFBSSxDQUFDLFdBQVcs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QUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFTO1FBQ3BCLE1BQU0sTUFBTSxHQUF3QjtZQUNsQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDWCxRQUFRLEVBQUU7Z0JBQ1IsY0FBYyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7Z0JBQy9ELGlCQUFpQixFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDckUsU0FBUyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7YUFDdEQ7U0FDRixDQUFDO1FBQ0YsT0FBTyxNQUFNLHVCQUFBLElBQUksNkJBQUssQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDdEYsQ0FBQztDQUNGO0FBN0RELDRDQTZEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cblxuaW1wb3J0IHtcbiAgQXBpQWRkRmlkb0NoYWxsZW5nZSxcbiAgQXBpTWZhRmlkb0NoYWxsZW5nZSxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gIFRvdHBJbmZvLFxufSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IGRlY29kZUJhc2U2NFVybCwgZW5jb2RlVG9CYXNlNjRVcmwgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQXBpIH0gZnJvbSBcIi4vYXBpXCI7XG5cbi8qKiBNRkEgcmVjZWlwdCAqL1xuZXhwb3J0IGludGVyZmFjZSBNZmFSZWNlaXB0IHtcbiAgLyoqIE1GQSByZXF1ZXN0IElEICovXG4gIG1mYUlkOiBzdHJpbmc7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBJRCAqL1xuICBtZmFPcmdJZDogc3RyaW5nO1xuICAvKiogTUZBIGNvbmZpcm1hdGlvbiBjb2RlICovXG4gIG1mYUNvbmY6IHN0cmluZztcbn1cblxuLyoqIFRPVFAgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBiZWZvcmUgdXNlcidzIFRPVFAgaXMgdXBkYXRlZCAqL1xuZXhwb3J0IGNsYXNzIFRvdHBDaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBDdWJlU2lnbmVyQXBpO1xuICByZWFkb25seSAjdG90cEluZm86IFRvdHBJbmZvO1xuXG4gIC8qKiBUaGUgaWQgb2YgdGhlIGNoYWxsZW5nZSAqL1xuICBnZXQgdG90cElkKCkge1xuICAgIHJldHVybiB0aGlzLiN0b3RwSW5mby50b3RwX2lkO1xuICB9XG5cbiAgLyoqIFRoZSBuZXcgVE9UUCBjb25maWd1cmF0aW9uICovXG4gIGdldCB0b3RwVXJsKCkge1xuICAgIHJldHVybiB0aGlzLiN0b3RwSW5mby50b3RwX3VybDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJBcGl9IGFwaSBVc2VkIHdoZW4gYW5zd2VyaW5nIHRoZSBjaGFsbGVuZ2UuXG4gICAqIEBwYXJhbSB7VG90cEluZm99IHRvdHBJbmZvIFRPVFAgY2hhbGxlbmdlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBDdWJlU2lnbmVyQXBpLCB0b3RwSW5mbzogVG90cEluZm8pIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgdGhpcy4jdG90cEluZm8gPSB0b3RwSW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIGNoYWxsZW5nZSB3aXRoIHRoZSBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gYHRoaXMudG90cFVybGAuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNvZGU6IHN0cmluZykge1xuICAgIGlmICghL15cXGR7MSw2fSQvLnRlc3QoY29kZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBUT1RQIGNvZGU6ICR7Y29kZX07IGl0IG11c3QgYmUgYSA2LWRpZ2l0IHN0cmluZ2ApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuI2FwaS51c2VyVG90cFJlc2V0Q29tcGxldGUodGhpcy50b3RwSWQsIGNvZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgY3JlYXRpbmcgYSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkZEZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBDdWJlU2lnbmVyQXBpO1xuICByZWFkb25seSBjaGFsbGVuZ2VJZDogc3RyaW5nO1xuICByZWFkb25seSBvcHRpb25zOiBhbnk7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckFwaX0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gcmVxdWVzdCB0byBhZGQgYSBGSURPIGRldmljZVxuICAgKiBAcGFyYW0ge0FwaUFkZEZpZG9DaGFsbGVuZ2V9IGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBDdWJlU2lnbmVyQXBpLCBjaGFsbGVuZ2U6IEFwaUFkZEZpZG9DaGFsbGVuZ2UpIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG5cbiAgICAvLyBmaXggb3B0aW9ucyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXI6IHJlbmFtZSBmaWVsZHMgYW5kIGRlY29kZSBiYXNlNjQgZmllbGRzIHRvIHVpbnQ4W11cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAuLi5jaGFsbGVuZ2Uub3B0aW9ucyxcbiAgICAgIGNoYWxsZW5nZTogZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLmNoYWxsZW5nZSksXG4gICAgfTtcblxuICAgIGlmIChjaGFsbGVuZ2Uub3B0aW9ucy51c2VyKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudXNlci5pZCA9IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy51c2VyLmlkKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmV4Y2x1ZGVDcmVkZW50aWFscyA/PyBbXSkge1xuICAgICAgY3JlZGVudGlhbC5pZCA9IGRlY29kZUJhc2U2NFVybChjcmVkZW50aWFsLmlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gY3JlYXRlIGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKCkge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgO1xuICAgKiB0aGUgY3JlZGVudGlhbCBzaG91bGQgYmUgb2J0YWluZWQgYnkgY2FsbGluZ1xuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgY3JlYXRlYCBtZXRob2RcbiAgICogICAgICAgICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSkge1xuICAgIGNvbnN0IGFuc3dlciA9IDxQdWJsaWNLZXlDcmVkZW50aWFsPntcbiAgICAgIGlkOiBjcmVkLmlkLFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdHRlc3RhdGlvbk9iamVjdDogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdHRlc3RhdGlvbk9iamVjdCksXG4gICAgICB9LFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy4jYXBpLnVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZSh0aGlzLmNoYWxsZW5nZUlkLCBhbnN3ZXIpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBNRkEgYXBwcm92YWwgdXNpbmcgRklETy5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIE1mYUZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBDdWJlU2lnbmVyQXBpO1xuICByZWFkb25seSBtZmFJZDogc3RyaW5nO1xuICByZWFkb25seSBjaGFsbGVuZ2VJZDogc3RyaW5nO1xuICByZWFkb25seSBvcHRpb25zOiBhbnk7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lckFwaX0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gaW5pdGlhdGUgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE9cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBpZC5cbiAgICogQHBhcmFtIHtBcGlNZmFGaWRvQ2hhbGxlbmdlfSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBDdWJlU2lnbmVyQXBpLCBtZmFJZDogc3RyaW5nLCBjaGFsbGVuZ2U6IEFwaU1mYUZpZG9DaGFsbGVuZ2UpIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgdGhpcy5tZmFJZCA9IG1mYUlkO1xuICAgIHRoaXMuY2hhbGxlbmdlSWQgPSBjaGFsbGVuZ2UuY2hhbGxlbmdlX2lkO1xuXG4gICAgLy8gZml4IG9wdGlvbnMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyOiByZW5hbWUgZmllbGRzIGFuZCBkZWNvZGUgYmFzZTY0IGZpZWxkcyBpbnRvIHVpbnQ4W11cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAuLi5jaGFsbGVuZ2Uub3B0aW9ucyxcbiAgICAgIGNoYWxsZW5nZTogZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLmNoYWxsZW5nZSksXG4gICAgfTtcblxuICAgIGZvciAoY29uc3QgY3JlZGVudGlhbCBvZiB0aGlzLm9wdGlvbnMuYWxsb3dDcmVkZW50aWFscyA/PyBbXSkge1xuICAgICAgY3JlZGVudGlhbC5pZCA9IGRlY29kZUJhc2U2NFVybChjcmVkZW50aWFsLmlkKTtcbiAgICAgIGlmIChjcmVkZW50aWFsLnRyYW5zcG9ydHMgPT09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIGNyZWRlbnRpYWwudHJhbnNwb3J0cztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gZ2V0IGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIoKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYW5zd2VyKGNyZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgdXNpbmcgYSBnaXZlbiBjcmVkZW50aWFsIGBjcmVkYC5cbiAgICogVG8gb2J0YWluIHRoaXMgY3JlZGVudGlhbCwgZm9yIGV4YW1wbGUsIGNhbGxcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gY3JlZCBDcmVkZW50aWFsIGNyZWF0ZWQgYnkgY2FsbGluZyB0aGUgYENyZWRlbnRpYWxDb250YWluZXJgJ3MgYGdldGAgbWV0aG9kXG4gICAqICAgICAgICAgICAgICAgICAgIGJhc2VkIG9uIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55KTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGFuc3dlciA9IDxQdWJsaWNLZXlDcmVkZW50aWFsPntcbiAgICAgIGlkOiBjcmVkLmlkLFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdXRoZW50aWNhdG9yRGF0YTogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdXRoZW50aWNhdG9yRGF0YSksXG4gICAgICAgIHNpZ25hdHVyZTogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5zaWduYXR1cmUpLFxuICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGkubWZhQXBwcm92ZUZpZG9Db21wbGV0ZSh0aGlzLm1mYUlkLCB0aGlzLmNoYWxsZW5nZUlkLCBhbnN3ZXIpO1xuICB9XG59XG4iXX0=