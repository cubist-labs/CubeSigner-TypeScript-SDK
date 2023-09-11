/* eslint-disable */
import { assert, expect } from "chai";
import { ErrResponse } from "../src/util";

export async function assertForbidden<T>(t: Promise<T>) {
  await assertCode(t, 403);
}

export async function assertPreconditionFailed<T>(t: Promise<T>) {
  await assertCode(t, 412);
}

export async function assertNotFound<T>(t: Promise<T>) {
  await assertCode(t, 404);
}

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

export function delay(ms: number) {
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
