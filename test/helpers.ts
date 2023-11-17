import { assert, expect } from "chai";
import { ErrResponse } from "../src/util";
import { CubeSigner, Key, Org, SignerSessionManager } from "../src";

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
 * First sets an `OidcAuthSources` org policy that allows a given OIDC token,
 * then calls `cs.oidcProveIdentity`, and finally restores the org policy to what it originally was.
 *
 * @param {CubeSigner} cs CubeSigner instance
 * @param {string} oidcToken OIDC token from which to parse issuer and audience
 * @param {Org} org Organization to which to add `OidcAuthSources` policy that allows the issuer/audience from the given OIDC token
 */
export async function oidcProveIdentity(cs: CubeSigner, oidcToken: string, org: Org) {
  return withOidcAuthSourcesPolicy(oidcToken, org, () => cs.oidcProveIdentity(oidcToken, org.id));
}

/**
 * First sets an `OidcAuthSources` org policy that allows a given OIDC token,
 * then calls `cs.oidcAuth`, and finally restores the org policy to what it originally was.
 *
 * @param {CubeSigner} cs CubeSigner instance
 * @param {string} oidcToken OIDC token from which to parse issuer and audience
 * @param {Org} org Organization to which to add `OidcAuthSources` policy that allows the issuer/audience from the given OIDC token
 * @param {string[]} scopes Requested scopes
 * @return {Promise<SignerSessionManager>} New signer session.
 */
export async function oidcAuth(
  cs: CubeSigner,
  oidcToken: string,
  org: Org,
  scopes: string[],
): Promise<SignerSessionManager> {
  return withOidcAuthSourcesPolicy(oidcToken, org, () => cs.oidcAuth(oidcToken, org.id, scopes));
}

/**
 * First sets an `OidcAuthSources` org policy that allows a given OIDC token,
 * then calls a given `action`, and finally restores the org policy to what it originally was.
 * @param {string} oidcToken OIDC token from which to parse issuer and audience
 * @param {Org} org Organization to which to add `OidcAuthSources` policy that allows the issuer/audience from the given OIDC token
 * @param {Function<Promise<T>>} action Action to call
 * @return {T} The return value of the action.
 */
export async function withOidcAuthSourcesPolicy<T>(
  oidcToken: string,
  org: Org,
  action: () => Promise<T>,
): Promise<T> {
  const oidcPayload = parseOidcToken(oidcToken);

  const oldPolicy = await org.policy();
  const newPolicy = {
    OidcAuthSources: {
      [oidcPayload.iss]: [oidcPayload.aud],
    },
  };
  console.log("Adding OidcAuthSources policy", newPolicy);
  await org.setPolicy([newPolicy]);

  try {
    return await action();
  } finally {
    console.log("Restoring policy", oldPolicy);
    await org.setPolicy(oldPolicy);
  }
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 403; throws otherwise.
 *
 * @param {Promise<T>} t The promise to await on
 */
export async function assertForbidden<T>(t: Promise<T>) {
  await assertCode(t, 403);
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
export async function assertCode<T>(t: Promise<T>, code: number) {
  let result: T;
  try {
    result = await t;
  } catch (e) {
    const err = e as ErrResponse;
    expect(err.status).to.equal(code, `Expected code ${code}, got error: ${e}`);
    return;
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
