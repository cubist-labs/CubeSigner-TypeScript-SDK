import * as cs from "@cubist-labs/cubesigner-sdk";
import * as ethers from "ethers";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { defineReadOnly, hexlify } from "ethers/lib/utils";

/**
 * Returns an ethers v5 Signer backed by CubeSigner.
 */
export class Signer extends ethers.Signer {
  /** The address of the account */
  readonly address: string;

  /** The underlying session */
  readonly #signerSession: cs.SignerSession;

  /**
   * Create new Signer instance
   * @param {string} address The the eth address of the account to use.
   * @param {cs.SignerSession} signerSession The underlying Signer session.
   * @param {ethers.providers.Provider} provider The optional provider instance to use.
   */
  constructor(
    address: string,
    signerSession: cs.SignerSession,
    provider?: ethers.providers.Provider,
  ) {
    super();
    this.address = address;
    this.#signerSession = signerSession;
    defineReadOnly(this, "provider", provider);
  }

  /** Resolves to the signer address. */
  async getAddress(): Promise<string> {
    return this.address;
  }

  /**
   *  Return the signer connected to %%provider%%.
   *  @param {ethers.providers.Provider} provider The provider instance to use.
   *  @return {Signer} The signer connected to signer.
   */
  connect(provider: ethers.providers.Provider): Signer {
    return new Signer(this.address, this.#signerSession, provider);
  }

  /**
   * Sign a transaction. This method will block if the key requires MFA approval.
   * @param {TransactionRequest} tx The transaction to sign.
   * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransaction(tx: TransactionRequest): Promise<string> {
    const req = await this.evmSignRequestFromTx(tx);
    const res = await this.#signerSession.signEvm(this.address, req);
    const sig = res.data().rlp_signed_tx;
    return sig;
  }

  /**
   * NOT IMPLEMENTED. Signs arbitrary messages.
   * @ignore
   */
  async signMessage(): Promise<string> {
    throw new Error("Method not implemented.");
  }

  /**
   * Construct a signing request from a transaction. This populates the transaction
   * type to `0x02` (EIP-1559) unless set.
   *
   * @param {TransactionRequest} tx The transaction
   * @return {cs.EvmSignRequest} The EVM sign request to be sent to CubeSigner
   */
  async evmSignRequestFromTx(tx: TransactionRequest): Promise<cs.EvmSignRequest> {
    // get the chain id from the network or tx
    let chainId = tx.chainId;
    if (chainId === undefined) {
      const network = await this.provider?.getNetwork();
      chainId = network?.chainId ?? 1;
    }

    // Convert the transaction into a JSON-RPC transaction
    const rpcTx = ethers.providers.JsonRpcProvider.hexlifyTransaction(tx, {
      from: true,
      type: true,
    });
    rpcTx.type = hexlify(tx.type ?? 0x02); // we expect 0x0[0-2]

    return <cs.EvmSignRequest>{
      chain_id: Number(chainId),
      tx: rpcTx,
    };
  }
}

/**
 * Airdrop a specified amount of Ether to the given address.
 *
 * @param {ethers.providers.JsonRpcProvider} provider - The JSON-RPC provider used to send the transaction.
 * @param {string} addr - The address to which the Ether will be airdropped.
 * @param {string?} amount - The amount of Ether to airdrop. Defaults to 100 ETH.
 */
export async function airdrop(
  provider: ethers.providers.JsonRpcProvider,
  addr: string,
  amount?: string,
) {
  const signer = provider.getSigner(0);
  await signer.sendTransaction({
    to: addr,
    value: ethers.utils.parseEther(amount ?? "100"),
  });
}

/**
 * Return the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
