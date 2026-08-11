import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const standaloneNodeModules = path.join(appRoot, ".next", "standalone", "node_modules");

const require = createRequire(import.meta.url);

function resolvePackagePath(packageName, fromDirs = [appRoot]) {
  try {
    return path.dirname(
      require.resolve(`${packageName}/package.json`, { paths: fromDirs })
    );
  } catch {
    for (const fromDir of fromDirs) {
      const local = path.join(fromDir, "node_modules", packageName);
      if (fs.existsSync(local)) return local;
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

// The App Hosting runtime image contains ONLY the standalone tree: any
// server-external package (next.config serverExternalPackages) and every
// transitive dependency MUST physically exist inside
// standalone/node_modules. Copy full dependency closures for the packages
// the Genkit engine and styled-jsx load at runtime.
const closureRoots = [
  "genkit",
  "@genkit-ai/google-genai",
  "client-only"
];

const visited = new Set();
let closureCopied = 0;

function copyClosure(packageName, fromDir) {
  if (visited.has(packageName)) return;
  visited.add(packageName);

  const source = resolvePackagePath(packageName, [fromDir, appRoot]);
  if (!source) {
    console.warn(`Warning: closure package '${packageName}' not found — skipping`);
    return;
  }

  const target = path.join(standaloneNodeModules, ...packageName.split("/"));
  if (!fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, {
      recursive: true,
      filter: (src) => !src.includes(`${path.sep}node_modules${path.sep}`)
    });
    closureCopied += 1;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(source, "package.json"), "utf8"));
  } catch {
    return;
  }
  const dependencyNames = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
    ...(Array.isArray(manifest.bundleDependencies) ? manifest.bundleDependencies : []),
    ...Object.keys(manifest.peerDependencies ?? {}).filter((name) =>
      Boolean(resolvePackagePath(name, [source, appRoot]))
    )
  ];
  for (const dependencyName of dependencyNames) {
    copyClosure(dependencyName, source);
  }
}

for (const rootPackage of closureRoots) {
  copyClosure(rootPackage, appRoot);
}
console.log(
  `Copied ${closureCopied} closure package(s) for ${closureRoots.join(", ")} → standalone/node_modules`
);
