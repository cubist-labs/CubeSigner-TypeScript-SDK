import { expect, assert } from "chai";
import { Empty, ErrResponse, OpClient } from "../src";
import { EventEmitter } from "../src/events";
import { operations } from "../dist/cjs/src";
import { FetchResponse } from "openapi-fetch";

/**
 * Assert that the promise is rejected with {@link ErrResponse}
 * @param {Promise<T>} p The promise to check
 * @return {Promise<ErrResponse>} The error thrown
 */
async function expectErr<T>(p: Promise<T>): Promise<ErrResponse> {
  try {
    await p;
    assert(false, "Expected promise to throw ErrResponse");
  } catch (e) {
    expect(e).to.be.instanceOf(ErrResponse);
    return e as ErrResponse;
  }
}

describe("OpClient", () => {
  describe("execute", () => {
    const op: keyof operations = "aboutMe";
    const client = new OpClient(op, undefined!, new EventEmitter([]));

    it("doesn't retry on 200", async () => {
      const status = 200;
      const successMessage = "OK";
      const empty = <Empty>{ status: successMessage };
      let cnt = 0;
      const data = await client.execute(async () => {
        cnt++;
        console.log(`[attempt: ${cnt}] Returning ${status}`);
        return {
          response: new Response(undefined, { status }),
          data: empty,
        };
      });
      expect(cnt).to.eq(1);
      expect(data).to.deep.eq(empty);
    });

    it("doesn't retry on 202, 300, 400, 403, 404, etc", async () => {
      const message = "hi";
      for (const status of [202, 300, 400, 403, 404]) {
        let cnt = 0;
        const errResp = await expectErr(
          client.execute(async () => {
            cnt++;
            console.log(`[attempt: ${cnt}] Returning ${status}`);
            return {
              response: new Response(undefined, { status }),
              error: { message },
            };
          }),
        );
        expect(cnt).to.eq(1);
        expect(errResp.message).to.eq(message);
        expect(errResp.status).to.eq(status);
        expect(errResp.operation).to.eq(op);
      }
    });

    it("retries 3 times on 500, 502, 503, etc.", async () => {
      const message = "hi";
      for (const status of [500, 502, 503]) {
        let cnt = 0;
        const errResp = await expectErr(
          client.execute(async () => {
            cnt++;
            console.log(`[attempt: ${cnt}] Returning ${status}`);
            return {
              response: new Response(undefined, { status }),
              error: { message },
            };
          }),
        );
        expect(cnt).to.eq(4);
        expect(errResp.message).to.eq(message);
        expect(errResp.status).to.eq(status);
        expect(errResp.operation).to.eq(op);
      }
    });

    it("doesn't retry on 500 if delays are empty", async () => {
      const message = "hi";
      const c = client.withRetries([]);
      const status = 500;
      let cnt = 0;
      const errResp = await expectErr(
        c.execute(async () => {
          cnt++;
          console.log(`[attempt: ${cnt}] Returning ${status}`);
          return {
            response: new Response(undefined, { status }),
            error: { message },
          };
        }),
      );
      expect(cnt).to.eq(1);
      expect(errResp.message).to.eq(message);
      expect(errResp.status).to.eq(status);
      expect(errResp.operation).to.eq(op);
    });

    it("doesn't retry on 500 if so configured", async () => {
      const message = "hi";
      const c = client.withRetrySettings({ codes: [503], delaysMs: [100, 200] });
      const status = 500;
      let cnt = 0;
      const errResp = await expectErr(
        c.execute(async () => {
          cnt++;
          console.log(`[attempt: ${cnt}] Returning ${status}`);
          return {
            response: new Response(undefined, { status }),
            error: { message },
          };
        }),
      );
      expect(cnt).to.eq(1);
      expect(errResp.message).to.eq(message);
      expect(errResp.status).to.eq(status);
      expect(errResp.operation).to.eq(op);
    });

    it("stops retrying after success", async () => {
      const empty = <Empty>{ status: "OK" };
      let cnt = 0;
      const data = await client.execute(async () => {
        cnt++;
        const [status, error, data] =
          cnt === 1 ? [500, { message: "hi" }, undefined] : [200, undefined, empty];
        console.log(`[attempt: ${cnt}] Returning ${status}`);
        return <FetchResponse<Empty>>{
          response: new Response(undefined, { status }),
          error,
          data,
        };
      });
      expect(cnt).to.eq(2);
      expect(data).to.deep.eq(empty);
    });
  });
});
