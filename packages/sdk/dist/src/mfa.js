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
     * @returns TOTP registration response
     */
    async answer(code) {
        if (!/^\d{1,6}$/.test(code)) {
            throw new Error(`Invalid TOTP code: ${code}; it must be a 6-digit string`);
        }
        return await __classPrivateFieldGet(this, _TotpChallenge_api, "f").userTotpResetComplete(this.id, code);
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
     *
     * @returns FIDO registration response
     */
    async createCredentialAndAnswer() {
        const cred = await navigator.credentials.create({ publicKey: this.options });
        return await this.answer(cred);
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
     * @returns FIDO registration response
     */
    async answer(cred) {
        const answer = credentialToJSON(cred);
        return await __classPrivateFieldGet(this, _AddFidoChallenge_api, "f").userFidoRegisterComplete(this.challengeId, answer);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx1REFBdUQ7Ozs7Ozs7Ozs7Ozs7QUFXdkQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLE1BQU0sY0FBYyxDQUFDO0FBZ0MzRjs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBQyxHQUFnQjtJQUNoRCxJQUFJLEdBQUcsS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDcEMsTUFBTSxDQUFDLEdBQUcsR0FBc0IsQ0FBQztJQUNqQyxPQUFPLENBQ0wsT0FBTyxDQUFDLENBQUMsS0FBSyxLQUFLLFFBQVE7UUFDM0IsT0FBTyxDQUFDLENBQUMsUUFBUSxLQUFLLFFBQVE7UUFDOUIsQ0FBQyxDQUFDLFFBQVEsWUFBWSxLQUFLO1FBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUNqQyxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxDQUFVO0lBQ3ZDLElBQUksQ0FBQyxLQUFLLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNsQyxNQUFNLENBQUMsR0FBRyxDQUFpQixDQUFDO0lBQzVCLE9BQU8sT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLFFBQVEsSUFBSSxPQUFPLENBQUMsQ0FBQyxZQUFZLEtBQUssUUFBUSxDQUFDO0FBQ3hFLENBQUM7QUFRRCx1Q0FBdUM7QUFDdkMsTUFBTSxPQUFPLFVBQVU7SUFLckIsOEJBQThCO0lBQzlCLElBQUksRUFBRTtRQUNKLE9BQU8sdUJBQUEsSUFBSSxzQkFBSSxDQUFDO0lBQ2xCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUksd0JBQU0sQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7O09BS0c7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QjtRQVZoRSw4Q0FBc0I7UUFXN0IsdUJBQUEsSUFBSSwrQkFBYyxHQUFHLE1BQUEsQ0FBQztRQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxZQUFZLENBQUM7UUFDMUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxJQUFjO1FBQzVDLE1BQU0sSUFBSSxHQUFHLE1BQU0sU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDMUUsT0FBTyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQVMsRUFBRSxPQUFnQixTQUFTO1FBQy9DLE1BQU0sTUFBTSxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLG1CQUFtQixDQUNwRCxJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksRUFDSixJQUFJLENBQUMsV0FBVyxFQUNoQixNQUFNLENBQ1AsQ0FBQztRQUNGLE9BQU8sSUFBSSxVQUFVLENBQUMsdUJBQUEsSUFBSSxtQ0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cblxuaW1wb3J0IHR5cGUge1xuICBBcGlBZGRGaWRvQ2hhbGxlbmdlLFxuICBBcGlNZmFGaWRvQ2hhbGxlbmdlLFxuICBFbWFpbE90cFJlc3BvbnNlLFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgTWZhVm90ZSxcbiAgVG90cEluZm8sXG59IGZyb20gXCIuL3NjaGVtYV90eXBlcy50c1wiO1xuaW1wb3J0IHR5cGUgeyBBcGlDbGllbnQgfSBmcm9tIFwiLi9jbGllbnQvYXBpX2NsaWVudC50c1wiO1xuaW1wb3J0IHsgY3JlZGVudGlhbFRvSlNPTiwgcGFyc2VDcmVhdGlvbk9wdGlvbnMsIHBhcnNlUmVxdWVzdE9wdGlvbnMgfSBmcm9tIFwiLi9wYXNza2V5LnRzXCI7XG5cbi8qKiBNRkEgcmVjZWlwdCAqL1xuZXhwb3J0IGludGVyZmFjZSBNZmFSZWNlaXB0IHtcbiAgLyoqIE1GQSByZXF1ZXN0IElEICovXG4gIG1mYUlkOiBzdHJpbmc7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBJRCAqL1xuICBtZmFPcmdJZDogc3RyaW5nO1xuICAvKiogTUZBIGNvbmZpcm1hdGlvbiBjb2RlICovXG4gIG1mYUNvbmY6IHN0cmluZztcbn1cblxuLyoqIE9uZSBvciBtb3JlIE1GQSByZWNlaXB0cyAqL1xuZXhwb3J0IHR5cGUgTWZhUmVjZWlwdHMgPSBNZmFSZWNlaXB0IHwgTWFueU1mYVJlY2VpcHRzO1xuXG4vKiogVGhlIE1GQSBpZCBhbmQgY29uZmlybWF0aW9uIGNvcnJlc3BvbmRpbmcgdG8gYSBzaW5nbGUgcmVjZWlwdCBpbiBhIHtAbGluayBNYW55TWZhUmVjZWlwdHN9ICovXG4vLyBOT1RFOiBtdXN0IGNvcnJlc3BvbmQgdG8gdGhlIFJ1c3QgZGVmaW5pdGlvblxuZXhwb3J0IGludGVyZmFjZSBNZmFJZEFuZENvbmYge1xuICAvKiogTUZBIGlkICovXG4gIGlkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgY29uZmlybWF0aW9uOiBzdHJpbmc7XG59XG5cbi8qKiBNYW55IE1GQSByZWNlaXB0cyAqL1xuZXhwb3J0IGludGVyZmFjZSBNYW55TWZhUmVjZWlwdHMge1xuICAvKiogQ29ycmVzcG9uZGluZyBvcmcgaWQgKi9cbiAgb3JnSWQ6IHN0cmluZztcbiAgLyoqIFJlY2VpcHQgY29uZmlybWF0aW9uIGNvZGVzICovXG4gIHJlY2VpcHRzOiBNZmFJZEFuZENvbmZbXTtcbn1cblxuLyoqXG4gKiBUeXBlIG5hcnJvd2luZyBmcm9tIHtAbGluayBNZmFSZWNlaXB0c30gdG8ge0BsaW5rIE1hbnlNZmFSZWNlaXB0c31cbiAqXG4gKiBAcGFyYW0gcmVjIFRoZSBpbnB1dFxuICogQHJldHVybnMgV2hldGhlciB7QGxpbmsgcmVjfSBpcyBvZiB0eXBlIHtAbGluayBNYW55TWZhUmVjZWlwdHN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01hbnlNZmFSZWNlaXB0cyhyZWM6IE1mYVJlY2VpcHRzKTogcmVjIGlzIE1hbnlNZmFSZWNlaXB0cyB7XG4gIGlmIChyZWMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB4ID0gcmVjIGFzIE1hbnlNZmFSZWNlaXB0cztcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgeC5vcmdJZCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIHR5cGVvZiB4LnJlY2VpcHRzID09PSBcIm9iamVjdFwiICYmXG4gICAgeC5yZWNlaXB0cyBpbnN0YW5jZW9mIEFycmF5ICYmXG4gICAgeC5yZWNlaXB0cy5ldmVyeShpc01mYUlkQW5kQ29uZilcbiAgKTtcbn1cblxuLyoqXG4gKiBUeXBlIG5hcnJvd2luZyBmcm9tIGB1bmtub3duYCB0byB7QGxpbmsgTWZhSWRBbmRDb25mfVxuICpcbiAqIEBwYXJhbSB4IFRoZSBpbnB1dFxuICogQHJldHVybnMgV2hldGhlciB7QGxpbmsgeH0gaXMgb2YgdHlwZSB7QGxpbmsgTWZhSWRBbmRDb25mfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNZmFJZEFuZENvbmYoeDogdW5rbm93bik6IHggaXMgTWZhSWRBbmRDb25mIHtcbiAgaWYgKHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB5ID0geCBhcyBNZmFJZEFuZENvbmY7XG4gIHJldHVybiB0eXBlb2YgeS5pZCA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgeS5jb25maXJtYXRpb24gPT09IFwic3RyaW5nXCI7XG59XG5cbi8qKiBNRkEgcmVxdWVzdCBpZCAqL1xuZXhwb3J0IHR5cGUgTWZhSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmlnaW5hbCByZXF1ZXN0IHR5cGUgKi9cbmV4cG9ydCB0eXBlIE1mYU9yaWdpbmFsUmVxdWVzdCA9IE1mYVJlcXVlc3RJbmZvW1wicmVxdWVzdFwiXTtcblxuLyoqIFJlcHJlc2VudGF0aW9uIG9mIGFuIE1GQSByZXF1ZXN0ICovXG5leHBvcnQgY2xhc3MgTWZhUmVxdWVzdCB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI2lkOiBNZmFJZDtcbiAgI2RhdGE/OiBNZmFSZXF1ZXN0SW5mbztcblxuICAvKiogQHJldHVybnMgTUZBIHJlcXVlc3QgaWQgKi9cbiAgZ2V0IGlkKCkge1xuICAgIHJldHVybiB0aGlzLiNpZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgY2FjaGVkIHByb3BlcnRpZXMgb2YgdGhpcyBNRkEgcmVxdWVzdC4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3QgdGhlXG4gICAqIHN0YXRlIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZS5cbiAgICovXG4gIGdldCBjYWNoZWQoKTogTWZhUmVxdWVzdEluZm8gfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIElEIG9yIHRoZSBkYXRhIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IE1mYUlkIHwgTWZhUmVxdWVzdEluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YS5pZDtcbiAgICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB3aGV0aGVyIHRoaXMgTUZBIHJlcXVlc3QgaGFzIGEgcmVjZWlwdC5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgTUZBIHJlcXVlc3QgaGFzIGEgcmVjZWlwdFxuICAgKi9cbiAgYXN5bmMgaGFzUmVjZWlwdCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCByZWNlaXB0ID0gdGhpcy4jZGF0YT8ucmVjZWlwdCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKS5yZWNlaXB0O1xuICAgIHJldHVybiAhIXJlY2VpcHQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBvcmlnaW5hbCByZXF1ZXN0IHRoYXQgdGhlIE1GQSByZXF1ZXN0IGlzIGZvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG9yaWdpbmFsIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHJlcXVlc3QoKTogUHJvbWlzZTxNZmFPcmlnaW5hbFJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gdGhpcy5jYWNoZWQgPz8gKGF3YWl0IHRoaXMuZmV0Y2goKSk7XG4gICAgcmV0dXJuIGRhdGEucmVxdWVzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIE1GQSByZWNlaXB0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlY2VpcHQocylcbiAgICovXG4gIGFzeW5jIHJlY2VpcHQoKTogUHJvbWlzZTxNZmFSZWNlaXB0IHwgdW5kZWZpbmVkPiB7XG4gICAgLy8gQ2hlY2sgaWYgcmVjZWlwdCBpcyBhbHJlYWR5IGF2YWlsYWJsZS4gSWYgbm90LCBmZXRjaCBuZXdlc3QgaW5mb3JtYXRpb24gYWJvdXQgTUZBIHJlcXVlc3RcbiAgICBjb25zdCByZWNlaXB0ID0gdGhpcy4jZGF0YT8ucmVjZWlwdCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKS5yZWNlaXB0O1xuICAgIGlmICghcmVjZWlwdCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIG1mYUlkOiB0aGlzLiNpZCxcbiAgICAgIG1mYU9yZ0lkOiB0aGlzLiNhcGlDbGllbnQub3JnSWQsXG4gICAgICBtZmFDb25mOiByZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIGZldGNoKCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYUdldCh0aGlzLiNpZCk7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIGFwcHJvdmUoKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlQ3ModGhpcy4jaWQsIFwiYXBwcm92ZVwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyByZWplY3QoKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlQ3ModGhpcy4jaWQsIFwicmVqZWN0XCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgdG90cEFwcHJvdmUoY29kZTogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlVG90cCh0aGlzLiNpZCwgY29kZSwgXCJhcHByb3ZlXCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyB0b3RwUmVqZWN0KGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZVRvdHAodGhpcy4jaWQsIGNvZGUsIFwicmVqZWN0XCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsL3JlamVjdGlvbiBvZiBhbiBleGlzdGluZyBNRkEgcmVxdWVzdCB1c2luZyBGSURPLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nXG4gICAqIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEByZXR1cm5zIEEgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdG8gY29tcGxldGUgdGhlIGFwcHJvdmFsLlxuICAgKi9cbiAgYXN5bmMgZmlkb1ZvdGUoKTogUHJvbWlzZTxNZmFGaWRvQ2hhbGxlbmdlPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFGaWRvSW5pdCh0aGlzLiNpZCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwvcmVqZWN0aW9uIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIGVtYWlsIE9UUC5cbiAgICpcbiAgICogUmV0dXJucyBhIHtAbGluayBNZmFFbWFpbENoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmcge0BsaW5rIE1mYUVtYWlsQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFWb3RlIFRoZSB2b3RlLCBpLmUuLCBcImFwcHJvdmVcIiBvciBcInJlamVjdFwiLlxuICAgKiBAcmV0dXJucyBUaGUgY2hhbGxlbmdlIHRvIGFuc3dlciBieSBlbnRlcmluZyB0aGUgT1RQIGNvZGUgcmVjZWl2ZWQgdmlhIGVtYWlsLlxuICAgKi9cbiAgYXN5bmMgZW1haWxWb3RlKG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYUVtYWlsQ2hhbGxlbmdlPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlRW1haWxJbml0KHRoaXMuaWQsIG1mYVZvdGUpO1xuICB9XG59XG5cbi8qKiBUT1RQIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYmVmb3JlIHVzZXIncyBUT1RQIGlzIHVwZGF0ZWQgKi9cbmV4cG9ydCBjbGFzcyBUb3RwQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaTogQXBpQ2xpZW50O1xuICByZWFkb25seSAjaWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3VybD86IHN0cmluZztcblxuICAvKiogQHJldHVybnMgVGhlIGlkIG9mIHRoZSBjaGFsbGVuZ2UgKi9cbiAgZ2V0IGlkKCkge1xuICAgIHJldHVybiB0aGlzLiNpZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgbmV3IFRPVFAgY29uZmlndXJhdGlvbiAqL1xuICBnZXQgdXJsKCkge1xuICAgIHJldHVybiB0aGlzLiN1cmw7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGFwaSBVc2VkIHdoZW4gYW5zd2VyaW5nIHRoZSBjaGFsbGVuZ2UuXG4gICAqIEBwYXJhbSBkYXRhIFRPVFAgY2hhbGxlbmdlIGluZm9ybWF0aW9uIG9yIElELlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIGRhdGE6IFRvdHBJbmZvIHwgc3RyaW5nKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGEudG90cF9pZDtcbiAgICAgIHRoaXMuI3VybCA9IGRhdGEudG90cF91cmw7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgY2hhbGxlbmdlIHdpdGggdGhlIGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICpcbiAgICogQHBhcmFtIGNvZGUgNi1kaWdpdCBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gYHRoaXMudG90cFVybGAuXG4gICAqIEByZXR1cm5zIFRPVFAgcmVnaXN0cmF0aW9uIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY29kZTogc3RyaW5nKSB7XG4gICAgaWYgKCEvXlxcZHsxLDZ9JC8udGVzdChjb2RlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIFRPVFAgY29kZTogJHtjb2RlfTsgaXQgbXVzdCBiZSBhIDYtZGlnaXQgc3RyaW5nYCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaS51c2VyVG90cFJlc2V0Q29tcGxldGUodGhpcy5pZCwgY29kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBjcmVhdGluZyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgQWRkRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGk6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcGFyYW0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gcmVxdWVzdCB0byBhZGQgYSBGSURPIGRldmljZVxuICAgKiBAcGFyYW0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgY2hhbGxlbmdlOiBBcGlBZGRGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIHRoaXMuY2hhbGxlbmdlSWQgPSBjaGFsbGVuZ2UuY2hhbGxlbmdlX2lkO1xuICAgIHRoaXMub3B0aW9ucyA9IHBhcnNlQ3JlYXRpb25PcHRpb25zKGNoYWxsZW5nZS5vcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBjcmVhdGUgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICpcbiAgICogQHJldHVybnMgRklETyByZWdpc3RyYXRpb24gcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIoKSB7XG4gICAgY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgO1xuICAgKiB0aGUgY3JlZGVudGlhbCBzaG91bGQgYmUgb2J0YWluZWQgYnkgY2FsbGluZ1xuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgY3JlYXRlYCBtZXRob2RcbiAgICogICAgICAgICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKiBAcmV0dXJucyBGSURPIHJlZ2lzdHJhdGlvbiByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSkge1xuICAgIGNvbnN0IGFuc3dlciA9IGNyZWRlbnRpYWxUb0pTT04oY3JlZCk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaS51c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGUodGhpcy5jaGFsbGVuZ2VJZCwgYW5zd2VyKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGluaXRpYXRpbmcgYW4gTUZBIGFwcHJvdmFsL3JlamVjdGlvbiB2aWEgZW1haWwgT1RQLlxuICovXG5leHBvcnQgY2xhc3MgTWZhRW1haWxDaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IG90cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlO1xuICByZWFkb25seSBtZmFJZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBDdWJlU2lnbmVyIGFwaSBjbGllbnRcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBpZCBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqIEBwYXJhbSBvdHBSZXNwb25zZSBUaGUgcmVzcG9uc2UgcmV0dXJuZWQgYnkge0BsaW5rIEFwaUNsaWVudC5tZmFWb3RlRW1haWxJbml0fS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBtZmFJZDogc3RyaW5nLCBvdHBSZXNwb25zZTogRW1haWxPdHBSZXNwb25zZSkge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLm90cFJlc3BvbnNlID0gb3RwUmVzcG9uc2U7XG4gICAgdGhpcy5tZmFJZCA9IG1mYUlkO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgTUZBIHZvdGUgcmVxdWVzdCB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBvdHBDb2RlIFRoZSBNRkEgYXBwcm92YWwgT1RQIGNvZGUgcmVjZWl2ZWQgdmlhIGVtYWlsLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKG90cENvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVFbWFpbENvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHRoaXMub3RwUmVzcG9uc2UucGFydGlhbF90b2tlbixcbiAgICAgIG90cENvZGUsXG4gICAgKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGluaXRpYXRpbmcgYW4gZW1haWwgcmVzZXQgZmxvdy5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlc2V0RW1haWxDaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IG90cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBDdWJlU2lnbmVyIGFwaSBjbGllbnRcbiAgICogQHBhcmFtIG90cFJlc3BvbnNlIFRoZSByZXNwb25zZSByZXR1cm5lZCBieSB7QGxpbmsgQXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXR9LlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG90cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMub3RwUmVzcG9uc2UgPSBvdHBSZXNwb25zZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkIGVtYWlsIHJlc2V0IGZsb3cgdXNpbmcgZW1haWwgT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gb3RwQ29kZSBUaGUgdmVyaWZpY2F0aW9uIE9UUCBjb2RlIHJlY2VpdmVkIHZpYSBlbWFpbC5cbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgb24gc3VjY2VzcyBhbmQgcmVqZWN0cyBvbiBlcnJvci5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihvdHBDb2RlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnVzZXJFbWFpbFJlc2V0Q29tcGxldGUodGhpcy5vdHBSZXNwb25zZS5wYXJ0aWFsX3Rva2VuLCBvdHBDb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGluaXRpYXRpbmcgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE8uXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSBtZmFJZDogc3RyaW5nO1xuICByZWFkb25seSBjaGFsbGVuZ2VJZDogc3RyaW5nO1xuICByZWFkb25seSBvcHRpb25zOiBhbnk7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBhcGkgVGhlIEFQSSBjbGllbnQgdXNlZCB0byBpbml0aWF0ZSBNRkEgYXBwcm92YWwgdXNpbmcgRklET1xuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IGlkLlxuICAgKiBAcGFyYW0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmRcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaTogQXBpQ2xpZW50LCBtZmFJZDogc3RyaW5nLCBjaGFsbGVuZ2U6IEFwaU1mYUZpZG9DaGFsbGVuZ2UpIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGk7XG4gICAgdGhpcy5tZmFJZCA9IG1mYUlkO1xuICAgIHRoaXMuY2hhbGxlbmdlSWQgPSBjaGFsbGVuZ2UuY2hhbGxlbmdlX2lkO1xuICAgIHRoaXMub3B0aW9ucyA9IHBhcnNlUmVxdWVzdE9wdGlvbnMoY2hhbGxlbmdlLm9wdGlvbnMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGdldCBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB2b3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdC4gRGVmYXVsdHMgdG8gXCJhcHByb3ZlXCIuXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIE1mYVJlcXVlc3QgYWZ0ZXIgYW5zd2VyaW5nXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKHZvdGU/OiBNZmFWb3RlKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5nZXQoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCwgdm90ZSk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgLlxuICAgKiBUbyBvYnRhaW4gdGhpcyBjcmVkZW50aWFsLCBmb3IgZXhhbXBsZSwgY2FsbFxuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5nZXQoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgZ2V0YCBtZXRob2RcbiAgICogICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIHZvdGUgQXBwcm92ZSBvciByZWplY3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBNZmFSZXF1ZXN0IGFmdGVyIGFuc3dlcmluZ1xuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSwgdm90ZTogTWZhVm90ZSA9IFwiYXBwcm92ZVwiKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgYW5zd2VyID0gY3JlZGVudGlhbFRvSlNPTihjcmVkKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVGaWRvQ29tcGxldGUoXG4gICAgICB0aGlzLm1mYUlkLFxuICAgICAgdm90ZSxcbiAgICAgIHRoaXMuY2hhbGxlbmdlSWQsXG4gICAgICBhbnN3ZXIsXG4gICAgKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxufVxuIl19