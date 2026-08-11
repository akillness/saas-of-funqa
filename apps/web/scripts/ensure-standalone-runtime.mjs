import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import {
  OPTIONAL_RUNTIME_EXTERNAL_ROOTS,
  RUNTIME_EXTERNAL_ROOTS,
  resolveClosure
} from "./runtime-dep-closure.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const standaloneNodeModules = path.join(appRoot, ".next", "standalone", "node_modules");

const require = createRequire(import.meta.url);

function ancestorNodeModuleDirs(startDir) {
  const dirs = [];
  let current = path.resolve(startDir);
  const { root } = path.parse(current);
  while (true) {
    dirs.push(current);
    if (current === root) break;
    current = path.dirname(current);
  }
  return dirs;
}

function resolvePackagePath(packageName, fromDirs = [appRoot]) {
  const searchDirs = [...new Set(fromDirs.flatMap((dir) => ancestorNodeModuleDirs(dir)))];
  try {
    return path.dirname(
      require.resolve(`${packageName}/package.json`, { paths: searchDirs })
    );
  } catch {
    // Packages with an `exports` map that omits ./package.json throw
    // ERR_PACKAGE_PATH_NOT_EXPORTED even when installed. Walk every ancestor
    // node_modules (covers workspace-root hoisting on App Hosting builders).
    for (const searchDir of searchDirs) {
      const local = path.join(searchDir, "node_modules", packageName);
      if (fs.existsSync(path.join(local, "package.json"))) return local;
    }
    return null;
  }
}

// Packages that Next.js needs at runtime but may be hoisted to the monorepo
// root (outside outputFileTracingRoot) and therefore missing from standalone.
const copies = [
  {
    packageName: "styled-jsx",
    targets: [
      path.join(standaloneNodeModules, "styled-jsx"),
      path.join(standaloneNodeModules, "next", "node_modules", "styled-jsx"),
    ],
  },
  {
    // @swc/helpers is required at runtime by next.js compiled output
    packageName: "@swc/helpers",
    targets: [
      path.join(standaloneNodeModules, "@swc", "helpers"),
    ],
  },
  {
    // react/react-dom/scheduler may be hoisted to monorepo root and not traced
    packageName: "react",
    targets: [
      path.join(standaloneNodeModules, "react"),
    ],
  },
  {
    packageName: "react-dom",
    targets: [
      path.join(standaloneNodeModules, "react-dom"),
    ],
  },
  {
    packageName: "scheduler",
    targets: [
      path.join(standaloneNodeModules, "scheduler"),
    ],
  },
];

for (const { packageName, targets } of copies) {
  const source = resolvePackagePath(packageName);
  if (!source) {
    console.warn(`Warning: package '${packageName}' not found — skipping`);
    continue;
  }

  for (const target of targets) {
    // Skip next/node_modules sub-targets if next wasn't traced there
    if (target.includes("node_modules/next/node_modules") && !fs.existsSync(path.dirname(target))) {
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.rmSync(target, { recursive: true, force: true });
    fs.cpSync(source, target, { recursive: true });
  }
  console.log(`Copied ${packageName} → standalone/node_modules`);
}

// Belt-and-braces for LOCAL standalone runs: mirror the runtime-external
// closure into standalone/node_modules. On App Hosting the adapter reassembles
// the app layer from the next-build trace, so the durable mechanism is
// prepare-runtime-deps.mjs + outputFileTracingIncludes (next.config.mjs);
// these copies only make a bare local `node .next/standalone/server.js` work.
const closure = resolveClosure(
  [...RUNTIME_EXTERNAL_ROOTS, ...OPTIONAL_RUNTIME_EXTERNAL_ROOTS],
  appRoot
);
let closureCopied = 0;
for (const [packageName, sourceDir] of closure) {
  const target = path.join(standaloneNodeModules, ...packageName.split("/"));
  if (fs.existsSync(target)) continue;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(sourceDir, target, {
    recursive: true,
    filter: (src) => !path.relative(sourceDir, src).split(path.sep).includes("node_modules")
  });
  closureCopied += 1;
}
console.log(
  `Copied ${closureCopied} runtime-external package(s) (${RUNTIME_EXTERNAL_ROOTS.join(", ")}) → standalone/node_modules`
);
