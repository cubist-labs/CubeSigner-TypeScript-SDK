import * as cs from "@cubist-labs/cubesigner-sdk";
import { JsonRpcApiProvider, ethers, toBeHex } from "ethers";

const WALLET_ADDRESS: string = env("WALLET_ADDRESS")!;
const RECIPIENT: string = env("RECIPIENT")!;
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://rpc.ankr.com/eth_goerli")!;
const AMOUNT: bigint = ethers.parseEther(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

/** Main entry point */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN
    ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
    : undefined;
  // Load signer session
  const signerSession = await cs.CubeSigner.loadSignerSession(storage);

  const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
  const signer = new EthersCubeSinger(WALLET_ADDRESS, signerSession, provider);

  // get balance
  const addr = await signer.getAddress();
  console.log(`${addr} has ${await provider.getBalance(addr)} gwei`);

  console.log(`Transferring ${AMOUNT} wei from ${addr} to ${RECIPIENT}...`);

  const tx = {
    to: RECIPIENT,
    value: AMOUNT,
  };

  const response = await signer.sendTransaction(tx);
  await response.wait();

  // get new balance
  console.log(`${addr} has ${await provider.getBalance(addr)} gwei`);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * A ethers.js Signer using CubeSigner
 */
export class EthersCubeSinger extends ethers.AbstractSigner {
  /** The address of the account */
  readonly #address: string;

  /** The underlying session */
  readonly #signerSession: cs.SignerSession;

  /** Create new EthersCubeSinger instance
   * @param {string} address The address of the account to use.
   * @param {SignerSession} signerSession The underlying EthersCubeSinger session.
   * @param {null | ethers.Provider} provider The optional provider instance to use.
   */
  constructor(address: string, signerSession: cs.SignerSession, provider?: null | ethers.Provider) {
    super(provider);
    this.#address = address;
    this.#signerSession = signerSession;
  }

  /** Resolves to the signer address. */
  async getAddress(): Promise<string> {
    return this.#address;
  }

  /**
   *  Returns the signer connected to %%provider%%.
   *  @param {null | ethers.Provider} provider The optional provider instance to use.
   *  @return {EthersCubeSinger} The signer connected to signer.
   */
  connect(provider: null | ethers.Provider): EthersCubeSinger {
    return new EthersCubeSinger(this.#address, this.#signerSession, provider);
  }

  /**
   * Signs a transaction.
   * @param {ethers.TransactionRequest} tx The transaction to sign.
   * @return {Promise<string>} Hex-encoded RLP encoding of the transaction and its signature.
   */
  async signTransaction(tx: ethers.TransactionRequest): Promise<string> {
    // get the chain id from the network or tx
    let chainId = tx.chainId;
    if (chainId === undefined) {
      const network = await this.provider?.getNetwork();
      const id = network?.chainId;
      if (id === undefined) {
        throw new Error("Missing chainId");
      }
      chainId = id.toString();
    }

    // Convert the transaction into a JSON-RPC transaction
    const rpcTx =
      this.provider instanceof JsonRpcApiProvider
        ? this.provider.getRpcTransaction(tx)
        : // We can just call the getRpcTransaction with a
          // null receiver since it doesn't actually use it
          // (and really should be declared static).
          JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
    rpcTx.type = toBeHex(tx.type ?? 0x02, 1); // we expect 0x0[0-2]

    const req = <cs.EvmSignRequest>{
      chain_id: Number(chainId),
      tx: rpcTx,
    };
    const sig = await this.#signerSession.signEvm(this.#address, req);
    return sig.data().rlp_signed_tx;
  }

  /** Signs arbitrary message. Unsupported. */
  async signMessage(): Promise<string> {
    throw new Error("This signer can only sign EVM transactions");
  }

  /** Signs typed data. Unsupported. */
  signTypedData(): Promise<string> {
    throw new Error("This signer can only sign EVM transactions");
  }
}

/**
 * Returns the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
