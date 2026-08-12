import { BABYLON_ADDR_HRP } from "./bbn_util";
import type { BbnPhase2NetworkId } from "./types";
import { isBbnPhase2NetworkId, HEX_REGEX } from "./types";

import { fromBech32, toBech32 } from "@cosmjs/encoding";

/**
 * The information needed to create a deposit
 */
export type DelegationInfo = {
  /** Bitcoin transaction ID to report */
  txid: string;
  /** Babylon network */
  bbnNetwork: BbnPhase2NetworkId;
  /**
   * The Babylon address from which to report, specified as a Cosmos secp256k1
   * address with either 'bbn' or 'cosmos' human-readable part
   */
  bbnAddr: string;
  /** Fee per gas in ubbn. If not specified, uses the Babylon minimum */
  feePerGas?: number;
  /**
   * Gas to include with transaction. If neither `gas` nor `gasMultiplier` is specified,
   * the default value of 1.5x the simulated value is used.
   */
  gas?: number;
  /** Gas multiplier to apply to the Babylon minimum. Ignored if `gas` is also specified */
  gasMultiplier?: number;
};

/**
 * DelegationInfo type guard
 *
 * @param val The data to check
 * @returns Whether the value is of the correct type
 */
export function isDelegationInfo(val: unknown): val is DelegationInfo {
  if (val === undefined) return false;
  const info = val as DelegationInfo;

  if (typeof info.txid !== "string" || !HEX_REGEX.test(info.txid)) {
    return false;
  }
  if (typeof info.bbnNetwork !== "string" || !isBbnPhase2NetworkId(info.bbnNetwork)) {
    return false;
  }
  if (
    typeof info.bbnAddr !== "string" ||
    [BABYLON_ADDR_HRP, "cosmos"].indexOf(fromBech32(info.bbnAddr).prefix) === -1
  ) {
    return false;
  }
  if (info.feePerGas !== undefined && typeof info.feePerGas !== "number") {
    return false;
  }
  if (info.gas !== undefined && typeof info.gas !== "number") {
    return false;
  }
  if (info.gasMultiplier !== undefined && typeof info.gasMultiplier !== "number") {
    return false;
  }

  return true;
}

/**
 * Get the Cosmos key-id associated with a DepositInfo value
 *
 * @param info The DepositInfo value
 * @returns The key-id
 */
export function getCosmosKeyInfo(info: DelegationInfo): {
  cosmosKeyId: string;
  bbnAddress: string;
} {
  const decoded = fromBech32(info.bbnAddr);
  const cosmosKeyId = `Key#Cosmos_${toBech32("cosmos", decoded.data)}`;
  const bbnAddress = toBech32(BABYLON_ADDR_HRP, decoded.data);
  return { cosmosKeyId, bbnAddress };
}

/**
 * Babylon network setting: minimum fee per gas
 */
const BABYLON_MIN_FEE_PER_GAS = 0.002;

/**
 * Get the fee per gas specified by a DepositInfo value
 *
 * @param info The DepositInfo value
 * @returns The fee per gas
 */
export function getFeePerGas(info: DelegationInfo): number {
  if (info.feePerGas !== undefined) {
    if (isFinite(info.feePerGas) && info.feePerGas >= BABYLON_MIN_FEE_PER_GAS) {
      return info.feePerGas;
    }
    throw new Error("Invalid feePerGas specified in DepositInfo");
  }

  return BABYLON_MIN_FEE_PER_GAS;
}

/**
 * Get the gas specified by a DepositInfo value, or the default value of
 * 1.5x Babylon minimum if neither `gas` nor `gasMultiplier` is specified.
 *
 * @param info The DepositInfo value
 * @param simulated The result of gas simulation
 * @returns The gas
 */
export function getGas(info: DelegationInfo, simulated: number): number {
  if (info.gas !== undefined) {
    if (isFinite(info.gas)) {
      return info.gas;
    }
    throw new Error("Invalid gas specified in DepositInfo");
  }

  if (info.gasMultiplier !== undefined) {
    if (isFinite(info.gasMultiplier)) {
      return Math.ceil(info.gasMultiplier * simulated);
    }
    throw new Error("Invalid gasMultiplier specified in DepositInfo");
  }

  return Math.ceil(1.5 * simulated);
}
