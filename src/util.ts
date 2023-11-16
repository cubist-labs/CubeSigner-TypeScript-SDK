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

type ResponseType<D, T> = { data?: D; error?: T; response?: Response };

/**
 * Error response type, thrown on non-successful responses.
 */
export class ErrResponse extends Error {
  /** Description */
  readonly description?: string;
  /** HTTP status code text (derived from `this.status`) */
  readonly statusText?: string;
  /** HTTP status code */
  readonly status?: number;

  /**
   * Constructor
   * @param {Partial<ErrResponse>} init Initializer
   */
  constructor(init: Partial<ErrResponse>) {
    super(init.message);
    Object.assign(this, init);
  }
}

/**
 * Throw if on error response. Otherwise, return the response data.
 * @param {ResponseType} resp The response to check
 * @param {string} description Description to include in the thrown error
 * @return {D} The response data.
 * @internal
 */
export function assertOk<D, T>(resp: ResponseType<D, T>, description?: string): D {
  if (resp.error) {
    throw new ErrResponse({
      description,
      message: (resp.error as any).message, // eslint-disable-line @typescript-eslint/no-explicit-any
      statusText: resp.response?.statusText,
      status: resp.response?.status,
    });
  }
  if (resp.data === undefined) {
    throw new Error("Response data is undefined");
  }
  return resp.data;
}

/**
 * Browser-friendly helper for decoding a 'base64url'-encoded string into a byte array.
 *
 * @param {string} b64url The 'base64url'-encoded string to decode
 * @return {Uint8Array} Decoded byte array
 */
export function decodeBase64Url(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").replace(/=*$/g, "");

  // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
  return typeof Buffer === "function"
    ? Buffer.from(b64, "base64")
    : Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Browser-friendly helper for encoding a byte array into a 'base64url`-encoded string.
 *
 * @param {Iterable<number>} buffer The byte array to encode
 * @return {string} The 'base64url' encoding of the byte array.
 */
export function encodeToBase64Url(buffer: Iterable<number>): string {
  const bytes = new Uint8Array(buffer);

  // NOTE: there is no "base64url" encoding in the "buffer" module for the browser (unlike in node.js)
  const b64 =
    typeof Buffer === "function"
      ? Buffer.from(bytes).toString("base64")
      : btoa(bytes.reduce((s, b) => s + String.fromCharCode(b), ""));

  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=*$/g, "");
}
