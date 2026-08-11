import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  OPTIONAL_RUNTIME_EXTERNAL_ROOTS,
  RUNTIME_EXTERNAL_ROOTS,
  resolveClosure
} from "./scripts/runtime-dep-closure.mjs";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

// Packages Next.js keeps external at runtime (its built-in server externals)
// whose files must ship inside the standalone bundle. prepare-runtime-deps.mjs
// copies them into apps/web/node_modules before the build; these globs make
// output file tracing include them. Genkit itself is NOT external — it is
// bundled into the compiled route chunks because the App Hosting adapter
// reassembles the app layer and drops post-build node_modules edits.
const runtimeExternalIncludes = [
  ...resolveClosure(
    [...RUNTIME_EXTERNAL_ROOTS, ...OPTIONAL_RUNTIME_EXTERNAL_ROOTS],
    appRoot
  ).keys()
].map((packageName) => `./node_modules/${packageName}/**/*`);

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@funqa/contracts"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/styled-jsx/**/*", ...runtimeExternalIncludes]
  }
};

export default nextConfig;
