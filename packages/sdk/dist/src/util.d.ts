/** JSON map type */
export interface JsonMap {
    [member: string]: string | number | boolean | null | JsonArray | JsonMap;
}
/** JSON array type */
export type JsonArray = Array<string | number | boolean | null | JsonArray | JsonMap>;
/** Any JSON value */
export type JsonValue = string | number | boolean | null | JsonArray | JsonMap;
/** The address of a contract. */
export type ContractAddress = {
    chain_id: string;
    address: string;
};
/**
 * Path join
 *
 * @param dir Parent directory
 * @param file Pathname
 * @returns New pathname
 */
export declare function pathJoin(dir: string, file: string): string;
/**
 * Browser-friendly helper for decoding a 'base64'-encoded string into a byte array.
 *
 * @param b64 The 'base64'-encoded string to decode
 * @returns Decoded byte array
 */
export declare function decodeBase64(b64: string): Uint8Array;
/**
 * Browser-friendly helper for decoding a 'base64url'-encoded string into a byte array.
 *
 * @param b64url The 'base64url'-encoded string to decode
 * @returns Decoded byte array
 */
export declare function decodeBase64Url(b64url: string): Uint8Array;
/**
 *
 * Browser-friendly helper for encoding a byte array into a padded `base64`-encoded string.
 *
 * @param buffer The byte array to encode
 * @returns The 'base64' encoding of the byte array.
 */
export declare function encodeToBase64(buffer: Iterable<number> | ArrayBuffer): string;
/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param buffer The byte array to encode
 * @returns The 'base64url' encoding of the byte array.
 */
export declare function encodeToBase64Url(buffer: Iterable<number> | ArrayBuffer): string;
/**
 * Sleeps for `ms` milliseconds.
 *
 * @param ms Milliseconds to sleep
 * @returns A promise that is resolved after `ms` milliseconds.
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Converts a string or a uint8 array into a hex string. Strings are encoded in UTF-8 before
 * being converted to hex.
 *
 * @param message The input
 * @returns Hex string prefixed with "0x"
 */
export declare function encodeToHex(message: string | Uint8Array): string;
//# sourceMappingURL=util.d.ts.map