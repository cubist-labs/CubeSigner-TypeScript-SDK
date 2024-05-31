/**
 * This module amounts to an inlining of much of openapi-fetch.
 *
 * Rather than constructing a stateful client that separates out the HTTP methods,
 * this module creates a fetch function called `apiFetch` which can be used to make direct requests
 */
import {
  type FetchOptions,
  type FetchResponse,
  createFinalURL,
  defaultBodySerializer,
  defaultQuerySerializer,
  mergeHeaders,
} from "openapi-fetch";
import type { operations, paths as gen_paths } from "./schema";
import type { ErrorResponse } from ".";
import { ErrResponse } from ".";

type HttpMethod = "get" | "post" | "delete" | "put" | "head" | "option" | "patch";
export type Operation = operations[keyof operations];

// We filter all the paths that aren't associated with operations
type paths = {
  [p in keyof gen_paths]: {
    [m in HttpMethod as m extends keyof gen_paths[p] ? m : never]: m extends keyof gen_paths[p]
      ? gen_paths[p][m] extends Operation
        ? gen_paths[p][m]
        : never
      : never;
  };
};

// Unlike openapi-fetch, we don't have a client to store the baseUrl, so we need to let it be specified on all requests
export type SimpleOptions<T> = FetchOptions<T> & { baseUrl: string };

// By default we set the headers on requests to include the Content-Type for JSON
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * The raw, stateless fetch interface for the cubesigner API. Can be called directly from anywhere to produce a well-typed request.
 *
 * All type assertions in this function are a result of openapi-fetch's weaker
 * typescript config
 *
 * @param {string} path The path of an API endpoint
 * @param {string} method The HTTP method with which to invoke the endpoint
 * @param {FetchOptions} fetchOptions The options with which to invoke the endpoint
 */
export async function apiFetch<P extends keyof paths, M extends keyof paths[P]>(
  path: P,
  method: M,
  fetchOptions: SimpleOptions<paths[P][M]>,
): Promise<FetchResponse<paths[P][M]>> {
  // MIT License

  // Copyright (c) 2023 Drew Powers

  // Permission is hereby granted, free of charge, to any person obtaining a copy
  // of this software and associated documentation files (the "Software"), to deal
  // in the Software without restriction, including without limitation the rights
  // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  // copies of the Software, and to permit persons to whom the Software is
  // furnished to do so, subject to the following conditions:

  // The above copyright notice and this permission notice shall be included in all
  // copies or substantial portions of the Software.

  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  // SOFTWARE.

  const {
    headers,
    body: requestBody,
    params = {},
    baseUrl = "",
    parseAs = "json",
    querySerializer = defaultQuerySerializer,
    bodySerializer = defaultBodySerializer,
    ...init
  } = fetchOptions || {};

  // URL
  const finalURL = createFinalURL(path, {
    baseUrl,
    params,
    querySerializer,
  });
  const finalHeaders = mergeHeaders(DEFAULT_HEADERS, headers);

  // fetch!
  const requestInit = {
    redirect: "follow",
    body: undefined as BodyInit | undefined,
    ...init,
    method: (method as string).toUpperCase(),
    headers: finalHeaders,
  };

  if (requestBody) {
    requestInit.body = bodySerializer(requestBody);
  }
  // remove `Content-Type` if serialized body is FormData; browser will correctly set Content-Type & boundary expression
  if (requestInit.body instanceof FormData) {
    finalHeaders.delete("Content-Type");
  }

  const response = await fetch(finalURL, requestInit);

  // handle empty content
  // note: we return `{}` because we want user truthy checks for `.data` or `.error` to succeed
  if (response.status === 204 || response.headers.get("Content-Length") === "0") {
    return (response.ok ? { data: {}, response } : { error: {}, response }) as FetchResponse<
      paths[P][M]
    >;
  }

  // parse response (falling back to .text() when necessary)
  if (response.ok) {
    // if "stream", skip parsing entirely
    if (parseAs === "stream") {
      // fix for bun: bun consumes response.body, therefore clone before accessing
      // TODO: test this?
      return { data: response.clone().body, response } as FetchResponse<paths[P][M]>;
    }
    const cloned = response.clone();
    const res = {
      data: typeof cloned[parseAs] === "function" ? await cloned[parseAs]() : await cloned.text(),
      response,
    };
    return res;
  }

  // handle errors (always parse as .json() or .text())
  let error = {};
  try {
    error = await response.clone().json();
  } catch {
    error = await response.clone().text();
  }
  return { error, response } as FetchResponse<paths[P][M]>;
}

/** A functional representation of an operation (can be constructed using the `op` function) */
export type Op<T> = (opt: SimpleOptions<T>) => Promise<FetchResponse<T>>;

/**
 * Generates a function from params -> response for a given path and method
 *
 * @param {string} path The path for an API endpoint
 * @param {string} method The method to invoke that path with
 *
 * @return {Op} The op function to invoke the endpoint
 **/
export function op<P extends keyof paths, M extends keyof paths[P]>(
  path: P,
  method: M,
): Op<paths[P][M]> {
  return (opt) => apiFetch(path, method, opt);
}

/**
 * Type alias for the type of the response body (the "data" field of
 * {@link FetchResponse<T>}) when that response is successful.
 */
export type FetchResponseSuccessData<T> = Required<FetchResponse<T>>["data"];

/**
 * Turns the response from `apiFetch` into its underlying data, throwing if the response was an error
 *
 * @param {FetchResponse<T>} resp The response from an API endpoint
 * @return {FetchResponseSuccessData<T>} The data from a successful response
 * */
export function assertOk<T>(resp: FetchResponse<T>): FetchResponseSuccessData<T> {
  if (!resp.response.ok) {
    const errResp = resp.error as unknown as ErrorResponse | undefined;
    const error = new ErrResponse({
      requestId: errResp?.request_id,
      message: errResp?.message,
      statusText: resp.response?.statusText,
      status: resp.response?.status,
      url: resp.response?.url,
      errorCode: errResp?.error_code,
    });
    throw error;
  }
  return resp.data!;
}
