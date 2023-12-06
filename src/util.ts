import * as path from "path";

/** JSON map type */
export interface JsonMap {
  [member: string]: string | number | boolean | null | JsonArray | JsonMap;
}

/** JSON array type */
export type JsonArray = Array<string | number | boolean | null | JsonArray | JsonMap>;

/**
 * Directory where CubeSigner stores config files.
 * @return {string} Config dir
 */
export function configDir(): string {
  const configDir =
    process.platform === "darwin"
      ? `${process.env.HOME}/Library/Application Support`
      : `${process.env.HOME}/.config`;
  return path.join(configDir, "cubesigner");
}

/**
 * Browser-friendly helper for decoding a 'base64'-encoded string into a byte array.
 *
 * @param {string} b64 The 'base64'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
export function decodeBase64(b64: string): Uint8Array {
  return typeof Buffer === "function"
    ? Buffer.from(b64, "base64")
    : Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Browser-friendly helper for decoding a 'base64url'-encoded string into a byte array.
 *
 * @param {string} b64url The 'base64url'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
export function decodeBase64Url(b64url: string): Uint8Array {
  // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").replace(/=*$/g, "");
  return decodeBase64(b64);
}

/**
 *
 * Browser-friendly helper for encoding a byte array into a padded `base64`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64' encoding of the byte array.
 */
export function encodeToBase64(buffer: Iterable<number>): string {
  const bytes = new Uint8Array(buffer);
  const b64 =
    typeof Buffer === "function"
      ? Buffer.from(bytes).toString("base64")
      : btoa(bytes.reduce((s, b) => s + String.fromCharCode(b), ""));
  return b64;
}

/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64url' encoding of the byte array.
 */
export function encodeToBase64Url(buffer: Iterable<number>): string {
  const b64 = encodeToBase64(buffer);
  // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
}
