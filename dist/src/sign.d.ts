import { CubeSigner, Key, SignerSession } from ".";
import { components, paths } from "./client";
export type Eth1SignRequest = paths["/v1/org/{org_id}/eth1/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2SignRequest = paths["/v1/org/{org_id}/eth2/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2StakeRequest = paths["/v1/org/{org_id}/eth2/stake"]["post"]["requestBody"]["content"]["application/json"];
export type Eth2UnstakeRequest = paths["/v1/org/{org_id}/eth2/unstake/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type BlobSignRequest = paths["/v1/org/{org_id}/blob/sign/{key_id}"]["post"]["requestBody"]["content"]["application/json"];
export type BtcSignRequest = paths["/v0/org/{org_id}/btc/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type SolanaSignRequest = paths["/v1/org/{org_id}/solana/sign/{pubkey}"]["post"]["requestBody"]["content"]["application/json"];
export type Eth1SignResponse = components["responses"]["Eth1SignResponse"]["content"]["application/json"];
export type Eth2SignResponse = components["responses"]["Eth2SignResponse"]["content"]["application/json"];
export type Eth2StakeResponse = components["responses"]["StakeResponse"]["content"]["application/json"];
export type Eth2UnstakeResponse = components["responses"]["UnstakeResponse"]["content"]["application/json"];
export type BlobSignResponse = components["responses"]["BlobSignResponse"]["content"]["application/json"];
export type BtcSignResponse = components["responses"]["BtcSignResponse"]["content"]["application/json"];
export type SolanaSignResponse = components["responses"]["SolanaSignResponse"]["content"]["application/json"];
export type MfaRequestInfo = components["responses"]["MfaRequestInfo"]["content"]["application/json"];
export type AcceptedResponse = components["schemas"]["AcceptedResponse"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
export type BtcSignatureKind = components["schemas"]["BtcSignatureKind"];
type SignFn<U> = (headers?: HeadersInit) => Promise<U | AcceptedResponse>;
/**
 * A response of a signing request.
 */
export declare class SignResponse<U> {
    #private;
    /** @return {boolean} True if this signing request requires an MFA approval */
    requiresMfa(): boolean;
    /** @return {U} The signed data */
    data(): U;
    /**
     * Approves the MFA request.
     *
     * Note: This only works for MFA requests that require a single approval.
     *
     * @return {SignResponse<U>} The result of signing with the approval
     */
    approve(): Promise<SignResponse<U>>;
    /**
     * Constructor.
     *
     * @param {CubeSigner} cs The CubeSigner instance to use for requests
     * @param {string} orgId The org id of the corresponding signing request
     * @param {string} roleId The role id of the corresponding signing request
     * @param {SignFn} signFn The signing function that this response is from.
     *                        This argument is used to resend requests with
     *                        different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI
     *                                    client.
     */
    constructor(cs: CubeSigner, orgId: string, roleId: string, signFn: SignFn<U>, resp: U | AcceptedResponse);
}
/**
 * Wrapper around sign operations.
 */
export declare class Sign {
    #private;
    /**
     * Submit an 'eth1' sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth1SignRequest} req What to sign.
     * @return {Promise<Eth1SignResponse | AcceptedResponse>} Signature
     */
    eth1(key: Key | string, req: Eth1SignRequest): Promise<SignResponse<Eth1SignResponse>>;
    /**
     * Submit an 'eth2' sign request.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    eth2(key: Key | string, req: Eth2SignRequest): Promise<SignResponse<Eth2SignResponse>>;
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
    blob(key: Key | string, req: BlobSignRequest): Promise<SignResponse<BlobSignResponse>>;
    /**
     * Sign a bitcoin message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    btc(key: Key | string, req: BtcSignRequest): Promise<SignResponse<BtcSignResponse>>;
    /**
     * Sign a solana message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    solana(key: Key | string, req: SolanaSignRequest): Promise<SignResponse<SolanaSignResponse>>;
    /**
     * Constructor.
     *
     * @param {string} orgId Organization ID
     * @param {SignerSession} ss The signer session to use for signing requests
     */
    constructor(orgId: string, ss: SignerSession);
}
export {};
