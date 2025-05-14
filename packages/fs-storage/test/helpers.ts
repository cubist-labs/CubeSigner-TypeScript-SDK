import { assert, expect } from "chai";
import type { NamedPolicy, CsErrCode, ErrResponse, Key, Role } from "@cubist-labs/cubesigner-sdk";
import type { Contact } from "@cubist-labs/cubesigner-sdk/dist/src/contact";

export interface OidcPayload {
  iss: string;
  aud: string;
  sub: string;
  email: string;
}

/**
 * @param oidcToken The OIDC token to parse.
 * @returns The payload.
 */
export function parseOidcToken(oidcToken: string): OidcPayload {
  const encodedPayload = Buffer.from(oidcToken.split(".")[1], "base64url").toString("utf8");
  return JSON.parse(encodedPayload);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 403; throws otherwise.
 *
 * @param t The promise to await on
 * @returns The rejection error.
 */
export async function assertForbidden<T>(t: Promise<T>): Promise<ErrResponse> {
  return await assertCode(t, 403);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 412; throws otherwise.
 *
 * @param t The promise to await on
 * @returns The rejection error.
 */
export async function assertPreconditionFailed<T>(t: Promise<T>): Promise<ErrResponse> {
  return await assertCode(t, 412);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is in the 4xx range; throws otherwise.
 *
 * @param t The promise to await on
 * @returns The rejection error.
 */
export async function assert4xx<T>(t: Promise<T>): Promise<ErrResponse> {
  const err = await assertError(t);
  expect(err.status).to.be.greaterThanOrEqual(400);
  expect(err.status).to.be.lessThan(500);
  return err;
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 404 or 422; throws otherwise.
 *
 * @param t The promise to await on
 * @returns The rejection error.
 */
export async function assertNotFound<T>(t: Promise<T>): Promise<ErrResponse> {
  const err = await assertError(t);
  expect([404, 422]).to.include(err.status);
  return err;
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`
 * and that the status code in that `ErrResponse` is 400; throws otherwise.
 *
 * @param t The promise to await on
 * @returns The rejection error.
 */
export async function assertBadRequest<T>(t: Promise<T>): Promise<ErrResponse> {
  return await assertCode(t, 400);
}

/**
 * Asserts that a given promise is rejected with `ErrResponse` and that the
 * status code in that `ErrResponse` matches the given `code`; throws otherwise.
 *
 * @param t The promise to await on
 * @param code HTTP status code to expect
 * @returns The rejection error.
 */
export async function assertCode<T>(t: Promise<T>, code: number): Promise<ErrResponse> {
  const err = await assertError(t);
  expect(err.status).to.equal(code);
  return err;
}

/**
 * Asserts that a given promise is rejected with `ErrResponse`.
 *
 * @param t The promise to await on
 * @returns The rejection error.
 */
export async function assertError<T>(t: Promise<T>): Promise<ErrResponse> {
  let result: T;
  try {
    result = await t;
  } catch (e) {
    const err = e as ErrResponse;
    return err;
  }
  assert.fail("Exception not thrown; got: " + JSON.stringify(result));
}

/**
 * Asserts that a given promise is rejected with {@link ErrResponse} whose error
 * code matches a given {@link CsErrCode}.
 *
 * @param errCode The CubeSigner error code to expect
 * @param t The promise to await on
 * @returns The response error.
 */
export async function assertErrorCode<T>(errCode: CsErrCode, t: Promise<T>): Promise<ErrResponse> {
  const err = await assertError(t);
  expect(err.errorCode).to.eq(errCode);
  return err;
}

/**
 * Sleeps for `ms` milliseconds.
 *
 * @param ms Milliseconds to sleep
 * @returns A promise that is resolved after `ms` milliseconds.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the value of the environment variable.
 *
 * @param name The name of the environment variable.
 * @param fallback The optional fallback value.
 * @returns The value of the environment variable, the fallback, or undefined.
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
 *
 * @param keys Keys to delete.
 */
export async function deleteKeys(keys: Key[]) {
  console.log(`Deleting ${keys.length} keys`);
  for (const key of keys) {
    console.log(`Deleting ${key.id}`);
    try {
      await key.delete();
    } catch (e) {
      console.log(`WARNING: could not delete ${key.id}: ${e}`);
    }
  }
}

/**
 * Deletes given roles
 *
 * @param roles Roles to delete.
 */
export async function deleteRoles(roles: Role[]) {
  console.log(`Deleting ${roles.length} roles`);
  for (const role of roles) {
    console.log(`Deleting ${role.id}`);
    try {
      await role.delete();
    } catch (e) {
      console.log(`WARNING: could not delete ${role.id}: ${e}`);
    }
  }
}

/**
 * Deletes given contacts
 *
 * @param contacts Contacts to delete.
 */
export async function deleteContacts(contacts: Contact[]) {
  console.log(`Deleting ${contacts.length} contacts`);
  for (const contact of contacts) {
    console.log(`Deleting ${contact.id}`);
    try {
      await contact.delete();
    } catch (e) {
      console.log(`WARNING: could not delete ${contact.id}: ${e}`);
    }
  }
}

/**
 * Delete the given policies.
 * This will fail if any policy is still attached to a key, role or key-in-role.
 *
 * @param policies Policies to delete.
 */
export async function deletePolicies(policies: NamedPolicy[]) {
  console.log(`Deleting ${policies.length} policies`);
  const errors = [];
  for (const policy of policies) {
    try {
      await policy.delete();
    } catch (e) {
      errors.push(e);
    }
  }

  if (errors.length > 0) {
    console.error(
      `Failed to delete ${errors.length} policies out of ${policies.length}:\n`,
      errors,
    );
    throw errors[0];
  }
}

/**
 * Returns a pseudorandom integer less than or equal to `max`.
 *
 * @param max Max value
 * @returns Pseudorandom integer less than or equal to `max`
 */
export function randomInt(max: number): number {
  return Math.floor(Math.random() * max);
}
