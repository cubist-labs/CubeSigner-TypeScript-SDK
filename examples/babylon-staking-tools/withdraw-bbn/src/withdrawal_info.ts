import * as bc from "bitcoinjs-lib";

import * as cs from "@cubist-labs/cubesigner-sdk";

import { bbnToBtcNetwork, taprootKeyIdForBbnNetwork } from "./bbn_util";
import type { BbnNetworkId, BtcNetworkId, FeeType } from "./types";
import { isBbnNetworkId, isFeeType, HEX_REGEX } from "./types";

/** The type of withdrawal to perform */
export type WithdrawalType = "withdraw_early_unbond" | "withdraw_timelock" | "withdraw_slashing";

/**
 * Type guard for WithdrawalType
 *
 * @param ty The value to check
 * @returns Whether the value is of the correct type
 */
export function isWithdrawalType(ty: string): ty is WithdrawalType {
  return ty === "withdraw_early_unbond" || ty === "withdraw_timelock" || ty === "withdraw_slashing";
}

/**
 * The information needed to create a withdrawal transaction
 */
export type WithdrawalInfo = {
  /** Finality provider public keys used in the deposit being withdrawn */
  finalityProviderPks: string[];
  /**
   * The lock time of the withdrawal output. For "withdraw_timelock", this is
   * the staking lock time specified at deposit time.
   *
   * For "withdraw_early_unbond" and "withdraw_slashing", this is the unbonding
   * delay specified by Babylon (which is always 1008 blocks).
   */
  lockTime: number;
  /** Babylon network */
  bbnNetwork: BbnNetworkId;
  /** Depositor public key specified as a taproot address: "tb1q..." or "bc1q..." */
  stakerAddr: string;
  /** Fee specified in either sats or in sats per vb */
  fee: number;
  /** Fee type: "sats", "sats_per_vb", or "sats_per_kwu" */
  feeType: FeeType;
  /**
   * Recipient specified as a Bitcoin address. If this value is
   * not specified, the stakerAddr is used.
   */
  recipientAddr?: string;
  /** Txid of the UTXO to withdraw from */
  txid: string;
  /** The type of withdrawal to perform */
  withdrawalType: WithdrawalType;
  /** MFA approval receipt(s) */
  mfaReceipts?: cs.MfaIdAndConf[];
  /**
   * Explicit Babylon parameters to use in place of the API-provided ones.
   * This value is not typechecked in the client, but an invalid value will
   * result in a 400 error from the CubeSigner API.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  explicitParams?: any;
};

/**
 * WithdrawalInfo type guard
 *
 * @param val The data to check
 * @returns Whether the value is of the correct type
 */
export function isWithdrawalInfo(val: unknown): val is WithdrawalInfo {
  if (val === undefined) return false;
  const info = val as WithdrawalInfo;

  if (typeof info.lockTime !== "number" || info.lockTime > 65535) {
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
  if (typeof info.bbnNetwork !== "string" || !isBbnNetworkId(info.bbnNetwork)) {
    return false;
  }
  if (typeof info.stakerAddr !== "string") {
    return false;
  }
  if (typeof info.fee !== "number") {
    return false;
  }
  if (typeof info.feeType !== "string" || !isFeeType(info.feeType)) {
    return false;
  }
  if (info.recipientAddr !== undefined && typeof info.recipientAddr !== "string") {
    return false;
  }
  if (typeof info.txid !== "string") {
    return false;
  }
  if (typeof info.withdrawalType !== "string" || !isWithdrawalType(info.withdrawalType)) {
    return false;
  }
  if (info.mfaReceipts !== undefined) {
    if (!Array.isArray(info.mfaReceipts) || !info.mfaReceipts.every(cs.isMfaIdAndConf)) {
      return false;
    }
  }

  return true;
}

/**
 * Get the Taproot key-id associated with a WithdrawalInfo value
 *
 * @param info The WithdrawalInfo value
 * @returns The key-id
 */
export function getTaprootKeyInfo(info: WithdrawalInfo): {
  tapKeyId: string;
  btcNetworkId: BtcNetworkId;
} {
  return taprootKeyIdForBbnNetwork(info.stakerAddr, info.bbnNetwork);
}

/**
 * Compute the script pubkey to which the withdrawn funds should be sent
 *
 * @param info The WithdrawalInfo value
 * @returns The scriptPubkey
 */
export function getRecipientScriptPubkey(info: WithdrawalInfo): Buffer {
  const changeAddr = info.recipientAddr ?? info.stakerAddr;
  return bc.address.toOutputScript(changeAddr, bbnToBtcNetwork(info.bbnNetwork));
}
