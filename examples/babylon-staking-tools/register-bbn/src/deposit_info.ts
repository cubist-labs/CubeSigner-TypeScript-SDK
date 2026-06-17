import * as bc from "bitcoinjs-lib";
import * as cs from "@cubist-labs/cubesigner-sdk";

import { BABYLON_ADDR_HRP, taprootKeyIdForBbnNetwork } from "./bbn_util";
import type { BbnPhase2NetworkId, FeeType } from "./types";
import { isBbnPhase2NetworkId, isFeeType, btcNetworkIdToNetwork, HEX_REGEX } from "./types";

import { fromBech32, toBech32 } from "@cosmjs/encoding";

/**
 * The information needed to create a deposit
 */
export type DepositInfo = {
  /** Amount in sats */
  value: number;
  /** Depositor public key specified as a taproot address: "tb1q..." or "bc1q..." */
  stakerAddr: string;
  /** Babylon network */
  bbnNetwork: BbnPhase2NetworkId;
  /** Fee specified in either sats or in sats per vb */
  fee: number;
  /** Fee type: "sats", "sats_per_vb", or "sats_per_kwu" */
  feeType: FeeType;
  /** Finality provider public keys specified as hex strings */
  finalityProviderPks: string[];
  /** The lock time of the deposit in Bitcoin blocks. Must be less than 2^16. */
  lockTime: number;
  /**
   * The Babylon address specified as a Cosmos secp256k1 address with either
   * 'bbn' or 'cosmos' human-readable part
   */
  bbnAddr: string;
  /** MFA approval receipt(s) */
  mfaReceipts?: cs.MfaIdAndConf[];
  /** Fee per gas in ubbn. If not specified, uses the Babylon minimum */
  feePerGas?: number;
  /**
   * Gas to include with transaction. If neither `gas` nor `gasMultiplier` is specified,
   * the default value of 1.5x the Babylon minimum is used.
   */
  gas?: number;
  /** Gas multiplier to apply to the Babylon minimum. Ignored if `gas` is also specified */
  gasMultiplier?: number;
  /**
   * Optional deposit PSBT as a base64 string. If not specified one
   * will be created from existing UTXOs.
   */
  psbt?: string;
  /**
   * Explicit Babylon parameters to use in place of the API-provided ones.
   * This value is not typechecked in the client, but an invalid value will
   * result in a 400 error from the CubeSigner API.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  explicitParams?: any;
};

/**
 * DepositInfo type guard
 *
 * @param val The data to check
 * @returns Whether the value is of the correct type
 */
export function isDepositInfo(val: unknown): val is DepositInfo {
  if (val === undefined) return false;
  const info = val as DepositInfo;

  if (typeof info.value !== "number") {
    return false;
  }
  if (typeof info.stakerAddr !== "string") {
    return false;
  }
  if (typeof info.bbnNetwork !== "string" || !isBbnPhase2NetworkId(info.bbnNetwork)) {
    return false;
  }
  if (typeof info.fee !== "number") {
    return false;
  }
  if (typeof info.feeType !== "string" || !isFeeType(info.feeType)) {
    return false;
  }
  if (
    !Array.isArray(info.finalityProviderPks) ||
    !info.finalityProviderPks.every(
      (v) => typeof v === "string" && v.length === 64 && HEX_REGEX.test(v),
    )
  ) {
    return false;
  }
  if (typeof info.lockTime !== "number" || info.lockTime > 65535) {
    return false;
  }
  if (
    typeof info.bbnAddr !== "string" ||
    [BABYLON_ADDR_HRP, "cosmos"].indexOf(fromBech32(info.bbnAddr).prefix) === -1
  ) {
    return false;
  }
  if (info.mfaReceipts !== undefined) {
    if (!Array.isArray(info.mfaReceipts) || !info.mfaReceipts.every(cs.isMfaIdAndConf)) {
      return false;
    }
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
  if (info.psbt !== undefined && typeof info.psbt !== "string") {
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
export function getCosmosKeyInfo(info: DepositInfo): {
  cosmosKeyId: string;
  bbnAddress: string;
} {
  const decoded = fromBech32(info.bbnAddr);
  const cosmosKeyId = `Key#Cosmos_${toBech32("cosmos", decoded.data)}`;
  const bbnAddress = toBech32(BABYLON_ADDR_HRP, decoded.data);
  return { cosmosKeyId, bbnAddress };
}

/**
 * Get the Taproot key-id associated with a DepositInfo value
 *
 * @param info The DepositInfo value
 * @returns The key-id and corresponding scriptPubkey
 */
export function getTaprootKeyInfo(info: DepositInfo): {
  tapKeyId: string;
  tapPkScript: string;
} {
  const { tapKeyId, btcNetworkId } = taprootKeyIdForBbnNetwork(info.stakerAddr, info.bbnNetwork);
  const tapPkScript = bc.address
    .toOutputScript(info.stakerAddr, btcNetworkIdToNetwork(btcNetworkId))
    .toString("hex");
  return { tapKeyId, tapPkScript };
}

/**
 * Babylon network setting: minimum fee per gas
 */
const BABYLON_MIN_FEE_PER_GAS = 0.002;

/**
 * The amount of gas needed for a pre-stake registration message
 *
 * This is a staking parameter that can be obtained by querying
 *     babylond query btcstaking params --output json |
 *       jq -r '.params.delegation_creation_base_gas_fee'
 */
const BABYLON_MIN_PRE_STAKE_GAS = 1095000;

/**
 * Get the fee per gas specified by a DepositInfo value
 *
 * @param info The DepositInfo value
 * @returns The fee per gas
 */
export function getFeePerGas(info: DepositInfo): number {
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
 * @returns The gas
 */
export function getGas(info: DepositInfo): number {
  if (info.gas !== undefined) {
    if (isFinite(info.gas)) {
      return info.gas;
    }
    throw new Error("Invalid gas specified in DepositInfo");
  }

  if (info.gasMultiplier !== undefined) {
    if (isFinite(info.gasMultiplier)) {
      return Math.ceil(info.gasMultiplier * BABYLON_MIN_PRE_STAKE_GAS);
    }
    throw new Error("Invalid gasMultiplier specified in DepositInfo");
  }

  return Math.ceil(1.5 * BABYLON_MIN_PRE_STAKE_GAS);
}
