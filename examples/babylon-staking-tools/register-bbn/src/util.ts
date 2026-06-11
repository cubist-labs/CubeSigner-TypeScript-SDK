import * as bc from "bitcoinjs-lib";
import * as ecc from "@bitcoin-js/tiny-secp256k1-asmjs";

import type * as cs from "@cubist-labs/cubesigner-sdk";

import type { BtcNetworkId, InclusionProof, Utxo } from "./types";
import { btcNetworkIdToNetwork, isInclusionProof, HEX_REGEX } from "./types";

/* ENABLE DEBUGGING HERE */
const DEBUG = false;

/**
 * Make a GET request to the specified Blockstream API
 *
 * @param api The API to call, e.g., 'fee-estimates'
 * @param network The network to query
 * @param method The method, defaults to GET
 * @param body The body. Not valid except when method is PUT or POST
 * @returns The JSON result
 */
async function blockstreamApiRequest(
  api: string,
  network: BtcNetworkId,
  method: string = "GET",
  body?: string,
  /* eslint-disable @typescript-eslint/no-explicit-any */
): Promise<any> {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const netPath = network === "mainnet" ? "" : `${network}/`;
  const url = `https://blockstream.info/${netPath}api/${api}`;
  const opts = {
    method,
    body,
  };
  const resp = await fetch(url, opts);
  if (DEBUG) console.error(resp);
  let json = await resp.text();
  try {
    const parsed = JSON.parse(json);
    json = parsed;
    if (DEBUG) console.error(JSON.stringify(json, null, 2));
  } catch (_) {
    if (DEBUG) console.error(json);
  }
  return json;
}

/**
 * Fetches the gas fee.
 *
 * @param network The bitcoin network-id to use
 * @returns gas fee of making a tx on the given network (6-block estimate)
 */
export async function getFeeRate(network: BtcNetworkId): Promise<number> {
  const resp = await blockstreamApiRequest("fee-estimates", network);
  return parseFloat(resp["6"] ?? "1");
}

/**
 * Returns the bitcoin network associated with a given bech32-encoded address.
 *
 * @param addr Bech32-encoded address.
 * @returns Corresponding bitcoin network.
 */
export function addrNetwork(addr: string): BtcNetworkId {
  const net = addr.startsWith("bc1") ? "mainnet" : addr.startsWith("tb1") ? "signet" : undefined;
  if (!net) {
    throw new Error(
      `Invalid bech32 addr: '${addr}'; address must start with 'bc1' for mainnet or 'tb1' for testnet`,
    );
  }
  return net;
}

/**
 * Fetches the given address's unsigned transactions.
 * Utxo's are returned in decending value order.
 *
 * @param addr we want unsigned tx's of
 * @returns set of unsigned transactions the given address has.
 */
export async function getUtxos(addr: string): Promise<Utxo[]> {
  const result: Utxo[] = [];
  const resp = await blockstreamApiRequest(`address/${addr}/utxo`, addrNetwork(addr));
  for (const utxo of resp) {
    if (DEBUG) console.error(`utxo: ${JSON.stringify(utxo, null, 2)}`);
    if (utxo.status?.confirmed) {
      result.push({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
      });
    }
  }

  return result.sort((a, b) => b.value - a.value);
}

/**
 * Fetch an inclusion proof for the specified transaction on the specified
 * Bitcoin network.
 *
 * @param txid The transaction-id
 * @param network The bitcoin network
 * @returns The inclusion proof
 */
export async function getInclusionProof(
  txid: string,
  network: BtcNetworkId,
): Promise<undefined | InclusionProof> {
  const resp = await blockstreamApiRequest(`tx/${txid}/merkle-proof`, network);
  if (!isInclusionProof(resp)) {
    return undefined;
  }
  return resp;
}

/**
 * Fetch the block hash for the specified block height
 *
 * @param height The block height
 * @param network The bitcoin network
 * @returns The block hash
 */
export async function getBlockHash(
  height: number,
  network: BtcNetworkId,
): Promise<undefined | string> {
  const resp = await blockstreamApiRequest(`block-height/${height}`, network);
  if (typeof resp !== "string" || !HEX_REGEX.test(resp)) {
    return undefined;
  }
  return resp;
}

/**
 * Posts a Bitcoin transaction via the Blockstream API
 *
 * @param tx The transaction as consensus hex serialization
 * @param network The Bitcoin network to which this tx should be sent
 * @returns The API response
 */
export async function broadcastBtcTx(tx: string, network: BtcNetworkId): Promise<unknown> {
  const resp = await blockstreamApiRequest("/tx", network, "POST", tx);
  return resp;
}

/**
 * Get a transaction by id
 *
 * @param txid The transaction-id
 * @param network The network, i.e., "mainnet" or "signet"
 * @returns The transaction object as returned by Blockstream's API
 *          https://github.com/Blockstream/esplora/blob/master/API.md#transaction-format
 */
export async function getBtcTx(
  txid: string,
  network: BtcNetworkId,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const resp = await blockstreamApiRequest(`/tx/${txid}`, network);
  return resp;
}

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback The optional fallback value.
 * @returns The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
  if (DEBUG) console.error(`current env check: ${name}`);
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}

/**
 * Create a new PSBT with no outputs spending a set of input UTXOs
 * totaling at least a specified value.
 *
 * @param addr The bitcoin address whose UTXOs to spend
 * @param pk The public key associated with addr
 * @param value The target value
 * @param nOutputs The number of outputs to account for when computing the fee
 * @returns The created PSBT
 */
export async function newPsbtWithValue(
  addr: string,
  pk: Buffer,
  value: number,
  nOutputs: number = 3,
): Promise<bc.Psbt> {
  if (value <= 0) {
    throw new Error("PSBT value must be >0");
  }

  // scaffolding for PSBT
  const btcNetworkId = addrNetwork(addr);
  const btcNetwork = btcNetworkIdToNetwork(btcNetworkId);
  const psbt = new bc.Psbt({ network: btcNetwork });
  psbt.setVersion(2);
  psbt.setLocktime(0);

  // retrieve current fee rate
  const feeRate = await getFeeRate(btcNetworkId);

  // build up the UTXOs to spend
  let psbtTotalSats = 0;
  const addrScriptPubkey = bc.address.toOutputScript(addr, btcNetwork);
  const utxos = await getUtxos(addr);
  // NOTE: utxos is ordered from most to least valuable, so reverse()
  // means we use least-valuable UTXOs first. There are certainly other
  // approaches that may be better.
  for (const utxo of utxos.reverse()) {
    // add the next UTXO
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: addrScriptPubkey,
      },
      tapInternalKey: pk,
    });

    // break if we have enough for the transfer
    psbtTotalSats += utxo.value;
    const feeEst = estimateBbnDepositFee(feeRate, psbt.inputCount, nOutputs);
    if (psbtTotalSats >= value + feeEst) {
      break;
    }
  }

  // make sure the funds were sufficient before returning
  const feeEst = estimateBbnDepositFee(feeRate, psbt.inputCount, nOutputs);
  if (psbtTotalSats < value + feeEst) {
    throw new Error(`Insufficient funds available ${psbtTotalSats}, needed ${value} + ${feeEst}`);
  }
  return psbt;
}

/**
 * Compute a rough estimate of the fee associated with a transaction.
 * This estimate follows the one computed in the Babylon codebase:
 * https://github.com/babylonchain/btc-staking-ts/blob/2483c97f6156d507f74ef4dcc814c67c29d44460/src/ut
ils/fee.ts#L15
 *
 * @param feeRate The fee rate in sats per vb
 * @param inputs The number of inputs
 * @param outputs The number of outputs
 * @returns The estimated fee in sats
 */
export function estimateBbnDepositFee(feeRate: number, inputs: number, outputs: number): number {
  // see link above
  const INPUT_SIZE_FOR_FEE_CAL = 180;
  const OUTPUT_SIZE_FOR_FEE_CAL = 34;
  const TX_BUFFER_SIZE_FOR_FEE_CAL = 10;
  const ESTIMATED_OP_RETURN_SIZE = 40;

  const estimatedSize =
    (INPUT_SIZE_FOR_FEE_CAL + 1) * inputs +
    OUTPUT_SIZE_FOR_FEE_CAL * outputs +
    TX_BUFFER_SIZE_FOR_FEE_CAL +
    ESTIMATED_OP_RETURN_SIZE;
  return Math.ceil(estimatedSize * feeRate);
}

/**
 * Verify Schnorr signature (note the order of arguments is different from ecc's verifySchnorr).
 *
 * @param pubkey Public key corresponding to the private key that signed the message
 * @param msghash Hash of the message
 * @param signature Schnorr signature to verify
 * @returns Whether {@link signature} is valid
 */
export function schnorrVerify(pubkey: Buffer, msghash: Buffer, signature: Buffer): boolean {
  return ecc.verifySchnorr(msghash, pubkey, signature);
}

/**
 * Tweak a taproot pubkey
 *
 * @param pk The 32-byte public key to tweak
 * @param network The Bitcoin network
 * @returns The tweaked public key as a bitcoinjs-lib Payment value
 */
export function tweakTaprootPk(pk: Buffer, network: bc.Network): bc.payments.Payment {
  const trHash = bc.crypto.taggedHash("TapTweak", pk);
  const tweaked = ecc.xOnlyPointAddTweak(pk, trHash);
  if (!tweaked) {
    throw new Error("Tweak failed");
  }
  return bc.payments.p2tr({
    pubkey: Buffer.from(tweaked.xOnlyPubkey),
    network,
  });
}

/**
 * Sleep the specified number of milliseconds
 *
 * @param ms The number of milliseconds to sleep
 * @returns A promise that resolves after the specified number of milliseconds
 */
export function sleep(ms: number): Promise<null> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Compute an MfaReceipts value
 *
 * @param orgId The org-id
 * @param rcpts The receipts specified by the user, if defined
 * @returns The receipts, if defined
 */
export function toMfaReceipts(
  orgId: string,
  rcpts?: cs.MfaIdAndConf[],
): cs.MfaReceipts | undefined {
  if (rcpts === undefined) {
    return undefined;
  }
  return {
    receipts: rcpts,
    orgId,
  };
}
