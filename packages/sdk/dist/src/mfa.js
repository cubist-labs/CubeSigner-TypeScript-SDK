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
    /** The id of the challenge */
    get id() {
        return __classPrivateFieldGet(this, _TotpChallenge_id, "f");
    }
    /** The new TOTP configuration */
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
     * @param cred Credential created by calling the `CredentialContainer`'s `create` method
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
     * @param vote Approve or reject the MFA request. Defaults to "approve".
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
     *                   based on the public key credential request options from this challenge.
     * @param vote Approve or reject. Defaults to "approve".
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsdURBQXVEOzs7Ozs7Ozs7Ozs7Ozs7QUFrRHZELDhDQVNDO0FBUUQsd0NBSUM7QUE1REQsaUNBQTREO0FBaUM1RDs7Ozs7R0FLRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLEdBQWdCO0lBQ2hELElBQUksR0FBRyxLQUFLLFNBQVM7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUNwQyxNQUFNLENBQUMsR0FBRyxHQUFzQixDQUFDO0lBQ2pDLE9BQU8sQ0FDTCxPQUFPLENBQUMsQ0FBQyxLQUFLLEtBQUssUUFBUTtRQUMzQixPQUFPLENBQUMsQ0FBQyxRQUFRLEtBQUssUUFBUTtRQUM5QixDQUFDLENBQUMsUUFBUSxZQUFZLEtBQUs7UUFDM0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQ2pDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixjQUFjLENBQUMsQ0FBVTtJQUN2QyxJQUFJLENBQUMsS0FBSyxTQUFTO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFDbEMsTUFBTSxDQUFDLEdBQUcsQ0FBaUIsQ0FBQztJQUM1QixPQUFPLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxRQUFRLElBQUksT0FBTyxDQUFDLENBQUMsWUFBWSxLQUFLLFFBQVEsQ0FBQztBQUN4RSxDQUFDO0FBUUQsdUNBQXVDO0FBQ3ZDLE1BQWEsVUFBVTtJQUtyQix5QkFBeUI7SUFDekIsSUFBSSxFQUFFO1FBQ0osT0FBTyx1QkFBQSxJQUFJLHNCQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILElBQUksTUFBTTtRQUNSLE9BQU8sdUJBQUEsSUFBSSx3QkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksU0FBb0IsRUFBRSxJQUE0QjtRQXZCckQsd0NBQXNC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SSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7Ozs7Ozs7OztPQVdHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFTLEVBQUUsT0FBZ0IsU0FBUztRQUMvQyxNQUFNLE1BQU0sR0FBd0I7WUFDbEMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ1gsUUFBUSxFQUFFO2dCQUNSLGNBQWMsRUFBRSxJQUFBLHdCQUFpQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDO2dCQUMvRCxpQkFBaUIsRUFBRSxJQUFBLHdCQUFpQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7Z0JBQ3JFLFNBQVMsRUFBRSxJQUFBLHdCQUFpQixFQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDO2FBQ3REO1NBQ0YsQ0FBQztRQUNGLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxtQ0FBVyxDQUFDLG1CQUFtQixDQUNwRCxJQUFJLENBQUMsS0FBSyxFQUNWLElBQUksRUFDSixJQUFJLENBQUMsV0FBVyxFQUNoQixNQUFNLENBQ1AsQ0FBQztRQUNGLE9BQU8sSUFBSSxVQUFVLENBQUMsdUJBQUEsSUFBSSxtQ0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDRjtBQXRFRCw0Q0FzRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55ICovXG5cbmltcG9ydCB0eXBlIHtcbiAgQXBpQWRkRmlkb0NoYWxsZW5nZSxcbiAgQXBpTWZhRmlkb0NoYWxsZW5nZSxcbiAgRW1haWxPdHBSZXNwb25zZSxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIE1mYVZvdGUsXG4gIFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gIFRvdHBJbmZvLFxufSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IGRlY29kZUJhc2U2NFVybCwgZW5jb2RlVG9CYXNlNjRVcmwgfSBmcm9tIFwiLi91dGlsXCI7XG5pbXBvcnQgdHlwZSB7IEFwaUNsaWVudCB9IGZyb20gXCIuL2NsaWVudC9hcGlfY2xpZW50XCI7XG5cbi8qKiBNRkEgcmVjZWlwdCAqL1xuZXhwb3J0IGludGVyZmFjZSBNZmFSZWNlaXB0IHtcbiAgLyoqIE1GQSByZXF1ZXN0IElEICovXG4gIG1mYUlkOiBzdHJpbmc7XG4gIC8qKiBDb3JyZXNwb25kaW5nIG9yZyBJRCAqL1xuICBtZmFPcmdJZDogc3RyaW5nO1xuICAvKiogTUZBIGNvbmZpcm1hdGlvbiBjb2RlICovXG4gIG1mYUNvbmY6IHN0cmluZztcbn1cblxuLyoqIE9uZSBvciBtb3JlIE1GQSByZWNlaXB0cyAqL1xuZXhwb3J0IHR5cGUgTWZhUmVjZWlwdHMgPSBNZmFSZWNlaXB0IHwgTWFueU1mYVJlY2VpcHRzO1xuXG4vKiogVGhlIE1GQSBpZCBhbmQgY29uZmlybWF0aW9uIGNvcnJlc3BvbmRpbmcgdG8gYSBzaW5nbGUgcmVjZWlwdCBpbiBhIHtAbGluayBNYW55TWZhUmVjZWlwdHN9ICovXG4vLyBOT1RFOiBtdXN0IGNvcnJlc3BvbmQgdG8gdGhlIFJ1c3QgZGVmaW5pdGlvblxuZXhwb3J0IGludGVyZmFjZSBNZmFJZEFuZENvbmYge1xuICAvKiogTUZBIGlkICovXG4gIGlkOiBzdHJpbmc7XG4gIC8qKiBNRkEgY29uZmlybWF0aW9uIGNvZGUgKi9cbiAgY29uZmlybWF0aW9uOiBzdHJpbmc7XG59XG5cbi8qKiBNYW55IE1GQSByZWNlaXB0cyAqL1xuZXhwb3J0IGludGVyZmFjZSBNYW55TWZhUmVjZWlwdHMge1xuICAvKiogQ29ycmVzcG9uZGluZyBvcmcgaWQgKi9cbiAgb3JnSWQ6IHN0cmluZztcbiAgLyoqIFJlY2VpcHQgY29uZmlybWF0aW9uIGNvZGVzICovXG4gIHJlY2VpcHRzOiBNZmFJZEFuZENvbmZbXTtcbn1cblxuLyoqXG4gKiBUeXBlIG5hcnJvd2luZyBmcm9tIHtAbGluayBNZmFSZWNlaXB0c30gdG8ge0BsaW5rIE1hbnlNZmFSZWNlaXB0c31cbiAqXG4gKiBAcGFyYW0gcmVjIFRoZSBpbnB1dFxuICogQHJldHVybnMgV2hldGhlciB7QGxpbmsgcmVjfSBpcyBvZiB0eXBlIHtAbGluayBNYW55TWZhUmVjZWlwdHN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc01hbnlNZmFSZWNlaXB0cyhyZWM6IE1mYVJlY2VpcHRzKTogcmVjIGlzIE1hbnlNZmFSZWNlaXB0cyB7XG4gIGlmIChyZWMgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB4ID0gcmVjIGFzIE1hbnlNZmFSZWNlaXB0cztcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgeC5vcmdJZCA9PT0gXCJzdHJpbmdcIiAmJlxuICAgIHR5cGVvZiB4LnJlY2VpcHRzID09PSBcIm9iamVjdFwiICYmXG4gICAgeC5yZWNlaXB0cyBpbnN0YW5jZW9mIEFycmF5ICYmXG4gICAgeC5yZWNlaXB0cy5ldmVyeShpc01mYUlkQW5kQ29uZilcbiAgKTtcbn1cblxuLyoqXG4gKiBUeXBlIG5hcnJvd2luZyBmcm9tIGB1bmtub3duYCB0byB7QGxpbmsgTWZhSWRBbmRDb25mfVxuICpcbiAqIEBwYXJhbSB4IFRoZSBpbnB1dFxuICogQHJldHVybnMgV2hldGhlciB7QGxpbmsgeH0gaXMgb2YgdHlwZSB7QGxpbmsgTWZhSWRBbmRDb25mfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNZmFJZEFuZENvbmYoeDogdW5rbm93bik6IHggaXMgTWZhSWRBbmRDb25mIHtcbiAgaWYgKHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCB5ID0geCBhcyBNZmFJZEFuZENvbmY7XG4gIHJldHVybiB0eXBlb2YgeS5pZCA9PT0gXCJzdHJpbmdcIiAmJiB0eXBlb2YgeS5jb25maXJtYXRpb24gPT09IFwic3RyaW5nXCI7XG59XG5cbi8qKiBNRkEgcmVxdWVzdCBpZCAqL1xuZXhwb3J0IHR5cGUgTWZhSWQgPSBzdHJpbmc7XG5cbi8qKiBPcmlnaW5hbCByZXF1ZXN0IHR5cGUgKi9cbmV4cG9ydCB0eXBlIE1mYU9yaWdpbmFsUmVxdWVzdCA9IE1mYVJlcXVlc3RJbmZvW1wicmVxdWVzdFwiXTtcblxuLyoqIFJlcHJlc2VudGF0aW9uIG9mIGFuIE1GQSByZXF1ZXN0ICovXG5leHBvcnQgY2xhc3MgTWZhUmVxdWVzdCB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI2lkOiBNZmFJZDtcbiAgI2RhdGE/OiBNZmFSZXF1ZXN0SW5mbztcblxuICAvKiogR2V0IE1GQSByZXF1ZXN0IGlkICovXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy4jaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIE1GQSByZXF1ZXN0LiBUaGUgY2FjaGVkIHByb3BlcnRpZXMgcmVmbGVjdCB0aGVcbiAgICogc3RhdGUgb2YgdGhlIGxhc3QgZmV0Y2ggb3IgdXBkYXRlLlxuICAgKi9cbiAgZ2V0IGNhY2hlZCgpOiBNZmFSZXF1ZXN0SW5mbyB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSUQgb3IgdGhlIGRhdGEgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogTWZhSWQgfCBNZmFSZXF1ZXN0SW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jaWQgPSBkYXRhLmlkO1xuICAgICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHdoZXRoZXIgdGhpcyBNRkEgcmVxdWVzdCBoYXMgYSByZWNlaXB0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBNRkEgcmVxdWVzdCBoYXMgYSByZWNlaXB0XG4gICAqL1xuICBhc3luYyBoYXNSZWNlaXB0KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHJlY2VpcHQgPSB0aGlzLiNkYXRhPy5yZWNlaXB0ID8/IChhd2FpdCB0aGlzLmZldGNoKCkpLnJlY2VpcHQ7XG4gICAgcmV0dXJuICEhcmVjZWlwdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIG9yaWdpbmFsIHJlcXVlc3QgdGhhdCB0aGUgTUZBIHJlcXVlc3QgaXMgZm9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgb3JpZ2luYWwgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgcmVxdWVzdCgpOiBQcm9taXNlPE1mYU9yaWdpbmFsUmVxdWVzdD4ge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLmNhY2hlZCA/PyAoYXdhaXQgdGhpcy5mZXRjaCgpKTtcbiAgICByZXR1cm4gZGF0YS5yZXF1ZXN0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgTUZBIHJlY2VpcHQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBNRkEgcmVjZWlwdChzKVxuICAgKi9cbiAgYXN5bmMgcmVjZWlwdCgpOiBQcm9taXNlPE1mYVJlY2VpcHQgfCB1bmRlZmluZWQ+IHtcbiAgICAvLyBDaGVjayBpZiByZWNlaXB0IGlzIGFscmVhZHkgYXZhaWxhYmxlLiBJZiBub3QsIGZldGNoIG5ld2VzdCBpbmZvcm1hdGlvbiBhYm91dCBNRkEgcmVxdWVzdFxuICAgIGNvbnN0IHJlY2VpcHQgPSB0aGlzLiNkYXRhPy5yZWNlaXB0ID8/IChhd2FpdCB0aGlzLmZldGNoKCkpLnJlY2VpcHQ7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgbWZhSWQ6IHRoaXMuI2lkLFxuICAgICAgbWZhT3JnSWQ6IHRoaXMuI2FwaUNsaWVudC5vcmdJZCxcbiAgICAgIG1mYUNvbmY6IHJlY2VpcHQuY29uZmlybWF0aW9uLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIGtleSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQubWZhR2V0KHRoaXMuI2lkKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJhcHByb3ZlXCIpO1xuICAgIHJldHVybiBuZXcgTWZhUmVxdWVzdCh0aGlzLiNhcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHJlamVjdCgpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVDcyh0aGlzLiNpZCwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyB0b3RwQXBwcm92ZShjb2RlOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3Q+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVUb3RwKHRoaXMuI2lkLCBjb2RlLCBcImFwcHJvdmVcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIHRvdHBSZWplY3QoY29kZTogc3RyaW5nKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlVG90cCh0aGlzLiNpZCwgY29kZSwgXCJyZWplY3RcIik7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYXBwcm92YWwvcmVqZWN0aW9uIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGJ5IGNhbGxpbmdcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHJldHVybnMgQSBjaGFsbGVuZ2UgdGhhdCBuZWVkcyB0byBiZSBhbnN3ZXJlZCB0byBjb21wbGV0ZSB0aGUgYXBwcm92YWwuXG4gICAqL1xuICBhc3luYyBmaWRvVm90ZSgpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYUZpZG9Jbml0KHRoaXMuI2lkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbC9yZWplY3Rpb24gb2YgYW4gZXhpc3RpbmcgTUZBIHJlcXVlc3QgdXNpbmcgZW1haWwgT1RQLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIE1mYUVtYWlsQ2hhbGxlbmdlfSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgYnkgY2FsbGluZyB7QGxpbmsgTWZhRW1haWxDaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVZvdGUgVGhlIHZvdGUsIGkuZS4sIFwiYXBwcm92ZVwiIG9yIFwicmVqZWN0XCIuXG4gICAqIEByZXR1cm5zIFRoZSBjaGFsbGVuZ2UgdG8gYW5zd2VyIGJ5IGVudGVyaW5nIHRoZSBPVFAgY29kZSByZWNlaXZlZCB2aWEgZW1haWwuXG4gICAqL1xuICBhc3luYyBlbWFpbFZvdGUobWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhRW1haWxDaGFsbGVuZ2U+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXQodGhpcy5pZCwgbWZhVm90ZSk7XG4gIH1cbn1cblxuLyoqIFRPVFAgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBiZWZvcmUgdXNlcidzIFRPVFAgaXMgdXBkYXRlZCAqL1xuZXhwb3J0IGNsYXNzIFRvdHBDaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5ICNpZDogc3RyaW5nO1xuICByZWFkb25seSAjdXJsPzogc3RyaW5nO1xuXG4gIC8qKiBUaGUgaWQgb2YgdGhlIGNoYWxsZW5nZSAqL1xuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2lkO1xuICB9XG5cbiAgLyoqIFRoZSBuZXcgVE9UUCBjb25maWd1cmF0aW9uICovXG4gIGdldCB1cmwoKSB7XG4gICAgcmV0dXJuIHRoaXMuI3VybDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gYXBpIFVzZWQgd2hlbiBhbnN3ZXJpbmcgdGhlIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIGRhdGEgVE9UUCBjaGFsbGVuZ2UgaW5mb3JtYXRpb24gb3IgSUQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgZGF0YTogVG90cEluZm8gfCBzdHJpbmcpIHtcbiAgICB0aGlzLiNhcGkgPSBhcGk7XG4gICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNpZCA9IGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2lkID0gZGF0YS50b3RwX2lkO1xuICAgICAgdGhpcy4jdXJsID0gZGF0YS50b3RwX3VybDtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBjaGFsbGVuZ2Ugd2l0aCB0aGUgY29kZSB0aGF0IGNvcnJlc3BvbmRzIHRvIGB0aGlzLnRvdHBVcmxgLlxuICAgKlxuICAgKiBAcGFyYW0gY29kZSA2LWRpZ2l0IGNvZGUgdGhhdCBjb3JyZXNwb25kcyB0byBgdGhpcy50b3RwVXJsYC5cbiAgICovXG4gIGFzeW5jIGFuc3dlcihjb2RlOiBzdHJpbmcpIHtcbiAgICBpZiAoIS9eXFxkezEsNn0kLy50ZXN0KGNvZGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgVE9UUCBjb2RlOiAke2NvZGV9OyBpdCBtdXN0IGJlIGEgNi1kaWdpdCBzdHJpbmdgKTtcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlclRvdHBSZXNldENvbXBsZXRlKHRoaXMuaWQsIGNvZGUpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJuZWQgYWZ0ZXIgY3JlYXRpbmcgYSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAqIFByb3ZpZGVzIHNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGFuc3dlcmluZyB0aGlzIGNoYWxsZW5nZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEFkZEZpZG9DaGFsbGVuZ2Uge1xuICByZWFkb25seSAjYXBpOiBBcGlDbGllbnQ7XG4gIHJlYWRvbmx5IGNoYWxsZW5nZUlkOiBzdHJpbmc7XG4gIHJlYWRvbmx5IG9wdGlvbnM6IGFueTtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3JcbiAgICpcbiAgICogQHBhcmFtIGFwaSBUaGUgQVBJIGNsaWVudCB1c2VkIHRvIHJlcXVlc3QgdG8gYWRkIGEgRklETyBkZXZpY2VcbiAgICogQHBhcmFtIGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpOiBBcGlDbGllbnQsIGNoYWxsZW5nZTogQXBpQWRkRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI2FwaSA9IGFwaTtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgdG8gdWludDhbXVxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLmNoYWxsZW5nZS5vcHRpb25zLFxuICAgICAgY2hhbGxlbmdlOiBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMuY2hhbGxlbmdlKSxcbiAgICB9O1xuXG4gICAgaWYgKGNoYWxsZW5nZS5vcHRpb25zLnVzZXIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy51c2VyLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLnVzZXIuaWQpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY3JlZGVudGlhbCBvZiB0aGlzLm9wdGlvbnMuZXhjbHVkZUNyZWRlbnRpYWxzID8/IFtdKSB7XG4gICAgICBjcmVkZW50aWFsLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNyZWRlbnRpYWwuaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBjcmVhdGUgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIoKSB7XG4gICAgY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICBhd2FpdCB0aGlzLmFuc3dlcihjcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGA7XG4gICAqIHRoZSBjcmVkZW50aWFsIHNob3VsZCBiZSBvYnRhaW5lZCBieSBjYWxsaW5nXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmNyZWF0ZSh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBjcmVhdGVgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55KSB7XG4gICAgY29uc3QgYW5zd2VyID0gPFB1YmxpY0tleUNyZWRlbnRpYWw+e1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICByZXNwb25zZToge1xuICAgICAgICBjbGllbnREYXRhSlNPTjogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5jbGllbnREYXRhSlNPTiksXG4gICAgICAgIGF0dGVzdGF0aW9uT2JqZWN0OiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmF0dGVzdGF0aW9uT2JqZWN0KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLiNhcGkudXNlckZpZG9SZWdpc3RlckNvbXBsZXRlKHRoaXMuY2hhbGxlbmdlSWQsIGFuc3dlcik7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBpbml0aWF0aW5nIGFuIE1GQSBhcHByb3ZhbC9yZWplY3Rpb24gdmlhIGVtYWlsIE9UUC5cbiAqL1xuZXhwb3J0IGNsYXNzIE1mYUVtYWlsQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICByZWFkb25seSAjb3RwUmVzcG9uc2U6IEVtYWlsT3RwUmVzcG9uc2U7XG4gIHJlYWRvbmx5IG1mYUlkOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IEN1YmVTaWduZXIgYXBpIGNsaWVudFxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICogQHBhcmFtIG90cFJlc3BvbnNlIFRoZSByZXNwb25zZSByZXR1cm5lZCBieSB7QGxpbmsgQXBpQ2xpZW50Lm1mYVZvdGVFbWFpbEluaXR9LlxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIG1mYUlkOiBzdHJpbmcsIG90cFJlc3BvbnNlOiBFbWFpbE90cFJlc3BvbnNlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI290cFJlc3BvbnNlID0gb3RwUmVzcG9uc2U7XG4gICAgdGhpcy5tZmFJZCA9IG1mYUlkO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgTUZBIHZvdGUgcmVxdWVzdCB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEBwYXJhbSBvdHBDb2RlIFRoZSBNRkEgYXBwcm92YWwgT1RQIGNvZGUgcmVjZWl2ZWQgdmlhIGVtYWlsLlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKG90cENvZGU6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50Lm1mYVZvdGVFbWFpbENvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHRoaXMuI290cFJlc3BvbnNlLnBhcnRpYWxfdG9rZW4sXG4gICAgICBvdHBDb2RlLFxuICAgICk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBpbml0aWF0aW5nIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgTWZhRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcmVhZG9ubHkgbWZhSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gYXBpIFRoZSBBUEkgY2xpZW50IHVzZWQgdG8gaW5pdGlhdGUgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE9cbiAgICogQHBhcmFtIG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBpZC5cbiAgICogQHBhcmFtIGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGk6IEFwaUNsaWVudCwgbWZhSWQ6IHN0cmluZywgY2hhbGxlbmdlOiBBcGlNZmFGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpO1xuICAgIHRoaXMubWZhSWQgPSBtZmFJZDtcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgaW50byB1aW50OFtdXG4gICAgdGhpcy5vcHRpb25zID0ge1xuICAgICAgLi4uY2hhbGxlbmdlLm9wdGlvbnMsXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmFsbG93Q3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgICBpZiAoY3JlZGVudGlhbC50cmFuc3BvcnRzID09PSBudWxsKSB7XG4gICAgICAgIGRlbGV0ZSBjcmVkZW50aWFsLnRyYW5zcG9ydHM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGdldCBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEBwYXJhbSB2b3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdC4gRGVmYXVsdHMgdG8gXCJhcHByb3ZlXCIuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKHZvdGU/OiBNZmFWb3RlKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5nZXQoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCwgdm90ZSk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgLlxuICAgKiBUbyBvYnRhaW4gdGhpcyBjcmVkZW50aWFsLCBmb3IgZXhhbXBsZSwgY2FsbFxuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5nZXQoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgZ2V0YCBtZXRob2RcbiAgICogICAgICAgICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICogQHBhcmFtIHZvdGUgQXBwcm92ZSBvciByZWplY3QuIERlZmF1bHRzIHRvIFwiYXBwcm92ZVwiLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSwgdm90ZTogTWZhVm90ZSA9IFwiYXBwcm92ZVwiKTogUHJvbWlzZTxNZmFSZXF1ZXN0PiB7XG4gICAgY29uc3QgYW5zd2VyID0gPFB1YmxpY0tleUNyZWRlbnRpYWw+e1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICByZXNwb25zZToge1xuICAgICAgICBjbGllbnREYXRhSlNPTjogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5jbGllbnREYXRhSlNPTiksXG4gICAgICAgIGF1dGhlbnRpY2F0b3JEYXRhOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmF1dGhlbnRpY2F0b3JEYXRhKSxcbiAgICAgICAgc2lnbmF0dXJlOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLnNpZ25hdHVyZSksXG4gICAgICB9LFxuICAgIH07XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5tZmFWb3RlRmlkb0NvbXBsZXRlKFxuICAgICAgdGhpcy5tZmFJZCxcbiAgICAgIHZvdGUsXG4gICAgICB0aGlzLmNoYWxsZW5nZUlkLFxuICAgICAgYW5zd2VyLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBNZmFSZXF1ZXN0KHRoaXMuI2FwaUNsaWVudCwgZGF0YSk7XG4gIH1cbn1cbiJdfQ==