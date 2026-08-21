import { notFound, redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { OfficeActions } from "@/features/offices/office-actions";

export default async function EscritorioDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (
    !hasAnyGrant(session.grants, "office.provision") &&
    !hasAnyGrant(session.grants, "office.company.link")
  ) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Escritórios" }]} title="Escritório" />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="Sem acesso a este escritório." />
        </div>
      </div>
    );
  }

  const { data: office, error } = await session.supabase
    .from("office")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("id", params.id)
    .maybeSingle();
  if (error || !office) notFound();

  const { data: links } = await session.supabase
    .from("office_company_link")
    .select(
      "id, reason, valid_from, company:company_id(id, legal_name, trade_name, cnpj)",
    )
    .eq("tenant_id", session.tenantId)
    .eq("office_id", office.id)
    .is("valid_until", null);

  const { data: companies } = await session.supabase
    .from("company")
    .select("id, legal_name, trade_name, cnpj")
    .eq("tenant_id", session.tenantId)
    .order("legal_name");

  const linkedIds = new Set((links ?? []).map((l) => (l.company as unknown as { id: string }).id));
  const available = (companies ?? [])
    .filter((c) => !linkedIds.has(c.id))
    .map((c) => ({
      id: c.id,
      label: `${c.trade_name ?? c.legal_name} · ${c.cnpj}`,
    }));

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[
          { label: "Operação" },
          { label: "Escritórios", href: "/escritorios" },
          { label: office.name },
        ]}
        title={office.name}
        metadata={
          <span className="font-mono text-body text-ink-2">{office.document ?? "sem documento"}</span>
        }
      />
      <div className="space-y-6 p-6">
        <section className="space-y-2">
          <h2 className="text-component font-semibold text-ink">Empresas vinculadas</h2>
          {!links?.length ? (
            <p className="text-body text-ink-2">Nenhuma empresa ainda.</p>
          ) : (
            <ul className="space-y-2 text-body">
              {links.map((l) => {
                const company = l.company as unknown as {
                  legal_name: string;
                  trade_name: string | null;
                  cnpj: string;
                };
                return (
                  <li key={l.id} className="border-b border-border py-2">
                    <p className="font-medium">{company.trade_name ?? company.legal_name}</p>
                    <p className="font-mono text-label text-ink-2">{company.cnpj}</p>
                    <p className="text-label text-ink-3">{l.reason}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <OfficeActions officeId={office.id} companies={available} />
      </div>
    </div>
  );
}
