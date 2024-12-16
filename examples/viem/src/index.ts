import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { http, createPublicClient, parseEther, formatTransactionRequest, isAddress } from "viem";
import { holesky } from "viem/chains";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://rpc.ankr.com/eth_holesky")!;
const AMOUNT: bigint = parseEther(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

/** Main entry point */
async function main() {
  if (!isAddress(FROM_ADDRESS)) {
    throw new Error(`Expected '${FROM_ADDRESS}' to start with '0x'`);
  }
  if (!isAddress(TO_ADDRESS)) {
    throw new Error(`Expected '${TO_ADDRESS}' to start with '0x'`);
  }

  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager(); // Load signer session

  const client = await cs.CubeSignerClient.create(storage);

  const publicClient = createPublicClient({
    chain: holesky,
    transport: http(RPC_PROVIDER),
  });

  const key = await client.org().getKeyByMaterialId(cs.Secp256k1.Evm, FROM_ADDRESS);

  const tx = await publicClient.prepareTransactionRequest({
    account: FROM_ADDRESS,
    to: TO_ADDRESS,
    value: AMOUNT,
  });
  const txReq = formatTransactionRequest(tx);

  const sig = await key.signEvm({
    chain_id: holesky.id,
    tx: txReq as cs.EvmTransaction,
  });
  const serializedTransaction = sig.data().rlp_signed_tx as `0x{string}`;
  const txId = await publicClient.sendRawTransaction({ serializedTransaction });
  console.log(`TX id: ${txId}`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txId,
    confirmations: 3,
  });
  console.log(receipt);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback The optional fallback value.
 * @returns The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
