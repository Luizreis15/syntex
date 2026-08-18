import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

process.loadEnvFile(".env.local");

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
    fileParallelism: false,
  },
});
