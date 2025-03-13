import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as sui from '@mysten/sui/client';
import * as suiFaucet from '@mysten/sui/faucet';
import { type PublicKey, type SignatureScheme, Signer } from "@mysten/sui/cryptography";
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rl = require('readline-sync');

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS", FROM_ADDRESS)!;
const SUI_NETWORK = env("SUI_NETWORK", "devnet")! as "mainnet" | "testnet" | "devnet";
const AMOUNT: bigint = BigInt(env("AMOUNT", "2000")!);
const SUI_COIN_TYPE: string = "0x2::sui::SUI";
const COIN_TYPE: string = env("COIN_TYPE", SUI_COIN_TYPE)!;
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);

/** Main entry point */
async function main() {
  const suiClient = new sui.SuiClient({ url: sui.getFullnodeUrl(SUI_NETWORK) });
  await printBalance(suiClient, FROM_ADDRESS);

  // top up if low balance and not on mainnet
  if (SUI_NETWORK !== "mainnet") {
    // Get balance in SUI
    const bal = await suiClient.getBalance({
      owner: FROM_ADDRESS,
    });

    if (parseFloat(bal.totalBalance) < 1000000) {
      console.log("Topping up...")
      await suiFaucet.requestSuiFromFaucetV1({
        // use getFaucetHost to make sure you're using correct faucet address
        // you can also just use the address (see Sui TypeScript SDK Quick Start for values)
        host: suiFaucet.getFaucetHost(SUI_NETWORK),
        recipient: FROM_ADDRESS,
      });
      // sleep for 3 seconds
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // create transaction
  const tx = new Transaction();
  let coin;
  if (COIN_TYPE === SUI_COIN_TYPE) {
    coin = tx.splitCoins(tx.gas, [AMOUNT])[0];
  } else {
    const coins = await suiClient.getCoins({ owner: FROM_ADDRESS, coinType: COIN_TYPE });
    if (coins.data.length === 0) {
        throw new Error(`No coins of type '${COIN_TYPE}' found`);
    }
    const coinObjectId = coins.data[0].coinObjectId;
    if (coins.data.length >= 2) {
      console.log("Merging coins");
      // merge coins into the first
      tx.mergeCoins(coinObjectId, coins.data.slice(1).map(coin => coin.coinObjectId));
    }
    coin = tx.splitCoins(tx.object(coinObjectId), [AMOUNT])[0];
  }
  tx.transferObjects([coin], TO_ADDRESS);

  // print transaction
  console.log("Transaction:");
  console.log(await tx.toJSON());

  if (!process.env.CI) {
    rl.question("Press any key to continue (or ^C to quit)...");
  }

  // create CubeSigner-backed signer
  const csClient = await cs.CubeSignerClient.create(CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager());
  const fromKey = await csClient.apiClient.keyGetByMaterialId(cs.Ed25519.Sui, FROM_ADDRESS);
  const csSuiSigner = new CsSuiSigner(csClient, fromKey);

  // sign and execute
  const resp = await suiClient.signAndExecuteTransaction({
    signer: csSuiSigner,
    transaction: tx,
  });
  console.log("Waiting for", resp);
  const confirmation = await suiClient.waitForTransaction({ digest: resp.digest });
  console.log("Done", confirmation);
  await printBalance(suiClient, FROM_ADDRESS);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * SUI signer backed by CubeSigner
 */
class CsSuiSigner extends Signer {
  readonly #csCLient: cs.CubeSignerClient;
  readonly #key: cs.Key;

  /**
   * Constructor
   *
   * @param csClient CubeSigner client
   * @param key The key to use for signing
   */
  constructor(csClient: cs.CubeSignerClient, key: cs.KeyInfo) {
    super();
    this.#csCLient = csClient;
    this.#key = new cs.Key(csClient, key);
  }

  /**
   * Sign raw bytes
   *
   * @param bytes The bytes to sign
   * @returns The signature
   */
  async sign(bytes: Uint8Array): Promise<Uint8Array> {
    console.log(`Signing bytes with CubeSigner key ${this.#key.id}`)
    
    let resp = await this.#key.signBlob({
      message_base64: Buffer.from(bytes).toString("base64")
    });

    // ask for the user to approve if needed
    while (resp.requiresMfa()) {
      const mfaId = resp.mfaId()!;
      const mfaConf = rl.question(`Please approve ${mfaId} and enter the confirmation code:\n> `);
      resp = await resp.execWithMfaApproval({
        mfaConf,
        mfaId,
        mfaOrgId: this.#csCLient.orgId
      });
    }

    // return the signature
    const sig = resp.data().signature;
    return new Uint8Array(Buffer.from(sig.slice(2), "hex"));
  }

  /**
   * @returns The signature scheme
   */
  getKeyScheme(): SignatureScheme {
    return "ED25519";
  }

  /**
   * @returns The Ed25519 public key of this signer's key.
   */
  getPublicKey(): PublicKey {
    const bytes = Buffer.from(this.#key.publicKey.slice(2), "hex");
    return new Ed25519PublicKey(bytes);
  }
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

/**
 * Print all coin balances of the owner.
 *
 * @param suiClient The SUI client
 * @param owner The owner address
 */
async function printBalance(suiClient: sui.SuiClient, owner: string) {
  const balances = await suiClient.getAllBalances({ owner });
  console.table(balances);
}
