import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { CreateWorkerForm } from "@/features/workers/create-worker-form";

export default async function NovoTrabalhadorPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "worker.write")) {
    return (
      <div>
        <SyntexPageHeader
          breadcrumbs={[{ label: "Relações" }, { label: "Trabalhadores", href: "/trabalhadores" }, { label: "Novo" }]}
          title="Novo trabalhador"
        />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="worker.write é necessária." />
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

  const { data: branches } = await session.supabase
    .from("branch")
    .select("id, name")
    .eq("tenant_id", session.tenantId)
    .order("name");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Relações" }, { label: "Trabalhadores", href: "/trabalhadores" }, { label: "Novo" }]}
        title="Novo trabalhador"
        metadata={<span className="text-body text-ink-2">Pessoa · trabalhador · filiação · vínculo</span>}
      />
      <div className="p-6">
        <CreateWorkerForm
          companies={(companies ?? []).map((c) => ({
            id: c.id,
            label: `${c.trade_name ?? c.legal_name} · ${c.cnpj}`,
          }))}
          branches={(branches ?? []).map((b) => ({ id: b.id, label: b.name }))}
        />
      </div>
    </div>
  );
}
