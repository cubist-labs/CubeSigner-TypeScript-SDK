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
 *
 * @deprecated
 */
export declare const ALL_EVENTS: EventEmitter<ClientEvents>;
/**
 * Client configuration options.
 */
export interface ClientConfig {
    /** Update retry delays (in milliseconds) */
    updateRetryDelaysMs: number[];
    /** Custom origin to set (NOTE that if running in a browser, the browser will overwrite this) */
    origin?: string;
}
/**
 * Implements a retry strategy and session refreshes
 */
export declare class BaseClient extends EventEmitter<ClientEvents> {
    #private;
    /** Information about the session contained within the client */
    sessionMeta: SessionMetadata;
    /** Session persistence */
    protected sessionManager: SessionManager;
    /** MUTABLE configuration. */
    config: ClientConfig;
    /** @returns The env */
    get env(): EnvInterface;
    /**
     * Construct a client with a session or session manager
     *
     * @param this Allows this static method to return subtypes when invoked through them
     * @param session The session (object or base64 string) or manager that will back this client
     * @param targetOrgId The ID of the organization this client should operate on. Defaults to
     *   the org id from the supplied session. The only scenario in which it makes sense to use
     *   a {@link targetOrgId} different from the session org id is if {@link targetOrgId} is a
     *   child organization of the session organization.
     * @returns A Client
     */
    static create<T>(this: StaticClientSubclass<T>, session: string | SessionManager | SessionData, targetOrgId?: string): Promise<T>;
    /**
     * @param sessionMeta The initial session metadata
     * @param manager The manager for the current session
     * @param targetOrgId The ID of the organization this client should operate on. Defaults to
     *   the org id from the supplied session. The only scenario in which it makes sense to use
     *   a {@link targetOrgId} different from the session org id is if {@link targetOrgId} is a
     *   child organization of the session organization.
     *
     * @internal
     */
    constructor(sessionMeta: SessionMetadata, manager: SessionManager, targetOrgId?: string);
    /** @returns The organization ID. If the org ID was set explicitly, it returns that ID; otherwise it returns the session's organization ID. */
    get orgId(): string;
    /**
     * Executes an op using the state of the client (auth headers & org_id) with retries
     *
     * @internal
     * @param op The API operation you wish to perform
     * @param opts The parameters for the operation
     * @returns A promise for the successful result (errors will be thrown)
     */
    exec<T extends Operation>(op: Op<T>, opts: OmitAutoParams<SimpleOptions<T>>): Promise<FetchResponseSuccessData<T>>;
}
/**
 * Upgrade a session response into a full SessionData by incorporating
 * elements of an existing SessionData
 *
 * @param meta An existing SessionData
 * @param info A new session created via the API
 * @param ctx Additional manual overrides
 * @returns SessionData with new information from info and ctx
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