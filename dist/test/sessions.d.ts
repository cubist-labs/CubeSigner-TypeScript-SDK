import { EnvInterface } from "../src/env";
/**
 * Defaults.
 */
export declare class CubeSignerDefaults {
    /** Default signer-session.json file path
     * @return {string} Default signer-session.json file path
     */
    static signerSessionFile(): string;
    /** Default management-session.json file path
     * @return {string} Default management-session.json file path
     */
    static managementSessionFile(): string;
}
/** JSON representation of our "management session" file format */
export interface ManagementSession {
    email: string;
    id_token: string;
    access_token: string;
    refresh_token: string;
    expiration: string;
    env: {
        ["Dev-CubeSignerStack"]: EnvInterface;
    };
}
/** JSON representation of our "signer session" file format */
export interface SignerSession {
    org_id: string;
    role_id: string;
    purpose: string;
    token: string;
    env: {
        ["Dev-CubeSignerStack"]: EnvInterface;
    };
}
