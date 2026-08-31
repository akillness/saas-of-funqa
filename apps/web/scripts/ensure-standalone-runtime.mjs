#!/usr/bin/env node
/**
 * Next.js `output: "standalone"` uses build-time static tracing (@vercel/nft) to decide
 * which node_modules files get copied into `.next/standalone/node_modules`. `next.config.mjs`
 * now sets `outputFileTracingRoot` to the monorepo root so that tracer actually walks up to
 * wherever npm hoisted shared deps — but `next/dist/server/require-hook.js` also resolves
 * `styled-jsx` via a runtime `require.resolve()` call that static tracing can miss regardless
 * of tracing root, and SWC-compiled output pulls in `@swc/helpers` the same dynamic way. Both
 * failures only surface as a Cloud Run boot crash ("Cannot find module '<pkg>'"), never as a
 * local build error.
 *
 * This script copies each resolved package (wherever npm actually installed it — repo root or
 * apps/web) into `.next/standalone/node_modules/<pkg>` after every build, as a belt-and-suspenders
 * safety net on top of outputFileTracingRoot. See
 * knowledge/wiki/reports/apphosting-deploy-rollout-debug.md for the original styled-jsx incident,
 * and this fix's own commit for the follow-up @swc/helpers incident.
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

for (const packageName of ["styled-jsx", "@swc/helpers"]) {
  ensurePackageCopied(packageName);
}
