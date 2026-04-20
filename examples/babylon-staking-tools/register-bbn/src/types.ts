import * as bc from "bitcoinjs-lib";

import type { schemas as CubeSignerSchemas } from "@cubist-labs/cubesigner-sdk";

/** A regex that recognizes hex strings */
export const HEX_REGEX = /^[0-9A-Fa-f]+$/;

/**
 * Babylon network-id
 */
export type BbnNetworkId = CubeSignerSchemas["BabylonNetworkId"];

/**
 * BbnNetworkId type guard
 *
 * @param id The string to check
 * @returns Whether the value is of the correct type
 */
export function isBbnNetworkId(id: string): id is BbnNetworkId {
  return id === "bbt4" || isBbnPhase2NetworkId(id);
}

/**
 * Babylon phase2 network-ids, i.e., all networks except "bbt4"
 */
export type BbnPhase2NetworkId = Exclude<BbnNetworkId, "bbt4">;

/**
 * BbnPhase2NetworkId type guard
 *
 * @param id The string to check
 * @returns Whether the value is of the correct type
 */
export function isBbnPhase2NetworkId(id: string): id is BbnPhase2NetworkId {
  return id === "bbt5" || id == "bbn1";
}

/**
 * Bitcoin network-ids
 */
export type BtcNetworkId = "signet" | "mainnet";

/**
 * Get the bitcoinjs-lib Network corresponding to a BtcNetworkId
 *
 * @param network The bitcoin network-id
 * @returns The bitcoin network value
 */
export function btcNetworkIdToNetwork(network: BtcNetworkId): bc.Network {
  if (network === "mainnet") {
    return bc.networks.bitcoin;
  }
  return bc.networks.testnet;
}

/**
 * Fee type specification for the CubeSigner back-end
 */
export type FeeType = CubeSignerSchemas["FeeType"];

/**
 * FeeType type guard
 *
 * @param ty The string to check
 * @returns Whether the value is of the correct type
 */
export function isFeeType(ty: string): ty is FeeType {
  return ty == "sats" || ty == "sats_per_vb" || ty == "sats_per_kwu";
}

/**
 * Unspent transaction output.
 */
export type Utxo = {
  /** Transaction id */
  txid: string;
  /** Transaction output index. */
  vout: number;
  /** Output value in satoshis */
  value: number;
};

/**
 * An inclusion proof as returned by the Blockstream API
 */
export type InclusionProof = {
  /* Position in the block */
  pos: number;
  /* Merkle path */
  merkle: string[];
  /* Block height */
  block_height: number;
};

/**
 * InclusionProof type guard
 *
 * @param val The value to check
 * @returns Whether the value is of the correct type
 */
export function isInclusionProof(val: unknown): val is InclusionProof {
  if (val === undefined) {
    return false;
  }
  const proof = val as InclusionProof;

  if (typeof proof.pos !== "number") {
    return false;
  }
  if (typeof proof.block_height !== "number") {
    return false;
  }
  if (
    !Array.isArray(proof.merkle) ||
    !proof.merkle.every((v) => typeof v === "string" && HEX_REGEX.test(v))
  ) {
    return false;
  }

  return true;
}
