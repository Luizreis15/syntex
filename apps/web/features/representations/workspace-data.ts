import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { allowedBranchIds, type UserGrant } from "@syntex/permissions";
import type {
  ContributionRule,
  RepresentationBasis,
  RepresentationStatus,
} from "@syntex/types";
import {
  composeCurrentRepresentation,
  isRepresentationActiveOnDate,
  type RepresentationListStatus,
} from "@/lib/domain/compose-representation-status";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";
import { operationalReferenceDate } from "@/features/representations/data";

type Client = SupabaseClient<Database>;

export interface WorkspaceEstablishment {
  id: string;
  kind: "matriz" | "filial";
  cnpj: string;
  cnaeCode: string | null;
  cnaeDescription: string | null;
  municipalityName: string | null;
  municipalityId: string | null;
}

export interface WorkspaceCompany {
  id: string;
  name: string;
  branchId: string | null;
}

export interface WorkspaceRegistration {
  id: string;
  registryNumber: string;
  registeredAt: string;
  documentReference: string | null;
  economicCategoryName: string | null;
  professionalCategoryName: string | null;
  territoryMunicipalityNames: string[];
}

export interface WorkspaceClaim {
  id: string;
  status: RepresentationStatus;
  validFrom: string;
  validUntil: string | null;
  basis: RepresentationBasis;
  evidence: string;
  decidedAt: string | null;
  decidedByName: string | null;
  registration: WorkspaceRegistration | null;
}

export interface WorkspaceAgreement {
  id: string;
  kind: "cct" | "act";
  mediadorNumber: string | null;
  validFrom: string;
  validUntil: string;
  baseDate: string;
  economicCategoryName: string | null;
  professionalCategoryName: string | null;
}

export interface RepresentationWorkspace {
  establishment: WorkspaceEstablishment;
  company: WorkspaceCompany;
  currentStatus: RepresentationListStatus;
  activeClaimsCount: number;
  hasConflict: boolean;
  activeClaims: WorkspaceClaim[];
  history: WorkspaceClaim[];
  resolvedAgreement: WorkspaceAgreement | null;
  contributionRules: ContributionRule[];
  agreementBlockedByDispute: boolean;
  referenceDate: string;
}

export type RepresentationWorkspaceResult =
  | { ok: true; workspace: RepresentationWorkspace }
  | { ok: false; reason: "not_found" | "out_of_scope" };

/**
 * Workspace establishment-level — set-based + 1× resolveRepresentation.
 */
export async function fetchRepresentationWorkspace(
  supabase: Client,
  tenantId: string,
  grants: UserGrant[],
  establishmentId: string,
  opts?: { referenceDate?: string },
): Promise<RepresentationWorkspaceResult> {
  const referenceDate = opts?.referenceDate ?? operationalReferenceDate();
  const branchScope = allowedBranchIds(grants, "representation.read");

  if (branchScope !== "all" && branchScope.length === 0) {
    return { ok: false, reason: "out_of_scope" };
  }

  const { data: establishment, error: establishmentError } = await supabase
    .from("establishment")
    .select(
      "id, kind, cnpj, company_id, municipality_id, cnae_id, municipality:municipality_id(id, name), cnae:cnae_id(code, description)",
    )
    .eq("tenant_id", tenantId)
    .eq("id", establishmentId)
    .maybeSingle();

  if (establishmentError) throw establishmentError;
  if (!establishment) return { ok: false, reason: "not_found" };

  const { data: company, error: companyError } = await supabase
    .from("company")
    .select("id, legal_name, trade_name, branch_id")
    .eq("tenant_id", tenantId)
    .eq("id", establishment.company_id)
    .maybeSingle();

  if (companyError) throw companyError;
  if (!company) return { ok: false, reason: "not_found" };

  if (branchScope !== "all") {
    if (!company.branch_id || !branchScope.includes(company.branch_id)) {
      return { ok: false, reason: "out_of_scope" };
    }
  }

  const { data: representationRows, error: representationError } = await supabase
    .from("union_representation")
    .select(
      "id, status, valid_from, valid_until, basis, evidence, union_registration_id, decided_by, decided_at",
    )
    .eq("tenant_id", tenantId)
    .eq("establishment_id", establishmentId)
    .order("valid_from", { ascending: false });

  if (representationError) throw representationError;
  const rows = representationRows ?? [];

  const activeRaw = rows.filter((r) =>
    isRepresentationActiveOnDate(r.valid_from, r.valid_until, referenceDate),
  );
  const composed = composeCurrentRepresentation(
    activeRaw.map((r) => ({
      status: r.status as RepresentationStatus,
      validFrom: r.valid_from,
      validUntil: r.valid_until,
      basis: r.basis as RepresentationBasis,
      evidence: r.evidence,
      unionRegistrationId: r.union_registration_id,
      decidedAt: r.decided_at,
    })),
  );

  const registrationIds = Array.from(
    new Set(rows.map((r) => r.union_registration_id).filter((id): id is string => id != null)),
  );
  const decidedByIds = Array.from(
    new Set(rows.map((r) => r.decided_by).filter((id): id is string => id != null)),
  );

  const registrationById = new Map<string, WorkspaceRegistration>();
  const categoryNameById = new Map<string, string>();

  if (registrationIds.length > 0) {
    const { data: registrations, error: registrationsError } = await supabase
      .from("union_registration")
      .select(
        "id, registry_number, registered_at, document_reference, economic_category_id, professional_category_id",
      )
      .eq("tenant_id", tenantId)
      .in("id", registrationIds);
    if (registrationsError) throw registrationsError;

    const categoryIds = new Set<string>();
    for (const reg of registrations ?? []) {
      if (reg.economic_category_id) categoryIds.add(reg.economic_category_id);
      if (reg.professional_category_id) categoryIds.add(reg.professional_category_id);
    }

    if (categoryIds.size > 0) {
      const ids = Array.from(categoryIds);
      const [{ data: economic }, { data: professional }] = await Promise.all([
        supabase.from("economic_category").select("id, name").eq("tenant_id", tenantId).in("id", ids),
        supabase
          .from("professional_category")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", ids),
      ]);
      for (const row of economic ?? []) categoryNameById.set(row.id, row.name);
      for (const row of professional ?? []) categoryNameById.set(row.id, row.name);
    }

    const territoryNamesByReg = new Map<string, string[]>();
    const { data: territories, error: territoriesError } = await supabase
      .from("union_territory")
      .select("union_registration_id, municipality:municipality_id(name)")
      .eq("tenant_id", tenantId)
      .in("union_registration_id", registrationIds);
    if (territoriesError) throw territoriesError;
    for (const t of territories ?? []) {
      const name = (t.municipality as unknown as { name: string } | null)?.name;
      if (!name) continue;
      const list = territoryNamesByReg.get(t.union_registration_id) ?? [];
      list.push(name);
      territoryNamesByReg.set(t.union_registration_id, list);
    }

    for (const reg of registrations ?? []) {
      const territory = (territoryNamesByReg.get(reg.id) ?? []).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      );
      registrationById.set(reg.id, {
        id: reg.id,
        registryNumber: reg.registry_number,
        registeredAt: reg.registered_at,
        documentReference: reg.document_reference,
        economicCategoryName: reg.economic_category_id
          ? (categoryNameById.get(reg.economic_category_id) ?? null)
          : null,
        professionalCategoryName: reg.professional_category_id
          ? (categoryNameById.get(reg.professional_category_id) ?? null)
          : null,
        territoryMunicipalityNames: territory,
      });
    }
  }

  const decidedByName = new Map<string, string>();
  if (decidedByIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("app_user")
      .select("id, full_name")
      .eq("tenant_id", tenantId)
      .in("id", decidedByIds);
    if (usersError) throw usersError;
    for (const u of users ?? []) decidedByName.set(u.id, u.full_name);
  }

  function toClaim(row: (typeof rows)[number]): WorkspaceClaim {
    return {
      id: row.id,
      status: row.status as RepresentationStatus,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      basis: row.basis as RepresentationBasis,
      evidence: row.evidence,
      decidedAt: row.decided_at,
      decidedByName: row.decided_by ? (decidedByName.get(row.decided_by) ?? null) : null,
      registration: row.union_registration_id
        ? (registrationById.get(row.union_registration_id) ?? null)
        : null,
    };
  }

  const activeClaims = activeRaw.map(toClaim);
  const history = rows.map(toClaim);

  const resolution = await resolveRepresentation(
    supabase,
    tenantId,
    establishmentId,
    referenceDate,
  );

  let resolvedAgreement: WorkspaceAgreement | null = null;
  if (resolution.agreement) {
    const agreementCategoryIds = [
      resolution.agreement.economic_category_id,
      resolution.agreement.professional_category_id,
    ];
    const missing = agreementCategoryIds.filter((id) => !categoryNameById.has(id));
    if (missing.length > 0) {
      const [{ data: economic }, { data: professional }] = await Promise.all([
        supabase
          .from("economic_category")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", missing),
        supabase
          .from("professional_category")
          .select("id, name")
          .eq("tenant_id", tenantId)
          .in("id", missing),
      ]);
      for (const row of economic ?? []) categoryNameById.set(row.id, row.name);
      for (const row of professional ?? []) categoryNameById.set(row.id, row.name);
    }

    resolvedAgreement = {
      id: resolution.agreement.id,
      kind: resolution.agreement.kind,
      mediadorNumber: resolution.agreement.mediador_number,
      validFrom: resolution.agreement.valid_from,
      validUntil: resolution.agreement.valid_until,
      baseDate: resolution.agreement.base_date,
      economicCategoryName:
        categoryNameById.get(resolution.agreement.economic_category_id) ?? null,
      professionalCategoryName:
        categoryNameById.get(resolution.agreement.professional_category_id) ?? null,
    };
  }

  const municipality = establishment.municipality as unknown as {
    id: string;
    name: string;
  } | null;
  const cnae = establishment.cnae as unknown as { code: string; description: string } | null;

  return {
    ok: true,
    workspace: {
      establishment: {
        id: establishment.id,
        kind: establishment.kind as "matriz" | "filial",
        cnpj: establishment.cnpj,
        cnaeCode: cnae?.code ?? null,
        cnaeDescription: cnae?.description ?? null,
        municipalityName: municipality?.name ?? null,
        municipalityId: municipality?.id ?? establishment.municipality_id,
      },
      company: {
        id: company.id,
        name: company.trade_name ?? company.legal_name,
        branchId: company.branch_id,
      },
      currentStatus: composed.status,
      activeClaimsCount: composed.activeClaimsCount,
      hasConflict: composed.hasConflict,
      activeClaims,
      history,
      resolvedAgreement,
      contributionRules: resolution.contributionRules,
      agreementBlockedByDispute: composed.hasConflict || resolution.status === "disputada",
      referenceDate,
    },
  };
}
