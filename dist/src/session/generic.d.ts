import { EnvInterface } from "../env";
import { ClientSessionInfo } from "../signer_session";
/** Generic session interface. */
export interface Session {
    /** Revoke the session. */
    revoke: () => Promise<void>;
    /** Refresh the session token. */
    refresh: () => Promise<void>;
    /** Get the authorization token. */
    getAuthToken: () => Promise<string>;
}
/** JSON representation of our "management session" file format */
export interface ManagementSessionObject {
    /** The email address of the user */
    email: string;
    /** The ID token */
    id_token: string;
    /** The access token */
    access_token: string;
    /** The refresh token */
    refresh_token: string;
    /** The expiration time of the access token */
    expiration: string;
}
/** JSON representation of our "signer session" file format */
export interface SignerSessionObject {
    /** The organization ID */
    org_id: string;
    /** The role ID */
    role_id: string;
    /** The purpose of the session token */
    purpose: string;
    /** The token to include in Authorization header */
    token: string;
    /** Session info */
    session_info: ClientSessionInfo;
}
export interface HasEnv {
    /** The environment */
    env: {
        ["Dev-CubeSignerStack"]: EnvInterface;
    };
}
export interface ManagementSessionFile extends ManagementSessionObject, HasEnv {
}
export interface SignerSessionFile extends SignerSessionObject, HasEnv {
}
