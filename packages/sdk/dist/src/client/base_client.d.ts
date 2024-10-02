import type { FetchResponseSuccessData, Op, Operation, SimpleOptions } from "../fetch";
import { EventEmitter } from "../events";
import { ErrResponse } from "../error";
import type { SessionData, SessionManager, SessionMetadata } from "./session";
import type { NewSessionResponse } from "../schema_types";
import type { EnvInterface } from "../env";
/** CubeSigner SDK package name */
export declare const NAME: string;
/** CubeSigner SDK version */
export declare const VERSION: string;
export type ErrorEvent = ErrResponse;
/** Event emitted when a request fails because of an expired/invalid session */
export declare class SessionExpiredEvent {
}
/** Event emitted when a request fails because user failed to answer an MFA challenge */
export declare class UserMfaFailedEvent extends ErrResponse {
}
type ClientEvents = {
    "user-mfa-failed": (ev: UserMfaFailedEvent) => void;
    "session-expired": (ev: SessionExpiredEvent) => void;
    error: (ev: ErrorEvent) => void;
};
type StaticClientSubclass<T> = {
    new (...args: ConstructorParameters<typeof BaseClient>): T;
} & typeof BaseClient;
/**
 * An event emitter for all clients
 * @deprecated
 */
export declare const ALL_EVENTS: EventEmitter<ClientEvents>;
/**
 * Implements a retry strategy and session refreshes
 */
export declare class BaseClient extends EventEmitter<ClientEvents> {
    #private;
    /** Information about the session contained within the client */
    sessionMeta: SessionMetadata;
    /** MUTABLE configuration */
    config: {
        updateRetryDelaysMs: number[];
    };
    /** Get the env */
    get env(): EnvInterface;
    /**
     * Construct a client with a session or session manager
     * @param {StaticClientSubclass<T>} this Allows this static method to return subtypes when invoked through them
     * @param {SessionManager | SessionData | string} session  The session (object or base64 string) or manager that will back this client
     * @return {T} A Client
     */
    static create<T>(this: StaticClientSubclass<T>, session: string | SessionManager | SessionData): Promise<T>;
    /**
     * @param {SessionMetadata} [sessionMeta] The initial session metadata
     * @param {SessionManager} [manager] The manager for the current session
     *
     * @internal
     */
    constructor(sessionMeta: SessionMetadata, manager: SessionManager);
    /** The organization ID */
    get orgId(): string;
    /**
     * Executes an op using the state of the client (auth headers & org_id) with retries
     *
     * @internal
     * @param {Op<T>} op The API operation you wish to perform
     * @param {SimpleOptions<T>} opts The parameters for the operation
     * @return {FetchResponseSuccessData<T>} A promise for the successful result (errors will be thrown)
     */
    exec<T extends Operation>(op: Op<T>, opts: OmitAutoParams<SimpleOptions<T>>): Promise<FetchResponseSuccessData<T>>;
}
/**
 * Upgrade a session response into a full SessionData by incorporating
 * elements of an existing SessionData
 * @param {SessionData} meta An existing SessionData
 * @param {NewSessionResponse} info A new session created via the API
 * @param {object} ctx Additional manual overrides
 * @return {SessionData}
 */
export declare function signerSessionFromSessionInfo(meta: SessionMetadata, info: NewSessionResponse, ctx: Partial<{
    purpose: string;
    role_id: string;
}>): SessionData;
type DeepOmit<A, B> = [A, B] extends [object, object] ? {
    [K in keyof A as K extends keyof B ? A[K] extends B[K] ? K : never : never]?: K extends keyof B ? DeepOmit<A[K], B[K]> : never;
} & {
    [K in keyof A as K extends keyof B ? (B[K] extends A[K] ? never : K) : K]: K extends keyof B ? DeepOmit<A[K], B[K]> : A[K];
} : A;
export type OmitAutoParams<O> = DeepOmit<O, {
    baseUrl: string;
    params: {
        path: {
            org_id: string;
        };
    };
}> & {
    params?: {
        path?: Record<string, unknown>;
    };
};
export {};
//# sourceMappingURL=base_client.d.ts.map