import type { SessionData, SessionManager, SessionMetadata } from "@cubist-labs/cubesigner-sdk";
import { EventEmitter } from "@cubist-labs/cubesigner-sdk";
type BrowserStorageEvents = {
    logout(): void;
    login(): void;
};
/**
 * A manager that persists into browser storage and uses weblocks to safely perform refreshes
 */
export declare class BrowserStorageManager extends EventEmitter<BrowserStorageEvents> implements SessionManager {
    #private;
    /**
     *
     * @param key The storage key to use
     * @param storage The storage object to use (defaults to localStorage)
     */
    constructor(key: string, storage?: Storage);
    /**
     * Loads the metadata for a session from storage
     *
     * @returns The session metadata
     */
    metadata(): Promise<SessionMetadata>;
    /**
     * Loads the current access token from storage
     *
     * @returns The access token
     */
    token(): Promise<string>;
    /**
     * Directly set the session (updating all consumers of the session storage)
     *
     * @param session The new session
     */
    setSession(session?: SessionData): Promise<void>;
}
export {};
//# sourceMappingURL=index.d.ts.map