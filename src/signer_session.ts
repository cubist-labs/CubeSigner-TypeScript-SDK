import { CubeSignerClient } from "./client";
import { KeyInfo, toKeyInfo } from "./key";
import { SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";

/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export class SignerSessionInfo {
  readonly #csc: CubeSignerClient;
  readonly #sessionId: string;
  public readonly purpose: string;

  /** Revoke this session */
  async revoke() {
    await this.#csc.sessionRevoke(this.#sessionId);
  }

  // --------------------------------------------------------------------------
  // -- INTERNAL --------------------------------------------------------------
  // --------------------------------------------------------------------------

  /**
   * Internal constructor.
   * @param {CubeSignerClient} cs CubeSigner instance to use when calling `revoke`
   * @param {string} sessionId The ID of the session; can be used for revocation but not for auth
   * @param {string} purpose Session purpose
   * @internal
   */
  constructor(cs: CubeSignerClient, sessionId: string, purpose: string) {
    this.#csc = cs;
    this.#sessionId = sessionId;
    this.purpose = purpose;
  }
}

/**
 * Signer session.
 * Extends {@link CubeSignerClient} and provides a few convenience methods on top.
 */
export class SignerSession extends CubeSignerClient {
  /**
   * Loads an existing signer session from storage.
   * @param {SignerSessionStorage} storage The session storage to use
   * @return {Promise<SingerSession>} New signer session
   */
  static async loadSignerSession(storage: SignerSessionStorage): Promise<SignerSession> {
    const manager = await SignerSessionManager.loadFromStorage(storage);
    return new SignerSession(manager);
  }

  /**
   * Constructor.
   * @param {SignerSessionManager} sessionMgr The session manager to use
   * @internal
   */
  constructor(sessionMgr: SignerSessionManager) {
    super(sessionMgr);
  }

  /**
   * Returns the list of keys that this token grants access to.
   * @return {KeyInfo[]} The list of keys.
   */
  async keys(): Promise<KeyInfo[]> {
    const keys = await this.sessionKeysList();
    return keys.map((k) => toKeyInfo(k));
  }
}
