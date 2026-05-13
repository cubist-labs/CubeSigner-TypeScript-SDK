import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { CubeSignerSource } from "@cubist-labs/cubesigner-sdk-viem";

import { createClient, formatUnits, http, isAddress, parseUnits, publicActions, walletActions } from "viem";
import { type CustomSource, toAccount } from "viem/accounts";
import { tempoModerato } from "viem/chains";
import { tempoActions, type TempoAddress } from "viem/tempo";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS")!;
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://rpc.moderato.tempo.xyz")!;

// standard tokens:
// - pathUSD  0x20c0000000000000000000000000000000000000
// - AlphaUSD 0x20c0000000000000000000000000000000000001
// - BetaUSD  0x20c0000000000000000000000000000000000002
// - ThetaUSD 0x20c0000000000000000000000000000000000003
// default to AlphaUSD
const TOKEN = env("TOKEN", "0x20c0000000000000000000000000000000000001")! as TempoAddress.Address;

// Amount in the token currency
const AMOUNT: string = env("AMOUNT", "100")!;

// CubeSigner session
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);

/** Main entry point */
async function main() {
  if (!isAddress(FROM_ADDRESS)) {
    throw new Error(`Expected '${FROM_ADDRESS}' to start with '0x'`);
  }
  if (!isAddress(TO_ADDRESS)) {
    throw new Error(`Expected '${TO_ADDRESS}' to start with '0x'`);
  }
  if (!isAddress(TOKEN)) {
    throw new Error(`Expected '${TOKEN}' to start with '0x'`);
  }

  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultUserSessionManager();
  const client = await cs.CubeSignerClient.create(storage);
  const key = await client.org().getKeyByMaterialId(cs.Secp256k1.Evm, FROM_ADDRESS);

  const account = toAccount(new CubeSignerSource(key, client) as CustomSource);
  const walletClient = createClient({
    account,
    chain: tempoModerato.extend({
      feeToken: TOKEN,
    }),
    transport: http(RPC_PROVIDER),
  })
    .extend(publicActions)
    .extend(walletActions)
    .extend(tempoActions());

  console.log("Fetching the token metadata");
  const tokenMetadata = await walletClient.token.getMetadata({
    token: TOKEN,
  });

  const fmt = (balance: bigint) => formatUnits(balance, tokenMetadata.decimals);

  const balance = await walletClient.token.getBalance({ token: TOKEN });
  console.log(`Current balance: ${fmt(balance)} ${tokenMetadata.symbol}`);

  console.log(`Sending ${AMOUNT} ${tokenMetadata.symbol} from ${FROM_ADDRESS} to ${TO_ADDRESS}`);
  const hash = await walletClient.token.transfer({
    amount: parseUnits(AMOUNT, tokenMetadata.decimals),
    to: TO_ADDRESS,
    token: TOKEN,
  });

  console.log("Waiting for transaction receipt", hash);
  const receipt = await walletClient.waitForTransactionReceipt({ hash });
  console.log("Transaction status", receipt.status);
  if (receipt.status !== "success") {
    console.error(receipt);
    throw new Error("Transaction reverted");
  }

  const newBalance = await walletClient.token.getBalance({ token: TOKEN });
  console.log(`Balance after transfer: ${fmt(newBalance)} ${tokenMetadata.symbol}`);
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
