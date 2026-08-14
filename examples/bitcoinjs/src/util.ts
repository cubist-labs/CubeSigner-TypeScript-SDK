import axios from "axios";
import assert from "assert";
import * as bc from "bitcoinjs-lib";
import type * as cs from "@cubist-labs/cubesigner-sdk";
import type { TransactionOutput } from "bitcoinjs-lib/src/psbt";

export const SATS_PER_BTC = 100000000;

// Constants used by estimateTxVbytes
export const VBYTES_PER_OUTPUT = 31;
export const VBYTES_OVERHEAD = 10.5;
export const VBYTES_PER_INPUT = 68;

/**
 * Unspent transaction output.
 */
export interface Utxo {
  /** Transaction id */
  txid: string;
  /** Transaction output index. */
  vout: number;
  /** Output value in satoshis */
  value: number;
}

/**
 * Fetches the gas fee.
 *
 * @param baseUrl base URL of network to check fee.
 * @param conf the target number of confirmations for which to return the fee.
 *
 * @returns gas fee of making a tx on the given network.
 */
export async function getFeeRate(baseUrl: string, conf: string = "6"): Promise<number> {
  const resp = await axios.get(`${baseUrl}/api/fee-estimates`);
  return parseFloat(resp.data[conf] ?? "1");
}

/**
 * Returns estimated fee in SATS for a transaction with `nInputs` inputs.
 *
 * @param nInputs The number of transaction inputs.
 * @param feeRate Current fee rate per transaction vbyte.
 * @param nOutputs The number of transaction outputs; defaults to 2 if not specified.
 * @returns Estimated fee in SATS.
 */
export function estimateFee(nInputs: number, feeRate: number, nOutputs: number = 2): number {
  const txVbytes = estimateTxVbytes(nInputs, nOutputs);
  return Math.ceil(txVbytes * feeRate);
}

/**
 * Convert Satoshis to BTC. This is a lossy conversion so should only be
 * used for display purposes (and only for non-production code).
 *
 * @param satoshis The amount of satoshis to convert.
 * @returns The amount of BTC.
 */
export function convertSatToBtc(satoshis: bigint): number {
  return Number(satoshis) / SATS_PER_BTC;
}

/**
 * Convert a hex string to a byte array buffer.
 *
 * @param hex Input hex-encoded string, with or without the leading "0x"
 * @returns Byte array.
 */
export function hexToBytes(hex: string): Buffer {
  if (hex.length >= 2 && hex.slice(0, 2) == "0x") {
    hex = hex.substring(2);
  }
  return Buffer.from(hex, "hex");
}

/**
 * https://bitcoinops.org/en/tools/calc-size/
 *
 * @param nInputs The number of transaction inputs.
 * @param nOutputs The number of transaction outputs; defaults to 2 if not specified.
 * @returns Transaction size in vbytes.
 */
export function estimateTxVbytes(nInputs: number, nOutputs: number): number {
  return Math.ceil(VBYTES_OVERHEAD + nInputs * VBYTES_PER_INPUT + nOutputs * VBYTES_PER_OUTPUT);
}

/**
 * Estimate the cost in satoshis of one transaction output
 *
 * @param feeRate Current fee rate per transaction vbyte.
 *
 * @returns Estimated fee in satoshis
 */
export function estimateOutputFee(feeRate: number): number {
  return Math.ceil(feeRate * VBYTES_PER_OUTPUT);
}

/**
 * Returns the bitcoin network associated with a given bech32-encoded address.
 *
 * @param addr Bech32-encoded address.
 * @returns Corresponding bitcoin network.
 */
export function addrNetwork(addr: string): bc.networks.Network {
  const net = addr.startsWith("bc1")
    ? bc.networks.bitcoin
    : addr.startsWith("tb1")
      ? bc.networks.testnet
      : undefined;
  if (!net) {
    throw new Error(
      `Invalid bech32 addr: '${addr}'; address must start with 'bc1' for mainnet or 'tb1' for testnet`,
    );
  }
  return net;
}

/**
 * Fetches the given address's confirmed unspent transaction outputs.
 * Utxo's are returned in decending value order.
 *
 * The obvious endpoint for this (`/api/address/:addr/utxo`) is not paginated and
 * the server refuses to serve it with `Too many history entries` once an address
 * accumulates enough history. So instead we walk the address's transaction
 * history, which *is* paginated, and derive the unspent outputs ourselves.
 *
 * The history is returned newest first, and an output can only be spent by a
 * strictly later transaction; by the time we get to a transaction's outputs, any
 * spend of them has therefore already been recorded. That makes every
 * "is unspent" decision final, which in turn makes it safe to stop paging early.
 *
 * @param addr we want the unspent outputs of
 * @param baseUrl base url of network we are searching.
 * @param opts Options.
 * @param opts.maxUtxos Stop paging once this many utxos have been found,
 *   returning only the most recent ones. Unlimited by default.
 *
 * @returns set of unspent transaction outputs the given address has.
 */
export async function getUtxos(
  addr: string,
  baseUrl: string,
  opts?: { maxUtxos?: number },
): Promise<Utxo[]> {
  const maxUtxos = opts?.maxUtxos ?? Infinity;
  const utxos: Utxo[] = [];
  const spent = new Set<string>();
  const lowerAddr = addr.toLowerCase();

  // Unconfirmed transactions come first because they are the newest. They only
  // ever contribute spends: we don't return unconfirmed outputs, but we do have
  // to skip outputs that a pending transaction has already spent.
  let txs = (await axios.get(`${baseUrl}/api/address/${addr}/txs/mempool`)).data;
  let lastSeenTxid: string | undefined = undefined;

  pages: while (true) {
    for (const tx of txs) {
      // record spends before outputs, so that a transaction spending an output
      // from the same page always wins over that output
      for (const vin of tx.vin ?? []) {
        if (vin.txid !== undefined) {
          spent.add(`${vin.txid}:${vin.vout}`);
        }
      }
      if (tx.status?.confirmed) {
        for (const [vout, out] of (tx.vout ?? []).entries()) {
          const key = `${tx.txid}:${vout}`;
          if (out.scriptpubkey_address?.toLowerCase() === lowerAddr && !spent.has(key)) {
            utxos.push({ txid: tx.txid, vout, value: out.value });
          }
        }
        // Only confirmed transactions may be used as the pagination cursor: the
        // server resolves it against the *confirmed* history, so handing it an
        // unconfirmed txid yields an empty page instead of the next one.
        lastSeenTxid = tx.txid;
      }
      if (utxos.length >= maxUtxos) {
        break pages;
      }
    }

    // fetch the next page of confirmed history
    const path = lastSeenTxid
      ? `/api/address/${addr}/txs/chain/${lastSeenTxid}`
      : `/api/address/${addr}/txs/chain`;
    const prevTxid = lastSeenTxid;
    txs = (await axios.get(`${baseUrl}${path}`)).data;
    // stop on an empty page, or if the server fails to make progress
    if (txs.length === 0 || txs[txs.length - 1].txid === prevTxid) {
      break pages;
    }
  }

  return utxos.sort((a, b) => b.value - a.value);
}

/**
 * Implements `SignerAsync` interface from 'bitcoinjs-lib' for a given wallet.
 */
export class BtcSigner implements bc.SignerAsync {
  /** address */
  readonly #fromKey: cs.Key;
  /** partially signed tx */
  readonly #psbt: bc.Psbt;
  /** Index of the transaction input (in `this.psbt`) to sign */
  readonly #inputIndex: number;
  /** Unspent output corresponding to that input */
  readonly #utxos: Utxo[];
  /** Compressed pubkey of the wallet/key (`this.#keyInfo`) to sign with */
  public readonly publicKey: Buffer;
  /** Bitcoin network to sign for */
  public readonly network: bc.networks.Network;

  /** @returns Public wallet. */
  get address() {
    return this.#fromKey.materialId;
  }

  /**
   * Constructor.
   *
   * @param fromKey key on whose behalf to sign
   * @param psbt Partially signed bitcoin transaction
   * @param inputIndex Index of the transaction input to sign
   * @param utxos Unspent outputs corresponding to transaction intputs
   * @param network Bitcoin network
   */
  constructor(
    fromKey: cs.Key,
    psbt: bc.Psbt,
    inputIndex: number,
    utxos: Utxo[],
    network: bc.networks.Network,
  ) {
    this.#fromKey = fromKey;
    this.#psbt = psbt;
    this.#inputIndex = inputIndex;
    this.#utxos = utxos;
    this.network = network;

    const pk = hexToBytes(fromKey.publicKey); // uncompressed
    assert(pk.length == 65);
    assert(pk[0] == 4);

    // compress it because that's what bitcoinjs wants
    const parity = pk[64] & 1;
    this.publicKey = pk.subarray(0, 33);
    this.publicKey[0] = 2 | parity;
  }

  /** @inheritdoc */
  public async sign(/* _hash: Buffer*/): Promise<Buffer> {
    // translate psbt to the transaction needed for the RPC call
    const txInput = this.#psbt.txInputs[this.#inputIndex];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx: any = <any>{
      version: this.#psbt.version,
      lock_time: this.#psbt.locktime,
      input: this.#utxos.map((utxo) => {
        return {
          script_sig: "", // always empty
          witness: [], // always empty
          // don't use `txInput.hash` for `txid` because even though those two started
          // out being the same, by now bitcoinjs has reversed `txInput.hash` (know knows why)
          previous_output: `${utxo.txid}:${utxo.vout}`,
          sequence: txInput.sequence,
        };
      }),
      output: this.#psbt.txOutputs.map((txO: TransactionOutput) => {
        return {
          value: txO.value,
          script_pubkey: txO.script.toString("hex"),
        };
      }),
    };

    // construct RPC request
    const paymentScript = bc.payments.p2pkh({
      pubkey: this.publicKey,
      network: this.network,
    }).output!;

    const resp = await this.#fromKey.signBtc({
      sig_kind: {
        Segwit: {
          input_index: this.#inputIndex,
          script_code: `0x${paymentScript.toString("hex")}`,
          value: this.#utxos[this.#inputIndex].value,
          sighash_type: "All",
        },
      },
      tx: tx,
    });

    const signature = resp.data().signature;
    const sigBytes = hexToBytes(signature);
    assert(sigBytes.length === 65, `Unexpected signature length: ${sigBytes.length}`);
    // bitcoinjs insists on getting just the first 64 bytes (without the recovery byte)
    return sigBytes.subarray(0, 64);
  }

  /** @inheritdoc */
  public getPublicKey(): Buffer {
    return this.publicKey;
  }

  /** @inheritdoc */
  public async signSchnorr(): Promise<Buffer> {
    throw new Error("Unsupported: No Schnorr signatures.");
  }
}
