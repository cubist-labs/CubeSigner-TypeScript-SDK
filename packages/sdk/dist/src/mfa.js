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
var _MfaRequest_apiClient, _MfaRequest_id, _MfaRequest_data, _TotpChallenge_api, _TotpChallenge_id, _TotpChallenge_url, _AddFidoChallenge_api, _MfaEmailChallenge_apiClient, _MfaEmailChallenge_otpResponse, _ResetEmailChallenge_apiClient, _ResetEmailChallenge_otpResponse, _MfaFidoChallenge_apiClient;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaFidoChallenge = exports.ResetEmailChallenge = exports.MfaEmailChallenge = exports.AddFidoChallenge = exports.TotpChallenge = exports.MfaRequest = void 0;
exports.isManyMfaReceipts = isManyMfaReceipts;
exports.isMfaIdAndConf = isMfaIdAndConf;
const passkey_1 = require("./passkey");
/**
 * Type narrowing from {@link MfaReceipts} to {@link ManyMfaReceipts}
 *
 * @param rec The input
 * @returns Whether {@link rec} is of type {@link ManyMfaReceipts}
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
 *
 * @param x The input
 * @returns Whether {@link x} is of type {@link MfaIdAndConf}
 */
function isMfaIdAndConf(x) {
    if (x === undefined)
        return false;
    const y = x;
    return typeof y.id === "string" && typeof y.confirmation === "string";
}
/** Representation of an MFA request */
class MfaRequest {
    /** @returns MFA request id */
    get id() {
        return __classPrivateFieldGet(this, _MfaRequest_id, "f");
    }
    /**
     * @returns The cached properties of this MFA request. The cached properties reflect the
     * state of the last fetch or update.
     */
    get cached() {
        return __classPrivateFieldGet(this, _MfaRequest_data, "f");
    }
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The ID or the data of the MFA request
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
     * @returns True if the MFA request has a receipt
     */
    async hasReceipt() {
        const receipt = __classPrivateFieldGet(this, _MfaRequest_data, "f")?.receipt ?? (await this.fetch()).receipt;
        return !!receipt;
    }
    /**
     * Get the original request that the MFA request is for.
     *
     * @returns The original request
     */
    async request() {
        const data = this.cached ?? (await this.fetch());
        return data.request;
    }
    /**
     * Get the MFA receipt.
     *
     * @returns The MFA receipt(s)
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
     * @returns The MFA request information.
     */
    async fetch() {
        __classPrivateFieldSet(this, _MfaRequest_data, await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaGet(__classPrivateFieldGet(this, _MfaRequest_id, "f")), "f");
        return __classPrivateFieldGet(this, _MfaRequest_data, "f");
    }
    /**
     * Approve a pending MFA request using the current session.
     *
     * @returns The result of the MFA request
     */
    async approve() {
        const data = await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteCs(__classPrivateFieldGet(this, _MfaRequest_id, "f"), "approve");
        return new MfaRequest(__classPrivateFieldGet(this, _MfaRequest_apiClient, "f"), data);
    }
    /**
     * Reject a pending MFA request using the current session.
     *
     * @returns The result of the MFA request
     */
    async reject() {
        const data = await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteCs(__classPrivateFieldGet(this, _MfaRequest_id, "f"), "reject");
        return new MfaRequest(__classPrivateFieldGet(this, _MfaRequest_apiClient, "f"), data);
    }
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param code The TOTP code
     * @returns The current status of the MFA request
     */
    async totpApprove(code) {
        const data = await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteTotp(__classPrivateFieldGet(this, _MfaRequest_id, "f"), code, "approve");
        return new MfaRequest(__classPrivateFieldGet(this, _MfaRequest_apiClient, "f"), data);
    }
    /**
     * Reject a pending MFA request using TOTP.
     *
     * @param code The TOTP code
     * @returns The current status of the MFA request
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
     * @returns A challenge that needs to be answered to complete the approval.
     */
    async fidoVote() {
        return await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaFidoInit(__classPrivateFieldGet(this, _MfaRequest_id, "f"));
    }
    /**
     * Initiate approval/rejection of an existing MFA request using email OTP.
     *
     * Returns a {@link MfaEmailChallenge} that must be answered by calling {@link MfaEmailChallenge.answer}.
     *
     * @param mfaVote The vote, i.e., "approve" or "reject".
     * @returns The challenge to answer by entering the OTP code received via email.
     */
    async emailVote(mfaVote) {
        return await __classPrivateFieldGet(this, _MfaRequest_apiClient, "f").mfaVoteEmailInit(this.id, mfaVote);
    }
}
exports.MfaRequest = MfaRequest;
_MfaRequest_apiClient = new WeakMap(), _MfaRequest_id = new WeakMap(), _MfaRequest_data = new WeakMap();
/** TOTP challenge that must be answered before user's TOTP is updated */
class TotpChallenge {
    /** @returns The id of the challenge */
    get id() {
        return __classPrivateFieldGet(this, _TotpChallenge_id, "f");
    }
    /** @returns The new TOTP configuration */
    get url() {
        return __classPrivateFieldGet(this, _TotpChallenge_url, "f");
    }
    /**
     * @param api Used when answering the challenge.
     * @param data TOTP challenge information or ID.
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
     *
     * @param code 6-digit code that corresponds to `this.totpUrl`.
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
     *
     * @param api The API client used to request to add a FIDO device
     * @param challenge The challenge returned by the remote end.
     */
    constructor(api, challenge) {
        _AddFidoChallenge_api.set(this, void 0);
        __classPrivateFieldSet(this, _AddFidoChallenge_api, api, "f");
        this.challengeId = challenge.challenge_id;
        this.options = (0, passkey_1.parseCreationOptions)(challenge.options);
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
     * @param cred Credential created by calling the `CredentialContainer`'s `create` method
     *                   based on the public key creation options from this challenge.
     */
    async answer(cred) {
        const answer = (0, passkey_1.credentialToJSON)(cred);
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
     * @param apiClient CubeSigner api client
     * @param mfaId The id of the MFA request.
     * @param otpResponse The response returned by {@link ApiClient.mfaVoteEmailInit}.
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
     * @param otpCode The MFA approval OTP code received via email.
     * @returns The current status of the MFA request.
     */
    async answer(otpCode) {
        return await __classPrivateFieldGet(this, _MfaEmailChallenge_apiClient, "f").mfaVoteEmailComplete(this.mfaId, __classPrivateFieldGet(this, _MfaEmailChallenge_otpResponse, "f").partial_token, otpCode);
    }
}
exports.MfaEmailChallenge = MfaEmailChallenge;
_MfaEmailChallenge_apiClient = new WeakMap(), _MfaEmailChallenge_otpResponse = new WeakMap();
/**
 * Returned after initiating an email reset flow.
 */
class ResetEmailChallenge {
    /**
     * Constructor.
     *
     * @param apiClient CubeSigner api client
     * @param otpResponse The response returned by {@link ApiClient.mfaVoteEmailInit}.
     */
    constructor(apiClient, otpResponse) {
        _ResetEmailChallenge_apiClient.set(this, void 0);
        _ResetEmailChallenge_otpResponse.set(this, void 0);
        __classPrivateFieldSet(this, _ResetEmailChallenge_apiClient, apiClient, "f");
        __classPrivateFieldSet(this, _ResetEmailChallenge_otpResponse, otpResponse, "f");
    }
    /**
     * Complete a previously initiated email reset flow using email OTP.
     *
     * @param otpCode The verification OTP code received via email.
     * @returns A promise that resolves on success and rejects on error.
     */
    async answer(otpCode) {
        return await __classPrivateFieldGet(this, _ResetEmailChallenge_apiClient, "f").userEmailResetComplete(__classPrivateFieldGet(this, _ResetEmailChallenge_otpResponse, "f").partial_token, otpCode);
    }
}
exports.ResetEmailChallenge = ResetEmailChallenge;
_ResetEmailChallenge_apiClient = new WeakMap(), _ResetEmailChallenge_otpResponse = new WeakMap();
/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
class MfaFidoChallenge {
    /**
     * @param api The API client used to initiate MFA approval using FIDO
     * @param mfaId The MFA request id.
     * @param challenge The challenge returned by the remote end
     */
    constructor(api, mfaId, challenge) {
        _MfaFidoChallenge_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _MfaFidoChallenge_apiClient, api, "f");
        this.mfaId = mfaId;
        this.challengeId = challenge.challenge_id;
        this.options = (0, passkey_1.parseRequestOptions)(challenge.options);
    }
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     *
     * @param vote Approve or reject the MFA request. Defaults to "approve".
     * @returns The updated MfaRequest after answering
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
     * @param cred Credential created by calling the `CredentialContainer`'s `get` method
     *             based on the public key credential request options from this challenge.
     * @param vote Approve or reject. Defaults to "approve".
     * @returns The updated MfaRequest after answering
     */
    async answer(cred, vote = "approve") {
        const answer = (0, passkey_1.credentialToJSON)(cred);
        const data = await __classPrivateFieldGet(this, _MfaFidoChallenge_apiClient, "f").mfaVoteFidoComplete(this.mfaId, vote, this.challengeId, answer);
        return new MfaRequest(__classPrivateFieldGet(this, _MfaFidoChallenge_apiClient, "f"), data);
    }
}
exports.MfaFidoChallenge = MfaFidoChallenge;
_MfaFidoChallenge_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFpRHZELDhDQVNDO0FBUUQsd0NBSUM7QUEzREQsdUNBQXdGO0FBZ0N4Rjs7Ozs7R0FLRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLEdBQWdCO0lBQ2hELElBQUksR0FBRyxLQUFLLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNwQyxNQUFNLENBQUMsR0FBRyxHQUFzQixDQUFDO0lBQ2pDLE9BQU8sQ0FDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUTtRQUMzQixPQUFPLENBQUMsQ0FBQyxRQUFRLEtBQUssUUFBUTtRQUM5QixDQUFDLENBQUMsUUFBUSxZQUFZLEtBQUs7UUFDM0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQ2pDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixjQUFjLENBQUMsQ0FBVTtJQUN2QyxJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDbEMsTUFBTSxDQUFDLEdBQUcsQ0FBaUIsQ0FBQztJQUM1QixPQUFPLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQztBQUN4RSxDQUFDO0FBUUQsdUNBQXVDO0FBQ3ZDLE1BQWEsVUFBVTtJQUtyQiw4QkFBOEI7SUFDOUIsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLHNCQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSx3QkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksU0FBb0IsRUFBRSxJQUE0QjtRQXZCckQsd0NBQXNC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QVksR0FBYyxFQUFFLEtBQWEsRUFBRSxTQUE4QjtRQVZoRSw4Q0FBc0I7UUFXN0IsdUJBQUEsSUFBSSwrQkFBYyxHQUFHLE1BQUEsQ0FBQztRQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFBLDZCQUFtQixFQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLHlCQUF5QixDQUFDLElBQWM7UUFDNUMsTUFBTSxJQUFJLEdBQUcsTUFBTSxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMxRSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBUyxFQUFFLE9BQWdCLFNBQVM7UUFDL0MsTUFBTSxNQUFNLEdBQUcsSUFBQSwwQkFBZ0IsRUFBQyxJQUFJLENBQUMsQ0FBQztRQUN0QyxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxtQkFBbUIsQ0FDcEQsSUFBSSxDQUFDLEtBQUssRUFDVixJQUFJLEVBQ0osSUFBSSxDQUFDLFdBQVcsRUFDaEIsTUFBTSxDQUNQLENBQUM7UUFDRixPQUFPLElBQUksVUFBVSxDQUFDLHVCQUFBLElBQUksbUNBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0NBQ0Y7QUFyREQsNENBcURDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEFwaUFkZEZpZG9DaGFsbGVuZ2UsXG4gIEFwaU1mYUZpZG9DaGFsbGVuZ2UsXG4gIEVtYWlsT3RwUmVzcG9uc2UsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZmFWb3RlLFxuICBUb3RwSW5mbyxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IEFwaUNsaWVudCB9IGZyb20gXCIuL2NsaWVudC9hcGlfY2xpZW50XCI7XG5pbXBvcnQgeyBjcmVkZW50aWFsVG9KU09OLCBwYXJzZUNyZWF0aW9uT3B0aW9ucywgcGFyc2VSZXF1ZXN0T3B0aW9ucyB9IGZyb20gXCIuL3Bhc3NrZXlcIjtcblxuLyoqIE1GQSByZWNlaXB0ICovXG5leHBvcnQgaW50ZXJmYWNlIE1mYVJlY2VpcHQge1xuICAvKiogTUZBIHJlcXVlc3QgSUQgKi9cbiAgbWZhSWQ6IHN0cmluZztcbiAgLyoqIENvcnJlc3BvbmRpbmcgb3JnIElEICovXG4gIG1mYU9yZ0lkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgbWZhQ29uZjogc3RyaW5nO1xufVxuXG4vKiogT25lIG9yIG1vcmUgTUZBIHJlY2VpcHRzICovXG5leHBvcnQgdHlwZSBNZmFSZWNlaXB0cyA9IE1mYVJlY2VpcHQgfCBNYW55TWZhUmVjZWlwdHM7XG5cbi8qKiBUaGUgTUZBIGlkIGFuZCBjb25maXJtYXRpb24gY29ycmVzcG9uZGluZyB0byBhIHNpbmdsZSByZWNlaXB0IGluIGEge0BsaW5rIE1hbnlNZmFSZWNlaXB0c30gKi9cbi8vIE5PVEU6IG11c3QgY29ycmVzcG9uZCB0byB0aGUgUnVzdCBkZWZpbml0aW9uXG5leHBvcnQgaW50ZXJmYWNlIE1mYUlkQW5kQ29uZiB7XG4gIC8qKiBNRkEgaWQgKi9cbiAgaWQ6IHN0cmluZztcbiAgLyoqIE1GQSBjb25maXJtYXRpb24gY29kZSAqL1xuICBjb25maXJtYXRpb246IHN0cmluZztcbn1cblxuLyoqIE1hbnkgTUZBIHJlY2VpcHRzICovXG5leHBvcnQgaW50ZXJmYWNlIE1hbnlNZmFSZWNlaXB0cyB7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBpZCAqL1xuICBvcmdJZDogc3RyaW5nO1xuICAvKiogUmVjZWlwdCBjb25maXJtYXRpb24gY29kZXMgKi9cbiAgcmVjZWlwdHM6IE1mYUlkQW5kQ29uZltdO1xufVxuXG4vKipcbiAqIFR5cGUgbmFycm93aW5nIGZyb20ge0BsaW5rIE1mYVJlY2VpcHRzfSB0byB7QGxpbmsgTWFueU1mYVJlY2VpcHRzfVxuICpcbiAqIEBwYXJhbSByZWMgVGhlIGlucHV0XG4gKiBAcmV0dXJucyBXaGV0aGVyIHtAbGluayByZWN9IGlzIG9mIHR5cGUge0BsaW5rIE1hbnlNZmFSZWNlaXB0c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWFueU1mYVJlY2VpcHRzKHJlYzogTWZhUmVjZWlwdHMpOiByZWMgaXMgTWFueU1mYVJlY2VpcHRzIHtcbiAgaWYgKHJlYyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHggPSByZWMgYXMgTWFueU1mYVJlY2VpcHRzO1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiB4Lm9yZ0lkID09PSBcInN0cmluZ1wiICYmXG4gICAgdHlwZW9mIHgucmVjZWlwdHMgPT09IFwib2JqZWN0XCIgJiZcbiAgICB4LnJlY2VpcHRzIGluc3RhbmNlb2YgQXJyYXkgJiZcbiAgICB4LnJlY2VpcHRzLmV2ZXJ5KGlzTWZhSWRBbmRDb25mKVxuICApO1xufVxuXG4vKipcbiAqIFR5cGUgbmFycm93aW5nIGZyb20gYHVua25vd25gIHRvIHtAbGluayBNZmFJZEFuZENvbmZ9XG4gKlxuICogQHBhcmFtIHggVGhlIGlucHV0XG4gKiBAcmV0dXJucyBXaGV0aGVyIHtAbGluayB4fSBpcyBvZiB0eXBlIHtAbGluayBNZmFJZEFuZENvbmZ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01mYUlkQW5kQ29uZih4OiB1bmtub3duKTogeCBpcyBNZmFJZEFuZENvbmYge1xuICBpZiAoeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHkgPSB4IGFzIE1mYUlkQW5kQ29uZjtcbiAgcmV0dXJuIHR5cGVvZiB5LmlkID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiB5LmNvbmZpcm1hdGlvbiA9PT0gXCJzdHJpbmdcIjtcbn1cblxuLyoqIE1GQSByZXF1ZXN0IGlkICovXG5leHBvcnQgdHlwZSBNZmFJZCA9IHN0cmluZztcblxuLyoqIE9yaWdpbmFsIHJlcXVlc3QgdHlwZSAqL1xuZXhwb3J0IHR5cGUgTWZhT3JpZ2luYWxSZXF1ZXN0ID0gTWZhUmVxdWVzdEluZm9bXCJyZXF1ZXN0XCJdO1xuXG4vKiogUmVwcmVzZW50YXRpb24gb2YgYW4gTUZBIHJlcXVlc3QgKi9cbmV4cG9ydCBjbGFzcyBNZmFSZXF1ZXN0IHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjaWQ6IE1mYUlkO1xuICAjZGF0YT86IE1mYVJlcXVlc3RJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBNRkEgcmVxdWVzdCBpZCAqL1xuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIE1GQSByZXF1ZXN0LiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBNZmFSZXF1ZXN0SW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSUQgb3IgdGhlIGRhdGEgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogTWZhSWQgfCBNZmFSZXF1ZXN0SW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhLmlkO1xuICAgICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhpcyBNRkEgcmVxdWVzdCBoYXMgYSByZWNlaXB0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBNRkEgcmVxdWVzdCBoYXMgYSByZWNlaXB0XG4gICAqL1xuICBhc3luYyBoYXNSZWNlaXB0KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHJlY2VpcHQgPSB0aGlzLiNkYXRhPy5yZWNlaXB0ID8/IChhd2FpdCB0aGlzLmZldGNoKCkpLnJlY2VpcHQ7XG4gICAgcmV0dXJuICEhcmVjZWlwdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG9yaWdpbmFsIHJlcXVlc3QgdGhhdCB0aGUgTUZBIHJlcXVlc3QgaXMgZm9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JpZ2luYWwgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdCgpOiBQcm9taXNlPE1mYU9yaWdpbmFsUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNhY2hlZCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKTtcbiAgICByZXR1cm4gZGF0YS5yZXF1ZXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVjZWlwdChzKVxuICAgKi9cbiAgYXN5bmMgcmVjZWlwdCgpOiBQcm9taXNlPE1mYVJlY2VpcHQgfCB1bmRlZmluZWQ+IHtcbiAgICAvLyBDaGVjayBpZiByZWNlaXB0IGlzIGFscmVhZHkgYXZhaWxhYmxlLiBJZiBub3QsIGZldGNoIG5ld2VzdCBpbmZvcm1hdGlvbiBhYm91dCBNRkEgcmVxdWVzdFxuICAgIGNvbnN0IHJlY2VpcHQgPSB0aGlzLiNkYXRhPy5yZWNlaXB0ID8/IChhd2FpdCB0aGlzLmZldGNoKCkpLnJlY2VpcHQ7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgbWZhSWQ6IHRoaXMuI2lkLFxuICAgICAgbWZhT3JnSWQ6IHRoaXMuI2FwaUNsaWVudC5vcmdJZCxcbiAgICAgIG1mYUNvbmY6IHJlY2VpcHQuY29uZmlybWF0aW9uLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhR2V0KHRoaXMuI2lkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJhcHByb3ZlXCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHJlamVjdCgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyB0b3RwQXBwcm92ZShjb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVUb3RwKHRoaXMuI2lkLCBjb2RlLCBcImFwcHJvdmVcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY29kZTogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlVG90cCh0aGlzLiNpZCwgY29kZSwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwvcmVqZWN0aW9uIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmdcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHJldHVybnMgQSBjaGFsbGVuZ2UgdGhhdCBuZWVkcyB0byBiZSBhbnN3ZXJlZCB0byBjb21wbGV0ZSB0aGUgYXBwcm92YWwuXG4gICAqL1xuICBhc3luYyBmaWRvVm90ZSgpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYUZpZG9Jbml0KHRoaXMuI2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbC9yZWplY3Rpb24gb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgZW1haWwgT1RQLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIE1mYUVtYWlsQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgTWZhRW1haWxDaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVZvdGUgVGhlIHZvdGUsIGkuZS4sIFwiYXBwcm92ZVwiIG9yIFwicmVqZWN0XCIuXG4gICAqIEByZXR1cm5zIFRoZSBjaGFsbGVuZ2UgdG8gYW5zd2VyIGJ5IGVudGVyaW5nIHRoZSBPVFAgY29kZSByZWNlaXZlZCB2aWEgZW1haWwuXG4gICAqL1xuICBhc3luYyBlbWFpbFZvdGUobWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhRW1haWxDaGFsbGVuZ2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXQodGhpcy5pZCwgbWZhVm90ZSk7XG4gIH1cbn1cblxuLyoqIFRPVFAgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBiZWZvcmUgdXNlcidzIFRPVFAgaXMgdXBkYXRlZCAqL1xuZXhwb3J0IGNsYXNzIFRvdHBDaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5ICNpZDogc3RyaW5nO1xuICByZWFkb25seSAjdXJsPzogc3RyaW5nO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgaWQgb2YgdGhlIGNoYWxsZW5nZSAqL1xuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2lkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBuZXcgVE9UUCBjb25maWd1cmF0aW9uICovXG4gIGdldCB1cmwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3VybDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gYXBpIFVzZWQgd2hlbiBhbnN3ZXJpbmcgdGhlIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIGRhdGEgVE9UUCBjaGFsbGVuZ2UgaW5mb3JtYXRpb24gb3IgSUQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgZGF0YTogVG90cEluZm8gfCBzdHJpbmcpIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YS50b3RwX2lkO1xuICAgICAgdGhpcy4jdXJsID0gZGF0YS50b3RwX3VybDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBjaGFsbGVuZ2Ugd2l0aCB0aGUgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSA2LWRpZ2l0IGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eXFxkezEsNn0kLy50ZXN0KGNvZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVE9UUCBjb2RlOiAke2NvZGV9OyBpdCBtdXN0IGJlIGEgNi1kaWdpdCBzdHJpbmdgKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlclRvdHBSZXNldENvbXBsZXRlKHRoaXMuaWQsIGNvZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgY3JlYXRpbmcgYSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkZEZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IGNoYWxsZW5nZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG9wdGlvbnM6IGFueTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtIGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIHJlcXVlc3QgdG8gYWRkIGEgRklETyBkZXZpY2VcbiAgICogQHBhcmFtIGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIGNoYWxsZW5nZTogQXBpQWRkRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaSA9IGFwaTtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcbiAgICB0aGlzLm9wdGlvbnMgPSBwYXJzZUNyZWF0aW9uT3B0aW9ucyhjaGFsbGVuZ2Uub3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gY3JlYXRlIGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKCkge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgO1xuICAgKiB0aGUgY3JlZGVudGlhbCBzaG91bGQgYmUgb2J0YWluZWQgYnkgY2FsbGluZ1xuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgY3JlYXRlYCBtZXRob2RcbiAgICogICAgICAgICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSkge1xuICAgIGNvbnN0IGFuc3dlciA9IGNyZWRlbnRpYWxUb0pTT04oY3JlZCk7XG4gICAgYXdhaXQgdGhpcy4jYXBpLnVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZSh0aGlzLmNoYWxsZW5nZUlkLCBhbnN3ZXIpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBhbiBNRkEgYXBwcm92YWwvcmVqZWN0aW9uIHZpYSBlbWFpbCBPVFAuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFFbWFpbENoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgI290cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlO1xuICByZWFkb25seSBtZmFJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBDdWJlU2lnbmVyIGFwaSBjbGllbnRcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqIEBwYXJhbSBvdHBSZXNwb25zZSBUaGUgcmVzcG9uc2UgcmV0dXJuZWQgYnkge0BsaW5rIEFwaUNsaWVudC5tZmFWb3RlRW1haWxJbml0fS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBtZmFJZDogc3RyaW5nLCBvdHBSZXNwb25zZTogRW1haWxPdHBSZXNwb25zZSkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLiNvdHBSZXNwb25zZSA9IG90cFJlc3BvbnNlO1xuICAgIHRoaXMubWZhSWQgPSBtZmFJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkIE1GQSB2b3RlIHJlcXVlc3QgdXNpbmcgZW1haWwgT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gb3RwQ29kZSBUaGUgTUZBIGFwcHJvdmFsIE9UUCBjb2RlIHJlY2VpdmVkIHZpYSBlbWFpbC5cbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihvdHBDb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlRW1haWxDb21wbGV0ZShcbiAgICAgIHRoaXMubWZhSWQsXG4gICAgICB0aGlzLiNvdHBSZXNwb25zZS5wYXJ0aWFsX3Rva2VuLFxuICAgICAgb3RwQ29kZSxcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBhbiBlbWFpbCByZXNldCBmbG93LlxuICovXG5leHBvcnQgY2xhc3MgUmVzZXRFbWFpbENoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgI290cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBDdWJlU2lnbmVyIGFwaSBjbGllbnRcbiAgICogQHBhcmFtIG90cFJlc3BvbnNlIFRoZSByZXNwb25zZSByZXR1cm5lZCBieSB7QGxpbmsgQXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXR9LlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG90cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI290cFJlc3BvbnNlID0gb3RwUmVzcG9uc2U7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCBlbWFpbCByZXNldCBmbG93IHVzaW5nIGVtYWlsIE9UUC5cbiAgICpcbiAgICogQHBhcmFtIG90cENvZGUgVGhlIHZlcmlmaWNhdGlvbiBPVFAgY29kZSByZWNlaXZlZCB2aWEgZW1haWwuXG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIG9uIHN1Y2Nlc3MgYW5kIHJlamVjdHMgb24gZXJyb3IuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIob3RwQ29kZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC51c2VyRW1haWxSZXNldENvbXBsZXRlKHRoaXMuI290cFJlc3BvbnNlLnBhcnRpYWxfdG9rZW4sIG90cENvZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBNRkEgYXBwcm92YWwgdXNpbmcgRklETy5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIE1mYUZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IG1mYUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNoYWxsZW5nZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG9wdGlvbnM6IGFueTtcblxuICAvKipcbiAgICogQHBhcmFtIGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIGluaXRpYXRlIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgaWQuXG4gICAqIEBwYXJhbSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIG1mYUlkOiBzdHJpbmcsIGNoYWxsZW5nZTogQXBpTWZhRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaTtcbiAgICB0aGlzLm1mYUlkID0gbWZhSWQ7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG4gICAgdGhpcy5vcHRpb25zID0gcGFyc2VSZXF1ZXN0T3B0aW9ucyhjaGFsbGVuZ2Uub3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gZ2V0IGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0LiBEZWZhdWx0cyB0byBcImFwcHJvdmVcIi5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgTWZhUmVxdWVzdCBhZnRlciBhbnN3ZXJpbmdcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIodm90ZT86IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFuc3dlcihjcmVkLCB2b3RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdC4gRGVmYXVsdHMgdG8gXCJhcHByb3ZlXCIuXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIE1mYVJlcXVlc3QgYWZ0ZXIgYW5zd2VyaW5nXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55LCB2b3RlOiBNZmFWb3RlID0gXCJhcHByb3ZlXCIpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBhbnN3ZXIgPSBjcmVkZW50aWFsVG9KU09OKGNyZWQpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUZpZG9Db21wbGV0ZShcbiAgICAgIHRoaXMubWZhSWQsXG4gICAgICB2b3RlLFxuICAgICAgdGhpcy5jaGFsbGVuZ2VJZCxcbiAgICAgIGFuc3dlcixcbiAgICApO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG59XG4iXX0=