import { readFileSync } from "fs";

import { btccheckpoint, btcstaking, btcstakingtx } from "@babylonlabs-io/babylon-proto-ts";

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
  bbnToBtcNetworkId,
  BABYLON_INCLUSION_PROOF_MSG_TYPE,
} from "./bbn_util";
import { isDelegationInfo, getCosmosKeyInfo, getFeePerGas, getGas } from "./delegation_info";
import { env, getBlockHash, getInclusionProof } from "./util";

const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const DELEGATION_INFO = env("DELEGATION_INFO", "delegation.json")!;
const BBN_RPC_URI = env("BBN_RPC_URI", null)!;

// need this for manipulating Taproot addresses
bc.initEccLib(ecc);

/**
 * Create an unstake request for a given Babylon deposit
 */
async function main() {
  // read deposit data
  const delInfo = JSON.parse(readFileSync(DELEGATION_INFO, "utf8"));
  if (!isDelegationInfo(delInfo)) {
    throw new Error("DELEGATION_INFO is invalid");
  }

  // get token/signer info and establish signer session/network.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
  const client = await cs.CubeSignerClient.create(session);

  // cosmos key-id
  const { cosmosKeyId, bbnAddress } = getCosmosKeyInfo(delInfo);
  const cosmosKey = await client.org().getKey(cosmosKeyId);
  if (!cosmosKey) {
    throw new Error(`could not access ${cosmosKeyId}`);
  }

  // retrieve the proof of inclusion
  const btcNetworkId = bbnToBtcNetworkId(delInfo.bbnNetwork);
  const inclusionProof = await getInclusionProof(delInfo.txid, btcNetworkId);
  if (!inclusionProof) {
    throw new Error(`Failed to get inclusion proof for ${delInfo.txid} on ${btcNetworkId}`);
  }
  const blockHash = await getBlockHash(inclusionProof.block_height, btcNetworkId);
  if (!blockHash) {
    throw new Error(
      `Failed to get block hash at height ${inclusionProof.block_height} on ${btcNetworkId}`,
    );
  }

  // compute the Merkle proof hex value per Babylon
  // https://github.com/babylonlabs-io/btc-staking-ts/blob/006cea2ebc6c8b6882a1356f574e8dec2e063c35/src/staking/manager.ts#L884
  const merkleProofHex = inclusionProof.merkle.reduce(
    (acc: string, hash: string) => acc + Buffer.from(hash, "hex").reverse().toString("hex"),
    "",
  );

  // construct the message to send to the Babylon chain
  const inclusionProofKey = btccheckpoint.TransactionKey.fromPartial({
    index: inclusionProof.pos,
    hash: Buffer.from(blockHash, "hex").reverse(),
  });
  const inclusionPfProto = btcstaking.InclusionProof.fromPartial({
    key: inclusionProofKey,
    proof: Buffer.from(merkleProofHex, "hex"),
  });
  const msg = btcstakingtx.MsgAddBTCDelegationInclusionProof.fromPartial({
    signer: bbnAddress,
    stakingTxHash: delInfo.txid,
    stakingTxInclusionProof: inclusionPfProto,
  });

  const txMsg = {
    typeUrl: BABYLON_INCLUSION_PROOF_MSG_TYPE,
    value: msg,
  };

  // create a Cosmos type registry for use by the signer
  const registry = new Registry(defaultRegistryTypes);
  registry.register(
    BABYLON_INCLUSION_PROOF_MSG_TYPE,
    btcstakingtx.MsgAddBTCDelegationInclusionProof,
  );

  // create a signing Cosmos client and get account info
  const cosmSigner = new CosmosSecp256k1CubeSigner(cosmosKey, BABYLON_ADDR_HRP);
  const cosmClient = await SigningStargateClient.connectWithSigner(
    BBN_RPC_URI ?? bbnDefaultRpc(delInfo.bbnNetwork),
    cosmSigner,
    { registry },
  );

  // prepare and broadcast the registration
  const bbnFeePerGas = getFeePerGas(delInfo);
  const simGas = await cosmClient.simulate(bbnAddress, [txMsg], "");
  const bbnGas = getGas(delInfo, simGas);
  const gasCost = bbnFeePerGas * bbnGas;
  const txFee: StdFee = {
    gas: bbnGas.toString(),
    amount: [{ denom: "ubbn", amount: Math.ceil(gasCost).toString() }],
  };
  const signedBbnTx = await cosmClient.sign(bbnAddress, [txMsg], txFee, "");
  const bbnTxResult = await cosmClient.broadcastTx(TxRaw.encode(signedBbnTx).finish());
  console.log(bbnTxResult);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
