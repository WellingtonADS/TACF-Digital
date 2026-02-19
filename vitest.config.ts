import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/contexts": path.resolve(__dirname, "./src/contexts"),
      "@/types": path.resolve(__dirname, "./src/types"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "tests/setupTests.ts",
    include: [
      "tests/**/*.test.{ts,tsx}",
      "tests/**/*.spec.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
    ],
    // Integration tests that touch external services can be slow and should run
    // sequentially to avoid race conditions. These defaults keep unit tests
    // fast while providing safer defaults for integration runs.
    // Run-time overrides (CI) can change these values if desired.
    isolate: true,
    exclude: ["tests/e2e/**", "tests/playwright/**", "**/*.pw.*"],
  },
});
