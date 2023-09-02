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
