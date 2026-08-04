import assert from "assert";
import { readFileSync } from "fs";

import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import * as bc from "bitcoinjs-lib";

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";

import {
  bbnToBtcNetwork,
  bbnToBtcNetworkId,
  parseBabylonMetadata,
  paramsVersion,
  taprootKeyIdForBbnNetwork,
} from "./bbn_util";
import { isUnbondPhase1Info } from "./unbond_phase1_info";
import type { UnbondPhase1Info } from "./unbond_phase1_info";
import { env, getBtcTx, toMfaReceipts, tweakTaprootPk } from "./util";

const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const UNBOND_PHASE1_INFO = env("UNBOND_PHASE1_INFO", "unbond_phase1.json")!;
const BBN_API_URI = env("BBN_API_URI", null)!;

// need this for manipulating Taproot addresses
bc.initEccLib(ecc);

/**
 * Create an unstake request for a given Babylon deposit
 */
async function main() {
  const unbondInfo = JSON.parse(readFileSync(UNBOND_PHASE1_INFO, "utf8"));
  if (!isUnbondPhase1Info(unbondInfo)) {
    throw new Error("UNBOND_PHASE1_INFO is invalie");
  }

  // get token/signer info and establish signer session/network.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
  const client = await cs.CubeSignerClient.create(session);

  // information about the transaction
  const earlyUnbondReq = await earlyUnbondByTxid(unbondInfo);

  // figure out which key to use for the request
  const taprootPkBytes = Buffer.from(earlyUnbondReq.staker_pk, "hex");
  const taprootAddress = tweakTaprootPk(
    taprootPkBytes,
    bbnToBtcNetwork(unbondInfo.bbnNetwork),
  ).address!;
  const { tapKeyId } = taprootKeyIdForBbnNetwork(taprootAddress, unbondInfo.bbnNetwork);
  const tapKey = await client.org().getKey(tapKeyId);
  if (!tapKey) {
    throw new Error(`could not access ${tapKeyId}`);
  }

  // make the early unbond request
  const mfaReceipts = toMfaReceipts(client.orgId, unbondInfo.mfaReceipts);
  const earlyUnbondResp = await tapKey.signBabylonStakingTxn(earlyUnbondReq, mfaReceipts);
  if (earlyUnbondResp.requiresMfa()) {
    console.log(`Approval(s) required: ${JSON.stringify(earlyUnbondResp.mfaIds(), null, 2)}`);
    process.exit(2);
  }

  // we got a response. continue.
  const earlyUnbondData = earlyUnbondResp.data();

  // process the result into the Babylon API request
  const earlyUnbondPsbt = bc.Psbt.fromHex(earlyUnbondData.psbt);
  assert(earlyUnbondPsbt.data.inputs.length == 1);
  const scriptSigs = earlyUnbondPsbt.data.inputs[0].tapScriptSig!;
  assert(scriptSigs.length == 1);
  const sigHex = scriptSigs[0].signature.toString("hex");
  const txHex = earlyUnbondPsbt.data.globalMap.unsignedTx.toBuffer().toString("hex");
  const ubTx = bc.Transaction.fromHex(txHex);

  const earlyUnbondRequest = {
    staker_signed_signature_hex: sigHex,
    staking_tx_hash_hex: unbondInfo.txid,
    unbonding_tx_hex: txHex,
    unbonding_tx_hash_hex: ubTx.getId(),
  };
  console.log(JSON.stringify(earlyUnbondRequest, null, 2));
}

/**
 * Create an early unbond request for a given txid on a given network
 *
 * @param unbondInfo The unbond info for this request
 * @returns The Babylon staking request to send to CubeSigner
 */
async function earlyUnbondByTxid(unbondInfo: UnbondPhase1Info): Promise<cs.BabylonStakingRequest> {
  const tx = await getBtcTx(unbondInfo.txid, bbnToBtcNetworkId(unbondInfo.bbnNetwork));
  if (!tx) {
    throw new Error("Tx not found");
  }
  if (tx.vout.length < 2 || !tx.vout[1].scriptpubkey_asm.startsWith("OP_RETURN")) {
    throw new Error("Not an identifiable staking txn");
  }
  const metadata = parseBabylonMetadata(tx.vout[1].scriptpubkey);
  const version =
    unbondInfo.explicitParams !== undefined
      ? undefined
      : await paramsVersion(tx.status.block_height, unbondInfo.bbnNetwork, BBN_API_URI);

  return {
    action: "early_unbond",
    txid: unbondInfo.txid,
    vout: 0,
    value: tx.vout[0].value,
    network: unbondInfo.bbnNetwork,
    version: version,
    staker_pk: metadata.stakerPk,
    finality_provider_pks: [metadata.fpPk],
    lock_time: metadata.lockTime,
    as_base64: false,
    explicit_params: unbondInfo.explicitParams,
  };
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
