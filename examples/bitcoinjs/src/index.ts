import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as bc from "bitcoinjs-lib";
import axios from "axios";
import type { Utxo } from "./util";
import {
  estimateFee,
  estimateOutputFee,
  getFeeRate,
  getUtxos,
  addrNetwork,
  BtcSigner,
  VBYTES_PER_INPUT,
} from "./util";

// pull env variables.
import "dotenv/config";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!.trim();
const TO_ADDRESS: string = env("TO_ADDRESS")!.trim();
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */); // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const AMOUNT = Math.round(parseFloat(env("TRANSFER_AMOUNT_SATS", "200")!.trim()));
const TESTNET = env("TESTNET", "testnet"); // can use "testnet" or "signet"
const DUST_LIMIT = 330; // conservative dust limit for segwit

// DIVIDE_CHANGE_OUTPUT is useful when running this script in CI and other
// automated environments: it ensures that the FROM_ADDRESS has many available
// UTXOs so that runs are not bottlenecked by transaction confirmation.
const DIVIDE_CHANGE_OUTPUT = env("DIVIDE_CHANGE_OUTPUT", "false")!.trim().toLowerCase() === "true";
// multiple of dust limit at which we divide change outputs
const DIVIDE_CHANGE_RELATIVE = Math.round(parseFloat(env("DIVIDE_CHANGE_THRESH", "50")!.trim()));
const DIVIDE_CHANGE_THRESH = DIVIDE_CHANGE_RELATIVE * DUST_LIMIT;

// Lowest fee rate a node will relay, in sats per vbyte.
const MIN_RELAY_FEE_RATE = 1;

// Upper bound on the fee rate we're willing to pay, in sats per vbyte; 0 means
// "no cap". Test networks sometimes report wildly high fee estimates (signet
// currently asks ~23 sat/vbyte for near-empty blocks), which is enough to make
// small UTXOs cost more to spend than they are worth.
const MAX_FEE_RATE = parseFloat(env("MAX_FEE_RATE", "0")!.trim());

// CONSOLIDATE_MAX_INPUTS lets a run mop up extra UTXOs it doesn't need: once the
// transfer amount is covered, keep adding inputs that pay for themselves until the
// transaction has this many. The surplus comes back as change, so a fragmented
// address is folded back into a few large UTXOs over successive runs. 0 disables it.
const CONSOLIDATE_MAX_INPUTS = Math.round(parseFloat(env("CONSOLIDATE_MAX_INPUTS", "0")!.trim()));

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
      : `https://blockstream.info/${TESTNET}`;

  // start building transaction
  const psbt = new bc.Psbt({ network: network });
  psbt.setVersion(2);
  psbt.setLocktime(0);

  const estimatedFeeRate = await getFeeRate(baseUrl, "14");
  const feeRate = Math.max(
    MIN_RELAY_FEE_RATE,
    MAX_FEE_RATE > 0 ? Math.min(estimatedFeeRate, MAX_FEE_RATE) : estimatedFeeRate,
  );
  if (feeRate !== estimatedFeeRate) {
    console.log(`Clamping fee rate ${estimatedFeeRate} -> ${feeRate} sat/vbyte`);
  }

  // find utxos
  let totalSatoshisAvail = 0;
  let fee = 0;
  const witnesses: Utxo[] = [];
  const utxoReceiverScript = bc.address.toOutputScript(fromKey.materialId, network);
  const utxosDesc = await getUtxos(fromKey.materialId, baseUrl);

  // Every input adds ~VBYTES_PER_INPUT vbytes to the transaction, so a UTXO worth
  // less than that is uneconomical: spending it costs more than it brings in.
  // Skipping those is what keeps a fragmented address spendable. Including them
  // doesn't just waste money, it can never succeed -- each one raises the fee by
  // more than it raises the balance, so the loop below would consume every UTXO
  // the address has and still come up short.
  const inputCost = Math.ceil(VBYTES_PER_INPUT * feeRate);

  // Consolidation only targets utxos this small. They are the ones at risk of
  // becoming unspendable if the fee rate rises, so they're worth folding into the
  // change output while we're building a transaction anyway. Larger utxos are left
  // alone on purpose: sweeping those would tie the whole balance up in one
  // unconfirmed transaction, leaving nothing for the next run to spend.
  const consolidateBelow = inputCost * 10;
  let skippedUneconomical = 0;
  let consolidated = 0;

  // Consume the largest utxos first, so that we cover the transfer amount with as
  // few inputs as possible.
  for (const utxo of utxosDesc) {
    if (utxo.value <= inputCost) {
      skippedUneconomical++;
      continue;
    }
    if (totalSatoshisAvail >= AMOUNT + fee) {
      // the transfer is covered; anything further is consolidation
      if (psbt.inputCount >= CONSOLIDATE_MAX_INPUTS) {
        break;
      }
      if (utxo.value >= consolidateBelow) {
        continue; // already a healthy utxo, no point folding it into another one
      }
      consolidated++;
    }
    // add utxo as input
    witnesses.push(utxo);
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: utxoReceiverScript,
      },
    });
    totalSatoshisAvail += utxo.value;
    fee = estimateFee(psbt.inputCount, feeRate);
    console.log(`Found unspent ${utxo.value} (${utxo.txid}:${utxo.vout})`);
  }

  if (skippedUneconomical > 0) {
    console.log(
      `Skipped ${skippedUneconomical} utxo(s) worth <= ${inputCost} sats, ` +
        `the cost of spending one input at ${feeRate} sat/vbyte`,
    );
  }
  if (consolidated > 0) {
    console.log(`Consolidating ${consolidated} extra utxo(s) worth < ${consolidateBelow} sats`);
  }

  // bail if not enough funds available
  if (totalSatoshisAvail < AMOUNT + fee) {
    throw new Error(
      `Insufficient funds! Available: ${totalSatoshisAvail}, needed: ${AMOUNT} + ${fee}` +
        (skippedUneconomical > 0
          ? ` (ignoring ${skippedUneconomical} utxo(s) too small to spend at ${feeRate} sat/vbyte)`
          : ""),
    );
  }

  // Create one or two change outputs if we have sufficient funds.
  let satoshisToReturn = totalSatoshisAvail - AMOUNT - fee;
  if (satoshisToReturn >= DUST_LIMIT) {
    const oneOutputFee = estimateOutputFee(feeRate);
    const returnValueIfSplit = satoshisToReturn - oneOutputFee;
    if (DIVIDE_CHANGE_OUTPUT && returnValueIfSplit >= DIVIDE_CHANGE_THRESH) {
      // split change into two smaller UTXOs when DIVIDE_CHANGE_OUTPUT is
      // enabled and we're above threshold, accounting for additional fee.
      fee += oneOutputFee;
      satoshisToReturn = returnValueIfSplit;
      const firstChangeOutput = Math.ceil(satoshisToReturn / 2);
      const secondChangeOutput = satoshisToReturn - firstChangeOutput;
      console.log(
        `Adding outputs ${fromKey.materialId}: ${firstChangeOutput}, ${secondChangeOutput}`,
      );
      psbt.addOutput({
        address: fromKey.materialId,
        value: firstChangeOutput,
      });
      psbt.addOutput({
        address: fromKey.materialId,
        value: secondChangeOutput,
      });
    } else {
      // Enough change to send one output without creating dust, but either we are
      // below the split threshold or splitting is disabled.
      console.log(`Adding output ${fromKey.materialId}: ${satoshisToReturn}`);
      psbt.addOutput({
        address: fromKey.materialId,
        value: satoshisToReturn,
      });
    }
  } else {
    // Not enough change. Just give the dust to the recipient.
    console.log("Not adding change output to avoid dust");
    satoshisToReturn = 0;
  }

  // add output for the target recipient
  const amountToSend = totalSatoshisAvail - satoshisToReturn - fee;
  console.log(`Adding output ${TO_ADDRESS} -> ${AMOUNT}`);
  psbt.addOutput({
    address: TO_ADDRESS,
    value: amountToSend,
  });

  console.log(
    `Signing transfer to ${TO_ADDRESS}: send ${amountToSend}, fee ${fee}, returning ${satoshisToReturn}`,
  );

  // Option 1: use the PSBT signing endpoint.
  //
  // This signs all inputs spendable by the key specified in the request.
  // You can send the same PSBT to be signed multiple times with different
  // keys. Here, all inputs are controlled by the same key, so we just send
  // one PSBT signing request.
  const psbtSignRequest: cs.PsbtSignRequest = {
    psbt: psbt.toHex(),
    sign_all_scripts: false, // almost never required, and certainly not for key spends
  };
  const psbtSignResponse = await fromKey.signPsbt(psbtSignRequest);
  const signedPsbt = bc.Psbt.fromHex(psbtSignResponse.data().psbt);
  console.log("Calling finalizeAllInputs on PSBT signed with the PSBT endpoint");
  signedPsbt.finalizeAllInputs();
  const txFromPsbt = signedPsbt.extractTransaction().toHex();
  console.log(`Result of PSBT signing endpoint: ${txFromPsbt}`);

  // Option 2: Sign inputs one at a time.
  //
  // In this approach, we make a separate request to CubeSigner for each input.
  for (let i = 0; i < psbt.txInputs.length; i++) {
    const signer = new BtcSigner(fromKey, psbt, i, witnesses, network);
    console.log(`Signing input ${i + 1} of ${psbt.inputCount}`);
    await psbt.signInputAsync(i, signer);
  }

  console.log("Calling finalizeAllInputs on PSBT signed input-by-input");
  psbt.finalizeAllInputs();

  // serialize transaction to hex
  const tx = psbt.extractTransaction().toHex();

  // post the transaction
  console.log(`Posting transaction: ${tx}`);
  const resp = await axios.post(`${baseUrl}/api/tx`, tx);

  // done
  const conf = resp.data.toString();
  console.log(`Confirmation: ${conf}`);
}

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback The optional fallback value.
 * @returns The value of the environment variable, the fallback, or undefined.
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
