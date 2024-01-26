import { SessionStorage } from "@cubist-labs/cubesigner-sdk";
/** Stores session information in a JSON file */
export declare class JsonFileSessionStorage<U> implements SessionStorage<U> {
    #private;
    /**
     * Store session information.
     * @param {U} data The session information to store
     * @return {Promise<void>}
     */
    save(data: U): Promise<void>;
    /**
     * Retrieve session information.
     * @return {Promise<U>} The session information
     */
    retrieve(): Promise<U>;
    /**
     * Constructor.
     * @param {string} filePath The file path to use for storage
     */
    constructor(filePath: string);
}
