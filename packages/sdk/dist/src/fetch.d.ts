/**
 * This module amounts to an inlining of much of openapi-fetch.
 *
 * Rather than constructing a stateful client that separates out the HTTP methods,
 * this module creates a fetch function called `apiFetch` which can be used to make direct requests
 */
import { type FetchOptions, type FetchResponse } from "openapi-fetch";
import type { operations, paths as gen_paths } from "./schema";
type HttpMethod = "get" | "post" | "delete" | "put" | "head" | "option" | "patch";
export type Operation = operations[keyof operations];
type paths = {
    [p in keyof gen_paths]: {
        [m in HttpMethod as m extends keyof gen_paths[p] ? m : never]: m extends keyof gen_paths[p] ? gen_paths[p][m] extends Operation ? gen_paths[p][m] : never : never;
    };
};
export type SimpleOptions<T> = FetchOptions<T> & {
    baseUrl: string;
};
/**
 * The raw, stateless fetch interface for the cubesigner API. Can be called directly from anywhere to produce a well-typed request.
 *
 * All type assertions in this function are a result of openapi-fetch's weaker
 * typescript config
 *
 * @param path The path of an API endpoint
 * @param method The HTTP method with which to invoke the endpoint
 * @param fetchOptions The options with which to invoke the endpoint
 */
export declare function apiFetch<P extends keyof paths, M extends keyof paths[P]>(path: P, method: M, fetchOptions: SimpleOptions<paths[P][M]>): Promise<FetchResponse<paths[P][M]>>;
/** A functional representation of an operation (can be constructed using the `op` function) */
export type Op<T> = (opt: SimpleOptions<T>) => Promise<FetchResponse<T>>;
/**
 * Generates a function from params -> response for a given path and method
 *
 * @param path The path for an API endpoint
 * @param method The method to invoke that path with
 *
 * @returns The op function to invoke the endpoint
 */
export declare function op<P extends keyof paths, M extends keyof paths[P]>(path: P, method: M): Op<paths[P][M]>;
/**
 * Type alias for the type of the response body (the "data" field of
 * {@link FetchResponse<T>}) when that response is successful.
 */
export type FetchResponseSuccessData<T> = Required<FetchResponse<T>>["data"];
/**
 * Turns the response from `apiFetch` into its underlying data, throwing if the response was an error
 *
 * @param resp The response from an API endpoint
 * @returns The data from a successful response
 */
export declare function assertOk<T>(resp: FetchResponse<T>): FetchResponseSuccessData<T>;
export {};
//# sourceMappingURL=fetch.d.ts.map