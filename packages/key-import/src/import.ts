import type {
  ImportKeyRequest,
  ImportKeyRequestMaterial,
  Key,
  KeyType,
  Org,
  ImportDeriveKeyProperties,
} from "@cubist-labs/cubesigner-sdk";
import { loadSubtleCrypto } from "@cubist-labs/cubesigner-sdk";

import type { MnemonicToImport } from "./mnemonic.ts";
import { newMnemonicKeyPackage } from "./mnemonic.ts";
import { newRawKeyPackage } from "./raw.ts";
import { WrappedImportKey } from "./wrapped_import_key.ts";

// Maximum number of keys to import in a single API call
const MAX_IMPORTS_PER_API_CALL = 32n;

/**
 * An import encryption key and the corresponding attestation document
 */
export class KeyImporter {
  #wrappedImportKey: null | WrappedImportKey = null;
  readonly #cs: Org;

  /**
   * Construct from a CubeSigner `Org` instance
   *
   * @param cs A CubeSigner `Org` instance
   */
  constructor(cs: Org) {
    this.#cs = cs;
  }

  /**
   * Check that the wrapped import key is unexpired and verified. Otherwise,
   * request a new one and verify it.
   *
   * @returns The current verified wrapped import key.
   */
  async #getWrappedImportKey(): Promise<WrappedImportKey> {
    if (!this.#wrappedImportKey || this.#wrappedImportKey.needsRefresh()) {
      const resp = await this.#cs.createKeyImportKey();
      const subtle = await loadSubtleCrypto();
      this.#wrappedImportKey = await WrappedImportKey.createAndVerify(resp, subtle);
    }
    return this.#wrappedImportKey;
  }

  /**
   * Encrypts a set of mnemonics and imports them.
   *
   * @param keyType The type of key to import
   * @param mnes The mnemonics to import, with optional derivation paths and passwords
   * @param props Additional options for import
   * @returns `Key` objects for each imported key.
   */
  public async importMnemonics(
    keyType: KeyType,
    mnes: MnemonicToImport[],
    props?: ImportDeriveKeyProperties,
  ): Promise<Key[]> {
    return await this.#importPackages(
      keyType,
      mnes.map((mne) => newMnemonicKeyPackage(mne)),
      props,
    );
  }

  /**
   * Encrypts a set of raw keys and imports them.
   *
   * @param keyType The type of key to import
   * @param secrets The secret keys to import.
   * @param props Additional options for import
   * @returns `Key` objects for each imported key.
   */
  public async importRawSecretKeys(
    keyType: KeyType,
    secrets: Uint8Array[],
    props?: ImportDeriveKeyProperties,
  ): Promise<Key[]> {
    return await this.#importPackages(
      keyType,
      secrets.map((sec) => newRawKeyPackage(sec)),
      props,
    );
  }

  /**
   * Encrypts a set of prepared key packages, and imports them.
   *
   * @param keyType The type of key to import
   * @param packages The key packages to import.
   * @param props Additional options for import
   * @returns `Key` objects for each imported key.
   */
  async #importPackages(
    keyType: KeyType,
    packages: Uint8Array[],
    props?: ImportDeriveKeyProperties,
  ): Promise<Key[]> {
    const nChunks = Number(
      (BigInt(packages.length) + MAX_IMPORTS_PER_API_CALL - 1n) / MAX_IMPORTS_PER_API_CALL,
    );
    const keys = [];

    for (let i = 0; i < nChunks; ++i) {
      // first, make sure that the wrapped import key is valid, i.e., that
      // we have retrieved it and that it hasn't expired. We do this here
      // for a couple reasons:
      //
      // - all encryptions in a given request must use the same import key, and
      //
      // - when importing a huge number of keys the import pubkey might expire
      //   during the import, so we check for expiration before each request
      const wik = await this.#getWrappedImportKey();

      // next, encrypt this chunk of packages
      const start = Number(MAX_IMPORTS_PER_API_CALL) * i;
      const end = Number(MAX_IMPORTS_PER_API_CALL) + start;
      const key_material: ImportKeyRequestMaterial[] = [];
      for (const keyPkg of packages.slice(start, end)) {
        const { enc, ciphertext } = await wik.encrypt(keyPkg);
        // We use an extension of HPKE that allows a salt value to be specified, but it is ok to
        // use an empty salt if the import key is not reused
        key_material.push({ salt: "", client_public_key: enc, ikm_enc: ciphertext });
      }

      // construct the request and send it
      const policy = props?.policy ?? null;
      const req: ImportKeyRequest = {
        ...wik.toImportKey(),
        key_type: keyType,
        key_material,
        ...props,
        policy,
      };

      const resp = await this.#cs.importKeys(req);
      keys.push(...resp);
    }

    return keys;
  }
}
