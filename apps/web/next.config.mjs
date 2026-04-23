/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@funqa/contracts"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/styled-jsx/**/*"]
  }
};

export default nextConfig;
