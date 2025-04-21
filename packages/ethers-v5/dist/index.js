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
const utils_1 = require("ethers/lib/utils");
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.Signer {
    /**
     * Create new Signer instance
     *
     * @param address The key or the eth address of the account to use.
     * @param client The underlying client.
     * @param options The options to use for the Signer instance
     */
    constructor(address, client, options) {
        super();
        /** The CubeSigner-backed ethers signer */
        _Signer_signer.set(this, void 0);
        __classPrivateFieldSet(this, _Signer_signer, new cubesigner_sdk_1.EvmSigner(address, client, options), "f");
        if (options?.provider) {
            (0, utils_1.defineReadOnly)(this, "provider", options.provider);
        }
    }
    /** @returns The signer checksum address. */
    async getAddress() {
        return ethers_1.ethers.utils.getAddress(__classPrivateFieldGet(this, _Signer_signer, "f").address);
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *
     *  @param provider The provider instance to use.
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
            chainId = network?.chainId;
            if (chainId === undefined) {
                throw new Error("Cannot determine chainId");
            }
        }
        // Convert the transaction into a JSON-RPC transaction
        const rpcTx = ethers_1.ethers.providers.JsonRpcProvider.hexlifyTransaction(tx, {
            from: true,
            type: true,
        });
        return {
            chain_id: chainId,
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
        const req = await this.evmSignRequestFromTx(await (0, utils_1.resolveProperties)(tx));
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signTransaction(req);
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     *
     * @param message The message to sign.  Bytes are treated as
     * as a binary messages; strings are treated as UTF8-messages.
     * @returns The signature.
     */
    async signMessage(message) {
        return await __classPrivateFieldGet(this, _Signer_signer, "f").signEip191({
            data: (0, utils_1.isBytes)(message) ? (0, utils_1.hexlify)(message) : (0, cubesigner_sdk_1.encodeToHex)(message),
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
    async _signTypedData(domain, types, value) {
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
            typed_data: utils_1._TypedDataEncoder.getPayload(domain, types, value),
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
        const rplSigned = await __classPrivateFieldGet(this, _Signer_signer, "f").signTransactionMfaApproved(mfaRequest);
        return await this.provider.sendTransaction(rplSigned);
    }
}
exports.Signer = Signer;
_Signer_signer = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsbUNBQWdDO0FBVWhDLCtEQUFvRTtBQUVwRSw0Q0FNMEI7QUFVMUI7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsTUFBTTtJQUl2Qzs7Ozs7O09BTUc7SUFDSCxZQUFZLE9BQXFCLEVBQUUsTUFBd0IsRUFBRSxPQUF1QjtRQUNsRixLQUFLLEVBQUUsQ0FBQztRQVhWLDBDQUEwQztRQUNqQyxpQ0FBbUI7UUFXMUIsdUJBQUEsSUFBSSxrQkFBVyxJQUFJLDBCQUFTLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBQSxDQUFDO1FBQ3ZELElBQUksT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQ3RCLElBQUEsc0JBQWMsRUFBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRCxDQUFDO0lBQ0gsQ0FBQztJQUVELDRDQUE0QztJQUM1QyxLQUFLLENBQUMsVUFBVTtRQUNkLE9BQU8sZUFBTSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILE9BQU8sQ0FBQyxRQUFtQztRQUN6QyxPQUFPLElBQUksTUFBTSxDQUFDLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPLEVBQUUsdUJBQUEsSUFBSSxzQkFBUSxDQUFDLE1BQU0sRUFBRTtZQUMzRCxHQUFHLHVCQUFBLElBQUksc0JBQVEsQ0FBQyxPQUFPO1lBQ3ZCLFFBQVE7U0FDVCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEVBQXNCO1FBQy9DLDBDQUEwQztRQUMxQyxJQUFJLE9BQU8s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QixDQUFDLFVBQXNCO1FBQ3JELE1BQU0sU0FBUyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxzQkFBUSxDQUFDLDBCQUEwQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVFLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUyxDQUFDLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN6RCxDQUFDO0NBQ0Y7QUF0SkQsd0JBc0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBUeXBlZERhdGFEb21haW4sIFR5cGVkRGF0YUZpZWxkIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHsgZXRoZXJzIH0gZnJvbSBcImV0aGVyc1wiO1xuaW1wb3J0IHR5cGUge1xuICBFaXAxOTFTaWduUmVxdWVzdCxcbiAgRWlwNzEyU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXF1ZXN0LFxuICBDdWJlU2lnbmVyQ2xpZW50LFxuICBFdm1TaWduZXJPcHRpb25zLFxuICBLZXksXG4gIE1mYVJlcXVlc3QsXG59IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgZW5jb2RlVG9IZXgsIEV2bVNpZ25lciB9IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHR5cGUgeyBEZWZlcnJhYmxlLCBCeXRlcyB9IGZyb20gXCJldGhlcnMvbGliL3V0aWxzXCI7XG5pbXBvcnQge1xuICBfVHlwZWREYXRhRW5jb2RlcixcbiAgZGVmaW5lUmVhZE9ubHksXG4gIGhleGxpZnksXG4gIGlzQnl0ZXMsXG4gIHJlc29sdmVQcm9wZXJ0aWVzLFxufSBmcm9tIFwiZXRoZXJzL2xpYi91dGlsc1wiO1xuaW1wb3J0IHR5cGUgeyBUcmFuc2FjdGlvblJlcXVlc3QsIFRyYW5zYWN0aW9uUmVzcG9uc2UgfSBmcm9tIFwiQGV0aGVyc3Byb2plY3QvYWJzdHJhY3QtcHJvdmlkZXJcIjtcbmltcG9ydCB0eXBlIHsgVHlwZWREYXRhU2lnbmVyIH0gZnJvbSBcIkBldGhlcnNwcm9qZWN0L2Fic3RyYWN0LXNpZ25lclwiO1xuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHNpZ25lciAqL1xuZXhwb3J0IGludGVyZmFjZSBTaWduZXJPcHRpb25zIGV4dGVuZHMgRXZtU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBwcm92aWRlciB0byB1c2UgKi9cbiAgcHJvdmlkZXI/OiBudWxsIHwgZXRoZXJzLnByb3ZpZGVycy5Qcm92aWRlcjtcbn1cblxuLyoqXG4gKiBBIGV0aGVycy5qcyBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lclxuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyIGV4dGVuZHMgZXRoZXJzLlNpZ25lciBpbXBsZW1lbnRzIFR5cGVkRGF0YVNpZ25lciB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lci1iYWNrZWQgZXRoZXJzIHNpZ25lciAqL1xuICByZWFkb25seSAjc2lnbmVyOiBFdm1TaWduZXI7XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgU2lnbmVyIGluc3RhbmNlXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGNsaWVudCBUaGUgdW5kZXJseWluZyBjbGllbnQuXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSBvcHRpb25zIHRvIHVzZSBmb3IgdGhlIFNpZ25lciBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoYWRkcmVzczogS2V5IHwgc3RyaW5nLCBjbGllbnQ6IEN1YmVTaWduZXJDbGllbnQsIG9wdGlvbnM/OiBTaWduZXJPcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNzaWduZXIgPSBuZXcgRXZtU2lnbmVyKGFkZHJlc3MsIGNsaWVudCwgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnM/LnByb3ZpZGVyKSB7XG4gICAgICBkZWZpbmVSZWFkT25seSh0aGlzLCBcInByb3ZpZGVyXCIsIG9wdGlvbnMucHJvdmlkZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgc2lnbmVyIGNoZWNrc3VtIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gZXRoZXJzLnV0aWxzLmdldEFkZHJlc3ModGhpcy4jc2lnbmVyLmFkZHJlc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqICBSZXR1cm5zIHRoZSBzaWduZXIgY29ubmVjdGVkIHRvICUlcHJvdmlkZXIlJS5cbiAgICpcbiAgICogIEBwYXJhbSBwcm92aWRlciBUaGUgcHJvdmlkZXIgaW5zdGFuY2UgdG8gdXNlLlxuICAgKiAgQHJldHVybnMgVGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gc2lnbmVyLlxuICAgKi9cbiAgY29ubmVjdChwcm92aWRlcjogZXRoZXJzLnByb3ZpZGVycy5Qcm92aWRlcik6IFNpZ25lciB7XG4gICAgcmV0dXJuIG5ldyBTaWduZXIodGhpcy4jc2lnbmVyLmFkZHJlc3MsIHRoaXMuI3NpZ25lci5jbGllbnQsIHtcbiAgICAgIC4uLnRoaXMuI3NpZ25lci5vcHRpb25zLFxuICAgICAgcHJvdmlkZXIsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgc2lnbmluZyByZXF1ZXN0IGZyb20gYSB0cmFuc2FjdGlvbi4gVGhpcyBwb3B1bGF0ZXMgdGhlIHRyYW5zYWN0aW9uXG4gICAqIHR5cGUgdG8gYDB4MDJgIChFSVAtMTU1OSkgdW5sZXNzIHNldC5cbiAgICpcbiAgICogQHBhcmFtIHR4IFRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJucyBUaGUgRVZNIHNpZ24gcmVxdWVzdCB0byBiZSBzZW50IHRvIEN1YmVTaWduZXJcbiAgICovXG4gIGFzeW5jIGV2bVNpZ25SZXF1ZXN0RnJvbVR4KHR4OiBUcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPEV2bVNpZ25SZXF1ZXN0PiB7XG4gICAgLy8gZ2V0IHRoZSBjaGFpbiBpZCBmcm9tIHRoZSBuZXR3b3JrIG9yIHR4XG4gICAgbGV0IGNoYWluSWQ6IG51bWJlciB8IHVuZGVmaW5lZCA9IHR4LmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ29udmVydCB0aGUgdHJhbnNhY3Rpb24gaW50byBhIEpTT04tUlBDIHRyYW5zYWN0aW9uXG4gICAgY29uc3QgcnBjVHggPSBldGhlcnMucHJvdmlkZXJzLkpzb25ScGNQcm92aWRlci5oZXhsaWZ5VHJhbnNhY3Rpb24odHgsIHtcbiAgICAgIGZyb206IHRydWUsXG4gICAgICB0eXBlOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIDxFdm1TaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogY2hhaW5JZCxcbiAgICAgIHR4OiBycGNUeCBhcyB1bmtub3duLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKlxuICAgKiBAcGFyYW0gdHggVGhlIHRyYW5zYWN0aW9uIHRvIHNpZ24uXG4gICAqIEByZXR1cm5zIEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IERlZmVycmFibGU8VHJhbnNhY3Rpb25SZXF1ZXN0Pik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeChhd2FpdCByZXNvbHZlUHJvcGVydGllcyh0eCkpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXIuc2lnblRyYW5zYWN0aW9uKHJlcSk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYXJiaXRyYXJ5IG1lc3NhZ2VzLiBUaGlzIHVzZXMgQ3ViZVNpZ25lcidzIEVJUC0xOTEgc2lnbmluZyBlbmRwb2ludC5cbiAgICogVGhlIGtleSAoZm9yIHRoaXMgc2Vzc2lvbikgbXVzdCBoYXZlIHRoZSBgXCJBbGxvd1Jhd0Jsb2JTaWduaW5nXCJgIG9yXG4gICAqIGBcIkFsbG93RWlwMTkxU2lnbmluZ1wiYCBwb2xpY3kgYXR0YWNoZWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ24uICBCeXRlcyBhcmUgdHJlYXRlZCBhc1xuICAgKiBhcyBhIGJpbmFyeSBtZXNzYWdlczsgc3RyaW5ncyBhcmUgdHJlYXRlZCBhcyBVVEY4LW1lc3NhZ2VzLlxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nIHwgQnl0ZXMpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkVpcDE5MSg8RWlwMTkxU2lnblJlcXVlc3Q+e1xuICAgICAgZGF0YTogaXNCeXRlcyhtZXNzYWdlKSA/IGhleGxpZnkobWVzc2FnZSkgOiBlbmNvZGVUb0hleChtZXNzYWdlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICpcbiAgICogQHBhcmFtIGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0gdHlwZXMgVGhlIHR5cGVzIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgX3NpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGxldCBjaGFpbklkID0gZG9tYWluLmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gZ2V0IGNoYWluIGlkIGZyb20gcHJvdmlkZXJcbiAgICAgIGNvbnN0IG5ldHdvcmsgPSBhd2FpdCB0aGlzLnByb3ZpZGVyPy5nZXROZXR3b3JrKCk7XG4gICAgICBjaGFpbklkID0gbmV0d29yaz8uY2hhaW5JZDtcbiAgICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRldGVybWluZSBjaGFpbklkXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzaWduZXIuc2lnbkVpcDcxMig8RWlwNzEyU2lnblJlcXVlc3Q+e1xuICAgICAgY2hhaW5faWQ6IE51bWJlcihjaGFpbklkKSxcbiAgICAgIHR5cGVkX2RhdGE6IF9UeXBlZERhdGFFbmNvZGVyLmdldFBheWxvYWQoZG9tYWluLCB0eXBlcywgdmFsdWUpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHNpZ25pbmcgYSBtZXNzYWdlIHVzaW5nIE1GQSBhcHByb3ZhbHMuIFRoaXMgbWV0aG9kIHBvcHVsYXRlc1xuICAgKiBtaXNzaW5nIGZpZWxkcy4gSWYgdGhlIHNpZ25pbmcgZG9lcyBub3QgcmVxdWlyZSBNRkEsIHRoaXMgbWV0aG9kIHRocm93cy5cbiAgICpcbiAgICogQHBhcmFtIHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzZW5kLlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIGlkIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2lnbmluZyByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgc2VuZFRyYW5zYWN0aW9uTWZhSW5pdCh0eDogVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBwb3BUeCA9IGF3YWl0IHRoaXMucG9wdWxhdGVUcmFuc2FjdGlvbih0eCk7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeChwb3BUeCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyLnNpZ25Fdm0ocmVxKTtcbiAgICByZXR1cm4gcmVzLm1mYUlkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIHRyYW5zYWN0aW9uIGZyb20gYW4gYXBwcm92ZWQgTUZBIHJlcXVlc3QuIFRoZSBNRkEgcmVxdWVzdCBjb250YWluc1xuICAgKiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYXBwcm92ZWQgc2lnbmluZyByZXF1ZXN0LCB3aGljaCB0aGlzIG1ldGhvZCB3aWxsXG4gICAqIGV4ZWN1dGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZXF1ZXN0IFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiBzdWJtaXR0aW5nIHRoZSB0cmFuc2FjdGlvblxuICAgKi9cbiAgYXN5bmMgc2VuZFRyYW5zYWN0aW9uTWZhQXBwcm92ZWQobWZhUmVxdWVzdDogTWZhUmVxdWVzdCk6IFByb21pc2U8VHJhbnNhY3Rpb25SZXNwb25zZT4ge1xuICAgIGNvbnN0IHJwbFNpZ25lZCA9IGF3YWl0IHRoaXMuI3NpZ25lci5zaWduVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFSZXF1ZXN0KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm92aWRlciEuc2VuZFRyYW5zYWN0aW9uKHJwbFNpZ25lZCk7XG4gIH1cbn1cbiJdfQ==