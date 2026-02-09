import assert from "assert";
import { readFileSync } from "fs";

import { btcstakingtx } from "@babylonlabs-io/babylon-proto-ts";
import type { ProofOfPossessionBTC } from "@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop";
import {
  BIP322Sig,
  BTCSigType,
} from "@babylonlabs-io/babylon-proto-ts/dist/generated/babylon/btcstaking/v1/pop";

import type { StdFee } from "@cosmjs/amino";
import { Registry } from "@cosmjs/proto-signing";
import { SigningStargateClient, defaultRegistryTypes } from "@cosmjs/stargate";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";
import * as bc from "bitcoinjs-lib";

import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";

import { CosmosSecp256k1CubeSigner } from "./cosmos_signer";
import {
  BABYLON_ADDR_HRP,
  bbnDefaultRpc,
  getDelegation,
  BABYLON_UNBONDING_TIME,
  BABYLON_DELEGATION_MSG_TYPE,
} from "./bbn_util";
import {
  getCosmosKeyInfo,
  getFeePerGas,
  getGas,
  getTaprootKeyInfo,
  isDepositInfo,
} from "./deposit_info";
import {
  addrNetwork,
  broadcastBtcTx,
  env,
  newPsbtWithValue,
  schnorrVerify,
  sleep,
  toMfaReceipts,
} from "./util";

const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const DEPOSIT_INFO = env("DEPOSIT_INFO", "deposit.json")!;
const BBN_RPC_URI = env("BBN_RPC_URI", null)!;
const BBN_API_URI = env("BBN_API_URI", null)!;

/**
 * Time in seconds to wait for Babylon deposit registration to be validated
 */
const MAX_WAIT_SEC_DEFAULT = 120;
const MAX_WAIT_SEC_PARSE = parseInt(env("MAX_WAIT_SEC", MAX_WAIT_SEC_DEFAULT.toString())!);
const MAX_WAIT_SEC = isFinite(MAX_WAIT_SEC_PARSE) ? MAX_WAIT_SEC_PARSE : MAX_WAIT_SEC_DEFAULT;

// need this for manipulating Taproot addresses
bc.initEccLib(ecc);

/**
 * Create an unstake request for a given Babylon deposit
 */
async function main() {
  // read deposit data
  const depositInfo = JSON.parse(readFileSync(DEPOSIT_INFO, "utf8"));
  if (!isDepositInfo(depositInfo)) {
    throw new Error("DEPOSIT_INFO is invalid");
  }

  // get token/signer info and establish signer session/network.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
  const client = await cs.CubeSignerClient.create(session);

  // taproot key-id
  const { tapKeyId, tapPkScript } = getTaprootKeyInfo(depositInfo);
  const tapKey = await client.org().getKey(tapKeyId);
  if (!tapKey) {
    throw new Error(`could not access ${tapKeyId}`);
  }
  const tapPkString = tapKey.publicKey.startsWith("0x")
    ? tapKey.publicKey.slice(2)
    : tapKey.publicKey;
  const tapPk = Buffer.from(tapPkString, "hex");
  // cosmos key-id
  const { cosmosKeyId, bbnAddress } = getCosmosKeyInfo(depositInfo);
  const cosmosKey = await client.org().getKey(cosmosKeyId);
  if (!cosmosKey) {
    throw new Error(`could not access ${cosmosKeyId}`);
  }
  // at this point we know the keys exist and are the appropriate type

  // get the PSBT from the depositInfo or create a new one if none was specified
  const psbt =
    depositInfo.psbt !== undefined
      ? bc.Psbt.fromBase64(depositInfo.psbt)
      : await newPsbtWithValue(depositInfo.stakerAddr, tapPk, depositInfo.value);

  // create and send the registration request
  const regReq: cs.BabylonRegistrationRequest = {
    bbn_addr: bbnAddress,
    psbt: psbt.toBase64(),
    ignore_psbt_outputs: true,
    value: depositInfo.value,
    change: tapPkScript,
    fee: depositInfo.fee,
    fee_type: depositInfo.feeType,
    network: depositInfo.bbnNetwork,
    // 'version' property is elided: use current version or explicit params
    staker_pk: tapPkString,
    finality_provider_pks: depositInfo.finalityProviderPks,
    lock_time: depositInfo.lockTime,
    explicit_params: depositInfo.explicitParams,
  };
  const mfaReceipts = toMfaReceipts(client.orgId, depositInfo.mfaReceipts);
  const regResp = await tapKey.signBabylonRegistration(regReq, mfaReceipts);
  if (regResp.requiresMfa()) {
    console.log(`Approval(s) required: ${JSON.stringify(regResp.mfaIds(), null, 2)}`);
    process.exit(2);
  }

  // we got a response. continue with registration
  const regData = regResp.data();

  // handle the staking PSBT
  const signedPsbt = bc.Psbt.fromBase64(regData.deposit);
  assert(signedPsbt.validateSignaturesOfAllInputs(schnorrVerify));
  const unsignedDepositTxn = signedPsbt.data.globalMap.unsignedTx.toBuffer();
  signedPsbt.finalizeAllInputs();
  const signedDepositTxn = signedPsbt.extractTransaction().toBuffer();

  // create the PoP
  const popSig = BIP322Sig.fromPartial({
    address: tapKey.materialId,
    sig: Buffer.from(regData.pop, "hex"),
  });
  const pop: ProofOfPossessionBTC = {
    btcSigType: BTCSigType.BIP322,
    btcSig: BIP322Sig.encode(popSig).finish(),
  };

  // get value from unbonding tx
  const unbondingTx = Buffer.from(regData.unbond, "hex");
  const unbondingValue = bc.Transaction.fromBuffer(unbondingTx).outs[0].value;

  // create the delegation message
  const msg = btcstakingtx.MsgCreateBTCDelegation.fromPartial({
    stakerAddr: bbnAddress,
    pop,
    btcPk: tapPk,
    fpBtcPkList: depositInfo.finalityProviderPks.map((pk) => Buffer.from(pk, "hex")),
    stakingTime: depositInfo.lockTime,
    stakingValue: depositInfo.value,
    stakingTx: unsignedDepositTxn,
    slashingTx: Buffer.from(regData.slash_deposit, "hex"),
    delegatorSlashingSig: Buffer.from(regData.slash_deposit_sig, "hex"),
    unbondingTime: BABYLON_UNBONDING_TIME,
    unbondingTx: Buffer.from(regData.unbond, "hex"),
    unbondingValue,
    unbondingSlashingTx: Buffer.from(regData.slash_unbond, "hex"),
    delegatorUnbondingSlashingSig: Buffer.from(regData.slash_unbond_sig, "hex"),
  });
  const txMsg = {
    typeUrl: BABYLON_DELEGATION_MSG_TYPE,
    value: msg,
  };

  // create a Cosmos type registry for use by the signer
  const registry = new Registry(defaultRegistryTypes);
  registry.register(BABYLON_DELEGATION_MSG_TYPE, btcstakingtx.MsgCreateBTCDelegation);

  // create a signing Cosmos client and get account info
  const cosmSigner = new CosmosSecp256k1CubeSigner(cosmosKey, BABYLON_ADDR_HRP);
  const cosmClient = await SigningStargateClient.connectWithSigner(
    BBN_RPC_URI ?? bbnDefaultRpc(depositInfo.bbnNetwork),
    cosmSigner,
    { registry },
  );

  // prepare and broadcast the registration
  const bbnFeePerGas = getFeePerGas(depositInfo);
  const bbnGas = getGas(depositInfo);
  const gasCost = bbnFeePerGas * bbnGas;
  const txFee: StdFee = {
    gas: bbnGas.toString(),
    amount: [{ denom: "ubbn", amount: Math.ceil(gasCost).toString() }],
  };
  const signedBbnTx = await cosmClient.sign(bbnAddress, [txMsg], txFee, "");
  const bbnTxResult = await cosmClient.broadcastTx(TxRaw.encode(signedBbnTx).finish());
  console.log(bbnTxResult);

  // display the signed btc transaction that we will broadcast once the status is VERIFIED
  const signedDepositTxid = bc.Transaction.fromBuffer(signedDepositTxn).getId();
  const signedDepositTxnHex = signedDepositTxn.toString("hex");
  console.log(JSON.stringify({ signedDepositTxnHex }, null, 2));

  // wait until the registration is marked VERIFIED
  console.log(`INFO: Waiting up to ${MAX_WAIT_SEC}s for Babylon registration to succeed`);
  const bbnWaitStart = Date.now();
  let verified = false;
  while (Date.now() - bbnWaitStart < MAX_WAIT_SEC * 1000) {
    const apiResp = await getDelegation(signedDepositTxid, depositInfo.bbnNetwork, BBN_API_URI);
    if (apiResp !== undefined) {
      const status = apiResp.btc_delegation.status_desc;
      if (status === "VERIFIED") {
        verified = true;
        break;
      }

      if (status === "PENDING") {
        console.log("INFO: Delegation is in PENDING state.");
      } else {
        console.log(`WARNING: Delegation is in unexpected state ${status}`);
      }
    } else {
      console.log(`INFO: Delegation not yet found: ${JSON.stringify(apiResp, null, 2)}`);
    }

    await sleep(10000);
  }

  // error out if the registration was not verified
  if (!verified) {
    console.log(`WARNING: registration was not marked VERIFIED after ${MAX_WAIT_SEC}s`);
    console.log("Once the registration is verified, broadcast the bitcoin tx above.");
    process.exit(1);
  }

  // post the bitcoin transaction and exit
  const btcResp = await broadcastBtcTx(signedDepositTxnHex, addrNetwork(depositInfo.stakerAddr));
  console.log(`BTC broadcast result: ${btcResp}`);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
