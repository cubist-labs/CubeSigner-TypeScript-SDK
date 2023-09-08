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
var _Signer_address, _Signer_key, _Signer_signerSession;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signer = void 0;
const ethers_1 = require("ethers");
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.AbstractSigner {
    /** Create new Signer instance
     * @param {string} address The address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {null | ethers.Provider} provider The optional provider instance to use.
     */
    constructor(address, signerSession, provider) {
        super(provider);
        /** The address of the account */
        _Signer_address.set(this, void 0);
        /** The key to use for signing */
        _Signer_key.set(this, void 0);
        /** The underlying session */
        _Signer_signerSession.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_address, address, "f");
        __classPrivateFieldSet(this, _Signer_signerSession, signerSession, "f");
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
        return new Signer(__classPrivateFieldGet(this, _Signer_address, "f"), __classPrivateFieldGet(this, _Signer_signerSession, "f"), provider);
    }
    /**
     * Signs a transaction. This populates the transaction type to `0x02` (EIP-1559) unless set.
     * @param {ethers.TransactionRequest} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
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
        const req = {
            chain_id: Number(chainId),
            tx: rpcTx,
        };
        const sig = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), req);
        return sig.data().rlp_signed_tx;
    }
    /** Signs arbitrary messages. This uses ethers.js's [hashMessage](https://docs.ethers.org/v6/api/hashing/#hashMessage)
     * to compute the EIP-191 digest and signs this digest using {@link Key#signBlob}.
     * The key (for this session) must have the `"AllowRawBlobSigning"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        const digest = ethers_1.ethers.hashMessage(message);
        return this.signBlob(digest);
    }
    /** Signs EIP-712 typed data. This uses ethers.js's
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
    /** Sign arbitrary digest. This uses {@link Key#signBlob}.
     * @param {string} digest The digest to sign.
     * @return {Promise<string>} The signature.
     */
    async signBlob(digest) {
        const blobReq = {
            message_base64: Buffer.from((0, ethers_1.getBytes)(digest)).toString("base64"),
        };
        // Get the key corresponding to this address
        if (__classPrivateFieldGet(this, _Signer_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _Signer_signerSession, "f").keys()).find((k) => k.materialId === __classPrivateFieldGet(this, _Signer_address, "f"));
            if (key === undefined) {
                throw new Error(`Cannot access key '${__classPrivateFieldGet(this, _Signer_address, "f")}'`);
            }
            __classPrivateFieldSet(this, _Signer_key, key, "f");
        }
        // sign
        const result = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signBlob(__classPrivateFieldGet(this, _Signer_key, "f"), blobReq);
        return result.data().signature;
    }
}
exports.Signer = Signer;
_Signer_address = new WeakMap(), _Signer_key = new WeakMap(), _Signer_signerSession = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvZXRoZXJzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQVFnQjtBQUloQjs7R0FFRztBQUNILE1BQWEsTUFBTyxTQUFRLGVBQU0sQ0FBQyxjQUFjO0lBVS9DOzs7O09BSUc7SUFDSCxZQUFZLE9BQWUsRUFBRSxhQUE0QixFQUFFLFFBQWlDO1FBQzFGLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztRQWZsQixpQ0FBaUM7UUFDeEIsa0NBQWlCO1FBRTFCLGlDQUFpQztRQUNqQyw4QkFBVztRQUVYLDZCQUE2QjtRQUNwQix3Q0FBOEI7UUFTckMsdUJBQUEsSUFBSSxtQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUN4Qix1QkFBQSxJQUFJLHlCQUFrQixhQUFhLE1BQUEsQ0FBQztJQUN0QyxDQUFDO0lBRUQsc0NBQXNDO0lBQ3RDLEtBQUssQ0FBQyxVQUFVO1FBQ2QsT0FBTyx1QkFBQSxJQUFJLHVCQUFTLENBQUM7SUFDdkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxPQUFPLENBQUMsUUFBZ0M7UUFDdEMsT0FBTyxJQUFJLE1BQU0sQ0FBQyx1QkFBQSxJQUFJLHVCQUFTLEVBQUUsdUJBQUEsSUFBSSw2QkFBZSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUE2QjtRQUNqRCwwQ0FBMEM7UUFDMUMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQztRQUN6QixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUU7WUFDekIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDO1lBQ2xELE9BQU8sR0FBRyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEdBQUcsQ0FBQztTQUMvQztRQUVELHNEQUFzRDtRQUN0RCxNQUFNLEtBQUssR0FDVCxJQUFJLENBQUMsUUFBUSxZQUFZLDJCQUFrQjtZQUN6QyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7WUFDckMsQ0FBQyxDQUFDLGdEQUFnRDtnQkFDaEQsaURBQWlEO2dCQUNqRCwwQ0FBMEM7Z0JBQzFDLDJCQUFrQixDQUFDLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3BFLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBQSxnQkFBTyxFQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMscUJBQXFCO1FBRS9ELE1BQU0sR0FBRyxHQUFtQjtZQUMxQixRQUFRLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUN6QixFQUFFLEVBQUUsS0FBSztTQUNWLENBQUM7UUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxPQUFPLENBQUMsdUJBQUEsSUFBSSx1QkFBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2xFLE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLGFBQWEsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQTRCO1FBQzVDLE1BQU0sTUFBTSxHQUFHLGVBQU0sQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0MsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQy9CLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQ2pCLE1BQXVCLEVBQ3ZCLEtBQTRDLEVBQzVDLEtBQTBCO1FBRTFCLE1BQU0sTUFBTSxHQUFHLHlCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ssS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFjO1FBQ25DLE1BQU0sT0FBTyxHQUFvQjtZQUMvQixjQUFjLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFBLGlCQUFRLEVBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1NBQ2pFLENBQUM7UUFDRiw0Q0FBNEM7UUFDNUMsSUFBSSx1QkFBQSxJQUFJLG1CQUFLLEtBQUssU0FBUyxFQUFFO1lBQzNCLE1BQU0sR0FBRyxHQUFHLENBQUMsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLEtBQUssdUJBQUEsSUFBSSx1QkFBUyxDQUFDLENBQUM7WUFDM0YsSUFBSSxHQUFHLEtBQUssU0FBUyxFQUFFO2dCQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQix1QkFBQSxJQUFJLHVCQUFTLEdBQUcsQ0FBQyxDQUFDO2FBQ3pEO1lBQ0QsdUJBQUEsSUFBSSxlQUFRLEdBQUcsTUFBQSxDQUFDO1NBQ2pCO1FBQ0QsT0FBTztRQUNQLE1BQU0sTUFBTSxHQUFHLE1BQU0sdUJBQUEsSUFBSSw2QkFBZSxDQUFDLFFBQVEsQ0FBQyx1QkFBQSxJQUFJLG1CQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEUsT0FBTyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDO0lBQ2pDLENBQUM7Q0FDRjtBQW5IRCx3QkFtSEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBKc29uUnBjQXBpUHJvdmlkZXIsXG4gIFR5cGVkRGF0YURvbWFpbixcbiAgVHlwZWREYXRhRW5jb2RlcixcbiAgVHlwZWREYXRhRmllbGQsXG4gIGV0aGVycyxcbiAgZ2V0Qnl0ZXMsXG4gIHRvQmVIZXgsXG59IGZyb20gXCJldGhlcnNcIjtcbmltcG9ydCB7IEJsb2JTaWduUmVxdWVzdCwgRXZtU2lnblJlcXVlc3QsIFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLi4vc2lnbmVyX3Nlc3Npb25cIjtcbmltcG9ydCB7IEtleSB9IGZyb20gXCIuLi9rZXlcIjtcblxuLyoqXG4gKiBBIGV0aGVycy5qcyBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lclxuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyIGV4dGVuZHMgZXRoZXJzLkFic3RyYWN0U2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5ICNhZGRyZXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciBzaWduaW5nICovXG4gICNrZXk/OiBLZXk7XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIHNlc3Npb24gKi9cbiAgcmVhZG9ubHkgI3NpZ25lclNlc3Npb246IFNpZ25lclNlc3Npb247XG5cbiAgLyoqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9ufSBzaWduZXJTZXNzaW9uIFRoZSB1bmRlcmx5aW5nIFNpZ25lciBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge251bGwgfCBldGhlcnMuUHJvdmlkZXJ9IHByb3ZpZGVyIFRoZSBvcHRpb25hbCBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBzdHJpbmcsIHNpZ25lclNlc3Npb246IFNpZ25lclNlc3Npb24sIHByb3ZpZGVyPzogbnVsbCB8IGV0aGVycy5Qcm92aWRlcikge1xuICAgIHN1cGVyKHByb3ZpZGVyKTtcbiAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcztcbiAgICB0aGlzLiNzaWduZXJTZXNzaW9uID0gc2lnbmVyU2Vzc2lvbjtcbiAgfVxuXG4gIC8qKiBSZXNvbHZlcyB0byB0aGUgc2lnbmVyIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy4jYWRkcmVzcztcbiAgfVxuXG4gIC8qKlxuICAgKiAgUmV0dXJucyB0aGUgc2lnbmVyIGNvbm5lY3RlZCB0byAlJXByb3ZpZGVyJSUuXG4gICAqICBAcGFyYW0ge251bGwgfCBldGhlcnMuUHJvdmlkZXJ9IHByb3ZpZGVyIFRoZSBvcHRpb25hbCBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqICBAcmV0dXJuIHtTaWduZXJ9IFRoZSBzaWduZXIgY29ubmVjdGVkIHRvIHNpZ25lci5cbiAgICovXG4gIGNvbm5lY3QocHJvdmlkZXI6IG51bGwgfCBldGhlcnMuUHJvdmlkZXIpOiBTaWduZXIge1xuICAgIHJldHVybiBuZXcgU2lnbmVyKHRoaXMuI2FkZHJlc3MsIHRoaXMuI3NpZ25lclNlc3Npb24sIHByb3ZpZGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBhIHRyYW5zYWN0aW9uLiBUaGlzIHBvcHVsYXRlcyB0aGUgdHJhbnNhY3Rpb24gdHlwZSB0byBgMHgwMmAgKEVJUC0xNTU5KSB1bmxlc3Mgc2V0LlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIC8vIGdldCB0aGUgY2hhaW4gaWQgZnJvbSB0aGUgbmV0d29yayBvciB0eFxuICAgIGxldCBjaGFpbklkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ/LnRvU3RyaW5nKCkgPz8gXCIxXCI7XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCB0aGUgdHJhbnNhY3Rpb24gaW50byBhIEpTT04tUlBDIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgcnBjVHggPVxuICAgICAgdGhpcy5wcm92aWRlciBpbnN0YW5jZW9mIEpzb25ScGNBcGlQcm92aWRlclxuICAgICAgICA/IHRoaXMucHJvdmlkZXIuZ2V0UnBjVHJhbnNhY3Rpb24odHgpXG4gICAgICAgIDogLy8gV2UgY2FuIGp1c3QgY2FsbCB0aGUgZ2V0UnBjVHJhbnNhY3Rpb24gd2l0aCBhXG4gICAgICAgICAgLy8gbnVsbCByZWNlaXZlciBzaW5jZSBpdCBkb2Vzbid0IGFjdHVhbGx5IHVzZSBpdFxuICAgICAgICAgIC8vIChhbmQgcmVhbGx5IHNob3VsZCBiZSBkZWNsYXJlZCBzdGF0aWMpLlxuICAgICAgICAgIEpzb25ScGNBcGlQcm92aWRlci5wcm90b3R5cGUuZ2V0UnBjVHJhbnNhY3Rpb24uY2FsbChudWxsLCB0eCk7XG4gICAgcnBjVHgudHlwZSA9IHRvQmVIZXgodHgudHlwZSA/PyAweDAyLCAxKTsgLy8gd2UgZXhwZWN0IDB4MFswLTJdXG5cbiAgICBjb25zdCByZXEgPSA8RXZtU2lnblJlcXVlc3Q+e1xuICAgICAgY2hhaW5faWQ6IE51bWJlcihjaGFpbklkKSxcbiAgICAgIHR4OiBycGNUeCxcbiAgICB9O1xuICAgIGNvbnN0IHNpZyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIHJldHVybiBzaWcuZGF0YSgpLnJscF9zaWduZWRfdHg7XG4gIH1cblxuICAvKiogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgZXRoZXJzLmpzJ3MgW2hhc2hNZXNzYWdlXShodHRwczovL2RvY3MuZXRoZXJzLm9yZy92Ni9hcGkvaGFzaGluZy8jaGFzaE1lc3NhZ2UpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC0xOTEgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtzdHJpbmcgfCBVaW50OEFycmF5fSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZyB8IFVpbnQ4QXJyYXkpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IGV0aGVycy5oYXNoTWVzc2FnZShtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5zaWduQmxvYihkaWdlc3QpO1xuICB9XG5cbiAgLyoqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIGV0aGVycy5qcydzXG4gICAqIFtUeXBlZERhdGFFbmNvZGVyLmhhc2hdKGh0dHBzOi8vZG9jcy5ldGhlcnMub3JnL3Y2L2FwaS9oYXNoaW5nLyNUeXBlZERhdGFFbmNvZGVyX2hhc2gpXG4gICAqIHRvIGNvbXB1dGUgdGhlIEVJUC03MTIgZGlnZXN0IGFuZCBzaWducyB0aGlzIGRpZ2VzdCB1c2luZyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRpZ2VzdCA9IFR5cGVkRGF0YUVuY29kZXIuaGFzaChkb21haW4sIHR5cGVzLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMuc2lnbkJsb2IoZGlnZXN0KTtcbiAgfVxuXG4gIC8qKiBTaWduIGFyYml0cmFyeSBkaWdlc3QuIFRoaXMgdXNlcyB7QGxpbmsgS2V5I3NpZ25CbG9ifS5cbiAgICogQHBhcmFtIHtzdHJpbmd9IGRpZ2VzdCBUaGUgZGlnZXN0IHRvIHNpZ24uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgc2lnbkJsb2IoZGlnZXN0OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGJsb2JSZXEgPSA8QmxvYlNpZ25SZXF1ZXN0PntcbiAgICAgIG1lc3NhZ2VfYmFzZTY0OiBCdWZmZXIuZnJvbShnZXRCeXRlcyhkaWdlc3QpKS50b1N0cmluZyhcImJhc2U2NFwiKSxcbiAgICB9O1xuICAgIC8vIEdldCB0aGUga2V5IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBhZGRyZXNzXG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5rZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxJZCA9PT0gdGhpcy4jYWRkcmVzcyk7XG4gICAgICBpZiAoa2V5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgYWNjZXNzIGtleSAnJHt0aGlzLiNhZGRyZXNzfSdgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuI2tleSA9IGtleTtcbiAgICB9XG4gICAgLy8gc2lnblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkJsb2IodGhpcy4ja2V5LCBibG9iUmVxKTtcbiAgICByZXR1cm4gcmVzdWx0LmRhdGEoKS5zaWduYXR1cmU7XG4gIH1cbn1cbiJdfQ==