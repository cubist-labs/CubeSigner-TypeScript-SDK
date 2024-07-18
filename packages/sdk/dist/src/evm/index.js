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
var _EvmSigner_instances, _EvmSigner_address, _EvmSigner_key, _EvmSigner_client, _EvmSigner_options, _EvmSigner_handleMfa;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvmSigner = void 0;
/**
 * Signer using CubeSigner, with basic MFA handling.
 * @internal
 */
class EvmSigner {
    /** Returns the key address (NOT checksummed) */
    get address() {
        return __classPrivateFieldGet(this, _EvmSigner_address, "f");
    }
    /** Returns the underlying client */
    get client() {
        return __classPrivateFieldGet(this, _EvmSigner_client, "f");
    }
    /** Options */
    get options() {
        return __classPrivateFieldGet(this, _EvmSigner_options, "f");
    }
    /**
     * Create new Signer instance
     * @param {Key | string} address The key or the eth address of the account to use.
     * @param {CubeSignerClient} client The underlying CubeSignerClient.
     * @param {EvmSignerOptions} options The options to use for the Signer instance
     */
    constructor(address, client, options) {
        _EvmSigner_instances.add(this);
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
     * @param {EvmSignRequest} req The sign request.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(req) {
        const res = await this.signEvm(req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.rlp_signed_tx;
    }
    /**
     * Sign a transaction. This method does not block if the key requires MFA approval, i.e.,
     * the returned {@link CubeSignerResponse} object either contains a signature or indicates
     * that MFA is required.
     *
     * @param {EvmSignRequest} req The transaction to sign.
     * @return {CubeSignerResponse<EvmSignResponse>} The response from the CubeSigner remote end.
     */
    async signEvm(req) {
        const key = await this.key();
        return await key.signEvm(req);
    }
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     * @param {Eip712SignRequest} req The EIP712 sign request.
     * @return {Promise<string>} The signature.
     */
    async signEip712(req) {
        const key = await this.key();
        const res = await key.signEip712(req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.signature;
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {Eip191SignRequest} req The request to sign.
     * @return {Promise<string>} The signature.
     */
    async signEip191(req) {
        const key = await this.key();
        const res = await key.signEip191(req);
        const data = await __classPrivateFieldGet(this, _EvmSigner_instances, "m", _EvmSigner_handleMfa).call(this, res);
        return data.signature;
    }
    /** @return {Key} The key corresponding to this address */
    async key() {
        if (__classPrivateFieldGet(this, _EvmSigner_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _EvmSigner_client, "f").sessionKeys()).find((k) => k.materialId === __classPrivateFieldGet(this, _EvmSigner_address, "f"));
            if (key === undefined) {
                throw new Error(`Cannot access key '${__classPrivateFieldGet(this, _EvmSigner_address, "f")}'`);
            }
            __classPrivateFieldSet(this, _EvmSigner_key, key, "f");
        }
        return __classPrivateFieldGet(this, _EvmSigner_key, "f");
    }
    /**
     * Sign a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will execute.
     * @param {MfaRequest} mfaRequest The approved MFA request.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
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
}
exports.EvmSigner = EvmSigner;
_EvmSigner_address = new WeakMap(), _EvmSigner_key = new WeakMap(), _EvmSigner_client = new WeakMap(), _EvmSigner_options = new WeakMap(), _EvmSigner_instances = new WeakSet(), _EvmSigner_handleMfa = 
/**
 * If the sign request requires MFA, this method waits for approvals
 * @param {CubeSignerResponse<U>} res The response of a sign request
 * @return {Promise<U>} The sign data after MFA approvals
 */
async function _EvmSigner_handleMfa(res) {
    while (res.requiresMfa()) {
        await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _EvmSigner_options, "f").mfaPollIntervalMs));
        const mfaId = res.mfaId();
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
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQTBCQTs7O0dBR0c7QUFDSCxNQUFhLFNBQVM7SUFhcEIsZ0RBQWdEO0lBQ2hELElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxvQ0FBb0M7SUFDcEMsSUFBSSxNQUFNO1FBQ1IsT0FBTyx1QkFBQSxJQUFJLHlCQUFRLENBQUM7SUFDdEIsQ0FBQztJQUVELGNBQWM7SUFDZCxJQUFJLE9BQU87UUFDVCxPQUFPLHVCQUFBLElBQUksMEJBQVMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxZQUFZLE9BQXFCLEVBQUUsTUFBd0IsRUFBRSxPQUEwQjs7UUFqQ3ZGLGlDQUFpQztRQUNqQyxxQ0FBMEI7UUFFMUIsaUNBQWlDO1FBQ2pDLGlDQUFXO1FBRVgsNkJBQTZCO1FBQzdCLG9DQUFtQztRQUVuQyxjQUFjO1FBQ2QscUNBQW9DO1FBd0JsQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRTtZQUMvQix1QkFBQSxJQUFJLHNCQUFZLE9BQU8sTUFBQSxDQUFDO1NBQ3pCO2FBQU07WUFDTCx1QkFBQSxJQUFJLHNCQUFZLE9BQU8sQ0FBQyxVQUFVLE1BQUEsQ0FBQztZQUNuQyx1QkFBQSxJQUFJLGtCQUFRLE9BQU8sTUFBQSxDQUFDO1NBQ3JCO1FBQ0QsdUJBQUEsSUFBSSxxQkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLHNCQUE4QjtZQUNoQyxTQUFTLEVBQUUsT0FBTyxFQUFFLFNBQVM7WUFDN0IsaUJBQWlCLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixJQUFJLElBQUk7U0FDdEQsTUFBQSxDQUFDO0lBQ0osQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsZUFBZSxDQUFDLEdBQW1CO1FBQ3ZDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQyxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksa0RBQVcsTUFBZixJQUFJLEVBQVksR0FBRyxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFtQjtRQUMvQixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixPQUFPLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFzQjtRQUNyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGtEQUFXLE1BQWYsSUFBSSxFQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFzQjtRQUNyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEMsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGtEQUFXLE1BQWYsSUFBSSxFQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQsMERBQTBEO0lBQzFELEtBQUssQ0FBQyxHQUFHO1FBQ1AsSUFBSSx1QkFBQSxJQUFJLHNCQUFLLEtBQUssU0FBUyxFQUFFO1lBQzNCLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSx1QkFBQSxJQUFJLHlCQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUssdUJBQUEsSUFBSSwwQkFBUyxDQUFDLENBQUM7WUFDM0YsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO2dCQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQix1QkFBQSxJQUFJLDBCQUFTLEdBQUcsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsdUJBQUEsSUFBSSxrQkFBUSxHQUFHLE1BQUEsQ0FBQztTQUNqQjtRQUNELE9BQU8sdUJBQUEsSUFBSSxzQkFBSyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxVQUFzQjtRQUNyRCxNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDekMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7U0FDbEY7UUFDRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQUEsSUFBSSwwQkFBUyxDQUFDLEVBQUU7WUFDekMsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsdUJBQUEsSUFBSSwwQkFBUyxZQUFZLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzFGO1FBQ0QsTUFBTSxPQUFPLEdBQUcsTUFBTSxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztTQUNwRDtRQUVELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE1BQU0sSUFBSSxHQUFHLE1BQU0sR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBc0IsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUN4RSxPQUFPLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUM7SUFDbkMsQ0FBQztDQXdCRjtBQTlKRCw4QkE4SkM7O0FBdEJDOzs7O0dBSUc7QUFDSCxLQUFLLCtCQUFlLEdBQTBCO0lBQzVDLE9BQU8sR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQ3hCLE1BQU0sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsdUJBQUEsSUFBSSwwQkFBUyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQztRQUVyRixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHlCQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3RFLHVCQUFBLElBQUksMEJBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNuQyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7WUFDbkIsR0FBRyxHQUFHLE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDO2dCQUNsQyxLQUFLO2dCQUNMLFFBQVEsRUFBRSx1QkFBQSxJQUFJLHlCQUFRLENBQUMsS0FBSztnQkFDNUIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWTthQUN0QyxDQUFDLENBQUM7U0FDSjtLQUNGO0lBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBNZmFSZXF1ZXN0SW5mbyxcbiAgRXZtU2lnblJlc3BvbnNlLFxuICBDdWJlU2lnbmVyQ2xpZW50LFxuICBLZXksXG4gIE1mYVJlcXVlc3QsXG59IGZyb20gXCIuLi9pbmRleFwiO1xuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHNpZ25lciAqL1xuZXhwb3J0IGludGVyZmFjZSBFdm1TaWduZXJPcHRpb25zIHtcbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gTUZBIGluZm9ybWF0aW9uIGlzIHJldHJpZXZlZC4gSWYgdGhpcyBjYWxsYmFja1xuICAgKiB0aHJvd3MsIG5vIHRyYW5zYWN0aW9uIGlzIGJyb2FkY2FzdC5cbiAgICovXG4gIG9uTWZhUG9sbD86IChhcmcwOiBNZmFSZXF1ZXN0SW5mbykgPT4gdm9pZDtcbiAgLyoqXG4gICAqIFRoZSBhbW91bnQgb2YgdGltZSAoaW4gbWlsbGlzZWNvbmRzKSB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBNRkFcbiAgICogdXBkYXRlcy4gRGVmYXVsdCBpcyAxMDAwbXNcbiAgICovXG4gIG1mYVBvbGxJbnRlcnZhbE1zPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFNpZ25lciB1c2luZyBDdWJlU2lnbmVyLCB3aXRoIGJhc2ljIE1GQSBoYW5kbGluZy5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgRXZtU2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5ICNhZGRyZXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciBzaWduaW5nICovXG4gICNrZXk/OiBLZXk7XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIHNlc3Npb24gKi9cbiAgcmVhZG9ubHkgI2NsaWVudDogQ3ViZVNpZ25lckNsaWVudDtcblxuICAvKiogT3B0aW9ucyAqL1xuICByZWFkb25seSAjb3B0aW9uczogRXZtU2lnbmVyT3B0aW9ucztcblxuICAvKiogUmV0dXJucyB0aGUga2V5IGFkZHJlc3MgKE5PVCBjaGVja3N1bW1lZCkgKi9cbiAgZ2V0IGFkZHJlc3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2FkZHJlc3M7XG4gIH1cblxuICAvKiogUmV0dXJucyB0aGUgdW5kZXJseWluZyBjbGllbnQgKi9cbiAgZ2V0IGNsaWVudCgpIHtcbiAgICByZXR1cm4gdGhpcy4jY2xpZW50O1xuICB9XG5cbiAgLyoqIE9wdGlvbnMgKi9cbiAgZ2V0IG9wdGlvbnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuI29wdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtLZXkgfCBzdHJpbmd9IGFkZHJlc3MgVGhlIGtleSBvciB0aGUgZXRoIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdG8gdXNlLlxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJDbGllbnR9IGNsaWVudCBUaGUgdW5kZXJseWluZyBDdWJlU2lnbmVyQ2xpZW50LlxuICAgKiBAcGFyYW0ge0V2bVNpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXkgfCBzdHJpbmcsIGNsaWVudDogQ3ViZVNpZ25lckNsaWVudCwgb3B0aW9ucz86IEV2bVNpZ25lck9wdGlvbnMpIHtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcztcbiAgICB9XG4gICAgdGhpcy4jY2xpZW50ID0gY2xpZW50O1xuICAgIHRoaXMuI29wdGlvbnMgPSA8RXZtU2lnbmVyT3B0aW9ucz57XG4gICAgICBvbk1mYVBvbGw6IG9wdGlvbnM/Lm9uTWZhUG9sbCxcbiAgICAgIG1mYVBvbGxJbnRlcnZhbE1zOiBvcHRpb25zPy5tZmFQb2xsSW50ZXJ2YWxNcyA/PyAxMDAwLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge0V2bVNpZ25SZXF1ZXN0fSByZXEgVGhlIHNpZ24gcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uKHJlcTogRXZtU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuc2lnbkV2bShyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2QgZG9lcyBub3QgYmxvY2sgaWYgdGhlIGtleSByZXF1aXJlcyBNRkEgYXBwcm92YWwsIGkuZS4sXG4gICAqIHRoZSByZXR1cm5lZCB7QGxpbmsgQ3ViZVNpZ25lclJlc3BvbnNlfSBvYmplY3QgZWl0aGVyIGNvbnRhaW5zIGEgc2lnbmF0dXJlIG9yIGluZGljYXRlc1xuICAgKiB0aGF0IE1GQSBpcyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIHtFdm1TaWduUmVxdWVzdH0gcmVxIFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtDdWJlU2lnbmVyUmVzcG9uc2U8RXZtU2lnblJlc3BvbnNlPn0gVGhlIHJlc3BvbnNlIGZyb20gdGhlIEN1YmVTaWduZXIgcmVtb3RlIGVuZC5cbiAgICovXG4gIGFzeW5jIHNpZ25Fdm0ocmVxOiBFdm1TaWduUmVxdWVzdCk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmtleSgpO1xuICAgIHJldHVybiBhd2FpdCBrZXkuc2lnbkV2bShyZXEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtNzEyIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDcxMlNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge0VpcDcxMlNpZ25SZXF1ZXN0fSByZXEgVGhlIEVJUDcxMiBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXA3MTIocmVxOiBFaXA3MTJTaWduUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBrZXkuc2lnbkVpcDcxMihyZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5zaWduYXR1cmU7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqIEBwYXJhbSB7RWlwMTkxU2lnblJlcXVlc3R9IHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwMTkxKHJlcTogRWlwMTkxU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQga2V5LnNpZ25FaXAxOTEocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge0tleX0gVGhlIGtleSBjb3JyZXNwb25kaW5nIHRvIHRoaXMgYWRkcmVzcyAqL1xuICBhc3luYyBrZXkoKTogUHJvbWlzZTxLZXk+IHtcbiAgICBpZiAodGhpcy4ja2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGtleSA9IChhd2FpdCB0aGlzLiNjbGllbnQuc2Vzc2lvbktleXMoKSkuZmluZCgoaykgPT4gay5tYXRlcmlhbElkID09PSB0aGlzLiNhZGRyZXNzKTtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBhY2Nlc3Mga2V5ICcke3RoaXMuI2FkZHJlc3N9J2ApO1xuICAgICAgfVxuICAgICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4ja2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbCBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3R9IG1mYVJlcXVlc3QgVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0OiBNZmFSZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXF1ZXN0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZXF1ZXN0KCk7XG4gICAgaWYgKCFyZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHtyZXF1ZXN0LnBhdGh9YCk7XG4gICAgfVxuICAgIGlmICghcmVxdWVzdC5wYXRoLmluY2x1ZGVzKHRoaXMuI2FkZHJlc3MpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHNpZ25pbmcgcmVxdWVzdCBmb3IgJHt0aGlzLiNhZGRyZXNzfSBidXQgZ290ICR7cmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBjb25zdCByZWNlaXB0ID0gYXdhaXQgbWZhUmVxdWVzdC5yZWNlaXB0KCk7XG4gICAgaWYgKCFyZWNlaXB0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNRkEgcmVxdWVzdCBpcyBub3QgYXBwcm92ZWQgeWV0XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleS5zaWduRXZtKHJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCwgcmVjZWlwdCk7XG4gICAgcmV0dXJuIHJlc3AuZGF0YSgpLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogSWYgdGhlIHNpZ24gcmVxdWVzdCByZXF1aXJlcyBNRkEsIHRoaXMgbWV0aG9kIHdhaXRzIGZvciBhcHByb3ZhbHNcbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyUmVzcG9uc2U8VT59IHJlcyBUaGUgcmVzcG9uc2Ugb2YgYSBzaWduIHJlcXVlc3RcbiAgICogQHJldHVybiB7UHJvbWlzZTxVPn0gVGhlIHNpZ24gZGF0YSBhZnRlciBNRkEgYXBwcm92YWxzXG4gICAqL1xuICBhc3luYyAjaGFuZGxlTWZhPFU+KHJlczogQ3ViZVNpZ25lclJlc3BvbnNlPFU+KTogUHJvbWlzZTxVPiB7XG4gICAgd2hpbGUgKHJlcy5yZXF1aXJlc01mYSgpKSB7XG4gICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aGlzLiNvcHRpb25zLm1mYVBvbGxJbnRlcnZhbE1zKSk7XG5cbiAgICAgIGNvbnN0IG1mYUlkID0gcmVzLm1mYUlkKCk7XG4gICAgICBjb25zdCBtZmFJbmZvID0gYXdhaXQgdGhpcy4jY2xpZW50Lm9yZygpLmdldE1mYVJlcXVlc3QobWZhSWQpLmZldGNoKCk7XG4gICAgICB0aGlzLiNvcHRpb25zLm9uTWZhUG9sbD8uKG1mYUluZm8pO1xuICAgICAgaWYgKG1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgICByZXMgPSBhd2FpdCByZXMuZXhlY1dpdGhNZmFBcHByb3ZhbCh7XG4gICAgICAgICAgbWZhSWQsXG4gICAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI2NsaWVudC5vcmdJZCxcbiAgICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQuY29uZmlybWF0aW9uLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlcy5kYXRhKCk7XG4gIH1cbn1cbiJdfQ==