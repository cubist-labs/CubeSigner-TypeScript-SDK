// This example is a port of our ../src/minting-nfts.ts to use both CubeSigner and local private keys.
// The original example extends https://github.com/Emurgo/cardano-serialization-lib/blob/master/doc/getting-started/minting-nfts.md
import { expect } from "chai";
import * as cs from "@cubist-labs/cubesigner-sdk";
import CardanoWasm, {
  TransactionHash,
  Vkeywitness,
} from "@emurgo/cardano-serialization-lib-nodejs";
import { mnemonicToEntropy } from "bip39";
import { blake2bHex } from "blakejs";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { KeyInfo, SignerSession } from "@cubist-labs/cubesigner-sdk";
import { env } from "./helpers";

const MNEMONIC: string = env("MNEMONIC")!;
const ACCOUNT_KEY: string = env("ACCOUNT_KEY")!;
const POLICY_KEY: string = env("POLICY_KEY")!;
const BLOCKFROST_API_KEY: string = env("BLOCKFROST_API_KEY")!;
const CUBE_SIGNER_TOKEN: string = env("CUBE_SIGNER_TOKEN")!;

const blockfrostClient = new BlockFrostAPI({
  projectId: BLOCKFROST_API_KEY,
});

/**
 * Mint an NFT.
 * @param {SignerSession} signerSession The signer session.
 * @param {AccountKeyInfo} accountKey The account key to mint from.
 * @param {PolicyInfo} policy The policy to mint from.
 * @param {string} assetName The name of the asset.
 * @param {string} description The description of the asset.
 * @param {string} imageUrl The URL of the image.
 * @param {string} mediaType The media type of the image.
 */
async function mintNft(
  signerSession: cs.SignerSession,
  accountKey: AccountKeyInfo,
  policy: PolicyInfo,
  assetName: string,
  description: string,
  imageUrl: string,
  mediaType: string,
) {
  const FEE = 100;

  const _accountKeyHash = keyHash(accountKey.keyInfo);

  const addr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(_accountKeyHash),
    CardanoWasm.StakeCredential.from_keyhash(_accountKeyHash),
  ).to_address();

  const _policyKeyHash = keyHash(policy.keyInfo);

  const policyAddr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(_policyKeyHash),
    CardanoWasm.StakeCredential.from_keyhash(_policyKeyHash),
  ).to_address();

  console.log(`ADDR: ${addr.to_bech32()}`);
  console.log(`POLICY_ADDR: ${addr.to_bech32()}`);

  const utxos = await blockfrostClient.addressesUtxos(addr.to_bech32());
  let utxo: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

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

  // Create transactoin given the policy and account key witnesses
  const mkTx = async (policyWitness: MkVkeywitness, accountWitness: MkVkeywitness) => {
    const txBuilder = CardanoWasm.TransactionBuilder.new(
      CardanoWasm.TransactionBuilderConfigBuilder.new()
        .fee_algo(
          CardanoWasm.LinearFee.new(
            CardanoWasm.BigNum.from_str("44"),
            CardanoWasm.BigNum.from_str("151"),
          ),
        )
        .coins_per_utxo_word(CardanoWasm.BigNum.from_str("382"))
        .pool_deposit(CardanoWasm.BigNum.from_str("500"))
        .key_deposit(CardanoWasm.BigNum.from_str("200"))
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

    // sign the tx using the policy key and main key
    const witnesses = CardanoWasm.TransactionWitnessSet.new();
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    vkeyWitnesses.add(await accountWitness(txHash));
    vkeyWitnesses.add(await policyWitness(txHash));
    witnesses.set_vkeys(vkeyWitnesses);
    witnesses.set_native_scripts;
    const witnessScripts = CardanoWasm.NativeScripts.new();
    witnessScripts.add(mintScript);
    witnesses.set_native_scripts(witnessScripts);

    const unsignedTx = txBuilder.build_tx();

    // create signed transaction
    return {
      txHash,
      signedTx: CardanoWasm.Transaction.new(
        unsignedTx.body(),
        witnesses,
        unsignedTx.auxiliary_data(),
      ),
    };
  };

  // create tx using CubeSigner
  const csPolicyWitness: MkVkeywitness = async (txHash) => {
    return await makeWitness(signerSession, policy.keyInfo, txHash);
  };
  const csAccountWitness: MkVkeywitness = async (txHash) => {
    return await makeWitness(signerSession, accountKey.keyInfo, txHash);
  };
  const csTx = await mkTx(csPolicyWitness, csAccountWitness);

  // create tx using local private keys
  const exPolicyWitness: MkVkeywitness = async (txHash) => {
    const witness = CardanoWasm.make_vkey_witness(txHash, policy.privateKey);
    return new Promise((resolve) => {
      resolve(witness);
    });
  };
  const exAccountWitness: MkVkeywitness = async (txHash) => {
    const witness = CardanoWasm.make_vkey_witness(txHash, accountKey.privateKey);
    return new Promise((resolve) => {
      resolve(witness);
    });
  };
  const exTx = await mkTx(exPolicyWitness, exAccountWitness);

  // The two transaction hashes should be identical
  expect(csTx.txHash.to_hex()).to.equal(exTx.txHash.to_hex());
  // Which means the signed transactions should be identical
  expect(csTx.signedTx.to_hex()).to.equal(exTx.signedTx.to_hex());
  // And the individual witnesses used in the signed transactions should be identical
  expect((await csPolicyWitness(csTx.txHash)).to_hex()).to.equal(
    (await exPolicyWitness(exTx.txHash)).to_hex(),
  );
  expect((await csAccountWitness(csTx.txHash)).to_hex()).to.equal(
    (await exAccountWitness(exTx.txHash)).to_hex(),
  );
}

describe("minting an NFT using CubeSigner", () => {
  it("should produce same signature as local", async () => {
    // Create private keys
    const entropy = mnemonicToEntropy(MNEMONIC);
    const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
      Buffer.from(entropy, "hex"),
      Buffer.from(""),
    );

    const harden = (num: number) => {
      return 0x80000000 + num;
    };

    const accountPrivateKey = rootKey
      .derive(harden(1852))
      .derive(harden(1815))
      .derive(harden(0))
      .derive(0)
      .derive(0)
      .to_raw_key();

    const policyPrivateKey = rootKey
      .derive(harden(1852))
      .derive(harden(1815))
      .derive(harden(0))
      .derive(0)
      .derive(1)
      .to_raw_key(); // we picked this path arbitrarily

    // Load signer session and keys
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location.
    const storage = new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)));
    const signerSession = await cs.CubeSigner.loadSignerSession(storage);
    const keys = await signerSession.keys();

    const accountKeyInfo = keys.find((key) => key.publicKey === ACCOUNT_KEY);
    const policyKeyInfo = keys.find((key) => key.publicKey === POLICY_KEY);

    if (!accountKeyInfo || !policyKeyInfo) {
      throw new Error("Session does not contain required keys");
    }

    await mintNft(
      signerSession,
      <AccountKeyInfo>{
        keyInfo: accountKeyInfo,
        privateKey: accountPrivateKey,
      },
      <PolicyInfo>{
        keyInfo: policyKeyInfo,
        privateKey: policyPrivateKey,
        ttl: null, // paste the POLICY_TTL output you get in console to here to mint with same policy
      },
      "cu13157", // assetName
      "some descr this is a new nft with same policy", // description
      "ipfs://QmNhmDPJMgdsFRM9HyiQEJqrKkpsWFshqES8mPaiFRq9Zk", // image url
      "image/jpeg", // mediaType
    );
  });
});

/** Account key info. */
interface AccountKeyInfo {
  /** CubeSigner key info */
  keyInfo: KeyInfo;
  /** The private key. */
  privateKey: CardanoWasm.PrivateKey;
}

/** Policy info. */
interface PolicyInfo {
  /** The key that can mint NFT. */
  keyInfo: KeyInfo;
  /** The private key. */
  privateKey: CardanoWasm.PrivateKey;
  /** The transaction TTL. */
  ttl: number | null;
}

/**
 * Take the blake2b-224 of a Ed25519 public key.
 * @param {string} pubKey Ed25519 public key
 * @return {Buffer} blake2b-224 hash of the public key
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
 * @param {SignerSession} signerSession signer session
 * @param {KeyInfo} keyInfo key to use
 * @param {TransactionHash} txHash transaction hash
 * @return {Vkeywitness} witness
 */
async function makeWitness(
  signerSession: SignerSession,
  keyInfo: KeyInfo,
  txHash: TransactionHash,
): Promise<Vkeywitness> {
  const hexSig = (
    await signerSession.signBlob(keyInfo.id, {
      message_base64: Buffer.from(txHash.to_bytes()).toString("base64"),
    })
  ).data().signature;
  // strip 0x and convert to Ed25519Signature type
  const sig = CardanoWasm.Ed25519Signature.from_hex(hexSig.slice(2));
  // strip 0x and convert to PublicKey type
  const pk = CardanoWasm.PublicKey.from_hex(keyInfo.publicKey.slice(2));
  // create vkey
  const vkey = CardanoWasm.Vkey.new(pk);
  return Vkeywitness.new(vkey, sig);
}

/**
 * Create keyHash from a KeyInfo.
 * @param {KeyInfo} keyInfo key to use
 * @return {Ed25519KeyHash} key hash
 */
function keyHash(keyInfo: KeyInfo): CardanoWasm.Ed25519KeyHash {
  return CardanoWasm.Ed25519KeyHash.from_bytes(pubKeyToBuf(keyInfo.publicKey));
}

/** Create key witness callback type */
type MkVkeywitness = (txHash: TransactionHash) => Promise<Vkeywitness>;
