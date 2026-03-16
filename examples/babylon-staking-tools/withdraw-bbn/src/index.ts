import assert from "assert";
import { readFileSync } from "fs";

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";

import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import * as bc from "bitcoinjs-lib";

import { paramsVersion } from "./bbn_util";
import { env, getBtcTx, toMfaReceipts } from "./util";
import { getRecipientScriptPubkey, getTaprootKeyInfo, isWithdrawalInfo } from "./withdrawal_info";

const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const WITHDRAWAL_INFO = env("WITHDRAWAL_INFO", "withdrawal.json")!;
const BBN_API_URI = env("BBN_API_URI", null)!;

// need this for manipulating Taproot addresses
bc.initEccLib(ecc);

/**
 * Create an unstake request for a given Babylon deposit
 */
async function main() {
  const withdrawalInfo = JSON.parse(readFileSync(WITHDRAWAL_INFO, "utf8"));
  if (!isWithdrawalInfo(withdrawalInfo)) {
    throw new Error("WITHDRAWAL_INFO is invalid");
  }

  // get token/signer info and establish signer session/network.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
  const client = await cs.CubeSignerClient.create(session);

  // get taproot key-id
  const { tapKeyId, btcNetworkId } = getTaprootKeyInfo(withdrawalInfo);
  const tapKey = await client.org().getKey(tapKeyId);
  if (!tapKey) {
    throw new Error(`could not access ${tapKeyId}`);
  }
  const tapPkString = tapKey.publicKey.startsWith("0x")
    ? tapKey.publicKey.slice(2)
    : tapKey.publicKey;

  // get the withdrawal transaction
  const tx = await getBtcTx(withdrawalInfo.txid, btcNetworkId);
  if (!tx) {
    throw new Error("Tx not found");
  }
  // CubeSigner always uses vout 0 for early unbonds and deposits,
  // and always uses vout 1 for slashes.
  let vout = 0;
  if (withdrawalInfo.withdrawalType === "withdraw_slashing") {
    if (tx.vout.length < 2) {
      throw new Error("Not a slashing transaction");
    }
    vout = 1;
  }
  const version =
    withdrawalInfo.explicitParams !== undefined
      ? undefined
      : await paramsVersion(tx.status.block_height, withdrawalInfo.bbnNetwork, BBN_API_URI);
  const recipient = getRecipientScriptPubkey(withdrawalInfo).toString("hex");

  const withdrawalReq: cs.BabylonStakingRequest = {
    action: withdrawalInfo.withdrawalType,
    finality_provider_pks: withdrawalInfo.finalityProviderPks,
    lock_time: withdrawalInfo.lockTime,
    network: withdrawalInfo.bbnNetwork,
    staker_pk: tapPkString,
    version,
    as_base64: true,
    fee: withdrawalInfo.fee,
    fee_type: withdrawalInfo.feeType,
    recipient,
    txid: withdrawalInfo.txid,
    value: tx.vout[vout].value,
    vout,
    explicit_params: withdrawalInfo.explicitParams,
  };

  // make the early unbond request
  const mfaReceipts = toMfaReceipts(client.orgId, withdrawalInfo.mfaReceipts);
  const withdrawalResp = await tapKey.signBabylonStakingTxn(withdrawalReq, mfaReceipts);
  if (withdrawalResp.requiresMfa()) {
    console.log(`Approval(s) required: ${JSON.stringify(withdrawalResp.mfaIds(), null, 2)}`);
    process.exit(2);
  }

  // we got a response; continue
  const withdrawalData = withdrawalResp.data();

  // Signed transaction. This can be used to claim the withdrawal.
  const psbtToSign = bc.Psbt.fromBase64(withdrawalData.psbt);
  assert(psbtToSign.data.inputs.length === 1);
  const scriptSigs = psbtToSign.data.inputs[0].tapScriptSig!;
  assert(scriptSigs.length === 1);
  psbtToSign.finalizeAllInputs();
  const signedTx = psbtToSign.extractTransaction().toHex();
  console.log(`Signed tx: ${signedTx}`);

  // PSBT without the signature. This can be used to create a deposit directly from a withdrawal.
  const psbtForDeposit = bc.Psbt.fromBase64(withdrawalData.psbt);
  psbtForDeposit.data.inputs[0].tapScriptSig!.pop();
  const psbtBase64 = psbtForDeposit.toBase64();
  console.log(`PSBT for deposit: ${psbtBase64}`);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
