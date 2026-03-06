import type { SessionData } from "@cubist-labs/cubesigner-sdk";
import { ExclusiveSessionManager } from "@cubist-labs/cubesigner-sdk";
/**
 * A session manager that refreshes and stores data in a JSON file
 */
export declare class JsonFileSessionManager extends ExclusiveSessionManager {
    #private;
    /**
     * Store session information.
     *
     * @param data The session information to store
     */
    store(data: SessionData): Promise<void>;
    /**
     * Retrieve session information.
     *
     * @returns The session information
     */
    retrieve(): Promise<SessionData>;
    /**
     * Constructor.
     *
     * @param filePath The file path to use for storage
     */
    constructor(filePath: string);
}
//# sourceMappingURL=file_storage.d.ts.map