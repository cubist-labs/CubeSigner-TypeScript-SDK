import { expect } from "chai";
import { retryOn5XX } from "../src/retry";
import { encodeToHex, decodeFromHex } from "../src/util";

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

describe("encodeToHex", () => {
  it("encodes a string as UTF-8 then hex", () => {
    expect(encodeToHex("hello")).to.eq("0x68656c6c6f");
  });

  it("encodes a Uint8Array to hex", () => {
    expect(encodeToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).to.eq("0xdeadbeef");
  });

  it("handles empty input", () => {
    expect(encodeToHex("")).to.eq("0x");
    expect(encodeToHex(new Uint8Array([]))).to.eq("0x");
  });
});

describe("decodeFromHex", () => {
  it("decodes a 0x-prefixed hex string", () => {
    expect(decodeFromHex("0xdeadbeef")).to.deep.eq(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("decodes a hex string without prefix", () => {
    expect(decodeFromHex("deadbeef")).to.deep.eq(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("round-trips with encodeToHex", () => {
    const bytes = new Uint8Array([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]);
    expect(decodeFromHex(encodeToHex(bytes))).to.deep.eq(bytes);
  });

  it("throws on invalid hex characters", () => {
    expect(() => decodeFromHex("0x0g")).to.throw();
  });

  it("throws on odd-length hexstrings", () => {
    expect(() => decodeFromHex("0x1")).to.throw();
  });
});
