import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import assert from "assert";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://api.devnet.solana.com")!;
const AMOUNT: number = parseFloat(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

/** Main entry point */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN
    ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
    : csFs.defaultSignerSessionStorage();
  // Load signer session
  const signerSession = await cs.SignerSession.loadSignerSession(storage);

  const connection = new Connection(RPC_PROVIDER, "confirmed");
  const fromPubkey = new PublicKey(FROM_ADDRESS);
  const toPubkey = new PublicKey(TO_ADDRESS);

  // get airdrop
  try {
    const airdropSignature = await connection.requestAirdrop(fromPubkey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSignature);
    console.log("Got an airdrop!");
  } catch (e) {
    console.log(`Airdrop failed: ${e}. Ignoring.`);
  }

  // get balance
  console.log(
    `${fromPubkey} has ${(await connection.getBalance(fromPubkey)) / LAMPORTS_PER_SOL} SOL`,
  );
  console.log(`${toPubkey} has ${(await connection.getBalance(toPubkey)) / LAMPORTS_PER_SOL} SOL`);

  console.log(`Transferring ${AMOUNT} SOL from ${fromPubkey} to ${toPubkey}...`);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: AMOUNT * LAMPORTS_PER_SOL,
    }),
  );
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = fromPubkey;
  const base64 = tx.serializeMessage().toString("base64");

  // sign using the well-typed solana end point (which requires a base64 serialized Message)
  const resp = await signerSession.signSolana(FROM_ADDRESS, { message_base64: base64 });
  const sig = resp.data().signature;
  // conver the signature 0x... to bytes
  const sigBytes = Buffer.from(sig.slice(2), "hex");

  try {
    // Sign using the blob-signing end point. This requires the key to have
    // '"AllowRawBlobSigning"' policy (and thus the signing attempt could fail).

    // CubeSigner internal key representation
    const from_key_id = `Key#Solana_${fromPubkey.toBase58()}`;
    // sign using the blob-signing end point
    const blobSig = (await signerSession.signBlob(from_key_id, { message_base64: base64 })).data()
      .signature;

    // The signature should be the same
    assert(blobSig === sig, "Blob signature does not match the signature from solana-signing");
  } catch (e) {
    console.log(`Failed to sign blob: ${e}. Ignoring.`);
  }

  // add signature to transaction
  tx.addSignature(fromPubkey, sigBytes);

  // send transaction
  const txHash = await connection.sendRawTransaction(tx.serialize());
  console.log(`txHash: ${txHash}`);

  // get balance
  console.log(
    `${fromPubkey} has ${(await connection.getBalance(fromPubkey)) / LAMPORTS_PER_SOL} SOL`,
  );
  console.log(`${toPubkey} has ${(await connection.getBalance(toPubkey)) / LAMPORTS_PER_SOL} SOL`);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Returns the value of the environment variable.
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
