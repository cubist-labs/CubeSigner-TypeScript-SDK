import { encode as mpEncode } from "msgpackr";
import { wordlist } from "@scure/bip39/wordlists/english";
import * as bip39 from "@scure/bip39";

// The KeyPackage type from CubeSigner (mnemonic variant)
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
 * @param { MnemonicToImport } mne A BIP39 mnemonic and optional BIP39 password and BIP32 derivation path
 * @return { Uint8Array } A serialized key package for import to CubeSigner
 */
export function newMnemonicKeyPackage(mne: MnemonicToImport): Uint8Array {
  const entropy = bip39.mnemonicToEntropy(mne.mnemonic, wordlist);
  const path = !mne.derivationPath ? [] : parseDerivationPath(mne.derivationPath);
  const password = mne.password ?? "";
  const mnePkg: MnemonicKeyPackage = {
    EnglishMnemonic: {
      mnemonic: {
        entropy,
      },
      der_path: {
        path,
      },
      password,
    },
  };
  return mpEncode(mnePkg);
}

// constants for derivation path parsing
const DER_HARDENED = 1n << 31n;
const DER_MAX = 1n << 32n;

/**
 * Parse a derivation path into a sequence of 32-bit integers
 *
 * @param { string } derp The derivation path to parse; must start with 'm/'
 * @return { number[] } The parsed path
 */
export function parseDerivationPath(derp: string): number[] {
  derp = derp.toLowerCase();
  if (derp === "m") {
    return [];
  }
  if (!derp.startsWith("m/")) {
    throw new Error('Derivation path must start with "m/"');
  }
  const parts = derp.slice(2).split("/");
  const ret = [];
  for (let part of parts) {
    let hardened = false;
    if (part.endsWith("'") || part.endsWith("h")) {
      hardened = true;
      part = part.slice(0, part.length - 1);
    }
    if (part === "") {
      throw new Error("Invalid derivation path: empty element");
    }
    let value = BigInt(part);
    if (value >= DER_MAX) {
      throw new Error("Derivation path element greater than 2^32 is invalid");
    }
    if (hardened) {
      value = value | DER_HARDENED;
    }
    ret.push(Number(value));
  }
  return ret;
}
