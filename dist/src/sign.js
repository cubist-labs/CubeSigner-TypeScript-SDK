"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _SignResponse_cs, _SignResponse_orgId, _SignResponse_roleId, _SignResponse_signFn, _SignResponse_resp, _Sign_orgId, _Sign_ss;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sign = exports.SignResponse = void 0;
const assert_1 = __importDefault(require("assert"));
const _1 = require(".");
const env_1 = require("./env");
/**
 * A response of a signing request.
 */
class SignResponse {
    /** @return {boolean} True if this signing request requires an MFA approval */
    requiresMfa() {
        return __classPrivateFieldGet(this, _SignResponse_resp, "f").accepted?.MfaRequired !== undefined;
    }
    /** @return {U} The signed data */
    data() {
        return __classPrivateFieldGet(this, _SignResponse_resp, "f");
    }
    /**
     * Approves the MFA request.
     *
     * Note: This only works for MFA requests that require a single approval.
     *
     * @return {SignResponse<U>} The result of signing with the approval
     */
    async approve() {
        const mfaRequired = __classPrivateFieldGet(this, _SignResponse_resp, "f").accepted?.MfaRequired;
        if (!mfaRequired) {
            throw new Error("Request does not require MFA approval");
        }
        const mfaId = mfaRequired.id;
        const mfaApproval = await _1.Role.mfaApprove(__classPrivateFieldGet(this, _SignResponse_cs, "f"), __classPrivateFieldGet(this, _SignResponse_orgId, "f"), __classPrivateFieldGet(this, _SignResponse_roleId, "f"), mfaId);
        (0, assert_1.default)(mfaApproval.id === mfaId);
        (0, assert_1.default)(mfaApproval.receipt);
        const mfaConf = mfaApproval.receipt?.confirmation;
        if (!mfaConf) {
            throw new Error("MfaRequest has not been approved yet");
        }
        const headers = {
            "x-cubist-mfa-id": mfaId,
            "x-cubist-mfa-confirmation": mfaConf,
        };
        return new SignResponse(__classPrivateFieldGet(this, _SignResponse_cs, "f"), __classPrivateFieldGet(this, _SignResponse_orgId, "f"), __classPrivateFieldGet(this, _SignResponse_roleId, "f"), __classPrivateFieldGet(this, _SignResponse_signFn, "f"), await __classPrivateFieldGet(this, _SignResponse_signFn, "f").call(this, headers));
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param {CubeSigner} cs The CubeSigner instance to use for requests
     * @param {string} orgId The org id of the corresponding signing request
     * @param {string} roleId The role id of the corresponding signing request
     * @param {SignFn} signFn The signing function that this response is from.
     *                        This argument is used to resend requests with
     *                        different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
     *                                    client.
     */
    constructor(cs, orgId, roleId, signFn, resp) {
        _SignResponse_cs.set(this, void 0);
        _SignResponse_orgId.set(this, void 0);
        _SignResponse_roleId.set(this, void 0);
        _SignResponse_signFn.set(this, void 0);
        _SignResponse_resp.set(this, void 0);
        __classPrivateFieldSet(this, _SignResponse_cs, cs, "f");
        __classPrivateFieldSet(this, _SignResponse_orgId, orgId, "f");
        __classPrivateFieldSet(this, _SignResponse_roleId, roleId, "f");
        __classPrivateFieldSet(this, _SignResponse_signFn, signFn, "f");
        __classPrivateFieldSet(this, _SignResponse_resp, resp, "f");
    }
}
exports.SignResponse = SignResponse;
_SignResponse_cs = new WeakMap(), _SignResponse_orgId = new WeakMap(), _SignResponse_roleId = new WeakMap(), _SignResponse_signFn = new WeakMap(), _SignResponse_resp = new WeakMap();
/**
 * Wrapper around sign operations.
 */
class Sign {
    /**
     * Submit an 'eth1' sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth1SignRequest} req What to sign.
     * @return {Promise<Eth1SignResponse | AcceptedResponse>} Signature
     */
    async eth1(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await __classPrivateFieldGet(this, _Sign_ss, "f").client()).post("/v1/org/{org_id}/eth1/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _Sign_orgId, "f"), pubkey } },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, env_1.assertOk)(resp);
        };
        return new SignResponse(__classPrivateFieldGet(this, _Sign_ss, "f").cs, __classPrivateFieldGet(this, _Sign_orgId, "f"), __classPrivateFieldGet(this, _Sign_ss, "f").roleId, sign, await sign());
    }
    /**
     * Submit an 'eth2' sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    async eth2(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await __classPrivateFieldGet(this, _Sign_ss, "f").client()).post("/v1/org/{org_id}/eth2/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _Sign_orgId, "f"), pubkey } },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, env_1.assertOk)(resp);
        };
        return new SignResponse(__classPrivateFieldGet(this, _Sign_ss, "f").cs, __classPrivateFieldGet(this, _Sign_orgId, "f"), __classPrivateFieldGet(this, _Sign_ss, "f").roleId, sign, await sign());
    }
    /**
     * Sign a stake request.
     * @param {Eth2StakeRequest} req The request to sign.
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
     */
    async stake(req) {
        const sign = async (headers) => {
            const resp = await (await __classPrivateFieldGet(this, _Sign_ss, "f").client()).post("/v1/org/{org_id}/eth2/stake", {
                params: { path: { org_id: __classPrivateFieldGet(this, _Sign_orgId, "f") } },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, env_1.assertOk)(resp);
        };
        return new SignResponse(__classPrivateFieldGet(this, _Sign_ss, "f").cs, __classPrivateFieldGet(this, _Sign_orgId, "f"), __classPrivateFieldGet(this, _Sign_ss, "f").roleId, sign, await sign());
    }
    /**
     * Sign an unstake request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    async unstake(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await __classPrivateFieldGet(this, _Sign_ss, "f").client()).post("/v1/org/{org_id}/eth2/unstake/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _Sign_orgId, "f"), pubkey } },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, env_1.assertOk)(resp);
        };
        return new SignResponse(__classPrivateFieldGet(this, _Sign_ss, "f").cs, __classPrivateFieldGet(this, _Sign_orgId, "f"), __classPrivateFieldGet(this, _Sign_ss, "f").roleId, sign, await sign());
    }
    /**
     * Sign a raw blob.
     * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
     * @param {BlobSignRequest} req What to sign
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
     */
    async blob(key, req) {
        const key_id = typeof key === "string" ? key : key.id;
        const sign = async (headers) => {
            const resp = await (await __classPrivateFieldGet(this, _Sign_ss, "f").client()).post("/v1/org/{org_id}/blob/sign/{key_id}", {
                params: {
                    path: { org_id: __classPrivateFieldGet(this, _Sign_orgId, "f"), key_id },
                },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, env_1.assertOk)(resp);
        };
        return new SignResponse(__classPrivateFieldGet(this, _Sign_ss, "f").cs, __classPrivateFieldGet(this, _Sign_orgId, "f"), __classPrivateFieldGet(this, _Sign_ss, "f").roleId, sign, await sign());
    }
    /**
     * Sign a bitcoin message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    async btc(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await __classPrivateFieldGet(this, _Sign_ss, "f").client()).post("/v0/org/{org_id}/btc/sign/{pubkey}", {
                params: {
                    path: { org_id: __classPrivateFieldGet(this, _Sign_orgId, "f"), pubkey },
                },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, env_1.assertOk)(resp);
        };
        return new SignResponse(__classPrivateFieldGet(this, _Sign_ss, "f").cs, __classPrivateFieldGet(this, _Sign_orgId, "f"), __classPrivateFieldGet(this, _Sign_ss, "f").roleId, sign, await sign());
    }
    /**
     * Sign a solana message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    async solana(key, req) {
        const pubkey = typeof key === "string" ? key : key.materialId;
        const sign = async (headers) => {
            const resp = await (await __classPrivateFieldGet(this, _Sign_ss, "f").client()).post("/v1/org/{org_id}/solana/sign/{pubkey}", {
                params: { path: { org_id: __classPrivateFieldGet(this, _Sign_orgId, "f"), pubkey } },
                body: req,
                headers: headers,
                parseAs: "json",
            });
            return (0, env_1.assertOk)(resp);
        };
        return new SignResponse(__classPrivateFieldGet(this, _Sign_ss, "f").cs, __classPrivateFieldGet(this, _Sign_orgId, "f"), __classPrivateFieldGet(this, _Sign_ss, "f").roleId, sign, await sign());
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /* eslint-disable require-jsdoc */
    /**
     * Constructor.
     *
     * @param {string} orgId Organization ID
     * @param {SignerSession} ss The signer session to use for signing requests
     */
    constructor(orgId, ss) {
        _Sign_orgId.set(this, void 0);
        _Sign_ss.set(this, void 0);
        __classPrivateFieldSet(this, _Sign_orgId, orgId, "f");
        __classPrivateFieldSet(this, _Sign_ss, ss, "f");
    }
}
exports.Sign = Sign;
_Sign_orgId = new WeakMap(), _Sign_ss = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zaWduLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG9EQUE0QjtBQUM1Qix3QkFBeUQ7QUFFekQsK0JBQWlDO0FBMENqQzs7R0FFRztBQUNILE1BQWEsWUFBWTtJQU92Qiw4RUFBOEU7SUFDOUUsV0FBVztRQUNULE9BQVEsdUJBQUEsSUFBSSwwQkFBMkIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxLQUFLLFNBQVMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsa0NBQWtDO0lBQ2xDLElBQUk7UUFDRixPQUFPLHVCQUFBLElBQUksMEJBQVcsQ0FBQztJQUN6QixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCxNQUFNLFdBQVcsR0FBSSx1QkFBQSxJQUFJLDBCQUEyQixDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUM7UUFDM0UsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7U0FDMUQ7UUFFRCxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsRUFBRSxDQUFDO1FBQzdCLE1BQU0sV0FBVyxHQUFHLE1BQU0sT0FBSSxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLHdCQUFJLEVBQUUsdUJBQUEsSUFBSSwyQkFBTyxFQUFFLHVCQUFBLElBQUksNEJBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0RixJQUFBLGdCQUFNLEVBQUMsV0FBVyxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsQ0FBQztRQUNqQyxJQUFBLGdCQUFNLEVBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTVCLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDO1FBQ2xELElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDWixNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFz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Ozs7OztPQUtHO0lBQ0gsWUFBWSxLQUFhLEVBQUUsRUFBaUI7UUFqTG5DLDhCQUFlO1FBQ2YsMkJBQW1CO1FBaUwxQix1QkFBQSxJQUFJLGVBQVUsS0FBSyxNQUFBLENBQUM7UUFDcEIsdUJBQUEsSUFBSSxZQUFPLEVBQUUsTUFBQSxDQUFDO0lBQ2hCLENBQUM7Q0FDRjtBQXRMRCxvQkFzTEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCB7IEN1YmVTaWduZXIsIEtleSwgUm9sZSwgU2lnbmVyU2Vzc2lvbiB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBjb21wb25lbnRzLCBwYXRocyB9IGZyb20gXCIuL2NsaWVudFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2sgfSBmcm9tIFwiLi9lbnZcIjtcblxuLyogZXNsaW50LWRpc2FibGUgKi9cbmV4cG9ydCB0eXBlIEV0aDFTaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTaWduUmVxdWVzdCA9XG4gIHBhdGhzW1wiL3YxL29yZy97b3JnX2lkfS9ldGgyL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIEV0aDJTdGFrZVJlcXVlc3QgPVxuICBwYXRoc1tcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlVuc3Rha2VSZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQmxvYlNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiXVtcInBvc3RcIl1bXCJyZXF1ZXN0Qm9keVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQnRjU2lnblJlcXVlc3QgPVxuICBwYXRoc1tcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIl1bXCJwb3N0XCJdW1wicmVxdWVzdEJvZHlcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcbmV4cG9ydCB0eXBlIFNvbGFuYVNpZ25SZXF1ZXN0ID1cbiAgcGF0aHNbXCIvdjEvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCJdW1wicG9zdFwiXVtcInJlcXVlc3RCb2R5XCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIEV0aDFTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiRXRoMVNpZ25SZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgRXRoMlNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJFdGgyU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyU3Rha2VSZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJTdGFrZVJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBFdGgyVW5zdGFrZVJlc3BvbnNlID1cbiAgY29tcG9uZW50c1tcInJlc3BvbnNlc1wiXVtcIlVuc3Rha2VSZXNwb25zZVwiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuZXhwb3J0IHR5cGUgQmxvYlNpZ25SZXNwb25zZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJCbG9iU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBCdGNTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiQnRjU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBTb2xhbmFTaWduUmVzcG9uc2UgPVxuICBjb21wb25lbnRzW1wicmVzcG9uc2VzXCJdW1wiU29sYW5hU2lnblJlc3BvbnNlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5leHBvcnQgdHlwZSBNZmFSZXF1ZXN0SW5mbyA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJNZmFSZXF1ZXN0SW5mb1wiXVtcImNvbnRlbnRcIl1bXCJhcHBsaWNhdGlvbi9qc29uXCJdO1xuXG5leHBvcnQgdHlwZSBBY2NlcHRlZFJlc3BvbnNlID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJBY2NlcHRlZFJlc3BvbnNlXCJdO1xuZXhwb3J0IHR5cGUgRXJyb3JSZXNwb25zZSA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiRXJyb3JSZXNwb25zZVwiXTtcbmV4cG9ydCB0eXBlIEJ0Y1NpZ25hdHVyZUtpbmQgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIkJ0Y1NpZ25hdHVyZUtpbmRcIl07XG4vKiBlc2xpbnQtZW5hYmxlICovXG5cbnR5cGUgU2lnbkZuPFU+ID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4gUHJvbWlzZTxVIHwgQWNjZXB0ZWRSZXNwb25zZT47XG5cbi8qKlxuICogQSByZXNwb25zZSBvZiBhIHNpZ25pbmcgcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25SZXNwb25zZTxVPiB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgI29yZ0lkOiBzdHJpbmc7XG4gIHJlYWRvbmx5ICNyb2xlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgI3NpZ25GbjogU2lnbkZuPFU+O1xuICByZWFkb25seSAjcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2U7XG5cbiAgLyoqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhpcyBzaWduaW5nIHJlcXVlc3QgcmVxdWlyZXMgYW4gTUZBIGFwcHJvdmFsICovXG4gIHJlcXVpcmVzTWZhKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAodGhpcy4jcmVzcCBhcyBBY2NlcHRlZFJlc3BvbnNlKS5hY2NlcHRlZD8uTWZhUmVxdWlyZWQgIT09IHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtVfSBUaGUgc2lnbmVkIGRhdGEgKi9cbiAgZGF0YSgpOiBVIHtcbiAgICByZXR1cm4gdGhpcy4jcmVzcCBhcyBVO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmVzIHRoZSBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogTm90ZTogVGhpcyBvbmx5IHdvcmtzIGZvciBNRkEgcmVxdWVzdHMgdGhhdCByZXF1aXJlIGEgc2luZ2xlIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcmV0dXJuIHtTaWduUmVzcG9uc2U8VT59IFRoZSByZXN1bHQgb2Ygc2lnbmluZyB3aXRoIHRoZSBhcHByb3ZhbFxuICAgKi9cbiAgYXN5bmMgYXBwcm92ZSgpOiBQcm9taXNlPFNpZ25SZXNwb25zZTxVPj4ge1xuICAgIGNvbnN0IG1mYVJlcXVpcmVkID0gKHRoaXMuI3Jlc3AgYXMgQWNjZXB0ZWRSZXNwb25zZSkuYWNjZXB0ZWQ/Lk1mYVJlcXVpcmVkO1xuICAgIGlmICghbWZhUmVxdWlyZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgZG9lcyBub3QgcmVxdWlyZSBNRkEgYXBwcm92YWxcIik7XG4gICAgfVxuXG4gICAgY29uc3QgbWZhSWQgPSBtZmFSZXF1aXJlZC5pZDtcbiAgICBjb25zdCBtZmFBcHByb3ZhbCA9IGF3YWl0IFJvbGUubWZhQXBwcm92ZSh0aGlzLiNjcywgdGhpcy4jb3JnSWQsIHRoaXMuI3JvbGVJZCwgbWZhSWQpO1xuICAgIGFzc2VydChtZmFBcHByb3ZhbC5pZCA9PT0gbWZhSWQpO1xuICAgIGFzc2VydChtZmFBcHByb3ZhbC5yZWNlaXB0KTtcblxuICAgIGNvbnN0IG1mYUNvbmYgPSBtZmFBcHByb3ZhbC5yZWNlaXB0Py5jb25maXJtYXRpb247XG4gICAgaWYgKCFtZmFDb25mKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZmFSZXF1ZXN0IGhhcyBub3QgYmVlbiBhcHByb3ZlZCB5ZXRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgIFwieC1jdWJpc3QtbWZhLWlkXCI6IG1mYUlkLFxuICAgICAgXCJ4LWN1YmlzdC1tZmEtY29uZmlybWF0aW9uXCI6IG1mYUNvbmYsXG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZShcbiAgICAgIHRoaXMuI2NzLFxuICAgICAgdGhpcy4jb3JnSWQsXG4gICAgICB0aGlzLiNyb2xlSWQsXG4gICAgICB0aGlzLiNzaWduRm4sXG4gICAgICBhd2FpdCB0aGlzLiNzaWduRm4oaGVhZGVycyksXG4gICAgKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRvIHVzZSBmb3IgcmVxdWVzdHNcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9yZ0lkIFRoZSBvcmcgaWQgb2YgdGhlIGNvcnJlc3BvbmRpbmcgc2lnbmluZyByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSByb2xlSWQgVGhlIHJvbGUgaWQgb2YgdGhlIGNvcnJlc3BvbmRpbmcgc2lnbmluZyByZXF1ZXN0XG4gICAqIEBwYXJhbSB7U2lnbkZufSBzaWduRm4gVGhlIHNpZ25pbmcgZnVuY3Rpb24gdGhhdCB0aGlzIHJlc3BvbnNlIGlzIGZyb20uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgVGhpcyBhcmd1bWVudCBpcyB1c2VkIHRvIHJlc2VuZCByZXF1ZXN0cyB3aXRoXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgZGlmZmVyZW50IGhlYWRlcnMgaWYgbmVlZGVkLlxuICAgKiBAcGFyYW0ge1UgfCBBY2NlcHRlZFJlc3BvbnNlfSByZXNwIFRoZSByZXNwb25zZSBhcyByZXR1cm5lZCBieSB0aGUgT3BlbkFQSVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsaWVudC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNzOiBDdWJlU2lnbmVyLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAgc2lnbkZuOiBTaWduRm48VT4sXG4gICAgcmVzcDogVSB8IEFjY2VwdGVkUmVzcG9uc2UsXG4gICkge1xuICAgIHRoaXMuI2NzID0gY3M7XG4gICAgdGhpcy4jb3JnSWQgPSBvcmdJZDtcbiAgICB0aGlzLiNyb2xlSWQgPSByb2xlSWQ7XG4gICAgdGhpcy4jc2lnbkZuID0gc2lnbkZuO1xuICAgIHRoaXMuI3Jlc3AgPSByZXNwO1xuICB9XG59XG5cbi8qKlxuICogV3JhcHBlciBhcm91bmQgc2lnbiBvcGVyYXRpb25zLlxuICovXG5leHBvcnQgY2xhc3MgU2lnbiB7XG4gIHJlYWRvbmx5ICNvcmdJZDogc3RyaW5nO1xuICByZWFkb25seSAjc3M6IFNpZ25lclNlc3Npb247XG5cbiAgLyoqXG4gICAqIFN1Ym1pdCBhbiAnZXRoMScgc2lnbiByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgxU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMVNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGV0aDEoa2V5OiBLZXkgfCBzdHJpbmcsIHJlcTogRXRoMVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXRoMVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuI3NzLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI3NzLmNzLCB0aGlzLiNvcmdJZCwgdGhpcy4jc3Mucm9sZUlkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1Ym1pdCBhbiAnZXRoMicgc2lnbiByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RXRoMlNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBTaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGV0aDIoa2V5OiBLZXkgfCBzdHJpbmcsIHJlcTogRXRoMlNpZ25SZXF1ZXN0KTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuI3NzLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI3NzLmNzLCB0aGlzLiNvcmdJZCwgdGhpcy4jc3Mucm9sZUlkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzdGFrZSByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0V0aDJTdGFrZVJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJTdGFrZVJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHN0YWtlKHJlcTogRXRoMlN0YWtlUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEV0aDJTdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLiNzcy5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3N0YWtlXCIsIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiB0aGlzLiNvcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI3NzLmNzLCB0aGlzLiNvcmdJZCwgdGhpcy4jc3Mucm9sZUlkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gdW5zdGFrZSByZXF1ZXN0LlxuICAgKiBAcGFyYW0ge0tleSB8IHN0cmluZ30ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHtFdGgyVW5zdGFrZVJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPEV0aDJVbnN0YWtlUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdW5zdGFrZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxTaWduUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCAoXG4gICAgICAgIGF3YWl0IHRoaXMuI3NzLmNsaWVudCgpXG4gICAgICApLnBvc3QoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI3NzLmNzLCB0aGlzLiNvcmdJZCwgdGhpcy4jc3Mucm9sZUlkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSByYXcgYmxvYi5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBJRCkuXG4gICAqIEBwYXJhbSB7QmxvYlNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEByZXR1cm4ge1Byb21pc2U8QmxvYlNpZ25SZXNwb25zZSB8IEFjY2VwdGVkUmVzcG9uc2U+fSBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBibG9iKGtleTogS2V5IHwgc3RyaW5nLCByZXE6IEJsb2JTaWduUmVxdWVzdCk6IFByb21pc2U8U2lnblJlc3BvbnNlPEJsb2JTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5X2lkID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5pZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy4jc3MuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MS9vcmcve29yZ19pZH0vYmxvYi9zaWduL3trZXlfaWR9XCIsIHtcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgcGF0aDogeyBvcmdfaWQ6IHRoaXMuI29yZ0lkLCBrZXlfaWQgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgICBwYXJzZUFzOiBcImpzb25cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGFzc2VydE9rKHJlc3ApO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTaWduUmVzcG9uc2UodGhpcy4jc3MuY3MsIHRoaXMuI29yZ0lkLCB0aGlzLiNzcy5yb2xlSWQsIHNpZ24sIGF3YWl0IHNpZ24oKSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIGJpdGNvaW4gbWVzc2FnZS5cbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSB7QnRjU2lnblJlcXVlc3R9IHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHJldHVybiB7UHJvbWlzZTxCdGNTaWduUmVzcG9uc2UgfCBBY2NlcHRlZFJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgYnRjKGtleTogS2V5IHwgc3RyaW5nLCByZXE6IEJ0Y1NpZ25SZXF1ZXN0KTogUHJvbWlzZTxTaWduUmVzcG9uc2U8QnRjU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IChcbiAgICAgICAgYXdhaXQgdGhpcy4jc3MuY2xpZW50KClcbiAgICAgICkucG9zdChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwge1xuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9LFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICAgIHBhcnNlQXM6IFwianNvblwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gYXNzZXJ0T2socmVzcCk7XG4gICAgfTtcbiAgICByZXR1cm4gbmV3IFNpZ25SZXNwb25zZSh0aGlzLiNzcy5jcywgdGhpcy4jb3JnSWQsIHRoaXMuI3NzLnJvbGVJZCwgc2lnbiwgYXdhaXQgc2lnbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc29sYW5hIG1lc3NhZ2UuXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0ge1NvbGFuYVNpZ25SZXF1ZXN0fSByZXEgV2hhdCB0byBzaWduXG4gICAqIEByZXR1cm4ge1Byb21pc2U8U29sYW5hU2lnblJlc3BvbnNlIHwgQWNjZXB0ZWRSZXNwb25zZT59IFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNvbGFuYShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFNvbGFuYVNpZ25SZXF1ZXN0LFxuICApOiBQcm9taXNlPFNpZ25SZXNwb25zZTxTb2xhbmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgKFxuICAgICAgICBhd2FpdCB0aGlzLiNzcy5jbGllbnQoKVxuICAgICAgKS5wb3N0KFwiL3YxL29yZy97b3JnX2lkfS9zb2xhbmEvc2lnbi97cHVia2V5fVwiLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogdGhpcy4jb3JnSWQsIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgICAgcGFyc2VBczogXCJqc29uXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBhc3NlcnRPayhyZXNwKTtcbiAgICB9O1xuICAgIHJldHVybiBuZXcgU2lnblJlc3BvbnNlKHRoaXMuI3NzLmNzLCB0aGlzLiNvcmdJZCwgdGhpcy4jc3Mucm9sZUlkLCBzaWduLCBhd2FpdCBzaWduKCkpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKiBlc2xpbnQtZGlzYWJsZSByZXF1aXJlLWpzZG9jICovXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3JnSWQgT3JnYW5pemF0aW9uIElEXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc3MgVGhlIHNpZ25lciBzZXNzaW9uIHRvIHVzZSBmb3Igc2lnbmluZyByZXF1ZXN0c1xuICAgKi9cbiAgY29uc3RydWN0b3Iob3JnSWQ6IHN0cmluZywgc3M6IFNpZ25lclNlc3Npb24pIHtcbiAgICB0aGlzLiNvcmdJZCA9IG9yZ0lkO1xuICAgIHRoaXMuI3NzID0gc3M7XG4gIH1cbn1cbiJdfQ==