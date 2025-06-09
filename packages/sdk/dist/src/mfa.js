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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFpRHZELDhDQVNDO0FBUUQsd0NBSUM7QUEzREQsdUNBQXdGO0FBZ0N4Rjs7Ozs7R0FLRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLEdBQWdCO0lBQ2hELElBQUksR0FBRyxLQUFLLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNwQyxNQUFNLENBQUMsR0FBRyxHQUFzQixDQUFDO0lBQ2pDLE9BQU8sQ0FDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUTtRQUMzQixPQUFPLENBQUMsQ0FBQyxRQUFRLEtBQUssUUFBUTtRQUM5QixDQUFDLENBQUMsUUFBUSxZQUFZLEtBQUs7UUFDM0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQ2pDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixjQUFjLENBQUMsQ0FBVTtJQUN2QyxJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDbEMsTUFBTSxDQUFDLEdBQUcsQ0FBaUIsQ0FBQztJQUM1QixPQUFPLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQztBQUN4RSxDQUFDO0FBUUQsdUNBQXVDO0FBQ3ZDLE1BQWEsVUFBVTtJQUtyQiw4QkFBOEI7SUFDOUIsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLHNCQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSx3QkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksU0FBb0IsRUFBRSxJQUE0QjtRQXZCckQsd0NBQXNC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QUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7OztPQVlHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFTLEVBQUUsT0FBZ0IsU0FBUztRQUMvQyxNQUFNLE1BQU0sR0FBRyxJQUFBLDBCQUFnQixFQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLG1CQUFtQixDQUNwRCxJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksRUFDSixJQUFJLENBQUMsV0FBVyxFQUNoQixNQUFNLENBQ1AsQ0FBQztRQUNGLE9BQU8sSUFBSSxVQUFVLENBQUMsdUJBQUEsSUFBSSxtQ0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDRjtBQXJERCw0Q0FxREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG5cbmltcG9ydCB0eXBlIHtcbiAgQXBpQWRkRmlkb0NoYWxsZW5nZSxcbiAgQXBpTWZhRmlkb0NoYWxsZW5nZSxcbiAgRW1haWxPdHBSZXNwb25zZSxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIE1mYVZvdGUsXG4gIFRvdHBJbmZvLFxufSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgQXBpQ2xpZW50IH0gZnJvbSBcIi4vY2xpZW50L2FwaV9jbGllbnRcIjtcbmltcG9ydCB7IGNyZWRlbnRpYWxUb0pTT04sIHBhcnNlQ3JlYXRpb25PcHRpb25zLCBwYXJzZVJlcXVlc3RPcHRpb25zIH0gZnJvbSBcIi4vcGFzc2tleVwiO1xuXG4vKiogTUZBIHJlY2VpcHQgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWZhUmVjZWlwdCB7XG4gIC8qKiBNRkEgcmVxdWVzdCBJRCAqL1xuICBtZmFJZDogc3RyaW5nO1xuICAvKiogQ29ycmVzcG9uZGluZyBvcmcgSUQgKi9cbiAgbWZhT3JnSWQ6IHN0cmluZztcbiAgLyoqIE1GQSBjb25maXJtYXRpb24gY29kZSAqL1xuICBtZmFDb25mOiBzdHJpbmc7XG59XG5cbi8qKiBPbmUgb3IgbW9yZSBNRkEgcmVjZWlwdHMgKi9cbmV4cG9ydCB0eXBlIE1mYVJlY2VpcHRzID0gTWZhUmVjZWlwdCB8IE1hbnlNZmFSZWNlaXB0cztcblxuLyoqIFRoZSBNRkEgaWQgYW5kIGNvbmZpcm1hdGlvbiBjb3JyZXNwb25kaW5nIHRvIGEgc2luZ2xlIHJlY2VpcHQgaW4gYSB7QGxpbmsgTWFueU1mYVJlY2VpcHRzfSAqL1xuLy8gTk9URTogbXVzdCBjb3JyZXNwb25kIHRvIHRoZSBSdXN0IGRlZmluaXRpb25cbmV4cG9ydCBpbnRlcmZhY2UgTWZhSWRBbmRDb25mIHtcbiAgLyoqIE1GQSBpZCAqL1xuICBpZDogc3RyaW5nO1xuICAvKiogTUZBIGNvbmZpcm1hdGlvbiBjb2RlICovXG4gIGNvbmZpcm1hdGlvbjogc3RyaW5nO1xufVxuXG4vKiogTWFueSBNRkEgcmVjZWlwdHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgTWFueU1mYVJlY2VpcHRzIHtcbiAgLyoqIENvcnJlc3BvbmRpbmcgb3JnIGlkICovXG4gIG9yZ0lkOiBzdHJpbmc7XG4gIC8qKiBSZWNlaXB0IGNvbmZpcm1hdGlvbiBjb2RlcyAqL1xuICByZWNlaXB0czogTWZhSWRBbmRDb25mW107XG59XG5cbi8qKlxuICogVHlwZSBuYXJyb3dpbmcgZnJvbSB7QGxpbmsgTWZhUmVjZWlwdHN9IHRvIHtAbGluayBNYW55TWZhUmVjZWlwdHN9XG4gKlxuICogQHBhcmFtIHJlYyBUaGUgaW5wdXRcbiAqIEByZXR1cm5zIFdoZXRoZXIge0BsaW5rIHJlY30gaXMgb2YgdHlwZSB7QGxpbmsgTWFueU1mYVJlY2VpcHRzfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNYW55TWZhUmVjZWlwdHMocmVjOiBNZmFSZWNlaXB0cyk6IHJlYyBpcyBNYW55TWZhUmVjZWlwdHMge1xuICBpZiAocmVjID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgeCA9IHJlYyBhcyBNYW55TWZhUmVjZWlwdHM7XG4gIHJldHVybiAoXG4gICAgdHlwZW9mIHgub3JnSWQgPT09IFwic3RyaW5nXCIgJiZcbiAgICB0eXBlb2YgeC5yZWNlaXB0cyA9PT0gXCJvYmplY3RcIiAmJlxuICAgIHgucmVjZWlwdHMgaW5zdGFuY2VvZiBBcnJheSAmJlxuICAgIHgucmVjZWlwdHMuZXZlcnkoaXNNZmFJZEFuZENvbmYpXG4gICk7XG59XG5cbi8qKlxuICogVHlwZSBuYXJyb3dpbmcgZnJvbSBgdW5rbm93bmAgdG8ge0BsaW5rIE1mYUlkQW5kQ29uZn1cbiAqXG4gKiBAcGFyYW0geCBUaGUgaW5wdXRcbiAqIEByZXR1cm5zIFdoZXRoZXIge0BsaW5rIHh9IGlzIG9mIHR5cGUge0BsaW5rIE1mYUlkQW5kQ29uZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTWZhSWRBbmRDb25mKHg6IHVua25vd24pOiB4IGlzIE1mYUlkQW5kQ29uZiB7XG4gIGlmICh4ID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgeSA9IHggYXMgTWZhSWRBbmRDb25mO1xuICByZXR1cm4gdHlwZW9mIHkuaWQgPT09IFwic3RyaW5nXCIgJiYgdHlwZW9mIHkuY29uZmlybWF0aW9uID09PSBcInN0cmluZ1wiO1xufVxuXG4vKiogTUZBIHJlcXVlc3QgaWQgKi9cbmV4cG9ydCB0eXBlIE1mYUlkID0gc3RyaW5nO1xuXG4vKiogT3JpZ2luYWwgcmVxdWVzdCB0eXBlICovXG5leHBvcnQgdHlwZSBNZmFPcmlnaW5hbFJlcXVlc3QgPSBNZmFSZXF1ZXN0SW5mb1tcInJlcXVlc3RcIl07XG5cbi8qKiBSZXByZXNlbnRhdGlvbiBvZiBhbiBNRkEgcmVxdWVzdCAqL1xuZXhwb3J0IGNsYXNzIE1mYVJlcXVlc3Qge1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gICNpZDogTWZhSWQ7XG4gICNkYXRhPzogTWZhUmVxdWVzdEluZm87XG5cbiAgLyoqIEByZXR1cm5zIE1GQSByZXF1ZXN0IGlkICovXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgTUZBIHJlcXVlc3QuIFRoZSBjYWNoZWQgcHJvcGVydGllcyByZWZsZWN0IHRoZVxuICAgKiBzdGF0ZSBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUuXG4gICAqL1xuICBnZXQgY2FjaGVkKCk6IE1mYVJlcXVlc3RJbmZvIHwgdW5kZWZpbmVkIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBJRCBvciB0aGUgZGF0YSBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBNZmFJZCB8IE1mYVJlcXVlc3RJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGEuaWQ7XG4gICAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgd2hldGhlciB0aGlzIE1GQSByZXF1ZXN0IGhhcyBhIHJlY2VpcHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdGhlIE1GQSByZXF1ZXN0IGhhcyBhIHJlY2VpcHRcbiAgICovXG4gIGFzeW5jIGhhc1JlY2VpcHQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgcmVjZWlwdCA9IHRoaXMuI2RhdGE/LnJlY2VpcHQgPz8gKGF3YWl0IHRoaXMuZmV0Y2goKSkucmVjZWlwdDtcbiAgICByZXR1cm4gISFyZWNlaXB0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgb3JpZ2luYWwgcmVxdWVzdCB0aGF0IHRoZSBNRkEgcmVxdWVzdCBpcyBmb3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBvcmlnaW5hbCByZXF1ZXN0XG4gICAqL1xuICBhc3luYyByZXF1ZXN0KCk6IFByb21pc2U8TWZhT3JpZ2luYWxSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IHRoaXMuY2FjaGVkID8/IChhd2FpdCB0aGlzLmZldGNoKCkpO1xuICAgIHJldHVybiBkYXRhLnJlcXVlc3Q7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBNRkEgcmVjZWlwdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZWNlaXB0KHMpXG4gICAqL1xuICBhc3luYyByZWNlaXB0KCk6IFByb21pc2U8TWZhUmVjZWlwdCB8IHVuZGVmaW5lZD4ge1xuICAgIC8vIENoZWNrIGlmIHJlY2VpcHQgaXMgYWxyZWFkeSBhdmFpbGFibGUuIElmIG5vdCwgZmV0Y2ggbmV3ZXN0IGluZm9ybWF0aW9uIGFib3V0IE1GQSByZXF1ZXN0XG4gICAgY29uc3QgcmVjZWlwdCA9IHRoaXMuI2RhdGE/LnJlY2VpcHQgPz8gKGF3YWl0IHRoaXMuZmV0Y2goKSkucmVjZWlwdDtcbiAgICBpZiAoIXJlY2VpcHQpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBtZmFJZDogdGhpcy4jaWQsXG4gICAgICBtZmFPcmdJZDogdGhpcy4jYXBpQ2xpZW50Lm9yZ0lkLFxuICAgICAgbWZhQ29uZjogcmVjZWlwdC5jb25maXJtYXRpb24sXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUga2V5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3QgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFHZXQodGhpcy4jaWQpO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBhcHByb3ZlKCk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUNzKHRoaXMuI2lkLCBcImFwcHJvdmVcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgcmVqZWN0KCk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUNzKHRoaXMuI2lkLCBcInJlamVjdFwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBBcHByb3ZlKGNvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZVRvdHAodGhpcy4jaWQsIGNvZGUsIFwiYXBwcm92ZVwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIFRPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlIFRoZSBUT1RQIGNvZGVcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgdG90cFJlamVjdChjb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVUb3RwKHRoaXMuI2lkLCBjb2RlLCBcInJlamVjdFwiKTtcbiAgICByZXR1cm4gbmV3IE1mYVJlcXVlc3QodGhpcy4jYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbC9yZWplY3Rpb24gb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgRklETy5cbiAgICpcbiAgICogUmV0dXJucyBhIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZ1xuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIGZpZG9Wb3RlKCk6IFByb21pc2U8TWZhRmlkb0NoYWxsZW5nZT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhRmlkb0luaXQodGhpcy4jaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsL3JlamVjdGlvbiBvZiBhbiBleGlzdGluZyBNRkEgcmVxdWVzdCB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgTWZhRW1haWxDaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBieSBjYWxsaW5nIHtAbGluayBNZmFFbWFpbENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhVm90ZSBUaGUgdm90ZSwgaS5lLiwgXCJhcHByb3ZlXCIgb3IgXCJyZWplY3RcIi5cbiAgICogQHJldHVybnMgVGhlIGNoYWxsZW5nZSB0byBhbnN3ZXIgYnkgZW50ZXJpbmcgdGhlIE9UUCBjb2RlIHJlY2VpdmVkIHZpYSBlbWFpbC5cbiAgICovXG4gIGFzeW5jIGVtYWlsVm90ZShtZmFWb3RlOiBNZmFWb3RlKTogUHJvbWlzZTxNZmFFbWFpbENoYWxsZW5nZT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhVm90ZUVtYWlsSW5pdCh0aGlzLmlkLCBtZmFWb3RlKTtcbiAgfVxufVxuXG4vKiogVE9UUCBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJlZm9yZSB1c2VyJ3MgVE9UUCBpcyB1cGRhdGVkICovXG5leHBvcnQgY2xhc3MgVG90cENoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGk6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgI2lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICN1cmw/OiBzdHJpbmc7XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBpZCBvZiB0aGUgY2hhbGxlbmdlICovXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIG5ldyBUT1RQIGNvbmZpZ3VyYXRpb24gKi9cbiAgZ2V0IHVybCgpIHtcbiAgICByZXR1cm4gdGhpcy4jdXJsO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBhcGkgVXNlZCB3aGVuIGFuc3dlcmluZyB0aGUgY2hhbGxlbmdlLlxuICAgKiBAcGFyYW0gZGF0YSBUT1RQIGNoYWxsZW5nZSBpbmZvcm1hdGlvbiBvciBJRC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaTogQXBpQ2xpZW50LCBkYXRhOiBUb3RwSW5mbyB8IHN0cmluZykge1xuICAgIHRoaXMuI2FwaSA9IGFwaTtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhLnRvdHBfaWQ7XG4gICAgICB0aGlzLiN1cmwgPSBkYXRhLnRvdHBfdXJsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIGNoYWxsZW5nZSB3aXRoIHRoZSBjb2RlIHRoYXQgY29ycmVzcG9uZHMgdG8gYHRoaXMudG90cFVybGAuXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlIDYtZGlnaXQgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNvZGU6IHN0cmluZykge1xuICAgIGlmICghL15cXGR7MSw2fSQvLnRlc3QoY29kZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBUT1RQIGNvZGU6ICR7Y29kZX07IGl0IG11c3QgYmUgYSA2LWRpZ2l0IHN0cmluZ2ApO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuI2FwaS51c2VyVG90cFJlc2V0Q29tcGxldGUodGhpcy5pZCwgY29kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBjcmVhdGluZyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgQWRkRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGk6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKlxuICAgKiBAcGFyYW0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gcmVxdWVzdCB0byBhZGQgYSBGSURPIGRldmljZVxuICAgKiBAcGFyYW0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgY2hhbGxlbmdlOiBBcGlBZGRGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpID0gYXBpO1xuICAgIHRoaXMuY2hhbGxlbmdlSWQgPSBjaGFsbGVuZ2UuY2hhbGxlbmdlX2lkO1xuICAgIHRoaXMub3B0aW9ucyA9IHBhcnNlQ3JlYXRpb25PcHRpb25zKGNoYWxsZW5nZS5vcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBjcmVhdGUgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIoKSB7XG4gICAgY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICBhd2FpdCB0aGlzLmFuc3dlcihjcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGA7XG4gICAqIHRoZSBjcmVkZW50aWFsIHNob3VsZCBiZSBvYnRhaW5lZCBieSBjYWxsaW5nXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmNyZWF0ZSh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBjcmVhdGVgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55KSB7XG4gICAgY29uc3QgYW5zd2VyID0gY3JlZGVudGlhbFRvSlNPTihjcmVkKTtcbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlckZpZG9SZWdpc3RlckNvbXBsZXRlKHRoaXMuY2hhbGxlbmdlSWQsIGFuc3dlcik7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBpbml0aWF0aW5nIGFuIE1GQSBhcHByb3ZhbC9yZWplY3Rpb24gdmlhIGVtYWlsIE9UUC5cbiAqL1xuZXhwb3J0IGNsYXNzIE1mYUVtYWlsQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSAjb3RwUmVzcG9uc2U6IEVtYWlsT3RwUmVzcG9uc2U7XG4gIHJlYWRvbmx5IG1mYUlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IEN1YmVTaWduZXIgYXBpIGNsaWVudFxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHBhcmFtIG90cFJlc3BvbnNlIFRoZSByZXNwb25zZSByZXR1cm5lZCBieSB7QGxpbmsgQXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXR9LlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG1mYUlkOiBzdHJpbmcsIG90cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI290cFJlc3BvbnNlID0gb3RwUmVzcG9uc2U7XG4gICAgdGhpcy5tZmFJZCA9IG1mYUlkO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgTUZBIHZvdGUgcmVxdWVzdCB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBvdHBDb2RlIFRoZSBNRkEgYXBwcm92YWwgT1RQIGNvZGUgcmVjZWl2ZWQgdmlhIGVtYWlsLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKG90cENvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVFbWFpbENvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHRoaXMuI290cFJlc3BvbnNlLnBhcnRpYWxfdG9rZW4sXG4gICAgICBvdHBDb2RlLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBpbml0aWF0aW5nIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgTWZhRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgbWZhSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gaW5pdGlhdGUgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE9cbiAgICogQHBhcmFtIG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBpZC5cbiAgICogQHBhcmFtIGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgbWZhSWQ6IHN0cmluZywgY2hhbGxlbmdlOiBBcGlNZmFGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpO1xuICAgIHRoaXMubWZhSWQgPSBtZmFJZDtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcbiAgICB0aGlzLm9wdGlvbnMgPSBwYXJzZVJlcXVlc3RPcHRpb25zKGNoYWxsZW5nZS5vcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBnZXQgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBAcGFyYW0gdm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBNZmFSZXF1ZXN0IGFmdGVyIGFuc3dlcmluZ1xuICAgKi9cbiAgYXN5bmMgY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcih2b3RlPzogTWZhVm90ZSk6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYW5zd2VyKGNyZWQsIHZvdGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgdXNpbmcgYSBnaXZlbiBjcmVkZW50aWFsIGBjcmVkYC5cbiAgICogVG8gb2J0YWluIHRoaXMgY3JlZGVudGlhbCwgZm9yIGV4YW1wbGUsIGNhbGxcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gY3JlZCBDcmVkZW50aWFsIGNyZWF0ZWQgYnkgY2FsbGluZyB0aGUgYENyZWRlbnRpYWxDb250YWluZXJgJ3MgYGdldGAgbWV0aG9kXG4gICAqICAgICAgICAgICAgIGJhc2VkIG9uIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqIEBwYXJhbSB2b3RlIEFwcHJvdmUgb3IgcmVqZWN0LiBEZWZhdWx0cyB0byBcImFwcHJvdmVcIi5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgTWZhUmVxdWVzdCBhZnRlciBhbnN3ZXJpbmdcbiAgICovXG4gIGFzeW5jIGFuc3dlcihjcmVkOiBhbnksIHZvdGU6IE1mYVZvdGUgPSBcImFwcHJvdmVcIik6IFByb21pc2U8TWZhUmVxdWVzdD4ge1xuICAgIGNvbnN0IGFuc3dlciA9IGNyZWRlbnRpYWxUb0pTT04oY3JlZCk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlRmlkb0NvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHZvdGUsXG4gICAgICB0aGlzLmNoYWxsZW5nZUlkLFxuICAgICAgYW5zd2VyLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cbn1cbiJdfQ==