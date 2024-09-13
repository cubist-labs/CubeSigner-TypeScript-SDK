import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test",
  webServer: {
    command: "npm run test:build && npm run test:server -- -p 3000 -c-1",
    url: "http://localhost:3000/",
  },
  use: {
    baseURL: "http://localhost:3000/",
  },
  fullyParallel: true,
});
