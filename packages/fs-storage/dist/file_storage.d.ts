import type { SessionData } from "@cubist-labs/cubesigner-sdk";
import { ExclusiveSessionManager } from "@cubist-labs/cubesigner-sdk";
/**
 * A session manager that refreshes and stores data in a JSON file
 */
export declare class JsonFileSessionManager extends ExclusiveSessionManager {
    #private;
    /**
     * Store session information.
     * @param {SessionData} data The session information to store
     * @return {Promise<void>}
     */
    store(data: SessionData): Promise<void>;
    /**
     * Retrieve session information.
     * @return {Promise<SessionData>} The session information
     */
    retrieve(): Promise<SessionData>;
    /**
     * Constructor.
     * @param {string} filePath The file path to use for storage
     */
    constructor(filePath: string);
}
