import path from "path";
import { defineConfig } from "vitest/config";

const aliases = {
  "@": path.resolve(__dirname, "./src"),
  "@/components": path.resolve(__dirname, "./src/components"),
  "@/pages": path.resolve(__dirname, "./src/pages"),
  "@/services": path.resolve(__dirname, "./src/services"),
  "@/hooks": path.resolve(__dirname, "./src/hooks"),
  "@/contexts": path.resolve(__dirname, "./src/contexts"),
  "@/types": path.resolve(__dirname, "./src/types"),
  "@/utils": path.resolve(__dirname, "./src/utils"),
  "@/assets": path.resolve(__dirname, "./src/assets"),
};

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    // Only run unit tests inside src; ignore E2E tests in `e2e/` which use Playwright
    include: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**"],
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: aliases,
  },
});
