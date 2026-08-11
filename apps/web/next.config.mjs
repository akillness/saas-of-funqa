/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@funqa/contracts"],
  // Genkit is intentionally NOT in serverExternalPackages: App Hosting's
  // buildpack reassembles the app layer after our build script runs, so
  // externals are not reliably present at runtime. Bundling the Genkit
  // engine into the compiled route chunks removes the runtime resolution.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/styled-jsx/**/*"]
  }
};

export default nextConfig;
