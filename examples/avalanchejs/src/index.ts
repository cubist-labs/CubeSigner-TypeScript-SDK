import * as ava from "@avalabs/avalanchejs";
import { JsonRpcProvider } from "ethers";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { delay } from "@cubist-labs/cubesigner-sdk";

const AVAX_PUBLIC_URL = "https://api.avax-test.network";
const C_CHAIN_ADDRESS: string = env("C_CHAIN_ADDRESS")!.trim();
const P_CHAIN_ADDRESS: string = env("P_CHAIN_ADDRESS")!.trim();
const AMOUNT_C_TO_P = parseFloat(env("TRANSFER_AMOUNT_C_TO_P", "0.006")!.trim());
const AMOUNT_P_TO_C = parseFloat(env("TRANSFER_AMOUNT_P_TO_C", "0.002")!.trim());
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

/** Transaction ids associated with a transfer. */
interface TransferTxIds {
  exportTxId: string;
  importTxId: string;
}

/** Class with utilities to transfer funds between chains */
class TransferUtil {
  client: cs.CubeSignerClient;
  context: ava.Context.Context;
  evmapi: ava.evm.EVMApi;
  pvmapi: ava.pvm.PVMApi;
  provider: JsonRpcProvider;

  /**
   * Constructor.
   *
   * @param {cs.CubeSignerClient} client The CubeSigner client to use for signing
   * @param {ava.Context.Context} context The Avalanche context
   */
  constructor(client: cs.CubeSignerClient, context: ava.Context.Context) {
    this.client = client;
    this.context = context;
    this.evmapi = new ava.evm.EVMApi(AVAX_PUBLIC_URL);
    this.pvmapi = new ava.pvm.PVMApi(AVAX_PUBLIC_URL);
    this.provider = new JsonRpcProvider(AVAX_PUBLIC_URL + "/ext/bc/C/rpc");
  }

  /**
   * Transfer AVAX from C-chain to P-chain.
   *
   * @param {string} cAddr C-chain address to transfer from (in Ethereum-style address format)
   * @param {string} pAddr P-chain address to transfer to (in bech32 format)
   * @param {bigint} nAvax Amount to transfer in nAVAX
   * @return {Promise<TransferTxIds>} The transaction ids of the export and import transactions
   */
  async transferAvaxCtoP(cAddr: string, pAddr: string, nAvax: bigint): Promise<TransferTxIds> {
    const txCount = await this.provider.getTransactionCount(cAddr);
    const baseFee = await this.evmapi.getBaseFee();

    // Generate export transaction on the C-chain (initiates the transfer)
    const exportTx = ava.evm.newExportTxFromBaseFee(
      this.context,
      baseFee / BigInt(1e9),
      nAvax,
      this.context.pBlockchainID,
      ava.utils.hexToBuffer(cAddr),
      [ava.utils.bech32ToBytes(pAddr)],
      BigInt(txCount),
    );
    const serExportTx = ava.utils.bufferToHex(exportTx.toBytes());

    console.log("Signing C-chain export transaction");
    const exportTxSig = await this.client.apiClient.signSerializedAva(cAddr, "C", serExportTx);
    exportTx.addSignature(ava.utils.hexToBuffer(exportTxSig.data().signature));

    console.log("Submitting C-chain export transaction");
    const exportTxRes = await this.evmapi.issueSignedTx(exportTx.getSignedTx());
    await this.#waitForEvmTxAccepted(exportTxRes.txID);

    // Generate import transaction on the P-chain (completes the transfer)
    const { utxos } = await this.pvmapi.getUTXOs({
      sourceChain: "C",
      addresses: [pAddr],
    });
    const importTx = ava.pvm.newImportTx(
      this.context,
      this.context.cBlockchainID,
      utxos,
      [ava.utils.bech32ToBytes(pAddr)],
      [ava.utils.bech32ToBytes(pAddr)],
    );
    const serImportTx = ava.utils.bufferToHex(importTx.toBytes());

    console.log("Signing P-chain import transaction");
    const pAddrMaterialId = pAddr.substring(2);
    const importTxSig = await this.client.apiClient.signSerializedAva(
      pAddrMaterialId,
      "P",
      serImportTx,
    );
    importTx.addSignature(ava.utils.hexToBuffer(importTxSig.data().signature));

    console.log("Submitting P-chain import transaction");
    const importTxRes = await this.pvmapi.issueSignedTx(importTx.getSignedTx());
    await this.#waitForPvmTxCommitted(importTxRes.txID);

    return {
      exportTxId: exportTxRes.txID,
      importTxId: importTxRes.txID,
    };
  }

  /**
   * Transfer AVAX from P-chain to C-chain.
   *
   * @param {string} pAddr P-chain address to transfer to (in bech32 format)
   * @param {string} cAddr C-chain address to transfer from (in  Ethereum-style address format)
   * @param {bigint} nAvax Amount to transfer in nAVAX
   * @return {Promise<TransferTxIds>} The transaction ids of the export and import transactions
   */
  async transferAvaxPtoC(pAddr: string, cAddr: string, nAvax: bigint): Promise<TransferTxIds> {
    const baseFee = await this.evmapi.getBaseFee();
    const cAddrBytes = await this.#getAvaAddress(cAddr);
    const cAddrBech32 = ava.utils.format("C", "fuji", cAddrBytes);

    // Generate export transaction on the P-chain (initiates the transfer)
    const { utxos } = await this.pvmapi.getUTXOs({
      addresses: [pAddr],
    });
    const exportTx = ava.pvm.newExportTx(
      this.context,
      this.context.cBlockchainID,
      [ava.utils.bech32ToBytes(pAddr)],
      utxos,
      [ava.TransferableOutput.fromNative(this.context.avaxAssetID, nAvax, [cAddrBytes])],
    );
    const serExportTx = ava.utils.bufferToHex(exportTx.toBytes());

    console.log("Signing P-chain export transaction");
    const pAddrMaterialId = pAddr.substring(2);
    const exportTxSig = await this.client.apiClient.signSerializedAva(
      pAddrMaterialId,
      "P",
      serExportTx,
    );
    exportTx.addSignature(ava.utils.hexToBuffer(exportTxSig.data().signature));

    console.log("Submitting P-chain export transaction");
    const exportTxRes = await this.pvmapi.issueSignedTx(exportTx.getSignedTx());
    await this.#waitForPvmTxCommitted(exportTxRes.txID);

    // Generate import transaction on the C-chain (completes the transfer)
    const { utxos: fromPUtxos } = await this.evmapi.getUTXOs({
      sourceChain: "P",
      addresses: [cAddrBech32],
    });
    const importTx = ava.evm.newImportTxFromBaseFee(
      this.context,
      ava.utils.hexToBuffer(cAddr),
      [cAddrBytes],
      fromPUtxos,
      this.context.pBlockchainID,
      baseFee / BigInt(1e9),
    );
    const serImportTx = ava.utils.bufferToHex(importTx.toBytes());

    console.log("Signing C-chain import transaction");
    const importTxSig = await this.client.apiClient.signSerializedAva(cAddr, "C", serImportTx);
    importTx.addSignature(ava.utils.hexToBuffer(importTxSig.data().signature));

    console.log("Submitting C-chain import transaction");
    const importTxRes = await this.evmapi.issueSignedTx(importTx.getSignedTx());
    await this.#waitForEvmTxAccepted(importTxRes.txID);

    return {
      exportTxId: exportTxRes.txID,
      importTxId: importTxRes.txID,
    };
  }

  /**
   * Get an Avalanche address for a SECP key.
   *
   * @param {string} materialId The key
   * @return {Uint8Array} The address as a byte array
   */
  async #getAvaAddress(materialId: string): Promise<Uint8Array> {
    // Get the uncompressed public key
    const keys = await this.client.sessionKeys();
    const key = keys.find((k) => k.materialId === materialId)!;
    const pk = ava.utils.hexToBuffer(key.publicKey);
    // Compute compressed public key
    const head = (pk[pk.length - 1] & 1) === 0 ? 2 : 3;
    const cpk = new Uint8Array([head, ...pk.slice(1, 33)]);
    // Convert the public key to an address
    return ava.secp256k1.publicKeyBytesToAddress(cpk);
  }

  /**
   * Wait until a C-chain transaction has been accepted.
   *
   * @param {string} txId The transaction id
   */
  async #waitForEvmTxAccepted(txId: string) {
    let status;
    do {
      status = (await this.evmapi.getAtomicTxStatus(txId)).status;
      await delay(100);
    } while (status !== "Accepted");
  }

  /**
   * Wait until a P-chain transaction has been committed.
   *
   * @param {string} txId The transaction id
   */
  async #waitForPvmTxCommitted(txId: string) {
    let status;
    do {
      status = (await this.pvmapi.getTxStatus({ txID: txId })).status;
      await delay(100);
    } while (status !== "Committed");
  }
}

/** Main entry point */
async function main() {
  // get token/signer info and establish signer session.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();

  const client = await cs.CubeSignerClient.create(session);
  const context = await ava.Context.getContextFromURI(AVAX_PUBLIC_URL);
  const transferUtil = new TransferUtil(client, context);

  const txIdsCToP = await transferUtil.transferAvaxCtoP(
    C_CHAIN_ADDRESS,
    P_CHAIN_ADDRESS,
    BigInt(AMOUNT_C_TO_P * 1e9),
  );
  console.log(
    `Transfered ${AMOUNT_C_TO_P} to ${P_CHAIN_ADDRESS} with txIDs: ${txIdsCToP.exportTxId} and ${txIdsCToP.importTxId}`,
  );

  const txIdsPToC = await transferUtil.transferAvaxPtoC(
    P_CHAIN_ADDRESS,
    C_CHAIN_ADDRESS,
    BigInt(AMOUNT_P_TO_C * 1e9),
  );
  console.log(
    `Transfered ${AMOUNT_P_TO_C} to ${P_CHAIN_ADDRESS} with txIDs: ${txIdsPToC.exportTxId} and ${txIdsPToC.importTxId}`,
  );
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Returns the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
