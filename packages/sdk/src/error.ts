import type { CsErrCode } from "./schema_types";
import type { operations } from "./schema";

/**
 * Error codes corresponding to all different "MFA failed" error responses
 */
const mfaErrorCodes: CsErrCode[] = [
  "MfaChallengeExpired",
  "MfaDisallowedApprover",
  "MfaDisallowedIdentity",
  "MfaTypeNotAllowed",
  "MfaTotpBadCode",
  "MfaTotpRateLimit",
  "MfaTotpBadConfiguration",
  "TotpNotConfigured",
  "FidoVerificationFailed",
  "UserRoleUnprivileged",
];

/**
 * Opcodes corresponding to all different MFA approve/reject requests
 */
const mfaOpCodes: (keyof operations)[] = [
  "mfaVoteCs",
  "userResetTotpComplete",
  "mfaVoteTotp",
  "mfaVoteFidoComplete",
];

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
  /** CubeSigner error code */
  readonly errorCode?: CsErrCode;
  /** Request ID */
  readonly requestId?: string;

  /**
   * @param {Partial<ErrResponse>} init Initializer
   */
  constructor(init: Partial<ErrResponse>) {
    super(init.message);
    Object.assign(this, init);
  }

  /**
   * Checks whether the root cause of an {@link ErrResponse} is an invalid session.
   *
   * Examples include:
   * - the session has expired
   * - the session has been revoked
   * - provided auth token is invalid/malformed/expired
   *
   * @return {boolean} Whether the response matches one of several different "invalid session" responses.
   */
  isSessionExpiredError(): boolean {
    return this.errorCode === undefined
      ? this.status === 403 && this.requestId === undefined
      : invalidSessionErrorCodes.includes(this.errorCode);
  }

  /**
   * Checks whether the root cause of an {@link ErrResponse} is the user failing to answer an MFA challenge.
   *
   * Examples include:
   * - user provides a bad TOTP code
   * - user is TOTP-rate-limited (because of too many failed attempts)
   * - MFA challenge expired
   * - FIDO challenge verification failed
   *
   * @return {boolean} Whether the error was caused by the user failing to authenticate with MFA
   */
  isUserMfaError(): boolean {
    return (
      this.status === 403 &&
      (this.operation === undefined || mfaOpCodes.includes(this.operation)) &&
      (this.errorCode === undefined || mfaErrorCodes.includes(this.errorCode))
    );
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
      errorCode: "SessionExpired",
    });
  }
}

/**
 * Error codes corresponding to all different "invalid session" error responses
 */
const invalidSessionErrorCodes: CsErrCode[] = [
  "SessionExpired",
  "SessionRevoked",
  "SessionNotFound",
  "SessionInvalidAuthToken",
  "SessionInvalidEpochToken",
  "SessionInvalidRefreshToken",
  "SessionAuthTokenExpired",
  "SessionRefreshTokenExpired",
  "SessionPossiblyStolenToken",
];
