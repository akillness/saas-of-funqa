import fs from "node:fs";
import path from "node:path";

/**
 * Runtime packages that Next.js keeps external for the server build (its
 * built-in external list) but that live hoisted at the monorepo root — outside
 * apps/web, therefore outside the output-file-tracing root — on npm-workspace
 * installs such as the App Hosting builder. They must physically exist inside
 * apps/web/node_modules before `next build` so outputFileTracingIncludes can
 * ship them into the standalone bundle.
 */
export const RUNTIME_EXTERNAL_ROOTS = [
  "require-in-the-middle",
  "import-in-the-middle",
  "client-only",
  "express",
  "ajv",
  "ajv-formats"
];

function ancestorDirs(startDir) {
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

export function findPackageDir(packageName, fromDirs) {
  for (const fromDir of fromDirs.flatMap((dir) => ancestorDirs(dir))) {
    const candidate = path.join(fromDir, "node_modules", ...packageName.split("/"));
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }
  return null;
}

/** Resolve the full dependency closure (package names) for the given roots. */
export function resolveClosure(rootPackages, appRoot) {
  const visited = new Set();
  const queue = rootPackages.map((name) => ({ name, fromDir: appRoot }));
  const resolved = new Map();

  while (queue.length > 0) {
    const { name, fromDir } = queue.shift();
    if (visited.has(name)) continue;
    visited.add(name);

    const dir = findPackageDir(name, [fromDir, appRoot]);
    if (!dir) continue;
    resolved.set(name, dir);

    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    } catch {
      continue;
    }
    for (const dependencyName of [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.optionalDependencies ?? {})
    ]) {
      queue.push({ name: dependencyName, fromDir: dir });
    }
  }

  return resolved;
}
