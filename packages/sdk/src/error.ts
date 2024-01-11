import { operations } from "./schema";

/**
 * Error response type, thrown on non-successful responses.
 */
export class ErrResponse extends Error {
  /** Operation that produced this error */
  readonly operation?: keyof operations;
  /** HTTP status code text (derived from `this.status`) */
  readonly statusText?: string;
  /** HTTP status code */
  readonly status?: number;
  /** HTTP response url */
  readonly url?: string;

  /**
   * @param {Partial<ErrResponse>} init Initializer
   */
  constructor(init: Partial<ErrResponse>) {
    super(init.message);
    Object.assign(this, init);
  }
}

/**
 * An error that is thrown when a session has expired
 */
export class SessionExpiredError extends ErrResponse {
  /**
   * Constructor.
   *
   * @param {operations} operation The operation that was attempted
   */
  constructor(operation?: keyof operations) {
    super({
      message: "Session has expired",
      status: 403,
      statusText: "Forbidden",
      operation,
    });
  }
}
