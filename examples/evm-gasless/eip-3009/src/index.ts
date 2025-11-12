/**
 * EIP-3009 enables gasless transactions of ERC-20 tokens via EIP-712 typed
 * message signing specification. This example shows how CubeSigner wallet
 * can be used to send and sponsor an EIP-3009 transfer by invoking
 * `transferWithAuthorization` function on the ERC-20 contract.
 */
import type { Address, Chain, PublicClient } from "viem";
import {
  type CustomSource,
  http,
  createPublicClient,
  zeroAddress,
  getAddress,
  createWalletClient,
  parseUnits,
  toHex,
  isAddressEqual,
} from "viem";
import * as chains from "viem/chains";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";

import { CubeSignerSource } from "@cubist-labs/cubesigner-sdk-viem";
import { toAccount } from "viem/accounts";
import { randomBytes } from "node:crypto";
import assert from "node:assert";

import { erc20Abi } from "./erc20Abi";

/** Main entry point */
async function main() {
  const FROM_ADDRESS = getAddress(env("FROM_ADDRESS")!);
  const TO_ADDRESS = getAddress(env("TO_ADDRESS", zeroAddress)!);
  const FEE_PAYER_ADDRESS = getAddress(env("FEE_PAYER_ADDRESS")!);
  const RPC_PROVIDER = env("RPC_PROVIDER")!;
  // ERC-20 contract address with EIP-3009 support
  const TOKEN_ADDRESS = getAddress(env("TOKEN_ADDRESS")!);

  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location
  const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);

  if (isAddressEqual(FROM_ADDRESS, FEE_PAYER_ADDRESS)) {
    throw Error("FROM_ADDRESS and FEE_PAYER_ADDRESS must not be the same");
  }

  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultUserSessionManager();
  const client = await cs.CubeSignerClient.create(storage);
  const chain = await getChainFromRpc(RPC_PROVIDER);
  const sender = toAccount(new CubeSignerSource(FROM_ADDRESS, client) as CustomSource);
  const executor = toAccount(new CubeSignerSource(FEE_PAYER_ADDRESS, client) as CustomSource); // pays gas

  const pubClient = createPublicClient({ transport: http(RPC_PROVIDER) });

  const tokenDecimals = await readErc20Contract<number>(pubClient, TOKEN_ADDRESS, "decimals");
  const AMOUNT: bigint = parseUnits(env("AMOUNT")!, tokenDecimals);

  // fetch starting balances
  const startSenderEthBalance = await pubClient.getBalance({ address: FROM_ADDRESS });
  const startSenderErc20Balance = await readErc20Contract<bigint>(
    pubClient,
    TOKEN_ADDRESS,
    "balanceOf",
    [FROM_ADDRESS],
  );
  const startReceiverErc20Balance = await readErc20Contract<bigint>(
    pubClient,
    TOKEN_ADDRESS,
    "balanceOf",
    [TO_ADDRESS],
  );
  const startFeePayerEthBalance = await pubClient.getBalance({ address: FEE_PAYER_ADDRESS });

  console.log(`Sender starting balance (ERC20): ${startSenderErc20Balance}`);
  console.log(`Receiver starting balance (ERC20): ${startReceiverErc20Balance}`);
  console.log(`Fee payer starting balance (Wei): ${startFeePayerEthBalance}`);

  const walletClient = createWalletClient({
    account: executor,
    chain,
    transport: http(RPC_PROVIDER),
  });

  // Define parameters
  const value = AMOUNT; // the amount to transfer
  const validAfter = 0n; // valid since 0 epoch
  const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // valid for 1 hour from now
  const nonce = toHex(randomBytes(32)); // random nonce

  // get domain name and version from the contract
  const name = await readErc20Contract<string>(pubClient, TOKEN_ADDRESS, "name");
  const version = await readErc20Contract<string>(pubClient, TOKEN_ADDRESS, "version");
  console.log(`Detected Token: ${name}, Version: ${version}`);
  const domain = {
    name,
    version,
    chainId: chain.id,
    verifyingContract: TOKEN_ADDRESS,
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const message = {
    from: FROM_ADDRESS,
    to: TO_ADDRESS,
    value: String(value),
    validAfter: String(validAfter),
    validBefore: String(validBefore),
    nonce,
  };

  const signature = await sender.signTypedData({
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  // extract r, s, and v values from the signature
  const r = "0x" + signature.slice(2, 66);
  const s = "0x" + signature.slice(66, 130);
  const v = parseInt(signature.slice(130, 132), 16);

  // Submit transaction (executor pays gas)
  const hash = await walletClient.writeContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "transferWithAuthorization",
    args: [FROM_ADDRESS, TO_ADDRESS, value, validAfter, validBefore, nonce, v, r, s],
  });

  console.log("Submitted transaction:", hash);
  console.log(`Explorer link: ${getExplorerUrl(chain, { txHash: hash })}`);

  // Wait for confirmation
  const receipt = await pubClient.waitForTransactionReceipt({ hash });

  if (receipt.status === "success") {
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
  } else {
    console.error(`Transaction failed`, receipt);
  }

  // fetch ending balances
  const endSenderEthBalance = await pubClient.getBalance({ address: FROM_ADDRESS });
  const endSenderErc20Balance = await readErc20Contract<bigint>(
    pubClient,
    TOKEN_ADDRESS,
    "balanceOf",
    [FROM_ADDRESS],
  );
  const endReceiverErc20Balance = await readErc20Contract<bigint>(
    pubClient,
    TOKEN_ADDRESS,
    "balanceOf",
    [TO_ADDRESS],
  );
  const endFeePayerEthBalance = await pubClient.getBalance({ address: FEE_PAYER_ADDRESS });

  console.log(`Sender ending balance (ERC20): ${endSenderErc20Balance}`);
  console.log(`Receiver ending balance (ERC20): ${endReceiverErc20Balance}`);
  console.log(`Fee payer ending balance (Wei): ${endFeePayerEthBalance}`);

  // assert that transfer is as expected
  assert(endSenderEthBalance === startSenderEthBalance); // sender did not pay fee
  assert(startFeePayerEthBalance > endFeePayerEthBalance); // fee payer did pay fee
  assert(startSenderErc20Balance === endSenderErc20Balance + AMOUNT); // sender lost the transfer amount
  assert(startReceiverErc20Balance + AMOUNT === endReceiverErc20Balance); // receiver gained the transfer amount
  console.log("Balances OK!");
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
function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}

/**
 * Generic ERC-20 contract reader utility.
 *
 * @param pubClient Viem {@link PublicClient} connected to an RPC endpoint.
 * @param tokenAddress The ERC-20 contract address.
 * @param functionName The ERC-20 view/pure function name.
 * @param args Optional arguments for the function.
 * @returns The decoded return value, typed as `T`.
 */
async function readErc20Contract<T>(
  pubClient: PublicClient,
  tokenAddress: Address,
  functionName: string,
  args?: readonly unknown[],
): Promise<T> {
  return (await pubClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName,
    args,
  })) as T;
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
function getExplorerUrl(
  chain: Chain,
  item?: { address: string } | { txHash: string },
): string | undefined {
  const baseUrl = chain?.blockExplorers?.default?.url;
  if (baseUrl === undefined) return undefined;
  if (item === undefined) return baseUrl;
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
async function getChainFromRpc(rpcUrl: string): Promise<Chain> {
  const client = createPublicClient({ transport: http(rpcUrl) });
  const chainId = await client.getChainId();

  // Match it to a viem chain constant
  const chain = Object.values(chains).find(
    (c) => typeof c === "object" && "id" in c && c.id === chainId,
  );

  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);
  return chain;
}
