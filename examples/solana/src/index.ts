/**
 * An example using @solana/kit to transfer 0.001 SOL from `FROM_ADDRESS` to
 * `TO_ADDRESS` over Solana devnet using CubeSigner.
 *
 * Define `FROM_ADDRESS` and `TO_ADDRESS` in your terminal environment. Optionally,
 * define `FEE_PAYER_ADDRESS`, `AMOUNT`, `CUBE_SIGNER_TOKEN`, `RPC_PROVIDER`, and/or
 * `RPC_SUBSCRIPTIONS_PROVIDER`. See the README for documentation on them.
 *
 * Your CubeSigner session must have these scopes: [`manage:key:get`, `sign:solana`].
 * This example is based on https://solana.com/docs/core/instructions#sol-transfer-example
 */
import type {
  Address,
  GetBalanceApi,
  GetLatestBlockhashApi,
  GetSignatureStatusesApi,
  RequestAirdropApi,
  Rpc,
  RpcSubscriptions,
  SignatureNotificationsApi,
} from "@solana/kit";
import {
  address,
  airdropFactory,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { defaultUserSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import { CubeSignerClient } from "@cubist-labs/cubesigner-sdk";
import { CsTransactionPartialSigner } from "./signer";

/** The Solana address to send funds from. This should be the `material_id` of a Solana key, not the `id` (so it should *not* start with `Key#Solana`). */
const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
/** The Solana address to send funds to. */
const TO_ADDRESS: string = env("TO_ADDRESS")!;

/** An optional address to pay the transaction fee. If not provided, the `FROM_ADDRESS` will pay $AMOUNT SOL and the transaction fee. */
const FEE_PAYER_ADDRESS: string = env("FEE_PAYER_ADDRESS", FROM_ADDRESS)!;
/** An optional amount, in SOL, to transfer from FROM_ADDRESS. Defaults to 0.001 SOL. */
const AMOUNT: number = parseFloat(env("AMOUNT", "0.001")!);
/** An optional CubeSigner session token. Defaults to your default user session. */
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs session create ... --user --output base64)

/** An optional Solana JSON-RPC provider. Defaults to devnet. */
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://api.devnet.solana.com")!;
/** An optional Solana JSON-RPC Subscription provider. Should be a websocket uri. Defaults to devnet. */
const RPC_SUBSCRIPTIONS_PROVIDER: string = env(
  "RPC_SUBSCRIPTIONS_PROVIDER",
  "wss://api.devnet.solana.com",
)!;

/** Constant for conversion. */
const LAMPORTS_PER_SOL = 1_000_000_000n;

/** Main entry point */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load session from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? defaultUserSessionManager();

  const client = await CubeSignerClient.create(storage);

  // Create Solana signers for our FROM and FEE_PAYER addresses.
  const fromSigner = new CsTransactionPartialSigner(address(FROM_ADDRESS), client);
  const feePayerSigner = new CsTransactionPartialSigner(address(FEE_PAYER_ADDRESS), client);
  const thirdPartyPaysFee = fromSigner.address !== feePayerSigner.address;

  const toPubkey = address(TO_ADDRESS);

  // Initialize Solana RPC connections
  const rpc = createSolanaRpc(RPC_PROVIDER);
  const rpcSubscriptions = createSolanaRpcSubscriptions(RPC_SUBSCRIPTIONS_PROVIDER);

  // get airdrops
  console.log("Requesting airdrops...");
  const airdrops: Promise<void>[] = [getAirDrop(fromSigner.address, rpc, rpcSubscriptions)];

  // airdrop the fee payer if it's separate from the from address
  if (thirdPartyPaysFee) {
    airdrops.push(getAirDrop(feePayerSigner.address, rpc, rpcSubscriptions));
  }

  // Allow for airdrop failures, due to running this example on mainnet (which doesn't do airdrops) or rate limiting
  // If the wallets do not have enough funds, submitting the transaction will fail with a reasonable error
  await Promise.allSettled(airdrops);

  // get balance
  await printBalance(rpc, fromSigner.address, toPubkey, feePayerSigner.address);

  console.log();
  console.log(
    `Transferring ${AMOUNT * Number(LAMPORTS_PER_SOL)} lamports from ${fromSigner.address} to ${toPubkey}${thirdPartyPaysFee ? ` with fee payer: ${feePayerSigner.address}` : ""}...`,
  );

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transferInstruction = getTransferSolInstruction({
    source: fromSigner,
    destination: toPubkey,
    amount: AMOUNT * Number(LAMPORTS_PER_SOL),
  });

  const tx = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) =>
      setTransactionMessageFeePayerSigner(thirdPartyPaysFee ? feePayerSigner : fromSigner, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions([transferInstruction], tx),
  );

  const signedTransaction = await signTransactionMessageWithSigners(tx);
  assertIsTransactionWithBlockhashLifetime(signedTransaction);
  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
    commitment: "confirmed",
  });

  // get balance
  await printBalance(rpc, fromSigner.address, toPubkey, feePayerSigner.address);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Requests and confirms an airdrop of 1 SOL to the specified Solana account.
 *
 * @param account The Solana public key (address) to receive the airdrop.
 * @param rpc The Solana RPC connection used to send the request.
 * @param rpcSubscriptions The Solana RPC subscriptions connection to get confirmation for the request.
 */
async function getAirDrop(
  account: Address,
  rpc: Rpc<RequestAirdropApi & GetLatestBlockhashApi & GetSignatureStatusesApi>,
  rpcSubscriptions: RpcSubscriptions<SignatureNotificationsApi>,
) {
  try {
    await airdropFactory({ rpc, rpcSubscriptions })({
      recipientAddress: account,
      lamports: lamports(LAMPORTS_PER_SOL),
      commitment: "confirmed",
    });

    console.log(`${account} got an airdrop!`);
  } catch (e) {
    console.log(`Airdrop to ${account} failed: ${e}. Ignoring.`);
  }
}

/**
 * Prints the balance of the provided addresses.
 *
 * @param rpc Where to get the balance from
 * @param from The from address
 * @param to The to address
 * @param feePayer Optional fee payer address, if separate from fromAddress
 */
async function printBalance(
  rpc: Rpc<GetBalanceApi>,
  from: Address,
  to: Address,
  feePayer?: Address,
) {
  console.log(`[from] ${from} has ${await getBalance(from, rpc)} lamports`);
  console.log(`[ to ] ${to} has ${await getBalance(to, rpc)} lamports`);
  if (feePayer && feePayer !== from) {
    console.log(`[fee ] ${feePayer} has ${await getBalance(feePayer, rpc)} lamports`);
  }
}

/**
 * Gets the balance of the address in lamports.
 *
 * @param address The address to get the balance for
 * @param rpc The Solana JSON-RPC to get the balance from
 * @returns The balance in sols
 */
async function getBalance(address: Address, rpc: Rpc<GetBalanceApi>) {
  const { value } = await rpc.getBalance(address).send();
  return value;
}

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback The optional fallback value.
 * @returns The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
