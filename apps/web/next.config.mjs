// NOTE: do not set `outputFileTracingRoot` to the monorepo root here. It looks like the
// correct fix for hoisted deps (styled-jsx, @swc/helpers) missing from `.next/standalone/`,
// but it also changes the standalone output layout: `server.js` moves from
// `.next/standalone/server.js` to `.next/standalone/apps/web/server.js`, which does not match
// where Firebase App Hosting's Next.js adapter expects the entry point (rootDirectory-relative
// `.next/standalone/server.js`). Tried and reverted during the 2026-08-31 App Hosting
// deploy incident — see scripts/ensure-standalone-runtime.mjs for the actual fix (a targeted
// post-build copy of just the packages the standalone tracer misses).

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@funqa/contracts"]
};

export default nextConfig;
