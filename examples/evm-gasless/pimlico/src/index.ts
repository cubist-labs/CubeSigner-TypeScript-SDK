/**
 * A quickstart example of how to use CubeSigner, using pimlico.io as a paymaster.
 * Based on https://docs.pimlico.io/guides/eip7702/demo.
 * It initializes necessary CubeSigner and Pimlico clients, then signs a
 * zero-value Sepolia Transaction with a CubeSigner key and submits it to
 * the chain. Pimlico sponsors the gas fee.
 */

import { createPimlicoClient } from "permissionless/clients/pimlico";
import { toSimpleSmartAccount } from "permissionless/accounts";
import type { Chain } from "viem";
import { 
  type CustomSource,
  http, 
  createPublicClient,
  zeroAddress, 
  getAddress
  } from "viem";
import * as chains from "viem/chains";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { CubeSignerSource } from "@cubist-labs/cubesigner-sdk-viem";
import { entryPoint07Address } from "viem/account-abstraction";
import { toAccount } from "viem/accounts";
import { createSmartAccountClient } from "permissionless";

/** Main entry point */
async function main(){
  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location
  const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
  // create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultManagementSessionManager();
  const client = await cs.CubeSignerClient.create(storage);

  const FROM_ADDRESS: string | cs.Key = process.env["FROM_ADDRESS"] ?? 
    await client.org().createKey(cs.Secp256k1.Evm, undefined, { policy: [cs.AllowEip191Signing] });
  const TO_ADDRESS = getAddress(env("TO_ADDRESS", zeroAddress)!);
  const RPC_PROVIDER: string = env("RPC_PROVIDER")!;
  const PIMLICO_API_KEY = env("PIMLICO_API_KEY")!;

  const chain = await getChainFromRpc(RPC_PROVIDER);

  // Construct a public client
  const publicClient = createPublicClient({
    chain,
    transport: http(RPC_PROVIDER),
  });

  const pimlicoUrl = `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${PIMLICO_API_KEY}`

  // Pimlico paymaster client
  const pimlicoClient = createPimlicoClient({
    transport: http(pimlicoUrl),
    chain,
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7",
    },
  })

  // Create a simple smart account with CubeSigner account as owner
  const simpleSmartAccount = await toSimpleSmartAccount({
    owner: toAccount(new CubeSignerSource(FROM_ADDRESS, client) as CustomSource),
    client: publicClient,
    entryPoint: {
      address: entryPoint07Address,
      version: "0.7"
    },
  })

  // Finally create a smart account client to handle user operations
  const smartAccountClient = createSmartAccountClient({
    account: simpleSmartAccount,
    chain,
    bundlerTransport: http(pimlicoUrl),
    // Pimilco handles gas fees
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast
      },
    },
  })

  console.log(`Account address: ${smartAccountClient.account.address}`);
  // Sanity check: retrieve the deployed bytecode at address
  const code = await publicClient.getCode({ address: smartAccountClient.account.address });
  console.log("Deployed?", code !== "0x");

  // Send gasless transaction and wait for receipt
  const txHash = await smartAccountClient.sendTransaction({
    to: TO_ADDRESS,
    value: 0n,
  })
  console.log(`User operation included: ${getExplorerUrl(chain, {txHash})}`)

  // You can also use the sendTransaction method to send multiple transactions in a single batch like so:
  console.log("Sending multiple transactions in a single batch...")
  const batchedTxHash = await smartAccountClient.sendTransaction({
    calls: [
        {
            to: TO_ADDRESS,
            value: 0n,
            data: "0x",
        },
        {
            to: TO_ADDRESS,
            value: 0n,
            data: "0x",
        }
    ]
  })
  console.log(`Batched user operations included: ${getExplorerUrl(chain, {txHash: batchedTxHash})}`)

  // Cleanup
  if (typeof FROM_ADDRESS !== "string") {
    // We created this key within this script, so we will now attempt to delete it.
    try {
      await FROM_ADDRESS.delete();
    } catch (error) {
      throw new Error(`Unable to delete ${FROM_ADDRESS.id}, cause: ${error}`);
    }
  }
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback The optional fallback value.
 * @returns The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
    const val = process.env[name] ?? fallback;
    if (val === undefined) {
      throw new Error(`Missing environment variable ${name}`);
    }
    return val;
  }

/**
 * Returns the block explorer URL for a given chain.
 *
 * If an address is provided, this returns a direct link to that address
 * on the chain’s default block explorer (e.g., Etherscan, Arbiscan, etc.).
 * Otherwise, it returns the base URL of the explorer.
 *
 * @param chain The `Chain` object (from `viem/chains`) containing explorer metadata.
 * @param item Optional Ethereum address or transaction hash to link to on the explorer.
 * @returns The explorer URL as a string, or `undefined` if the chain does not define a default explorer.
 */
export function getExplorerUrl(chain: Chain, item?: {address: string} | {txHash: string}): string | undefined {
  const baseUrl = chain?.blockExplorers?.default?.url;
  if (!baseUrl) return undefined;
  if (!item) return baseUrl;
  if ("address" in item) return `${baseUrl}/address/${item.address}`;
  if ("txHash" in item) return `${baseUrl}/tx/${item.txHash}`;
  return baseUrl;
}


/**
 * Retrieves the `viem` {@link Chain} definition for a given RPC URL.
 *
 * This function connects to the provided RPC endpoint, queries its `chainId`
 * via the `eth_chainId` JSON-RPC method, and attempts to match it against one
 * of the built-in chains exported from `viem/chains`.
 *
 * @param rpcUrl The RPC endpoint URL to query.
 * @returns A Promise that resolves to the matching {@link Chain} constant.
 *
 * @throws If the RPC endpoint responds with an unknown or unsupported chain ID.
 */
export async function getChainFromRpc(rpcUrl: string): Promise<Chain> {
  const client = createPublicClient({ transport: http(rpcUrl) });
  const chainId = await client.getChainId();

  // Match it to a viem chain constant
  const chain = Object.values(chains).find(
    (c) => typeof c === "object" && "id" in c && c.id === chainId
  );

  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);
  return chain;
}