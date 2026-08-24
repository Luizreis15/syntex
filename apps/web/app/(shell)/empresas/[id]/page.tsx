import { notFound, redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import type { DomainState } from "@/components/ui/syntex-status";
import {
  buildEmpresaSummary,
  buildWorkerMix,
  fetchEmpresa360Stats,
} from "@/features/companies/empresa-360-data";
import { fetchEmpresa360RepresentationBlock } from "@/features/companies/empresa-360-representation";
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
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";

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

  const canReadRepresentation = hasAnyGrant(session.grants, "representation.read");
  const canWriteEstablishment = hasAnyGrant(session.grants, "establishment.write");

  const [{ data: municipalities }, { data: cnaes }] = await Promise.all([
    session.supabase
      .from("municipality")
      .select("id, name, state_code")
      .order("name")
      .limit(600),
    session.supabase.from("cnae").select("id, code, description").order("code").limit(400),
  ]);

  const municipalityOptions = (municipalities ?? []).map((m) => ({
    id: m.id,
    label: `${m.name}/${m.state_code}`,
  }));
  const cnaeOptions = (cnaes ?? []).map((c) => ({
    id: c.id,
    label: `${c.code} — ${c.description}`,
  }));

  const [representationBlock, stats] = await Promise.all([
    fetchEmpresa360RepresentationBlock(
      session.supabase,
      session.tenantId,
      session.grants,
      matriz?.id ?? null,
      date,
    ),
    fetchEmpresa360Stats(session.supabase, session.tenantId, company.id),
  ]);

  const resolution = representationBlock?.resolution ?? null;
  const timeline = representationBlock?.timeline ?? [];
  const domainStatus = canReadRepresentation
    ? asDomainState(resolution?.status ?? null)
    : null;
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
            {canReadRepresentation ? (
              <>
                <Empresa360StatusRail
                  stops={railStops}
                  domainStatus={domainStatus}
                  sinceLabel={sinceFmt}
                  showClaimSplit={domainStatus === "disputada" || domainStatus === "reivindicada"}
                />

                <Empresa360Representacao
                  date={date}
                  companyId={company.id}
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
              </>
            ) : null}

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
          canReadRepresentation ? (
            <Empresa360Representacao
              date={date}
              companyId={company.id}
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
              canWriteEstablishment={canWriteEstablishment}
              municipalities={municipalityOptions}
              cnaes={cnaeOptions}
            />
          ) : (
            <SyntexEmptyState
              title="Sem acesso a Representação"
              description="Sua conta não tem representation.read. Os dados jurídicos de enquadramento não são carregados nesta ficha."
            />
          )
        }
      />
    </div>
  );
}
