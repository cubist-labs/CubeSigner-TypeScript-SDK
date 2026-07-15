import assert from "assert";
import { readFileSync } from "fs";

import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import * as bc from "bitcoinjs-lib";

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";

import { bbnToBtcNetwork, bbnToBtcNetworkId, getDelegation, getParamsAtHeight } from "./bbn_util";
import { isUnbondInfo } from "./unbond_info";
import { broadcastBtcTx, env, toMfaReceipts, tweakTaprootPk } from "./util";

const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const UNBOND_INFO = env("UNBOND_INFO", "unbond.json")!;
const BBN_API_URI = env("BBN_API_URI", null)!;

// need this for manipulating Taproot addresses
bc.initEccLib(ecc);

/**
 * Create an unstake request for a given Babylon deposit
 */
async function main() {
  const unbondInfo = JSON.parse(readFileSync(UNBOND_INFO, "utf8"));
  if (!isUnbondInfo(unbondInfo)) {
    throw new Error("UNBOND_INFO is invalid");
  }

  // get the deposit info
  const depositInfo = await getDelegation(unbondInfo.txid, unbondInfo.bbnNetwork, BBN_API_URI);
  if (depositInfo === undefined) {
    throw new Error(
      `Failed to get deposit info for txid ${unbondInfo.txid} on ${unbondInfo.bbnNetwork}`,
    );
  }
  const stakerPk = Buffer.from(depositInfo.btc_pk, "hex");
  const stakerAddr = tweakTaprootPk(stakerPk, bbnToBtcNetwork(unbondInfo.bbnNetwork)).address!;

  // get the parameters at the deposit height
  const bbnParams =
    unbondInfo.explicitParams ??
    (await getParamsAtHeight(depositInfo.start_height, unbondInfo.bbnNetwork, BBN_API_URI));
  if (bbnParams === undefined) {
    throw new Error(
      `Failed to get params for ${unbondInfo.bbnNetwork} at BTC block height ${depositInfo.start_height}`,
    );
  }

  // get token/signer info and establish signer session/network.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
  const client = await cs.CubeSignerClient.create(session);

  // figure out which key to use for the request
  const btcNetworkId = bbnToBtcNetworkId(unbondInfo.bbnNetwork);
  const keyPrefix = btcNetworkId === "mainnet" ? "BtcTaproot" : "BtcTaprootTest";
  const keyId = `Key#${keyPrefix}_${stakerAddr}`;
  const key = await client.org().getKey(keyId);
  if (!key) {
    throw new Error(`could not access ${keyId}`);
  }

  // construct and make the early unbond request
  const earlyUnbondReq: cs.BabylonStakingRequest = {
    action: "early_unbond",
    txid: unbondInfo.txid,
    vout: depositInfo.staking_output_idx,
    value: parseInt(depositInfo.total_sat),
    network: unbondInfo.bbnNetwork,
    version: unbondInfo.explicitParams !== undefined ? undefined : bbnParams.version,
    staker_pk: stakerPk.toString("hex"),
    finality_provider_pks: depositInfo.fp_btc_pk_list,
    lock_time: depositInfo.staking_time,
    as_base64: true,
    explicit_params: unbondInfo.explicitParams,
  };
  const mfaReceipts = toMfaReceipts(client.orgId, unbondInfo.mfaReceipts);
  const earlyUnbondResp = await key.signBabylonStakingTxn(earlyUnbondReq, mfaReceipts);
  if (earlyUnbondResp.requiresMfa()) {
    console.log(`Approval(s) required: ${JSON.stringify(earlyUnbondResp.mfaIds(), null, 2)}`);
    process.exit(2);
  }

  // we got a response, continue
  const earlyUnbondData = earlyUnbondResp.data();
  const earlyUnbondPsbt = bc.Psbt.fromBase64(earlyUnbondData.psbt);
  assert(earlyUnbondPsbt.data.inputs.length == 1);
  const scriptSigs = earlyUnbondPsbt.data.inputs[0].tapScriptSig!;
  assert(scriptSigs.length == 1);

  // extract the transaction with signature and taproot witness
  earlyUnbondPsbt.finalizeAllInputs();
  const earlyUnbondTx = earlyUnbondPsbt.extractTransaction();

  // bookkeeping for covenant commitee signatures
  const sigs: { pk: string; sig: string }[] =
    depositInfo.undelegation_response.covenant_unbonding_sig_list;
  if (sigs.length < bbnParams.covenant_quorum) {
    throw new Error(
      `Got ${sigs.length} signatures from bbn chain, but quorum is ${bbnParams.covenant_quorum}`,
    );
  }
  const sigMap: Map<string, string> = new Map();
  sigs.forEach((sig) => sigMap.set(sig.pk, sig.sig));
  const covPks: string[] = bbnParams.covenant_pks;
  covPks.sort((a: string, b: string) => (a < b ? -1 : 1));

  // at this point, `witness` contains the staker pk signature and the taproot
  // witness. We want the covenant signatures to come before these, in reverse
  // lexicographic ordering of covenant signer pk. So we just reverse the witness
  // stack, push the covenant signature on in order, then reverse again.
  const witness = earlyUnbondTx.ins[0].witness;
  witness.reverse();
  let nSigs = 0;
  for (const pk of covPks) {
    const sig = sigMap.get(pk);
    if (nSigs == bbnParams.covenant_quorum || sig === undefined) {
      // null signature if missing or if we already have enough signatures
      witness.push(Buffer.of());
      continue;
    }
    nSigs += 1;
    witness.push(Buffer.from(sig, "base64"));
  }
  witness.reverse();

  const btcResp = await broadcastBtcTx(earlyUnbondTx.toHex(), btcNetworkId);
  console.log(btcResp);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
