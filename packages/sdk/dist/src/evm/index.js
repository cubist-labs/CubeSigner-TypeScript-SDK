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
var _EvmSigner_address, _EvmSigner_key, _EvmSigner_client, _EvmSigner_options;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmSigner = void 0;
const index_1 = require("../index");
/**
 * Signer using CubeSigner, with basic MFA handling.
 *
 * @internal
 */
class EvmSigner {
    /** @returns The key address (NOT checksummed) */
    get address() {
        return __classPrivateFieldGet(this, _EvmSigner_address, "f");
    }
    /** @returns The underlying client */
    get client() {
        return __classPrivateFieldGet(this, _EvmSigner_client, "f");
    }
    /** @returns The options used for this EvmSigner */
    get options() {
        return __classPrivateFieldGet(this, _EvmSigner_options, "f");
    }
    /**
     * Create new Signer instance
     *
     * @param address The key or the eth address of the account to use.
     * @param client The underlying CubeSignerClient.
     * @param options The options to use for the Signer instance
     */
    constructor(address, client, options) {
        /** The address of the account */
        _EvmSigner_address.set(this, void 0);
        /** The key to use for signing */
        _EvmSigner_key.set(this, void 0);
        /** The underlying session */
        _EvmSigner_client.set(this, void 0);
        /** Options */
        _EvmSigner_options.set(this, void 0);
        if (typeof address === "string") {
            __classPrivateFieldSet(this, _EvmSigner_address, address, "f");
        }
        else {
            __classPrivateFieldSet(this, _EvmSigner_address, address.materialId, "f");
            __classPrivateFieldSet(this, _EvmSigner_key, address, "f");
        }
        __classPrivateFieldSet(this, _EvmSigner_client, client, "f");
        __classPrivateFieldSet(this, _EvmSigner_options, {
            onMfaPoll: options?.onMfaPoll,
            mfaPollIntervalMs: options?.mfaPollIntervalMs ?? 1000,
        }, "f");
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     *
     * @param req The sign request.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(req) {
        const res = await this.signEvm(req);
        const data = await this.handleMfa(res);
        return data.rlp_signed_tx;
    }
    /**
     * Sign a transaction. This method does not block if the key requires MFA approval, i.e.,
     * the returned {@link CubeSignerResponse} object either contains a signature or indicates
     * that MFA is required.
     *
     * @param req The transaction to sign.
     * @returns The response from the CubeSigner remote end.
     */
    async signEvm(req) {
        const key = await this.key();
        return await key.signEvm(req);
    }
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     *
     * @param req The EIP712 sign request.
     * @returns The signature.
     */
    async signEip712(req) {
        const key = await this.key();
        const res = await key.signEip712(req);
        const data = await this.handleMfa(res);
        return data.signature;
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param req The request to sign.
     * @returns The signature.
     */
    async signEip191(req) {
        const key = await this.key();
        const res = await key.signEip191(req);
        const data = await this.handleMfa(res);
        return data.signature;
    }
    /** @returns The key corresponding to this address */
    async key() {
        if (__classPrivateFieldGet(this, _EvmSigner_key, "f") === undefined) {
            const key = await __classPrivateFieldGet(this, _EvmSigner_client, "f").apiClient.keyGetByMaterialId(index_1.Secp256k1.Evm, __classPrivateFieldGet(this, _EvmSigner_address, "f").toLowerCase());
            __classPrivateFieldSet(this, _EvmSigner_key, new index_1.Key(__classPrivateFieldGet(this, _EvmSigner_client, "f"), key), "f");
        }
        return __classPrivateFieldGet(this, _EvmSigner_key, "f");
    }
    /**
     * Sign a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will execute.
     *
     * @param mfaRequest The approved MFA request.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransactionMfaApproved(mfaRequest) {
        const request = await mfaRequest.request();
        if (!request.path.includes("/eth1/sign/")) {
            throw new Error(`Expected EVM transaction signing request, got ${request.path}`);
        }
        if (!request.path.includes(__classPrivateFieldGet(this, _EvmSigner_address, "f"))) {
            throw new Error(`Expected signing request for ${__classPrivateFieldGet(this, _EvmSigner_address, "f")} but got ${request.path}`);
        }
        const receipt = await mfaRequest.receipt();
        if (!receipt) {
            throw new Error("MFA request is not approved yet");
        }
        const key = await this.key();
        const resp = await key.signEvm(request.body, receipt);
        return resp.data().rlp_signed_tx;
    }
    /**
     * If the sign request requires MFA, this method waits for approvals
     *
     * @param res The response of a sign request
     * @returns The sign data after MFA approvals
     */
    async handleMfa(res) {
        let mfaId = undefined;
        while ((mfaId = res.mfaId())) {
            await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _EvmSigner_options, "f").mfaPollIntervalMs));
            const mfaInfo = await __classPrivateFieldGet(this, _EvmSigner_client, "f").org().getMfaRequest(mfaId).fetch();
            __classPrivateFieldGet(this, _EvmSigner_options, "f").onMfaPoll?.(mfaInfo);
            if (mfaInfo.receipt) {
                res = await res.execWithMfaApproval({
                    mfaId,
                    mfaOrgId: __classPrivateFieldGet(this, _EvmSigner_client, "f").orgId,
                    mfaConf: mfaInfo.receipt.confirmation,
                });
            }
        }
        return res.data();
    }
}
exports.EvmSigner = EvmSigner;
_EvmSigner_address = new WeakMap(), _EvmSigner_key = new WeakMap(), _EvmSigner_client = new WeakMap(), _EvmSigner_options = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG9DQVdrQjtBQWdCbEI7Ozs7R0FJRztBQUNILE1BQWEsU0FBUztJQWFwQixpREFBaUQ7SUFDakQsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLDBCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVELHFDQUFxQztJQUNyQyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUkseUJBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsbURBQW1EO0lBQ25ELElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxZQUFZLE9BQXFCLEVBQUUsTUFBd0IsRUFBRSxPQUEwQjtRQWxDdkYsaUNBQWlDO1FBQ3hCLHFDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsaUNBQVc7UUFFWCw2QkFBNkI7UUFDcEIsb0NBQTBCO1FBRW5DLGNBQWM7UUFDTCxxQ0FBMkI7UUF5QmxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxzQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksc0JBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksa0JBQVEsT0FBTyxNQUFBLENBQUM7UUFDdEIsQ0FBQztRQUNELHVCQUFBLElBQUkscUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxzQkFBOEI7WUFDaEMsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTO1lBQzdCLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxpQkFBaUIsSUFBSSxJQUFJO1NBQ3RELE1BQUEsQ0FBQztJQUNKLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxlQUFlLENBQUMsR0FBbUI7UUFDdkMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQW1CO1FBQy9CLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE9BQU8sTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFzQjtRQUNyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBc0I7UUFDckMsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDN0IsTUFBTSxHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUVELHFEQUFxRDtJQUNyRCxLQUFLLENBQUMsR0FBRztRQUNQLElBQUksdUJBQUEsSUFBSSxzQkFBSyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVCLE1BQU0sR0FBRyxHQUFHLE1BQU0sdUJBQUEsSUFBSSx5QkFBUSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FDekQsaUJBQVMsQ0FBQyxHQUFHLEVBQ2IsdUJBQUEsSUFBSSwwQkFBUyxDQUFDLFdBQVcsRUFBRSxDQUM1QixDQUFDO1lBQ0YsdUJBQUEsSUFBSSxrQkFBUSxJQUFJLFdBQUcsQ0FBQyx1QkFBQSxJQUFJLHlCQUFRLEVBQUUsR0FBRyxDQUFDLE1BQUEsQ0FBQztRQUN6QyxDQUFDO1FBQ0QsT0FBTyx1QkFBQSxJQUFJLHNCQUFLLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxVQUFzQjtRQUNyRCxNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUMxQyxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLHVCQUFBLElBQUksMEJBQVMsQ0FBQyxFQUFFLENBQUM7WUFDMUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsdUJBQUEsSUFBSSwwQkFBUyxZQUFZLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQzNGLENBQUM7UUFDRCxNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDYixNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDckQsQ0FBQztRQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RSxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBSSxHQUEwQjtRQUMzQyxJQUFJLEtBQUssR0FBRyxTQUFTLENBQUM7UUFDdEIsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQzdCLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsdUJBQUEsSUFBSSwwQkFBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztZQUVyRixNQUFNLE9BQU8sR0FBRyxNQUFNLHVCQUFBLElBQUkseUJBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdEUsdUJBQUEsSUFBSSwwQkFBUyxDQUFDLFNBQVMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ25DLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwQixHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsbUJBQW1CLENBQUM7b0JBQ2xDLEtBQUs7b0JBQ0wsUUFBUSxFQUFFLHVCQUFBLElBQUkseUJBQVEsQ0FBQyxLQUFLO29CQUM1QixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZO2lCQUN0QyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0gsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXBLRCw4QkFvS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICB0eXBlIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgdHlwZSBFaXAxOTFTaWduUmVxdWVzdCxcbiAgdHlwZSBFaXA3MTJTaWduUmVxdWVzdCxcbiAgdHlwZSBFdm1TaWduUmVxdWVzdCxcbiAgS2V5LFxuICB0eXBlIE1mYVJlcXVlc3RJbmZvLFxuICB0eXBlIEV2bVNpZ25SZXNwb25zZSxcbiAgdHlwZSBDdWJlU2lnbmVyQ2xpZW50LFxuICB0eXBlIE1mYVJlcXVlc3QsXG4gIFNlY3AyNTZrMSxcbn0gZnJvbSBcIi4uL2luZGV4XCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIEV2bVNpZ25lck9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBNRkEgaW5mb3JtYXRpb24gaXMgcmV0cmlldmVkLiBJZiB0aGlzIGNhbGxiYWNrXG4gICAqIHRocm93cywgbm8gdHJhbnNhY3Rpb24gaXMgYnJvYWRjYXN0LlxuICAgKi9cbiAgb25NZmFQb2xsPzogKGFyZzA6IE1mYVJlcXVlc3RJbmZvKSA9PiB2b2lkO1xuICAvKipcbiAgICogVGhlIGFtb3VudCBvZiB0aW1lIChpbiBtaWxsaXNlY29uZHMpIHRvIHdhaXQgYmV0d2VlbiBjaGVja3MgZm9yIE1GQVxuICAgKiB1cGRhdGVzLiBEZWZhdWx0IGlzIDEwMDBtc1xuICAgKi9cbiAgbWZhUG9sbEludGVydmFsTXM/OiBudW1iZXI7XG59XG5cbi8qKlxuICogU2lnbmVyIHVzaW5nIEN1YmVTaWduZXIsIHdpdGggYmFzaWMgTUZBIGhhbmRsaW5nLlxuICpcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgRXZtU2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5ICNhZGRyZXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciBzaWduaW5nICovXG4gICNrZXk/OiBLZXk7XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIHNlc3Npb24gKi9cbiAgcmVhZG9ubHkgI2NsaWVudDogQ3ViZVNpZ25lckNsaWVudDtcblxuICAvKiogT3B0aW9ucyAqL1xuICByZWFkb25seSAjb3B0aW9uczogRXZtU2lnbmVyT3B0aW9ucztcblxuICAvKiogQHJldHVybnMgVGhlIGtleSBhZGRyZXNzIChOT1QgY2hlY2tzdW1tZWQpICovXG4gIGdldCBhZGRyZXNzKCkge1xuICAgIHJldHVybiB0aGlzLiNhZGRyZXNzO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSB1bmRlcmx5aW5nIGNsaWVudCAqL1xuICBnZXQgY2xpZW50KCkge1xuICAgIHJldHVybiB0aGlzLiNjbGllbnQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIG9wdGlvbnMgdXNlZCBmb3IgdGhpcyBFdm1TaWduZXIgKi9cbiAgZ2V0IG9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI29wdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGtleSBvciB0aGUgZXRoIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gY2xpZW50IFRoZSB1bmRlcmx5aW5nIEN1YmVTaWduZXJDbGllbnQuXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5IHwgc3RyaW5nLCBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG9wdGlvbnM/OiBFdm1TaWduZXJPcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3MubWF0ZXJpYWxJZDtcbiAgICAgIHRoaXMuI2tleSA9IGFkZHJlc3M7XG4gICAgfVxuICAgIHRoaXMuI2NsaWVudCA9IGNsaWVudDtcbiAgICB0aGlzLiNvcHRpb25zID0gPEV2bVNpZ25lck9wdGlvbnM+e1xuICAgICAgb25NZmFQb2xsOiBvcHRpb25zPy5vbk1mYVBvbGwsXG4gICAgICBtZmFQb2xsSW50ZXJ2YWxNczogb3B0aW9ucz8ubWZhUG9sbEludGVydmFsTXMgPz8gMTAwMCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgc2lnbiByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uKHJlcTogRXZtU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuc2lnbkV2bShyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmhhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCBkb2VzIG5vdCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbCwgaS5lLixcbiAgICogdGhlIHJldHVybmVkIHtAbGluayBDdWJlU2lnbmVyUmVzcG9uc2V9IG9iamVjdCBlaXRoZXIgY29udGFpbnMgYSBzaWduYXR1cmUgb3IgaW5kaWNhdGVzXG4gICAqIHRoYXQgTUZBIGlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgQ3ViZVNpZ25lciByZW1vdGUgZW5kLlxuICAgKi9cbiAgYXN5bmMgc2lnbkV2bShyZXE6IEV2bVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgcmV0dXJuIGF3YWl0IGtleS5zaWduRXZtKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgRUlQLTcxMiB0eXBlZCBkYXRhLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC03MTIgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwNzEyU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIEVJUDcxMiBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKHJlcTogRWlwNzEyU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQga2V5LnNpZ25FaXA3MTIocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5oYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5zaWduYXR1cmU7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHJldHVybnMgVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEocmVxOiBFaXAxOTFTaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBrZXkuc2lnbkVpcDE5MShyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmhhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnNpZ25hdHVyZTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUga2V5IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBhZGRyZXNzICovXG4gIGFzeW5jIGtleSgpOiBQcm9taXNlPEtleT4ge1xuICAgIGlmICh0aGlzLiNrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy4jY2xpZW50LmFwaUNsaWVudC5rZXlHZXRCeU1hdGVyaWFsSWQoXG4gICAgICAgIFNlY3AyNTZrMS5Fdm0sXG4gICAgICAgIHRoaXMuI2FkZHJlc3MudG9Mb3dlckNhc2UoKSxcbiAgICAgICk7XG4gICAgICB0aGlzLiNrZXkgPSBuZXcgS2V5KHRoaXMuI2NsaWVudCwga2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2tleTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBhcHByb3ZlZCBNRkEgcmVxdWVzdC4gVGhlIE1GQSByZXF1ZXN0IGNvbnRhaW5zXG4gICAqIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhcHByb3ZlZCBzaWduaW5nIHJlcXVlc3QsIHdoaWNoIHRoaXMgbWV0aG9kIHdpbGwgZXhlY3V0ZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlcXVlc3QgVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uTWZhQXBwcm92ZWQobWZhUmVxdWVzdDogTWZhUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IGF3YWl0IG1mYVJlcXVlc3QucmVxdWVzdCgpO1xuICAgIGlmICghcmVxdWVzdC5wYXRoLmluY2x1ZGVzKFwiL2V0aDEvc2lnbi9cIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgRVZNIHRyYW5zYWN0aW9uIHNpZ25pbmcgcmVxdWVzdCwgZ290ICR7cmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBpZiAoIXJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBzaWduaW5nIHJlcXVlc3QgZm9yICR7dGhpcy4jYWRkcmVzc30gYnV0IGdvdCAke3JlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgY29uc3QgcmVjZWlwdCA9IGF3YWl0IG1mYVJlcXVlc3QucmVjZWlwdCgpO1xuICAgIGlmICghcmVjZWlwdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTUZBIHJlcXVlc3QgaXMgbm90IGFwcHJvdmVkIHlldFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmtleSgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBrZXkuc2lnbkV2bShyZXF1ZXN0LmJvZHkgYXMgRXZtU2lnblJlcXVlc3QsIHJlY2VpcHQpO1xuICAgIHJldHVybiByZXNwLmRhdGEoKS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqXG4gICAqIEBwYXJhbSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgaGFuZGxlTWZhPFU+KHJlczogQ3ViZVNpZ25lclJlc3BvbnNlPFU+KTogUHJvbWlzZTxVPiB7XG4gICAgbGV0IG1mYUlkID0gdW5kZWZpbmVkO1xuICAgIHdoaWxlICgobWZhSWQgPSByZXMubWZhSWQoKSkpIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuI29wdGlvbnMubWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSW5mbyA9IGF3YWl0IHRoaXMuI2NsaWVudC5vcmcoKS5nZXRNZmFSZXF1ZXN0KG1mYUlkKS5mZXRjaCgpO1xuICAgICAgdGhpcy4jb3B0aW9ucy5vbk1mYVBvbGw/LihtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLmV4ZWNXaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNjbGllbnQub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=