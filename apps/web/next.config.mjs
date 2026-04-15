/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  transpilePackages: [
    "@barops/shared-types",
    "@barops/rules-engine",
    "@barops/demo-data",
    "@barops/report-templates"
  ]
};

export default nextConfig;
