#!/usr/bin/env node
/**
 * Next.js `output: "standalone"` uses build-time static tracing (@vercel/nft) to decide
 * which node_modules files get copied into `.next/standalone/node_modules`. In this monorepo,
 * `npm ci`/`npm install` run from inside apps/web still hoists most of apps/web's own direct
 * dependencies (react, react-dom, styled-jsx, ...) up to the repo-root node_modules instead of
 * apps/web/node_modules, even though apps/web ships its own isolated package-lock.json (see
 * knowledge/wiki/reports/apphosting-deploy-rollout-debug.md). Next's standalone tracer is scoped
 * to apps/web (it stops climbing at apps/web/package-lock.json), so it never visits the repo
 * root and silently drops every hoisted package from `.next/standalone/node_modules`. Separately,
 * `next/dist/server/require-hook.js` resolves `styled-jsx` and pulls in `@swc/helpers` via
 * `require.resolve()` calls that static tracing can miss even when a package IS installed
 * locally. Both failure modes only surface as a Cloud Run boot crash
 * ("Error: Cannot find module '<pkg>'"), never as a local `next build` error — confirmed against
 * three separate live App Hosting incidents on 2026-08-31 (styled-jsx, then @swc/helpers, then
 * react, each only discovered by deploying and reading the Cloud Run crash log).
 *
 * Rather than keep discovering missing packages one deploy at a time, this script copies every
 * direct runtime dependency from apps/web/package.json (wherever npm actually resolves it —
 * repo root or apps/web) plus the known Next-internal dynamic requires, into
 * `.next/standalone/node_modules/<pkg>` after every build. `outputFileTracingRoot` pointed at
 * the monorepo root was tried as a more "correct" general fix, but it moves
 * `.next/standalone/server.js` to `.next/standalone/apps/web/server.js`, which does not match
 * where Firebase App Hosting's Next.js adapter expects the entry point — reverted in favor of
 * this targeted copy.
 */
import { createRequire } from "node:module";
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = join(scriptDir, "..");
const standaloneNodeModules = join(appDir, ".next", "standalone", "node_modules");

const pkgJson = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
const directDependencyNames = Object.keys(pkgJson.dependencies ?? {}).filter(
  (name) => !pkgJson.dependencies[name].startsWith("file:")
);

// Not a direct dependency of apps/web — pulled in transitively by SWC-compiled output and
// resolved dynamically by Next at server startup, so static tracing can miss it even when
// `next` itself is traced correctly.
const alwaysInclude = ["@swc/helpers"];

const packagesToCopy = [...new Set([...directDependencyNames, ...alwaysInclude])];

function resolvePackageRoot(packageName) {
  // Deliberately do not `require.resolve()` the package itself or any subpath of it: some
  // packages (border-beam) omit "./package.json" from their `exports` map, and others
  // (firebase) define no "." export at all, so any exports-map-validated resolution throws
  // ERR_PACKAGE_PATH_NOT_EXPORTED even though the package is perfectly present on disk.
  // `require.resolve.paths()` only returns the ordered list of node_modules directories Node
  // would search — no exports-map validation involved — so walk that list and check each one
  // directly on disk instead.
  const searchPaths = require.resolve.paths(packageName) ?? [];
  for (const candidateNodeModules of searchPaths) {
    const candidateDir = join(candidateNodeModules, ...packageName.split("/"));
    if (existsSync(join(candidateDir, "package.json"))) {
      return candidateDir;
    }
  }
  throw new Error(
    `Could not find "${packageName}" under any of: ${searchPaths.join(", ")}`
  );
}

function ensurePackageCopied(packageName) {
  let sourceDir;
  try {
    sourceDir = resolvePackageRoot(packageName);
  } catch (error) {
    console.error(
      `[ensure-standalone-runtime] FATAL: could not resolve "${packageName}" from ${appDir}. ` +
        `The standalone server may crash at startup without it.`
    );
    throw error;
  }

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

for (const packageName of packagesToCopy) {
  ensurePackageCopied(packageName);
}
