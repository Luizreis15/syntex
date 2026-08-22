/**
 * Proteções contra execução acidental do seed em produção / remoto sem flag.
 */

type SeedEnv = {
  NODE_ENV?: string;
  VERCEL_ENV?: string;
  SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SYNTEX_ALLOW_REMOTE_DEV_SEED?: string;
  SYNTEX_SEED_REFERENCE_DATE?: string;
};

export function assertSeedEnvironmentAllowed(env: SeedEnv = process.env): {
  supabaseUrlHost: string;
  isRemote: boolean;
} {
  if (env.NODE_ENV === "production") {
    throw new Error("Seed DEMO recusado: NODE_ENV=production.");
  }
  if (env.VERCEL_ENV === "production") {
    throw new Error("Seed DEMO recusado: VERCEL_ENV=production.");
  }

  const url =
    env.SUPABASE_URL?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  if (!url) {
    throw new Error("Seed DEMO recusado: SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL ausente.");
  }

  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    throw new Error("Seed DEMO recusado: URL do Supabase inválida.");
  }

  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]");

  if (!isLocal && env.SYNTEX_ALLOW_REMOTE_DEV_SEED !== "1") {
    throw new Error(
      "Seed DEMO em Supabase remoto exige SYNTEX_ALLOW_REMOTE_DEV_SEED=1 (DEV apenas).",
    );
  }

  return { supabaseUrlHost: host, isRemote: !isLocal };
}

export function resolveSeedReferenceDate(env: SeedEnv = process.env): string {
  const fallback = "2026-08-22";
  const raw = env.SYNTEX_SEED_REFERENCE_DATE?.trim();
  if (!raw) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`SYNTEX_SEED_REFERENCE_DATE inválida: ${raw}`);
  }
  return raw;
}
