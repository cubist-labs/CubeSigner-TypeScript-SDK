export type RawKeyPackage = {
    Secret: Uint8Array;
};
/**
 * Create a new RawKeyPackage value
 *
 * @param secret The raw secret key to import
 * @returns A serialized key package for import to CubeSigner
 */
export declare function newRawKeyPackage(secret: Uint8Array): Uint8Array;
//# sourceMappingURL=raw.d.ts.map