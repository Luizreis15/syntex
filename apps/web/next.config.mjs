import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@syntex/database",
    "@syntex/permissions",
    "@syntex/types",
    "@syntex/validation",
    "@syntex/payments",
  ],
};

// Só diagnóstico — não aborta. Login usa Server Action (env de runtime).
if (process.env.VERCEL) {
  const ok = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
  console.log(
    `[syntex] Build NEXT_PUBLIC_SUPABASE_*: ${ok ? "presentes" : "AUSENTES (login via server action usa runtime)"}`,
  );
}

export default nextConfig;
