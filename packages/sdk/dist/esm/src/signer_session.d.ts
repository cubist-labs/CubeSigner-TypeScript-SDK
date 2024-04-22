import { CubeSignerClient } from "./client";
import { KeyInfo } from "./key";
import { SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export declare class SignerSessionInfo {
    #private;
    readonly purpose: string;
    /** Revoke this session */
    revoke(): Promise<void>;
    /**
     * Internal constructor.
     * @param {CubeSignerClient} cs CubeSigner instance to use when calling `revoke`
     * @param {string} sessionId The ID of the session; can be used for revocation but not for auth
     * @param {string} purpose Session purpose
     * @internal
     */
    constructor(cs: CubeSignerClient, sessionId: string, purpose: string);
}
/**
 * Signer session.
 * Extends {@link CubeSignerClient} and provides a few convenience methods on top.
 */
export declare class SignerSession extends CubeSignerClient {
    /**
     * Loads an existing signer session from storage.
     * @param {SignerSessionStorage} storage The session storage to use
     * @return {Promise<SingerSession>} New signer session
     */
    static loadSignerSession(storage: SignerSessionStorage): Promise<SignerSession>;
    /**
     * Constructor.
     * @param {SignerSessionManager} sessionMgr The session manager to use
     * @internal
     */
    constructor(sessionMgr: SignerSessionManager);
    /**
     * Returns the list of keys that this token grants access to.
     * @return {KeyInfo[]} The list of keys.
     */
    keys(): Promise<KeyInfo[]>;
}
