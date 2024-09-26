import type { ReadTestAndSet } from "../src/locks";
import type {} from "./site/testscript";

import type { PlaywrightTestArgs } from "@playwright/test";
import { test, expect } from "@playwright/test";

const lock = "LOCK";

test("should perform all necessary writes", async ({ page }) => {
  await page.goto("/");
  page.on("console", (msg) => {
    console.log(msg);
  });
  const { res, setsPerformed } = await page.evaluate(
    async ({ lock }) => {
      const rts = window.readTestAndSet;

      let setsPerformed = 0;

      const spec: ReadTestAndSet<number> = {
        read: () => setsPerformed,
        test: () => true, // always write
        set: async (prev) => {
          setsPerformed = prev + 1;
        },
      };

      // Perform 20 simultaneous TestAndSets that will both require a write
      const res = await Promise.all([...new Array(20)].map(() => rts(lock, spec)));
      return {
        res,
        setsPerformed,
      };
    },
    { lock },
  );

  expect(setsPerformed).toBe(res.length);
});

/**
 * Creates a write-heavy environment for {@link readTestAndSet}
 * @param {number} n The number of contentious pages
 * @param {number} d The delay imposed on `set`
 * @return {function(PlaywrightTestArgs): void} A playwright test
 */
const contentionTest =
  (n: number, d: number) =>
  async ({ page, context }: PlaywrightTestArgs) => {
    const pages = [page, ...(await Promise.all([...new Array(n)].map(() => context.newPage())))];
    await Promise.all(pages.map((p) => p.goto("/")));
    const LS_KEY = `LS_KEY_CONTENTION:${n}:${d}`;

    // Make all the pages attempt to write at the same time
    const evals = pages.map((p) =>
      p.evaluate(
        async ({ lock, LS_KEY, d }) => {
          const rts = window.readTestAndSet;
          return await rts<number>(lock, {
            read: () => parseInt(localStorage.getItem(LS_KEY) ?? "0"),
            test: () => true, // always write
            set: async () => {
              await window.delay(d);
              const value = parseInt(localStorage.getItem(LS_KEY) ?? "0") + 1;
              localStorage.setItem(LS_KEY, "" + value);
            },
          });
        },
        { lock, LS_KEY, d },
      ),
    );

    // We expect the results to be the range [1...11], but the order is
    // nondeterministic...
    const nums = await Promise.all(evals);
    // ...so we sort the numbers...
    nums.sort((a, b) => a - b);
    // ...and ensure the numbers are equal to their index + 1
    nums.forEach((v, i) => {
      expect(v).toBe(i + 1);
    });
  };

/**
 * Creates a potentially write-heavy environment for {@link readTestAndSet}
 * where proper locking requires only 1 write.
 * @param {number} n The number of contentious pages
 * @param {number} d The delay imposed on `set`
 * @return {function(PlaywrightTestArgs): void} A playwright test
 */
const minimizesWrites =
  (n: number, d: number) =>
  async ({ page, context }: PlaywrightTestArgs) => {
    const pages = [page, ...(await Promise.all([...new Array(n)].map(() => context.newPage())))];
    await Promise.all(pages.map((p) => p.goto("/")));
    const LS_KEY = `LS_KEY_MIN_WRITES:${n}:${d}`;

    // Make all the pages attempt to write at the same time
    const evals = pages.map((p) =>
      p.evaluate(
        async ({ lock, LS_KEY, d }) => {
          const rts = window.readTestAndSet;
          const start = Date.now();
          let didWrite = false;
          const time = await rts<number>(lock, {
            read: () => parseInt(localStorage.getItem(LS_KEY) ?? "0"),
            test: (storedVal) => storedVal === 0, // Only write in initial state
            set: async () => {
              didWrite = true;
              await window.delay(d);
              const time = Date.now() - start;
              localStorage.setItem(LS_KEY, "" + time);
            },
          });

          return { time, didWrite };
        },
        { lock, LS_KEY, d },
      ),
    );

    const results = await Promise.all(evals);
    results.forEach((e) => {
      expect(e.time).toBeGreaterThan(d);
    });

    // All responses should be the same
    expect(new Set(results.map((r) => r.time)).size).toBe(1);

    // Only 1 write should have occurred
    expect(results.filter((r) => r.didWrite)).toHaveLength(1);
  };

for (const n of [2, 10, 20]) {
  for (const d of [0, 10, 400]) {
    test(`heavy contention n:${n} d:${d}`, contentionTest(n, d));
    test(`minimizes writes n:${n} d:${d}`, minimizesWrites(n, d));
  }
}
