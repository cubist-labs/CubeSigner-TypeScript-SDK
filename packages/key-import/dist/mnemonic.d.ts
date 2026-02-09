export type MnemonicKeyPackage = {
    EnglishMnemonic: {
        mnemonic: {
            entropy: Uint8Array;
        };
        der_path: {
            path: number[];
        };
        password: string;
    };
};
/**
 * A BIP39 mnemonic to be imported, plus optional BIP39 password
 * and BIP32 derivation path.
 */
export type MnemonicToImport = {
    mnemonic: string;
    derivationPath?: string;
    password?: string;
};
/**
 * Create a new MnemonicKeyPackage value
 *
 * @param mne A BIP39 mnemonic and optional BIP39 password and BIP32 derivation path
 * @returns A serialized key package for import to CubeSigner
 */
export declare function newMnemonicKeyPackage(mne: MnemonicToImport): Uint8Array;
/**
 * Parse a derivation path into a sequence of 32-bit integers
 *
 * @param derp The derivation path to parse; must start with 'm/'
 * @returns The parsed path
 */
export declare function parseDerivationPath(derp: string): number[];
//# sourceMappingURL=mnemonic.d.ts.map