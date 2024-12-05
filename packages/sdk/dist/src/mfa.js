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
var _MfaRequest_apiClient, _MfaRequest_id, _MfaRequest_data, _TotpChallenge_api, _TotpChallenge_id, _TotpChallenge_url, _AddFidoChallenge_api, _MfaEmailChallenge_apiClient, _MfaEmailChallenge_otpResponse, _MfaFidoChallenge_apiClient;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaFidoChallenge = exports.MfaEmailChallenge = exports.AddFidoChallenge = exports.TotpChallenge = exports.MfaRequest = void 0;
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
    /**
     * Initiate approval/rejection of an existing MFA request using email OTP.
     *
     * Returns a {@link MfaEmailChallenge} that must be answered by calling {@link MfaEmailChallenge.answer}.
     *
     * @param {MfaVote} mfaVote The vote, i.e., "approve" or "reject".
     * @return {Promise<MfaEmailChallenge>} The challenge to answer by entering the OTP code received via email.
     */
    async emailVote(mfaVote) {
        return await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteEmailInit(this.id, mfaVote);
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
 * Returned after initiating an MFA approval/rejection via email OTP.
 */
class MfaEmailChallenge {
    /**
     * Constructor.
     *
     * @param {ApiClient} apiClient CubeSigner api client
     * @param {string} mfaId The id of the MFA request.
     * @param {EmailOtpResponse} otpResponse The response returned by {@link ApiClient.mfaVoteEmailInit}.
     */
    constructor(apiClient, mfaId, otpResponse) {
        _MfaEmailChallenge_apiClient.set(this, void 0);
        _MfaEmailChallenge_otpResponse.set(this, void 0);
        __classPrivateFieldSet(this, _MfaEmailChallenge_apiClient, apiClient, "f");
        __classPrivateFieldSet(this, _MfaEmailChallenge_otpResponse, otpResponse, "f");
        this.mfaId = mfaId;
    }
    /**
     * Complete a previously initiated MFA vote request using email OTP.
     *
     * @param {string} otpCode The MFA approval OTP code received via email.
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    async answer(otpCode) {
        return await __classPrivateFieldGet(this, _MfaEmailChallenge_apiClient, "f").mfaVoteEmailComplete(this.mfaId, __classPrivateFieldGet(this, _MfaEmailChallenge_otpResponse, "f").partial_token, otpCode);
    }
}
exports.MfaEmailChallenge = MfaEmailChallenge;
_MfaEmailChallenge_apiClient = new WeakMap(), _MfaEmailChallenge_otpResponse = new WeakMap();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFpRHZELDhDQVNDO0FBT0Qsd0NBSUM7QUExREQsaUNBQTREO0FBaUM1RDs7OztHQUlHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsR0FBZ0I7SUFDaEQsSUFBSSxHQUFHLEtBQUssU0FBUztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ3BDLE1BQU0sQ0FBQyxHQUFHLEdBQXNCLENBQUM7SUFDakMsT0FBTyxDQUNMLE9BQU8sQ0FBQyxDQUFDLEtBQUssS0FBSyxRQUFRO1FBQzNCLE9BQU8sQ0FBQyxDQUFDLFFBQVEsS0FBSyxRQUFRO1FBQzlCLENBQUMsQ0FBQyxRQUFRLFlBQVksS0FBSztRQUMzQixDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FDakMsQ0FBQztBQUNKLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsY0FBYyxDQUFDLENBQVU7SUFDdkMsSUFBSSxDQUFDLEtBQUssU0FBUztRQUFFLE9BQU8sS0FBSyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxHQUFHLENBQWlCLENBQUM7SUFDNUIsT0FBTyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxDQUFDLFlBQVksS0FBSyxRQUFRLENBQUM7QUFDeEUsQ0FBQztBQVFELHVDQUF1QztBQUN2QyxNQUFhLFVBQVU7SUFLckIseUJBQXlCO0lBQ3pCLElBQUksRUFBRTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxzQkFBSSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksd0JBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLFNBQW9CLEVBQUUsSUFBNEI7UUF2QnJELHdDQUFzQjtR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QUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVMsRUFBRSxPQUFnQixTQUFTO1FBQy9DLE1BQU0sTUFBTSxHQUF3QjtZQUNsQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDWCxRQUFRLEVBQUU7Z0JBQ1IsY0FBYyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7Z0JBQy9ELGlCQUFpQixFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDckUsU0FBUyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7YUFDdEQ7U0FDRixDQUFDO1FBQ0YsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLG1DQUFXLENBQUMsbUJBQW1CLENBQ3BELElBQUksQ0FBQyxLQUFLLEVBQ1YsSUFBSSxFQUNKLElBQUksQ0FBQyxXQUFXLEVBQ2hCLE1BQU0sQ0FDUCxDQUFDO1FBQ0YsT0FBTyxJQUFJLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUNGO0FBdEVELDRDQXNFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cblxuaW1wb3J0IHR5cGUge1xuICBBcGlBZGRGaWRvQ2hhbGxlbmdlLFxuICBBcGlNZmFGaWRvQ2hhbGxlbmdlLFxuICBFbWFpbE90cFJlc3BvbnNlLFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgTWZhVm90ZSxcbiAgUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgVG90cEluZm8sXG59IGZyb20gXCIuL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgZGVjb2RlQmFzZTY0VXJsLCBlbmNvZGVUb0Jhc2U2NFVybCB9IGZyb20gXCIuL3V0aWxcIjtcbmltcG9ydCB0eXBlIHsgQXBpQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50L2FwaV9jbGllbnRcIjtcblxuLyoqIE1GQSByZWNlaXB0ICovXG5leHBvcnQgaW50ZXJmYWNlIE1mYVJlY2VpcHQge1xuICAvKiogTUZBIHJlcXVlc3QgSUQgKi9cbiAgbWZhSWQ6IHN0cmluZztcbiAgLyoqIENvcnJlc3BvbmRpbmcgb3JnIElEICovXG4gIG1mYU9yZ0lkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgbWZhQ29uZjogc3RyaW5nO1xufVxuXG4vKiogT25lIG9yIG1vcmUgTUZBIHJlY2VpcHRzICovXG5leHBvcnQgdHlwZSBNZmFSZWNlaXB0cyA9IE1mYVJlY2VpcHQgfCBNYW55TWZhUmVjZWlwdHM7XG5cbi8qKiBUaGUgTUZBIGlkIGFuZCBjb25maXJtYXRpb24gY29ycmVzcG9uZGluZyB0byBhIHNpbmdsZSByZWNlaXB0IGluIGEge0BsaW5rIE1hbnlNZmFSZWNlaXB0c30gKiovXG4vLyBOT1RFOiBtdXN0IGNvcnJlc3BvbmQgdG8gdGhlIFJ1c3QgZGVmaW5pdGlvblxuZXhwb3J0IGludGVyZmFjZSBNZmFJZEFuZENvbmYge1xuICAvKiogTUZBIGlkICovXG4gIGlkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgY29uZmlybWF0aW9uOiBzdHJpbmc7XG59XG5cbi8qKiBNYW55IE1GQSByZWNlaXB0cyAqKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFueU1mYVJlY2VpcHRzIHtcbiAgLyoqIENvcnJlc3BvbmRpbmcgb3JnIGlkICovXG4gIG9yZ0lkOiBzdHJpbmc7XG4gIC8qKiBSZWNlaXB0IGNvbmZpcm1hdGlvbiBjb2RlcyAqL1xuICByZWNlaXB0czogTWZhSWRBbmRDb25mW107XG59XG5cbi8qKlxuICogVHlwZSBuYXJyb3dpbmcgZnJvbSB7QGxpbmsgTWZhUmVjZWlwdHN9IHRvIHtAbGluayBNYW55TWZhUmVjZWlwdHN9XG4gKiBAcGFyYW0ge01mYVJlY2VpcHRzfSByZWMgVGhlIGlucHV0XG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHtAbGluayByZWN9IGlzIG9mIHR5cGUge0BsaW5rIE1hbnlNZmFSZWNlaXB0c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWFueU1mYVJlY2VpcHRzKHJlYzogTWZhUmVjZWlwdHMpOiByZWMgaXMgTWFueU1mYVJlY2VpcHRzIHtcbiAgaWYgKHJlYyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHggPSByZWMgYXMgTWFueU1mYVJlY2VpcHRzO1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiB4Lm9yZ0lkID09PSBcInN0cmluZ1wiICYmXG4gICAgdHlwZW9mIHgucmVjZWlwdHMgPT09IFwib2JqZWN0XCIgJiZcbiAgICB4LnJlY2VpcHRzIGluc3RhbmNlb2YgQXJyYXkgJiZcbiAgICB4LnJlY2VpcHRzLmV2ZXJ5KGlzTWZhSWRBbmRDb25mKVxuICApO1xufVxuXG4vKipcbiAqIFR5cGUgbmFycm93aW5nIGZyb20gYHVua25vd25gIHRvIHtAbGluayBNZmFJZEFuZENvbmZ9XG4gKiBAcGFyYW0ge01mYVJlY2VpcHRzfSB4IFRoZSBpbnB1dFxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB7QGxpbmsgeH0gaXMgb2YgdHlwZSB7QGxpbmsgTWZhSWRBbmRDb25mfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNZmFJZEFuZENvbmYoeDogdW5rbm93bik6IHggaXMgTWZhSWRBbmRDb25mIHtcbiAgaWYgKHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB5ID0geCBhcyBNZmFJZEFuZENvbmY7XG4gIHJldHVybiB0eXBlb2YgeS5pZCA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgeS5jb25maXJtYXRpb24gPT09IFwic3RyaW5nXCI7XG59XG5cbi8qKiBNRkEgcmVxdWVzdCBpZCAqL1xuZXhwb3J0IHR5cGUgTWZhSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmlnaW5hbCByZXF1ZXN0IHR5cGUgKi9cbmV4cG9ydCB0eXBlIE1mYU9yaWdpbmFsUmVxdWVzdCA9IE1mYVJlcXVlc3RJbmZvW1wicmVxdWVzdFwiXTtcblxuLyoqIFJlcHJlc2VudGF0aW9uIG9mIGFuIE1GQSByZXF1ZXN0ICovXG5leHBvcnQgY2xhc3MgTWZhUmVxdWVzdCB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI2lkOiBNZmFJZDtcbiAgI2RhdGE/OiBNZmFSZXF1ZXN0SW5mbztcblxuICAvKiogR2V0IE1GQSByZXF1ZXN0IGlkICovXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIE1GQSByZXF1ZXN0LiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBNZmFSZXF1ZXN0SW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB7QXBpQ2xpZW50fSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge01mYUlkIHwgTWZhUmVxdWVzdEluZm99IGRhdGEgVGhlIElEIG9yIHRoZSBkYXRhIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IE1mYUlkIHwgTWZhUmVxdWVzdEluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YS5pZDtcbiAgICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoaXMgTUZBIHJlcXVlc3QgaGFzIGEgcmVjZWlwdC5cbiAgICpcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgTUZBIHJlcXVlc3QgaGFzIGEgcmVjZWlwdFxuICAgKi9cbiAgYXN5bmMgaGFzUmVjZWlwdCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCByZWNlaXB0ID0gdGhpcy4jZGF0YT8ucmVjZWlwdCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKS5yZWNlaXB0O1xuICAgIHJldHVybiAhIXJlY2VpcHQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvcmlnaW5hbCByZXF1ZXN0IHRoYXQgdGhlIE1GQSByZXF1ZXN0IGlzIGZvci5cbiAgICpcbiAgICogQHJldHVybiB7TWZhT3JpZ2luYWxSZXF1ZXN0fSBUaGUgb3JpZ2luYWwgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdCgpOiBQcm9taXNlPE1mYU9yaWdpbmFsUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNhY2hlZCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKTtcbiAgICByZXR1cm4gZGF0YS5yZXF1ZXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEByZXR1cm4ge01mYVJlY2VpcHRzIHwgdW5kZWZpbmVkfSBUaGUgTUZBIHJlY2VpcHQocylcbiAgICovXG4gIGFzeW5jIHJlY2VpcHQoKTogUHJvbWlzZTxNZmFSZWNlaXB0IHwgdW5kZWZpbmVkPiB7XG4gICAgLy8gQ2hlY2sgaWYgcmVjZWlwdCBpcyBhbHJlYWR5IGF2YWlsYWJsZS4gSWYgbm90LCBmZXRjaCBuZXdlc3QgaW5mb3JtYXRpb24gYWJvdXQgTUZBIHJlcXVlc3RcbiAgICBjb25zdCByZWNlaXB0ID0gdGhpcy4jZGF0YT8ucmVjZWlwdCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKS5yZWNlaXB0O1xuICAgIGlmICghcmVjZWlwdCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIG1mYUlkOiB0aGlzLiNpZCxcbiAgICAgIG1mYU9yZ0lkOiB0aGlzLiNhcGlDbGllbnQub3JnSWQsXG4gICAgICBtZmFDb25mOiByZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge01mYVJlcXVlc3RJbmZvfSBUaGUgTUZBIHJlcXVlc3QgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFHZXQodGhpcy4jaWQpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdD59IFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBhcHByb3ZlKCk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUNzKHRoaXMuI2lkLCBcImFwcHJvdmVcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYVJlcXVlc3Q+fSBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgcmVqZWN0KCk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUNzKHRoaXMuI2lkLCBcInJlamVjdFwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdD59IFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZVRvdHAodGhpcy4jaWQsIGNvZGUsIFwiYXBwcm92ZVwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNZmFSZXF1ZXN0Pn0gVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgdG90cFJlamVjdChjb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVUb3RwKHRoaXMuI2lkLCBjb2RlLCBcInJlamVjdFwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbC9yZWplY3Rpb24gb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgRklETy5cbiAgICpcbiAgICogUmV0dXJucyBhIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZ1xuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+fSBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIGZpZG9Wb3RlKCk6IFByb21pc2U8TWZhRmlkb0NoYWxsZW5nZT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhRmlkb0luaXQodGhpcy4jaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsL3JlamVjdGlvbiBvZiBhbiBleGlzdGluZyBNRkEgcmVxdWVzdCB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgTWZhRW1haWxDaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBNZmFFbWFpbENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0ge01mYVZvdGV9IG1mYVZvdGUgVGhlIHZvdGUsIGkuZS4sIFwiYXBwcm92ZVwiIG9yIFwicmVqZWN0XCIuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhRW1haWxDaGFsbGVuZ2U+fSBUaGUgY2hhbGxlbmdlIHRvIGFuc3dlciBieSBlbnRlcmluZyB0aGUgT1RQIGNvZGUgcmVjZWl2ZWQgdmlhIGVtYWlsLlxuICAgKi9cbiAgYXN5bmMgZW1haWxWb3RlKG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYUVtYWlsQ2hhbGxlbmdlPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlRW1haWxJbml0KHRoaXMuaWQsIG1mYVZvdGUpO1xuICB9XG59XG5cbi8qKiBUT1RQIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYmVmb3JlIHVzZXIncyBUT1RQIGlzIHVwZGF0ZWQgKi9cbmV4cG9ydCBjbGFzcyBUb3RwQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaTogQXBpQ2xpZW50O1xuICByZWFkb25seSAjaWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3VybD86IHN0cmluZztcblxuICAvKiogVGhlIGlkIG9mIHRoZSBjaGFsbGVuZ2UgKi9cbiAgZ2V0IGlkKCkge1xuICAgIHJldHVybiB0aGlzLiNpZDtcbiAgfVxuXG4gIC8qKiBUaGUgbmV3IFRPVFAgY29uZmlndXJhdGlvbiAqL1xuICBnZXQgdXJsKCkge1xuICAgIHJldHVybiB0aGlzLiN1cmw7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtBcGlDbGllbnR9IGFwaSBVc2VkIHdoZW4gYW5zd2VyaW5nIHRoZSBjaGFsbGVuZ2UuXG4gICAqIEBwYXJhbSB7VG90cEluZm8gfCBzdHJpbmd9IGRhdGEgVE9UUCBjaGFsbGVuZ2UgaW5mb3JtYXRpb24gb3IgSUQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgZGF0YTogVG90cEluZm8gfCBzdHJpbmcpIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YS50b3RwX2lkO1xuICAgICAgdGhpcy4jdXJsID0gZGF0YS50b3RwX3VybDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBjaGFsbGVuZ2Ugd2l0aCB0aGUgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZSA2LWRpZ2l0IGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eXFxkezEsNn0kLy50ZXN0KGNvZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVE9UUCBjb2RlOiAke2NvZGV9OyBpdCBtdXN0IGJlIGEgNi1kaWdpdCBzdHJpbmdgKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlclRvdHBSZXNldENvbXBsZXRlKHRoaXMuaWQsIGNvZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgY3JlYXRpbmcgYSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkZEZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IGNoYWxsZW5nZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG9wdGlvbnM6IGFueTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICogQHBhcmFtIHtBcGlDbGllbnR9IGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIHJlcXVlc3QgdG8gYWRkIGEgRklETyBkZXZpY2VcbiAgICogQHBhcmFtIHtBcGlBZGRGaWRvQ2hhbGxlbmdlfSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaTogQXBpQ2xpZW50LCBjaGFsbGVuZ2U6IEFwaUFkZEZpZG9DaGFsbGVuZ2UpIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG5cbiAgICAvLyBmaXggb3B0aW9ucyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXI6IHJlbmFtZSBmaWVsZHMgYW5kIGRlY29kZSBiYXNlNjQgZmllbGRzIHRvIHVpbnQ4W11cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAuLi5jaGFsbGVuZ2Uub3B0aW9ucyxcbiAgICAgIGNoYWxsZW5nZTogZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLmNoYWxsZW5nZSksXG4gICAgfTtcblxuICAgIGlmIChjaGFsbGVuZ2Uub3B0aW9ucy51c2VyKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudXNlci5pZCA9IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy51c2VyLmlkKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmV4Y2x1ZGVDcmVkZW50aWFscyA/PyBbXSkge1xuICAgICAgY3JlZGVudGlhbC5pZCA9IGRlY29kZUJhc2U2NFVybChjcmVkZW50aWFsLmlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gY3JlYXRlIGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKCkge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgO1xuICAgKiB0aGUgY3JlZGVudGlhbCBzaG91bGQgYmUgb2J0YWluZWQgYnkgY2FsbGluZ1xuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgY3JlYXRlYCBtZXRob2RcbiAgICogICAgICAgICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSkge1xuICAgIGNvbnN0IGFuc3dlciA9IDxQdWJsaWNLZXlDcmVkZW50aWFsPntcbiAgICAgIGlkOiBjcmVkLmlkLFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdHRlc3RhdGlvbk9iamVjdDogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdHRlc3RhdGlvbk9iamVjdCksXG4gICAgICB9LFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy4jYXBpLnVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZSh0aGlzLmNoYWxsZW5nZUlkLCBhbnN3ZXIpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBhbiBNRkEgYXBwcm92YWwvcmVqZWN0aW9uIHZpYSBlbWFpbCBPVFAuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFFbWFpbENoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgI290cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlO1xuICByZWFkb25seSBtZmFJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHtBcGlDbGllbnR9IGFwaUNsaWVudCBDdWJlU2lnbmVyIGFwaSBjbGllbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqIEBwYXJhbSB7RW1haWxPdHBSZXNwb25zZX0gb3RwUmVzcG9uc2UgVGhlIHJlc3BvbnNlIHJldHVybmVkIGJ5IHtAbGluayBBcGlDbGllbnQubWZhVm90ZUVtYWlsSW5pdH0uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgbWZhSWQ6IHN0cmluZywgb3RwUmVzcG9uc2U6IEVtYWlsT3RwUmVzcG9uc2UpIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy4jb3RwUmVzcG9uc2UgPSBvdHBSZXNwb25zZTtcbiAgICB0aGlzLm1mYUlkID0gbWZhSWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCBNRkEgdm90ZSByZXF1ZXN0IHVzaW5nIGVtYWlsIE9UUC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG90cENvZGUgVGhlIE1GQSBhcHByb3ZhbCBPVFAgY29kZSByZWNlaXZlZCB2aWEgZW1haWwuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TWZhUmVxdWVzdEluZm8+fSBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKG90cENvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVFbWFpbENvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHRoaXMuI290cFJlc3BvbnNlLnBhcnRpYWxfdG9rZW4sXG4gICAgICBvdHBDb2RlLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBpbml0aWF0aW5nIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgTWZhRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgbWZhSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0FwaUNsaWVudH0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gaW5pdGlhdGUgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE9cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBpZC5cbiAgICogQHBhcmFtIHtBcGlNZmFGaWRvQ2hhbGxlbmdlfSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIG1mYUlkOiBzdHJpbmcsIGNoYWxsZW5nZTogQXBpTWZhRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaTtcbiAgICB0aGlzLm1mYUlkID0gbWZhSWQ7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG5cbiAgICAvLyBmaXggb3B0aW9ucyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXI6IHJlbmFtZSBmaWVsZHMgYW5kIGRlY29kZSBiYXNlNjQgZmllbGRzIGludG8gdWludDhbXVxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLmNoYWxsZW5nZS5vcHRpb25zLFxuICAgICAgY2hhbGxlbmdlOiBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMuY2hhbGxlbmdlKSxcbiAgICB9O1xuXG4gICAgZm9yIChjb25zdCBjcmVkZW50aWFsIG9mIHRoaXMub3B0aW9ucy5hbGxvd0NyZWRlbnRpYWxzID8/IFtdKSB7XG4gICAgICBjcmVkZW50aWFsLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNyZWRlbnRpYWwuaWQpO1xuICAgICAgaWYgKGNyZWRlbnRpYWwudHJhbnNwb3J0cyA9PT0gbnVsbCkge1xuICAgICAgICBkZWxldGUgY3JlZGVudGlhbC50cmFuc3BvcnRzO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBnZXQgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBAcGFyYW0ge01mYVZvdGV9IHZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0LiBEZWZhdWx0cyB0byBcImFwcHJvdmVcIi5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIodm90ZT86IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFuc3dlcihjcmVkLCB2b3RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0ge01mYVZvdGV9IHZvdGUgQXBwcm92ZSBvciByZWplY3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSwgdm90ZTogTWZhVm90ZSA9IFwiYXBwcm92ZVwiKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgYW5zd2VyID0gPFB1YmxpY0tleUNyZWRlbnRpYWw+e1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICByZXNwb25zZToge1xuICAgICAgICBjbGllbnREYXRhSlNPTjogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5jbGllbnREYXRhSlNPTiksXG4gICAgICAgIGF1dGhlbnRpY2F0b3JEYXRhOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmF1dGhlbnRpY2F0b3JEYXRhKSxcbiAgICAgICAgc2lnbmF0dXJlOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLnNpZ25hdHVyZSksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlRmlkb0NvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHZvdGUsXG4gICAgICB0aGlzLmNoYWxsZW5nZUlkLFxuICAgICAgYW5zd2VyLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cbn1cbiJdfQ==