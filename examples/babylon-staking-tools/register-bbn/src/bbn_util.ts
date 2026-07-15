import type { Network as BcNetwork } from "bitcoinjs-lib";

import type { BbnNetworkId, BbnPhase2NetworkId, BtcNetworkId } from "./types";
import { btcNetworkIdToNetwork } from "./types";

/** Babylon address prefix */
export const BABYLON_ADDR_HRP = "bbn";

/**
 * The unbonding time delay used by the Babylon protocol
 *
 * This value is common across all param sets so far. In the future we may
 * want to return the value from the Babylon API.
 */
export const BABYLON_UNBONDING_TIME = 1008;

/** The type tag for a Babylon delegation message */
export const BABYLON_DELEGATION_MSG_TYPE = "/babylon.btcstaking.v1.MsgCreateBTCDelegation";

/** The type tag for a Babylon add-inclusion-proof message */
export const BABYLON_INCLUSION_PROOF_MSG_TYPE =
  "/babylon.btcstaking.v1.MsgAddBTCDelegationInclusionProof";

/** Parsed Babylon Metadata */
export type BabylonMetadata = {
  version: number;
  lockTime: number;
  stakerPk: string;
  fpPk: string;
  magic: string;
};

/**
 * Parse the Babylon OP_RETURN metadata from Phase1 staking
 *
 * @param data The OP_RETURN data
 * @returns The parsed Babylon metadata
 */
export function parseBabylonMetadata(data: string | Uint8Array): BabylonMetadata {
  const bytes = typeof data === "string" ? Buffer.from(data, "hex") : Buffer.from(data);
  if (bytes[0] != 0x6a || bytes[1] != 0x47) {
    throw new Error("Invalid Babylon metadata");
  }

  const magicOffset = 2;
  const magicLength = 4;
  const magic = bytes.subarray(magicOffset, magicOffset + magicLength).toString("hex");

  const versionOffset = magicOffset + magicLength;
  const versionLength = 1;
  const version = bytes[versionOffset];

  const stakerPkOffset = versionOffset + versionLength;
  const stakerPkLength = 32;
  const stakerPk = bytes.subarray(stakerPkOffset, stakerPkOffset + stakerPkLength).toString("hex");

  const fpPkOffset = stakerPkOffset + stakerPkLength;
  const fpPkLength = 32;
  const fpPk = bytes.subarray(fpPkOffset, fpPkOffset + fpPkLength).toString("hex");

  const timelockOffset = fpPkOffset + fpPkLength;
  const lockTime = 256 * bytes[timelockOffset] + bytes[timelockOffset + 1];

  return {
    version,
    lockTime,
    stakerPk,
    fpPk,
    magic,
  };
}

/**
 * Find the parameters version at a given Bitcoin block height
 *
 * @param height The Bitcoin block-height of the transaction
 * @param bbnNetwork The Babylon network-id
 * @param uri The API URI; if not supplied, the default will be used
 * @returns The parameters version corresponding to the transaction
 */
export async function paramsVersion(
  height: number,
  bbnNetwork: BbnNetworkId,
  uri?: string,
): Promise<number> {
  // bbt4 and bbt5 have the same heights for all version numbers, except
  // that the max param version for bbt4 is 4.
  const network: BbnPhase2NetworkId = bbnNetwork === "bbt4" ? "bbt5" : bbnNetwork;
  const params = await getParamsAtHeight(height, network, uri);
  if (params === undefined) {
    throw new Error(`Failed to get ${bbnNetwork} params for height ${height}`);
  }
  const version = params.version;
  // for bbt5 and bbn1, this is the version number
  if (network === bbnNetwork) {
    return version;
  }
  // for bbt4, last params version was 4
  if (version > 4) {
    return 4;
  }
  return version;
}

/** Map from BbnNetworkId to default RPC provider */
const BbnRpcDefaultMap: Map<BbnPhase2NetworkId, string> = new Map([
  ["bbt5", "https://babylon-testnet-rpc.nodes.guru"],
  ["bbn1", "https://babylon.nodes.guru/rpc"],
]);

/**
 * Map a Babylon network to the corresponding default RPC provider
 *
 * @param id The Babylon network-id
 * @returns The RPC URI
 */
export function bbnDefaultRpc(id: BbnPhase2NetworkId): string {
  return BbnRpcDefaultMap.get(id)!;
}

/** Map from BbnNetworkid to default btc staking API provider */
const BbnApiDefaultMap: Map<BbnPhase2NetworkId, string> = new Map([
  ["bbt5", "https://babylon-testnet-api.nodes.guru"],
  ["bbn1", "https://babylon.nodes.guru/api"],
]);

/**
 * Map a Babylon network to the corresponding default API provider
 *
 * @param id The Babylon network-id
 * @returns The API URI
 */
export function bbnDefaultApi(id: BbnPhase2NetworkId): string {
  return BbnApiDefaultMap.get(id)!;
}

/** Map from BbnNetworkId to bitcoin network name */
const BbnBtcNetworkMap: Map<BbnNetworkId, BtcNetworkId> = new Map([
  ["bbt4", "signet"],
  ["bbt5", "signet"],
  ["bbn1", "mainnet"],
]);

/**
 * Map a Babylon network to the corresponding Bitcoin network
 *
 * @param id The Babylon network-id
 * @returns The Bitcoin network-id
 */
export function bbnToBtcNetworkId(id: BbnNetworkId): BtcNetworkId {
  return BbnBtcNetworkMap.get(id)!;
}

/**
 * Convert from BtcNetworkId to the bitcoinjs-lib network type
 *
 * @param network The Babylon network-id
 * @returns The bitcoinjs-lib Network value
 */
export function bbnToBtcNetwork(network: BbnNetworkId): BcNetwork {
  return btcNetworkIdToNetwork(bbnToBtcNetworkId(network));
}

/**
 * Get taproot key-id and check corespondence to Babylon network
 *
 * @param addr The taproot address
 * @param network The Babylon network-id
 * @returns The key-id and Bitcoin network-id
 */
export function taprootKeyIdForBbnNetwork(
  addr: string,
  network: BbnNetworkId,
): {
  tapKeyId: string;
  btcNetworkId: BtcNetworkId;
} {
  const btcNetworkId = bbnToBtcNetworkId(network);
  const keyIdPrefix = btcNetworkId === "mainnet" ? "BtcTaproot" : "BtcTaprootTest";
  const tapKeyId = `Key#${keyIdPrefix}_${addr}`;
  return { tapKeyId, btcNetworkId };
}

/**
 * Get deposit info from the Babylon API
 *
 * @param txid The transaction-id
 * @param network The Babylon network
 * @param uri The API URI; if not supplied, the default will be used
 * @returns The delegation info, or undefined in the error case
 */
export async function getDelegation(
  txid: string,
  network: BbnPhase2NetworkId,
  uri?: string,
  /* eslint-disable @typescript-eslint/no-explicit-any */
): Promise<any> {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const apiUri = uri ?? bbnDefaultApi(network);
  const statusUri = `${apiUri}/babylon/btcstaking/v1/btc_delegation/${txid}`;
  const apiResp = await fetch(statusUri).then((resp) => resp.json());
  if (apiResp.btc_delegation !== undefined) {
    return apiResp.btc_delegation;
  }
  return undefined;
}

/**
 * Get the Babylon phase2 params at a given btc block height
 *
 * @param height The btc block height
 * @param network The Babylon network
 * @param uri The API URI; if not supplied, the default will be used
 * @returns The parameters
 */
export async function getParamsAtHeight(
  height: number,
  network: BbnPhase2NetworkId,
  uri?: string,
  /* eslint-disable @typescript-eslint/no-explicit-any */
): Promise<any> {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const apiUri = uri ?? bbnDefaultApi(network);
  const paramsUri = `${apiUri}/babylon/btcstaking/v1/params/btc_height/${height}`;
  const apiResp = await fetch(paramsUri).then((resp) => resp.json());
  if (apiResp.params !== undefined) {
    apiResp.params.version = apiResp.version;
    return apiResp.params;
  }
  return undefined;
}
