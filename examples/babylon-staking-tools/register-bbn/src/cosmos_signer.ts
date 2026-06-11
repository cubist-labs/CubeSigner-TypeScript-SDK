import * as cs from "@cubist-labs/cubesigner-sdk";
import type { AccountData, DirectSignResponse, OfflineDirectSigner } from "@cosmjs/proto-signing";
import { makeSignBytes } from "@cosmjs/proto-signing";
import { sha256, Secp256k1 } from "@cosmjs/crypto";
import type { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { encodeSecp256k1Signature } from "@cosmjs/amino";
import { fromBech32, toBech32 } from "@cosmjs/encoding";

/**
 * Cosmos direct signer backed by CubeSigner.
 */
export class CosmosSecp256k1CubeSigner implements OfflineDirectSigner {
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
   * @param key The secp256k1 key to use for signing.
   * @param addrHrp The human-readable part of addresses for this signer
   */
  constructor(key: cs.Key, addrHrp: string = "cosmos") {
    this.#key = key;
    this.#account = CosmosSecp256k1CubeSigner.keyToAccountData(key.cached, addrHrp)!;
  }

  /** @inheritdoc */
  async getAccounts(): Promise<readonly AccountData[]> {
    return [this.#account];
  }

  /**
   * Sign a sign doc using the blob-sign end point.
   *
   * @param address The address to sign with (must be the same as the signer key).
   * @param signDoc The sign doc to sign.
   * @returns The signature.
   */
  async signDirect(address: string, signDoc: SignDoc): Promise<DirectSignResponse> {
    if (address !== this.#account.address) {
      throw new Error(`Address ${address} not found in wallet`);
    }
    const signBytes = makeSignBytes(signDoc);
    const hashedMessage = sha256(signBytes);
    const resp = await this.#key.signBlob({
      message_base64: Buffer.from(hashedMessage).toString("base64"),
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
   *
   * @param key The key to convert.
   * @param addrHrp The HRP of the key
   * @returns The account data
   * @throws {Error} If the key is not a Secp256k1 Cosmos key.
   */
  static keyToAccountData(key: cs.KeyInfo, addrHrp: string): AccountData | undefined {
    if (key.key_type !== cs.Secp256k1.Cosmos) {
      throw new Error(`Unsupported key type: ${key.key_type}`);
    }
    const { data: addrData } = fromBech32(key.material_id);
    const encodedAddr = toBech32(addrHrp, addrData);
    return {
      algo: "secp256k1",
      address: encodedAddr,
      pubkey: Secp256k1.compressPubkey(Buffer.from(key.public_key.slice(2), "hex")),
    };
  }
}
