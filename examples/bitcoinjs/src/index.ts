import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as bc from "bitcoinjs-lib";
import axios from "axios";
import type { Utxo} from "./util";
import { estimateFee, getFeeRate, getUtxos, addrNetwork, BtcSigner } from "./util";

// pull env variables.
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const FROM_ADDRESS: string = env("FROM_ADDRESS")!.trim();
const TO_ADDRESS: string = env("TO_ADDRESS")!.trim();
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const AMOUNT = Math.round(parseFloat(env("TRANSFER_AMOUNT_SATS", "200")!.trim()));

/**
 * main function. Executes a bitcoin transaction using CubeSigner and bitcoinjs-lib.
 */
async function main() {
  // get token/signer info and establish signer session/network.
  const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();

  const client = await cs.CubeSignerClient.create(session);

  // get cubesigner key and validate its existence.
  const fromKey = (await client.sessionKeys()).find((key) => key.materialId === FROM_ADDRESS);
  if (!fromKey) {
    throw new Error(`Current signer session does not have access to key '${FROM_ADDRESS}'`);
  }

  const network = addrNetwork(fromKey.materialId);
  const toAddrNet = addrNetwork(TO_ADDRESS);

  // cannot send cross network
  if (toAddrNet !== network) {
    throw new Error(`Cannot transfer funds cross net (from: ${network}, to: ${toAddrNet})`);
  }

  const baseUrl =
    network === bc.networks.bitcoin
      ? "https://blockstream.info"
      : "https://blockstream.info/testnet";

  // start building transaction
  const psbt = new bc.Psbt({ network: network });
  psbt.setVersion(2);
  psbt.setLocktime(0);

  const feeRate = await getFeeRate(baseUrl);

  // find uxtos
  let totalSatoshisAvail = 0;
  const witnesses: Utxo[] = [];
  const utxoReceiverScript = bc.address.toOutputScript(fromKey.materialId, network);
  const utxosDesc = await getUtxos(fromKey.materialId, baseUrl);
  // reverse for the sake of the test, to maximize the number of inputs per transaction
  // TODO acadams - it might be worth including a param in getUtxos for toggling the sort.
  for (const utxo of utxosDesc.reverse()) {
    // add uxto as input
    witnesses.push(utxo);
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: utxoReceiverScript,
      },
    });
    // break if we have enough for the transfer
    totalSatoshisAvail += utxo.value;
    const currentFee = await estimateFee(psbt.inputCount, feeRate);
    console.log(`Found unspent ${utxo.value} (${utxo.txid}:${utxo.vout})`);
    if (totalSatoshisAvail >= AMOUNT + currentFee) {
      break;
    }
  }

  // bail if not enough funds available
  const fee = await estimateFee(psbt.inputCount, feeRate);
  if (totalSatoshisAvail < AMOUNT + fee) {
    throw new Error(
      `Insufficient funds! Available: ${totalSatoshisAvail}, needed: ${AMOUNT} + ${fee}`,
    );
  }

  // add output for the target recipient
  console.log(`Adding output ${TO_ADDRESS} -> ${AMOUNT}`);
  psbt.addOutput({
    address: TO_ADDRESS,
    value: AMOUNT,
  });

  // the remainder goes back to the sender
  const satoshisToReturn = totalSatoshisAvail - AMOUNT - fee;
  console.log(`Adding output ${fromKey.materialId} -> ${satoshisToReturn}`);
  psbt.addOutput({
    address: fromKey.materialId,
    value: satoshisToReturn,
  });

  // sign all inputs
  console.log(
    `Signing transfer to ${TO_ADDRESS}: send ${AMOUNT}, fee ${fee}, returning ${satoshisToReturn}`,
  );
  
  for (let i = 0; i < psbt.txInputs.length; i++) {
    const signer = new BtcSigner(fromKey, psbt, i, witnesses, network);
    console.log(`Signing input ${i + 1} of ${psbt.inputCount}`);
    await psbt.signInputAsync(i, signer);
  }

  console.log("Calling finalizeAllInputs");
  psbt.finalizeAllInputs();

  // serialize transaction to hex
  const tx = psbt.extractTransaction().toHex();

  // post the transaction
  console.log(`Posting: ${tx}`);
  const resp = await axios.post(`${baseUrl}/api/tx`, tx);

  // done
  const conf = resp.data.toString();
  console.log(`Confirmation: ${conf}`);
}

/**
 * Returns the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
function env(name: string, fallback?: string | null): string | null {
  console.log(`current env check: ${name}`);
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
