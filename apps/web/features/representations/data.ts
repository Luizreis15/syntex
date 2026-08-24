import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { allowedBranchIds, type UserGrant } from "@syntex/permissions";
import type { RepresentationBasis, RepresentationStatus } from "@syntex/types";
import { slugify } from "@/features/companies/slug";
import {
  composeCurrentRepresentation,
  isRepresentationActiveOnDate,
  type RepresentationListStatus,
} from "@/lib/domain/compose-representation-status";

type Client = SupabaseClient<Database>;

export type { RepresentationListStatus };

/** Data operacional centralizada — parametrizável para as-of futuro. */
export function operationalReferenceDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export interface RepresentationListItem {
  establishmentId: string;
  establishmentKind: "matriz" | "filial";
  establishmentCnpj: string;
  companyId: string;
  companyName: string;
  municipalityName: string | null;
  municipalityId: string | null;
  branchId: string | null;
  status: RepresentationListStatus;
  validFrom: string | null;
  validUntil: string | null;
  basis: RepresentationBasis | null;
  evidence: string | null;
  unionRegistrationId: string | null;
  registryNumber: string | null;
  activeClaimsCount: number;
  hasConflict: boolean;
  decidedAt: string | null;
}

export interface RepresentationListFilter {
  q?: string;
  status?: string;
  municipio?: string;
  kind?: string;
  pageIndex: number;
  pageSize: number;
}

export interface RepresentationMunicipalityOption {
  id: string;
  slug: string;
  name: string;
}

export interface RepresentationListPage {
  rows: RepresentationListItem[];
  rowCount: number;
  municipalityOptions: RepresentationMunicipalityOption[];
  referenceDate: string;
}

export type RepresentationStatusKey = RepresentationListStatus;

export interface RepresentationStatusSummary {
  total: number;
  byStatus: Record<RepresentationStatusKey, number>;
  referenceDate: string;
}

const EMPTY_BY_STATUS: Record<RepresentationStatusKey, number> = {
  reconhecida: 0,
  reivindicada: 0,
  disputada: 0,
  perdida: 0,
  sem_representacao: 0,
};

/**
 * Read model establishment-level, set-based.
 * Parte de establishment (LEFT JOIN lógico com rows vigentes).
 */
export async function fetchRepresentationListItems(
  supabase: Client,
  tenantId: string,
  grants: UserGrant[],
  opts: { referenceDate: string },
): Promise<{ items: RepresentationListItem[]; municipalityOptions: RepresentationMunicipalityOption[] }> {
  const { referenceDate } = opts;
  const branchScope = allowedBranchIds(grants, "representation.read");

  if (branchScope !== "all" && branchScope.length === 0) {
    return { items: [], municipalityOptions: [] };
  }

  let companiesQuery = supabase
    .from("company")
    .select("id, legal_name, trade_name, branch_id")
    .eq("tenant_id", tenantId);
  if (branchScope !== "all") {
    companiesQuery = companiesQuery.in("branch_id", branchScope);
  }
  const { data: companies, error: companiesError } = await companiesQuery;
  if (companiesError) throw companiesError;

  const companyById = new Map(
    (companies ?? []).map((c) => [
      c.id,
      {
        id: c.id,
        name: c.trade_name ?? c.legal_name,
        branchId: c.branch_id,
      },
    ]),
  );
  const companyIds = Array.from(companyById.keys());
  if (companyIds.length === 0) {
    return { items: [], municipalityOptions: [] };
  }

  const { data: establishments, error: establishmentsError } = await supabase
    .from("establishment")
    .select("id, kind, cnpj, company_id, municipality_id, municipality:municipality_id(id, name)")
    .eq("tenant_id", tenantId)
    .in("company_id", companyIds)
    .order("kind", { ascending: true });
  if (establishmentsError) throw establishmentsError;

  const establishmentRows = establishments ?? [];
  const establishmentIds = establishmentRows.map((e) => e.id);

  const activeByEstablishment = new Map<
    string,
    {
      status: RepresentationStatus;
      validFrom: string;
      validUntil: string | null;
      basis: RepresentationBasis;
      evidence: string;
      unionRegistrationId: string | null;
      decidedAt: string | null;
    }[]
  >();

  if (establishmentIds.length > 0) {
    const { data: representations, error: representationsError } = await supabase
      .from("union_representation")
      .select(
        "establishment_id, status, valid_from, valid_until, basis, evidence, union_registration_id, decided_at",
      )
      .eq("tenant_id", tenantId)
      .in("establishment_id", establishmentIds);
    if (representationsError) throw representationsError;

    for (const row of representations ?? []) {
      if (!isRepresentationActiveOnDate(row.valid_from, row.valid_until, referenceDate)) continue;
      const list = activeByEstablishment.get(row.establishment_id) ?? [];
      list.push({
        status: row.status as RepresentationStatus,
        validFrom: row.valid_from,
        validUntil: row.valid_until,
        basis: row.basis as RepresentationBasis,
        evidence: row.evidence,
        unionRegistrationId: row.union_registration_id,
        decidedAt: row.decided_at,
      });
      activeByEstablishment.set(row.establishment_id, list);
    }
  }

  const registrationIds = new Set<string>();
  for (const claims of activeByEstablishment.values()) {
    if (claims.length !== 1) continue;
    const id = claims[0]?.unionRegistrationId;
    if (id) registrationIds.add(id);
  }

  const registryById = new Map<string, string>();
  if (registrationIds.size > 0) {
    const { data: registrations, error: registrationsError } = await supabase
      .from("union_registration")
      .select("id, registry_number")
      .eq("tenant_id", tenantId)
      .in("id", Array.from(registrationIds));
    if (registrationsError) throw registrationsError;
    for (const reg of registrations ?? []) {
      registryById.set(reg.id, reg.registry_number);
    }
  }

  const municipalitySeen = new Map<string, { id: string; name: string }>();
  const items: RepresentationListItem[] = [];

  for (const est of establishmentRows) {
    const company = companyById.get(est.company_id);
    if (!company) continue;

    const municipality = est.municipality as unknown as { id: string; name: string } | null;
    if (municipality) {
      municipalitySeen.set(slugify(municipality.name), municipality);
    }

    const active = activeByEstablishment.get(est.id) ?? [];
    const composed = composeCurrentRepresentation(active);
    const registryNumber =
      composed.unionRegistrationId != null
        ? (registryById.get(composed.unionRegistrationId) ?? null)
        : null;

    items.push({
      establishmentId: est.id,
      establishmentKind: est.kind as "matriz" | "filial",
      establishmentCnpj: est.cnpj,
      companyId: company.id,
      companyName: company.name,
      municipalityName: municipality?.name ?? null,
      municipalityId: municipality?.id ?? est.municipality_id,
      branchId: company.branchId,
      status: composed.status,
      validFrom: composed.validFrom,
      validUntil: composed.validUntil,
      basis: composed.basis,
      evidence: composed.evidence,
      unionRegistrationId: composed.unionRegistrationId,
      registryNumber,
      activeClaimsCount: composed.activeClaimsCount,
      hasConflict: composed.hasConflict,
      decidedAt: composed.decidedAt,
    });
  }

  items.sort((a, b) => {
    const byCompany = a.companyName.localeCompare(b.companyName, "pt-BR");
    if (byCompany !== 0) return byCompany;
    if (a.establishmentKind !== b.establishmentKind) {
      return a.establishmentKind === "matriz" ? -1 : 1;
    }
    return a.establishmentCnpj.localeCompare(b.establishmentCnpj);
  });

  const municipalityOptions = Array.from(municipalitySeen.entries())
    .map(([slug, m]) => ({ slug, id: m.id, name: m.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return { items, municipalityOptions };
}

export function summarizeRepresentationList(
  items: RepresentationListItem[],
  referenceDate: string,
): RepresentationStatusSummary {
  const byStatus = { ...EMPTY_BY_STATUS };
  for (const item of items) {
    byStatus[item.status] += 1;
  }
  return { total: items.length, byStatus, referenceDate };
}

export function filterRepresentationListItems(
  items: RepresentationListItem[],
  filter: Omit<RepresentationListFilter, "pageIndex" | "pageSize">,
  municipalityOptions: RepresentationMunicipalityOption[],
): RepresentationListItem[] {
  let result = items;

  if (filter.status) {
    result = result.filter((item) => item.status === filter.status);
  }

  if (filter.kind === "matriz" || filter.kind === "filial") {
    result = result.filter((item) => item.establishmentKind === filter.kind);
  }

  if (filter.municipio) {
    const match = municipalityOptions.find((m) => m.slug === filter.municipio);
    if (!match) return [];
    result = result.filter((item) => item.municipalityId === match.id);
  }

  if (filter.q?.trim()) {
    const q = filter.q.trim().toLowerCase();
    const digits = filter.q.replace(/\D/g, "");
    result = result.filter((item) => {
      if (digits.length >= 3 && item.establishmentCnpj.includes(digits)) return true;
      return item.companyName.toLowerCase().includes(q);
    });
  }

  return result;
}

export function paginateRepresentationList(
  items: RepresentationListItem[],
  pageIndex: number,
  pageSize: number,
): RepresentationListItem[] {
  const from = pageIndex * pageSize;
  return items.slice(from, from + pageSize);
}

export async function fetchRepresentationListPage(
  supabase: Client,
  tenantId: string,
  grants: UserGrant[],
  filter: RepresentationListFilter,
  opts?: { referenceDate?: string },
): Promise<{
  page: RepresentationListPage;
  summary: RepresentationStatusSummary;
  allItems: RepresentationListItem[];
}> {
  const referenceDate = opts?.referenceDate ?? operationalReferenceDate();
  const { items, municipalityOptions } = await fetchRepresentationListItems(supabase, tenantId, grants, {
    referenceDate,
  });
  const summary = summarizeRepresentationList(items, referenceDate);
  const filtered = filterRepresentationListItems(items, filter, municipalityOptions);
  const rows = paginateRepresentationList(filtered, filter.pageIndex, filter.pageSize);

  return {
    allItems: items,
    summary,
    page: {
      rows,
      rowCount: filtered.length,
      municipalityOptions,
      referenceDate,
    },
  };
}
