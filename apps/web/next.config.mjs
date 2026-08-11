/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@funqa/contracts"],
  serverExternalPackages: ["genkit", "@genkit-ai/core", "@genkit-ai/ai", "@genkit-ai/google-genai"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/styled-jsx/**/*"]
  }
};

export default nextConfig;
