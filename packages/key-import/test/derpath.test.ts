import { parseDerivationPath } from "../src/mnemonic";

const BIP32_HARDEN = Number(BigInt(1) << BigInt(31));

describe("derpath", () => {
  it("errors on bad paths", async () => {
    const badPaths = ["//", "m/", "-", "h", "toast", "憂鬱", "0/1/2"];
    for (const path of badPaths) {
      expect(() => {
        parseDerivationPath(path);
      }).toThrowError();
    }
  });

  it("parses derivation strings correctly", async () => {
    const goodPaths = [
      ["m/32", [32]],
      ["m/32'", [32 + BIP32_HARDEN]],
      ["m/0'/32/5/5/5", [BIP32_HARDEN, 32, 5, 5, 5]],
      ["m/0/2147483647H/1/2147483646H/2", [0, 2 * BIP32_HARDEN - 1, 1, 2 * BIP32_HARDEN - 2, 2]],
      ["M/0H/1/2H/2/1000000000", [BIP32_HARDEN, 1, 2 + BIP32_HARDEN, 2, 1000000000]],
    ];
    for (const kat of goodPaths) {
      const [path, expected] = kat;
      expect(parseDerivationPath(path as string)).toEqual(expected as number[]);
    }
  });
});
