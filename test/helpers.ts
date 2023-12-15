import { assert, expect } from "chai";
import { ErrResponse, Key } from "../src";

export interface OidcPayload {
  iss: string;
  aud: string;
  sub: string;
  email: string;
}

/**
 * @param {string} oidcToken The OIDC token to parse.
 * @return {OidcPayload} The payload.
 */
export function parseOidcToken(oidcToken: string): OidcPayload {
  const encodedPayload = Buffer.from(oidcToken.split(".")[1], "base64url").toString("utf8");
  return JSON.parse(encodedPayload);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 403; throws otherwise.
 *
 * @param {Promise<T>} t The promise to await on
 */
export async function assertForbidden<T>(t: Promise<T>): Promise<ErrResponse> {
  return await assertCode(t, 403);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 412; throws otherwise.
 *
 * @param {Promise<T>} t The promise to await on
 */
export async function assertPreconditionFailed<T>(t: Promise<T>) {
  await assertCode(t, 412);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 404; throws otherwise.
 *
 * @param {Promise<T>} t The promise to await on
 */
export async function assertNotFound<T>(t: Promise<T>) {
  await assertCode(t, 404);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse` and that the
 * status code in that `ErrResponse` matches the given `code`; throws otherwise.
 *
 * @param {Promise<T>} t The promise to await on
 * @param {number} code HTTP status code to expect
 */
export async function assertCode<T>(t: Promise<T>, code: number): Promise<ErrResponse> {
  let result: T;
  try {
    result = await t;
  } catch (e) {
    const err = e as ErrResponse;
    expect(err.status).to.equal(code, `Expected code ${code}, got error: ${e}`);
    return err;
  }
  assert.fail("Exception not thrown; got: " + JSON.stringify(result));
}

/**
 * Sleeps for `ms` milliseconds.
 *
 * @param {number} ms Milliseconds to sleep
 * @return {Promise<void>} A promise that is resolved after `ms` milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}

/**
 * Deletes given keys
 * @param {Key[]} keys Keys to delete.
 */
export async function deleteKeys(keys: Key[]) {
  console.log(`Deleting ${keys.length} keys`);
  for (const key of keys) {
    console.log(`Deleting ${key.id}`);
    await key.delete();
  }
}

/**
 * Returns a pseudorandom integer less than or equal to `max`.
 * @param {number} max Max value
 * @return {number} Pseudorandom integer less than or equal to `max`
 */
export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
