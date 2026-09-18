import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 15000,
    // Run schema/integration tests one at a time — they share one
    // database connection and clean up after themselves sequentially.
    fileParallelism: false,
  },
});