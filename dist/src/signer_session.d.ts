import { CubeSigner, Key, KeyInfo, MfaReceipt, IdentityProof } from ".";
import { components, paths } from "./client";
import { JsonMap } from "./util";
import { NewSessionResponse, SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";
export type EvmSignRequest = paths["/v1/org/{org_id}/eth1/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2SignRequest = paths["/v1/org/{org_id}/eth2/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2StakeRequest = paths["/v1/org/{org_id}/eth2/stake"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2UnstakeRequest = paths["/v1/org/{org_id}/eth2/unstake/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type BlobSignRequest = paths["/v1/org/{org_id}/blob/sign/{key_id}"]["post"]["requestBody"]["content"]["application/json"];
export type BtcSignRequest = paths["/v0/org/{org_id}/btc/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type SolanaSignRequest = paths["/v0/org/{org_id}/solana/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type AvaSignRequest = paths["/v0/org/{org_id}/ava/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type EvmSignResponse = components["responses"]["Eth1SignResponse"]["content"]["application/json"];
export type Eth2SignResponse = components["responses"]["Eth2SignResponse"]["content"]["application/json"];
export type Eth2StakeResponse = components["responses"]["StakeResponse"]["content"]["application/json"];
export type Eth2UnstakeResponse = components["responses"]["UnstakeResponse"]["content"]["application/json"];
export type BlobSignResponse = components["responses"]["BlobSignResponse"]["content"]["application/json"];
export type BtcSignResponse = components["responses"]["BtcSignResponse"]["content"]["application/json"];
export type SolanaSignResponse = components["responses"]["SolanaSignResponse"]["content"]["application/json"];
export type MfaRequestInfo = components["responses"]["MfaRequestInfo"]["content"]["application/json"];
export type AvaSignResponse = components["responses"]["AvaSignResponse"]["content"]["application/json"];
export type AcceptedResponse = components["schemas"]["AcceptedResponse"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
export type BtcSignatureKind = components["schemas"]["BtcSignatureKind"];
/** MFA request kind */
export type MfaType = components["schemas"]["MfaType"];
/** Ava P- or X-chain transaction */
export type AvaTx = {
    P: AvaPChainTx;
} | {
    X: AvaXChainTx;
};
/** Ava P-chain transaction */
export type AvaPChainTx = {
    AddPermissionlessValidator: JsonMap;
} | {
    AddSubnetValidator: JsonMap;
} | {
    AddValidator: JsonMap;
} | {
    CreateChain: JsonMap;
} | {
    CreateSubnet: JsonMap;
} | {
    Export: JsonMap;
} | {
    Import: JsonMap;
};
/** Ava X-chain transaction */
export type AvaXChainTx = {
    Base: JsonMap;
} | {
    Export: JsonMap;
} | {
    Import: JsonMap;
};
type SignFn<U> = (headers?: HeadersInit) => Promise<U | AcceptedResponse>;
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
export declare class SignResponse<U> {
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
    /** @return {U} The signed data */
    data(): U;
    /**
     * Approves the MFA request using a given session and a TOTP code.
     *
     * @param {SignerSession} session Signer session to use
     * @param {string} code 6-digit TOTP code
     * @return {SignResponse<U>} The result of signing with the approval
     */
    approveTotp(session: SignerSession, code: string): Promise<SignResponse<U>>;
    /**
     * Approves the MFA request using a given `CubeSigner` instance (i.e., its management session).
     *
     * @param {CubeSigner} cs CubeSigner whose session to use
     * @return {SignResponse<U>} The result of signing with the approval
     */
    approve(cs: CubeSigner): Promise<SignResponse<U>>;
    /**
     * @param {MfaReceipt} mfaReceipt The MFA receipt
     * @return {Promise<SignResponse<U>>} The result of signing after MFA approval
     */
    signWithMfaApproval(mfaReceipt: MfaReceipt): Promise<SignResponse<U>>;
    /**
     * Constructor.
     *
     * @param {SignFn} signFn The signing function that this response is from.
     *                        This argument is used to resend requests with
     *                        different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
     *                                    client.
     */
    constructor(signFn: SignFn<U>, resp: U | AcceptedResponse);
    /**
     * MFA receipt to attach.
     *
     * @param {MfaReceipt} mfaReceipt MFA receipt
     * @return {HeadersInit} Headers
     */
    static getMfaHeaders(mfaReceipt: MfaReceipt): HeadersInit;
}
/** Signer session info. Can only be used to revoke a token, but not for authentication. */
export declare class SignerSessionInfo {
    #private;
    readonly purpose: string;
    /** Revoke this token */
    revoke(): Promise<void>;
    /**
     * Internal constructor.
     * @param {CubeSigner} cs CubeSigner instance to use when calling `revoke`
     * @param {string} orgId Organization ID
     * @param {string} roleId Role ID
     * @param {string} hash The hash of the token; can be used for revocation but not for auth
     * @param {string} purpose Session purpose
     * @internal
     */
    constructor(cs: CubeSigner, orgId: string, roleId: string, hash: string, purpose: string);
}
/** Signer session. */
export declare class SignerSession {
    #private;
    sessionMgr: SignerSessionManager;
    /** Org id */
    get orgId(): string;
    /**
     * Returns the list of keys that this token grants access to.
     * @return {Key[]} The list of keys.
     */
    keys(): Promise<KeyInfo[]>;
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param {string} mfaId The MFA request to approve
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
     */
    totpApprove(mfaId: string, code: string): Promise<MfaRequestInfo>;
    /**
     * Get a pending MFA request by its id.
     * @param {CubeSigner} cs Management session to use (this argument will be removed in future versions)
     * @param {string} mfaId The id of the MFA request.
     * @return {Promise<MfaRequestInfo>} The MFA request.
     */
    getMfaInfo(cs: CubeSigner, mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Submit an EVM sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EvmSignRequest} req What to sign.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature
     */
    signEvm(key: Key | string, req: EvmSignRequest): Promise<SignResponse<EvmSignResponse>>;
    /**
     * Submit an 'eth2' sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    signEth2(key: Key | string, req: Eth2SignRequest): Promise<SignResponse<Eth2SignResponse>>;
    /**
     * Sign a stake request.
     * @param {Eth2StakeRequest} req The request to sign.
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
     */
    stake(req: Eth2StakeRequest): Promise<SignResponse<Eth2StakeResponse>>;
    /**
     * Sign an unstake request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    unstake(key: Key | string, req: Eth2UnstakeRequest): Promise<SignResponse<Eth2UnstakeResponse>>;
    /**
     * Sign a raw blob.
     * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
     * @param {BlobSignRequest} req What to sign
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
     */
    signBlob(key: Key | string, req: BlobSignRequest): Promise<SignResponse<BlobSignResponse>>;
    /**
     * Sign a bitcoin message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    signBtc(key: Key | string, req: BtcSignRequest): Promise<SignResponse<BtcSignResponse>>;
    /**
     * Sign a solana message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    signSolana(key: Key | string, req: SolanaSignRequest): Promise<SignResponse<SolanaSignResponse>>;
    /**
     * Sign an Avalanche P- or X-chain message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    signAva(key: Key | string, tx: AvaTx): Promise<SignResponse<AvaSignResponse>>;
    /**
     * Obtain a proof of authentication.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    proveIdentity(): Promise<IdentityProof>;
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
     * Static method for revoking a token (used both from {SignerSession} and {SignerSessionInfo}).
     * @param {CubeSigner} cs CubeSigner instance
     * @param {string} orgId Organization ID
     * @param {string} roleId Role ID
     * @param {string} sessionId Signer session ID
     * @internal
     */
    static revoke(cs: CubeSigner, orgId: string, roleId: string, sessionId: string): Promise<void>;
}
export {};
