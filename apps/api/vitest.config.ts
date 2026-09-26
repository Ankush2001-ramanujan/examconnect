import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests sequentially to avoid DB race conditions
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    reporter: ["verbose"],
  },
});
