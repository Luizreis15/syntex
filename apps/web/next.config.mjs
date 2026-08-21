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

// NEXT_PUBLIC_* são inlined no build. Sem elas o login vira createBrowserClient("","") .
// Na Vercel: NÃO marque NEXT_PUBLIC_* como Sensitive — Sensitive não entra no Build Step
// (só runtime). Anon key é pública por design; Sensitive fica para SERVICE_ROLE etc.
if (process.env.VERCEL || process.env.CI) {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(
    (k) => !process.env[k]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Build abortado: faltam ${missing.join(", ")} no Build. ` +
        `Na Vercel: edite cada uma → desmarque Sensitive (NEXT_PUBLIC_* precisam ir no bundle) ` +
        `→ confirme Production/Preview → Redeploy sem cache.`,
    );
  }
}

export default nextConfig;
