import axios from "axios";
import assert from "assert";
import * as bc from "bitcoinjs-lib";
import * as cs from "@cubist-labs/cubesigner-sdk";
import { TransactionOutput } from "bitcoinjs-lib/src/psbt";

export const SATS_PER_BTC = 100000000;

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
 * @param {string} baseUrl baseUrl of network to check fee.
 *
 * @return {number} gas fee of making a tx on the given network.
 */
export async function getFeeRate(baseUrl: string): Promise<number> {
  const resp = await axios.get(`${baseUrl}/api/fee-estimates`);
  return parseFloat(resp.data["6"] ?? "1");
}

/**
 * Returns estimated fee in SATS for a transaction with `nInputs` inputs.
 * @param {number} nInputs The number of transaction inputs.
 * @param {number} feeRate Current fee rate per transaction vbyte.
 * @return {number} Estimated fee in SATS.
 */
export async function estimateFee(nInputs: number, feeRate: number): Promise<number> {
  const txVbytes = estimateTxVbytes(nInputs);
  return Math.ceil(txVbytes * feeRate);
}

/**
 * Convert Satoshis to BTC. This is a lossy conversion so should only be
 * used for display purposes (and only for non-production code).
 *
 * @param {bigint} satoshis - The amount of satoshis to convert.
 * @return {number} - The amount of BTC.
 */
export function convertSatToBtc(satoshis: bigint): number {
  return Number(satoshis) / SATS_PER_BTC;
}

/**
 * Convert a hex string to a byte array buffer.
 *
 * @param {string} hex Input hex-encoded string, with or without the leading "0x"
 * @return {Buffer} Byte array.
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
 * @param {number} nInputs The number of transaction inputs.
 * @return {number} Transaction size in vbytes.
 */
export function estimateTxVbytes(nInputs: number): number {
  const nOutputs = 2;
  const inputRate = 68;
  const outputRate = 31;
  const overhead = 10.5;
  return Math.ceil(overhead + nInputs * inputRate + nOutputs * outputRate);
}

/**
 * Returns the bitcoin network associated with a given bech32-encoded address.
 * @param {string} addr Bech32-encoded address.
 * @return {bc.networks.Network} Corresponding bitcoin network.
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
 * Fetches the given address's unsigned transactions.
 * Utxo's are returned in decending value order.
 *
 * @param {string} addr we want unsigned tx's of
 * @param {string} baseUrl base url of network we are searching.
 *
 * @return {Utxo[]} set of unsigned transactions the given address has.
 */
export async function getUtxos(addr: string, baseUrl: string): Promise<Utxo[]> {
  const result: Utxo[] = [];
  const resp = await axios.get(`${baseUrl}/api/address/${addr}/utxo`);
  for (const utxo of resp.data) {
    console.log("utxo", utxo);
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
 * Implements `SignerAsync` interface from 'bitcoinjs-lib' for a given wallet.
 */
export class BtcSigner implements bc.SignerAsync {
  /** address */
  readonly #fromKey: cs.KeyInfo;
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

  readonly #signerSession: cs.SignerSession;

  /** Public wallet. */
  get address() {
    return this.#fromKey.materialId;
  }

  /**
   * Constructor.
   * @param {cs.KeyInfo} fromKey key on whose behalf to sign
   * @param {bc.Psbt} psbt Partially signed bitcoin transaction
   * @param {number} inputIndex Index of the transaction input to sign
   * @param {Utxo[]} utxos Unspent outputs corresponding to transaction intputs
   * @param {bc.networks.Network} network Bitcoin network
   * @param {cs.SignerSession} signerSession cubesigner signer session
   */
  constructor(
    fromKey: cs.KeyInfo,
    psbt: bc.Psbt,
    inputIndex: number,
    utxos: Utxo[],
    network: bc.networks.Network,
    signerSession: cs.SignerSession,
  ) {
    this.#fromKey = fromKey;
    this.#psbt = psbt;
    this.#inputIndex = inputIndex;
    this.#utxos = utxos;
    this.#signerSession = signerSession;
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

    const resp = await this.#signerSession.signBtc(this.address, {
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
