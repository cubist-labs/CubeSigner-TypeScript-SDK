import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as bc from "bitcoinjs-lib";
import axios from "axios";
import type { Utxo} from "./util";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import { estimateFee, getFeeRate, getUtxos, } from "./util";
import { Secp256k1 } from "@cubist-labs/cubesigner-sdk";

import * as dotenv from "dotenv";
import { assert } from "console";
dotenv.config();

/**
 * Verify Schnorr signature (note the order of arguments is different from ecc's verifySchnorr).
 *
 * @param pubkey
 * @param msghash
 * @param signature
 */
function schnorrVerify(pubkey: Buffer, msghash: Buffer, signature: Buffer): boolean {
    return ecc.verifySchnorr(msghash, pubkey, signature);
}

// need this for manipulating Taproot addresses
bc.initEccLib(ecc);

const STAKER_ADDRESS: string = env("STAKER_ADDRESS")!.trim();
const FINALITY_PROVIDER_PK: string = env("FINALITY_PROVIDER_PUBKEY")!.trim();
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const AMOUNT = Math.round(parseFloat(env("DEPOSIT_AMOUNT_SATS", "100000")!.trim()));
const SUBMIT_DEPOSIT: boolean = env("SUBMIT_DEPOSIT", "false")!.trim() === "true";

/**
 * main function. Executes a bitcoin transaction using CubeSigner and bitcoinjs-lib.
 */
async function main() {
  // get token/signer info and establish signer session/network.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();

  const client = await cs.CubeSignerClient.create(session);

  // get cubesigner key and validate its existence.
  const org = client.org();
  const stakerKey = await org.getKeyByMaterialId(Secp256k1.TaprootTest, STAKER_ADDRESS)
  if (!stakerKey) {
    throw new Error(`Current signer session does not have access to key '${STAKER_ADDRESS}'`);
  }

  const network = bc.networks.testnet;
  const baseUrl = "https://blockstream.info/testnet";

  // start building transaction
  const psbt = new bc.Psbt({ network: network });
  psbt.setVersion(2);
  psbt.setLocktime(0);

  const feeRate = await getFeeRate(baseUrl);

  // find utxos
  let totalSatoshisAvail = 0;
  const witnesses: Utxo[] = [];
  const utxoReceiverScript = bc.address.toOutputScript(stakerKey.materialId, network);
  const utxosDesc = await getUtxos(stakerKey.materialId, baseUrl);
  for (const utxo of utxosDesc) {
    if (!SUBMIT_DEPOSIT) {
      // We're not submitting to the network, so we just fake the UTXO value to make
      // sure the deposit will succeed. Getting enough testnet BTC is kind of annoying right now.
      utxo.value = 5*AMOUNT;
    }
    // add utxo as input
    witnesses.push(utxo);
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: utxoReceiverScript,
      },
    });
    // break if we have enough for the transfer
    totalSatoshisAvail += utxo.value;
    const currentFee = await estimateFee(psbt.inputCount, feeRate);
    console.log(`Found unspent ${utxo.value} (${utxo.txid}:${utxo.vout})`);
    if (totalSatoshisAvail >= AMOUNT + currentFee) {
      break;
    }
  }

  // bail if not enough funds available
  const fee = await estimateFee(psbt.inputCount, feeRate);
  if (totalSatoshisAvail < AMOUNT + fee) {
    throw new Error(
      `Insufficient funds! Available: ${totalSatoshisAvail}, needed: ${AMOUNT} + ${fee}`,
    );
  }

  // deposit to Babylon
  const deposit: cs.BabylonStakingRequest = {
      psbt: psbt.toHex(),
      value: AMOUNT,
      change: utxoReceiverScript.toString("hex"),
      fee,
      fee_type: "sats",
      network: "bbt4", // only available network now
      version: null, // `null` uses latest version of the Babylon network parameters
      explicit_params: null, // if not `null`, overrides built-in Babylon network parameters
      staker_pk: stakerKey.publicKey,
      finality_provider_pk: FINALITY_PROVIDER_PK,
      lock_time: 64000,
      action: "deposit",
  };

  console.log("Creating deposit");
  const resp_dep = (await client.apiClient.signBabylonStakingTxn(stakerKey, deposit)).data();
  const psbt_dep = bc.Psbt.fromHex(resp_dep.psbt);

  console.log("Calling validateSignaturesOfAllInputs");
  // We need to set the internal key to the pub key (CubeSigner follows Babylon
  // here and doesn't automatically do this for deposit PSBTs).
  psbt_dep.data.inputs[0].tapInternalKey = Buffer.from(stakerKey.publicKey.slice(2), 'hex');
  assert(psbt_dep.validateSignaturesOfAllInputs(schnorrVerify));

  console.log("Calling finalizeAllInputs");
  psbt_dep.finalizeAllInputs();

  // serialize transaction to hex
  const tx_dep = psbt_dep.extractTransaction();
  console.log(`Created deposit tx: ${tx_dep.toHex()}`);

  if (SUBMIT_DEPOSIT) {
    // post the transaction
    const resp = await axios.post(`${baseUrl}/api/tx`, tx_dep.toHex());
    const conf = resp.data.toString();
    console.log(`Confirmation: ${conf}`);
  }

  // early unbond from Babylon staking txn
  const early_unbond: cs.BabylonStakingRequest = {
      // TXID of a Babylon deposit transaction
      txid: tx_dep.getId(),
      // vout is always 0 for CubeSigner-created deposit transactions
      vout: 0,
      value: AMOUNT, // amount that was deposited in the txn named by `txid`
      network: "bbt4",
      version: null,
      staker_pk: stakerKey.publicKey,
      finality_provider_pk: FINALITY_PROVIDER_PK,
      lock_time: 64000, // lock time that was used for the Babylon deposit named by `txid`
      action: "early_unbond",
  };

  console.log("Creating early unbond");
  const resp_eub = (await client.apiClient.signBabylonStakingTxn(stakerKey, early_unbond)).data();
  const psbt_eub = bc.Psbt.fromBuffer(Buffer.from(resp_eub.psbt, "hex"));

  console.log("Calling validateSignaturesOfAllInputs");
  assert(psbt_eub.validateSignaturesOfAllInputs(schnorrVerify));
  console.log("Calling finalizeAllInputs");
  psbt_eub.finalizeAllInputs();

  const tx_eub = psbt_eub.extractTransaction();
  console.log(`Created early unbond: ${tx_eub.toHex()}`);

  // withdraw from staking txn after timelock expires
  const withdraw_timelock: cs.BabylonStakingRequest = {
      // TXID of a Babylon deposit transaction
      txid: tx_eub.getId(),
      // vout is always 0 for CubeSigner-created deposit transactions
      vout: 0,
      value: AMOUNT, // amount that was deposited in the txn named by `txid`
      // can specify fee rate in sats per vb instead of absolute fee using fee_type
      // just picking a low enough fee rate (but high enough for testnet)
      fee: 3,
      fee_type: "sats_per_vb",
      // script buf that receives the unbonding
      recipient: utxoReceiverScript.toString("hex"),
      // min block height before this withdrawal txn can be published
      txn_lock_height: null,
      // Babylon network parameters
      network: "bbt4",
      version: null,
      staker_pk: stakerKey.publicKey,
      finality_provider_pk: FINALITY_PROVIDER_PK,
      // lock time in the Babylon deposit
      lock_time: 64000,
      action: "withdraw_timelock",
  };

  console.log("Creating withdrawal from timelock");
  const resp_wtl = (await client.apiClient.signBabylonStakingTxn(stakerKey, withdraw_timelock)).data();
  const psbt_wtl = bc.Psbt.fromBuffer(Buffer.from(resp_wtl.psbt, "hex"));

  console.log("Calling validateSignaturesOfAllInputs");
  assert(psbt_wtl.validateSignaturesOfAllInputs(schnorrVerify));

  console.log("Calling finalizeAllInputs");
  psbt_wtl.finalizeAllInputs();

  const tx_wtl = psbt_wtl.extractTransaction();
  console.log(`Created timelock withdrawal: ${tx_wtl.toHex()}`);

  // withdraw from early unbond txn after timelock expires
  const early_unbond_timelock: cs.BabylonStakingRequest = {
      // TXID of a Babylon early unbond transaction
      txid: tx_eub.getId(),
      // vout is always 0 for CubeSigner-created early unbond transactions
      vout: 0,
      // value is amount currently locked in the early-unbond txn
      value: AMOUNT,
      // absolute fee (high enough for testnet)
      fee: 600,
      fee_type: "sats",
      recipient: utxoReceiverScript.toString("hex"),
      txn_lock_height: null,
      network: "bbt4",
      version: null,
      staker_pk: stakerKey.publicKey,
      finality_provider_pk: FINALITY_PROVIDER_PK,
      // lock time for the Babylon deposit txn (not the unbonding locktime;
      // that value is fixed by the Babylon network parameters)
      lock_time: 64000,
      action: "withdraw_early_unbond",
  };

  console.log("Creating withdrawal from early unbond");
  const resp_wub = (await client.apiClient.signBabylonStakingTxn(stakerKey, early_unbond_timelock)).data();
  const psbt_wub = bc.Psbt.fromBuffer(Buffer.from(resp_wub.psbt, "hex"));

  console.log("Calling validateSignaturesOfAllInputs");
  assert(psbt_wub.validateSignaturesOfAllInputs(schnorrVerify));

  console.log("Calling finalizeAllInputs");
  psbt_wub.finalizeAllInputs();

  const tx_wub = psbt_wub.extractTransaction();
  console.log(`Created early unbond timelock withdrawal: ${tx_wub.toHex()}`);
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
  console.log(`current env check: ${name}`);
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
