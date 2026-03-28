/**
 * A quickstart example of how to use CubeSigner, using ZeroDev as a paymaster.
 * Based on https://docs.zerodev.app/sdk/getting-started/quickstart.
 * It initializes necessary CubeSigner and ZeroDev clients, then signs a
 * zero-value Sepolia UserOperation with a new CubeSigner key and submits it to
 * the chain. ZeroDev sponsors the gas fee.
 */
import { AllowEip191Signing, CubeSignerClient, Secp256k1 } from "@cubist-labs/cubesigner-sdk";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { CubeSignerSource } from "@cubist-labs/cubesigner-sdk-viem";
import { type CustomSource, createPublicClient, http, zeroAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { defaultSignerSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { toAccount } from "viem/accounts";

/**
 * An optional EVM address in your org.
 * If defined, the key must have the AllowEip191Signing policy, and your session must have the `manage:key:get` scope.
 * If not provided, a new key will be generated and deleted.
 */
const FROM_ADDRESS = process.env["FROM_ADDRESS"];

/**
 * An optional CUBE_SIGNER_TOKEN to create a CubeSigner session from.
 * Defaults to the default management session on disk if `CUBE_SIGNER_TOKEN` is
 * not defined in the terminal environment.
 *
 * This session must have the `sign:evm:eip191` scope.
 * If FROM_ADDRESS isn't provided, it must have the `manage:key:create`, and `manage:key:delete` scope.
 *
 * Create this token like
 * `export CUBE_SIGNER_TOKEN=$(cs login ... --scope 'sign:evm:eip191' --scope ... --export --format base64)`
 */
const CUBE_SIGNER_TOKEN = process.env["CUBE_SIGNER_TOKEN"];

/** Main entry point */
async function main() {
  // CubeSigner Initalization

  // This client must be able to sign EIP191 data (sign:evm:eip191) and either get keys (manage:key:get) or create them (manage:key:create, manage:key:delete).
  const storage = CUBE_SIGNER_TOKEN ?? defaultSignerSessionManager();
  const client = await CubeSignerClient.create(storage);

  // Create a new EVM key with CubeSigner and allow it to sign EIP-191 data
  const key =
    FROM_ADDRESS ??
    (await client.org().createKey(Secp256k1.Evm, undefined, { policy: [AllowEip191Signing] }));

  console.log(`Using key ${typeof key === "string" ? key : key.id}`);

  // Initalize CubeSigner Viem plugin
  const wallet = new CubeSignerSource(key, client);
  const signer = toAccount(wallet as CustomSource);

  // ZeroDev Settings

  // The chain this script will execute on (Base Sepolia).
  const chain = baseSepolia;

  // Fixing our ZeroDev kernel and entry point versions to the current standard
  const entryPoint = getEntryPoint("0.7");
  const kernelVersion = KERNEL_V3_1;

  // A public ZERODEV_API key provided in their quickstart example - https://docs.zerodev.app/sdk/getting-started/quickstart
  const ZERODEV_API_KEY = "61016d2a-e0df-4350-929c-d5f2110700d1";
  const ZERODEV_RPC = `https://rpc.zerodev.app/api/v3/${ZERODEV_API_KEY}/chain/${chain.id}`;

  // ZeroDev Initialization

  // Construct a public client - this is a Viem interface to public JSON-RPC API calls.
  const publicClient = createPublicClient({
    // Use your own RPC provider in production (e.g., Infura/Alchemy).
    transport: http(ZERODEV_RPC),
    chain,
  });

  // Construct a validator - Kernel accounts handle validation through a smart contract known as a "validator".
  // This sets our validator to one for ECDSA keys.
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer,
    entryPoint,
    kernelVersion,
  });

  // Construct a Kernel account - Kernel is the smart contract account that ZeroDev builds on.
  const account = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator,
    },
    entryPoint,
    kernelVersion,
  });

  // Create a paymaster - this sets up ZeroDev as the one paying the gas for the submitted transaction.
  // For production, you will need to configure your ZeroDev account and provide a credit card or buy gas credits.
  const zerodevPaymaster = createZeroDevPaymasterClient({
    chain,
    transport: http(ZERODEV_RPC),
  });

  // Construct a Kernel account client - This connects the Kernel smart account with paymaster and transaction bundling infrastructure.
  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(ZERODEV_RPC),
    // Required - the public client
    client: publicClient,
    paymaster: {
      getPaymasterData(userOperation) {
        return zerodevPaymaster.sponsorUserOperation({ userOperation });
      },
    },
  });

  // Gasless Transactions (Gas Sponsorship) with ZeroDev

  const accountAddress = kernelClient.account.address;
  console.log("My account:", accountAddress);

  // Send a gasless transaction via a UserOp - Defined in EIP-4337, UserOperations describe the actions a user wants their
  // Smart Contract Account to do. The UserOperation is sent to our validator smart contract, which validates and
  // performs the given actions.
  const userOpHash = await kernelClient.sendUserOperation({
    callData: await kernelClient.account.encodeCalls([
      {
        to: zeroAddress,
        value: 0n,
        data: "0x",
      },
      // This is also a batched transaction - https://docs.zerodev.app/smart-wallet/batching-transactions
      // Both of these transactions are rolled into one, and if any transaction reverts, the entire batch reverts.
      {
        to: zeroAddress,
        value: 0n,
        data: "0x",
      },
    ]),
  });

  console.log("UserOp hash:", userOpHash);
  console.log("Waiting for UserOp to complete...");

  await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
    timeout: 1000 * 15,
  });

  console.log("UserOp completed: https://base-sepolia.blockscout.com/op/" + userOpHash);

  // Cleanup
  if (typeof key !== "string") {
    // We created this key within this script, so we will now attempt to delete it.
    try {
      await key.delete();
    } catch (error) {
      throw new Error(`Unable to delete ${key.id}`, { cause: error });
    }
  }
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
