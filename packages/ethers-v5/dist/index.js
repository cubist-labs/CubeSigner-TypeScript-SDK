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
const utils_1 = require("ethers/lib/utils");
/**
 * A ethers.js Signer using CubeSigner
 */
class Signer extends ethers_1.ethers.Signer {
    /**
     * Create new Signer instance
     * @param {KeyInfo | string} address The key or the eth address of the account to use.
     * @param {SignerSession} signerSession The underlying Signer session.
     * @param {SignerOptions} options The options to use for the Signer instance
     */
    constructor(address, signerSession, options) {
        super();
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
        if (options?.provider) {
            (0, utils_1.defineReadOnly)(this, "provider", options?.provider);
        }
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
    /** Resolves to the signer checksum address. */
    async getAddress() {
        return ethers_1.ethers.utils.getAddress(__classPrivateFieldGet(this, _Signer_address, "f"));
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {ethers.providers.Provider} provider The provider instance to use.
     *  @return {Signer} The signer connected to signer.
     */
    connect(provider) {
        return new Signer(__classPrivateFieldGet(this, _Signer_address, "f"), __classPrivateFieldGet(this, _Signer_signerSession, "f"), { provider });
    }
    /**
     * Construct a signing request from a transaction. This populates the transaction
     * type to `0x02` (EIP-1559) unless set.
     *
     * @param {TransactionRequest} tx The transaction
     * @return {EvmSignRequest} The EVM sign request to be sent to CubeSigner
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
        // CubeSigner end-point expects type to be 0x0[0-2]. hexlifyTransactions
        // doesn't add the extra leading 0, add it here:
        if (typeof rpcTx.type === "string") {
            rpcTx.type = rpcTx.type.replace(/^0x([0-2])$/, "0x0$1");
        }
        return {
            chain_id: chainId,
            tx: rpcTx,
        };
    }
    /**
     * Sign a transaction. This method will block if the key requires MFA approval.
     * @param {Deferrable<TransactionRequest>} tx The transaction to sign.
     * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
     */
    async signTransaction(tx) {
        const req = await this.evmSignRequestFromTx(await (0, utils_1.resolveProperties)(tx));
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEvm(__classPrivateFieldGet(this, _Signer_address, "f"), req);
        const data = await __classPrivateFieldGet(this, _Signer_instances, "m", _Signer_handleMfa).call(this, res);
        return data.rlp_signed_tx;
    }
    /**
     * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
     * The key (for this session) must have the `"AllowRawBlobSigning"` or
     * `"AllowEip191Signing"` policy attached.
     * @param {string | Bytes} message The message to sign.  Bytes are treated as
     * as a binary messages; strings are treated as UTF8-messages.
     * @return {Promise<string>} The signature.
     */
    async signMessage(message) {
        const key = await this.key();
        const res = await __classPrivateFieldGet(this, _Signer_signerSession, "f").signEip191(key.material_id, {
            data: (0, utils_1.isBytes)(message) ? (0, utils_1.hexlify)(message) : (0, cubesigner_sdk_1.encodeToHex)(message),
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
    async _signTypedData(domain, types, value) {
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
                primaryType: utils_1._TypedDataEncoder.getPrimaryType(types),
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
     * @param {TransactionRequest} tx The transaction to send.
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
     * @return {TransactionResponse} The result of submitting the transaction
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
        return await this.provider.sendTransaction(signedTx.data().rlp_signed_tx);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQWlFO0FBQ2pFLGdFQVNxQztBQUNyQyw0Q0FRMEI7QUFvQjFCOztHQUVHO0FBQ0gsTUFBYSxNQUFPLFNBQVEsZUFBTSxDQUFDLE1BQU07SUFtQnZDOzs7OztPQUtHO0lBQ0gsWUFBWSxPQUF5QixFQUFFLGFBQTRCLEVBQUUsT0FBdUI7UUFDMUYsS0FBSyxFQUFFLENBQUM7O1FBekJWLGlDQUFpQztRQUN4QixrQ0FBaUI7UUFFMUIsaUNBQWlDO1FBQ2pDLDhCQUFlO1FBRWYsNkJBQTZCO1FBQ3BCLHdDQUE4QjtRQUV2Qzs7O1dBR0c7UUFDTSxvQ0FBMkM7UUFFcEQsZ0VBQWdFO1FBQ3ZELDRDQUEyQjtRQVdsQyxJQUFJLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQztZQUN0QixJQUFBLHNCQUFjLEVBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdEQsQ0FBQztRQUVELElBQUksT0FBTyxPQUFPLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDaEMsdUJBQUEsSUFBSSxtQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLHVCQUFBLElBQUksbUJBQVksT0FBTyxDQUFDLFVBQVUsTUFBQSxDQUFDO1lBQ25DLHVCQUFBLElBQUksZUFBUSxPQUFrQixNQUFBLENBQUM7UUFDakMsQ0FBQztRQUNELHVCQUFBLElBQUkseUJBQWtCLGFBQWEsTUFBQSxDQUFDO1FBQ3BDLHVCQUFBLElBQUkscUJBQWMsT0FBTyxFQUFFLFNBQVMsSUFBSSxDQUFDLEVBQUMsOEJBQThCLEVBQUUsRUFBRSxHQUFFLENBQUMsQ0FBQyxNQUFBLENBQUMsQ0FBQywyREFBMkQ7UUFDN0ksdUJBQUEsSUFBSSw2QkFBc0IsT0FBTyxFQUFFLGlCQUFpQixJQUFJLElBQUksTUFBQSxDQUFDO0lBQy9ELENBQUM7SUFFRCwrQ0FBK0M7SUFDL0MsS0FBSyxDQUFDLFVBQVU7UUFDZCxPQUFPLGVBQU0sQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLHVCQUFBLElBQUksdUJBQVMsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsT0FBTyxDQUFDLFFBQW1DO1FBQ3pDLE9BQU8sSUFBSSxNQUFNLENBQUMsdUJBQUEsSUFBSSx1QkFBUyxFQUFFLHVCQUFBLElBQUksNkJBQWUsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxFQUFzQjtRQUMvQywwQ0FBMEM7UUFDMUMsSUFBSSxPQUFPLEdBQXVCLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDN0MsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDO1lBQ2xELE9BQU8sR0FBRyxPQUFPLEVBQUUsT0FBTyxDQUFDO1lBQzNCLElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDOUMsQ0FBQztRQUNILENBQUM7UUFFRCxzREFBc0Q7UUFDdEQsTUFBTSxLQUFLLEdBQUcsZUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsa0JBQWtCLENBQUMsRUFBRSxFQUFFO1lBQ3BFLElBQUksRUFBRSxJQUFJO1lBQ1YsSUFBSSxFQUFFLElBQUk7U0FDWCxDQUFDLENBQUM7UUFDSCx3RUFBd0U7UUFDeEUsZ0RBQWdEO1FBQ2hELElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ25DLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzFELENBQUM7UUFFRCxPQUF1QjtZQUNyQixRQUFRLEVBQUUsT0FBTztZQUNqQixFQUFFLEVBQUUsS0FBSztTQUNWLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBa0M7UUFDdEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsTUFBTSxJQUFBLHlCQUFpQixFQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekUsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksdUJBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsRSxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksNENBQVcsTUFBZixJQUFJLEVBQVksR0FBRyxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBQzVCLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUF1QjtRQUN2QyxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLEdBQUcsR0FBRyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBcUI7WUFDbkYsSUFBSSxFQUFFLElBQUEsZUFBTyxFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFBLGVBQU8sRUFBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBQSw0QkFBVyxFQUFDLE9BQU8sQ0FBQztTQUNqRSxDQUFDLENBQUM7UUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksNENBQVcsTUFBZixJQUFJLEVBQVksR0FBRyxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQ2xCLE1BQXVCLEVBQ3ZCLEtBQTRDLEVBQzVDLEtBQTBCO1FBRTFCLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzdCLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUM7UUFDN0IsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDMUIsNkJBQTZCO1lBQzdCLE1BQU0sT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQztZQUNsRCxPQUFPLEdBQUcsT0FBTyxFQUFFLE9BQU8sQ0FBQztZQUMzQixJQUFJLE9BQU8sS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQzlDLENBQUM7UUFDSCxDQUFDO1FBQ0QsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQXFCO1lBQ25GLFFBQVEsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDO1lBQ3pCLDhEQUE4RDtZQUM5RCxVQUFVLEVBQU87Z0JBQ2YsTUFBTTtnQkFDTixLQUFLO2dCQUNMLFdBQVcsRUFBRSx5QkFBaUIsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO2dCQUNwRCxPQUFPLEVBQUUsS0FBSzthQUNmO1NBQ0YsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDRDQUFXLE1BQWYsSUFBSSxFQUFZLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUN4QixDQUFDO0lBRUQsOERBQThEO0lBQ3RELEtBQUssQ0FBQyxHQUFHO1FBQ2YsSUFBSSx1QkFBQSxJQUFJLG1CQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDNUIsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyx1QkFBQSxJQUFJLHVCQUFTLENBQUMsQ0FBQztZQUM1RixJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDdEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsdUJBQUEsSUFBSSx1QkFBUyxHQUFHLENBQUMsQ0FBQztZQUMxRCxDQUFDO1lBQ0QsdUJBQUEsSUFBSSxlQUFRLEdBQUcsTUFBQSxDQUFDO1FBQ2xCLENBQUM7UUFDRCxPQUFPLHVCQUFBLElBQUksbUJBQUssQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsc0JBQXNCLENBQUMsRUFBc0I7UUFDakQsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDakQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkQsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksdUJBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNsRSxPQUFPLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLDBCQUEwQixDQUFDLE9BQXVCO1FBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDM0YsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsdUJBQUEsSUFBSSx1QkFBUyxDQUFDLEVBQUUsQ0FBQztZQUNsRCxNQUFNLElBQUksS0FBSyxDQUNiLGdDQUFnQyx1QkFBQSxJQUFJLHVCQUFTLFlBQVksT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FDaEYsQ0FBQztRQUNKLENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxNQUFNLHVCQUFBLElBQUksNkJBQWUsQ0FBQyxPQUFPLENBQ2hELHVCQUFBLElBQUksdUJBQVMsRUFDYixPQUFPLENBQUMsT0FBTyxDQUFDLElBQXNCLEVBQ3RDO1lBQ0UsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFO1lBQ2pCLFFBQVEsRUFBRSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsS0FBSztZQUNuQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQVEsQ0FBQyxZQUFZO1NBQ3ZDLENBQ0YsQ0FBQztRQUNGLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDN0UsQ0FBQztDQXdCRjtBQTNPRCx3QkEyT0M7O0FBdEJDOzs7O0dBSUc7QUFDSCxLQUFLLDRCQUFlLEdBQTBCO0lBQzVDLE9BQU8sR0FBRyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUM7UUFDekIsTUFBTSxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSx1QkFBQSxJQUFJLGlDQUFtQixDQUFDLENBQUMsQ0FBQztRQUU3RSxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsTUFBTSxPQUFPLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVELHVCQUFBLElBQUkseUJBQVcsTUFBZixJQUFJLEVBQVksT0FBTyxDQUFDLENBQUM7UUFDekIsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDcEIsR0FBRyxHQUFHLE1BQU0sR0FBRyxDQUFDLG1CQUFtQixDQUFDO2dCQUNsQyxLQUFLO2dCQUNMLFFBQVEsRUFBRSx1QkFBQSxJQUFJLDZCQUFlLENBQUMsS0FBSztnQkFDbkMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsWUFBWTthQUN0QyxDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUeXBlZERhdGFEb21haW4sIFR5cGVkRGF0YUZpZWxkLCBldGhlcnMgfSBmcm9tIFwiZXRoZXJzXCI7XG5pbXBvcnQge1xuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEtleUluZm8sXG4gIEVpcDE5MVNpZ25SZXF1ZXN0LFxuICBFaXA3MTJTaWduUmVxdWVzdCxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBTaWduZXJTZXNzaW9uLFxuICBlbmNvZGVUb0hleCxcbn0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHtcbiAgX1R5cGVkRGF0YUVuY29kZXIsXG4gIERlZmVycmFibGUsXG4gIEJ5dGVzLFxuICBkZWZpbmVSZWFkT25seSxcbiAgaGV4bGlmeSxcbiAgaXNCeXRlcyxcbiAgcmVzb2x2ZVByb3BlcnRpZXMsXG59IGZyb20gXCJldGhlcnMvbGliL3V0aWxzXCI7XG5pbXBvcnQgeyBUcmFuc2FjdGlvblJlcXVlc3QsIFRyYW5zYWN0aW9uUmVzcG9uc2UgfSBmcm9tIFwiQGV0aGVyc3Byb2plY3QvYWJzdHJhY3QtcHJvdmlkZXJcIjtcbmltcG9ydCB7IFR5cGVkRGF0YVNpZ25lciB9IGZyb20gXCJAZXRoZXJzcHJvamVjdC9hYnN0cmFjdC1zaWduZXJcIjtcblxuLyoqIE9wdGlvbnMgZm9yIHRoZSBzaWduZXIgKi9cbmV4cG9ydCBpbnRlcmZhY2UgU2lnbmVyT3B0aW9ucyB7XG4gIC8qKiBPcHRpb25hbCBwcm92aWRlciB0byB1c2UgKi9cbiAgcHJvdmlkZXI/OiBudWxsIHwgZXRoZXJzLnByb3ZpZGVycy5Qcm92aWRlcjtcbiAgLyoqXG4gICAqIFRoZSBmdW5jdGlvbiB0byBjYWxsIHdoZW4gTUZBIGluZm9ybWF0aW9uIGlzIHJldHJpZXZlZC4gSWYgdGhpcyBjYWxsYmFja1xuICAgKiB0aHJvd3MsIG5vIHRyYW5zYWN0aW9uIGlzIGJyb2FkY2FzdC5cbiAgICovXG4gIG9uTWZhUG9sbD86IChhcmcwOiBNZmFSZXF1ZXN0SW5mbykgPT4gdm9pZDtcbiAgLyoqXG4gICAqIFRoZSBhbW91bnQgb2YgdGltZSAoaW4gbWlsbGlzZWNvbmRzKSB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBNRkFcbiAgICogdXBkYXRlcy4gRGVmYXVsdCBpcyAxMDAwbXNcbiAgICovXG4gIG1mYVBvbGxJbnRlcnZhbE1zPzogbnVtYmVyO1xufVxuXG4vKipcbiAqIEEgZXRoZXJzLmpzIFNpZ25lciB1c2luZyBDdWJlU2lnbmVyXG4gKi9cbmV4cG9ydCBjbGFzcyBTaWduZXIgZXh0ZW5kcyBldGhlcnMuU2lnbmVyIGltcGxlbWVudHMgVHlwZWREYXRhU2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5ICNhZGRyZXNzOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSBrZXkgdG8gdXNlIGZvciBzaWduaW5nICovXG4gICNrZXk/OiBLZXlJbmZvO1xuXG4gIC8qKiBUaGUgdW5kZXJseWluZyBzZXNzaW9uICovXG4gIHJlYWRvbmx5ICNzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uO1xuXG4gIC8qKlxuICAgKiBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIE1GQSBpbmZvcm1hdGlvbiBpcyByZXRyaWV2ZWQuIElmIHRoaXMgY2FsbGJhY2tcbiAgICogdGhyb3dzLCBubyB0cmFuc2FjdGlvbiBpcyBicm9hZGNhc3QuXG4gICAqL1xuICByZWFkb25seSAjb25NZmFQb2xsOiAoYXJnMDogTWZhUmVxdWVzdEluZm8pID0+IHZvaWQ7XG5cbiAgLyoqIFRoZSBhbW91bnQgb2YgdGltZSB0byB3YWl0IGJldHdlZW4gY2hlY2tzIGZvciBNRkEgdXBkYXRlcyAqL1xuICByZWFkb25seSAjbWZhUG9sbEludGVydmFsTXM6IG51bWJlcjtcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyBTaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtLZXlJbmZvIHwgc3RyaW5nfSBhZGRyZXNzIFRoZSBrZXkgb3IgdGhlIGV0aCBhZGRyZXNzIG9mIHRoZSBhY2NvdW50IHRvIHVzZS5cbiAgICogQHBhcmFtIHtTaWduZXJTZXNzaW9ufSBzaWduZXJTZXNzaW9uIFRoZSB1bmRlcmx5aW5nIFNpZ25lciBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge1NpZ25lck9wdGlvbnN9IG9wdGlvbnMgVGhlIG9wdGlvbnMgdG8gdXNlIGZvciB0aGUgU2lnbmVyIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBLZXlJbmZvIHwgc3RyaW5nLCBzaWduZXJTZXNzaW9uOiBTaWduZXJTZXNzaW9uLCBvcHRpb25zPzogU2lnbmVyT3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG5cbiAgICBpZiAob3B0aW9ucz8ucHJvdmlkZXIpIHtcbiAgICAgIGRlZmluZVJlYWRPbmx5KHRoaXMsIFwicHJvdmlkZXJcIiwgb3B0aW9ucz8ucHJvdmlkZXIpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgYWRkcmVzcyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgdGhpcy4jYWRkcmVzcyA9IGFkZHJlc3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuI2FkZHJlc3MgPSBhZGRyZXNzLm1hdGVyaWFsSWQ7XG4gICAgICB0aGlzLiNrZXkgPSBhZGRyZXNzIGFzIEtleUluZm87XG4gICAgfVxuICAgIHRoaXMuI3NpZ25lclNlc3Npb24gPSBzaWduZXJTZXNzaW9uO1xuICAgIHRoaXMuI29uTWZhUG9sbCA9IG9wdGlvbnM/Lm9uTWZhUG9sbCA/PyAoKC8qIF9tZmFJbmZvOiBNZmFSZXF1ZXN0SW5mbyAqLykgPT4ge30pOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1lbXB0eS1mdW5jdGlvblxuICAgIHRoaXMuI21mYVBvbGxJbnRlcnZhbE1zID0gb3B0aW9ucz8ubWZhUG9sbEludGVydmFsTXMgPz8gMTAwMDtcbiAgfVxuXG4gIC8qKiBSZXNvbHZlcyB0byB0aGUgc2lnbmVyIGNoZWNrc3VtIGFkZHJlc3MuICovXG4gIGFzeW5jIGdldEFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gZXRoZXJzLnV0aWxzLmdldEFkZHJlc3ModGhpcy4jYWRkcmVzcyk7XG4gIH1cblxuICAvKipcbiAgICogIFJldHVybnMgdGhlIHNpZ25lciBjb25uZWN0ZWQgdG8gJSVwcm92aWRlciUlLlxuICAgKiAgQHBhcmFtIHtldGhlcnMucHJvdmlkZXJzLlByb3ZpZGVyfSBwcm92aWRlciBUaGUgcHJvdmlkZXIgaW5zdGFuY2UgdG8gdXNlLlxuICAgKiAgQHJldHVybiB7U2lnbmVyfSBUaGUgc2lnbmVyIGNvbm5lY3RlZCB0byBzaWduZXIuXG4gICAqL1xuICBjb25uZWN0KHByb3ZpZGVyOiBldGhlcnMucHJvdmlkZXJzLlByb3ZpZGVyKTogU2lnbmVyIHtcbiAgICByZXR1cm4gbmV3IFNpZ25lcih0aGlzLiNhZGRyZXNzLCB0aGlzLiNzaWduZXJTZXNzaW9uLCB7IHByb3ZpZGVyIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIHNpZ25pbmcgcmVxdWVzdCBmcm9tIGEgdHJhbnNhY3Rpb24uIFRoaXMgcG9wdWxhdGVzIHRoZSB0cmFuc2FjdGlvblxuICAgKiB0eXBlIHRvIGAweDAyYCAoRUlQLTE1NTkpIHVubGVzcyBzZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7VHJhbnNhY3Rpb25SZXF1ZXN0fSB0eCBUaGUgdHJhbnNhY3Rpb25cbiAgICogQHJldHVybiB7RXZtU2lnblJlcXVlc3R9IFRoZSBFVk0gc2lnbiByZXF1ZXN0IHRvIGJlIHNlbnQgdG8gQ3ViZVNpZ25lclxuICAgKi9cbiAgYXN5bmMgZXZtU2lnblJlcXVlc3RGcm9tVHgodHg6IFRyYW5zYWN0aW9uUmVxdWVzdCk6IFByb21pc2U8RXZtU2lnblJlcXVlc3Q+IHtcbiAgICAvLyBnZXQgdGhlIGNoYWluIGlkIGZyb20gdGhlIG5ldHdvcmsgb3IgdHhcbiAgICBsZXQgY2hhaW5JZDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdHguY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBuZXR3b3JrID0gYXdhaXQgdGhpcy5wcm92aWRlcj8uZ2V0TmV0d29yaygpO1xuICAgICAgY2hhaW5JZCA9IG5ldHdvcms/LmNoYWluSWQ7XG4gICAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0IHRoZSB0cmFuc2FjdGlvbiBpbnRvIGEgSlNPTi1SUEMgdHJhbnNhY3Rpb25cbiAgICBjb25zdCBycGNUeCA9IGV0aGVycy5wcm92aWRlcnMuSnNvblJwY1Byb3ZpZGVyLmhleGxpZnlUcmFuc2FjdGlvbih0eCwge1xuICAgICAgZnJvbTogdHJ1ZSxcbiAgICAgIHR5cGU6IHRydWUsXG4gICAgfSk7XG4gICAgLy8gQ3ViZVNpZ25lciBlbmQtcG9pbnQgZXhwZWN0cyB0eXBlIHRvIGJlIDB4MFswLTJdLiBoZXhsaWZ5VHJhbnNhY3Rpb25zXG4gICAgLy8gZG9lc24ndCBhZGQgdGhlIGV4dHJhIGxlYWRpbmcgMCwgYWRkIGl0IGhlcmU6XG4gICAgaWYgKHR5cGVvZiBycGNUeC50eXBlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBycGNUeC50eXBlID0gcnBjVHgudHlwZS5yZXBsYWNlKC9eMHgoWzAtMl0pJC8sIFwiMHgwJDFcIik7XG4gICAgfVxuXG4gICAgcmV0dXJuIDxFdm1TaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogY2hhaW5JZCxcbiAgICAgIHR4OiBycGNUeCxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSB0cmFuc2FjdGlvbi4gVGhpcyBtZXRob2Qgd2lsbCBibG9jayBpZiB0aGUga2V5IHJlcXVpcmVzIE1GQSBhcHByb3ZhbC5cbiAgICogQHBhcmFtIHtEZWZlcnJhYmxlPFRyYW5zYWN0aW9uUmVxdWVzdD59IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzaWduLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IEhleC1lbmNvZGVkIFJMUCBlbmNvZGluZyBvZiB0aGUgdHJhbnNhY3Rpb24gYW5kIGl0cyBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduVHJhbnNhY3Rpb24odHg6IERlZmVycmFibGU8VHJhbnNhY3Rpb25SZXF1ZXN0Pik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVxID0gYXdhaXQgdGhpcy5ldm1TaWduUmVxdWVzdEZyb21UeChhd2FpdCByZXNvbHZlUHJvcGVydGllcyh0eCkpO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bSh0aGlzLiNhZGRyZXNzLCByZXEpO1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLiNoYW5kbGVNZmEocmVzKTtcbiAgICByZXR1cm4gZGF0YS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlcy4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtMTkxIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDE5MVNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IEJ5dGVzfSBtZXNzYWdlIFRoZSBtZXNzYWdlIHRvIHNpZ24uICBCeXRlcyBhcmUgdHJlYXRlZCBhc1xuICAgKiBhcyBhIGJpbmFyeSBtZXNzYWdlczsgc3RyaW5ncyBhcmUgdHJlYXRlZCBhcyBVVEY4LW1lc3NhZ2VzLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IFRoZSBzaWduYXR1cmUuXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcgfCBCeXRlcyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qga2V5ID0gYXdhaXQgdGhpcy5rZXkoKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25FaXAxOTEoa2V5Lm1hdGVyaWFsX2lkLCA8RWlwMTkxU2lnblJlcXVlc3Q+e1xuICAgICAgZGF0YTogaXNCeXRlcyhtZXNzYWdlKSA/IGhleGxpZnkobWVzc2FnZSkgOiBlbmNvZGVUb0hleChtZXNzYWdlKSxcbiAgICB9KTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy4jaGFuZGxlTWZhKHJlcyk7XG4gICAgcmV0dXJuIGRhdGEuc2lnbmF0dXJlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ25zIEVJUC03MTIgdHlwZWQgZGF0YS4gVGhpcyB1c2VzIEN1YmVTaWduZXIncyBFSVAtNzEyIHNpZ25pbmcgZW5kcG9pbnQuXG4gICAqIFRoZSBrZXkgKGZvciB0aGlzIHNlc3Npb24pIG11c3QgaGF2ZSB0aGUgYFwiQWxsb3dSYXdCbG9iU2lnbmluZ1wiYCBvclxuICAgKiBgXCJBbGxvd0VpcDcxMlNpZ25pbmdcImAgcG9saWN5IGF0dGFjaGVkLlxuICAgKiBAcGFyYW0ge1R5cGVkRGF0YURvbWFpbn0gZG9tYWluIFRoZSBkb21haW4gb2YgdGhlIHR5cGVkIGRhdGEuXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgQXJyYXk8VHlwZWREYXRhRmllbGQ+Pn0gdHlwZXMgVGhlIHR5cGVzIG9mIHRoZSB0eXBlZCBkYXRhLlxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIGFueT59IHZhbHVlIFRoZSB2YWx1ZSBvZiB0aGUgdHlwZWQgZGF0YS5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgX3NpZ25UeXBlZERhdGEoXG4gICAgZG9tYWluOiBUeXBlZERhdGFEb21haW4sXG4gICAgdHlwZXM6IFJlY29yZDxzdHJpbmcsIEFycmF5PFR5cGVkRGF0YUZpZWxkPj4sXG4gICAgdmFsdWU6IFJlY29yZDxzdHJpbmcsIGFueT4sIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGtleSA9IGF3YWl0IHRoaXMua2V5KCk7XG4gICAgbGV0IGNoYWluSWQgPSBkb21haW4uY2hhaW5JZDtcbiAgICBpZiAoY2hhaW5JZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBnZXQgY2hhaW4gaWQgZnJvbSBwcm92aWRlclxuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNoYWluSWQgPSBuZXR3b3JrPy5jaGFpbklkO1xuICAgICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZGV0ZXJtaW5lIGNoYWluSWRcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkVpcDcxMihrZXkubWF0ZXJpYWxfaWQsIDxFaXA3MTJTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIHR5cGVkX2RhdGE6IDxhbnk+e1xuICAgICAgICBkb21haW4sXG4gICAgICAgIHR5cGVzLFxuICAgICAgICBwcmltYXJ5VHlwZTogX1R5cGVkRGF0YUVuY29kZXIuZ2V0UHJpbWFyeVR5cGUodHlwZXMpLFxuICAgICAgICBtZXNzYWdlOiB2YWx1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuI2hhbmRsZU1mYShyZXMpO1xuICAgIHJldHVybiBkYXRhLnNpZ25hdHVyZTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHtLZXlJbmZvfSBUaGUga2V5IGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBhZGRyZXNzICovXG4gIHByaXZhdGUgYXN5bmMga2V5KCk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGlmICh0aGlzLiNrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qga2V5ID0gKGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24ua2V5cygpKS5maW5kKChrKSA9PiBrLm1hdGVyaWFsX2lkID09PSB0aGlzLiNhZGRyZXNzKTtcbiAgICAgIGlmIChrZXkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYENhbm5vdCBhY2Nlc3Mga2V5ICcke3RoaXMuI2FkZHJlc3N9J2ApO1xuICAgICAgfVxuICAgICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4ja2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHNpZ25pbmcgYSBtZXNzYWdlIHVzaW5nIE1GQSBhcHByb3ZhbHMuIFRoaXMgbWV0aG9kIHBvcHVsYXRlc1xuICAgKiBtaXNzaW5nIGZpZWxkcy4gSWYgdGhlIHNpZ25pbmcgZG9lcyBub3QgcmVxdWlyZSBNRkEsIHRoaXMgbWV0aG9kIHRocm93cy5cbiAgICogQHBhcmFtIHtUcmFuc2FjdGlvblJlcXVlc3R9IHR4IFRoZSB0cmFuc2FjdGlvbiB0byBzZW5kLlxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBNRkEgaWQgYXNzb2NpYXRlZCB3aXRoIHRoZSBzaWduaW5nIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFJbml0KHR4OiBUcmFuc2FjdGlvblJlcXVlc3QpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHBvcFR4ID0gYXdhaXQgdGhpcy5wb3B1bGF0ZVRyYW5zYWN0aW9uKHR4KTtcbiAgICBjb25zdCByZXEgPSBhd2FpdCB0aGlzLmV2bVNpZ25SZXF1ZXN0RnJvbVR4KHBvcFR4KTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzaWduZXJTZXNzaW9uLnNpZ25Fdm0odGhpcy4jYWRkcmVzcywgcmVxKTtcbiAgICByZXR1cm4gcmVzLm1mYUlkKCk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIHRyYW5zYWN0aW9uIGZyb20gYW4gYXBwcm92ZWQgTUZBIHJlcXVlc3QuIFRoZSBNRkEgcmVxdWVzdCBjb250YWluc1xuICAgKiBpbmZvcm1hdGlvbiBhYm91dCB0aGUgYXBwcm92ZWQgc2lnbmluZyByZXF1ZXN0LCB3aGljaCB0aGlzIG1ldGhvZCB3aWxsXG4gICAqIGV4ZWN1dGUuXG4gICAqIEBwYXJhbSB7TWZhUmVxdWVzdEluZm99IG1mYUluZm8gVGhlIGFwcHJvdmVkIE1GQSByZXF1ZXN0LlxuICAgKiBAcmV0dXJuIHtUcmFuc2FjdGlvblJlc3BvbnNlfSBUaGUgcmVzdWx0IG9mIHN1Ym1pdHRpbmcgdGhlIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzZW5kVHJhbnNhY3Rpb25NZmFBcHByb3ZlZChtZmFJbmZvOiBNZmFSZXF1ZXN0SW5mbyk6IFByb21pc2U8VHJhbnNhY3Rpb25SZXNwb25zZT4ge1xuICAgIGlmICghbWZhSW5mby5yZXF1ZXN0LnBhdGguaW5jbHVkZXMoXCIvZXRoMS9zaWduL1wiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBFVk0gdHJhbnNhY3Rpb24gc2lnbmluZyByZXF1ZXN0LCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gKTtcbiAgICB9XG4gICAgaWYgKCFtZmFJbmZvLnJlcXVlc3QucGF0aC5pbmNsdWRlcyh0aGlzLiNhZGRyZXNzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRXhwZWN0ZWQgc2lnbmluZyByZXF1ZXN0IGZvciAke3RoaXMuI2FkZHJlc3N9IGJ1dCBnb3QgJHttZmFJbmZvLnJlcXVlc3QucGF0aH1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaWduZWRUeCA9IGF3YWl0IHRoaXMuI3NpZ25lclNlc3Npb24uc2lnbkV2bShcbiAgICAgIHRoaXMuI2FkZHJlc3MsXG4gICAgICBtZmFJbmZvLnJlcXVlc3QuYm9keSBhcyBFdm1TaWduUmVxdWVzdCxcbiAgICAgIHtcbiAgICAgICAgbWZhSWQ6IG1mYUluZm8uaWQsXG4gICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICBtZmFDb25mOiBtZmFJbmZvLnJlY2VpcHQhLmNvbmZpcm1hdGlvbixcbiAgICAgIH0sXG4gICAgKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5wcm92aWRlciEuc2VuZFRyYW5zYWN0aW9uKHNpZ25lZFR4LmRhdGEoKS5ybHBfc2lnbmVkX3R4KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGUgc2lnbiByZXF1ZXN0IHJlcXVpcmVzIE1GQSwgdGhpcyBtZXRob2Qgd2FpdHMgZm9yIGFwcHJvdmFsc1xuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJSZXNwb25zZTxVPn0gcmVzIFRoZSByZXNwb25zZSBvZiBhIHNpZ24gcmVxdWVzdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFU+fSBUaGUgc2lnbiBkYXRhIGFmdGVyIE1GQSBhcHByb3ZhbHNcbiAgICovXG4gIGFzeW5jICNoYW5kbGVNZmE8VT4ocmVzOiBDdWJlU2lnbmVyUmVzcG9uc2U8VT4pOiBQcm9taXNlPFU+IHtcbiAgICB3aGlsZSAocmVzLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuI21mYVBvbGxJbnRlcnZhbE1zKSk7XG5cbiAgICAgIGNvbnN0IG1mYUlkID0gcmVzLm1mYUlkKCk7XG4gICAgICBjb25zdCBtZmFJbmZvID0gYXdhaXQgdGhpcy4jc2lnbmVyU2Vzc2lvbi5nZXRNZmFJbmZvKG1mYUlkKTtcbiAgICAgIHRoaXMuI29uTWZhUG9sbChtZmFJbmZvKTtcbiAgICAgIGlmIChtZmFJbmZvLnJlY2VpcHQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgcmVzLnNpZ25XaXRoTWZhQXBwcm92YWwoe1xuICAgICAgICAgIG1mYUlkLFxuICAgICAgICAgIG1mYU9yZ0lkOiB0aGlzLiNzaWduZXJTZXNzaW9uLm9yZ0lkLFxuICAgICAgICAgIG1mYUNvbmY6IG1mYUluZm8ucmVjZWlwdC5jb25maXJtYXRpb24sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzLmRhdGEoKTtcbiAgfVxufVxuIl19