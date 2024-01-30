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
var _Signer_instances, _Signer_address, _Signer_key, _Signer_signerSession, _Signer_onMfaPoll, _Signer_mfaPollIntervalMs, _Signer_handleMfa;
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
    /** Resolves to the signer (potentially _NOT_ checksummed) address. */
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
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {string | Uint8Array} message The message to sign.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        const key = await this.key();
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEip191(key.material_id, {
            data: (0, cubesigner_sdk_1.encodeToHex)(message),
        });
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.signature;
    }
    /**
     * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip712Signing"` policy attached.
     * @param {TypedDataDomain} domain The domain of the typed data.
     * @param {Record<string, Array<TypedDataField>>} types The types of the typed data.
     * @param {Record<string, any>} value The value of the typed data.
     * @return {Promise<string>} The signature.
     */
    async signTypedData(domain, types, value) {
        const key = await this.key();
        let chainId = domain.chainId;
        if (chainId === undefined) {
            // get chain id from provider
            const network = await this.provider?.getNetwork();
            chainId = network?.chainId;
            if (chainId === undefined) {
                throw new Error("Cannot determine chainId");
            }
        }
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEip712(key.material_id, {
            chain_id: Number(chainId),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            typed_data: {
                domain,
                types,
                primaryType: ethers_1.TypedDataEncoder.getPrimaryType(types),
                message: value,
            },
        });
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.signature;
    }
    /** @return {KeyInfo} The key corresponding to this address */
    async key() {
        if (__classPrivateFieldGet(this, _Signer_key, "f") === undefined) {
            const key = (await __classPrivateFieldGet(this, _Signer_signerSession, "f").keys()).find((k) => k.material_id === __classPrivateFieldGet(this, _Signer_address, "f"));
            if (key === undefined) {
                throw new Error(`Cannot access key '${__classPrivateFieldGet(this, _Signer_address, "f")}'`);
            }
            __classPrivateFieldSet(this, _Signer_key, key, "f");
        }
        return __classPrivateFieldGet(this, _Signer_key, "f");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBT2dCO0FBQ2hCLGdFQVNxQztBQWtCckM7O0dBRUc7QUFDSCxNQUFhLE1BQU8sU0FBUSxlQUFNLENBQUMsY0FBYztJQW1CL0M7Ozs7O09BS0c7SUFDSCxZQUFZLE9BQXlCLEVBQUUsYUFBNEIsRUFBRSxPQUF1QjtRQUMxRixLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDOztRQXpCM0IsaUNBQWlDO1FBQ3hCLGtDQUFpQjtRQUUxQixpQ0FBaUM7UUFDakMsOEJBQWU7UUFFZiw2QkFBNkI7UUFDcEIsd0NBQThCO1FBRXZDOzs7V0FHRztRQUNNLG9DQUEyQztRQUVwRCxnRUFBZ0U7UUFDdkQsNENBQTJCO1FBVWxDLElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxtQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksbUJBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksZUFBUSxPQUFrQixNQUFBLENBQUM7UUFDakMsQ0FBQztRQUNELHVCQUFBLElBQUkseUJBQWtCLGFBQWEsTUFBQSxDQUFDO1FBQ3BDLHVCQUFBLElBQUkscUJBQWMsT0FBTyxFQUFFLFNBQVMsSUFBSSxDQUFDLEVBQUMsOEJBQThCLEVBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxNQUFBLENBQUMsQ0FBQywyREFBMkQ7UUFDN0ksdUJBQUEsSUFBSSw2QkFBc0IsT0FBTyxFQUFFLGlCQUFpQixJQUFJLElBQUksTUFBQSxDQUFDO0lBQy9ELENBQUM7SUFFRCxzRUFBc0U7SUFDdEUsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLHVCQUFBLElBQUksdUJBQVMsQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE9BQU8sQ0FBQyxRQUFnQztRQUN0QyxPQUFPLElBQUksTUFBTSxDQUFDLHVCQUFBLElBQUksdUJBQVMsRUFBRSx1QkFBQSxJQUFJLDZCQUFlLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsb0JBQW9CLENBQUMsRUFBNkI7UUFDdEQsMENBQTBDO1FBQzFDLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDekIsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDO1lBQ2xELE9BQU8sR0FBRyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDO1lBQ3ZDLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNILENBQUM7UUFFRCxzREFBc0Q7UUFDdEQsTUFBTSxLQUFLLEdBQ1QsSUFBSSxDQUFDLFFBQVEsWUFBWSwyQkFBa0I7WUFDekMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDO1lBQ3JDLENBQUMsQ0FBQyxnREFBZ0Q7Z0JBQ2hELGlEQUFpRDtnQkFDakQsMENBQTBDO2dCQUMxQywyQkFBa0IsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNwRSxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUEsZ0JBQU8sRUFBQyxFQUFFLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQjtRQUUvRCxPQUF1QjtZQUNyQixRQUFRLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUN6QixFQUFFLEVBQUUsS0FBSztTQUNWLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBNkI7UUFDakQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksdUJBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsRSxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksNENBQVcsTUFBZixJQUFJLEVBQVksR0FBRyxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLE9BQTRCO1FBQzVDLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLE1BQU0sR0FBRyxHQUFHLE1BQU0sdUJBQUEsSUFBSSw2QkFBZSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFxQjtZQUNuRixJQUFJLEVBQUUsSUFBQSw0QkFBVyxFQUFDLE9BQU8sQ0FBQztTQUMzQixDQUFDLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksNENBQVcsTUFBZixJQUFJLEVBQVksR0FBRyxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQ2pCLE1BQXVCLEVBQ3ZCLEtBQTRDLEVBQzVDLEtBQTBCO1FBRTFCLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDN0IsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDMUIsNkJBQTZCO1lBQzdCLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQztZQUNsRCxPQUFPLEdBQUcsT0FBTyxFQUFFLE9BQU8sQ0FBQztZQUMzQixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDSCxDQUFDO1FBQ0QsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQXFCO1lBQ25GLFFBQVEsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ3pCLDhEQUE4RDtZQUM5RCxVQUFVLEVBQU87Z0JBQ2YsTUFBTTtnQkFDTixLQUFLO2dCQUNMLFdBQVcsRUFBRSx5QkFBZ0IsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO2dCQUNuRCxPQUFPLEVBQUUsS0FBSzthQUNmO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDRDQUFXLE1BQWYsSUFBSSxFQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQsOERBQThEO0lBQ3RELEtBQUssQ0FBQyxHQUFHO1FBQ2YsSUFBSSx1QkFBQSxJQUFJLG1CQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDNUIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyx1QkFBQSxJQUFJLHVCQUFTLENBQUMsQ0FBQztZQUM1RixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsdUJBQUEsSUFBSSx1QkFBUyxHQUFHLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBQ0QsdUJBQUEsSUFBSSxlQUFRLEdBQUcsTUFBQSxDQUFDO1FBQ2xCLENBQUM7UUFDRCxPQUFPLHVCQUFBLElBQUksbUJBQUssQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsc0JBQXNCLENBQUMsRUFBNkI7UUFDeEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkQsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksdUJBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsRSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLDBCQUEwQixDQUFDLE9BQXVCO1FBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0YsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQUEsSUFBSSx1QkFBUyxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNLElBQUksS0FBSyxDQUNiLGdDQUFnQyx1QkFBQSxJQUFJLHVCQUFTLFlBQVksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FDaEYsQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxPQUFPLENBQ2hELHVCQUFBLElBQUksdUJBQVMsRUFDYixPQUFPLENBQUMsT0FBTyxDQUFDLElBQXNCLEVBQ3RDO1lBQ0UsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQ2pCLFFBQVEsRUFBRSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsS0FBSztZQUNuQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQVEsQ0FBQyxZQUFZO1NBQ3ZDLENBQ0YsQ0FBQztRQUNGLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUyxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNsRixDQUFDO0NBd0JGO0FBcE9ELHdCQW9PQzs7QUF0QkM7Ozs7R0FJRztBQUNILEtBQUssNEJBQWUsR0FBMEI7SUFDNUMsT0FBTyxHQUFHLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztRQUN6QixNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLHVCQUFBLElBQUksaUNBQW1CLENBQUMsQ0FBQyxDQUFDO1FBRTdFLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMxQixNQUFNLE9BQU8sR0FBRyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUQsdUJBQUEsSUFBSSx5QkFBVyxNQUFmLElBQUksRUFBWSxPQUFPLENBQUMsQ0FBQztRQUN6QixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNwQixHQUFHLEdBQUcsTUFBTSxHQUFHLENBQUMsbUJBQW1CLENBQUM7Z0JBQ2xDLEtBQUs7Z0JBQ0wsUUFBUSxFQUFFLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxLQUFLO2dCQUNuQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxZQUFZO2FBQ3RDLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEpzb25ScGNBcGlQcm92aWRlcixcbiAgVHlwZWREYXRhRG9tYWluLFxuICBUeXBlZERhdGFGaWVsZCxcbiAgVHlwZWREYXRhRW5jb2RlcixcbiAgZXRoZXJzLFxuICB0b0JlSGV4LFxufSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQge1xuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEtleUluZm8sXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBTaWduZXJTZXNzaW9uLFxuICBlbmNvZGVUb0hleCxcbn0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuXG4vKiogT3B0aW9ucyBmb3IgdGhlIHNpZ25lciAqL1xuZXhwb3J0IGludGVyZmFjZSBTaWduZXJPcHRpb25zIHtcbiAgLyoqIE9wdGlvbmFsIHByb3ZpZGVyIHRvIHVzZSAqL1xuICBwcm92aWRlcj86IG51bGwgfCBldGhlcnMuUHJvdmlkZXI7XG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICBvbk1mYVBvbGw/OiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG4gIC8qKlxuICAgKiBUaGUgYW1vdW50IG9mIHRpbWUgKGluIG1pbGxpc2Vjb25kcykgdG8gd2FpdCBiZXR3ZWVuIGNoZWNrcyBmb3IgTUZBXG4gICAqIHVwZGF0ZXMuIERlZmF1bHQgaXMgMTAwMG1zXG4gICAqL1xuICBtZmFQb2xsSW50ZXJ2YWxNcz86IG51bWJlcjtcbn1cblxuLyoqXG4gKiBBIGV0aGVycy5qcyBTaWduZXIgdXNpbmcgQ3ViZVNpZ25lclxuICovXG5leHBvcnQgY2xhc3MgU2lnbmVyIGV4dGVuZHMgZXRoZXJzLkFic3RyYWN0U2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5ICNhZGRyZXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciBzaWduaW5nICovXG4gICNrZXk/OiBLZXlJbmZvO1xuXG4gIC8qKiBUaGUgdW5kZXJseWluZyBzZXNzaW9uICovXG4gIHJlYWRvbmx5ICNzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICByZWFkb25seSAjb25NZmFQb2xsOiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG5cbiAgLyoqIFRoZSBhbW91bnQgb2YgdGltZSB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBNRkEgdXBkYXRlcyAqL1xuICByZWFkb25seSAjbWZhUG9sbEludGVydmFsTXM6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtLZXlJbmZvIHwgc3RyaW5nfSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9ufSBzaWduZXJTZXNzaW9uIFRoZSB1bmRlcmx5aW5nIFNpZ25lciBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXlJbmZvIHwgc3RyaW5nLCBzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBvcHRpb25zPzogU2lnbmVyT3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnM/LnByb3ZpZGVyKTtcbiAgICBpZiAodHlwZW9mIGFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiNhZGRyZXNzID0gYWRkcmVzcy5tYXRlcmlhbElkO1xuICAgICAgdGhpcy4ja2V5ID0gYWRkcmVzcyBhcyBLZXlJbmZvO1xuICAgIH1cbiAgICB0aGlzLiNzaWduZXJTZXNzaW9uID0gc2lnbmVyU2Vzc2lvbjtcbiAgICB0aGlzLiNvbk1mYVBvbGwgPSBvcHRpb25zPy5vbk1mYVBvbGwgPz8gKCgvKiBfbWZhSW5mbzogTWZhUmVxdWVzdEluZm8gKi8pID0+IHt9KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZW1wdHktZnVuY3Rpb25cbiAgICB0aGlzLiNtZmFQb2xsSW50ZXJ2YWxNcyA9IG9wdGlvbnM/Lm1mYVBvbGxJbnRlcnZhbE1zID8/IDEwMDA7XG4gIH1cblxuICAvKiogUmVzb2x2ZXMgdG8gdGhlIHNpZ25lciAocG90ZW50aWFsbHkgX05PVF8gY2hlY2tzdW1tZWQpIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy4jYWRkcmVzcztcbiAgfVxuXG4gIC8qKlxuICAgKiAgUmV0dXJucyB0aGUgc2lnbmVyIGNvbm5lY3RlZCB0byAlJXByb3ZpZGVyJSUuXG4gICAqICBAcGFyYW0ge251bGwgfCBldGhlcnMuUHJvdmlkZXJ9IHByb3ZpZGVyIFRoZSBvcHRpb25hbCBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqICBAcmV0dXJuIHtTaWduZXJ9IFRoZSBzaWduZXIgY29ubmVjdGVkIHRvIHNpZ25lci5cbiAgICovXG4gIGNvbm5lY3QocHJvdmlkZXI6IG51bGwgfCBldGhlcnMuUHJvdmlkZXIpOiBTaWduZXIge1xuICAgIHJldHVybiBuZXcgU2lnbmVyKHRoaXMuI2FkZHJlc3MsIHRoaXMuI3NpZ25lclNlc3Npb24sIHsgcHJvdmlkZXIgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgc2lnbmluZyByZXF1ZXN0IGZyb20gYSB0cmFuc2FjdGlvbi4gVGhpcyBwb3B1bGF0ZXMgdGhlIHRyYW5zYWN0aW9uXG4gICAqIHR5cGUgdG8gYDB4MDJgIChFSVAtMTU1OSkgdW5sZXNzIHNldC5cbiAgICpcbiAgICogQHBhcmFtIHtldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0fSB0eCBUaGUgdHJhbnNhY3Rpb25cbiAgICogQHJldHVybiB7RXZtU2lnblJlcXVlc3R9IFRoZSBFVk0gc2lnbiByZXF1ZXN0IHRvIGJlIHNlbnQgdG8gQ3ViZVNpZ25lclxuICAgKi9cbiAgYXN5bmMgZXZtU2lnblJlcXVlc3RGcm9tVHgodHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPEV2bVNpZ25SZXF1ZXN0PiB7XG4gICAgLy8gZ2V0IHRoZSBjaGFpbiBpZCBmcm9tIHRoZSBuZXR3b3JrIG9yIHR4XG4gICAgbGV0IGNoYWluSWQgPSB0eC5jaGFpbklkO1xuICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IG5ldHdvcmsgPSBhd2FpdCB0aGlzLnByb3ZpZGVyPy5nZXROZXR3b3JrKCk7XG4gICAgICBjaGFpbklkID0gbmV0d29yaz8uY2hhaW5JZD8udG9TdHJpbmcoKTtcbiAgICAgIGlmIChjaGFpbklkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGRldGVybWluZSBjaGFpbklkXCIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvbnZlcnQgdGhlIHRyYW5zYWN0aW9uIGludG8gYSBKU09OLVJQQyB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJwY1R4ID1cbiAgICAgIHRoaXMucHJvdmlkZXIgaW5zdGFuY2VvZiBKc29uUnBjQXBpUHJvdmlkZXJcbiAgICAgICAgPyB0aGlzLnByb3ZpZGVyLmdldFJwY1RyYW5zYWN0aW9uKHR4KVxuICAgICAgICA6IC8vIFdlIGNhbiBqdXN0IGNhbGwgdGhlIGdldFJwY1RyYW5zYWN0aW9uIHdpdGggYVxuICAgICAgICAgIC8vIG51bGwgcmVjZWl2ZXIgc2luY2UgaXQgZG9lc24ndCBhY3R1YWxseSB1c2UgaXRcbiAgICAgICAgICAvLyAoYW5kIHJlYWxseSBzaG91bGQgYmUgZGVjbGFyZWQgc3RhdGljKS5cbiAgICAgICAgICBKc29uUnBjQXBpUHJvdmlkZXIucHJvdG90eXBlLmdldFJwY1RyYW5zYWN0aW9uLmNhbGwobnVsbCwgdHgpO1xuICAgIHJwY1R4LnR5cGUgPSB0b0JlSGV4KHR4LnR5cGUgPz8gMHgwMiwgMSk7IC8vIHdlIGV4cGVjdCAweDBbMC0yXVxuXG4gICAgcmV0dXJuIDxFdm1TaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHg6IHJwY1R4LFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHRyYW5zYWN0aW9uLiBUaGlzIG1ldGhvZCB3aWxsIGJsb2NrIGlmIHRoZSBrZXkgcmVxdWlyZXMgTUZBIGFwcHJvdmFsLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IGV0aGVycy5UcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHJlcSA9IGF3YWl0IHRoaXMuZXZtU2lnblJlcXVlc3RGcm9tVHgodHgpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IFVpbnQ4QXJyYXl9IG1lc3NhZ2UgVGhlIG1lc3NhZ2UgdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nIHwgVWludDhBcnJheSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25FaXAxOTEoa2V5Lm1hdGVyaWFsX2lkLCA8RWlwMTkxU2lnblJlcXVlc3Q+e1xuICAgICAgZGF0YTogZW5jb2RlVG9IZXgobWVzc2FnZSksXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnNpZ25hdHVyZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWducyBFSVAtNzEyIHR5cGVkIGRhdGEuIFRoaXMgdXNlcyBDdWJlU2lnbmVyJ3MgRUlQLTcxMiBzaWduaW5nIGVuZHBvaW50LlxuICAgKiBUaGUga2V5IChmb3IgdGhpcyBzZXNzaW9uKSBtdXN0IGhhdmUgdGhlIGBcIkFsbG93UmF3QmxvYlNpZ25pbmdcImAgb3JcbiAgICogYFwiQWxsb3dFaXA3MTJTaWduaW5nXCJgIHBvbGljeSBhdHRhY2hlZC5cbiAgICogQHBhcmFtIHtUeXBlZERhdGFEb21haW59IGRvbWFpbiBUaGUgZG9tYWluIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj59IHR5cGVzIFRoZSB0eXBlcyBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCBhbnk+fSB2YWx1ZSBUaGUgdmFsdWUgb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gVGhlIHNpZ25hdHVyZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgbGV0IGNoYWluSWQgPSBkb21haW4uY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBnZXQgY2hhaW4gaWQgZnJvbSBwcm92aWRlclxuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkVpcDcxMihrZXkubWF0ZXJpYWxfaWQsIDxFaXA3MTJTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHR5cGVkX2RhdGE6IDxhbnk+e1xuICAgICAgICBkb21haW4sXG4gICAgICAgIHR5cGVzLFxuICAgICAgICBwcmltYXJ5VHlwZTogVHlwZWREYXRhRW5jb2Rlci5nZXRQcmltYXJ5VHlwZSh0eXBlcyksXG4gICAgICAgIG1lc3NhZ2U6IHZhbHVlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqIEByZXR1cm4ge0tleUluZm99IFRoZSBrZXkgY29ycmVzcG9uZGluZyB0byB0aGlzIGFkZHJlc3MgKi9cbiAgcHJpdmF0ZSBhc3luYyBrZXkoKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgaWYgKHRoaXMuI2tleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBrZXkgPSAoYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5rZXlzKCkpLmZpbmQoKGspID0+IGsubWF0ZXJpYWxfaWQgPT09IHRoaXMuI2FkZHJlc3MpO1xuICAgICAgaWYgKGtleSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGFjY2VzcyBrZXkgJyR7dGhpcy4jYWRkcmVzc30nYCk7XG4gICAgICB9XG4gICAgICB0aGlzLiNrZXkgPSBrZXk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiNrZXk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgc2lnbmluZyBhIG1lc3NhZ2UgdXNpbmcgTUZBIGFwcHJvdmFscy4gVGhpcyBtZXRob2QgcG9wdWxhdGVzXG4gICAqIG1pc3NpbmcgZmllbGRzLiBJZiB0aGUgc2lnbmluZyBkb2VzIG5vdCByZXF1aXJlIE1GQSwgdGhpcyBtZXRob2QgdGhyb3dzLlxuICAgKiBAcGFyYW0ge2V0aGVycy5UcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzZW5kLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoZSBzaWduaW5nIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFJbml0KHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBwb3BUeCA9IGF3YWl0IHRoaXMucG9wdWxhdGVUcmFuc2FjdGlvbih0eCk7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeChwb3BUeCk7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5zaWduRXZtKHRoaXMuI2FkZHJlc3MsIHJlcSk7XG4gICAgcmV0dXJuIHJlcy5tZmFJZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIGFwcHJvdmVkIE1GQSByZXF1ZXN0LiBUaGUgTUZBIHJlcXVlc3QgY29udGFpbnNcbiAgICogaW5mb3JtYXRpb24gYWJvdXQgdGhlIGFwcHJvdmVkIHNpZ25pbmcgcmVxdWVzdCwgd2hpY2ggdGhpcyBtZXRob2Qgd2lsbFxuICAgKiBleGVjdXRlLlxuICAgKiBAcGFyYW0ge01mYVJlcXVlc3RJbmZvfSBtZmFJbmZvIFRoZSBhcHByb3ZlZCBNRkEgcmVxdWVzdC5cbiAgICogQHJldHVybiB7ZXRoZXJzLlRyYW5zYWN0aW9uUmVzcG9uc2V9IFRoZSByZXN1bHQgb2Ygc3VibWl0dGluZyB0aGUgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIHNlbmRUcmFuc2FjdGlvbk1mYUFwcHJvdmVkKG1mYUluZm86IE1mYVJlcXVlc3RJbmZvKTogUHJvbWlzZTxldGhlcnMuVHJhbnNhY3Rpb25SZXNwb25zZT4ge1xuICAgIGlmICghbWZhSW5mby5yZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgaWYgKCFtZmFJbmZvLnJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgc2lnbmluZyByZXF1ZXN0IGZvciAke3RoaXMuI2FkZHJlc3N9IGJ1dCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduZWRUeCA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bShcbiAgICAgIHRoaXMuI2FkZHJlc3MsXG4gICAgICBtZmFJbmZvLnJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCxcbiAgICAgIHtcbiAgICAgICAgbWZhSWQ6IG1mYUluZm8uaWQsXG4gICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQhLmNvbmZpcm1hdGlvbixcbiAgICAgIH0sXG4gICAgKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm92aWRlciEuYnJvYWRjYXN0VHJhbnNhY3Rpb24oc2lnbmVkVHguZGF0YSgpLnJscF9zaWduZWRfdHgpO1xuICB9XG5cbiAgLyoqXG4gICAqIElmIHRoZSBzaWduIHJlcXVlc3QgcmVxdWlyZXMgTUZBLCB0aGlzIG1ldGhvZCB3YWl0cyBmb3IgYXBwcm92YWxzXG4gICAqIEBwYXJhbSB7Q3ViZVNpZ25lclJlc3BvbnNlPFU+fSByZXMgVGhlIHJlc3BvbnNlIG9mIGEgc2lnbiByZXF1ZXN0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSBzaWduIGRhdGEgYWZ0ZXIgTUZBIGFwcHJvdmFsc1xuICAgKi9cbiAgYXN5bmMgI2hhbmRsZU1mYTxVPihyZXM6IEN1YmVTaWduZXJSZXNwb25zZTxVPik6IFByb21pc2U8VT4ge1xuICAgIHdoaWxlIChyZXMucmVxdWlyZXNNZmEoKSkge1xuICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy4jbWZhUG9sbEludGVydmFsTXMpKTtcblxuICAgICAgY29uc3QgbWZhSWQgPSByZXMubWZhSWQoKTtcbiAgICAgIGNvbnN0IG1mYUluZm8gPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLmdldE1mYUluZm8obWZhSWQpO1xuICAgICAgdGhpcy4jb25NZmFQb2xsKG1mYUluZm8pO1xuICAgICAgaWYgKG1mYUluZm8ucmVjZWlwdCkge1xuICAgICAgICByZXMgPSBhd2FpdCByZXMuc2lnbldpdGhNZmFBcHByb3ZhbCh7XG4gICAgICAgICAgbWZhSWQsXG4gICAgICAgICAgbWZhT3JnSWQ6IHRoaXMuI3NpZ25lclNlc3Npb24ub3JnSWQsXG4gICAgICAgICAgbWZhQ29uZjogbWZhSW5mby5yZWNlaXB0LmNvbmZpcm1hdGlvbixcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXMuZGF0YSgpO1xuICB9XG59XG4iXX0=