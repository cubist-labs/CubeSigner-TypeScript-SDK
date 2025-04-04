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
const util_1 = require("./util");
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
     * @return {MfaReceipt | undefined} The MFA receipt
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFVdkQsaUNBQTREO0FBbUI1RCx1Q0FBdUM7QUFDdkMsTUFBYSxVQUFVO0lBS3JCLHlCQUF5QjtJQUN6QixJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksc0JBQUksQ0FBQztJQUNsQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLHdCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxTQUFvQixFQUFFLElBQTRCO1FBdkJyRCx3Q0FBc0I7UUFDL0IsaUNBQVc7UUFDWCxtQ0FBdUI7UUFzQnJCLHVCQUFBLElBQUkseUJBQWMsU0FBUyxNQUFBLENBQUM7UUFDNUIsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUM3Qix1QkFBQSxJQUFJLGtCQUFPLElBQUksTUFBQSxDQUFDO1FBQ2xCLENBQUM7YUFBTSxDQUFDO1lBQ04sdUJBQUEsSUFBSSxrQkFBTyxJQUFJLENBQUMsRUFBRSxNQUFBLENBQUM7WUFDbkIsdUJBQUEsSUFBSSxvQkFBUyxJQUFJLE1BQUEsQ0FBQztRQUNwQixDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsVUFBVTtRQUNkLE1BQU0sT0FBTyxHQUFHLHVCQUFBLElBQUksd0JBQU0sRUFBRSxPQUFPLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUNwRSxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLElB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QUUsSUFBQSx3QkFBaUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQztnQkFDL0QsaUJBQWlCLEVBQUUsSUFBQSx3QkFBaUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDO2dCQUNyRSxTQUFTLEVBQUUsSUFBQSx3QkFBaUIsRUFBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQzthQUN0RDtTQUNGLENBQUM7UUFDRixNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxtQkFBbUIsQ0FDcEQsSUFBSSxDQUFDLEtBQUssRUFDVixJQUFJLEVBQ0osSUFBSSxDQUFDLFdBQVcsRUFDaEIsTUFBTSxDQUNQLENBQUM7UUFDRixPQUFPLElBQUksVUFBVSxDQUFDLHVCQUFBLElBQUksbUNBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBQ0Y7QUF0RUQsNENBc0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEFwaUFkZEZpZG9DaGFsbGVuZ2UsXG4gIEFwaU1mYUZpZG9DaGFsbGVuZ2UsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZmFWb3RlLFxuICBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICBUb3RwSW5mbyxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBkZWNvZGVCYXNlNjRVcmwsIGVuY29kZVRvQmFzZTY0VXJsIH0gZnJvbSBcIi4vdXRpbFwiO1xuaW1wb3J0IHR5cGUgeyBBcGlDbGllbnQgfSBmcm9tIFwiLi9jbGllbnQvYXBpX2NsaWVudFwiO1xuXG4vKiogTUZBIHJlY2VpcHQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWZhUmVjZWlwdCB7XG4gIC8qKiBNRkEgcmVxdWVzdCBJRCAqL1xuICBtZmFJZDogc3RyaW5nO1xuICAvKiogQ29ycmVzcG9uZGluZyBvcmcgSUQgKi9cbiAgbWZhT3JnSWQ6IHN0cmluZztcbiAgLyoqIE1GQSBjb25maXJtYXRpb24gY29kZSAqL1xuICBtZmFDb25mOiBzdHJpbmc7XG59XG5cbi8qKiBNRkEgcmVxdWVzdCBpZCAqL1xuZXhwb3J0IHR5cGUgTWZhSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmlnaW5hbCByZXF1ZXN0IHR5cGUgKi9cbmV4cG9ydCB0eXBlIE1mYU9yaWdpbmFsUmVxdWVzdCA9IE1mYVJlcXVlc3RJbmZvW1wicmVxdWVzdFwiXTtcblxuLyoqIFJlcHJlc2VudGF0aW9uIG9mIGFuIE1GQSByZXF1ZXN0ICovXG5leHBvcnQgY2xhc3MgTWZhUmVxdWVzdCB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI2lkOiBNZmFJZDtcbiAgI2RhdGE/OiBNZmFSZXF1ZXN0SW5mbztcblxuICAvKiogR2V0IE1GQSByZXF1ZXN0IGlkICovXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIE1GQSByZXF1ZXN0LiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBNZmFSZXF1ZXN0SW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge01mYUlkIHwgTWZhUmVxdWVzdEluZm99IGRhdGEgVGhlIElEIG9yIHRoZSBkYXRhIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IE1mYUlkIHwgTWZhUmVxdWVzdEluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YS5pZDtcbiAgICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoaXMgTUZBIHJlcXVlc3QgaGFzIGEgcmVjZWlwdC5cbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgTUZBIHJlcXVlc3QgaGFzIGEgcmVjZWlwdFxuICAgKi9cbiAgYXN5bmMgaGFzUmVjZWlwdCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCByZWNlaXB0ID0gdGhpcy4jZGF0YT8ucmVjZWlwdCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKS5yZWNlaXB0O1xuICAgIHJldHVybiAhIXJlY2VpcHQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvcmlnaW5hbCByZXF1ZXN0IHRoYXQgdGhlIE1GQSByZXF1ZXN0IGlzIGZvci5cbiAgICpcbiAgICogQHJldHVybiB7TWZhT3JpZ2luYWxSZXF1ZXN0fSBUaGUgb3JpZ2luYWwgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdCgpOiBQcm9taXNlPE1mYU9yaWdpbmFsUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNhY2hlZCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKTtcbiAgICByZXR1cm4gZGF0YS5yZXF1ZXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEByZXR1cm4ge01mYVJlY2VpcHQgfCB1bmRlZmluZWR9IFRoZSBNRkEgcmVjZWlwdFxuICAgKi9cbiAgYXN5bmMgcmVjZWlwdCgpOiBQcm9taXNlPE1mYVJlY2VpcHQgfCB1bmRlZmluZWQ+IHtcbiAgICAvLyBDaGVjayBpZiByZWNlaXB0IGlzIGFscmVhZHkgYXZhaWxhYmxlLiBJZiBub3QsIGZldGNoIG5ld2VzdCBpbmZvcm1hdGlvbiBhYm91dCBNRkEgcmVxdWVzdFxuICAgIGNvbnN0IHJlY2VpcHQgPSB0aGlzLiNkYXRhPy5yZWNlaXB0ID8/IChhd2FpdCB0aGlzLmZldGNoKCkpLnJlY2VpcHQ7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgbWZhSWQ6IHRoaXMuI2lkLFxuICAgICAgbWZhT3JnSWQ6IHRoaXMuI2FwaUNsaWVudC5vcmdJZCxcbiAgICAgIG1mYUNvbmY6IHJlY2VpcHQuY29uZmlybWF0aW9uLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybiB7TWZhUmVxdWVzdEluZm99IFRoZSBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGZldGNoKCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYUdldCh0aGlzLiNpZCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0Pn0gVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIGFwcHJvdmUoKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlQ3ModGhpcy4jaWQsIFwiYXBwcm92ZVwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdD59IFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyByZWplY3QoKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlQ3ModGhpcy4jaWQsIFwicmVqZWN0XCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0Pn0gVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgdG90cEFwcHJvdmUoY29kZTogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlVG90cCh0aGlzLiNpZCwgY29kZSwgXCJhcHByb3ZlXCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3Q+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyB0b3RwUmVqZWN0KGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZVRvdHAodGhpcy4jaWQsIGNvZGUsIFwicmVqZWN0XCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsL3JlamVjdGlvbiBvZiBhbiBleGlzdGluZyBNRkEgcmVxdWVzdCB1c2luZyBGSURPLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nXG4gICAqIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhRmlkb0NoYWxsZW5nZT59IEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgZmlkb1ZvdGUoKTogUHJvbWlzZTxNZmFGaWRvQ2hhbGxlbmdlPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFGaWRvSW5pdCh0aGlzLiNpZCk7XG4gIH1cbn1cblxuLyoqIFRPVFAgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBiZWZvcmUgdXNlcidzIFRPVFAgaXMgdXBkYXRlZCAqL1xuZXhwb3J0IGNsYXNzIFRvdHBDaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5ICNpZDogc3RyaW5nO1xuICByZWFkb25seSAjdXJsPzogc3RyaW5nO1xuXG4gIC8qKiBUaGUgaWQgb2YgdGhlIGNoYWxsZW5nZSAqL1xuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2lkO1xuICB9XG5cbiAgLyoqIFRoZSBuZXcgVE9UUCBjb25maWd1cmF0aW9uICovXG4gIGdldCB1cmwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3VybDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpIFVzZWQgd2hlbiBhbnN3ZXJpbmcgdGhlIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIHtUb3RwSW5mbyB8IHN0cmluZ30gZGF0YSBUT1RQIGNoYWxsZW5nZSBpbmZvcm1hdGlvbiBvciBJRC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaTogQXBpQ2xpZW50LCBkYXRhOiBUb3RwSW5mbyB8IHN0cmluZykge1xuICAgIHRoaXMuI2FwaSA9IGFwaTtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhLnRvdHBfaWQ7XG4gICAgICB0aGlzLiN1cmwgPSBkYXRhLnRvdHBfdXJsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIGNoYWxsZW5nZSB3aXRoIHRoZSBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gYHRoaXMudG90cFVybGAuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIDYtZGlnaXQgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNvZGU6IHN0cmluZykge1xuICAgIGlmICghL15cXGR7MSw2fSQvLnRlc3QoY29kZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBUT1RQIGNvZGU6ICR7Y29kZX07IGl0IG11c3QgYmUgYSA2LWRpZ2l0IHN0cmluZ2ApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuI2FwaS51c2VyVG90cFJlc2V0Q29tcGxldGUodGhpcy5pZCwgY29kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBjcmVhdGluZyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgQWRkRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGk6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gcmVxdWVzdCB0byBhZGQgYSBGSURPIGRldmljZVxuICAgKiBAcGFyYW0ge0FwaUFkZEZpZG9DaGFsbGVuZ2V9IGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIGNoYWxsZW5nZTogQXBpQWRkRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaSA9IGFwaTtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgdG8gdWludDhbXVxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLmNoYWxsZW5nZS5vcHRpb25zLFxuICAgICAgY2hhbGxlbmdlOiBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMuY2hhbGxlbmdlKSxcbiAgICB9O1xuXG4gICAgaWYgKGNoYWxsZW5nZS5vcHRpb25zLnVzZXIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy51c2VyLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLnVzZXIuaWQpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY3JlZGVudGlhbCBvZiB0aGlzLm9wdGlvbnMuZXhjbHVkZUNyZWRlbnRpYWxzID8/IFtdKSB7XG4gICAgICBjcmVkZW50aWFsLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNyZWRlbnRpYWwuaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBjcmVhdGUgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIoKSB7XG4gICAgY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICBhd2FpdCB0aGlzLmFuc3dlcihjcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGA7XG4gICAqIHRoZSBjcmVkZW50aWFsIHNob3VsZCBiZSBvYnRhaW5lZCBieSBjYWxsaW5nXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmNyZWF0ZSh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBjcmVhdGVgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55KSB7XG4gICAgY29uc3QgYW5zd2VyID0gPFB1YmxpY0tleUNyZWRlbnRpYWw+e1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICByZXNwb25zZToge1xuICAgICAgICBjbGllbnREYXRhSlNPTjogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5jbGllbnREYXRhSlNPTiksXG4gICAgICAgIGF0dGVzdGF0aW9uT2JqZWN0OiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmF0dGVzdGF0aW9uT2JqZWN0KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlckZpZG9SZWdpc3RlckNvbXBsZXRlKHRoaXMuY2hhbGxlbmdlSWQsIGFuc3dlcik7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBpbml0aWF0aW5nIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgTWZhRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgbWZhSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gaW5pdGlhdGUgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE9cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBpZC5cbiAgICogQHBhcmFtIHtBcGlNZmFGaWRvQ2hhbGxlbmdlfSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIG1mYUlkOiBzdHJpbmcsIGNoYWxsZW5nZTogQXBpTWZhRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaTtcbiAgICB0aGlzLm1mYUlkID0gbWZhSWQ7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG5cbiAgICAvLyBmaXggb3B0aW9ucyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXI6IHJlbmFtZSBmaWVsZHMgYW5kIGRlY29kZSBiYXNlNjQgZmllbGRzIGludG8gdWludDhbXVxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLmNoYWxsZW5nZS5vcHRpb25zLFxuICAgICAgY2hhbGxlbmdlOiBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMuY2hhbGxlbmdlKSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCBjcmVkZW50aWFsIG9mIHRoaXMub3B0aW9ucy5hbGxvd0NyZWRlbnRpYWxzID8/IFtdKSB7XG4gICAgICBjcmVkZW50aWFsLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNyZWRlbnRpYWwuaWQpO1xuICAgICAgaWYgKGNyZWRlbnRpYWwudHJhbnNwb3J0cyA9PT0gbnVsbCkge1xuICAgICAgICBkZWxldGUgY3JlZGVudGlhbC50cmFuc3BvcnRzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBnZXQgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBAcGFyYW0ge01mYVZvdGV9IHZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0LiBEZWZhdWx0cyB0byBcImFwcHJvdmVcIi5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIodm90ZT86IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFuc3dlcihjcmVkLCB2b3RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0ge01mYVZvdGV9IHZvdGUgQXBwcm92ZSBvciByZWplY3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSwgdm90ZTogTWZhVm90ZSA9IFwiYXBwcm92ZVwiKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgYW5zd2VyID0gPFB1YmxpY0tleUNyZWRlbnRpYWw+e1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICByZXNwb25zZToge1xuICAgICAgICBjbGllbnREYXRhSlNPTjogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5jbGllbnREYXRhSlNPTiksXG4gICAgICAgIGF1dGhlbnRpY2F0b3JEYXRhOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmF1dGhlbnRpY2F0b3JEYXRhKSxcbiAgICAgICAgc2lnbmF0dXJlOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLnNpZ25hdHVyZSksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlRmlkb0NvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHZvdGUsXG4gICAgICB0aGlzLmNoYWxsZW5nZUlkLFxuICAgICAgYW5zd2VyLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cbn1cbiJdfQ==