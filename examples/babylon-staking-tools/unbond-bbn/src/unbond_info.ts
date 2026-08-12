import * as cs from "@cubist-labs/cubesigner-sdk";

import type { BbnPhase2NetworkId } from "./types";
import { isBbnPhase2NetworkId, HEX_REGEX } from "./types";

/**
 * The information needed to create a deposit
 */
export type UnbondInfo = {
  /** Transaction ID of the deposit to unbond */
  txid: string;
  /** Babylon network */
  bbnNetwork: BbnPhase2NetworkId;
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
 * UnbondInfo type guard
 *
 * @param val The data to check
 * @returns Whether the value is of the correct type
 */
export function isUnbondInfo(val: unknown): val is UnbondInfo {
  if (val === undefined) return false;
  const info = val as UnbondInfo;

  if (typeof info.txid !== "string" || !HEX_REGEX.test(info.txid)) {
    return false;
  }
  if (typeof info.bbnNetwork !== "string" || !isBbnPhase2NetworkId(info.bbnNetwork)) {
    return false;
  }
  if (info.mfaReceipts !== undefined) {
    if (!Array.isArray(info.mfaReceipts) || !info.mfaReceipts.every(cs.isMfaIdAndConf)) {
      return false;
    }
  }

  return true;
}
