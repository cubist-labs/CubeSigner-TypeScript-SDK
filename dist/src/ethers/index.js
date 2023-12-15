"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Signer_instances, _Signer_address, _Signer_key, _Signer_signerSession, _Signer_onMfaPoll, _Signer_mfaPollIntervalMs, _Signer_handleMfa;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
const ethers_1 = require("ethers");
const assert_1 = __importDefault(require("assert"));
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.AbstractSigner {
    /**
     * Create new Signer instance
     * @param {KeyInfo | string} address The key or the eth address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {SignerOptions} options The options to use for the Signer instance
     */
    constructor(address, signerSession, options) {
        super(options?.provider);
        _Signer_instances.add(this);
        /** The address of the account */
        _Signer_address.set(this, void 0);
        /** The key to use for signing */
        _Signer_key.set(this, void 0);
        /** The underlying session */
        _Signer_signerSession.set(this, void 0);
        /**
         * The function to call when MFA information is retrieved. If this callback
         * throws, no transaction is broadcast.
         */
        _Signer_onMfaPoll.set(this, void 0);
        /** The amount of time to wait between checks for MFA updates */
        _Signer_mfaPollIntervalMs.set(this, void 0);
        if (typeof address === "string") {
            __classPrivateFieldSet(this, _Signer_address, address, "f");
        }
        else {
            __classPrivateFieldSet(this, _Signer_address, address.materialId, "f");
            __classPrivateFieldSet(this, _Signer_key, address, "f");
        }
        __classPrivateFieldSet(this, _Signer_signerSession, signerSession, "f");
        __classPrivateFieldSet(this, _Signer_onMfaPoll, options?.onMfaPoll ?? (( /* _mfaInfo: MfaRequestInfo */) => { }), "f"); // eslint-disable-line @typescript-eslint/no-empty-function
        __classPrivateFieldSet(this, _Signer_mfaPollIntervalMs, options?.mfaPollIntervalMs ?? 1000, "f");
    }
    /** Resolves to the signer address. */
    async getAddress() {
        return __classPrivateFieldGet(this, _Signer_address, "f");
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {null | ethers.Provider} provider The optional provider instance to use.
     *  @return {Signer} The signer connected to signer.
     */
    connect(provider) {
        return new Signer(__classPrivateFieldGet(this, _Signer_address, "f"), __classPrivateFieldGet(this, _Signer_signerSession, "f"), { provider });
    }
    /**
     * Construct a signing request from a transaction. This populates the transaction
     * type to `0x02` (EIP-1559) unless set.
     *
     * @param {ethers.TransactionRequest} tx The transaction
     * @return {EvmSignRequest} The EVM sign request to be sent to CubeSigner
     */
    async evmSignRequestFromTx(tx) {
        // get the chain id from the network or tx
        let chainId = tx.chainId;
        if (chainId === undefined) {
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId?.toString() ?? "1";
        }
        // Convert the transaction into a JSON-RPC transaction
        const rpcTx = this.provider instanceof ethers_1.JsonRpcApiProvider
            ? this.provider.getRpcTransaction(tx)
            : // We can just call the getRpcTransaction with a
                // null receiver since it doesn't actually use it
                // (and really should be declared static).
                ethers_1.JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
        rpcTx.type = (0, ethers_1.toBeHex)(tx.type ?? 0x02, 1); // we expect 0x0[0-2]
        return {
            chain_id: Number(chainId),
            tx: rpcTx,
        };
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     * @param {ethers.TransactionRequest} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
        const req = await this.evmSignRequestFromTx(tx);
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), req);
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.rlp_signed_tx;
    }
    /**
     * Signs arbitrary messages. This uses ethers.js's [hashMessage](https://docs.ethers.org/v6/api/hashing/#hashMessage)
     * to compute the EIP-191 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        const digest = ethers_1.ethers.hashMessage(message);
        return this.signBlob(digest);
    }
    /**
     * Signs EIP-712 typed data. This uses ethers.js's
     * [TypedDataEncoder.hash](https://docs.ethers.org/v6/api/hashing/#TypedDataEncoder_hash)
     * to compute the EIP-712 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {TypedDataDomain} domain The domain of the typed data.
     * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
     * @param {Record<string, any>} value The value of the typed data.
     * @return {Promise<string>} The signature.
     */
    async signTypedData(domain, types, value) {
        const digest = ethers_1.TypedDataEncoder.hash(domain, types, value);
        return this.signBlob(digest);
    }
    /**
     * Sign arbitrary digest. This uses {@link Key#signBlob}.
     * @param {string} digest The digest to sign.
     * @return {Promise<string>} The signature.
     */
    async signBlob(digest) {
        const blobReq = {
            message_base64: Buffer.from((0, ethers_1.getBytes)(digest)).toString("base64"),
        };
        // Get the key corresponding to this address
        if (__classPrivateFieldGet(this, _Signer_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _Signer_signerSession, "f").keys()).find((k) => k.material_id === __classPrivateFieldGet(this, _Signer_address, "f"));
            if (key === undefined) {
                throw new Error(`Cannot access key '${__classPrivateFieldGet(this, _Signer_address, "f")}'`);
            }
            __classPrivateFieldSet(this, _Signer_key, key, "f");
        }
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signBlob(__classPrivateFieldGet(this, _Signer_key, "f").key_id, blobReq);
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        const signature = data.signature;
        (0, assert_1.default)(signature.startsWith("0x"));
        (0, assert_1.default)(signature.length == 132);
        const vAdj = (parseInt(signature.slice(130), 16) + 27).toString(16);
        return signature.slice(0, 130) + vAdj;
    }
    /**
     * Initialize the signing a message using MFA approvals. This method populates
     * missing fields. If the signing does not require MFA, this method throws.
     * @param {ethers.TransactionRequest} tx The transaction to send.
     * @return {string} The MFA id associated with the signing request.
     */
    async sendTransactionMfaInit(tx) {
        const popTx = await this.populateTransaction(tx);
        const req = await this.evmSignRequestFromTx(popTx);
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), req);
        return res.mfaId();
    }
    /**
     * Send a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will
     * execute.
     * @param {MfaRequestInfo} mfaInfo The approved MFA request.
     * @return {ethers.TransactionResponse} The result of submitting the transaction
     */
    async sendTransactionMfaApproved(mfaInfo) {
        if (!mfaInfo.request.path.includes("/eth1/sign/")) {
            throw new Error(`Expected EVM transaction signing request, got ${mfaInfo.request.path}`);
        }
        if (!mfaInfo.request.path.includes(__classPrivateFieldGet(this, _Signer_address, "f"))) {
            throw new Error(`Expected signing request for ${__classPrivateFieldGet(this, _Signer_address, "f")} but got ${mfaInfo.request.path}`);
        }
        const signedTx = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), mfaInfo.request.body, {
            mfaId: mfaInfo.id,
            mfaOrgId: __classPrivateFieldGet(this, _Signer_signerSession, "f").orgId,
            mfaConf: mfaInfo.receipt.confirmation,
        });
        return await this.provider.broadcastTransaction(signedTx.data().rlp_signed_tx);
    }
}
exports.Signer = Signer;
_Signer_address = new WeakMap(), _Signer_key = new WeakMap(), _Signer_signerSession = new WeakMap(), _Signer_onMfaPoll = new WeakMap(), _Signer_mfaPollIntervalMs = new WeakMap(), _Signer_instances = new WeakSet(), _Signer_handleMfa = 
/**
 * If the sign request requires MFA, this method waits for approvals
 * @param {CubeSignerResponse<U>} res The response of a sign request
 * @return {Promise<U>} The sign data after MFA approvals
 */
async function _Signer_handleMfa(res) {
    while (res.requiresMfa()) {
        await new Promise((resolve) => setTimeout(resolve, __classPrivateFieldGet(this, _Signer_mfaPollIntervalMs, "f")));
        const mfaId = res.mfaId();
        const mfaInfo = await __classPrivateFieldGet(this, _Signer_signerSession, "f").getMfaInfo(mfaId);
        __classPrivateFieldGet(this, _Signer_onMfaPoll, "f").call(this, mfaInfo);
        if (mfaInfo.receipt) {
            res = await res.signWithMfaApproval({
                mfaId,
                mfaOrgId: __classPrivateFieldGet(this, _Signer_signerSession, "f").orgId,
                mfaConf: mfaInfo.receipt.confirmation,
            });
        }
    }
    return res.data();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXRoZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQVFnQjtBQUtoQixvREFBNEI7QUFrQjVCOztHQUVHO0FBQ0gsTUFBYSxNQUFPLFNBQVEsZUFBTSxDQUFDLGNBQWM7SUFtQi9DOzs7OztPQUtHO0lBQ0gsWUFBWSxPQUF5QixFQUFFLGFBQTRCLEVBQUUsT0FBdUI7UUFDMUYsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQzs7UUF6QjNCLGlDQUFpQztRQUN4QixrQ0FBaUI7UUFFMUIsaUNBQWlDO1FBQ2pDLDhCQUFlO1FBRWYsNkJBQTZCO1FBQ3BCLHdDQUE4QjtRQUV2Qzs7O1dBR0c7UUFDTSxvQ0FBMkM7UUFFcEQsZ0VBQWdFO1FBQ3ZELDRDQUEyQjtRQVVsQyxJQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2hDLHVCQUFBLElBQUksbUJBQVksT0FBTyxNQUFBLENBQUM7UUFDMUIsQ0FBQzthQUFNLENBQUM7WUFDTix1QkFBQSxJQUFJLG1CQUFZLE9BQU8sQ0FBQyxVQUFVLE1BQUEsQ0FBQztZQUNuQyx1QkFBQSxJQUFJLGVBQVEsT0FBa0IsTUFBQSxDQUFDO1FBQ2pDLENBQUM7UUFDRCx1QkFBQSxJQUFJLHlCQUFrQixhQUFhLE1BQUEsQ0FBQztRQUNwQyx1QkFBQSxJQUFJLHFCQUFjLE9BQU8sRUFBRSxTQUFTLElBQUksQ0FBQyxFQUFDLDhCQUE4QixFQUFFLEVBQUUsR0FBRSxDQUFDLENBQUMsTUFBQSxDQUFDLENBQUMsMkRBQTJEO1FBQzdJLHVCQUFBLElBQUksNkJBQXNCLE9BQU8sRUFBRSxpQkFBaUIsSUFBSSxJQUFJLE1BQUEsQ0FBQztJQUMvRCxDQUFDO0lBRUQsc0NBQXNDO0lBQ3RDLEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyx1QkFBQSxJQUFJLHVCQUFT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TSxJQUFJLENBQUMsUUFBUyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNsRixDQUFDO0NBd0JGO0FBMU5ELHdCQTBOQzs7QUF0QkM7Ozs7R0FJRztBQUNILEtBQUssNEJBQWUsR0FBMEI7SUFDNUMsT0FBTyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztRQUN6QixNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLHVCQUFBLElBQUksaUNBQW1CLENBQUMsQ0FBQyxDQUFDO1FBRTdFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixNQUFNLE9BQU8sR0FBRyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUQsdUJBQUEsSUFBSSx5QkFBVyxNQUFmLElBQUksRUFBWSxPQUFPLENBQUMsQ0FBQztRQUN6QixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsbUJBQW1CLENBQUM7Z0JBQ2xDLEtBQUs7Z0JBQ0wsUUFBUSxFQUFFLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxLQUFLO2dCQUNuQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZO2FBQ3RDLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEpzb25ScGNBcGlQcm92aWRlcixcbiAgVHlwZWREYXRhRG9tYWluLFxuICBUeXBlZERhdGFFbmNvZGVyLFxuICBUeXBlZERhdGFGaWVsZCxcbiAgZXRoZXJzLFxuICBnZXRCeXRlcyxcbiAgdG9CZUhleCxcbn0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgU2lnbmVyU2Vzc2lvbiB9IGZyb20gXCIuLi9zaWduZXJfc2Vzc2lvblwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lclJlc3BvbnNlIH0gZnJvbSBcIi4uL3Jlc3BvbnNlXCI7XG5pbXBvcnQgeyBCbG9iU2lnblJlcXVlc3QsIEV2bVNpZ25SZXF1ZXN0LCBNZmFSZXF1ZXN0SW5mbyB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IEtleUluZm8gfSBmcm9tIFwiLi4va2V5XCI7XG5pbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmludGVyZmFjZSBTaWduZXJPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHByb3ZpZGVyIHRvIHVzZSAqL1xuICBwcm92aWRlcj86IG51bGwgfCBldGhlcnMuUHJvdmlkZXI7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIGV0aGVycy5qcyBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lclxuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyIGV4dGVuZHMgZXRoZXJzLkFic3RyYWN0U2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5ICNhZGRyZXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciBzaWduaW5nICovXG4gICNrZXk/OiBLZXlJbmZvO1xuXG4gIC8qKiBUaGUgdW5kZXJseWluZyBzZXNzaW9uICovXG4gIHJlYWRvbmx5ICNzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICByZWFkb25seSAjb25NZmFQb2xsOiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG5cbiAgLyoqIFRoZSBhbW91bnQgb2YgdGltZSB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBNRkEgdXBkYXRlcyAqL1xuICByZWFkb25seSAjbWZhUG9sbEludGVydmFsTXM6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtLZXlJbmZvIHwgc3RyaW5nfSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9ufSBzaWduZXJTZXNzaW9uIFRoZSB1bmRlcmx5aW5nIFNpZ25lciBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXlJbmZvIHwgc3RyaW5nLCBzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBvcHRpb25zPzogU2lnbmVyT3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnM/LnByb3ZpZGVyKTtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcyBhcyBLZXlJbmZvO1xuICAgIH1cbiAgICB0aGlzLiNzaWduZXJTZXNzaW9uID0gc2lnbmVyU2Vzc2lvbjtcbiAgICB0aGlzLiNvbk1mYVBvbGwgPSBvcHRpb25zPy5vbk1mYVBvbGwgPz8gKCgvKiBfbWZhSW5mbzogTWZhUmVxdWVzdEluZm8gKi8pID0+IHt9KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb25cbiAgICB0aGlzLiNtZmFQb2xsSW50ZXJ2YWxNcyA9IG9wdGlvbnM/Lm1mYVBvbGxJbnRlcnZhbE1zID8/IDEwMDA7XG4gIH1cblxuICAvKiogUmVzb2x2ZXMgdG8gdGhlIHNpZ25lciBhZGRyZXNzLiAqL1xuICBhc3luYyBnZXRBZGRyZXNzKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuI2FkZHJlc3M7XG4gIH1cblxuICAvKipcbiAgICogIFJldHVybnMgdGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gJSVwcm92aWRlciUlLlxuICAgKiAgQHBhcmFtIHtudWxsIHwgZXRoZXJzLlByb3ZpZGVyfSBwcm92aWRlciBUaGUgb3B0aW9uYWwgcHJvdmlkZXIgaW5zdGFuY2UgdG8gdXNlLlxuICAgKiAgQHJldHVybiB7U2lnbmVyfSBUaGUgc2lnbmVyIGNvbm5lY3RlZCB0byBzaWduZXIuXG4gICAqL1xuICBjb25uZWN0KHByb3ZpZGVyOiBudWxsIHwgZXRoZXJzLlByb3ZpZGVyKTogU2lnbmVyIHtcbiAgICByZXR1cm4gbmV3IFNpZ25lcih0aGlzLiNhZGRyZXNzLCB0aGlzLiNzaWduZXJTZXNzaW9uLCB7IHByb3ZpZGVyIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIHNpZ25pbmcgcmVxdWVzdCBmcm9tIGEgdHJhbnNhY3Rpb24uIFRoaXMgcG9wdWxhdGVzIHRoZSB0cmFuc2FjdGlvblxuICAgKiB0eXBlIHRvIGAweDAyYCAoRUlQLTE1NTkpIHVubGVzcyBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdH0gdHggVGhlIHRyYW5zYWN0aW9uXG4gICAqIEByZXR1cm4ge0V2bVNpZ25SZXF1ZXN0fSBUaGUgRVZNIHNpZ24gcmVxdWVzdCB0byBiZSBzZW50IHRvIEN1YmVTaWduZXJcbiAgICovXG4gIGFzeW5jIGV2bVNpZ25SZXF1ZXN0RnJvbVR4KHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxFdm1TaWduUmVxdWVzdD4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ/LnRvU3RyaW5nKCkgPz8gXCIxXCI7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCB0aGUgdHJhbnNhY3Rpb24gaW50byBhIEpTT04tUlBDIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgcnBjVHggPVxuICAgICAgdGhpcy5wcm92aWRlciBpbnN0YW5jZW9mIEpzb25ScGNBcGlQcm92aWRlclxuICAgICAgICA/IHRoaXMucHJvdmlkZXIuZ2V0UnBjVHJhbnNhY3Rpb24odHgpXG4gICAgICAgIDogLy8gV2UgY2FuIGp1c3QgY2FsbCB0aGUgZ2V0UnBjVHJhbnNhY3Rpb24gd2l0aCBhXG4gICAgICAgICAgLy8gbnVsbCByZWNlaXZlciBzaW5jZSBpdCBkb2Vzbid0IGFjdHVhbGx5IHVzZSBpdFxuICAgICAgICAgIC8vIChhbmQgcmVhbGx5IHNob3VsZCBiZSBkZWNsYXJlZCBzdGF0aWMpLlxuICAgICAgICAgIEpzb25ScGNBcGlQcm92aWRlci5wcm90b3R5cGUuZ2V0UnBjVHJhbnNhY3Rpb24uY2FsbChudWxsLCB0eCk7XG4gICAgcnBjVHgudHlwZSA9IHRvQmVIZXgodHgudHlwZSA/PyAweDAyLCAxKTsgLy8gd2UgZXhwZWN0IDB4MFswLTJdXG5cbiAgICByZXR1cm4gPEV2bVNpZ25SZXF1ZXN0PntcbiAgICAgIGNoYWluX2lkOiBOdW1iZXIoY2hhaW5JZCksXG4gICAgICB0eDogcnBjVHgsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgdHJhbnNhY3Rpb24uIFRoaXMgbWV0aG9kIHdpbGwgYmxvY2sgaWYgdGhlIGtleSByZXF1aXJlcyBNRkEgYXBwcm92YWwuXG4gICAqIEBwYXJhbSB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdH0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gSGV4LWVuY29kZWQgUkxQIGVuY29kaW5nIG9mIHRoZSB0cmFuc2FjdGlvbiBhbmQgaXRzIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UcmFuc2FjdGlvbih0eDogZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeCh0eCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKHRoaXMuI2FkZHJlc3MsIHJlcSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgZXRoZXJzLmpzJ3MgW2hhc2hNZXNzYWdlXShodHRwczovL2RvY3MuZXRoZXJzLm9yZy92Ni9hcGkvaGFzaGluZy8jaGFzaE1lc3NhZ2UpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC0xOTEgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtzdHJpbmcgfCBVaW50OEFycmF5fSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZyB8IFVpbnQ4QXJyYXkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IGV0aGVycy5oYXNoTWVzc2FnZShtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5zaWduQmxvYihkaWdlc3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIGV0aGVycy5qcydzXG4gICAqIFtUeXBlZERhdGFFbmNvZGVyLmhhc2hdKGh0dHBzOi8vZG9jcy5ldGhlcnMub3JnL3Y2L2FwaS9oYXNoaW5nLyNUeXBlZERhdGFFbmNvZGVyX2hhc2gpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC03MTIgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IFR5cGVkRGF0YUVuY29kZXIuaGFzaChkb21haW4sIHR5cGVzLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMuc2lnbkJsb2IoZGlnZXN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFyYml0cmFyeSBkaWdlc3QuIFRoaXMgdXNlcyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGRpZ2VzdCBUaGUgZGlnZXN0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc2lnbkJsb2IoZGlnZXN0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGJsb2JSZXEgPSA8QmxvYlNpZ25SZXF1ZXN0PntcbiAgICAgIG1lc3NhZ2VfYmFzZTY0OiBCdWZmZXIuZnJvbShnZXRCeXRlcyhkaWdlc3QpKS50b1N0cmluZyhcImJhc2U2NFwiKSxcbiAgICB9O1xuICAgIC8vIEdldCB0aGUga2V5IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBhZGRyZXNzXG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5rZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxfaWQgPT09IHRoaXMuI2FkZHJlc3MpO1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGFjY2VzcyBrZXkgJyR7dGhpcy4jYWRkcmVzc30nYCk7XG4gICAgICB9XG4gICAgICB0aGlzLiNrZXkgPSBrZXk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduQmxvYih0aGlzLiNrZXkua2V5X2lkLCBibG9iUmVxKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG5cbiAgICBjb25zdCBzaWduYXR1cmUgPSBkYXRhLnNpZ25hdHVyZTtcbiAgICBhc3NlcnQoc2lnbmF0dXJlLnN0YXJ0c1dpdGgoXCIweFwiKSk7XG4gICAgYXNzZXJ0KHNpZ25hdHVyZS5sZW5ndGggPT0gMTMyKTtcbiAgICBjb25zdCB2QWRqID0gKHBhcnNlSW50KHNpZ25hdHVyZS5zbGljZSgxMzApLCAxNikgKyAyNykudG9TdHJpbmcoMTYpO1xuICAgIHJldHVybiBzaWduYXR1cmUuc2xpY2UoMCwgMTMwKSArIHZBZGo7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgc2lnbmluZyBhIG1lc3NhZ2UgdXNpbmcgTUZBIGFwcHJvdmFscy4gVGhpcyBtZXRob2QgcG9wdWxhdGVzXG4gICAqIG1pc3NpbmcgZmllbGRzLiBJZiB0aGUgc2lnbmluZyBkb2VzIG5vdCByZXF1aXJlIE1GQSwgdGhpcyBtZXRob2QgdGhyb3dzLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzZW5kLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoZSBzaWduaW5nIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFJbml0KHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBwb3BUeCA9IGF3YWl0IHRoaXMucG9wdWxhdGVUcmFuc2FjdGlvbih0eCk7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeChwb3BUeCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKHRoaXMuI2FkZHJlc3MsIHJlcSk7XG4gICAgcmV0dXJuIHJlcy5tZmFJZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbFxuICAgKiBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3RJbmZvfSBtZmFJbmZvIFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVzcG9uc2V9IFRoZSByZXN1bHQgb2Ygc3VibWl0dGluZyB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYUluZm86IE1mYVJlcXVlc3RJbmZvKTogUHJvbWlzZTxldGhlcnMuVHJhbnNhY3Rpb25SZXNwb25zZT4ge1xuICAgIGlmICghbWZhSW5mby5yZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgaWYgKCFtZmFJbmZvLnJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgc2lnbmluZyByZXF1ZXN0IGZvciAke3RoaXMuI2FkZHJlc3N9IGJ1dCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduZWRUeCA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bShcbiAgICAgIHRoaXMuI2FkZHJlc3MsXG4gICAgICBtZmFJbmZvLnJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCxcbiAgICAgIHtcbiAgICAgICAgbWZhSWQ6IG1mYUluZm8uaWQsXG4gICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQhLmNvbmZpcm1hdGlvbixcbiAgICAgIH0sXG4gICAgKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm92aWRlciEuYnJvYWRjYXN0VHJhbnNhY3Rpb24oc2lnbmVkVHguZGF0YSgpLnJscF9zaWduZWRfdHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IEN1YmVTaWduZXJSZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jbWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSWQgPSByZXMubWZhSWQoKTtcbiAgICAgIGNvbnN0IG1mYUluZm8gPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLmdldE1mYUluZm8obWZhSWQpO1xuICAgICAgdGhpcy4jb25NZmFQb2xsKG1mYUluZm8pO1xuICAgICAgaWYgKG1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgICByZXMgPSBhd2FpdCByZXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7XG4gICAgICAgICAgbWZhSWQsXG4gICAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI3NpZ25lclNlc3Npb24ub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=