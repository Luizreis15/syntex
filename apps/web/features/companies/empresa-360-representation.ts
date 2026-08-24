import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { hasAnyGrant, type UserGrant } from "@syntex/permissions";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";

type Client = SupabaseClient<Database>;

export type Empresa360TimelineRow = {
  id: string;
  status: string;
  basis: string | null;
  valid_from: string;
  valid_until: string | null;
  evidence: string | null;
};

export type Empresa360RepresentationBlock = {
  resolution: Awaited<ReturnType<typeof resolveRepresentation>> | null;
  timeline: Empresa360TimelineRow[];
};

/**
 * Carrega o bloco jurídico de representação da Empresa 360.
 * Sem `representation.read`: não consulta union_representation nem resolve.
 */
export async function fetchEmpresa360RepresentationBlock(
  supabase: Client,
  tenantId: string,
  grants: UserGrant[],
  matrizId: string | null,
  referenceDate: string,
): Promise<Empresa360RepresentationBlock | null> {
  if (!hasAnyGrant(grants, "representation.read")) {
    return null;
  }

  if (!matrizId) {
    return { resolution: null, timeline: [] };
  }

  const [resolution, timelineRes] = await Promise.all([
    resolveRepresentation(supabase, tenantId, matrizId, referenceDate),
    supabase
      .from("union_representation")
      .select("id, status, basis, valid_from, valid_until, evidence")
      .eq("tenant_id", tenantId)
      .eq("establishment_id", matrizId)
      .order("valid_from", { ascending: true }),
  ]);

  return {
    resolution,
    timeline: (timelineRes.data ?? []) as Empresa360TimelineRow[],
  };
}
