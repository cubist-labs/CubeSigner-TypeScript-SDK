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
var _MfaRequest_apiClient, _MfaRequest_id, _MfaRequest_data, _TotpChallenge_api, _TotpChallenge_id, _TotpChallenge_url, _AddFidoChallenge_api, _MfaEmailChallenge_apiClient, _ResetEmailChallenge_apiClient, _MfaFidoChallenge_apiClient;
import { credentialToJSON, parseCreationOptions, parseRequestOptions } from "./passkey.js";
/**
 * Type narrowing from {@link MfaReceipts} to {@link ManyMfaReceipts}
 *
 * @param rec The input
 * @returns Whether {@link rec} is of type {@link ManyMfaReceipts}
 */
export function isManyMfaReceipts(rec) {
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
export function isMfaIdAndConf(x) {
    if (x === undefined)
        return false;
    const y = x;
    return typeof y.id === "string" && typeof y.confirmation === "string";
}
/** Representation of an MFA request */
export class MfaRequest {
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
_MfaRequest_apiClient = new WeakMap(), _MfaRequest_id = new WeakMap(), _MfaRequest_data = new WeakMap();
/** TOTP challenge that must be answered before user's TOTP is updated */
export class TotpChallenge {
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
_TotpChallenge_api = new WeakMap(), _TotpChallenge_id = new WeakMap(), _TotpChallenge_url = new WeakMap();
/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
export class AddFidoChallenge {
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
        this.options = parseCreationOptions(challenge.options);
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
        const answer = credentialToJSON(cred);
        await __classPrivateFieldGet(this, _AddFidoChallenge_api, "f").userFidoRegisterComplete(this.challengeId, answer);
    }
}
_AddFidoChallenge_api = new WeakMap();
/**
 * Returned after initiating an MFA approval/rejection via email OTP.
 */
export class MfaEmailChallenge {
    /**
     * Constructor.
     *
     * @param apiClient CubeSigner api client
     * @param mfaId The id of the MFA request.
     * @param otpResponse The response returned by {@link ApiClient.mfaVoteEmailInit}.
     */
    constructor(apiClient, mfaId, otpResponse) {
        _MfaEmailChallenge_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _MfaEmailChallenge_apiClient, apiClient, "f");
        this.otpResponse = otpResponse;
        this.mfaId = mfaId;
    }
    /**
     * Complete a previously initiated MFA vote request using email OTP.
     *
     * @param otpCode The MFA approval OTP code received via email.
     * @returns The current status of the MFA request.
     */
    async answer(otpCode) {
        return await __classPrivateFieldGet(this, _MfaEmailChallenge_apiClient, "f").mfaVoteEmailComplete(this.mfaId, this.otpResponse.partial_token, otpCode);
    }
}
_MfaEmailChallenge_apiClient = new WeakMap();
/**
 * Returned after initiating an email reset flow.
 */
export class ResetEmailChallenge {
    /**
     * Constructor.
     *
     * @param apiClient CubeSigner api client
     * @param otpResponse The response returned by {@link ApiClient.mfaVoteEmailInit}.
     */
    constructor(apiClient, otpResponse) {
        _ResetEmailChallenge_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _ResetEmailChallenge_apiClient, apiClient, "f");
        this.otpResponse = otpResponse;
    }
    /**
     * Complete a previously initiated email reset flow using email OTP.
     *
     * @param otpCode The verification OTP code received via email.
     * @returns A promise that resolves on success and rejects on error.
     */
    async answer(otpCode) {
        return await __classPrivateFieldGet(this, _ResetEmailChallenge_apiClient, "f").userEmailResetComplete(this.otpResponse.partial_token, otpCode);
    }
}
_ResetEmailChallenge_apiClient = new WeakMap();
/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
export class MfaFidoChallenge {
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
        this.options = parseRequestOptions(challenge.options);
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
        const answer = credentialToJSON(cred);
        const data = await __classPrivateFieldGet(this, _MfaFidoChallenge_apiClient, "f").mfaVoteFidoComplete(this.mfaId, vote, this.challengeId, answer);
        return new MfaRequest(__classPrivateFieldGet(this, _MfaFidoChallenge_apiClient, "f"), data);
    }
}
_MfaFidoChallenge_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1REFBdUQ7Ozs7Ozs7Ozs7Ozs7QUFXdkQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLE1BQU0sY0FBYyxDQUFDO0FBZ0MzRjs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxHQUFnQjtJQUNoRCxJQUFJLEdBQUcsS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDcEMsTUFBTSxDQUFDLEdBQUcsR0FBc0IsQ0FBQztJQUNqQyxPQUFPLENBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxLQUFLLFFBQVE7UUFDM0IsT0FBTyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDOUIsQ0FBQyxDQUFDLFFBQVEsWUFBWSxLQUFLO1FBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUNqQyxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxDQUFVO0lBQ3ZDLElBQUksQ0FBQyxLQUFLLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFpQixDQUFDO0lBQzVCLE9BQU8sT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsQ0FBQyxZQUFZLEtBQUssUUFBUSxDQUFDO0FBQ3hFLENBQUM7QUFRRCx1Q0FBdUM7QUFDdkMsTUFBTSxPQUFPLFVBQVU7SUFLckIsOEJBQThCO0lBQzlCLElBQUksRUFBRTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxzQkFBSSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksd0JBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7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Qix1QkFBQSxJQUFJLCtCQUFjLEdBQUcsTUFBQSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFtQixDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLHlCQUF5QixDQUFDLElBQWM7UUFDNUMsTUFBTSxJQUFJLEdBQUcsTUFBTSxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUMxRSxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7T0FZRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBUyxFQUFFLE9BQWdCLFNBQVM7UUFDL0MsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLG1DQUFXLENBQUMsbUJBQW1CLENBQ3BELElBQUksQ0FBQyxLQUFLLEVBQ1YsSUFBSSxFQUNKLElBQUksQ0FBQyxXQUFXLEVBQ2hCLE1BQU0sQ0FDUCxDQUFDO1FBQ0YsT0FBTyxJQUFJLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLG1DQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueSAqL1xuXG5pbXBvcnQgdHlwZSB7XG4gIEFwaUFkZEZpZG9DaGFsbGVuZ2UsXG4gIEFwaU1mYUZpZG9DaGFsbGVuZ2UsXG4gIEVtYWlsT3RwUmVzcG9uc2UsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZmFWb3RlLFxuICBUb3RwSW5mbyxcbn0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzLnRzXCI7XG5pbXBvcnQgdHlwZSB7IEFwaUNsaWVudCB9IGZyb20gXCIuL2NsaWVudC9hcGlfY2xpZW50LnRzXCI7XG5pbXBvcnQgeyBjcmVkZW50aWFsVG9KU09OLCBwYXJzZUNyZWF0aW9uT3B0aW9ucywgcGFyc2VSZXF1ZXN0T3B0aW9ucyB9IGZyb20gXCIuL3Bhc3NrZXkudHNcIjtcblxuLyoqIE1GQSByZWNlaXB0ICovXG5leHBvcnQgaW50ZXJmYWNlIE1mYVJlY2VpcHQge1xuICAvKiogTUZBIHJlcXVlc3QgSUQgKi9cbiAgbWZhSWQ6IHN0cmluZztcbiAgLyoqIENvcnJlc3BvbmRpbmcgb3JnIElEICovXG4gIG1mYU9yZ0lkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgbWZhQ29uZjogc3RyaW5nO1xufVxuXG4vKiogT25lIG9yIG1vcmUgTUZBIHJlY2VpcHRzICovXG5leHBvcnQgdHlwZSBNZmFSZWNlaXB0cyA9IE1mYVJlY2VpcHQgfCBNYW55TWZhUmVjZWlwdHM7XG5cbi8qKiBUaGUgTUZBIGlkIGFuZCBjb25maXJtYXRpb24gY29ycmVzcG9uZGluZyB0byBhIHNpbmdsZSByZWNlaXB0IGluIGEge0BsaW5rIE1hbnlNZmFSZWNlaXB0c30gKi9cbi8vIE5PVEU6IG11c3QgY29ycmVzcG9uZCB0byB0aGUgUnVzdCBkZWZpbml0aW9uXG5leHBvcnQgaW50ZXJmYWNlIE1mYUlkQW5kQ29uZiB7XG4gIC8qKiBNRkEgaWQgKi9cbiAgaWQ6IHN0cmluZztcbiAgLyoqIE1GQSBjb25maXJtYXRpb24gY29kZSAqL1xuICBjb25maXJtYXRpb246IHN0cmluZztcbn1cblxuLyoqIE1hbnkgTUZBIHJlY2VpcHRzICovXG5leHBvcnQgaW50ZXJmYWNlIE1hbnlNZmFSZWNlaXB0cyB7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBpZCAqL1xuICBvcmdJZDogc3RyaW5nO1xuICAvKiogUmVjZWlwdCBjb25maXJtYXRpb24gY29kZXMgKi9cbiAgcmVjZWlwdHM6IE1mYUlkQW5kQ29uZltdO1xufVxuXG4vKipcbiAqIFR5cGUgbmFycm93aW5nIGZyb20ge0BsaW5rIE1mYVJlY2VpcHRzfSB0byB7QGxpbmsgTWFueU1mYVJlY2VpcHRzfVxuICpcbiAqIEBwYXJhbSByZWMgVGhlIGlucHV0XG4gKiBAcmV0dXJucyBXaGV0aGVyIHtAbGluayByZWN9IGlzIG9mIHR5cGUge0BsaW5rIE1hbnlNZmFSZWNlaXB0c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWFueU1mYVJlY2VpcHRzKHJlYzogTWZhUmVjZWlwdHMpOiByZWMgaXMgTWFueU1mYVJlY2VpcHRzIHtcbiAgaWYgKHJlYyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHggPSByZWMgYXMgTWFueU1mYVJlY2VpcHRzO1xuICByZXR1cm4gKFxuICAgIHR5cGVvZiB4Lm9yZ0lkID09PSBcInN0cmluZ1wiICYmXG4gICAgdHlwZW9mIHgucmVjZWlwdHMgPT09IFwib2JqZWN0XCIgJiZcbiAgICB4LnJlY2VpcHRzIGluc3RhbmNlb2YgQXJyYXkgJiZcbiAgICB4LnJlY2VpcHRzLmV2ZXJ5KGlzTWZhSWRBbmRDb25mKVxuICApO1xufVxuXG4vKipcbiAqIFR5cGUgbmFycm93aW5nIGZyb20gYHVua25vd25gIHRvIHtAbGluayBNZmFJZEFuZENvbmZ9XG4gKlxuICogQHBhcmFtIHggVGhlIGlucHV0XG4gKiBAcmV0dXJucyBXaGV0aGVyIHtAbGluayB4fSBpcyBvZiB0eXBlIHtAbGluayBNZmFJZEFuZENvbmZ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01mYUlkQW5kQ29uZih4OiB1bmtub3duKTogeCBpcyBNZmFJZEFuZENvbmYge1xuICBpZiAoeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IHkgPSB4IGFzIE1mYUlkQW5kQ29uZjtcbiAgcmV0dXJuIHR5cGVvZiB5LmlkID09PSBcInN0cmluZ1wiICYmIHR5cGVvZiB5LmNvbmZpcm1hdGlvbiA9PT0gXCJzdHJpbmdcIjtcbn1cblxuLyoqIE1GQSByZXF1ZXN0IGlkICovXG5leHBvcnQgdHlwZSBNZmFJZCA9IHN0cmluZztcblxuLyoqIE9yaWdpbmFsIHJlcXVlc3QgdHlwZSAqL1xuZXhwb3J0IHR5cGUgTWZhT3JpZ2luYWxSZXF1ZXN0ID0gTWZhUmVxdWVzdEluZm9bXCJyZXF1ZXN0XCJdO1xuXG4vKiogUmVwcmVzZW50YXRpb24gb2YgYW4gTUZBIHJlcXVlc3QgKi9cbmV4cG9ydCBjbGFzcyBNZmFSZXF1ZXN0IHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjaWQ6IE1mYUlkO1xuICAjZGF0YT86IE1mYVJlcXVlc3RJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBNRkEgcmVxdWVzdCBpZCAqL1xuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIE1GQSByZXF1ZXN0LiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBNZmFSZXF1ZXN0SW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSUQgb3IgdGhlIGRhdGEgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogTWZhSWQgfCBNZmFSZXF1ZXN0SW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhLmlkO1xuICAgICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhpcyBNRkEgcmVxdWVzdCBoYXMgYSByZWNlaXB0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBNRkEgcmVxdWVzdCBoYXMgYSByZWNlaXB0XG4gICAqL1xuICBhc3luYyBoYXNSZWNlaXB0KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHJlY2VpcHQgPSB0aGlzLiNkYXRhPy5yZWNlaXB0ID8/IChhd2FpdCB0aGlzLmZldGNoKCkpLnJlY2VpcHQ7XG4gICAgcmV0dXJuICEhcmVjZWlwdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG9yaWdpbmFsIHJlcXVlc3QgdGhhdCB0aGUgTUZBIHJlcXVlc3QgaXMgZm9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JpZ2luYWwgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdCgpOiBQcm9taXNlPE1mYU9yaWdpbmFsUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNhY2hlZCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKTtcbiAgICByZXR1cm4gZGF0YS5yZXF1ZXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVjZWlwdChzKVxuICAgKi9cbiAgYXN5bmMgcmVjZWlwdCgpOiBQcm9taXNlPE1mYVJlY2VpcHQgfCB1bmRlZmluZWQ+IHtcbiAgICAvLyBDaGVjayBpZiByZWNlaXB0IGlzIGFscmVhZHkgYXZhaWxhYmxlLiBJZiBub3QsIGZldGNoIG5ld2VzdCBpbmZvcm1hdGlvbiBhYm91dCBNRkEgcmVxdWVzdFxuICAgIGNvbnN0IHJlY2VpcHQgPSB0aGlzLiNkYXRhPy5yZWNlaXB0ID8/IChhd2FpdCB0aGlzLmZldGNoKCkpLnJlY2VpcHQ7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgbWZhSWQ6IHRoaXMuI2lkLFxuICAgICAgbWZhT3JnSWQ6IHRoaXMuI2FwaUNsaWVudC5vcmdJZCxcbiAgICAgIG1mYUNvbmY6IHJlY2VpcHQuY29uZmlybWF0aW9uLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhR2V0KHRoaXMuI2lkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJhcHByb3ZlXCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHJlamVjdCgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyB0b3RwQXBwcm92ZShjb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVUb3RwKHRoaXMuI2lkLCBjb2RlLCBcImFwcHJvdmVcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY29kZTogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlVG90cCh0aGlzLiNpZCwgY29kZSwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwvcmVqZWN0aW9uIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmdcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHJldHVybnMgQSBjaGFsbGVuZ2UgdGhhdCBuZWVkcyB0byBiZSBhbnN3ZXJlZCB0byBjb21wbGV0ZSB0aGUgYXBwcm92YWwuXG4gICAqL1xuICBhc3luYyBmaWRvVm90ZSgpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYUZpZG9Jbml0KHRoaXMuI2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbC9yZWplY3Rpb24gb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgZW1haWwgT1RQLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIE1mYUVtYWlsQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgTWZhRW1haWxDaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVZvdGUgVGhlIHZvdGUsIGkuZS4sIFwiYXBwcm92ZVwiIG9yIFwicmVqZWN0XCIuXG4gICAqIEByZXR1cm5zIFRoZSBjaGFsbGVuZ2UgdG8gYW5zd2VyIGJ5IGVudGVyaW5nIHRoZSBPVFAgY29kZSByZWNlaXZlZCB2aWEgZW1haWwuXG4gICAqL1xuICBhc3luYyBlbWFpbFZvdGUobWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhRW1haWxDaGFsbGVuZ2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXQodGhpcy5pZCwgbWZhVm90ZSk7XG4gIH1cbn1cblxuLyoqIFRPVFAgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBiZWZvcmUgdXNlcidzIFRPVFAgaXMgdXBkYXRlZCAqL1xuZXhwb3J0IGNsYXNzIFRvdHBDaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5ICNpZDogc3RyaW5nO1xuICByZWFkb25seSAjdXJsPzogc3RyaW5nO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgaWQgb2YgdGhlIGNoYWxsZW5nZSAqL1xuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2lkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBuZXcgVE9UUCBjb25maWd1cmF0aW9uICovXG4gIGdldCB1cmwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3VybDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gYXBpIFVzZWQgd2hlbiBhbnN3ZXJpbmcgdGhlIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIGRhdGEgVE9UUCBjaGFsbGVuZ2UgaW5mb3JtYXRpb24gb3IgSUQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgZGF0YTogVG90cEluZm8gfCBzdHJpbmcpIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YS50b3RwX2lkO1xuICAgICAgdGhpcy4jdXJsID0gZGF0YS50b3RwX3VybDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBjaGFsbGVuZ2Ugd2l0aCB0aGUgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSA2LWRpZ2l0IGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eXFxkezEsNn0kLy50ZXN0KGNvZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVE9UUCBjb2RlOiAke2NvZGV9OyBpdCBtdXN0IGJlIGEgNi1kaWdpdCBzdHJpbmdgKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlclRvdHBSZXNldENvbXBsZXRlKHRoaXMuaWQsIGNvZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgY3JlYXRpbmcgYSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkZEZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IGNoYWxsZW5nZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG9wdGlvbnM6IGFueTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtIGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIHJlcXVlc3QgdG8gYWRkIGEgRklETyBkZXZpY2VcbiAgICogQHBhcmFtIGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIGNoYWxsZW5nZTogQXBpQWRkRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaSA9IGFwaTtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcbiAgICB0aGlzLm9wdGlvbnMgPSBwYXJzZUNyZWF0aW9uT3B0aW9ucyhjaGFsbGVuZ2Uub3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gY3JlYXRlIGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKCkge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgO1xuICAgKiB0aGUgY3JlZGVudGlhbCBzaG91bGQgYmUgb2J0YWluZWQgYnkgY2FsbGluZ1xuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgY3JlYXRlYCBtZXRob2RcbiAgICogICAgICAgICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSkge1xuICAgIGNvbnN0IGFuc3dlciA9IGNyZWRlbnRpYWxUb0pTT04oY3JlZCk7XG4gICAgYXdhaXQgdGhpcy4jYXBpLnVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZSh0aGlzLmNoYWxsZW5nZUlkLCBhbnN3ZXIpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBhbiBNRkEgYXBwcm92YWwvcmVqZWN0aW9uIHZpYSBlbWFpbCBPVFAuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFFbWFpbENoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgb3RwUmVzcG9uc2U6IEVtYWlsT3RwUmVzcG9uc2U7XG4gIHJlYWRvbmx5IG1mYUlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IEN1YmVTaWduZXIgYXBpIGNsaWVudFxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHBhcmFtIG90cFJlc3BvbnNlIFRoZSByZXNwb25zZSByZXR1cm5lZCBieSB7QGxpbmsgQXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXR9LlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG1mYUlkOiBzdHJpbmcsIG90cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMub3RwUmVzcG9uc2UgPSBvdHBSZXNwb25zZTtcbiAgICB0aGlzLm1mYUlkID0gbWZhSWQ7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCBNRkEgdm90ZSByZXF1ZXN0IHVzaW5nIGVtYWlsIE9UUC5cbiAgICpcbiAgICogQHBhcmFtIG90cENvZGUgVGhlIE1GQSBhcHByb3ZhbCBPVFAgY29kZSByZWNlaXZlZCB2aWEgZW1haWwuXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIob3RwQ29kZTogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUVtYWlsQ29tcGxldGUoXG4gICAgICB0aGlzLm1mYUlkLFxuICAgICAgdGhpcy5vdHBSZXNwb25zZS5wYXJ0aWFsX3Rva2VuLFxuICAgICAgb3RwQ29kZSxcbiAgICApO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBhbiBlbWFpbCByZXNldCBmbG93LlxuICovXG5leHBvcnQgY2xhc3MgUmVzZXRFbWFpbENoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgb3RwUmVzcG9uc2U6IEVtYWlsT3RwUmVzcG9uc2U7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IEN1YmVTaWduZXIgYXBpIGNsaWVudFxuICAgKiBAcGFyYW0gb3RwUmVzcG9uc2UgVGhlIHJlc3BvbnNlIHJldHVybmVkIGJ5IHtAbGluayBBcGlDbGllbnQubWZhVm90ZUVtYWlsSW5pdH0uXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgb3RwUmVzcG9uc2U6IEVtYWlsT3RwUmVzcG9uc2UpIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy5vdHBSZXNwb25zZSA9IG90cFJlc3BvbnNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgZW1haWwgcmVzZXQgZmxvdyB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBvdHBDb2RlIFRoZSB2ZXJpZmljYXRpb24gT1RQIGNvZGUgcmVjZWl2ZWQgdmlhIGVtYWlsLlxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgdGhhdCByZXNvbHZlcyBvbiBzdWNjZXNzIGFuZCByZWplY3RzIG9uIGVycm9yLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKG90cENvZGU6IHN0cmluZykge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQudXNlckVtYWlsUmVzZXRDb21wbGV0ZSh0aGlzLm90cFJlc3BvbnNlLnBhcnRpYWxfdG9rZW4sIG90cENvZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgaW5pdGlhdGluZyBNRkEgYXBwcm92YWwgdXNpbmcgRklETy5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIE1mYUZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IG1mYUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGNoYWxsZW5nZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG9wdGlvbnM6IGFueTtcblxuICAvKipcbiAgICogQHBhcmFtIGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIGluaXRpYXRlIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgaWQuXG4gICAqIEBwYXJhbSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIG1mYUlkOiBzdHJpbmcsIGNoYWxsZW5nZTogQXBpTWZhRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaTtcbiAgICB0aGlzLm1mYUlkID0gbWZhSWQ7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG4gICAgdGhpcy5vcHRpb25zID0gcGFyc2VSZXF1ZXN0T3B0aW9ucyhjaGFsbGVuZ2Uub3B0aW9ucyk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gZ2V0IGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHBhcmFtIHZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0LiBEZWZhdWx0cyB0byBcImFwcHJvdmVcIi5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgTWZhUmVxdWVzdCBhZnRlciBhbnN3ZXJpbmdcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIodm90ZT86IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFuc3dlcihjcmVkLCB2b3RlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdC4gRGVmYXVsdHMgdG8gXCJhcHByb3ZlXCIuXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIE1mYVJlcXVlc3QgYWZ0ZXIgYW5zd2VyaW5nXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55LCB2b3RlOiBNZmFWb3RlID0gXCJhcHByb3ZlXCIpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBhbnN3ZXIgPSBjcmVkZW50aWFsVG9KU09OKGNyZWQpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUZpZG9Db21wbGV0ZShcbiAgICAgIHRoaXMubWZhSWQsXG4gICAgICB2b3RlLFxuICAgICAgdGhpcy5jaGFsbGVuZ2VJZCxcbiAgICAgIGFuc3dlcixcbiAgICApO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG59XG4iXX0=