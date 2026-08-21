import { NextResponse } from "next/server";
import { getSupabasePublicConfig } from "@syntex/database";

/**
 * Diagnóstico de ambiente (sem vazar valores).
 * GET /api/health/env
 */
export async function GET() {
  const { url, anon } = getSupabasePublicConfig();
  return NextResponse.json({
    ok: Boolean(url && anon),
    hasUrl: Boolean(url),
    hasAnon: Boolean(anon),
    hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    hasPrefixedUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    hasPrefixedAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
    hasRuntimeUrl: Boolean(process.env.SUPABASE_URL?.trim()),
    hasRuntimeAnon: Boolean(process.env.SUPABASE_ANON_KEY?.trim()),
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
