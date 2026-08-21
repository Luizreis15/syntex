import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { allowedBranchIds, allowedCompanyIds, type UserGrant } from "@syntex/permissions";
import type { DomainState } from "@/components/ui/syntex-status";
import { computeRepresentationTimeline, type TimelinePeriod } from "@/lib/domain/representation-timeline";
import { slugify } from "./slug";

export interface CompaniesFilter {
  q?: string;
  municipio?: string;
  status?: string;
  pageIndex: number;
  pageSize: number;
}

export interface CompanyRow {
  id: string;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  municipalityName: string | null;
  status: string;
  validity: TimelinePeriod[];
}

export interface CompaniesPage {
  rows: CompanyRow[];
  rowCount: number;
  municipalityOptions: { id: string; slug: string; name: string }[];
}

export async function fetchCompaniesPage(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  grants: UserGrant[],
  filter: CompaniesFilter,
): Promise<CompaniesPage> {
  // Escopo de branch (CLAUDE.md #2: autorização rica em app-layer, RLS só
  // isola tenant). "all" = grant de tenant/global; [] = nenhum acesso;
  // lista de ids = restrito às unidades concedidas.
  const branchScope = allowedBranchIds(grants, "company.read");
  const companyScope = allowedCompanyIds(grants, "company.read");

  if (companyScope !== "all") {
    if (companyScope.length === 0) {
      return { rows: [], rowCount: 0, municipalityOptions: [] };
    }
  } else if (branchScope !== "all" && branchScope.length === 0) {
    return { rows: [], rowCount: 0, municipalityOptions: [] };
  }

  let municipalityQuery = supabase
    .from("company")
    .select("municipality:municipality_id(id, name)")
    .eq("tenant_id", tenantId)
    .not("municipality_id", "is", null);
  if (branchScope !== "all") municipalityQuery = municipalityQuery.in("branch_id", branchScope);
  if (companyScope !== "all") municipalityQuery = municipalityQuery.in("id", companyScope);
  const { data: municipalityRows } = await municipalityQuery;

  const seen = new Map<string, { id: string; name: string }>();
  for (const row of municipalityRows ?? []) {
    const m = row.municipality as unknown as { id: string; name: string } | null;
    if (m) seen.set(slugify(m.name), m);
  }
  const municipalityOptions = Array.from(seen.entries())
    .map(([slug, m]) => ({ slug, id: m.id, name: m.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  let statusCompanyIds: string[] | null = null;
  if (filter.status) {
    const { data: statusRows } = await supabase
      .from("company_current_representation")
      .select("company_id")
      .eq("tenant_id", tenantId)
      .eq("status", filter.status);
    statusCompanyIds = (statusRows ?? [])
      .map((r) => r.company_id)
      .filter((id): id is string => id !== null);
    if (statusCompanyIds.length === 0) {
      return { rows: [], rowCount: 0, municipalityOptions };
    }
  }

  let query = supabase
    .from("company")
    .select("id, cnpj, legal_name, trade_name, municipality:municipality_id(name)", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("legal_name");
  if (branchScope !== "all") query = query.in("branch_id", branchScope);
  if (companyScope !== "all") query = query.in("id", companyScope);

  if (filter.q) {
    const digits = filter.q.replace(/\D/g, "");
    query = digits.length >= 3 ? query.ilike("cnpj", `%${digits}%`) : query.ilike("legal_name", `%${filter.q}%`);
  }
  if (filter.municipio) {
    const match = municipalityOptions.find((m) => m.slug === filter.municipio);
    if (match) query = query.eq("municipality_id", match.id);
    else return { rows: [], rowCount: 0, municipalityOptions };
  }
  if (statusCompanyIds) {
    query = query.in("id", statusCompanyIds);
  }

  const from = filter.pageIndex * filter.pageSize;
  const { data, count, error } = await query.range(from, from + filter.pageSize - 1);
  if (error) throw error;

  let statusById = new Map<string, string>();
  if (data && data.length > 0) {
    const { data: statusRows } = await supabase
      .from("company_current_representation")
      .select("company_id, status")
      .eq("tenant_id", tenantId)
      .in(
        "company_id",
        data.map((c) => c.id),
      );
    statusById = new Map(
      (statusRows ?? [])
        .filter((r): r is { company_id: string; status: string } => r.company_id !== null && r.status !== null)
        .map((r) => [r.company_id, r.status]),
    );
  }

  const validityByCompany = await fetchValidityTimelines(
    supabase,
    tenantId,
    (data ?? []).map((c) => c.id),
  );

  const rows: CompanyRow[] = (data ?? []).map((c) => ({
    id: c.id,
    cnpj: c.cnpj,
    legalName: c.legal_name,
    tradeName: c.trade_name,
    municipalityName: (c.municipality as unknown as { name: string } | null)?.name ?? null,
    status: statusById.get(c.id) ?? "sem_representacao",
    validity: validityByCompany.get(c.id) ?? [],
  }));

  return { rows, rowCount: count ?? 0, municipalityOptions };
}

/** Faixa de vigência da coluna reduzida — vigência do estabelecimento matriz de cada empresa da página. */
async function fetchValidityTimelines(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  companyIds: string[],
): Promise<Map<string, TimelinePeriod[]>> {
  if (companyIds.length === 0) return new Map();

  const { data: matrizes } = await supabase
    .from("establishment")
    .select("id, company_id")
    .eq("tenant_id", tenantId)
    .eq("kind", "matriz")
    .in("company_id", companyIds);
  if (!matrizes || matrizes.length === 0) return new Map();

  const companyByEstablishment = new Map(matrizes.map((e) => [e.id, e.company_id]));
  const { data: representations } = await supabase
    .from("union_representation")
    .select("establishment_id, valid_from, valid_until, status")
    .eq("tenant_id", tenantId)
    .in(
      "establishment_id",
      matrizes.map((e) => e.id),
    );

  const today = new Date().toISOString().slice(0, 10);
  const rowsByCompany = new Map<string, { validFrom: string; validUntil: string | null; status: DomainState }[]>();
  for (const r of representations ?? []) {
    const companyId = companyByEstablishment.get(r.establishment_id);
    if (!companyId) continue;
    const list = rowsByCompany.get(companyId) ?? [];
    list.push({ validFrom: r.valid_from, validUntil: r.valid_until, status: r.status as DomainState });
    rowsByCompany.set(companyId, list);
  }

  const result = new Map<string, TimelinePeriod[]>();
  for (const [companyId, rows] of rowsByCompany) {
    result.set(companyId, computeRepresentationTimeline(rows, today));
  }
  return result;
}
