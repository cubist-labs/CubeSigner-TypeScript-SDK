import {
  type Address,
  type AuthorizationRequest,
  type CustomSource,
  type Hex,
  type SignAuthorizationReturnType,
  type Signature,
  bytesToHex,
  formatTransactionRequest,
  getAddress,
  isHex,
  parseSignature,
  parseTransaction,
  serializeTransaction,
  stringToHex,
} from "viem";
import {
  type CubeSignerClient,
  type Eip712SignRequest,
  type EvmSignRequest,
  EvmSigner,
  type EvmSignerOptions,
  type Key,
  encodeToBase64,
} from "@cubist-labs/cubesigner-sdk";
import { hashAuthorization, hexToBytes, keccak256 } from "viem/utils";

/**
 * A class to wrap a CubeSigner key and client into a Viem {@link CustomSource}.
 * Use Viem's `toAccount` to convert this to a Viem Account.
 */
export class CubeSignerSource implements CustomSource {
  /** The internal CubeSigner signer used. */
  readonly #signer: EvmSigner;

  /** The address the wallet is associated with. */
  public readonly address: Address;

  /**
   * Construct a Viem {@link CustomSource} around a CubeSigner key and client.
   * Use Viem's `toAccount` to convert this to a Viem Account.
   *
   * @param address The EVM address this wallet is associated with
   * @param client The session used for signing. Must have necessary scopes.
   * @param options MFA options for the client to respect
   * @throws {Error} if the address is not a valid EVM address
   */
  constructor(address: Key | string, client: CubeSignerClient, options?: EvmSignerOptions) {
    this.#signer = new EvmSigner(address, client, options);

    // NOTE: `getAddress` will checksum the address and throw if it's an invalid EVM address.
    this.address = getAddress(this.#signer.address);

    // Scope these functions to properly resolve `this`
    this.signMessage = this.signMessage.bind(this);
    this.signTransaction = this.signTransaction.bind(this);
    this.signTypedData = this.signTypedData.bind(this);
    this.signAuthorization = this.signAuthorization.bind(this);
  }

  /**
   * Signs arbitrary messages. This uses CubeSigner's EIP-191 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip191Signing"` policy attached.
   *
   * @param root Object around the message
   * @param root.message The message to sign
   * @returns The signature
   */
  public signMessage: CustomSource["signMessage"] = async ({ message }) => {
    let hex;
    if (typeof message === "string") {
      hex = stringToHex(message);
    } else if (isHex(message.raw)) {
      hex = message.raw;
    } else {
      hex = bytesToHex(message.raw);
    }

    const signature = await this.#signer.signEip191({ data: hex });

    return ensureHex(signature);
  };

  /**
   * Signs EIP-712 typed data. This uses CubeSigner's EIP-712 signing endpoint.
   * The key (for this session) must have the `"AllowRawBlobSigning"` or
   * `"AllowEip712Signing"` policy attached.
   * `chainId` must be specified within the `domain`.
   *
   * @param parameters Typed data
   * @returns signature for the typed data
   */
  public signTypedData: CustomSource["signTypedData"] = async (parameters) => {
    assert(parameters.domain, "`domain` must be defined");

    const castedParameters = parameters as Eip712SignRequest["typed_data"];
    assert(castedParameters.domain.chainId, "`domain.chainId` must be defined");

    const signature = await this.#signer.signEip712({
      chain_id: Number(castedParameters.domain.chainId),
      typed_data: castedParameters,
    });

    return ensureHex(signature);
  };

  /**
   * Signs EIP-7702 authorization data
   *
   * @param parameters Authorization requests
   * @returns Signed authorization
   */
  public async signAuthorization(
    parameters: AuthorizationRequest,
  ): Promise<SignAuthorizationReturnType> {
    const hashToSign = hashAuthorization(parameters);
    const key = await this.#signer.key();
    // TODO(CS-3720): use the typed endpoint once we have it
    const resp = await key.signBlob({
      message_base64: encodeToBase64(hexToBytes(hashToSign)),
    });
    const data = await this.#signer.handleMfa(resp);
    const signature = ensureHex(data.signature);
    return {
      address: parameters.contractAddress ?? parameters.address,
      nonce: parameters.nonce,
      chainId: parameters.chainId,
      ...parseSignature(signature),
    };
  }

  /**
   * It is recommended to use `prepareTransactionRequest` on your request
   * before calling this function.
   *
   * Sign a transaction. This method will block if the key requires MFA approval.
   * `chainId` must be defined. If transaction type is not "legacy" or "eip1559",
   * the key must have the `AllowRawBlobSigning` allow policy.
   *
   * @param transaction The transaction to sign
   * @param options Contains an optional custom serializer
   * @returns Signed transaction
   * @throws {Error} if "chainId" isn't specified, or if transaction is not type "legacy" or "eip1559" and key does not have the `AllowRawBlobSigning` allow policy
   */
  public signTransaction: CustomSource["signTransaction"] = async (transaction, options) => {
    assert(transaction.chainId, "`chainId` must be defined");

    const serializer = options?.serializer ?? serializeTransaction;

    // our type sign transaction endpoint only supports type 'legacy' or 'eip1559'
    if (transaction.type === "legacy" || transaction.type === "eip1559") {
      const formatted = formatTransactionRequest(transaction);
      const rlpSignedTransaction = await this.#signer.signTransaction({
        chain_id: transaction.chainId,
        tx: formatted as EvmSignRequest["tx"],
      });

      // since Viem allows users to pass a custom serializer, we will
      // now unserialize and reserialize with Viem's serializer.
      const { r, s, v, yParity, ...parsedTransaction } = parseTransaction(
        ensureHex(rlpSignedTransaction),
      );

      return await serializer(parsedTransaction, { r, s, v, yParity } as Signature);
    } else {
      // otherwise, sign using blob signing
      const serialized = await serializer(transaction);
      const hashToSign = keccak256(serialized);
      const key = await this.#signer.key();
      const resp = await key.signBlob({
        message_base64: encodeToBase64(hexToBytes(hashToSign)),
      });
      const data = await this.#signer.handleMfa(resp);
      const signature = parseSignature(ensureHex(data.signature));
      return await serializer(transaction, signature);
    }
  };
}

/**
 * @param input A hex string
 * @returns the input, type narrowed to Hex
 * @throws {Error} if input is not Hex
 */
function ensureHex(input: string): Hex {
  assert(isHex(input), `${input} is not hex`);
  return input;
}

/**
 * @param value A value that is expected to be truthy
 * @param message The error message if the value is falsy
 * @throws {Error} if value is not truthy
 */
function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}
