import { encode as mpEncode } from "msgpackr";

// The KeyPackage type from CubeSigner (raw secret variant)
export type RawKeyPackage = {
  Secret: Uint8Array;
};

/**
 * Create a new RawKeyPackage value
 *
 * @param { Uint8Array } secret The raw secret key to import
 * @return { Uint8Array} A serialized key package for import to CubeSigner
 */
export function newRawKeyPackage(secret: Uint8Array): Uint8Array {
  const rawPkg: RawKeyPackage = {
    Secret: secret,
  };
  return mpEncode(rawPkg);
}
