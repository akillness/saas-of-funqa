#!/usr/bin/env node
/**
 * Next.js `output: "standalone"` uses build-time static tracing (@vercel/nft) to decide
 * which node_modules files get copied into `.next/standalone/node_modules`. That tracer
 * cannot see `next/dist/server/require-hook.js`'s dynamic `require.resolve('styled-jsx/package.json')`
 * call, so `styled-jsx` is silently dropped from the standalone bundle even though Next.js
 * requires it unconditionally at server startup. In monorepos it's worse: npm may hoist
 * styled-jsx to a parent workspace's node_modules, which the standalone tracer never visits
 * at all — the failure only surfaces as a Cloud Run/production crash
 * ("Error: Cannot find module 'styled-jsx/package.json'"), not as a local `next build` error.
 *
 * This script copies the resolved styled-jsx package (wherever npm actually installed it)
 * into `.next/standalone/node_modules/styled-jsx` after every build, so the standalone
 * server can find it regardless of hoisting. See knowledge/wiki/reports/apphosting-deploy-rollout-debug.md
 * for the original incident this guards against.
 */
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(scriptDir, "..");
const standaloneNodeModules = join(appDir, ".next", "standalone", "node_modules");

function ensurePackageCopied(packageName) {
  let pkgJsonPath;
  try {
    pkgJsonPath = require.resolve(`${packageName}/package.json`);
  } catch (error) {
    console.error(
      `[ensure-standalone-runtime] FATAL: could not resolve "${packageName}" from ${appDir}. ` +
        `The standalone server will crash at startup without it.`
    );
    throw error;
  }

  const sourceDir = dirname(pkgJsonPath);
  const destDir = join(standaloneNodeModules, packageName);

  if (!existsSync(dirname(destDir))) {
    mkdirSync(dirname(destDir), { recursive: true });
  }

  cpSync(sourceDir, destDir, { recursive: true, force: true });
  console.log(`[ensure-standalone-runtime] copied ${packageName} (${sourceDir} -> ${destDir})`);
}

const standaloneRoot = join(appDir, ".next", "standalone");
if (!existsSync(standaloneRoot)) {
  console.error(
    `[ensure-standalone-runtime] FATAL: ${standaloneRoot} does not exist. ` +
      `Run "next build" with output: "standalone" in next.config before this script.`
  );
  process.exit(1);
}

for (const packageName of ["styled-jsx"]) {
  ensurePackageCopied(packageName);
}
