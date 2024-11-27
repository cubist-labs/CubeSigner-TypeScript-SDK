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
var _MfaRequest_apiClient, _MfaRequest_id, _MfaRequest_data, _TotpChallenge_api, _TotpChallenge_id, _TotpChallenge_url, _AddFidoChallenge_api, _MfaFidoChallenge_apiClient;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaFidoChallenge = exports.AddFidoChallenge = exports.TotpChallenge = exports.MfaRequest = void 0;
exports.isManyMfaReceipts = isManyMfaReceipts;
exports.isMfaIdAndConf = isMfaIdAndConf;
const util_1 = require("./util");
/**
 * Type narrowing from {@link MfaReceipts} to {@link ManyMfaReceipts}
 * @param {MfaReceipts} rec The input
 * @return {boolean} Whether {@link rec} is of type {@link ManyMfaReceipts}
 */
function isManyMfaReceipts(rec) {
    if (rec === undefined)
        return false;
    const x = rec;
    return (typeof x.orgId === "string" &&
        typeof x.receipts === "object" &&
        x.receipts instanceof Array &&
        x.receipts.every(isMfaIdAndConf));
}
/**
 * Type narrowing from `unknown` to {@link MfaIdAndConf}
 * @param {MfaReceipts} x The input
 * @return {boolean} Whether {@link x} is of type {@link MfaIdAndConf}
 */
function isMfaIdAndConf(x) {
    if (x === undefined)
        return false;
    const y = x;
    return typeof y.id === "string" && typeof y.confirmation === "string";
}
/** Representation of an MFA request */
class MfaRequest {
    /** Get MFA request id */
    get id() {
        return __classPrivateFieldGet(this, _MfaRequest_id, "f");
    }
    /**
     * Get the cached properties of this MFA request. The cached properties reflect the
     * state of the last fetch or update.
     */
    get cached() {
        return __classPrivateFieldGet(this, _MfaRequest_data, "f");
    }
    /**
     * Constructor.
     *
     * @param {ApiClient} apiClient The API client to use.
     * @param {MfaId | MfaRequestInfo} data The ID or the data of the MFA request
     */
    constructor(apiClient, data) {
        _MfaRequest_apiClient.set(this, void 0);
        _MfaRequest_id.set(this, void 0);
        _MfaRequest_data.set(this, void 0);
        __classPrivateFieldSet(this, _MfaRequest_apiClient, apiClient, "f");
        if (typeof data === "string") {
            __classPrivateFieldSet(this, _MfaRequest_id, data, "f");
        }
        else {
            __classPrivateFieldSet(this, _MfaRequest_id, data.id, "f");
            __classPrivateFieldSet(this, _MfaRequest_data, data, "f");
        }
    }
    /**
     * Check whether this MFA request has a receipt.
     *
     * @return {boolean} True if the MFA request has a receipt
     */
    async hasReceipt() {
        const receipt = __classPrivateFieldGet(this, _MfaRequest_data, "f")?.receipt ?? (await this.fetch()).receipt;
        return !!receipt;
    }
    /**
     * Get the original request that the MFA request is for.
     *
     * @return {MfaOriginalRequest} The original request
     */
    async request() {
        const data = this.cached ?? (await this.fetch());
        return data.request;
    }
    /**
     * Get the MFA receipt.
     *
     * @return {MfaReceipts | undefined} The MFA receipt(s)
     */
    async receipt() {
        // Check if receipt is already available. If not, fetch newest information about MFA request
        const receipt = __classPrivateFieldGet(this, _MfaRequest_data, "f")?.receipt ?? (await this.fetch()).receipt;
        if (!receipt) {
            return undefined;
        }
        return {
            mfaId: __classPrivateFieldGet(this, _MfaRequest_id, "f"),
            mfaOrgId: __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").orgId,
            mfaConf: receipt.confirmation,
        };
    }
    /**
     * Fetch the key information.
     *
     * @return {MfaRequestInfo} The MFA request information.
     */
    async fetch() {
        __classPrivateFieldSet(this, _MfaRequest_data, await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaGet(__classPrivateFieldGet(this, _MfaRequest_id, "f")), "f");
        return __classPrivateFieldGet(this, _MfaRequest_data, "f");
    }
    /**
     * Approve a pending MFA request using the current session.
     *
     * @return {Promise<MfaRequest>} The result of the MFA request
     */
    async approve() {
        const data = await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteCs(__classPrivateFieldGet(this, _MfaRequest_id, "f"), "approve");
        return new MfaRequest(__classPrivateFieldGet(this, _MfaRequest_apiClient, "f"), data);
    }
    /**
     * Reject a pending MFA request using the current session.
     *
     * @return {Promise<MfaRequest>} The result of the MFA request
     */
    async reject() {
        const data = await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteCs(__classPrivateFieldGet(this, _MfaRequest_id, "f"), "reject");
        return new MfaRequest(__classPrivateFieldGet(this, _MfaRequest_apiClient, "f"), data);
    }
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequest>} The current status of the MFA request
     */
    async totpApprove(code) {
        const data = await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteTotp(__classPrivateFieldGet(this, _MfaRequest_id, "f"), code, "approve");
        return new MfaRequest(__classPrivateFieldGet(this, _MfaRequest_apiClient, "f"), data);
    }
    /**
     * Reject a pending MFA request using TOTP.
     *
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequest>} The current status of the MFA request
     */
    async totpReject(code) {
        const data = await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteTotp(__classPrivateFieldGet(this, _MfaRequest_id, "f"), code, "reject");
        return new MfaRequest(__classPrivateFieldGet(this, _MfaRequest_apiClient, "f"), data);
    }
    /**
     * Initiate approval/rejection of an existing MFA request using FIDO.
     *
     * Returns a {@link MfaFidoChallenge} that must be answered by calling
     * {@link MfaFidoChallenge.answer}.
     *
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    async fidoVote() {
        return await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaFidoInit(__classPrivateFieldGet(this, _MfaRequest_id, "f"));
    }
}
exports.MfaRequest = MfaRequest;
_MfaRequest_apiClient = new WeakMap(), _MfaRequest_id = new WeakMap(), _MfaRequest_data = new WeakMap();
/** TOTP challenge that must be answered before user's TOTP is updated */
class TotpChallenge {
    /** The id of the challenge */
    get id() {
        return __classPrivateFieldGet(this, _TotpChallenge_id, "f");
    }
    /** The new TOTP configuration */
    get url() {
        return __classPrivateFieldGet(this, _TotpChallenge_url, "f");
    }
    /**
     * @param {ApiClient} api Used when answering the challenge.
     * @param {TotpInfo | string} data TOTP challenge information or ID.
     */
    constructor(api, data) {
        _TotpChallenge_api.set(this, void 0);
        _TotpChallenge_id.set(this, void 0);
        _TotpChallenge_url.set(this, void 0);
        __classPrivateFieldSet(this, _TotpChallenge_api, api, "f");
        if (typeof data === "string") {
            __classPrivateFieldSet(this, _TotpChallenge_id, data, "f");
        }
        else {
            __classPrivateFieldSet(this, _TotpChallenge_id, data.totp_id, "f");
            __classPrivateFieldSet(this, _TotpChallenge_url, data.totp_url, "f");
        }
    }
    /**
     * Answer the challenge with the code that corresponds to `this.totpUrl`.
     * @param {string} code 6-digit code that corresponds to `this.totpUrl`.
     */
    async answer(code) {
        if (!/^\d{1,6}$/.test(code)) {
            throw new Error(`Invalid TOTP code: ${code}; it must be a 6-digit string`);
        }
        await __classPrivateFieldGet(this, _TotpChallenge_api, "f").userTotpResetComplete(this.id, code);
    }
}
exports.TotpChallenge = TotpChallenge;
_TotpChallenge_api = new WeakMap(), _TotpChallenge_id = new WeakMap(), _TotpChallenge_url = new WeakMap();
/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
class AddFidoChallenge {
    /**
     * Constructor
     * @param {ApiClient} api The API client used to request to add a FIDO device
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
     * @param {ApiClient} api The API client used to initiate MFA approval using FIDO
     * @param {string} mfaId The MFA request id.
     * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
     */
    constructor(api, mfaId, challenge) {
        _MfaFidoChallenge_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _MfaFidoChallenge_apiClient, api, "f");
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
                clientDataJSON: (0, util_1.encodeToBase64Url)(cred.response.clientDataJSON),
                authenticatorData: (0, util_1.encodeToBase64Url)(cred.response.authenticatorData),
                signature: (0, util_1.encodeToBase64Url)(cred.response.signature),
            },
        };
        const data = await __classPrivateFieldGet(this, _MfaFidoChallenge_apiClient, "f").mfaVoteFidoComplete(this.mfaId, vote, this.challengeId, answer);
        return new MfaRequest(__classPrivateFieldGet(this, _MfaFidoChallenge_apiClient, "f"), data);
    }
}
exports.MfaFidoChallenge = MfaFidoChallenge;
_MfaFidoChallenge_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFnRHZELDhDQVNDO0FBT0Qsd0NBSUM7QUExREQsaUNBQTREO0FBaUM1RDs7OztHQUlHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsR0FBZ0I7SUFDaEQsSUFBSSxHQUFHLEtBQUssU0FBUztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ3BDLE1BQU0sQ0FBQyxHQUFHLEdBQXNCLENBQUM7SUFDakMsT0FBTyxDQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxRQUFRO1FBQzNCLE9BQU8sQ0FBQyxDQUFDLFFBQVEsS0FBSyxRQUFRO1FBQzlCLENBQUMsQ0FBQyxRQUFRLFlBQVksS0FBSztRQUMzQixDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FDakMsQ0FBQztBQUNKLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLENBQVU7SUFDdkMsSUFBSSxDQUFDLEtBQUssU0FBUztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQWlCLENBQUM7SUFDNUIsT0FBTyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUM7QUFDeEUsQ0FBQztBQVFELHVDQUF1QztBQUN2QyxNQUFhLFVBQVU7SUFLckIseUJBQXlCO0lBQ3pCLElBQUksRUFBRTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxzQkFBSSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksd0JBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLFNBQW9CLEVBQUUsSUFBNEI7UUF2QnJELHdDQUFzQjtR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LElBQUksQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDRjtBQXRFRCw0Q0FzRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG5cbmltcG9ydCB0eXBlIHtcbiAgQXBpQWRkRmlkb0NoYWxsZW5nZSxcbiAgQXBpTWZhRmlkb0NoYWxsZW5nZSxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIE1mYVZvdGUsXG4gIFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gIFRvdHBJbmZvLFxufSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IGRlY29kZUJhc2U2NFVybCwgZW5jb2RlVG9CYXNlNjRVcmwgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgdHlwZSB7IEFwaUNsaWVudCB9IGZyb20gXCIuL2NsaWVudC9hcGlfY2xpZW50XCI7XG5cbi8qKiBNRkEgcmVjZWlwdCAqL1xuZXhwb3J0IGludGVyZmFjZSBNZmFSZWNlaXB0IHtcbiAgLyoqIE1GQSByZXF1ZXN0IElEICovXG4gIG1mYUlkOiBzdHJpbmc7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBJRCAqL1xuICBtZmFPcmdJZDogc3RyaW5nO1xuICAvKiogTUZBIGNvbmZpcm1hdGlvbiBjb2RlICovXG4gIG1mYUNvbmY6IHN0cmluZztcbn1cblxuLyoqIE9uZSBvciBtb3JlIE1GQSByZWNlaXB0cyAqL1xuZXhwb3J0IHR5cGUgTWZhUmVjZWlwdHMgPSBNZmFSZWNlaXB0IHwgTWFueU1mYVJlY2VpcHRzO1xuXG4vKiogVGhlIE1GQSBpZCBhbmQgY29uZmlybWF0aW9uIGNvcnJlc3BvbmRpbmcgdG8gYSBzaW5nbGUgcmVjZWlwdCBpbiBhIHtAbGluayBNYW55TWZhUmVjZWlwdHN9ICoqL1xuLy8gTk9URTogbXVzdCBjb3JyZXNwb25kIHRvIHRoZSBSdXN0IGRlZmluaXRpb25cbmV4cG9ydCBpbnRlcmZhY2UgTWZhSWRBbmRDb25mIHtcbiAgLyoqIE1GQSBpZCAqL1xuICBpZDogc3RyaW5nO1xuICAvKiogTUZBIGNvbmZpcm1hdGlvbiBjb2RlICovXG4gIGNvbmZpcm1hdGlvbjogc3RyaW5nO1xufVxuXG4vKiogTWFueSBNRkEgcmVjZWlwdHMgKiovXG5leHBvcnQgaW50ZXJmYWNlIE1hbnlNZmFSZWNlaXB0cyB7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBpZCAqL1xuICBvcmdJZDogc3RyaW5nO1xuICAvKiogUmVjZWlwdCBjb25maXJtYXRpb24gY29kZXMgKi9cbiAgcmVjZWlwdHM6IE1mYUlkQW5kQ29uZltdO1xufVxuXG4vKipcbiAqIFR5cGUgbmFycm93aW5nIGZyb20ge0BsaW5rIE1mYVJlY2VpcHRzfSB0byB7QGxpbmsgTWFueU1mYVJlY2VpcHRzfVxuICogQHBhcmFtIHtNZmFSZWNlaXB0c30gcmVjIFRoZSBpbnB1dFxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB7QGxpbmsgcmVjfSBpcyBvZiB0eXBlIHtAbGluayBNYW55TWZhUmVjZWlwdHN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01hbnlNZmFSZWNlaXB0cyhyZWM6IE1mYVJlY2VpcHRzKTogcmVjIGlzIE1hbnlNZmFSZWNlaXB0cyB7XG4gIGlmIChyZWMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB4ID0gcmVjIGFzIE1hbnlNZmFSZWNlaXB0cztcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgeC5vcmdJZCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIHR5cGVvZiB4LnJlY2VpcHRzID09PSBcIm9iamVjdFwiICYmXG4gICAgeC5yZWNlaXB0cyBpbnN0YW5jZW9mIEFycmF5ICYmXG4gICAgeC5yZWNlaXB0cy5ldmVyeShpc01mYUlkQW5kQ29uZilcbiAgKTtcbn1cblxuLyoqXG4gKiBUeXBlIG5hcnJvd2luZyBmcm9tIGB1bmtub3duYCB0byB7QGxpbmsgTWZhSWRBbmRDb25mfVxuICogQHBhcmFtIHtNZmFSZWNlaXB0c30geCBUaGUgaW5wdXRcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIge0BsaW5rIHh9IGlzIG9mIHR5cGUge0BsaW5rIE1mYUlkQW5kQ29uZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWZhSWRBbmRDb25mKHg6IHVua25vd24pOiB4IGlzIE1mYUlkQW5kQ29uZiB7XG4gIGlmICh4ID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgeSA9IHggYXMgTWZhSWRBbmRDb25mO1xuICByZXR1cm4gdHlwZW9mIHkuaWQgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHkuY29uZmlybWF0aW9uID09PSBcInN0cmluZ1wiO1xufVxuXG4vKiogTUZBIHJlcXVlc3QgaWQgKi9cbmV4cG9ydCB0eXBlIE1mYUlkID0gc3RyaW5nO1xuXG4vKiogT3JpZ2luYWwgcmVxdWVzdCB0eXBlICovXG5leHBvcnQgdHlwZSBNZmFPcmlnaW5hbFJlcXVlc3QgPSBNZmFSZXF1ZXN0SW5mb1tcInJlcXVlc3RcIl07XG5cbi8qKiBSZXByZXNlbnRhdGlvbiBvZiBhbiBNRkEgcmVxdWVzdCAqL1xuZXhwb3J0IGNsYXNzIE1mYVJlcXVlc3Qge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gICNpZDogTWZhSWQ7XG4gICNkYXRhPzogTWZhUmVxdWVzdEluZm87XG5cbiAgLyoqIEdldCBNRkEgcmVxdWVzdCBpZCAqL1xuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBNRkEgcmVxdWVzdC4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogTWZhUmVxdWVzdEluZm8gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtNZmFJZCB8IE1mYVJlcXVlc3RJbmZvfSBkYXRhIFRoZSBJRCBvciB0aGUgZGF0YSBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBNZmFJZCB8IE1mYVJlcXVlc3RJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGEuaWQ7XG4gICAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGlzIE1GQSByZXF1ZXN0IGhhcyBhIHJlY2VpcHQuXG4gICAqXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIE1GQSByZXF1ZXN0IGhhcyBhIHJlY2VpcHRcbiAgICovXG4gIGFzeW5jIGhhc1JlY2VpcHQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgcmVjZWlwdCA9IHRoaXMuI2RhdGE/LnJlY2VpcHQgPz8gKGF3YWl0IHRoaXMuZmV0Y2goKSkucmVjZWlwdDtcbiAgICByZXR1cm4gISFyZWNlaXB0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgb3JpZ2luYWwgcmVxdWVzdCB0aGF0IHRoZSBNRkEgcmVxdWVzdCBpcyBmb3IuXG4gICAqXG4gICAqIEByZXR1cm4ge01mYU9yaWdpbmFsUmVxdWVzdH0gVGhlIG9yaWdpbmFsIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHJlcXVlc3QoKTogUHJvbWlzZTxNZmFPcmlnaW5hbFJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5jYWNoZWQgPz8gKGF3YWl0IHRoaXMuZmV0Y2goKSk7XG4gICAgcmV0dXJuIGRhdGEucmVxdWVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIE1GQSByZWNlaXB0LlxuICAgKlxuICAgKiBAcmV0dXJuIHtNZmFSZWNlaXB0cyB8IHVuZGVmaW5lZH0gVGhlIE1GQSByZWNlaXB0KHMpXG4gICAqL1xuICBhc3luYyByZWNlaXB0KCk6IFByb21pc2U8TWZhUmVjZWlwdCB8IHVuZGVmaW5lZD4ge1xuICAgIC8vIENoZWNrIGlmIHJlY2VpcHQgaXMgYWxyZWFkeSBhdmFpbGFibGUuIElmIG5vdCwgZmV0Y2ggbmV3ZXN0IGluZm9ybWF0aW9uIGFib3V0IE1GQSByZXF1ZXN0XG4gICAgY29uc3QgcmVjZWlwdCA9IHRoaXMuI2RhdGE/LnJlY2VpcHQgPz8gKGF3YWl0IHRoaXMuZmV0Y2goKSkucmVjZWlwdDtcbiAgICBpZiAoIXJlY2VpcHQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBtZmFJZDogdGhpcy4jaWQsXG4gICAgICBtZmFPcmdJZDogdGhpcy4jYXBpQ2xpZW50Lm9yZ0lkLFxuICAgICAgbWZhQ29uZjogcmVjZWlwdC5jb25maXJtYXRpb24sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUga2V5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtNZmFSZXF1ZXN0SW5mb30gVGhlIE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhR2V0KHRoaXMuI2lkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3Q+fSBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJhcHByb3ZlXCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0Pn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHJlamVjdCgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3Q+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyB0b3RwQXBwcm92ZShjb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVUb3RwKHRoaXMuI2lkLCBjb2RlLCBcImFwcHJvdmVcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdD59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY29kZTogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlVG90cCh0aGlzLiNpZCwgY29kZSwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwvcmVqZWN0aW9uIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmdcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFGaWRvQ2hhbGxlbmdlPn0gQSBjaGFsbGVuZ2UgdGhhdCBuZWVkcyB0byBiZSBhbnN3ZXJlZCB0byBjb21wbGV0ZSB0aGUgYXBwcm92YWwuXG4gICAqL1xuICBhc3luYyBmaWRvVm90ZSgpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYUZpZG9Jbml0KHRoaXMuI2lkKTtcbiAgfVxufVxuXG4vKiogVE9UUCBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJlZm9yZSB1c2VyJ3MgVE9UUCBpcyB1cGRhdGVkICovXG5leHBvcnQgY2xhc3MgVG90cENoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGk6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgI2lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICN1cmw/OiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBpZCBvZiB0aGUgY2hhbGxlbmdlICovXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKiogVGhlIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gKi9cbiAgZ2V0IHVybCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGkgVXNlZCB3aGVuIGFuc3dlcmluZyB0aGUgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0ge1RvdHBJbmZvIHwgc3RyaW5nfSBkYXRhIFRPVFAgY2hhbGxlbmdlIGluZm9ybWF0aW9uIG9yIElELlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIGRhdGE6IFRvdHBJbmZvIHwgc3RyaW5nKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGEudG90cF9pZDtcbiAgICAgIHRoaXMuI3VybCA9IGRhdGEudG90cF91cmw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgY2hhbGxlbmdlIHdpdGggdGhlIGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgNi1kaWdpdCBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gYHRoaXMudG90cFVybGAuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY29kZTogc3RyaW5nKSB7XG4gICAgaWYgKCEvXlxcZHsxLDZ9JC8udGVzdChjb2RlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFRPVFAgY29kZTogJHtjb2RlfTsgaXQgbXVzdCBiZSBhIDYtZGlnaXQgc3RyaW5nYCk7XG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy4jYXBpLnVzZXJUb3RwUmVzZXRDb21wbGV0ZSh0aGlzLmlkLCBjb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGNyZWF0aW5nIGEgcmVxdWVzdCB0byBhZGQgYSBuZXcgRklETyBkZXZpY2UuXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBBZGRGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaTogQXBpQ2xpZW50O1xuICByZWFkb25seSBjaGFsbGVuZ2VJZDogc3RyaW5nO1xuICByZWFkb25seSBvcHRpb25zOiBhbnk7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGkgVGhlIEFQSSBjbGllbnQgdXNlZCB0byByZXF1ZXN0IHRvIGFkZCBhIEZJRE8gZGV2aWNlXG4gICAqIEBwYXJhbSB7QXBpQWRkRmlkb0NoYWxsZW5nZX0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgY2hhbGxlbmdlOiBBcGlBZGRGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIHRoaXMuY2hhbGxlbmdlSWQgPSBjaGFsbGVuZ2UuY2hhbGxlbmdlX2lkO1xuXG4gICAgLy8gZml4IG9wdGlvbnMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyOiByZW5hbWUgZmllbGRzIGFuZCBkZWNvZGUgYmFzZTY0IGZpZWxkcyB0byB1aW50OFtdXG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uY2hhbGxlbmdlLm9wdGlvbnMsXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG5cbiAgICBpZiAoY2hhbGxlbmdlLm9wdGlvbnMudXNlcikge1xuICAgICAgdGhpcy5vcHRpb25zLnVzZXIuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMudXNlci5pZCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBjcmVkZW50aWFsIG9mIHRoaXMub3B0aW9ucy5leGNsdWRlQ3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGNyZWF0ZSBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcigpIHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmNyZWF0ZSh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIGF3YWl0IHRoaXMuYW5zd2VyKGNyZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgdXNpbmcgYSBnaXZlbiBjcmVkZW50aWFsIGBjcmVkYDtcbiAgICogdGhlIGNyZWRlbnRpYWwgc2hvdWxkIGJlIG9idGFpbmVkIGJ5IGNhbGxpbmdcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gY3JlZCBDcmVkZW50aWFsIGNyZWF0ZWQgYnkgY2FsbGluZyB0aGUgYENyZWRlbnRpYWxDb250YWluZXJgJ3MgYGNyZWF0ZWAgbWV0aG9kXG4gICAqICAgICAgICAgICAgICAgICAgIGJhc2VkIG9uIHRoZSBwdWJsaWMga2V5IGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjcmVkOiBhbnkpIHtcbiAgICBjb25zdCBhbnN3ZXIgPSA8UHVibGljS2V5Q3JlZGVudGlhbD57XG4gICAgICBpZDogY3JlZC5pZCxcbiAgICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIGNsaWVudERhdGFKU09OOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmNsaWVudERhdGFKU09OKSxcbiAgICAgICAgYXR0ZXN0YXRpb25PYmplY3Q6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuYXR0ZXN0YXRpb25PYmplY3QpLFxuICAgICAgfSxcbiAgICB9O1xuICAgIGF3YWl0IHRoaXMuI2FwaS51c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGUodGhpcy5jaGFsbGVuZ2VJZCwgYW5zd2VyKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGluaXRpYXRpbmcgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE8uXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSBtZmFJZDogc3RyaW5nO1xuICByZWFkb25seSBjaGFsbGVuZ2VJZDogc3RyaW5nO1xuICByZWFkb25seSBvcHRpb25zOiBhbnk7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGkgVGhlIEFQSSBjbGllbnQgdXNlZCB0byBpbml0aWF0ZSBNRkEgYXBwcm92YWwgdXNpbmcgRklET1xuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IGlkLlxuICAgKiBAcGFyYW0ge0FwaU1mYUZpZG9DaGFsbGVuZ2V9IGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgbWZhSWQ6IHN0cmluZywgY2hhbGxlbmdlOiBBcGlNZmFGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpO1xuICAgIHRoaXMubWZhSWQgPSBtZmFJZDtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgaW50byB1aW50OFtdXG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uY2hhbGxlbmdlLm9wdGlvbnMsXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmFsbG93Q3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgICBpZiAoY3JlZGVudGlhbC50cmFuc3BvcnRzID09PSBudWxsKSB7XG4gICAgICAgIGRlbGV0ZSBjcmVkZW50aWFsLnRyYW5zcG9ydHM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGdldCBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcih2b3RlPzogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYW5zd2VyKGNyZWQsIHZvdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgdXNpbmcgYSBnaXZlbiBjcmVkZW50aWFsIGBjcmVkYC5cbiAgICogVG8gb2J0YWluIHRoaXMgY3JlZGVudGlhbCwgZm9yIGV4YW1wbGUsIGNhbGxcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gY3JlZCBDcmVkZW50aWFsIGNyZWF0ZWQgYnkgY2FsbGluZyB0aGUgYENyZWRlbnRpYWxDb250YWluZXJgJ3MgYGdldGAgbWV0aG9kXG4gICAqICAgICAgICAgICAgICAgICAgIGJhc2VkIG9uIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqIEBwYXJhbSB7TWZhVm90ZX0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdC4gRGVmYXVsdHMgdG8gXCJhcHByb3ZlXCIuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55LCB2b3RlOiBNZmFWb3RlID0gXCJhcHByb3ZlXCIpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBhbnN3ZXIgPSA8UHVibGljS2V5Q3JlZGVudGlhbD57XG4gICAgICBpZDogY3JlZC5pZCxcbiAgICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIGNsaWVudERhdGFKU09OOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmNsaWVudERhdGFKU09OKSxcbiAgICAgICAgYXV0aGVudGljYXRvckRhdGE6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuYXV0aGVudGljYXRvckRhdGEpLFxuICAgICAgICBzaWduYXR1cmU6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2Uuc2lnbmF0dXJlKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVGaWRvQ29tcGxldGUoXG4gICAgICB0aGlzLm1mYUlkLFxuICAgICAgdm90ZSxcbiAgICAgIHRoaXMuY2hhbGxlbmdlSWQsXG4gICAgICBhbnN3ZXIsXG4gICAgKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxufVxuIl19