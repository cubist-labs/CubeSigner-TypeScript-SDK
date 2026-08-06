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
export function pathJoin(dir: string, file: string): string {
  const sep = globalThis?.process?.platform === "win32" ? "\\" : "/";
  return `${dir}${sep}${file}`;
}

// eslint-disable-next-line no-restricted-globals -- intentionally checking for Buffer before using it
const nodeBuffer = typeof Buffer === "function" ? Buffer : undefined;

/**
 * Browser-friendly helper for decoding a 'base64'-encoded string into a byte array.
 *
 * @param b64 The 'base64'-encoded string to decode
 * @returns Decoded byte array
 */
export function decodeBase64(b64: string): Uint8Array {
  return nodeBuffer
    ? nodeBuffer.from(b64, "base64")
    : Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Browser-friendly helper for decoding a 'base64url'-encoded string into a byte array.
 *
 * @param b64url The 'base64url'-encoded string to decode
 * @returns Decoded byte array
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
 * @param buffer The byte array to encode
 * @returns The 'base64' encoding of the byte array.
 */
export function encodeToBase64(buffer: Iterable<number> | ArrayBuffer): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer);
  const b64 = nodeBuffer
    ? nodeBuffer.from(bytes).toString("base64")
    : btoa(bytes.reduce((s, b) => s + String.fromCharCode(b), ""));
  return b64;
}

/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param buffer The byte array to encode
 * @returns The 'base64url' encoding of the byte array.
 */
export function encodeToBase64Url(buffer: Iterable<number> | ArrayBuffer): string {
  const b64 = encodeToBase64(buffer);
  // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
}

/**
 * Sleeps for `ms` milliseconds.
 *
 * @param ms Milliseconds to sleep
 * @returns A promise that is resolved after `ms` milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts a string or a uint8 array into a hex string. Strings are encoded in UTF-8 before
 * being converted to hex.
 *
 * @param message The input
 * @returns Hex string prefixed with "0x"
 */
export function encodeToHex(message: string | Uint8Array): string {
  const bytes = typeof message === "string" ? new TextEncoder().encode(message) : message;
  return "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Decodes a hex string into a byte array.
 *
 * @param hex The hex string to decode, with or without a "0x" prefix
 * @returns Decoded byte array
 */
export function decodeFromHex(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;

  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid hexadecimal string length, must be even: ${clean.length}`);
  }

  if (!/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error(`Invalid hexadecimal character in: '${clean}'`);
  }

  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
