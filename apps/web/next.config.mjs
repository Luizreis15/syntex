/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo: garante que packages internos entram no bundle do Edge/Server.
  transpilePackages: [
    "@syntex/database",
    "@syntex/permissions",
    "@syntex/types",
    "@syntex/validation",
    "@syntex/payments",
  ],
};

export default nextConfig;
