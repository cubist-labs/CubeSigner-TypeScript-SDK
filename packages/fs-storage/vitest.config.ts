import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/*.test.{ts,js}"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
