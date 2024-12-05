import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { SigningStargateClient, StargateClient } from "@cosmjs/stargate"
import type { AccountData, DirectSignResponse, OfflineDirectSigner } from "@cosmjs/proto-signing";
import { makeSignBytes } from "@cosmjs/proto-signing"
import { sha256, Secp256k1 } from "@cosmjs/crypto";
import type { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { encodeSecp256k1Signature } from "@cosmjs/amino";

const FROM_ADDRESS: string = env("FROM_ADDRESS")!;
const TO_ADDRESS: string = env("TO_ADDRESS", FROM_ADDRESS)!;
const RPC: string = "https://rpc.sentry-01.theta-testnet.polypore.xyz";
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);

/**
 * Main entry point for example.
 * 
 * This example is based on the CosmJS example 
 * See https://tutorials.cosmos.network/tutorials/7-cosmjs/
 * and the corresponding source: https://github.com/b9lab/cosmjs-sandbox/blob/2c7b137967fa514acf48f9469ecf55f562cf6b5a/experiment.ts
 * */
async function main() {
  // create CubeSigner-backed signer
  const csClient = await cs.CubeSignerClient.create(CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager());
  const fromKey = await csClient.apiClient.keyGetByMaterialId(cs.Secp256k1.Cosmos, FROM_ADDRESS);

  const client = await StargateClient.connect(RPC)
  await printBalance(client, FROM_ADDRESS);
  await printBalance(client, TO_ADDRESS);

  const signer = new CosmosSecp256k1CubeSigner(csClient, fromKey);
  console.log("Accounts:", await signer.getAccounts());

  const signingClient = await SigningStargateClient.connectWithSigner(RPC, signer)
  console.log(`Connected to chain ${await signingClient.getChainId()}, height = ${await signingClient.getHeight()}`);

  // send tokens on testnet
  const result = await signingClient.sendTokens(FROM_ADDRESS, TO_ADDRESS, [{ denom: "uatom", amount: "100000" }], {
      amount: [{ denom: "uatom", amount: "1000" }],
      gas: "200000",
  }, "Test send from cs signer");
  console.log(`Transaction hash: ${result.transactionHash}, gas used: ${result.gasUsed}`);

  await printBalance(client, FROM_ADDRESS);
  await printBalance(client, TO_ADDRESS);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});


/**
 * Cosmos direct signer backed by CubeSigner.
 */
class CosmosSecp256k1CubeSigner implements OfflineDirectSigner {
  readonly #key: cs.Key;
  readonly #account: AccountData;

  /**
   * Create new direct signer.
   * 
   * This implementation is based on the DirectSecp256k1Wallet from the CosmJS
   * library (released under Apache License 2.0).
   * See
   * https://github.com/cosmos/cosmjs/blob/e819a1fc0e99a3e5320d8d6667a08d3b92e5e836/packages/proto-signing/src/directsecp256k1wallet.ts
   * 
   * @param {cs.CubeSignerClient} csClient CubeSigner client
   * @param {KeyInfo} key The secp256k1 key to use for signing.
   */
  constructor(csClient: cs.CubeSignerClient, key: cs.KeyInfo) {
    this.#key = new cs.Key(csClient, key);
    this.#account = CosmosSecp256k1CubeSigner.keyToAccountData(key)!;
  }

  /** @inheritdoc */
  async getAccounts(): Promise<readonly AccountData[]> {
    return [this.#account];
  }

  /**
   * Sign a sign doc using the blob-sign end point.
   * @param {string} address The address to sign with (must be the same as the signer key).
   * @param {SignDoc} signDoc The sign doc to sign.
   * @return {DirectSignResponse} The signature.
   */
  async signDirect(address: string, signDoc: SignDoc): Promise<DirectSignResponse> {
    if (address !== this.#account.address) {
      throw new Error(`Address ${address} not found in wallet`);
    }
    const signBytes = makeSignBytes(signDoc);
    const hashedMessage = sha256(signBytes);
    const resp = await this.#key.signBlob({
      message_base64: Buffer.from(hashedMessage).toString("base64")
    });
    if (resp.requiresMfa()) {
      throw new Error("MFA support not implemented in this example");
    }
    // return the signature
    const signature = resp.data().signature;
    const signatureBytes = Secp256k1.trimRecoveryByte(Buffer.from(signature.slice(2), "hex"));
    const stdSignature = encodeSecp256k1Signature(this.#account.pubkey, signatureBytes);
    return {
      signed: signDoc,
      signature: stdSignature,
    };
  }

  /**
   * Convert a key to account data.
   * @param {cs.KeyInfo} key The key to convert.
   * @return {AccountData} The account data
   * @throws {Error} If the key is not a Secp256k1 Cosmos key.
   */
  static keyToAccountData(key: cs.KeyInfo): AccountData | undefined {
    if (key.key_type !== cs.Secp256k1.Cosmos) {
      throw new Error(`Unsupported key type: ${key.key_type}`);
    }
    return { 
      algo: "secp256k1",
      address: key.material_id,
      pubkey: Secp256k1.compressPubkey(Buffer.from(key.public_key.slice(2), 'hex')),
    };
  }
}

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

/**
 * Print the account balance.
 * @param {StargateClient} client The Cosmos client
 * @param {string} owner The owner address
 */
async function printBalance(client: StargateClient, owner: string) {
  console.log(`Account ${owner} balance:`)
  console.table(await client.getAllBalances(owner));
}
