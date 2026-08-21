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

// NEXT_PUBLIC_* são inlined no build. Sem elas o login em produção chama
// createBrowserClient("", "") e fica “Entrando…” para sempre.
if (process.env.NODE_ENV === "production") {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(
    (k) => !process.env[k]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Build abortado: faltam ${missing.join(", ")} no ambiente Vercel (Build). Redeploy sem cache após salvar as envs.`,
    );
  }
}

export default nextConfig;
