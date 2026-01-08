import type { Key, KeyType, Org, ImportDeriveKeyProperties } from "@cubist-labs/cubesigner-sdk";
import type { MnemonicToImport } from "./mnemonic";
/**
 * An import encryption key and the corresponding attestation document
 */
export declare class KeyImporter {
    #private;
    /**
     * Construct from a CubeSigner `Org` instance
     *
     * @param cs A CubeSigner `Org` instance
     */
    constructor(cs: Org);
    /**
     * Encrypts a set of mnemonics and imports them.
     *
     * @param keyType The type of key to import
     * @param mnes The mnemonics to import, with optional derivation paths and passwords
     * @param props Additional options for import
     * @returns `Key` objects for each imported key.
     */
    importMnemonics(keyType: KeyType, mnes: MnemonicToImport[], props?: ImportDeriveKeyProperties): Promise<Key[]>;
    /**
     * Encrypts a set of raw keys and imports them.
     *
     * @param keyType The type of key to import
     * @param secrets The secret keys to import.
     * @param props Additional options for import
     * @returns `Key` objects for each imported key.
     */
    importRawSecretKeys(keyType: KeyType, secrets: Uint8Array[], props?: ImportDeriveKeyProperties): Promise<Key[]>;
}
//# sourceMappingURL=import.d.ts.map