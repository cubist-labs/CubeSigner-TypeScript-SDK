import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/*.test.{ts,js}"],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
  },
});
