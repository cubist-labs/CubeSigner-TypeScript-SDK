import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as StellarSdk from "stellar-sdk";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const MEMO: string = env("MEMO", "hello from CubeSigner!")!;
const AMOUNT: string = env("AMOUNT", "1.234567")!;
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

/**
 * Example
 * Base on https://github.com/stellar/js-stellar-sdk/blob/62eab36822cd7a3e16d201bcbae7e9ed28589310/docs/reference/examples.md
 */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();

  // Load signer session
  const client = await cs.CubeSignerClient.create(storage);

  // Load account
  const account = await server.loadAccount(FROM_ADDRESS);
  console.log(`${account.accountId()} has ${account.balances[0].balance} lumens`);

  // Get fee for transaction
  const fee = await server.fetchBaseFee();

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: TO_ADDRESS,
        asset: StellarSdk.Asset.native(),
        amount: AMOUNT,
      }),
    )
    .setTimeout(30) // Make this transaction valid for the next 30 seconds only
    .addMemo(StellarSdk.Memo.text(MEMO))
    .build();

  // Sign transaction using CubeSigner
  await signTransaction(transaction, client, FROM_ADDRESS);

  // Let's see the XDR (encoded in base64) of the transaction we just built
  console.log(transaction.toEnvelope().toXDR("base64"));

  // Submit the transaction to the Horizon server. The Horizon server will then
  // submit the transaction into the network for us.
  const transactionResult = await server.submitTransaction(transaction);
  console.log("Success!");
  console.log(JSON.stringify(transactionResult, null, 2));
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Signs a transaction using the signer session.
 *
 * @param transaction The transaction to sign.
 * @param client The signer session.
 * @param fromAddress The address of the account that is signing the transaction.
 */
async function signTransaction(
  transaction: StellarSdk.Transaction,
  client: cs.CubeSignerClient,
  fromAddress: string,
): Promise<void> {
  // Sign transaction
  const hexSig = (
    await client.apiClient.signBlob(`Key#Stellar_${fromAddress}`, {
      message_base64: transaction.hash().toString("base64"),
    })
  ).data().signature;

  // Strip 0x and convert to buffer
  const signature = Buffer.from(hexSig.slice(2), "hex");
  // Get the hint for the keypair we're using to sign
  const hint = StellarSdk.Keypair.fromPublicKey(fromAddress).signatureHint();
  // Create a decorated signature
  const decoratedSignature = new StellarSdk.xdr.DecoratedSignature({
    hint,
    signature,
  });
  // Add the signature to the transaction
  transaction.signatures.push(decoratedSignature);
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
