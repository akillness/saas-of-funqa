import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  oxc: false,
  esbuild: {
    jsx: "automatic"
  },
  resolve: {
    alias: {
      // Mirror apps/web/tsconfig.json ("@/*" -> "./*"). Next resolves this at
      // build time, so a component could import "@/components/..." and still
      // ship, while any test that imported that component failed to collect.
      // apps/web is the only workspace that declares the alias.
      "@/": `${path.join(repoRoot, "apps/web")}/`
    }
  },
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
