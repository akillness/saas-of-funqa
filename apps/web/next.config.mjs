/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": ["./node_modules/styled-jsx/**/*"]
  }
};

export default nextConfig;
