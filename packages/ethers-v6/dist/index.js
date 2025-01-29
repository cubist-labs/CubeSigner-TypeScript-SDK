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
var _Signer_signer;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
const ethers_1 = require("ethers");
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.AbstractSigner {
    /**
     * Create new Signer instance
     *
     * @param address The key or the eth address of the account to use.
     * @param client The underlying client.
     * @param options The options to use for the Signer instance
     */
    constructor(address, client, options) {
        super(options?.provider);
        /** The CubeSigner-backed ethers signer */
        _Signer_signer.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_signer, new cubesigner_sdk_1.EvmSigner(address, client, options), "f");
    }
    /** @returns The checksummed signer address. */
    async getAddress() {
        return ethers_1.ethers.getAddress(__classPrivateFieldGet(this, _Signer_signer, "f").address);
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *
     *  @param provider The optional provider instance to use.
     *  @returns The signer connected to signer.
     */
    connect(provider) {
        return new Signer(__classPrivateFieldGet(this, _Signer_signer, "f").address, __classPrivateFieldGet(this, _Signer_signer, "f").client, {
            ...__classPrivateFieldGet(this, _Signer_signer, "f").options,
            provider,
        });
    }
    /**
     * Construct a signing request from a transaction. This populates the transaction
     * type to `0x02` (EIP-1559) unless set.
     *
     * @param tx The transaction
     * @returns The EVM sign request to be sent to CubeSigner
     */
    async evmSignRequestFromTx(tx) {
        // get the chain id from the network or tx
        let chainId = tx.chainId;
        if (chainId === undefined) {
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId?.toString();
            if (chainId === undefined) {
                throw new Error("Cannot determine chainId");
            }
        }
        // Convert the transaction into a JSON-RPC transaction
        const rpcTx = this.provider instanceof ethers_1.JsonRpcApiProvider
            ? this.provider.getRpcTransaction(tx)
            : // We can just call the getRpcTransaction with a
                // null receiver since it doesn't actually use it
                // (and really should be declared static).
                ethers_1.JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
        if (!rpcTx.type) {
            rpcTx.type = rpcTx.gasPrice ? "0x00" : "0x02";
        }
        else {
            rpcTx.type = (0, ethers_1.toBeHex)(rpcTx.type, 1);
        }
        return {
            chain_id: Number(chainId),
            tx: rpcTx,
        };
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     *
     * @param tx The transaction to sign.
     * @returns Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
        const req = await this.evmSignRequestFromTx(tx);
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signTransaction(req);
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param message The message to sign.
     * @returns The signature.
     */
    async signMessage(message) {
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signEip191({
            data: (0, cubesigner_sdk_1.encodeToHex)(message),
        });
    }
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     *
     * @param domain The domain of the typed data.
     * @param types The types of the typed data.
     * @param value The value of the typed data.
     * @returns The signature.
     */
    async signTypedData(domain, types, value) {
        let chainId = domain.chainId;
        if (chainId === undefined) {
            // get chain id from provider
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId;
            if (chainId === undefined) {
                throw new Error("Cannot determine chainId");
            }
        }
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signEip712({
            chain_id: Number(chainId),
            typed_data: ethers_1.TypedDataEncoder.getPayload(domain, types, value),
        });
    }
    /**
     * Initialize the signing a message using MFA approvals. This method populates
     * missing fields. If the signing does not require MFA, this method throws.
     *
     * @param tx The transaction to send.
     * @returns The MFA id associated with the signing request.
     */
    async sendTransactionMfaInit(tx) {
        const popTx = await this.populateTransaction(tx);
        const req = await this.evmSignRequestFromTx(popTx);
        const res = await __classPrivateFieldGet(this, _Signer_signer, "f").signEvm(req);
        return res.mfaId();
    }
    /**
     * Send a transaction from an approved MFA request. The MFA request contains
     * information about the approved signing request, which this method will
     * execute.
     *
     * @param mfaRequest The approved MFA request.
     * @returns The result of submitting the transaction
     */
    async sendTransactionMfaApproved(mfaRequest) {
        const rlpSigned = await __classPrivateFieldGet(this, _Signer_signer, "f").signTransactionMfaApproved(mfaRequest);
        return await this.provider.broadcastTransaction(rlpSigned);
    }
}
exports.Signer = Signer;
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsbUNBQStFO0FBVS9FLGdFQUFxRTtBQVFyRTs7R0FFRztBQUNILE1BQWEsTUFBTyxTQUFRLGVBQU0sQ0FBQyxjQUFjO0lBSS9DOzs7Ozs7T0FNRztJQUNILFlBQVksT0FBcUIsRUFBRSxNQUF3QixFQUFFLE9BQXVCO1FBQ2xGLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFYM0IsMENBQTBDO1FBQ2pDLGlDQUFtQjtRQVcxQix1QkFBQSxJQUFJLGtCQUFXLElBQUksMEJBQVMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFBLENBQUM7SUFDekQsQ0FBQztJQUVELCtDQUErQztJQUMvQyxLQUFLLENBQUMsVUFBVTtRQUNkLE9BQU8sZUFBTSxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsT0FBTyxDQUFDLFFBQWdDO1FBQ3RDLE9BQU8sSUFBSSxNQUFNLENBQUMsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE9BQU8sRUFBRSx1QkFBQSxJQUFJLHNCQUFRLENBQUMsTUFBTSxFQUFFO1lBQzNELEdBQUcsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE9BQU87WUFDdkIsUUFBUTtTQUNULENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBNkI7UUFDdEQsMENBQTBDO1FBQzFDLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDekIsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFB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QUcsR0FBRyxNQUFNLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUMsT0FBTyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsMEJBQTBCLENBQUMsVUFBc0I7UUFDckQsTUFBTSxTQUFTLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFRLENBQUMsMEJBQTBCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUUsT0FBTyxNQUFNLElBQUksQ0FBQyxRQUFTLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUQsQ0FBQztDQUNGO0FBM0pELHdCQTJKQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVHlwZWREYXRhRG9tYWluLCBUeXBlZERhdGFGaWVsZCB9IGZyb20gXCJldGhlcnNcIjtcbmltcG9ydCB7IEpzb25ScGNBcGlQcm92aWRlciwgVHlwZWREYXRhRW5jb2RlciwgZXRoZXJzLCB0b0JlSGV4IH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHR5cGUge1xuICBFdm1TaWduZXJPcHRpb25zLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBDdWJlU2lnbmVyQ2xpZW50LFxuICBLZXksXG4gIE1mYVJlcXVlc3QsXG59IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IEV2bVNpZ25lciwgZW5jb2RlVG9IZXggfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5cbi8qKiBPcHRpb25zIGZvciB0aGUgc2lnbmVyICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25lck9wdGlvbnMgZXh0ZW5kcyBFdm1TaWduZXJPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHByb3ZpZGVyIHRvIHVzZSAqL1xuICBwcm92aWRlcj86IG51bGwgfCBldGhlcnMuUHJvdmlkZXI7XG59XG5cbi8qKlxuICogQSBldGhlcnMuanMgU2lnbmVyIHVzaW5nIEN1YmVTaWduZXJcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ25lciBleHRlbmRzIGV0aGVycy5BYnN0cmFjdFNpZ25lciB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lci1iYWNrZWQgZXRoZXJzIHNpZ25lciAqL1xuICByZWFkb25seSAjc2lnbmVyOiBFdm1TaWduZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGNsaWVudCBUaGUgdW5kZXJseWluZyBjbGllbnQuXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5IHwgc3RyaW5nLCBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG9wdGlvbnM/OiBTaWduZXJPcHRpb25zKSB7XG4gICAgc3VwZXIob3B0aW9ucz8ucHJvdmlkZXIpO1xuICAgIHRoaXMuI3NpZ25lciA9IG5ldyBFdm1TaWduZXIoYWRkcmVzcywgY2xpZW50LCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgY2hlY2tzdW1tZWQgc2lnbmVyIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gZXRoZXJzLmdldEFkZHJlc3ModGhpcy4jc2lnbmVyLmFkZHJlc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICpcbiAgICogIEBwYXJhbSBwcm92aWRlciBUaGUgb3B0aW9uYWwgcHJvdmlkZXIgaW5zdGFuY2UgdG8gdXNlLlxuICAgKiAgQHJldHVybnMgVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogbnVsbCB8IGV0aGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jc2lnbmVyLmFkZHJlc3MsIHRoaXMuI3NpZ25lci5jbGllbnQsIHtcbiAgICAgIC4uLnRoaXMuI3NpZ25lci5vcHRpb25zLFxuICAgICAgcHJvdmlkZXIsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgc2lnbmluZyByZXF1ZXN0IGZyb20gYSB0cmFuc2FjdGlvbi4gVGhpcyBwb3B1bGF0ZXMgdGhlIHRyYW5zYWN0aW9uXG4gICAqIHR5cGUgdG8gYDB4MDJgIChFSVAtMTU1OSkgdW5sZXNzIHNldC5cbiAgICpcbiAgICogQHBhcmFtIHR4IFRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJucyBUaGUgRVZNIHNpZ24gcmVxdWVzdCB0byBiZSBzZW50IHRvIEN1YmVTaWduZXJcbiAgICovXG4gIGFzeW5jIGV2bVNpZ25SZXF1ZXN0RnJvbVR4KHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxFdm1TaWduUmVxdWVzdD4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ/LnRvU3RyaW5nKCk7XG4gICAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0IHRoZSB0cmFuc2FjdGlvbiBpbnRvIGEgSlNPTi1SUEMgdHJhbnNhY3Rpb25cbiAgICBjb25zdCBycGNUeCA9XG4gICAgICB0aGlzLnByb3ZpZGVyIGluc3RhbmNlb2YgSnNvblJwY0FwaVByb3ZpZGVyXG4gICAgICAgID8gdGhpcy5wcm92aWRlci5nZXRScGNUcmFuc2FjdGlvbih0eClcbiAgICAgICAgOiAvLyBXZSBjYW4ganVzdCBjYWxsIHRoZSBnZXRScGNUcmFuc2FjdGlvbiB3aXRoIGFcbiAgICAgICAgICAvLyBudWxsIHJlY2VpdmVyIHNpbmNlIGl0IGRvZXNuJ3QgYWN0dWFsbHkgdXNlIGl0XG4gICAgICAgICAgLy8gKGFuZCByZWFsbHkgc2hvdWxkIGJlIGRlY2xhcmVkIHN0YXRpYykuXG4gICAgICAgICAgSnNvblJwY0FwaVByb3ZpZGVyLnByb3RvdHlwZS5nZXRScGNUcmFuc2FjdGlvbi5jYWxsKG51bGwsIHR4KTtcblxuICAgIGlmICghcnBjVHgudHlwZSkge1xuICAgICAgcnBjVHgudHlwZSA9IHJwY1R4Lmdhc1ByaWNlID8gXCIweDAwXCIgOiBcIjB4MDJcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgcnBjVHgudHlwZSA9IHRvQmVIZXgocnBjVHgudHlwZSwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIDxFdm1TaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHg6IHJwY1R4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcGFyYW0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ24uXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgodHgpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXIuc2lnblRyYW5zYWN0aW9uKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ24uXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcgfCBVaW50OEFycmF5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25FaXAxOTEoPEVpcDE5MVNpZ25SZXF1ZXN0PntcbiAgICAgIGRhdGE6IGVuY29kZVRvSGV4KG1lc3NhZ2UpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtNzEyIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDcxMlNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gZG9tYWluIFRoZSBkb21haW4gb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB0eXBlcyBUaGUgdHlwZXMgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm5zIFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHlwZWREYXRhKFxuICAgIGRvbWFpbjogVHlwZWREYXRhRG9tYWluLFxuICAgIHR5cGVzOiBSZWNvcmQ8c3RyaW5nLCBBcnJheTxUeXBlZERhdGFGaWVsZD4+LFxuICAgIHZhbHVlOiBSZWNvcmQ8c3RyaW5nLCBhbnk+LCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBsZXQgY2hhaW5JZCA9IGRvbWFpbi5jaGFpbklkO1xuICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIGdldCBjaGFpbiBpZCBmcm9tIHByb3ZpZGVyXG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ7XG4gICAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25FaXA3MTIoPEVpcDcxMlNpZ25SZXF1ZXN0PntcbiAgICAgIGNoYWluX2lkOiBOdW1iZXIoY2hhaW5JZCksXG4gICAgICB0eXBlZF9kYXRhOiBUeXBlZERhdGFFbmNvZGVyLmdldFBheWxvYWQoZG9tYWluLCB0eXBlcywgdmFsdWUpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHNpZ25pbmcgYSBtZXNzYWdlIHVzaW5nIE1GQSBhcHByb3ZhbHMuIFRoaXMgbWV0aG9kIHBvcHVsYXRlc1xuICAgKiBtaXNzaW5nIGZpZWxkcy4gSWYgdGhlIHNpZ25pbmcgZG9lcyBub3QgcmVxdWlyZSBNRkEsIHRoaXMgbWV0aG9kIHRocm93cy5cbiAgICpcbiAgICogQHBhcmFtIHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzZW5kLlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2lnbmluZyByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgc2VuZFRyYW5zYWN0aW9uTWZhSW5pdCh0eDogZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcG9wVHggPSBhd2FpdCB0aGlzLnBvcHVsYXRlVHJhbnNhY3Rpb24odHgpO1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgocG9wVHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRXZtKHJlcSk7XG4gICAgcmV0dXJuIHJlcy5tZmFJZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbFxuICAgKiBleGVjdXRlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVxdWVzdCBUaGUgYXBwcm92ZWQgTUZBIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2Ygc3VibWl0dGluZyB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYVJlcXVlc3Q6IE1mYVJlcXVlc3QpOiBQcm9taXNlPGV0aGVycy5UcmFuc2FjdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgcmxwU2lnbmVkID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25UcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYVJlcXVlc3QpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnByb3ZpZGVyIS5icm9hZGNhc3RUcmFuc2FjdGlvbihybHBTaWduZWQpO1xuICB9XG59XG4iXX0=