import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**", ".idea", ".git", ".cache", "apps/web/.next", "functions/lib", "**/.claude/**", "**/.agents/**", "**/.ouroboros/**", "**/.gemini/**"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage"
    }
  }
});
