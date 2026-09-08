import { CubeSignerClient, delay, type SessionData } from "@cubist-labs/cubesigner-sdk";
import type {} from "./site/testscript";
import { expect } from "chai";
import { test } from "@playwright/test";
import { defaultManagementSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";

test("notifies on login", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const manager = new window.BrowserStorageManager("KEY");

    const success = new Promise<void>((resolve) => manager.addEventListener("login", resolve));
    await manager.setSession({} as SessionData);
    await success;
  });
});

test("notifies on logout", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const manager = new window.BrowserStorageManager("KEY");

    await manager.setSession({} as SessionData);
    const success = new Promise<void>((resolve) => manager.addEventListener("logout", resolve));
    await manager.setSession();
    await success;
  });
});

test("does not notify on refresh", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    const SUCCESS_AFTER_TIMEOUT = 300;
    const manager = new window.BrowserStorageManager("KEY");

    await manager.setSession({} as SessionData);

    await Promise.race([
      new Promise<void>((_, reject) => {
        // we will never resolve, only reject
        manager.addEventListener("logout", reject);
        manager.addEventListener("login", reject);
      }),
      manager.setSession({} as SessionData).then(() => window.delay(SUCCESS_AFTER_TIMEOUT)),
    ]);
  });
});

test("notifies cross-tab", async ({ page: readerPage, context }) => {
  const writerPage = await context.newPage();
  await Promise.all([readerPage.goto("/"), writerPage.goto("/")]);

  const STORAGE_KEY = "STORAGE_KEY";

  // Set up a promise inside the readerPage that will resolve when the event handler fires.
  // `evaluateHandle` gives us an opaque reference to this promise, that we'll use later
  const deferredPromise = await readerPage.evaluateHandle(
    ({ STORAGE_KEY }) => {
      const manager = new window.BrowserStorageManager(STORAGE_KEY);

      // Create a promise that resolves when the login event fires
      const loginOccurred = new Promise<void>((resolve) =>
        manager.addEventListener("login", resolve),
      );

      // We need to wrap our promise in an object so that we don't get the monadic promise flattening behavior
      return { loginOccurred };
    },
    { STORAGE_KEY },
  );

  // Use the writer page to login
  await writerPage.evaluate(
    async ({ STORAGE_KEY }) => {
      const manager = new window.BrowserStorageManager(STORAGE_KEY);
      await manager.setSession({} as SessionData);
    },
    { STORAGE_KEY },
  );

  // Pass that promise handle back into the readerPage and await it
  await readerPage.evaluate(async ({ loginOccurred }) => {
    await loginOccurred;
  }, deferredPromise);
});

test("refreshes when necessary", async ({ page }) => {
  const client = await CubeSignerClient.create(defaultManagementSessionManager());
  const sessionData = await client
    .org()
    .createSession("test browser refresh", ["manage:session:*"], {
      auth: 1,
    });

  await Promise.all([
    page.goto("/"),
    delay(1000), // ensure the token is expired
  ]);

  page.on("console", console.log.bind(console));

  const newToken = await page.evaluate(
    async ({ sessionData }) => {
      const manager = new window.BrowserStorageManager("REFRESH");
      await manager.setSession(sessionData);

      return await manager.token();
    },
    { sessionData },
  );

  expect(newToken).not.equal(sessionData.token);
});

test("logs out when can't refresh", async ({ page }) => {
  const client = await CubeSignerClient.create(defaultManagementSessionManager());
  const sessionData = await client.org().createSession("already expired", ["manage:session:*"], {
    auth: 1,
    session: 1, // this token can't be refreshed
  });
  await Promise.all([
    page.goto("/"),
    delay(1000), // ensure the token is expired
  ]);
  await page.evaluate(
    async ({ sessionData }) => {
      const manager = new window.BrowserStorageManager("LOGOUT");
      await manager.setSession(sessionData);

      const loggedout = new Promise<void>((resolve) => manager.addEventListener("logout", resolve));
      await manager.token().catch(() => loggedout);
    },
    { sessionData },
  );
});
