import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { Signer as CsEthersSigner } from "@cubist-labs/cubesigner-sdk-ethers-v6";
import { ethers } from "ethers";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const RPC_PROVIDER: string = env("RPC_PROVIDER")!;
const AMOUNT: bigint = ethers.parseEther(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

/** Main entry point */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager(); // Load signer session

  const client = await cs.CubeSignerClient.create(storage);

  const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
  const signer = new CsEthersSigner(FROM_ADDRESS, client, { provider });

  // get balance
  const addr = await signer.getAddress();
  console.log(`${addr} has ${await provider.getBalance(addr)} gwei`);

  console.log(`Transferring ${AMOUNT} wei from ${addr} to ${TO_ADDRESS}...`);

  const tx = {
    to: TO_ADDRESS,
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
