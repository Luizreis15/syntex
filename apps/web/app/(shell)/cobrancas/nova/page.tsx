import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { GenerateChargeForm } from "@/features/charges/generate-charge-form";

export default async function NovaCobrancaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "finance.write")) {
    return (
      <div>
        <SyntexPageHeader
          breadcrumbs={[{ label: "Financeiro" }, { label: "Cobrança", href: "/cobrancas" }, { label: "Nova" }]}
          title="Gerar cobrança"
        />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="finance.write é necessária." />
        </div>
      </div>
    );
  }

  const { data: companies } = await session.supabase
    .from("company")
    .select("id, legal_name, trade_name, cnpj")
    .eq("tenant_id", session.tenantId)
    .order("legal_name")
    .limit(200);

  const { data: rules } = await session.supabase
    .from("contribution_rule")
    .select(
      "id, type, value_type, value, calculation_base, collective_agreement:collective_agreement_id(mediador_number, kind)",
    )
    .eq("tenant_id", session.tenantId)
    .order("valid_from", { ascending: false })
    .limit(100);

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Financeiro" }, { label: "Cobrança", href: "/cobrancas" }, { label: "Nova" }]}
        title="Gerar cobrança"
        metadata={<span className="text-body text-ink-2">Obrigação com snapshot + cobrança pendente</span>}
      />
      <div className="p-6">
        <GenerateChargeForm
          companies={(companies ?? []).map((c) => ({
            id: c.id,
            label: `${c.trade_name ?? c.legal_name} · ${c.cnpj}`,
          }))}
          rules={(rules ?? []).map((r) => {
            const agreement = r.collective_agreement as unknown as {
              mediador_number: string | null;
              kind: string;
            } | null;
            return {
              id: r.id,
              label: `${r.type} · ${r.value_type === "percentual" ? `${r.value}%` : r.value} · ${agreement?.mediador_number ?? agreement?.kind ?? "CCT"}`,
            };
          })}
        />
      </div>
    </div>
  );
}
