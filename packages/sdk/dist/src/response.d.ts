import type { EnvInterface, MfaReceipts } from ".";
import { CubeSignerClient } from ".";
import type { AcceptedResponse, NewSessionResponse } from "./schema_types";
/**
 * Response type, which can be either a value of type {@link U}
 * or {@link AcceptedResponse} (status code 202) which requires MFA.
 */
export type Response<U> = U | AcceptedResponse;
/**
 * Request function which optionally takes additional headers
 * (which, for example, can be used to attach an MFA receipt).
 */
export type RequestFn<U> = (headers?: HeadersInit) => Promise<Response<U>>;
/**
 * Map function occasionally used to map a response from the API into a higher-level type.
 */
export type MapFn<U, V> = (u: U) => V;
/**
 * Take a {@link Response<U>} and a {@link MapFn<U, V>} function and return
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
    /** @return {string} The MFA id associated with this request (if any) */
    mfaId(): string;
    /** @return {boolean} True if this request requires an MFA approval */
    requiresMfa(): boolean;
    /**
     * Return session information to use for any MFA approval requests (if any was included in the response).
     * @return {Promise<ClientSessionInfo | undefined>}
     */
    mfaClient(): Promise<CubeSignerClient | undefined>;
    /** @return {U} The response data, if no MFA is required */
    data(): U;
    /**
     * Approve the MFA request using a given session and a TOTP code.
     *
     * @param {CubeSignerClient} client CubeSigner whose session to use
     * @param {string} code 6-digit TOTP code
     * @return {CubeSignerResponse<U>} The result of resubmitting the request with the approval
     */
    totpApprove(client: CubeSignerClient, code: string): Promise<CubeSignerResponse<U>>;
    /**
     * Reject the MFA request using a given session and a TOTP code.
     *
     * @param {CubeSignerClient} client CubeSigner whose session to use
     * @param {string} code 6-digit TOTP code
     */
    totpReject(client: CubeSignerClient, code: string): Promise<void>;
    /**
     * Approve the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param {CubeSignerClient} client CubeSigner whose session to use
     * @return {CubeSignerResponse<U>} The result of resubmitting the request with the approval
     */
    approve(client: CubeSignerClient): Promise<CubeSignerResponse<U>>;
    /**
     * Reject the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param {CubeSignerClient} client CubeSigner whose session to use
     */
    reject(client: CubeSignerClient): Promise<void>;
    /**
     * Resubmits the request with a given MFA receipt(s) attached.
     *
     * @param {MfaReceipts} mfaReceipt The MFA receipt(s)
     * @return {Promise<CubeSignerResponse<U>>} The result of signing after MFA approval
     */
    execWithMfaApproval(mfaReceipt: MfaReceipts): Promise<CubeSignerResponse<U>>;
    /**
     * Constructor.
     * @param {EnvInterface} env The environment where the response comes from
     * @param {RequestFn} requestFn
     *    The function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {U | AcceptedResponse} resp The response as returned by the OpenAPI client.
     * @internal
     */
    protected constructor(env: EnvInterface, requestFn: RequestFn<U>, resp: U | AcceptedResponse);
    /**
     * Static constructor.
     * @param {EnvInterface} env The environment where the response comes from
     * @param {RequestFn} requestFn
     *    The request function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<CubeSignerResponse<U>>} New instance of this class.
     * @internal
     */
    static create<U>(env: EnvInterface, requestFn: RequestFn<U>, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<U>>;
    /**
     * Return HTTP headers containing a given MFA receipt.
     *
     * @param {MfaReceipts} mfaReceipt MFA receipt(s)
     * @return {HeadersInit} Headers including {@link mfaReceipt}
     * @internal
     */
    static getMfaHeaders(mfaReceipt?: MfaReceipts): HeadersInit | undefined;
}
//# sourceMappingURL=response.d.ts.map