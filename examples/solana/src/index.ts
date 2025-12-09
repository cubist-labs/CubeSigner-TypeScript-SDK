import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const FEE_PAYER_ADDRESS: string = env("FEE_PAYER_ADDRESS")!;
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://api.devnet.solana.com")!;
const AMOUNT: number = parseFloat(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

/** Main entry point */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultUserSessionManager();
  // Load signer session

  const client = await cs.CubeSignerClient.create(storage);

  const connection = new Connection(RPC_PROVIDER, "confirmed");
  const fromPubkey = new PublicKey(FROM_ADDRESS);
  const toPubkey = new PublicKey(TO_ADDRESS);
  const feePayerPubkey = new PublicKey(FEE_PAYER_ADDRESS);

  const thirdPartyPaysFee = !fromPubkey.equals(feePayerPubkey);
  console.log(`Fee payer: ${feePayerPubkey}`)

  // get airdrops
  try {
    await getAirDrop(fromPubkey, connection);
    // get additional air drop if sender is not paying the fee
    if (thirdPartyPaysFee) {
      await getAirDrop(feePayerPubkey, connection);
    }
  } catch (e) {
    console.log(`Airdrop failed: ${e}. Ignoring.`);
  }

  // get balance
  console.log(
    `${fromPubkey} has ${(await connection.getBalance(fromPubkey)) / LAMPORTS_PER_SOL} SOL`,
  );
  console.log(`${toPubkey} has ${(await connection.getBalance(toPubkey)) / LAMPORTS_PER_SOL} SOL`);
  if (thirdPartyPaysFee) {
    console.log(`${feePayerPubkey} has ${(await connection.getBalance(feePayerPubkey)) / LAMPORTS_PER_SOL} SOL`);
  }

  console.log(`Transferring ${AMOUNT} SOL from ${fromPubkey} to ${toPubkey} with fee payer: ${feePayerPubkey}...`);

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: AMOUNT * LAMPORTS_PER_SOL,
    }),
  );

  // set fee payer to third party. Alternatively, this can be set to the 'from' address
  tx.feePayer = feePayerPubkey;

  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  const base64 = tx.serializeMessage().toString("base64");

  // Step 1: Sender signs using the well-typed solana end point (which requires a base64 serialized Message)
  const sigBytes = await signSolana(client, FROM_ADDRESS, base64);
  // add signature to transaction
  tx.addSignature(fromPubkey, sigBytes);

  // Optional Step 2: Similarly the fee payer signs. This step is required if sender is not the fee payer.
  if (thirdPartyPaysFee) {
    const feePayerSigBytes = await signSolana(client, FEE_PAYER_ADDRESS, base64);
    tx.addSignature(feePayerPubkey, feePayerSigBytes);
  }

  // Step 3: send transaction
  const txHash = await connection.sendRawTransaction(tx.serialize());
  console.log(`txHash: ${txHash}`);

  // Wait for confirmation
  await connection.confirmTransaction(
    { signature: txHash, ...(await connection.getLatestBlockhash()) },
    "confirmed"
  );

  console.log("Transaction confirmed!");

  // get balance
  console.log(
    `${fromPubkey} has ${(await connection.getBalance(fromPubkey)) / LAMPORTS_PER_SOL} SOL`,
  );
  console.log(`${toPubkey} has ${(await connection.getBalance(toPubkey)) / LAMPORTS_PER_SOL} SOL`);
  if (thirdPartyPaysFee) {
    console.log(`${feePayerPubkey} has ${(await connection.getBalance(feePayerPubkey)) / LAMPORTS_PER_SOL} SOL`)
  }
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Signs a Solana transaction message using the typed CubeSigner `signSolana` endpoint.
 *
 * This method requires the message to be serialized as a base64 string, and returns the
 * resulting signature as a byte buffer.
 * 
 * @param client An authenticated CubeSigner client instance.
 * @param key The {@link cs.Key} or its material ID used to sign the message.
 * @param messageBase64 The serialized Solana message, encoded in base64.
 * @returns  A Buffer containing the signature bytes.
 */
export async function signSolana(client: cs.CubeSignerClient, key: cs.Key | string, messageBase64: string): Promise<Buffer> {
    const resp = await client.apiClient.signSolana(key, { message_base64: messageBase64 });
    const sig = resp.data().signature;
    // convert the signature 0x... to bytes
    return Buffer.from(sig.slice(2), "hex");
}

/**
 * Requests and confirms an airdrop of 1 SOL to the specified Solana account.
 * 
 * @param account The Solana public key (address) to receive the airdrop.
 * @param connection The Solana RPC connection used to send and confirm the transaction.
 */
export async function getAirDrop(account: PublicKey, connection: Connection): Promise<void> {
  const airdropSignature = await connection.requestAirdrop(account, LAMPORTS_PER_SOL);
  const latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({signature: airdropSignature, ...latestBlockHash}, "confirmed");

  console.log(`${account} got an airdrop!`);
}

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
