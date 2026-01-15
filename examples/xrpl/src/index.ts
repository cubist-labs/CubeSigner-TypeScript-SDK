import * as cs from "@cubist-labs/cubesigner-sdk";
import { defaultUserSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import assert from "assert";
import * as xrpl from "xrpl";
import BigNumber from 'bignumber.js'
import { GlobalFlags, type Payment, type Transaction, ValidationError } from "xrpl";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const AMOUNT: string = env("AMOUNT", "100000")!; // 0.1 XRP in drops
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs session create --user --scope 'sign:blob' --scope 'manage:key:get' --output base64)

/** Example XRP payment transaction. */
async function main() {
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN ?? defaultUserSessionManager();

  // Load signer session
  const csClient = await cs.CubeSignerClient.create(storage);
  const org = csClient.org();
  const fromKey = await org.getKeyByMaterialId(cs.Ed25519.Xrp, FROM_ADDRESS);
  const fromWallet = new XrpEdWallet(fromKey);

  const xrpClient = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await xrpClient.connect();


  console.log("Funding wallets from faucet...");
  await xrpClient.fundWallet(fromWallet);
  await xrpClient.fundWallet(new XrpEdWallet(await org.getKeyByMaterialId(cs.Ed25519.Xrp, TO_ADDRESS)));

  // Get account info
  const getBalance = async (account: string) => {
    const accountInfo = await xrpClient.request({
      command: 'account_info',
      account,
    });
    return xrpl.dropsToXrp(accountInfo.result.account_data.Balance);
  };
  console.log(`From ${FROM_ADDRESS} balance: ${await getBalance(FROM_ADDRESS)} XRP`);
  console.log(`To   ${TO_ADDRESS} balance: ${await getBalance(TO_ADDRESS)} XRP`);

  let transaction: xrpl.Payment = {
    TransactionType: 'Payment',
    Account: FROM_ADDRESS,
    Destination: TO_ADDRESS,
    Amount: AMOUNT
  };

  // Autofill remaining transaction fields
  try {
    transaction = await xrpClient.autofill(transaction)
  } catch (error) {
    console.error(`Failed to autofill transaction: ${error}`)
  }

  // Sign transaction
  const signed = await fromWallet.signTransaction(transaction);
  console.log("Identifying hash:", signed.hash)
  console.log("Signed blob:", signed.tx_blob)

  // Submit signed blob
  const tx = await xrpClient.submitAndWait(signed.tx_blob)
  const meta = tx.result.meta as xrpl.TransactionMetadata<Payment>;
  console.log("Transaction result:", meta.TransactionResult)
  console.log("Balance changes:", JSON.stringify(xrpl.getBalanceChanges(meta), null, 2))

  await xrpClient.disconnect();
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Extends xrpl.Wallet to support signing via CubeSigner for payment transactions.
 * Their Wallet implementation assumes local private keys, so we can't re-use their
 * sign() implementation directly.
 */
class XrpEdWallet extends xrpl.Wallet {
  public readonly key: cs.Key;

  /**
   * Create a new Xrp Ed25519 Wallet instance from a CubeSigner key.
   *
   * @param key CubeSigner key to sign transactions with
   */
  public constructor(key: cs.Key) {
    assert(key.cached.key_type === cs.Ed25519.Xrp, "Expected Ed25519 key");
    const pubKey = `ed${key.publicKey.replace(/^0x/, "")}`;
    super(pubKey, "");
    this.key = key;

    assert(this.address === key.materialId, "Derived address does not match expected address");
    Object.defineProperty(this, "privateKey", {
      get: () => { throw new Error("Private key access is not allowed"); },
    });
  }

  /**
   * @inheritdoc 
   */
  public sign(this: xrpl.Wallet, _transaction: Transaction, _multisign?: boolean | string): { tx_blob: string; hash: string; } {
    throw new Error("Use signTransaction() for CubeSigner signing");
  }

  /**
   * Sign a XRP transaction using CubeSigner.
   * This function follows the original Wallet sign() [xrpl-sign] implementaiton
   * (ISC License), but replaces the local signing with a call to CubeSigner.
   * We do not port their multisig support.
   * We do not support CubeSigner MFA signing flows in this example.
   * 
   * [xrpl-sign] https://github.com/XRPLF/xrpl.js/blob/802406e8800eda5a3e6f63652fc263ebacac6aa0/packages/xrpl/src/Wallet/index.ts#L379
   * 
   * @param transaction The transaction to sign.
   * @returns A signed transaction.
   */
  public async signTransaction(transaction: xrpl.Transaction): Promise<{
    tx_blob: string
    hash: string
  }> {

    // clean null & undefined valued tx properties
    const tx = omitBy(
      { ...transaction },
      (value) => value == null,
    ) as unknown as Transaction

    // Clean up transaction (this is directly from xrpl.js Wallet.sign())
    removeTrailingZeros(tx);
    xrpl.validate(tx);
    if (hasFlag(tx, GlobalFlags.tfInnerBatchTxn, 'tfInnerBatchTxn')) {
      throw new ValidationError('Cannot sign a Batch inner transaction.')
    }

    // Prepare transaction to sign (also from xrpl.js Wallet.sign())
    const txToSignAndEncode = { ...tx, SigningPubKey: this.publicKey };

    // Sign transaction using CubeSigner
    const txBlobNoSig = xrpl.encodeForSigning(txToSignAndEncode)
    const resp = await this.key.signBlob({
      message_base64: Buffer.from(txBlobNoSig, "hex").toString("base64"),
    });
    if (resp.requiresMfa()) {
      throw new Error("MFA support not implemented in this example");
    }
    txToSignAndEncode.TxnSignature = resp.data().signature.replace(/^0x/, "");

    const serialized = xrpl.encode(txToSignAndEncode);
    return {
      tx_blob: serialized,
      hash: xrpl.hashes.hashSignedTx(serialized),
    };
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

// ---------------------------------------------------------------------------
// VENDORED CODE -------------------------------------------------------------
// xrpl.js github repo doesn't have a license file, but the package.json says ISC
// ---------------------------------------------------------------------------

/**
 * From xrpl.js 4.4.3 (ISC License)
 * Also: https://github.com/XRPLF/xrpl.js/blob/802406e8800eda5a3e6f63652fc263ebacac6aa0/packages/xrpl/src/Wallet/index.ts#L502 
 * 
 * Remove trailing insignificant zeros for non-XRP Payment amount.
 * This resolves the serialization mismatch bug when encoding/decoding a non-XRP Payment transaction
 * with an amount that contains trailing insignificant zeros; for example, '123.4000' would serialize
 * to '123.4' and cause a mismatch.
 *
 * @param tx The transaction prior to signing.
 */
function removeTrailingZeros(tx: xrpl.Transaction): void {
  if (
    tx.TransactionType === 'Payment' &&
    typeof tx.Amount !== 'string' &&
    tx.Amount.value.includes('.') &&
    tx.Amount.value.endsWith('0')
  ) {
    tx.Amount = { ...tx.Amount }
    tx.Amount.value = new BigNumber(tx.Amount.value).toString()
  }
}


/**
 * From xrpl.js 4.4.3 (ISC License)
 * Also: https://github.com/XRPLF/xrpl.js/blob/802406e8800eda5a3e6f63652fc263ebacac6aa0/packages/xrpl/src/models/utils/index.ts#L27
 * 
 * Perform bitwise AND (&) to check if a flag is enabled within Flags (as a number).
 *
 * @param Flags A number that represents flags enabled.
 * @param checkFlag A specific flag to check if it's enabled within Flags.
 * @returns True if checkFlag is enabled within Flags.
 */
export function isFlagEnabled(Flags: number, checkFlag: number): boolean {
  return (BigInt(checkFlag) & BigInt(Flags)) === BigInt(checkFlag)
}

/**
 * From xrpl.js 4.4.3 (ISC License)
 * Also: https://github.com/XRPLF/xrpl.js/blob/802406e8800eda5a3e6f63652fc263ebacac6aa0/packages/xrpl/src/models/utils/index.ts#L40
 * Determines whether a transaction has a certain flag enabled.
 *
 * @param tx The transaction to check for the flag.
 * @param flag The flag to check.
 * @param flagName The name of the flag to check, used for object flags.
 * @returns Whether `flag` is enabled on `tx`.
 */
export function hasFlag(
  tx: Transaction | Record<string, unknown>,
  flag: number,
  flagName: string,
): boolean {
  if (tx.Flags == null) {
    return false
  }
  if (typeof tx.Flags === 'number') {
    return isFlagEnabled(tx.Flags, flag)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- from vendored code
  return (tx.Flags as any)[flagName] === true
}

type ValueOf<T> = T[keyof T]

/**
 * Creates an object composed of the own and inherited enumerable string keyed properties of object that
 * predicate doesn't return truthy for.
 *
 * @param obj Object to have properties removed.
 * @param predicate function that returns whether the property should be removed from the obj.
 *
 * @returns object
 */
export function omitBy<T extends object>(
  obj: T,
  predicate: (objElement: ValueOf<T>, k: string | number | symbol) => boolean,
): Partial<T> {
  const keys: Array<keyof T> = Object.keys(obj) as Array<keyof T>
  const keysToKeep = keys.filter((kb) => !predicate(obj[kb], kb))
  return keysToKeep.reduce((acc: Partial<T>, key: keyof T) => {
    acc[key] = obj[key]
    return acc
  }, {})
}
