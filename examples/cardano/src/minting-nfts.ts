// This example extends the Minting NFT example from:
// https://github.com/Emurgo/cardano-serialization-lib/blob/5c58e5ee75b0d6262840287ba06c9f9d1caf1037/doc/getting-started/minting-nfts.md
// which is licensed under MIT. The LICENSE file can be found in LICENSE-cardano-serialization-lib.
// The BlockFrost API usage was partly inspired by Petrovich Vlad.
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import type {
  TransactionHash} from "@emurgo/cardano-serialization-lib-nodejs";
import CardanoWasm, {
  Vkeywitness,
} from "@emurgo/cardano-serialization-lib-nodejs";
import { blake2bHex } from "blakejs";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import type { Key} from "@cubist-labs/cubesigner-sdk";
import { CubeSignerClient } from "@cubist-labs/cubesigner-sdk";

const ACCOUNT_KEY: string = env("ACCOUNT_KEY")!;
const POLICY_KEY: string = env("POLICY_KEY")!;
const BLOCKFROST_API_KEY: string = env("BLOCKFROST_API_KEY")!;
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

const blockfrostClient = new BlockFrostAPI({
  projectId: BLOCKFROST_API_KEY,
});

/**
 * Mint an NFT.
 *
 * @param accountKey The account key to mint from.
 * @param policy The policy to mint from.
 * @param assetName The name of the asset.
 * @param description The description of the asset.
 * @param imageUrl The URL of the image.
 * @param mediaType The media type of the image.
 */
async function mintNft(
  accountKey: Key,
  policy: PolicyInfo,
  assetName: string,
  description: string,
  imageUrl: string,
  mediaType: string,
) {
  const FEE = 300000;

  const _accountKeyHash = keyHash(accountKey.publicKey);

  const addr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(_accountKeyHash),
    CardanoWasm.StakeCredential.from_keyhash(_accountKeyHash),
  ).to_address();

  const _policyKeyHash = keyHash(policy.key.publicKey);

  const policyAddr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(_policyKeyHash),
    CardanoWasm.StakeCredential.from_keyhash(_policyKeyHash),
  ).to_address();

  console.log(`ADDR: ${addr.to_bech32()}`);
  console.log(`POLICY_ADDR: ${addr.to_bech32()}`);

  const utxos = await blockfrostClient.addressesUtxos(addr.to_bech32());
  let utxo = null;

  if (utxos) {
    for (const utxoEntry of utxos) {
      if (Number(utxoEntry.amount[0].quantity) > FEE) {
        utxo = utxoEntry;
      }
    }
  }

  if (utxo === null) {
    throw new Error("no utxo found with sufficient ADA.");
  }

  console.log(`UTXO: ${JSON.stringify(utxo, null, 4)}`);

  const latestBlock = await blockfrostClient.blocksLatest();
  const currentSlot = latestBlock.slot;
  if (!currentSlot) {
    throw Error("Failed to fetch slot number");
  }
  const ttl = currentSlot + 60 * 60 * 2; // two hours from now

  const txBuilder = CardanoWasm.TransactionBuilder.new(
    CardanoWasm.TransactionBuilderConfigBuilder.new()
      .fee_algo(
        CardanoWasm.LinearFee.new(
          CardanoWasm.BigNum.from_str("44"),
          CardanoWasm.BigNum.from_str("155381"),
        ),
      )
      .coins_per_utxo_word(CardanoWasm.BigNum.from_str("155381"))
      .pool_deposit(CardanoWasm.BigNum.from_str("500000000"))
      .key_deposit(CardanoWasm.BigNum.from_str("2000000"))
      .max_value_size(5000)
      .max_tx_size(16384)
      .build(),
  );

  const scripts = CardanoWasm.NativeScripts.new();

  const policyKeyHash = CardanoWasm.BaseAddress.from_address(policyAddr)!
    .payment_cred()
    .to_keyhash()!;

  console.log(`POLICY_KEYHASH: ${Buffer.from(policyKeyHash.to_bytes()).toString("hex")}`);

  // add key hash script so only people with policy key can mint assets using this policyId
  const keyHashScript = CardanoWasm.NativeScript.new_script_pubkey(
    CardanoWasm.ScriptPubkey.new(policyKeyHash),
  );
  scripts.add(keyHashScript);

  const policyTtl = policy.ttl || ttl;

  console.log(`POLICY_TTL: ${policyTtl}`);

  // add timelock so policy is locked after this slot
  const timelock = CardanoWasm.TimelockExpiry.new(policyTtl);
  const timelockScript = CardanoWasm.NativeScript.new_timelock_expiry(timelock);
  scripts.add(timelockScript);

  const mintScript = CardanoWasm.NativeScript.new_script_all(CardanoWasm.ScriptAll.new(scripts));

  const privKeyHash = CardanoWasm.BaseAddress.from_address(addr)!.payment_cred().to_keyhash()!;
  txBuilder.add_key_input(
    privKeyHash,
    CardanoWasm.TransactionInput.new(
      CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, "hex")),
      utxo.tx_index,
    ),
    CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(utxo.amount[0].quantity)),
  );

  txBuilder.add_mint_asset_and_output_min_required_coin(
    mintScript,
    CardanoWasm.AssetName.new(Buffer.from(assetName)),
    CardanoWasm.Int.new_i32(1),
    CardanoWasm.TransactionOutputBuilder.new().with_address(addr).next(),
  );

  const policyId = Buffer.from(mintScript.hash().to_bytes()).toString("hex");

  console.log(`POLICY_ID: ${policyId}`);

  const metadata = {
    [policyId]: {
      [assetName]: {
        name: assetName,
        description,
        image: imageUrl,
        mediaType,
      },
    },
  };

  console.log(`METADATA: ${JSON.stringify(metadata, null, 4)}`);

  // transaction ttl can't be later than policy ttl
  const txTtl = ttl > policyTtl ? policyTtl : ttl;

  console.log(`TX_TTL: ${txTtl}`);

  txBuilder.set_ttl(txTtl);
  txBuilder.add_json_metadatum(CardanoWasm.BigNum.from_str("721"), JSON.stringify(metadata));

  txBuilder.add_change_if_needed(addr);

  const txBody = txBuilder.build();
  const txHash = CardanoWasm.hash_transaction(txBody);

  console.log(`TX_HASH: ${Buffer.from(txHash.to_bytes()).toString("hex")}`);

  const witness0 = await makeWitness(policy.key, txHash);
  const witness1 = await makeWitness(accountKey, txHash);

  // sign the tx using the policy key and main key
  const witnesses = CardanoWasm.TransactionWitnessSet.new();
  const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
  vkeyWitnesses.add(witness0);
  vkeyWitnesses.add(witness1);
  witnesses.set_vkeys(vkeyWitnesses);
  const witnessScripts = CardanoWasm.NativeScripts.new();
  witnessScripts.add(mintScript);
  witnesses.set_native_scripts(witnessScripts);

  const unsignedTx = txBuilder.build_tx();

  // create signed transaction
  const tx = CardanoWasm.Transaction.new(unsignedTx.body(), witnesses, unsignedTx.auxiliary_data());

  // submit the transaction using yoroi backend
  try {
    const result = await blockfrostClient.txSubmit(tx.to_bytes());
    console.log(`SUBMIT_RESULT: ${JSON.stringify(result, null, 4)}`);
  } catch (err) {
    console.error(`failed to submit tx: ${err}`);
  }
}

/** Mint an NFT using a policy key and an account key managed with CubeSigner. */
async function main() {
  try {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location.
    const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();

    const client = await CubeSignerClient.create(storage);

    // Load signer session
    const keys = await client.sessionKeys();

    const accountKey = keys.find((key) => key.publicKey === ACCOUNT_KEY);
    const policyKey = keys.find((key) => key.publicKey === POLICY_KEY);

    if (!accountKey || !policyKey) {
      throw new Error("Session does not contain required keys");
    }

    await mintNft(
      accountKey,
      <PolicyInfo>{
        key: policyKey,
        ttl: null, // paste the POLICY_TTL output you get in console to here to mint with same policy
      },
      "cu13157", // assetName
      "some descr this is a new nft with same policy", // description
      "ipfs://QmNhmDPJMgdsFRM9HyiQEJqrKkpsWFshqES8mPaiFRq9Zk", // image url
      "image/jpeg", // mediaType
    );
  } catch (err) {
    console.error(`failed to mint nft: ${err}`);
  }
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/** Policy info. */
interface PolicyInfo {
  /** The key that can mint NFT. */
  key: Key;
  /** The transaction TTL. */
  ttl: number | null;
}

/**
 * Take the blake2b-224 of a Ed25519 public key.
 *
 * @param pubKey Ed25519 public key
 * @returns blake2b-224 hash of the public key
 */
function pubKeyToBuf(pubKey: string): Buffer {
  // if pubKey start with 0x strip it
  if (pubKey.startsWith("0x")) {
    pubKey = pubKey.slice(2);
  }
  const buf = Buffer.from(pubKey, "hex");
  return Buffer.from(blake2bHex(buf, undefined, 28), "hex");
}

/**
 * Create witness for a transaction.
 *
 * @param key key to use
 * @param txHash transaction hash
 * @returns witness
 */
async function makeWitness(
  key: Key,
  txHash: TransactionHash,
): Promise<Vkeywitness> {
  const hexSig = (
    await key.signBlob({
      message_base64: Buffer.from(txHash.to_bytes()).toString("base64"),
    })
  ).data().signature;
  // strip 0x and convert to Ed25519Signature type
  const sig = CardanoWasm.Ed25519Signature.from_hex(hexSig.slice(2));
  // strip 0x and convert to PublicKey type
  const pk = CardanoWasm.PublicKey.from_hex(key.publicKey.slice(2));
  // create vkey
  const vkey = CardanoWasm.Vkey.new(pk);
  return Vkeywitness.new(vkey, sig);
}

/**
 * Create keyHash from a KeyInfo.
 *
 * @param publicKey The public key to use
 * @returns key hash
 */
function keyHash(publicKey: string): CardanoWasm.Ed25519KeyHash {
  return CardanoWasm.Ed25519KeyHash.from_bytes(pubKeyToBuf(publicKey));
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
