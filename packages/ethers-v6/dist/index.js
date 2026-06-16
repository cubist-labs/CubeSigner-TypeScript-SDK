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
import { JsonRpcApiProvider, TypedDataEncoder, ethers, toBeHex } from "ethers";
import { EvmSigner, encodeToHex } from "@cubist-labs/cubesigner-sdk";
/**
 * A ethers.js Signer using CubeSigner
 */
export class Signer extends ethers.AbstractSigner {
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
        __classPrivateFieldSet(this, _Signer_signer, new EvmSigner(address, client, options), "f");
    }
    /** @returns The checksummed signer address. */
    async getAddress() {
        return ethers.getAddress(__classPrivateFieldGet(this, _Signer_signer, "f").address);
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
        const rpcTx = this.provider instanceof JsonRpcApiProvider
            ? this.provider.getRpcTransaction(tx)
            : // We can just call the getRpcTransaction with a
                // null receiver since it doesn't actually use it
                // (and really should be declared static).
                JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
        if (!rpcTx.type) {
            rpcTx.type = rpcTx.gasPrice ? "0x00" : "0x02";
        }
        else {
            rpcTx.type = toBeHex(rpcTx.type, 1);
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
            data: encodeToHex(message),
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
            typed_data: TypedDataEncoder.getPayload(domain, types, value),
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
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQ0EsT0FBTyxFQUFFLGtCQUFrQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFVL0UsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQVFwRTs7R0FFRztBQUNILE1BQU0sT0FBTyxNQUFPLFNBQVEsTUFBTSxDQUFDLGNBQWM7SUFJL0M7Ozs7OztPQU1HO0lBQ0gsWUFBWSxPQUFxQixFQUFFLE1BQXdCLEVBQUUsT0FBdUI7UUFDbEYsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQVgzQiwwQ0FBMEM7UUFDakMsaUNBQW1CO1FBVzFCLHVCQUFBLElBQUksa0JBQVcsSUFBSSxTQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBQSxDQUFDO0lBQ3pELENBQUM7SUFFRCwrQ0FBK0M7SUFDL0MsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE9BQU8sQ0FBQyxRQUFnQztRQUN0QyxPQUFPLElBQUksTUFBTSxDQUFDLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLEVBQUUsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE1BQU0sRUFBRTtZQUMzRCxHQUFHLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPO1lBQ3ZCLFFBQVE7U0FDVCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQTZCO1FBQ3RELDBDQUEwQztRQUMxQyxJQUFJLE9BQU8sR0FBRyxFQUFFLENB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RUFBRSxDQUFDLENBQUM7UUFDakQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkQsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLHNCQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLE9BQU8sR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLDBCQUEwQixDQUFDLFVBQXNCO1FBQ3JELE1BQU0sU0FBUyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBUSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVFLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzlELENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgVHlwZWREYXRhRG9tYWluLCBUeXBlZERhdGFGaWVsZCB9IGZyb20gXCJldGhlcnNcIjtcbmltcG9ydCB7IEpzb25ScGNBcGlQcm92aWRlciwgVHlwZWREYXRhRW5jb2RlciwgZXRoZXJzLCB0b0JlSGV4IH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHR5cGUge1xuICBFdm1TaWduZXJPcHRpb25zLFxuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBDdWJlU2lnbmVyQ2xpZW50LFxuICBLZXksXG4gIE1mYVJlcXVlc3QsXG59IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgRXZtU2lnbmVyLCBlbmNvZGVUb0hleCB9IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHNpZ25lciAqL1xuZXhwb3J0IGludGVyZmFjZSBTaWduZXJPcHRpb25zIGV4dGVuZHMgRXZtU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBwcm92aWRlciB0byB1c2UgKi9cbiAgcHJvdmlkZXI/OiBudWxsIHwgZXRoZXJzLlByb3ZpZGVyO1xufVxuXG4vKipcbiAqIEEgZXRoZXJzLmpzIFNpZ25lciB1c2luZyBDdWJlU2lnbmVyXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXIgZXh0ZW5kcyBldGhlcnMuQWJzdHJhY3RTaWduZXIge1xuICAvKiogVGhlIEN1YmVTaWduZXItYmFja2VkIGV0aGVycyBzaWduZXIgKi9cbiAgcmVhZG9ubHkgI3NpZ25lcjogRXZtU2lnbmVyO1xuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IFNpZ25lciBpbnN0YW5jZVxuICAgKlxuICAgKiBAcGFyYW0gYWRkcmVzcyBUaGUga2V5IG9yIHRoZSBldGggYWRkcmVzcyBvZiB0aGUgYWNjb3VudCB0byB1c2UuXG4gICAqIEBwYXJhbSBjbGllbnQgVGhlIHVuZGVybHlpbmcgY2xpZW50LlxuICAgKiBAcGFyYW0gb3B0aW9ucyBUaGUgb3B0aW9ucyB0byB1c2UgZm9yIHRoZSBTaWduZXIgaW5zdGFuY2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFkZHJlc3M6IEtleSB8IHN0cmluZywgY2xpZW50OiBDdWJlU2lnbmVyQ2xpZW50LCBvcHRpb25zPzogU2lnbmVyT3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnM/LnByb3ZpZGVyKTtcbiAgICB0aGlzLiNzaWduZXIgPSBuZXcgRXZtU2lnbmVyKGFkZHJlc3MsIGNsaWVudCwgb3B0aW9ucyk7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIGNoZWNrc3VtbWVkIHNpZ25lciBhZGRyZXNzLiAqL1xuICBhc3luYyBnZXRBZGRyZXNzKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGV0aGVycy5nZXRBZGRyZXNzKHRoaXMuI3NpZ25lci5hZGRyZXNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAgUmV0dXJucyB0aGUgc2lnbmVyIGNvbm5lY3RlZCB0byAlJXByb3ZpZGVyJSUuXG4gICAqXG4gICAqICBAcGFyYW0gcHJvdmlkZXIgVGhlIG9wdGlvbmFsIHByb3ZpZGVyIGluc3RhbmNlIHRvIHVzZS5cbiAgICogIEByZXR1cm5zIFRoZSBzaWduZXIgY29ubmVjdGVkIHRvIHNpZ25lci5cbiAgICovXG4gIGNvbm5lY3QocHJvdmlkZXI6IG51bGwgfCBldGhlcnMuUHJvdmlkZXIpOiBTaWduZXIge1xuICAgIHJldHVybiBuZXcgU2lnbmVyKHRoaXMuI3NpZ25lci5hZGRyZXNzLCB0aGlzLiNzaWduZXIuY2xpZW50LCB7XG4gICAgICAuLi50aGlzLiNzaWduZXIub3B0aW9ucyxcbiAgICAgIHByb3ZpZGVyLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIHNpZ25pbmcgcmVxdWVzdCBmcm9tIGEgdHJhbnNhY3Rpb24uIFRoaXMgcG9wdWxhdGVzIHRoZSB0cmFuc2FjdGlvblxuICAgKiB0eXBlIHRvIGAweDAyYCAoRUlQLTE1NTkpIHVubGVzcyBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBUaGUgdHJhbnNhY3Rpb25cbiAgICogQHJldHVybnMgVGhlIEVWTSBzaWduIHJlcXVlc3QgdG8gYmUgc2VudCB0byBDdWJlU2lnbmVyXG4gICAqL1xuICBhc3luYyBldm1TaWduUmVxdWVzdEZyb21UeCh0eDogZXRoZXJzLlRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8RXZtU2lnblJlcXVlc3Q+IHtcbiAgICAvLyBnZXQgdGhlIGNoYWluIGlkIGZyb20gdGhlIG5ldHdvcmsgb3IgdHhcbiAgICBsZXQgY2hhaW5JZCA9IHR4LmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkPy50b1N0cmluZygpO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCB0aGUgdHJhbnNhY3Rpb24gaW50byBhIEpTT04tUlBDIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgcnBjVHggPVxuICAgICAgdGhpcy5wcm92aWRlciBpbnN0YW5jZW9mIEpzb25ScGNBcGlQcm92aWRlclxuICAgICAgICA/IHRoaXMucHJvdmlkZXIuZ2V0UnBjVHJhbnNhY3Rpb24odHgpXG4gICAgICAgIDogLy8gV2UgY2FuIGp1c3QgY2FsbCB0aGUgZ2V0UnBjVHJhbnNhY3Rpb24gd2l0aCBhXG4gICAgICAgICAgLy8gbnVsbCByZWNlaXZlciBzaW5jZSBpdCBkb2Vzbid0IGFjdHVhbGx5IHVzZSBpdFxuICAgICAgICAgIC8vIChhbmQgcmVhbGx5IHNob3VsZCBiZSBkZWNsYXJlZCBzdGF0aWMpLlxuICAgICAgICAgIEpzb25ScGNBcGlQcm92aWRlci5wcm90b3R5cGUuZ2V0UnBjVHJhbnNhY3Rpb24uY2FsbChudWxsLCB0eCk7XG5cbiAgICBpZiAoIXJwY1R4LnR5cGUpIHtcbiAgICAgIHJwY1R4LnR5cGUgPSBycGNUeC5nYXNQcmljZSA/IFwiMHgwMFwiIDogXCIweDAyXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJwY1R4LnR5cGUgPSB0b0JlSGV4KHJwY1R4LnR5cGUsIDEpO1xuICAgIH1cblxuICAgIHJldHVybiA8RXZtU2lnblJlcXVlc3Q+e1xuICAgICAgY2hhaW5faWQ6IE51bWJlcihjaGFpbklkKSxcbiAgICAgIHR4OiBycGNUeCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICpcbiAgICogQHBhcmFtIHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJucyBIZXgtZW5jb2RlZCBSTFAgZW5jb2Rpbmcgb2YgdGhlIHRyYW5zYWN0aW9uIGFuZCBpdHMgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uKHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KHR4KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25UcmFuc2FjdGlvbihyZXEpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSBUaGUgbWVzc2FnZSB0byBzaWduLlxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nIHwgVWludDhBcnJheSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwMTkxKDxFaXAxOTFTaWduUmVxdWVzdD57XG4gICAgICBkYXRhOiBlbmNvZGVUb0hleChtZXNzYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0gdHlwZXMgVGhlIHR5cGVzIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblR5cGVkRGF0YShcbiAgICBkb21haW46IFR5cGVkRGF0YURvbWFpbixcbiAgICB0eXBlczogUmVjb3JkPHN0cmluZywgQXJyYXk8VHlwZWREYXRhRmllbGQ+PixcbiAgICB2YWx1ZTogUmVjb3JkPHN0cmluZywgYW55PiwgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgbGV0IGNoYWluSWQgPSBkb21haW4uY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBnZXQgY2hhaW4gaWQgZnJvbSBwcm92aWRlclxuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI3NpZ25lci5zaWduRWlwNzEyKDxFaXA3MTJTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHlwZWRfZGF0YTogVHlwZWREYXRhRW5jb2Rlci5nZXRQYXlsb2FkKGRvbWFpbiwgdHlwZXMsIHZhbHVlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSBzaWduaW5nIGEgbWVzc2FnZSB1c2luZyBNRkEgYXBwcm92YWxzLiBUaGlzIG1ldGhvZCBwb3B1bGF0ZXNcbiAgICogbWlzc2luZyBmaWVsZHMuIElmIHRoZSBzaWduaW5nIGRvZXMgbm90IHJlcXVpcmUgTUZBLCB0aGlzIG1ldGhvZCB0aHJvd3MuXG4gICAqXG4gICAqIEBwYXJhbSB0eCBUaGUgdHJhbnNhY3Rpb24gdG8gc2VuZC5cbiAgICogQHJldHVybnMgVGhlIE1GQSBpZCBhc3NvY2lhdGVkIHdpdGggdGhlIHNpZ25pbmcgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUluaXQodHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IHBvcFR4ID0gYXdhaXQgdGhpcy5wb3B1bGF0ZVRyYW5zYWN0aW9uKHR4KTtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KHBvcFR4KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkV2bShyZXEpO1xuICAgIHJldHVybiByZXMubWZhSWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBhcHByb3ZlZCBNRkEgcmVxdWVzdC4gVGhlIE1GQSByZXF1ZXN0IGNvbnRhaW5zXG4gICAqIGluZm9ybWF0aW9uIGFib3V0IHRoZSBhcHByb3ZlZCBzaWduaW5nIHJlcXVlc3QsIHdoaWNoIHRoaXMgbWV0aG9kIHdpbGxcbiAgICogZXhlY3V0ZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlcXVlc3QgVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHN1Ym1pdHRpbmcgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0OiBNZmFSZXF1ZXN0KTogUHJvbWlzZTxldGhlcnMuVHJhbnNhY3Rpb25SZXNwb25zZT4ge1xuICAgIGNvbnN0IHJscFNpZ25lZCA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm92aWRlciEuYnJvYWRjYXN0VHJhbnNhY3Rpb24ocmxwU2lnbmVkKTtcbiAgfVxufVxuIl19