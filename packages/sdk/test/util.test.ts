import { expect } from "chai";
import { retryOn5XX } from "../src/retry";

describe("retryOn5XX", () => {
  it("doesn't retry on 200", async () => {
    let cnt = 0;
    await retryOn5XX(async () => {
      cnt++;
      return { response: { status: 200 } };
    });

    expect(cnt).to.eq(1);
  });

  it("doesn't retry on 202, 300, 400, 403, 404, etc", async () => {
    const message = "hi";
    for (const status of [202, 300, 400, 403, 404]) {
      let cnt = 0;
      const errResp = await retryOn5XX(async () => {
        cnt++;
        console.log(`[attempt: ${cnt}] Returning ${status}`);
        return {
          response: { status },
          error: { message },
        };
      });
      expect(cnt).to.eq(1);
      expect(errResp.error.message).to.eq(message);
    }
  });

  it("retries 3 times on 500, 502, 503, etc.", async () => {
    const message = "hi";
    for (const status of [500, 502, 503]) {
      let cnt = 0;
      const errResp = await retryOn5XX(async () => {
        cnt++;
        console.log(`[attempt: ${cnt}] Returning ${status}`);
        return {
          response: { status },
          error: { message },
        };
      });
      expect(cnt).to.eq(4);
      expect(errResp.error.message).to.eq(message);
    }
  });

  it("doesn't retry on 500 if delays are empty", async () => {
    const message = "hi";
    const status = 500;
    let cnt = 0;

    const errResp = await retryOn5XX(async () => {
      cnt++;
      console.log(`[attempt: ${cnt}] Returning ${status}`);
      return {
        response: { status },
        error: { message },
      };
    }, []);

    expect(cnt).to.eq(1);
    expect(errResp.error.message).to.eq(message);
  });

  it("stops retrying after success", async () => {
    let cnt = 0;
    const empty = {};
    const response = await retryOn5XX(async () => {
      cnt++;

      const [status, error, data] =
        cnt === 1 ? [500, { message: "hi" }, undefined] : [200, undefined, empty];

      console.log(`[attempt: ${cnt}] Returning ${status}`);
      return {
        response: { status },
        error,
        data,
      };
    });
    expect(cnt).to.eq(2);
    expect(response).to.deep.eq({ data: empty, error: undefined, response: { status: 200 } });
  });
});
