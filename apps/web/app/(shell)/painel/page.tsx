import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import {
  canAccessUnionDashboard,
  fetchUnionDashboard,
} from "@/features/dashboard/data";
import { buildLovableHeroBlock } from "@/features/dashboard/compose";
import {
  firstNameFromFullName,
  formatHeroClock,
  greetingForNow,
} from "@/features/dashboard/greeting";
import {
  aggregateOpenCharges,
  sortAttentionCharges,
} from "@/features/dashboard/charge-intel";
import { fetchChargesPage } from "@/features/charges/data";
import { DEMO_OPERACAO_AGORA, DEMO_STATUS } from "@/features/dashboard/demo-painel";
import { DashboardCommandHero } from "@/features/dashboard/components/dashboard-command-hero";
import { DashboardArrecadacaoChart } from "@/features/dashboard/components/dashboard-arrecadacao-chart";
import { DashboardOperationNow } from "@/features/dashboard/components/dashboard-operation-now";
import { DashboardIntelligence } from "@/features/dashboard/components/dashboard-intelligence";
import { DashboardMovimentoBase } from "@/features/dashboard/components/dashboard-movimento-base";
import { DashboardAlertas } from "@/features/dashboard/components/dashboard-alertas";
import {
  DashboardPriorityCompanies,
  priorityFromAttention,
} from "@/features/dashboard/components/dashboard-priority-companies";
import {
  DashboardAttentionCharges,
  type AttentionChargeRow,
} from "@/features/dashboard/components/dashboard-attention-charges";
import {
  DashboardOperationalAccess,
  type OperationalLink,
} from "@/features/dashboard/components/dashboard-operational-access";
import { DashboardSideRail, type QuickAction } from "@/features/dashboard/components/dashboard-side-rail";
import { DevDemoNotice } from "@/components/ui/dev-demo-mark";

function mapChargeRow(
  row: Awaited<ReturnType<typeof fetchChargesPage>>[number],
): AttentionChargeRow {
  const obligation = row.obligation as unknown as {
    company: { legal_name: string; trade_name: string | null; cnpj: string } | null;
  } | null;
  const company = obligation?.company;
  return {
    id: row.id,
    amount: Number(row.amount),
    dueDate: row.due_date,
    status: row.status,
    companyName: company?.trade_name || company?.legal_name || "Empresa",
    companyCnpj: company?.cnpj ?? null,
  };
}

/**
 * Command Center Modo A — composição Lovable (seed real + DEMO UI rotulado).
 */
export default async function PainelPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!canAccessUnionDashboard(session.grants)) {
    return (
      <div className="px-6 py-12">
        <p className="text-component font-semibold text-ink">Painel indisponível</p>
        <p className="mt-2 max-w-lg text-body text-ink-2">
          Seu perfil não tem permissão para nenhuma métrica do Command Center. A ausência de
          permissão não é exibida como zero.
        </p>
      </div>
    );
  }

  const grants = session.grants;
  const canFinance = hasAnyGrant(grants, "finance.read");
  const canCompany = hasAnyGrant(grants, "company.read");
  const canWorker = hasAnyGrant(grants, "worker.read");
  const canMembership = hasAnyGrant(grants, "membership.read");
  const canCreateCompany =
    hasAnyGrant(grants, "company.master.provision") || hasAnyGrant(grants, "company.write");
  const canCreateWorker = hasAnyGrant(grants, "worker.write");

  const [{ data: tenant }, { data: appUser }, metrics, chargesPage] = await Promise.all([
    session.supabase.from("tenant").select("slug, legal_name").eq("id", session.tenantId).single(),
    session.supabase.from("app_user").select("full_name").eq("id", session.appUserId).single(),
    fetchUnionDashboard(session.supabase, session.tenantId, session.grants),
    canFinance
      ? fetchChargesPage(session.supabase, session.tenantId).catch(() => [] as Awaited<
          ReturnType<typeof fetchChargesPage>
        >)
      : Promise.resolve([] as Awaited<ReturnType<typeof fetchChargesPage>>),
  ]);

  const branchScoped = session.grants.find((g) => g.scope === "branch" && g.branchId);
  let branchLabel = "Todas as unidades";
  if (branchScoped?.branchId) {
    const { data: branch } = await session.supabase
      .from("branch")
      .select("name")
      .eq("id", branchScoped.branchId)
      .single();
    branchLabel = branch?.name ?? branchLabel;
  }

  const now = new Date();
  const firstName = firstNameFromFullName(appUser?.full_name);
  const greeting = greetingForNow(now);
  const greetingLine = firstName ? `${greeting}, ${firstName}.` : `${greeting}.`;
  const tenantLabel = (tenant?.slug ?? "SYNTEX").toUpperCase();
  const contextLine = `${tenantLabel} · Operação consolidada · ${branchLabel}`;

  const mappedCharges = canFinance ? chargesPage.map(mapChargeRow) : [];
  const openMapped = mappedCharges.filter(
    (row) => row.status === "pendente" || row.status === "vencido",
  );
  const financeIntel = canFinance ? aggregateOpenCharges(openMapped, now) : null;
  const openRows = sortAttentionCharges(openMapped, now).slice(0, 8);
  const recentRows = mappedCharges.slice(0, 8);
  const priorityRows = priorityFromAttention(openMapped);

  const heroBlock = buildLovableHeroBlock(metrics, financeIntel);

  const actions: QuickAction[] = [];
  if (canCreateCompany) {
    actions.push({
      href: "/empresas/nova",
      label: "Nova empresa",
      variant: "primary",
      icon: "building",
    });
  }
  if (canCreateWorker) {
    actions.push({
      href: "/trabalhadores/novo",
      label: "Novo trabalhador",
      variant: "secondary",
      icon: "user",
    });
  }
  if (canFinance) {
    actions.push({
      href: "/cobrancas",
      label: "Ver cobranças",
      variant: "secondary",
      icon: "receipt",
    });
  }

  const operationalLinks: OperationalLink[] = [];
  if (canCompany) {
    operationalLinks.push({ href: "/empresas", label: "Empresas", hint: "Cadastro e base" });
  }
  if (canWorker) {
    operationalLinks.push({
      href: "/trabalhadores",
      label: "Trabalhadores",
      hint: "Vínculos ativos",
    });
  }
  if (canMembership) {
    operationalLinks.push({ href: "/filiacao", label: "Filiação", hint: "Associados" });
  }
  if (canFinance) {
    operationalLinks.push({ href: "/cobrancas", label: "Cobranças", hint: "Financeiro" });
  }

  return (
    <div className="min-h-full bg-paper">
      <DashboardCommandHero
        clockLabel={formatHeroClock(now)}
        greetingLine={greetingLine}
        contextLine={contextLine}
        block={heroBlock}
        alertCount={DEMO_STATUS.alertsCount}
      />

      <div className="space-y-6 px-6 py-6 xl:px-8">
        <DevDemoNotice />

        <div className="grid gap-5 xl:grid-cols-3 xl:gap-6">
          <div className="xl:col-span-2">
            <DashboardArrecadacaoChart />
          </div>
          <DashboardOperationNow items={DEMO_OPERACAO_AGORA} />
        </div>

        <DashboardIntelligence />

        <div className="grid gap-5 xl:grid-cols-3 xl:gap-6">
          <DashboardMovimentoBase />
          <div className="xl:col-span-2">
            <DashboardAlertas />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5 xl:gap-6">
          <div className="col-span-12 xl:col-span-8 2xl:col-span-9">
            {canFinance ? (
              <DashboardAttentionCharges
                openRows={openRows}
                recentRows={recentRows}
                intel={financeIntel}
              />
            ) : (
              <DashboardOperationalAccess links={operationalLinks} />
            )}
          </div>
          <aside className="col-span-12 xl:col-span-4 2xl:col-span-3">
            <DashboardSideRail actions={actions} financeIntel={financeIntel} />
          </aside>
        </div>

        {canFinance && priorityRows.length > 0 ? (
          <DashboardPriorityCompanies rows={priorityRows} />
        ) : null}
      </div>
    </div>
  );
}
