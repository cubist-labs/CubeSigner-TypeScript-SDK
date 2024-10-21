import type { ApiClient } from ".";

/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export class SignerSessionInfo {
  readonly #apiClient: ApiClient;
  readonly #sessionId: string;
  public readonly purpose: string;

  /** Revoke this session */
  async revoke() {
    await this.#apiClient.sessionRevoke(this.#sessionId);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Internal constructor.
   * @param {ApiClient} apiClient The API client to use.
   * @param {string} sessionId The ID of the session; can be used for revocation but not for auth
   * @param {string} purpose Session purpose
   * @internal
   */
  constructor(apiClient: ApiClient, sessionId: string, purpose: string) {
    this.#apiClient = apiClient;
    this.#sessionId = sessionId;
    this.purpose = purpose;
  }
}
