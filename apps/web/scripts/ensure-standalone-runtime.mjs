import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const standaloneNodeModules = path.join(appRoot, ".next", "standalone", "node_modules");

const require = createRequire(import.meta.url);

function resolvePackagePath(packageName) {
  try {
    return path.dirname(require.resolve(`${packageName}/package.json`));
  } catch {
    const local = path.join(appRoot, "node_modules", packageName);
    if (fs.existsSync(local)) return local;
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
