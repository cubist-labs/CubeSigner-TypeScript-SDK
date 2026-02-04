/**
 * An example script showing how to implement WalletConnect in your wallet app, using
 * CubeSigner to sign transactions in secure hardware.
 *
 * Exit the script with CTRL-C or sending a SIGINT signal.
 */

// Load the .env file, which can contain the WalletConnect Project ID and CubeSigner Key id saved as WALLETCONNECT_PROJECT_ID and CUBESIGNER_KEY_ID.
// Alternatively, they can be defined as environment variables.
import "dotenv/config";

import { CubeSignerClient, Key } from "@cubist-labs/cubesigner-sdk";
import {
  JsonFileSessionManager,
  SIGNER_SESSION_PATH,
  defaultManagementSessionManager,
} from "@cubist-labs/cubesigner-sdk-fs-storage";
import { Signer } from "@cubist-labs/cubesigner-sdk-ethers-v6";
import type { SignerOptions } from "@cubist-labs/cubesigner-sdk-ethers-v6";
import { ethers } from "ethers";

import { Core } from "@walletconnect/core";
import { buildApprovedNamespaces, getSdkError } from "@walletconnect/utils";
import { Web3Wallet } from "@walletconnect/web3wallet";
import type { IWeb3Wallet, Web3WalletTypes } from "@walletconnect/web3wallet";
import type { SessionTypes } from "@walletconnect/types";

import assert from "node:assert";
import { stdin, stdout } from "node:process";
import readline from "node:readline/promises";

const WALLETCONNECT_PROJECT_ID = env("WALLETCONNECT_PROJECT_ID");
const CUBESIGNER_KEY_ID = env("CUBESIGNER_KEY_ID");
const CUBESIGNER_SIGNER_TOKEN_FILE = env("CUBESIGNER_SIGNER_TOKEN_FILE", SIGNER_SESSION_PATH);
// Provider used to submit transactions to the chain, defaults to ankr if not provided
const RPC_PROVIDER = env("RPC_PROVIDER");

let web3WalletSession: SessionTypes.Struct | undefined;
const rl = readline.createInterface({ input: stdin, output: stdout });

/**
 * Driver function to
 * - retrieve the CubeSigner key from CUBESIGNER_KEY_ID and create an Ethers signer for the key (Ethers is used for `eth_sendTransaction`)
 * - initialize a Web3Wallet instance (the WalletKit client) and register event listeners for RPCs (such as `eth_sendTransaction`)
 * - register a function to clean up web3Wallet if the script is terminated with CTRL-C/SIGINT
 * - prompt the user to input a URI from a dapp, which will create a session
 */
async function main() {
  logNewEvent("Starting CubeSigner and Wallet Connect, this may take a few seconds...");
  const [key, signer] = await getKeyAndEthers(
    CUBESIGNER_KEY_ID,
    RPC_PROVIDER,
    CUBESIGNER_SIGNER_TOKEN_FILE,
  );
  const web3Wallet = await initWalletConnect(WALLETCONNECT_PROJECT_ID, key, signer);

  // Use Ctrl-C to send SIGINT and end the script.
  process.once("SIGINT", async () => await cleanup(web3Wallet));

  logNewEvent(
    "Please go to https://react-app.walletconnect.com/, select Ethereum Sepolia, click Connect, then click the copy button in the top right to get a WalletConnect URI.",
  );
  const uri = await rl.question("Please paste the WalletConnect URI and hit enter: ");
  await web3Wallet.pair({ uri });

  // web3Wallet will now listen to requests and keep the script running until
  // web3Wallet is cleaned up.
}

/**
 * Retrieve the given CubeSigner key and initialize an Ethers signer for that
 * key.
 *
 * @param keyId The key id of the EVM key used.
 * @param rpcProvider A provider for sending a Sepolia transaction to the chain
 * @param signerToken A CubeSigner token for a signer session
 * @returns A CubeSigner key and an Ether's Signer configured to use this key
 */
async function getKeyAndEthers(
  keyId: string,
  rpcProvider: string,
  signerToken: string,
): Promise<[Key, Signer]> {
  const managementClient = await CubeSignerClient.create(defaultManagementSessionManager());
  const org = managementClient.org();

  let key = await org.getKey(keyId);

  // NOTE: To successfully sign and send transactions, the Signer session must
  // have "sign:evm:*" permissions.
  const signerSession = await CubeSignerClient.create(new JsonFileSessionManager(signerToken));

  key = new Key(signerSession, key.cached);

  const provider = new ethers.JsonRpcProvider(rpcProvider);
  const signer = new Signer(key, signerSession, { provider } as unknown as SignerOptions);

  return [key, signer];
}

/**
 * Initialize a Web3Wallet and its event handlers for dapps.
 *
 * @param projectId The WalletConnect project id, retrieved from https://cloud.reown.com
 * @param key The CubeSigner key
 * @param signer A CubeSigner Ethers signer used to submit transactions
 * @returns A Web3Wallet with event handlers for
 * creating/ destroying sessions and handling the Ethereum `personal_sign`/
 * `eth_sendTransaction` session requests.
 */
async function initWalletConnect(
  projectId: string,
  key: Key,
  signer: Signer,
): Promise<IWeb3Wallet> {
  const core = new Core({
    projectId: projectId,
  });

  const web3Wallet = await Web3Wallet.init({
    core,
    metadata: {
      name: "CubeSigner Demo Wallet",
      description: "Demo Wallet",
      url: "cubist.dev",
      // CubeSigner favicon
      icons: [
        "https://assets-global.website-files.com/638a2693daaf8527290065a3/651802cf8d04ec5f1a09ce86_Logo.svg",
      ],
    },
  });

  // Register event handlers
  web3Wallet.on(
    "session_proposal",
    async (params) => await onSessionProposal(web3Wallet, key, params),
  );

  web3Wallet.on("session_request", async (request) => {
    // We should only receive requests from our session.
    assert(web3WalletSession?.topic === request.topic);

    switch (request.params.request.method) {
      case "personal_sign":
        await personalSign(web3Wallet, key, request);
        break;
      case "eth_sendTransaction":
        await sendTransaction(web3Wallet, signer, request);
        break;
      default:
        await web3Wallet.rejectSession({ id: request.id, reason: getSdkError("INVALID_METHOD") });
        break;
    }
  });

  web3Wallet.on("session_delete", async ({ topic }: Web3WalletTypes.SessionDelete) => {
    // Ensure we're receiving the call from our session.
    assert(web3WalletSession?.topic === topic);
    logNewEvent(`Distributed app ${web3WalletSession.peer.metadata.name} disconnected.`);
    web3WalletSession = undefined;
    await cleanup(web3Wallet);
  });

  return web3Wallet;
}

/**
 * Prompt the user if they want to pair with a dapp, and if so connect to the
 * dapp with the given CubeSigner Key on the Sepolia testnet.
 *
 * @param web3Wallet The wallet receiving the session proposal
 * @param key The CubeSigner key used by the wallet
 * @param proposal The session proposal from the dapp
 */
async function onSessionProposal(
  web3Wallet: IWeb3Wallet,
  key: Key,
  proposal: Web3WalletTypes.SessionProposal,
) {
  const { id, params } = proposal;
  const rejectProposal = async () =>
    await web3Wallet.rejectSession({ id, reason: getSdkError("USER_REJECTED") });
  const dappName = params.proposer.metadata.name;

  if (web3WalletSession !== undefined) {
    console.error(
      `This script only handles one connection at a time, refusing connection from ${dappName}`,
    );
    await rejectProposal();
    return;
  }

  const permission = await prompt(
    `Do you want to connect to distributed app ${dappName} with key ${key.id}?`,
  );

  if (!permission) {
    logNewEvent("Rejecting sesson and closing script...");
    await rejectProposal();
    await cleanup(web3Wallet);
    return;
  }

  try {
    const namespaces = buildApprovedNamespaces({
      proposal: params,
      supportedNamespaces: {
        eip155: {
          // Supporting Ethereum's Sepolia test chain 11155111
          chains: ["eip155:11155111"],
          // These are the required methods to implement EIP-155. There are more
          // methods that can be implemented, see
          // https://docs.walletconnect.com/advanced/multichain/rpc-reference/ethereum-rpc
          methods: ["eth_sendTransaction", "personal_sign"],
          // These are events a wallet can send to a dapp.
          // This script does not implement the events, since there is only one
          // account (the single key) and chain (sepolia) so there is nothing to
          // change between.
          events: ["chainChanged", "accountsChanged"],
          accounts: [`eip155:11155111:${key.materialId}`],
        },
      },
    });

    web3WalletSession = await web3Wallet.approveSession({ id, namespaces });
    logNewEvent(`Paired to dapp ${dappName} with CubeSigner key ${key.id}
You can now try Ethereum RPC calls from the dapp.
Exit the script by using Ctrl-C or disconnecting the session from the dapp.`);
  } catch (e) {
    // Errors if the namespaces object is invalid or any failure in communicating with the dapp
    console.error(`Error approving session: ${e instanceof Error ? e.message : e}`);
    await rejectProposal();
  }
}

/**
 * Implements Ethereum's `personal_sign` RPC call, signing with the
 * given CubeSigner key. The request fails if the key does not have
 * the AllowEip191Signing policy, the signer session does not have the
 * "sign:evm:eip191" scope, the user doesn't give permission, or there is a
 * failure communicating with the dapp.
 * Following the specification at
 * https://docs.walletconnect.com/advanced/multichain/rpc-reference/ethereum-rpc#personal_sign
 *
 * @param web3Wallet The wallet receiving the session request
 * @param key The CubeSigner key used by the wallet for signing
 * @param request The session request from the paired dapp
 */
async function personalSign(
  web3Wallet: IWeb3Wallet,
  key: Key,
  request: Web3WalletTypes.SessionRequest,
) {
  const { topic, params, id } = request;
  assert(params.request.method === "personal_sign");

  const [data, address]: [string, string] = params.request.params;
  assert(key.materialId === address);

  const permission = await prompt(`Do you want to sign data ${data} with key ${address}?`);
  if (!permission) {
    await rejectRequest("User rejected.", web3Wallet, id, topic);
    return;
  }

  // CubeSigner's signEip191 function handles the EIP-191 standard, including
  // the mandatory header.
  try {
    // NOTE: This throws if the key does not have the AllowEip191Signing policy.
    const signature = (await key.signEip191({ data })).data().signature;
    logNewEvent(`Sending signature ${signature} to dapp`);

    const response = { id, jsonrpc: "2.0", result: signature };
    await web3Wallet.respondSessionRequest({ topic, response });
  } catch (e) {
    // Errors if the key does not have the AllowEip191Signing policy, the
    // signer session does not have the "sign:evm:eip191" scope, or there is
    // failure communicating with the dapp.
    console.error(`Error signing data: ${e instanceof Error ? e.message : e}`);
    await rejectRequest("Error signing data.", web3Wallet, id, topic);
  }
}

/**
 * The parameters given to us for a transaction from a WalletConnect
 * integration. Defined at
 * https://docs.walletconnect.com/advanced/multichain/rpc-reference/ethereum-rpc#parameters-3
 */
type WalletConnectTx = {
  from: string;
  to: string | undefined; // Optional for contracts
  data: string;
  gas: string | undefined; // Optional, not provided by WalletConnect's example dapp
  gasPrice: string | undefined; // Optional
  value: string | undefined; // Optional
  nonce: string | undefined; // Optional
};

/**
 * Implements Ethereum's `eth_sendTransaction` RPC call, signing with the given
 * CubeSigner Ether's Signer. The request fails if the signer session does not have
 * the "sign:evm:tx" scope or there is failure communicating with the dapp.
 *
 * Following the specification at
 * https://docs.walletconnect.com/advanced/multichain/rpc-reference/ethereum-rpc#eth_sendtransaction
 *
 * @param web3Wallet The wallet receiving the session request
 * @param signer A CubeSigner Ethers signer used to submit the transaction
 * @param request The sendTransaction request from a dapp
 */
async function sendTransaction(
  web3Wallet: IWeb3Wallet,
  signer: Signer,
  request: Web3WalletTypes.SessionRequest,
) {
  const { topic, params, id } = request;
  // Enforce that we're sending a transaction on the Sepolia chain.
  assert(params.request.method === "eth_sendTransaction");
  assert(params.chainId === "eip155:11155111");

  // If not using ethers, you can use CubeSigner's classes by creating an
  // EvmSignRequest, signing it with key.signEvm, and sending the signed
  // transaction to the chain.
  //
  // CubeSigner's SDK by itself doesn't provide methods to send the transaction,
  // so we're using CubeSigner's Ether's SDK, which allows us to use the Signer
  // object to sign and send the transaction.
  const wc_tx: WalletConnectTx = params.request.params[0];

  if ([wc_tx.to, wc_tx.value].includes(undefined)) {
    await rejectRequest(
      "This wallet requires the 'to' and 'value' parameters to send a transaction.",
      web3Wallet,
      id,
      topic,
    );
    return;
  }

  const ethers_tx = await signer.populateTransaction({
    from: wc_tx.from,
    to: wc_tx.to,
    value: wc_tx.value,
    gasPrice: wc_tx.gasPrice,
    nonce: wc_tx.nonce !== undefined ? Number(wc_tx.nonce) : undefined,
  });

  // BigInts aren't printed by default - https://tc39.es/proposal-bigint/#sec-serializejsonproperty
  const bigIntReplacer = (_key: string, value: unknown) => {
    return typeof value === "bigint" ? value.toString() : value;
  };

  const permission = await prompt(`Do you want to send the following transaction?
${JSON.stringify(ethers_tx, bigIntReplacer, 2)}\n`);

  if (!permission) {
    await rejectRequest("User rejected.", web3Wallet, id, topic);
    return;
  }

  try {
    const tx_response = await signer.sendTransaction(ethers_tx);
    const numConfirmations = 2;
    logNewEvent(
      `Submitted transaction hash ${tx_response.hash} to the chain, waiting for ${numConfirmations} confirm blocks (this can range from ~30 seconds to 5+ minutes)...`,
    );
    await tx_response.wait(numConfirmations);

    logNewEvent(`Transaction confirmed, sending transaction hash ${tx_response.hash} to dapp`);

    const response = { id, jsonrpc: "2.0", result: tx_response.hash };
    await web3Wallet.respondSessionRequest({ topic, response });
  } catch (e) {
    // The request will fail if the session does not have the "sign:evm:tx"
    // scope or the request otherwise fails.
    console.error(`Error sending transaction: ${e instanceof Error ? e.message : e}`);
    await rejectRequest("Sending transaction failed.", web3Wallet, id, topic);
  }
}

/**
 * Rejects a session request on the web3Wallet with the given string.
 *
 * @param message The reason the request is rejected
 * @param web3Wallet The wallet used for the request
 * @param id The id of the request being rejected
 * @param topic The identifier for the session between the wallet and the dapp
 */
async function rejectRequest(message: string, web3Wallet: IWeb3Wallet, id: number, topic: string) {
  console.log("Rejecting request.");
  const rejectResponse = {
    id,
    jsonrpc: "2.0",
    error: { code: 5000, message: message },
  };
  await web3Wallet.respondSessionRequest({ topic, response: rejectResponse });
}

/**
 * Clean up web3Wallet. Once this function is completed, the
 * async queue will be empty and the script will terminate.
 *
 * @param web3Wallet The WalletConnect instance
 */
async function cleanup(web3Wallet: IWeb3Wallet) {
  rl.close();
  logNewEvent("Closing WalletConnect. This may take a few seconds.");
  if (web3WalletSession !== undefined) {
    await web3Wallet.disconnectSession({
      topic: web3WalletSession.topic,
      reason: getSdkError("USER_DISCONNECTED"),
    });
  }
  web3Wallet.core.heartbeat.stop();
  await web3Wallet.core.relayer.transportClose();
}

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback An optional fallback value.
 * @returns The value of the environment variable.
 * @throws {Error} If the environment variable is not set and there's no fallback.
 */
function env(name: string, fallback?: string): string {
  const val = process.env[name];
  if (val !== undefined && val !== "") {
    return val;
  }

  if (fallback !== undefined) {
    return fallback;
  } else {
    throw new Error(`Missing environment variable ${name}`);
  }
}

/**
 * Prompt the user with a question, and return if they say yes or no to the question.
 *
 * @param question The question to ask the user
 * @returns if the user says Y/y, yes, or hits enter to the Y/n prompt
 */
async function prompt(question: string): Promise<boolean> {
  const answer = (
    await rl.question(`
${question} (Y/n): `)
  )
    .trim()
    .toLowerCase();

  return ["", "y", "yes"].includes(answer);
}

/**
 * Log with a prepending newline to make the boundary between events clear and
 * readable to the user.
 *
 * @param msg The message to print
 */
function logNewEvent(msg: string) {
  console.log(`\n${msg}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
