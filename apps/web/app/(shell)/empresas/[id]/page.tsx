import { notFound, redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";
import type { DomainState } from "@/components/ui/syntex-status";
import {
  buildEmpresaSummary,
  buildWorkerMix,
  fetchEmpresa360Stats,
} from "@/features/companies/empresa-360-data";
import { Empresa360Header } from "@/features/companies/components/empresa-360-header";
import { Empresa360Tabs } from "@/features/companies/components/empresa-360-tabs";
import {
  buildRailFromTimeline,
  Empresa360StatusRail,
} from "@/features/companies/components/empresa-360-status-rail";
import { Empresa360Arrecadacao } from "@/features/companies/components/empresa-360-arrecadacao";
import { Empresa360Workers } from "@/features/companies/components/empresa-360-workers";
import { Empresa360Pendencias } from "@/features/companies/components/empresa-360-pendencias";
import { Empresa360Intelligence } from "@/features/companies/components/empresa-360-intelligence";
import { Empresa360Timeline } from "@/features/companies/components/empresa-360-timeline";
import { Empresa360Representacao } from "@/features/companies/components/empresa-360-representacao";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function asDomainState(status: string | null | undefined): DomainState | null {
  if (
    status === "reconhecida" ||
    status === "reivindicada" ||
    status === "disputada" ||
    status === "perdida" ||
    status === "sensivel"
  ) {
    return status;
  }
  return null;
}

/**
 * Empresa 360 — Modo A (Lovable-like): seed real + DEMO UI rotulado.
 */
export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "company.read")) {
    return (
      <div className="px-6 py-12">
        <p className="text-component font-semibold text-ink">Empresa indisponível</p>
        <p className="mt-2 max-w-lg text-body text-ink-2">
          Seu perfil não tem permissão para visualizar empresas.
        </p>
      </div>
    );
  }

  const date = searchParams.date ?? todayIso();

  const { data: company } = await session.supabase
    .from("company")
    .select(
      "*, municipality:municipality_id(name, state_code), cnae:primary_cnae_id(code, description)",
    )
    .eq("tenant_id", session.tenantId)
    .eq("id", params.id)
    .single();
  if (!company) notFound();

  const { data: establishments } = await session.supabase
    .from("establishment")
    .select("*, municipality:municipality_id(name, state_code)")
    .eq("tenant_id", session.tenantId)
    .eq("company_id", company.id)
    .order("kind");

  const matriz =
    (establishments ?? []).find((e) => e.kind === "matriz") ?? establishments?.[0] ?? null;

  const [resolution, stats, timelineRes] = await Promise.all([
    matriz
      ? resolveRepresentation(session.supabase, session.tenantId, matriz.id, date)
      : Promise.resolve(null),
    fetchEmpresa360Stats(session.supabase, session.tenantId, company.id),
    matriz
      ? session.supabase
          .from("union_representation")
          .select("id, status, basis, valid_from, valid_until, evidence")
          .eq("tenant_id", session.tenantId)
          .eq("establishment_id", matriz.id)
          .order("valid_from", { ascending: true })
      : Promise.resolve({
          data: [] as {
            id: string;
            status: string;
            basis: string | null;
            valid_from: string;
            valid_until: string | null;
            evidence: string | null;
          }[],
        }),
  ]);

  const timeline = timelineRes.data ?? [];
  const domainStatus = asDomainState(resolution?.status ?? null);
  const displayName = company.trade_name ?? company.legal_name;
  const municipality = company.municipality as unknown as {
    name: string;
    state_code: string;
  } | null;
  const cnae = company.cnae as unknown as { code: string; description: string } | null;
  const cityLabel = municipality
    ? `${municipality.name}/${municipality.state_code}`
    : company.address_city && company.address_state
      ? `${company.address_city}/${company.address_state}`
      : null;

  const summary = buildEmpresaSummary(stats);
  const workerMix = buildWorkerMix(stats);
  const railStops = buildRailFromTimeline(timeline, resolution?.status ?? null);
  const sinceLabel =
    timeline.find((r) => r.valid_until === null)?.valid_from?.slice(0, 10) ?? null;
  const sinceFmt = sinceLabel
    ? sinceLabel.slice(8, 10) + "/" + sinceLabel.slice(5, 7) + "/" + sinceLabel.slice(0, 4)
    : null;

  const matrizMunicipality = matriz
    ? ((matriz as unknown as { municipality: { name: string; state_code: string } | null })
        .municipality)
    : null;

  return (
    <div className="min-h-full bg-paper">
      <Empresa360Header
        companyId={company.id}
        name={displayName}
        legalName={company.trade_name ? company.legal_name : null}
        cnpj={company.cnpj}
        cityLabel={
          matrizMunicipality
            ? `${matrizMunicipality.name}/${matrizMunicipality.state_code}`
            : cityLabel
        }
        cnaeLabel={cnae?.code ?? null}
        establishmentCount={(establishments ?? []).length}
        domainStatus={domainStatus}
        summary={summary}
      />

      <Empresa360Tabs
        visaoGeral={
          <>
            <Empresa360StatusRail
              stops={railStops}
              domainStatus={domainStatus}
              sinceLabel={sinceFmt}
              showClaimSplit={domainStatus === "disputada" || domainStatus === "reivindicada"}
            />

            <Empresa360Representacao
              date={date}
              establishments={(establishments ?? []).map((e) => {
                const m = (e as unknown as { municipality: { name: string } | null }).municipality;
                return {
                  id: e.id,
                  kind: e.kind,
                  cnpj: e.cnpj,
                  municipalityName: m?.name ?? null,
                };
              })}
              resolution={resolution}
              timeline={timeline.map((r) => ({
                id: r.id,
                status: r.status,
                basis: r.basis,
                valid_from: r.valid_from,
                valid_until: r.valid_until,
                evidence: r.evidence,
              }))}
              mode="compact"
            />

            <div className="grid gap-5 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <Empresa360Arrecadacao companyId={company.id} />
              </div>
              <div className="space-y-5">
                <Empresa360Workers
                  total={stats.workersActive}
                  source={workerMix.source}
                  rows={workerMix.rows}
                />
                <Empresa360Pendencias charges={stats.openCharges} />
              </div>
            </div>

            <Empresa360Intelligence workersHint={stats.workersActive} />
            <Empresa360Timeline />
          </>
        }
        representacao={
          <Empresa360Representacao
            date={date}
            establishments={(establishments ?? []).map((e) => {
              const m = (e as unknown as { municipality: { name: string } | null }).municipality;
              return {
                id: e.id,
                kind: e.kind,
                cnpj: e.cnpj,
                municipalityName: m?.name ?? null,
              };
            })}
            resolution={resolution}
            timeline={timeline.map((r) => ({
              id: r.id,
              status: r.status,
              basis: r.basis,
              valid_from: r.valid_from,
              valid_until: r.valid_until,
              evidence: r.evidence,
            }))}
            mode="tab"
          />
        }
      />
    </div>
  );
}
