import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Transaction,
  type Message,
} from "@solana/web3.js";
import assert from "assert";

const TEST_POLICY: string = env("TEST_POLICY", "false")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const FROM_ADDRESS: string = env("FROM_ADDRESS", "")!;

const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

/** Main entry point */
async function main() {
  // Convert the `TO_ADDRESS` to a public key.
  const toPubkey = new PublicKey(TO_ADDRESS);

  // Next, we create a mock `Transaction` containing just the instructions we need.
  // For any address that we don't need (the `from` address of the transfer instruction,
  // and the feePayer), we use `PublicKey.unique()`. This can be helpful if manually
  // inspecting the compiled transaction as well.
  const tx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 300,
    }),
    SystemProgram.transfer({
      fromPubkey: PublicKey.unique(), // We don't care about this field, but we need to set it.
      toPubkey: toPubkey,
      lamports: 50_000,
    }),
  );

  // The `recentBlockhash` and `feePayer` fields are not relevant to the policy,
  // but we need to populate them before we can compile the transaction.
  tx.recentBlockhash = PublicKey.unique().toBase58();
  tx.feePayer = PublicKey.unique();

  // The `SolanaInstructionPolicy` is defined using compiled instructions.
  // So, next, we compile the transaction.
  const message = tx.compileMessage();

  // Use the helper `getInstructionInformation` function to extract all the potentially
  // relevant fields for each instruction.
  const setComputeInfo = getInstructionInformation(message, 0);
  const transferInfo = getInstructionInformation(message, 1);

  // Finally, we can use the information above to build our policy.
  // Notice that since we require *starting* with a `setComputeUnitLimit` call,
  // we must set the index for that instruction.
  const policy: cs.SolanaInstructionPolicy = {
    SolanaInstructionPolicy: {
      required: [
        {
          program_id: setComputeInfo.programId,
          data: setComputeInfo.data,
          index: 0,
        },
        {
          program_id: transferInfo.programId,
          data: transferInfo.data,
          accounts: [
            {
              pubkey: transferInfo.accounts[1],
              index: 1,
            },
          ],
        },
      ],
    },
  };

  // Print the policy to the terminal so we can inspect it.
  console.log(JSON.stringify(policy, undefined, 2));

  // If TEST_POLICY is 'true', add the policy to the FROM_ADDRESS key
  // and try to sign one failing and one successful transaction.
  if (TEST_POLICY === "true") {
    console.log(`Testing the policy by assigning it to '${FROM_ADDRESS}'.`);

    if (FROM_ADDRESS === "") {
      throw new Error("Missing FROM_ADDRESS environment variable needed to test the policy.");
    }
    const fromPubkey = new PublicKey(FROM_ADDRESS);

    // First, set the policy on the FROM_ADDRESS key.
    await setPolicy(policy, FROM_ADDRESS);

    // Next, we define a transaction that does not satisfy the policy,
    // Specifically by not having a `setComputeUnitLimit'.
    const badTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: 50_000,
      }),
    );
    // We won't actually submit this transaction to the chain. So, similar to above,
    // we just need to set the recentBlockhash and feePayer to some valid value.
    badTx.recentBlockhash = tx.recentBlockhash;
    badTx.feePayer = fromPubkey;

    // Try to sign the bad transaction. It should fail with a policy error.
    try {
      await signTx(badTx, FROM_ADDRESS);
    } catch (error) {
      if (typeof error === "object" && error !== null && "errorCode" in error) {
        assert.equal(error.errorCode, "SolanaInstructionMismatch");
        console.log("Signing an invalid transaction failed with the expected policy error.");
      } else {
        throw error;
      }
    }

    // Next, define a transaction satisfying the policy.
    const goodTx = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 300,
      }),
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: 50_000,
      }),
    );
    // Again, we need to set the recentBlockhash and feePayer to some valid value.
    goodTx.recentBlockhash = tx.recentBlockhash;
    goodTx.feePayer = fromPubkey;

    // Signing this transaction should succeed.
    const signature = await signTx(goodTx, FROM_ADDRESS);
    assert(signature.data().signature.length > 0);
    console.log("Signing a valid transaction succeeded.");
  }
}

/**
 * Helper function for signing the given transaction.
 * @param {Transaction} tx the transaction to sign.
 * @param {string} material_id the material id of the key to sign the message with.
 * @return {cs.CubeSignerResponse<cs.SolanaSignResponse>} the sign response.
 */
async function signTx(
  tx: Transaction,
  material_id: string,
): Promise<cs.CubeSignerResponse<cs.SolanaSignResponse>> {
  console.log(`Attempting to sign transaction with key '${material_id}':`);
  console.log(tx);

  // Create a CubeSigner client with either the given token,
  // or the default signer session.
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
  const client = await cs.CubeSignerClient.create(storage);

  return await client.apiClient.signSolana(material_id, {
    message_base64: tx.serializeMessage().toString("base64"),
  });
}

/**
 * Helper function for adding the given policy to the key with the given material id.
 * It appends the policy to the key, and does not overwrite previous existing policies.
 * @param {cs.KeyDenyPolicy} policy the policy to add to the key.
 * @param {string} material_id the material id of the key to add the policy to.
 */
async function setPolicy(policy: cs.KeyDenyPolicy, material_id: string) {
  console.log(`Appending policy to '${material_id}':`);
  console.log(JSON.stringify(policy));

  // Create a CubeSigner client using the default management session.
  const storage = csFs.defaultManagementSessionManager();
  const client = await cs.CubeSignerClient.create(storage);

  // Get the key id for the given material_id
  const key = await client.org().getKeyByMaterialId(cs.Ed25519.Solana, material_id);
  await key.appendPolicy([policy]);
}

/**
 * Helper function for collecting and formatting information used in creating a
 * SolanaInstructionPolicy.
 * @param {Message} message the compiled Solana transaction.
 * @param {number} instruction_idx the index of the instruction to get the information for.
 * @return {object} an object containing the `programId` of the instruction's program,
 * the `data` for the instruction, and the `accounts` used by the instruction.
 */
function getInstructionInformation(message: Message, instruction_idx: number) {
  // First, get the particular instruction
  const instruction = message.compiledInstructions[instruction_idx];

  // Convert the instruction's `programId` to base58.
  const programId = message.accountKeys[instruction.programIdIndex].toBase58();

  // Similarly, all accounts used in the instruction should be encoded as base58.
  const accounts = instruction.accountKeyIndexes.map((accIdx) => {
    return message.accountKeys[accIdx].toBase58();
  });

  // The `data` field, however, should be in hex and start with `0x`.
  const data = "0x" + Buffer.from(instruction.data).toString("hex");

  return {
    programId,
    data,
    accounts,
  };
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
