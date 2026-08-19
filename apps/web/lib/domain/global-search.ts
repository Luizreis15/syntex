import { can, hasAnyGrant } from "@syntex/permissions";
import type { Session } from "@/lib/auth/session";

export interface GlobalSearchResult {
  companies: { id: string; label: string; sublabel: string }[];
  establishments: { id: string; companyId: string; label: string; sublabel: string }[];
}

/**
 * Busca global do command palette (design/SYNTEX-UI.md, prompt 02 §24) —
 * extraída da rota para ser testável direto (tests/global-search.test.ts):
 * nunca pode devolver empresa/estabelecimento de outro tenant nem de fora
 * do escopo de branch do usuário.
 *
 * Usa `can()` diretamente (não `checkPermission`/`require-permission.ts`):
 * aquele módulo importa `session.ts`, que tem `import "server-only"` — só
 * roda dentro do pipeline do Next. Uma função de domínio testável em Vitest
 * não pode depender disso.
 */
export async function globalSearch(session: Session, rawQuery: string): Promise<GlobalSearchResult> {
  const q = rawQuery.trim();
  if (q.length < 2) return { companies: [], establishments: [] };

  const digits = q.replace(/\D/g, "");
  const byCnpj = digits.length >= 3;

  const companies: GlobalSearchResult["companies"] = [];
  const establishments: GlobalSearchResult["establishments"] = [];

  if (!hasAnyGrant(session.grants, "company.read")) {
    return { companies, establishments };
  }

  let companyQuery = session.supabase
    .from("company")
    .select("id, cnpj, legal_name, trade_name, branch_id")
    .eq("tenant_id", session.tenantId)
    .limit(6);
  companyQuery = byCnpj ? companyQuery.ilike("cnpj", `%${digits}%`) : companyQuery.ilike("legal_name", `%${q}%`);
  const { data: companyRows } = await companyQuery;

  for (const row of companyRows ?? []) {
    const allowed = can(
      session.grants,
      "company.read",
      session.tenantId,
      { tenantId: session.tenantId, branchId: row.branch_id },
      session.appUserId,
    );
    if (!allowed) continue;
    companies.push({ id: row.id, label: row.trade_name ?? row.legal_name, sublabel: row.cnpj });
  }

  if (hasAnyGrant(session.grants, "establishment.read")) {
    let establishmentQuery = session.supabase
      .from("establishment")
      .select(
        "id, cnpj, kind, company_id, company:establishment_company_id_tenant_id_fkey(legal_name, trade_name, branch_id)",
      )
      .eq("tenant_id", session.tenantId)
      .limit(6);
    establishmentQuery = byCnpj ? establishmentQuery.ilike("cnpj", `%${digits}%`) : establishmentQuery;
    const { data: establishmentRows } = await establishmentQuery;

    for (const row of establishmentRows ?? []) {
      const company = row.company as unknown as {
        legal_name: string;
        trade_name: string | null;
        branch_id: string | null;
      } | null;
      if (!company) continue;
      const allowed = can(
        session.grants,
        "establishment.read",
        session.tenantId,
        { tenantId: session.tenantId, branchId: company.branch_id },
        session.appUserId,
      );
      if (!allowed) continue;
      establishments.push({
        id: row.id,
        companyId: row.company_id,
        label: `${row.kind === "matriz" ? "Matriz" : "Filial"} — ${company.trade_name ?? company.legal_name}`,
        sublabel: row.cnpj,
      });
    }
  }

  return { companies, establishments };
}
