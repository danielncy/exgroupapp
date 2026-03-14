/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ex-group/shared", "@ex-group/ui", "@ex-group/db"],
};

module.exports = nextConfig;
