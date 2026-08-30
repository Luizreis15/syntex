import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { ResolveDuesForm } from "@/features/charges/resolve-dues-form";

export default async function ResolverDebitosPage({
  searchParams,
}: {
  searchParams: { companyId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "finance.read")) {
    return (
      <div>
        <SyntexPageHeader
          breadcrumbs={[{ label: "Financeiro" }, { label: "Cobrança", href: "/cobrancas" }, { label: "Resolver" }]}
          title="O que deve"
        />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="finance.read é necessária." />
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

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Financeiro" }, { label: "Cobrança", href: "/cobrancas" }, { label: "Resolver" }]}
        title="O que deve"
        metadata={
          <span className="text-body text-ink-2">
            Empresa + competência → regras da CCT vigente → gerar cobrança
          </span>
        }
        actions={
          <Link href="/cobrancas" className="text-body text-petrol-700 hover:underline">
            Voltar às cobranças
          </Link>
        }
      />
      <div className="p-6">
        <ResolveDuesForm
          companies={(companies ?? []).map((c) => ({
            id: c.id,
            label: `${c.trade_name ?? c.legal_name} · ${c.cnpj}`,
          }))}
          initialCompanyId={searchParams.companyId?.trim() || ""}
        />
      </div>
    </div>
  );
}
