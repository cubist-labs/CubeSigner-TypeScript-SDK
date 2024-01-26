/** JSON map type */
export interface JsonMap {
    [member: string]: string | number | boolean | null | JsonArray | JsonMap;
}
/** JSON array type */
export type JsonArray = Array<string | number | boolean | null | JsonArray | JsonMap>;
/**
 * Path join
 * @param {string} dir Parent directory
 * @param {string} file Pathname
 * @return {string} New pathname
 */
export declare function pathJoin(dir: string, file: string): string;
/**
 * Browser-friendly helper for decoding a 'base64'-encoded string into a byte array.
 *
 * @param {string} b64 The 'base64'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
export declare function decodeBase64(b64: string): Uint8Array;
/**
 * Browser-friendly helper for decoding a 'base64url'-encoded string into a byte array.
 *
 * @param {string} b64url The 'base64url'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
export declare function decodeBase64Url(b64url: string): Uint8Array;
/**
 *
 * Browser-friendly helper for encoding a byte array into a padded `base64`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64' encoding of the byte array.
 */
export declare function encodeToBase64(buffer: Iterable<number>): string;
/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64url' encoding of the byte array.
 */
export declare function encodeToBase64Url(buffer: Iterable<number>): string;
/**
 * Sleeps for `ms` milliseconds.
 *
 * @param {number} ms Milliseconds to sleep
 * @return {Promise<void>} A promise that is resolved after `ms` milliseconds.
 */
export declare function delay(ms: number): Promise<void>;
/**
 * Converts a string or a uint8 array into a hex string. Strings are encoded in UTF-8 before
 * being converted to hex.
 * @param {string | Uint8Array} message The input
 * @return {string} Hex string prefixed with "0x"
 */
export declare function encodeToHex(message: string | Uint8Array): string;
