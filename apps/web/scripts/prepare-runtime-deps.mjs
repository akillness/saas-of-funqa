import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  OPTIONAL_RUNTIME_EXTERNAL_ROOTS,
  RUNTIME_EXTERNAL_ROOTS,
  resolveClosure
} from "./runtime-dep-closure.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const appNodeModules = path.join(appRoot, "node_modules");

const closure = resolveClosure(
  [...RUNTIME_EXTERNAL_ROOTS, ...OPTIONAL_RUNTIME_EXTERNAL_ROOTS],
  appRoot
);
let copied = 0;
const missing = [];
const skippedOptional = [];

for (const rootPackage of RUNTIME_EXTERNAL_ROOTS) {
  if (!closure.has(rootPackage)) {
    missing.push(rootPackage);
  }
}
for (const optionalPackage of OPTIONAL_RUNTIME_EXTERNAL_ROOTS) {
  if (!closure.has(optionalPackage)) {
    skippedOptional.push(optionalPackage);
  }
}

for (const [packageName, sourceDir] of closure) {
  const target = path.join(appNodeModules, ...packageName.split("/"));
  if (path.resolve(sourceDir) === path.resolve(target)) continue;
  if (fs.existsSync(path.join(target, "package.json"))) continue;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(sourceDir, target, {
    recursive: true,
    // Exclude only node_modules NESTED INSIDE the package; the package's own
    // absolute path always contains /node_modules/.
    filter: (src) => !path.relative(sourceDir, src).split(path.sep).includes("node_modules")
  });
  copied += 1;
}

if (missing.length > 0) {
  console.error(`prepare-runtime-deps: unresolved packages: ${missing.join(", ")}`);
  process.exit(1);
}
if (skippedOptional.length > 0) {
  console.warn(
    `prepare-runtime-deps: optional externals not installed here (lazy paths only): ${skippedOptional.join(", ")}`
  );
}
console.log(
  `prepare-runtime-deps: ${closure.size} package(s) in closure, ${copied} copied into apps/web/node_modules`
);
