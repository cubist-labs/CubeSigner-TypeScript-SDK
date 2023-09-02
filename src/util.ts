import * as path from "path";

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
