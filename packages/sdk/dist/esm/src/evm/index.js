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
/**
 * Signer using CubeSigner, with basic MFA handling.
 * @internal
 */
export class EvmSigner {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvZXZtL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQTBCQTs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sU0FBUztJQWFwQixnREFBZ0Q7SUFDaEQsSUFBSSxPQUFPO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLDBCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVELG9DQUFvQztJQUNwQyxJQUFJLE1BQU07UUFDUixPQUFPLHVCQUFBLElBQUkseUJBQVEsQ0FBQztJQUN0QixDQUFDO0lBRUQsY0FBYztJQUNkLElBQUksT0FBTztRQUNULE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksT0FBcUIsRUFBRSxNQUF3QixFQUFFLE9BQTBCOztRQWpDdkYsaUNBQWlDO1FBQ3hCLHFDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsaUNBQVc7UUFFWCw2QkFBNkI7UUFDcEIsb0NBQTBCO1FBRW5DLGNBQWM7UUFDTCxxQ0FBMkI7UUF3QmxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxzQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksc0JBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksa0JBQVEsT0FBTyxNQUFBLENBQUM7UUFDdEIsQ0FBQztRQUNELHVCQUFBLElBQUkscUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxzQkFBOEI7WUFDaEMsU0FBUyxFQUFFLE9BQU8sRUFBRSxTQUFTO1lBQzdCLGlCQUFpQixFQUFFLE9BQU8sRUFBRSxpQkFBaUIsSUFBSSxJQUFJO1NBQ3RELE1BQUEsQ0FBQztJQUNKLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gs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QUNELE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFdm1TaWduUmVxdWVzdCxcbiAgTWZhUmVxdWVzdEluZm8sXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgQ3ViZVNpZ25lckNsaWVudCxcbiAgS2V5LFxuICBNZmFSZXF1ZXN0LFxufSBmcm9tIFwiLi4vaW5kZXhcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRXZtU2lnbmVyT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lciwgd2l0aCBiYXNpYyBNRkEgaGFuZGxpbmcuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNsYXNzIEV2bVNpZ25lciB7XG4gIC8qKiBUaGUgYWRkcmVzcyBvZiB0aGUgYWNjb3VudCAqL1xuICByZWFkb25seSAjYWRkcmVzczogc3RyaW5nO1xuXG4gIC8qKiBUaGUga2V5IHRvIHVzZSBmb3Igc2lnbmluZyAqL1xuICAja2V5PzogS2V5O1xuXG4gIC8qKiBUaGUgdW5kZXJseWluZyBzZXNzaW9uICovXG4gIHJlYWRvbmx5ICNjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQ7XG5cbiAgLyoqIE9wdGlvbnMgKi9cbiAgcmVhZG9ubHkgI29wdGlvbnM6IEV2bVNpZ25lck9wdGlvbnM7XG5cbiAgLyoqIFJldHVybnMgdGhlIGtleSBhZGRyZXNzIChOT1QgY2hlY2tzdW1tZWQpICovXG4gIGdldCBhZGRyZXNzKCkge1xuICAgIHJldHVybiB0aGlzLiNhZGRyZXNzO1xuICB9XG5cbiAgLyoqIFJldHVybnMgdGhlIHVuZGVybHlpbmcgY2xpZW50ICovXG4gIGdldCBjbGllbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuI2NsaWVudDtcbiAgfVxuXG4gIC8qKiBPcHRpb25zICovXG4gIGdldCBvcHRpb25zKCkge1xuICAgIHJldHVybiB0aGlzLiNvcHRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7S2V5IHwgc3RyaW5nfSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtDdWJlU2lnbmVyQ2xpZW50fSBjbGllbnQgVGhlIHVuZGVybHlpbmcgQ3ViZVNpZ25lckNsaWVudC5cbiAgICogQHBhcmFtIHtFdm1TaWduZXJPcHRpb25zfSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5IHwgc3RyaW5nLCBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG9wdGlvbnM/OiBFdm1TaWduZXJPcHRpb25zKSB7XG4gICAgaWYgKHR5cGVvZiBhZGRyZXNzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3MubWF0ZXJpYWxJZDtcbiAgICAgIHRoaXMuI2tleSA9IGFkZHJlc3M7XG4gICAgfVxuICAgIHRoaXMuI2NsaWVudCA9IGNsaWVudDtcbiAgICB0aGlzLiNvcHRpb25zID0gPEV2bVNpZ25lck9wdGlvbnM+e1xuICAgICAgb25NZmFQb2xsOiBvcHRpb25zPy5vbk1mYVBvbGwsXG4gICAgICBtZmFQb2xsSW50ZXJ2YWxNczogb3B0aW9ucz8ubWZhUG9sbEludGVydmFsTXMgPz8gMTAwMCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICogQHBhcmFtIHtFdm1TaWduUmVxdWVzdH0gcmVxIFRoZSBzaWduIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gSGV4LWVuY29kZWQgUkxQIGVuY29kaW5nIG9mIHRoZSB0cmFuc2FjdGlvbiBhbmQgaXRzIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UcmFuc2FjdGlvbihyZXE6IEV2bVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLnNpZ25Fdm0ocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEucmxwX3NpZ25lZF90eDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIGRvZXMgbm90IGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLCBpLmUuLFxuICAgKiB0aGUgcmV0dXJuZWQge0BsaW5rIEN1YmVTaWduZXJSZXNwb25zZX0gb2JqZWN0IGVpdGhlciBjb250YWlucyBhIHNpZ25hdHVyZSBvciBpbmRpY2F0ZXNcbiAgICogdGhhdCBNRkEgaXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7RXZtU2lnblJlcXVlc3R9IHJlcSBUaGUgdHJhbnNhY3Rpb24gdG8gc2lnbi5cbiAgICogQHJldHVybiB7Q3ViZVNpZ25lclJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT59IFRoZSByZXNwb25zZSBmcm9tIHRoZSBDdWJlU2lnbmVyIHJlbW90ZSBlbmQuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKHJlcTogRXZtU2lnblJlcXVlc3QpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICByZXR1cm4gYXdhaXQga2V5LnNpZ25Fdm0ocmVxKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtFaXA3MTJTaWduUmVxdWVzdH0gcmVxIFRoZSBFSVA3MTIgc2lnbiByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKHJlcTogRWlwNzEyU2lnblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQga2V5LnNpZ25FaXA3MTIocmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge0VpcDE5MVNpZ25SZXF1ZXN0fSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDE5MShyZXE6IEVpcDE5MVNpZ25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmtleSgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGtleS5zaWduRWlwMTkxKHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnNpZ25hdHVyZTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtLZXl9IFRoZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGFkZHJlc3MgKi9cbiAgYXN5bmMga2V5KCk6IFByb21pc2U8S2V5PiB7XG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jY2xpZW50LnNlc3Npb25LZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxJZCA9PT0gdGhpcy4jYWRkcmVzcyk7XG4gICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgYWNjZXNzIGtleSAnJHt0aGlzLiNhZGRyZXNzfSdgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI2tleSA9IGtleTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI2tleTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBhcHByb3ZlZCBNRkEgcmVxdWVzdC4gVGhlIE1GQSByZXF1ZXN0IGNvbnRhaW5zXG4gICAqIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhcHByb3ZlZCBzaWduaW5nIHJlcXVlc3QsIHdoaWNoIHRoaXMgbWV0aG9kIHdpbGwgZXhlY3V0ZS5cbiAgICogQHBhcmFtIHtNZmFSZXF1ZXN0fSBtZmFSZXF1ZXN0IFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uTWZhQXBwcm92ZWQobWZhUmVxdWVzdDogTWZhUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVxdWVzdCA9IGF3YWl0IG1mYVJlcXVlc3QucmVxdWVzdCgpO1xuICAgIGlmICghcmVxdWVzdC5wYXRoLmluY2x1ZGVzKFwiL2V0aDEvc2lnbi9cIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgRVZNIHRyYW5zYWN0aW9uIHNpZ25pbmcgcmVxdWVzdCwgZ290ICR7cmVxdWVzdC5wYXRofWApO1xuICAgIH1cbiAgICBpZiAoIXJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBzaWduaW5nIHJlcXVlc3QgZm9yICR7dGhpcy4jYWRkcmVzc30gYnV0IGdvdCAke3JlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgY29uc3QgcmVjZWlwdCA9IGF3YWl0IG1mYVJlcXVlc3QucmVjZWlwdCgpO1xuICAgIGlmICghcmVjZWlwdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTUZBIHJlcXVlc3QgaXMgbm90IGFwcHJvdmVkIHlldFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBrZXkgPSBhd2FpdCB0aGlzLmtleSgpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBrZXkuc2lnbkV2bShyZXF1ZXN0LmJvZHkgYXMgRXZtU2lnblJlcXVlc3QsIHJlY2VpcHQpO1xuICAgIHJldHVybiByZXNwLmRhdGEoKS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IEN1YmVTaWduZXJSZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jb3B0aW9ucy5tZmFQb2xsSW50ZXJ2YWxNcykpO1xuXG4gICAgICBjb25zdCBtZmFJZCA9IHJlcy5tZmFJZCgpO1xuICAgICAgY29uc3QgbWZhSW5mbyA9IGF3YWl0IHRoaXMuI2NsaWVudC5vcmcoKS5nZXRNZmFSZXF1ZXN0KG1mYUlkKS5mZXRjaCgpO1xuICAgICAgdGhpcy4jb3B0aW9ucy5vbk1mYVBvbGw/LihtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLmV4ZWNXaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNjbGllbnQub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=