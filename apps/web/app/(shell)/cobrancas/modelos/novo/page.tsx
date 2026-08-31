import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { RevenuePlanForm } from "@/features/revenue-plans/revenue-plan-form";

export default async function NovoModeloCobrancaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!hasAnyGrant(session.grants, "contribution_rule.write")) {
    return <div><SyntexPageHeader breadcrumbs={[{ label: "Financeiro" }, { label: "Planos de arrecadação", href: "/cobrancas/modelos" }]} title="Novo plano" /><div className="p-6"><SyntexEmptyState title="Sem permissão" description="Você não pode cadastrar planos de arrecadação." /></div></div>;
  }

  const { data: agreements } = await session.supabase
    .from("collective_agreement")
    .select("id, kind, mediador_number, valid_from, valid_until")
    .eq("tenant_id", session.tenantId)
    .order("valid_from", { ascending: false });

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Financeiro" }, { label: "Planos de arrecadação", href: "/cobrancas/modelos" }, { label: "Novo" }]}
        title="Novo plano de arrecadação"
        metadata={<span className="text-body text-ink-2">Defina origem, responsáveis, fórmula e vigência antes de gerar cobranças.</span>}
      />
      <div className="p-6">
        <RevenuePlanForm agreements={(agreements ?? []).map((item) => ({ id: item.id, label: `${item.kind.toUpperCase()} · ${item.mediador_number ?? "sem número"}`, validFrom: item.valid_from, validUntil: item.valid_until }))} />
      </div>
    </div>
  );
}

