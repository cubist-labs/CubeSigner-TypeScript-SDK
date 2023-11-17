import { CubeSigner, MfaReceipt, KeyInfo } from ".";
import { CubeSignerClient } from "./client";
import { AcceptedResponse, NewSessionResponse } from "./schema_types";
import { SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";
type Response<U> = U | AcceptedResponse;
type RequestFn<U> = (headers?: HeadersInit) => Promise<Response<U>>;
type MapFn<U, V> = (u: U) => V;
/**
 * Takes a {@link Response<U>} and a {@link MapFn<U, V>} function and returns
 * a {@link Response<V>} that maps the value of the original response when its status code is 200.
 *
 * @param {Response<U>} resp Original response
 * @param {Map<U, V>} mapFn Map to apply to the response value when its status code is 200.
 * @return {Response<V>} Response whose value for status code 200 is mapped from U to V
 */
export declare function mapResponse<U, V>(resp: Response<U>, mapFn: MapFn<U, V>): Response<V>;
export interface MfaRequired {
    /** Org id */
    org_id: string;
    /** MFA request id */
    id: string;
    /** Optional MFA session */
    session?: NewSessionResponse | null;
}
/**
 * A response of a CubeSigner request.
 */
export declare class CubeSignerResponse<U> {
    #private;
    /** @return {string} The MFA id associated with this request */
    mfaId(): string;
    /** @return {boolean} True if this request requires an MFA approval */
    requiresMfa(): boolean;
    /**
     * Returns session information to use for any MFA approval requests (if any was included in the response).
     * @return {ClientSessionInfo | undefined}
     */
    mfaSessionInfo(): NewSessionResponse | undefined;
    /** @return {U} The response data, if no MFA is required */
    data(): U;
    /**
     * Approves the MFA request using a given session and a TOTP code.
     *
     * @param {SignerSession} session Signer session to use
     * @param {string} code 6-digit TOTP code
     * @return {CubeSignerResponse<U>} The result of signing with the approval
     */
    approveTotp(session: SignerSession, code: string): Promise<CubeSignerResponse<U>>;
    /**
     * Approves the MFA request using a given `CubeSignerClient` instance (i.e., its session).
     *
     * @param {CubeSigner} cs CubeSigner whose session to use
     * @return {CubeSignerResponse<U>} The result of signing with the approval
     */
    approve(cs: CubeSigner): Promise<CubeSignerResponse<U>>;
    /**
     * @param {MfaReceipt} mfaReceipt The MFA receipt
     * @return {Promise<CubeSignerResponse<U>>} The result of signing after MFA approval
     */
    signWithMfaApproval(mfaReceipt: MfaReceipt): Promise<CubeSignerResponse<U>>;
    /**
     * Constructor.
     *
     * @param {RequestFn} requestFn
     *    The signing function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI client.
     */
    constructor(requestFn: RequestFn<U>, resp: U | AcceptedResponse);
    /**
     * Static constructor.
     * @param {RequestFn} requestFn
     *    The request function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<CubeSignerResponse<U>>} New instance of this class.
     */
    static create<U>(requestFn: RequestFn<U>, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<U>>;
    /**
     * Returns HTTP headers containing a given MFA receipt.
     *
     * @param {MfaReceipt} mfaReceipt MFA receipt
     * @return {HeadersInit} Headers including that receipt
     */
    static getMfaHeaders(mfaReceipt?: MfaReceipt): HeadersInit | undefined;
}
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
 *
 * @deprecated Use {@link CubeSignerClient} instead.
 */
export declare class SignerSession {
    #private;
    /** Deprecated */
    get sessionMgr(): SignerSessionManager;
    /** Org id */
    get orgId(): string;
    /**
     * Returns the list of keys that this token grants access to.
     * @return {KeyInfo[]} The list of keys.
     */
    keys(): Promise<KeyInfo[]>;
    /** Approve a pending MFA request using TOTP. */
    get totpApprove(): (mfaId: string, code: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: Record<string, unknown> | null | undefined;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ("CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /** Initiate approval of an existing MFA request using FIDO. */
    get fidoApproveStart(): (mfaId: string) => Promise<import("./mfa").MfaFidoChallenge>;
    /** Get a pending MFA request by its id. */
    get getMfaInfo(): (mfaId: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: Record<string, unknown> | null | undefined;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ("CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /** Submit an EVM sign request. */
    get signEvm(): (key: string | import("./key").Key, req: {
        chain_id: number;
        tx: Record<string, never>;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        rlp_signed_tx: string;
    }>>;
    /** Submit an 'eth2' sign request. */
    get signEth2(): (key: string | import("./key").Key, req: {
        eth2_sign_request: Record<string, never>;
        network: "mainnet" | "prater" | "goerli" | "holesky";
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        signature: string;
    }>>;
    /** Sign a stake request. */
    get stake(): (req: {
        chain_id: number;
        deposit_type: "Canonical" | "Wrapper";
        staking_amount_gwei?: number | undefined;
        unsafe_conf?: {
            deposit_contract_addr?: string | null | undefined;
            genesis_fork_version?: string | null | undefined;
        } | null | undefined;
        validator_key?: string | null | undefined;
        withdrawal_addr: string;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        created_validator_key_id: string;
        deposit_tx: {
            chain_id: number;
            deposit_txn: Record<string, never>;
            new_validator_pk: string;
        };
    }>>;
    /** Sign an unstake request. */
    get unstake(): (key: string | import("./key").Key, req: {
        epoch?: string | null | undefined;
        fork: {
            current_version: string;
            epoch: string;
            previous_version: string;
        };
        genesis_data: {
            genesis_fork_version: string;
            genesis_time: string;
            genesis_validators_root: string;
        };
        network: "mainnet" | "prater" | "goerli" | "holesky";
        validator_index: string;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        message: {
            epoch: string;
            validator_index: string;
        };
        signature: string;
    }>>;
    /** Sign a raw blob.*/
    get signBlob(): (key: string | import("./key").Key, req: {
        message_base64: string;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        signature: string;
    }>>;
    /** Sign a bitcoin message. */
    get signBtc(): (key: string | import("./key").Key, req: {
        sig_kind: {
            Segwit: {
                input_index: number;
                script_code: string;
                sighash_type: "All" | "None" | "Single" | "AllPlusAnyoneCanPay" | "NonePlusAnyoneCanPay" | "SinglePlusAnyoneCanPay";
                value: number;
            };
        };
        tx: Record<string, never>;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        signature: string;
    }>>;
    /** Sign a solana message. */
    get signSolana(): (key: string | import("./key").Key, req: {
        message_base64: string;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        signature: string;
    }>>;
    /** Sign an Avalanche P- or X-chain message. */
    get signAva(): (key: string | import("./key").Key, tx: import("./schema_types").AvaTx, mfaReceipt?: MfaReceipt | undefined) => Promise<CubeSignerResponse<{
        signature: string;
    }>>;
    /**
     * Obtain a proof of authentication.
     */
    get proveIdentity(): () => Promise<{
        aud?: string | null | undefined;
        email: string;
        exp_epoch: number;
        identity?: {
            iss: string;
            sub: string;
        } | null | undefined;
        user_info?: {
            configured_mfa: ({
                type: "totp";
            } | {
                id: string;
                name: string;
                type: "fido";
            })[];
            initialized: boolean;
            user_id: string;
        } | null | undefined;
    } & {
        id: string;
    }>;
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
}
export {};
