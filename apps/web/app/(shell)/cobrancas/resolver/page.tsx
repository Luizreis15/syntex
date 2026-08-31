import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { RevenueAssessmentForm } from "@/features/charges/revenue-assessment-form";
import { fetchRevenuePlanOptions } from "@/features/revenue-plans/data";

export default async function ResolverDebitosPage({
  searchParams,
}: {
  searchParams: { companyId?: string; planId?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "finance.read")) {
    return (
      <div>
        <SyntexPageHeader
          breadcrumbs={[{ label: "Financeiro" }, { label: "Cobranças", href: "/cobrancas" }, { label: "Calcular" }]}
          title="Calcular cobrança"
        />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="finance.read é necessária." />
        </div>
      </div>
    );
  }

  const [{ data: companies }, plans] = await Promise.all([session.supabase
    .from("company")
    .select("id, legal_name, trade_name, cnpj, establishment(id, cnpj, kind, municipality:municipality_id(name, state_code))")
    .eq("tenant_id", session.tenantId)
    .order("legal_name")
    .limit(200), fetchRevenuePlanOptions(session.supabase, session.tenantId)]);

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Financeiro" }, { label: "Cobranças", href: "/cobrancas" }, { label: "Calcular" }]}
        title="Apurar competência"
        metadata={
          <span className="text-body text-ink-2">
            Plano → base da competência → memória de cálculo → cobrança.
          </span>
        }
        actions={
          <Link
            href="/cobrancas"
            className="inline-flex h-input items-center rounded-control border-2 border-petrol-800 bg-white px-4 text-body font-semibold text-petrol-900 hover:bg-teal-50"
          >
            Ver cobranças
          </Link>
        }
      />
      <div className="p-6">
        <RevenueAssessmentForm
          plans={plans}
          canWrite={hasAnyGrant(session.grants, "finance.write")}
          companies={(companies ?? []).map((c) => ({
            id: c.id,
            label: `${c.trade_name ?? c.legal_name} · ${c.cnpj}`,
            establishments: ((c.establishment ?? []) as unknown as Array<{ id: string; cnpj: string; kind: string; municipality: { name: string; state_code: string } | null }>).map((establishment) => ({ id: establishment.id, label: `${establishment.kind === "matriz" ? "Matriz" : "Filial"} · ${establishment.cnpj}${establishment.municipality ? ` · ${establishment.municipality.name}/${establishment.municipality.state_code}` : ""}` })),
          }))}
          initialPlanId={searchParams.planId?.trim() || ""}
          initialCompanyId={searchParams.companyId?.trim() || ""}
        />
      </div>
    </div>
  );
}
