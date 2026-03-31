import type { EnvInterface, MfaReceipts } from ".";
import { CubeSignerClient } from ".";
import type { AcceptedResponse } from "./schema_types";
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
 * @param resp Original response
 * @param mapFn Map to apply to the response value when its status code is 200.
 * @returns Response whose value for status code 200 is mapped from U to V
 */
export declare function mapResponse<U, V>(resp: Response<U>, mapFn: MapFn<U, V>): Response<V>;
/**
 * A response of a CubeSigner request.
 */
export declare class CubeSignerResponse<U> {
    #private;
    /** @returns The first MFA id associated with this request (if any) */
    mfaId(): string | undefined;
    /** @returns The MFA ids associated with this request (if any) */
    mfaIds(): string[];
    /** @returns True if this request requires an MFA approval */
    requiresMfa(): boolean;
    /**
     * @returns Session information to use for any MFA approval requests (if any was included in the response).
     */
    mfaClient(): Promise<CubeSignerClient | undefined>;
    /** @returns The response data, if no MFA is required */
    data(): U;
    /**
     * Approve the MFA request using a given session and a TOTP code.
     *
     * @param client CubeSigner whose session to use
     * @param code 6-digit TOTP code
     * @returns The result of resubmitting the request with the approval
     */
    totpApprove(client: CubeSignerClient, code: string): Promise<CubeSignerResponse<U>>;
    /**
     * Reject the MFA request using a given session and a TOTP code.
     *
     * @param client CubeSigner whose session to use
     * @param code 6-digit TOTP code
     */
    totpReject(client: CubeSignerClient, code: string): Promise<void>;
    /**
     * Approve the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param client CubeSigner whose session to use
     * @returns The result of resubmitting the request with the approval
     */
    approve(client: CubeSignerClient): Promise<CubeSignerResponse<U>>;
    /**
     * Reject the MFA request using a given {@link CubeSignerClient} instance (i.e., its session).
     *
     * @param client CubeSigner whose session to use
     */
    reject(client: CubeSignerClient): Promise<void>;
    /**
     * Resubmits the request with a given MFA receipt(s) attached.
     *
     * @param mfaReceipt The MFA receipt(s)
     * @returns The result of signing after MFA approval
     */
    execWithMfaApproval(mfaReceipt: MfaReceipts): Promise<CubeSignerResponse<U>>;
    /**
     * Constructor.
     *
     * @param env The environment where the response comes from
     * @param requestFn
     *    The function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param resp The response as returned by the OpenAPI client.
     * @internal
     */
    protected constructor(env: EnvInterface, requestFn: RequestFn<U>, resp: U | AcceptedResponse);
    /**
     * Static constructor.
     *
     * @param env The environment where the response comes from
     * @param requestFn
     *    The request function that this response is from.
     *    This argument is used to resend requests with different headers if needed.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns New instance of this class.
     * @internal
     */
    static create<U>(env: EnvInterface, requestFn: RequestFn<U>, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<U>>;
    /**
     * Return HTTP headers containing a given MFA receipt.
     *
     * @param mfaReceipt MFA receipt(s)
     * @returns Headers including {@link mfaReceipt}
     * @internal
     */
    static getMfaHeaders(mfaReceipt?: MfaReceipts): HeadersInit | undefined;
}
//# sourceMappingURL=response.d.ts.map