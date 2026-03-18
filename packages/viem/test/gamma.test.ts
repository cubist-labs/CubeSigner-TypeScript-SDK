import {
  type Address,
  type HttpTransport,
  type LocalAccount,
  type WalletClient,
  createWalletClient,
  formatGwei,
  getAddress,
  http,
  parseEther,
  parseTransaction,
  publicActions,
  recoverTransactionAddress,
} from "viem";
import { CubeSignerClient } from "@cubist-labs/cubesigner-sdk";
import { CubeSignerSource } from "../src";
import { defaultSignerSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import { env } from "@cubist-labs/cubesigner-sdk-fs-storage/test/helpers";
import { sepolia } from "viem/chains";
import { toAccount } from "viem/accounts";

// Increase timeout to 3 minutes (we're submitting transactions to the blockchain)
jest.setTimeout(180_000);

/**
 * An optional CUBE_SIGNER_TOKEN to create a session from. Defaults to the default signer session on disk if undefined.
 * Create this token like `CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)`
 */
const CUBE_SIGNER_TOKEN = process.env.CUBE_SIGNER_TOKEN;

/** An address with funds accessible within our CubeSigner org. This address will send `$AMOUNT` ether (+ gas) sepolia to TO_ADDR. */
const GENERATED_ADDRESS: Address = getAddress(
  env("GENERATED_ADDRESS", "0x96be1e4c198ecb1a55e769f653b1934950294f19")!,
);
/** An address that belongs to our CubeSigner org and is accessible from our session. */
const IMPORTED_ADDRESS: Address = getAddress(env("IMPORTED_ADDRESS")!);

/** A JSON-RPC provider for sepolia. Defaults to viem's default RPC provider if not provided. */
const RPC_PROVIDER: HttpTransport = http(env("RPC_PROVIDER", sepolia.rpcUrls.default.http[0])!);

/** An amount of sepolia wei to use in our transaction. Set `AMOUNT` in your environment to an amount of ether to change the default. */
const AMOUNT_WEI: bigint = parseEther(process.env.AMOUNT ?? "0.0000001");

describe("Viem Clients: signing/sending transactions onchain", () => {
  // We're using account hoisting (https://viem.sh/docs/clients/wallet#optional-hoist-the-account),
  // but you could also save the CubeSigner account and use it with a generic WalletClient.
  let cubeSigner: WalletClient<HttpTransport, typeof sepolia, LocalAccount>;

  beforeAll(async () => {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location (local testing).
    const session = CUBE_SIGNER_TOKEN ?? defaultSignerSessionManager();
    const client = await CubeSignerClient.create(session);

    cubeSigner = createWalletClient({
      account: toAccount(new CubeSignerSource(GENERATED_ADDRESS, client)),
      chain: sepolia,
      transport: RPC_PROVIDER,
    });

    console.log("Wallet address:", cubeSigner.account.address);
  });

  it("signTransaction - produces a valid signature", async () => {
    // populate the transaction with gas price, nonce, etc.
    // This transaction isn't actually sent to the chain.
    const tx = await cubeSigner.prepareTransactionRequest({
      to: IMPORTED_ADDRESS,
      value: AMOUNT_WEI,
    });

    const serializedTransaction = await cubeSigner.signTransaction(tx);
    console.log("CubeSigner signature:", serializedTransaction);

    // create Transaction from the signature
    const reconstructedTransaction = parseTransaction(serializedTransaction);

    // Make sure the fields match
    expect(reconstructedTransaction.to).toBeDefined();
    expect(getAddress(reconstructedTransaction.to!)).toEqual(IMPORTED_ADDRESS);
    expect(reconstructedTransaction.value).toEqual(AMOUNT_WEI);

    // Check the public address is what we expected
    const publicAddress = await recoverTransactionAddress({ serializedTransaction });

    expect(getAddress(publicAddress)).toEqual(GENERATED_ADDRESS);
  });

  it("sendTransaction - sends funds", async () => {
    // Extend our WalletClient to also perform public actions, such as fetching address balances
    // https://viem.sh/docs/clients/wallet#optional-extend-with-public-actions
    const extendedCubeSigner = cubeSigner.extend(publicActions);

    expect(extendedCubeSigner.account.address).toEqual(GENERATED_ADDRESS);

    const getBalanceInWei = async () =>
      await Promise.all(
        [{ address: GENERATED_ADDRESS }, { address: IMPORTED_ADDRESS }].map((address) =>
          extendedCubeSigner.getBalance(address),
        ),
      );

    const [fromBalanceBefore, toBalanceBefore] = await getBalanceInWei();
    console.log(`[Before] from (${GENERATED_ADDRESS}) has ${formatGwei(fromBalanceBefore)} gwei`);
    console.log(`[Before] to (${IMPORTED_ADDRESS}) has ${formatGwei(toBalanceBefore)} gwei`);

    console.log(
      `Transferring ${formatGwei(AMOUNT_WEI)} gwei from ${GENERATED_ADDRESS} to ${IMPORTED_ADDRESS}...`,
    );
    const hash = await extendedCubeSigner.sendTransaction({
      to: IMPORTED_ADDRESS,
      value: AMOUNT_WEI,
    });
    console.log(`Waiting up to 3 minutes for receipt for transaction ${hash}...`);
    const receipt = await extendedCubeSigner.waitForTransactionReceipt({ hash });
    console.log(`Transaction ${hash} included on block number ${receipt.blockNumber}!`);

    const [fromBalanceAfter, toBalanceAfter] = await getBalanceInWei();
    console.log(`[After] from (${GENERATED_ADDRESS}) has ${formatGwei(fromBalanceAfter)} gwei`);
    console.log(`[After] to (${IMPORTED_ADDRESS}) has ${formatGwei(toBalanceAfter)} gwei`);

    // Gas fees are also subtracted from FROM_ADDR, so use <= rather than ===.
    expect(fromBalanceAfter).toBeLessThanOrEqual(fromBalanceBefore - AMOUNT_WEI);
    expect(toBalanceAfter).toEqual(toBalanceBefore + AMOUNT_WEI);
  });
});
