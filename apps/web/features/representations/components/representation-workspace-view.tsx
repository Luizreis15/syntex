import Link from "next/link";
import { Building2, Scale } from "lucide-react";
import {
  SyntexPanel,
  SyntexPanelBody,
  SyntexPanelDescription,
  SyntexPanelHeader,
  SyntexPanelTitle,
} from "@/components/ui/syntex-panel";
import { SyntexStatus, type DomainState } from "@/components/ui/syntex-status";
import { formatCnpj } from "@/lib/formatters/cnpj";
import { formatData } from "@/lib/formatters/data";
import { RepresentationClaimCard } from "@/features/representations/components/representation-claim-card";
import type { RepresentationWorkspace } from "@/features/representations/workspace-data";
import {
  ClaimRepresentationForm,
  type ClaimRegistrationOption,
} from "@/features/representations/components/claim-representation-form";

function statusLabel(status: RepresentationWorkspace["currentStatus"]): string {
  if (status === "sem_representacao") return "Sem representação";
  return status;
}

export function RepresentationWorkspaceView({
  workspace,
  canWrite = false,
  canDecide = false,
  registrations = [],
}: {
  workspace: RepresentationWorkspace;
  canWrite?: boolean;
  canDecide?: boolean;
  registrations?: ClaimRegistrationOption[];
}) {
  const { establishment, company, referenceDate } = workspace;

  return (
    <div className="min-h-full bg-paper">
      <section className="surface-identity relative overflow-hidden border-b border-border/60">
        <div className="hairline-grid-light pointer-events-none absolute inset-0 opacity-25" />
        <div className="relative px-6 pb-5 pt-6 xl:px-8">
          <nav className="flex flex-wrap items-center gap-2 font-mono text-label text-ink-3">
            <Link href="/representacao" className="hover:text-ink">
              Representação
            </Link>
            <span>/</span>
            <Link href={`/empresas/${company.id}`} className="hover:text-ink">
              {company.name}
            </Link>
            <span>/</span>
            <span className="text-petrol-600">
              {establishment.kind === "matriz" ? "Matriz" : "Filial"}
            </span>
          </nav>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="surface-command flex size-11 items-center justify-center rounded-control">
                <Scale className="size-5 text-teal" aria-hidden />
              </span>
              <div className="min-w-0">
                <h1 className="text-[1.55rem] leading-none font-black tracking-[-0.03em] text-ink">
                  {company.name}
                </h1>
                <p className="mt-2 text-sm font-semibold text-ink-2">
                  <span className="font-mono">{formatCnpj(establishment.cnpj)}</span>
                  {" · "}
                  {establishment.kind === "matriz" ? "Matriz" : "Filial"}
                  {establishment.municipalityName ? ` · ${establishment.municipalityName}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {workspace.currentStatus === "sem_representacao" ? (
                    <span className="text-label uppercase text-ink-3">Sem representação</span>
                  ) : (
                    <SyntexStatus
                      kind="domain"
                      state={workspace.currentStatus as DomainState}
                    />
                  )}
                                    <form className="flex flex-wrap items-center gap-2">
                    <label htmlFor="workspace-date" className="font-mono text-label text-ink-3">
                      referência
                    </label>
                    <input
                      id="workspace-date"
                      name="date"
                      type="date"
                      defaultValue={referenceDate}
                      className="h-8 rounded-control border border-border bg-surface px-2 font-mono text-label text-ink"
                    />
                    <button
                      type="submit"
                      className="h-8 rounded-control border border-border-strong px-2 text-label font-semibold text-ink hover:bg-surface-2"
                    >
                      Atualizar
                    </button>
                  </form>
                  {workspace.hasConflict ? (
                    <span className="text-label font-semibold text-status-disputada">
                      {workspace.activeClaimsCount} reivindicações vigentes
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 sm:items-end">
              <Link
                href={`/empresas/${company.id}`}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-control border border-border/70 bg-surface px-3.5 text-label font-bold text-ink transition-colors hover:bg-surface-2"
              >
                <Building2 className="size-3.5" aria-hidden /> Ver empresa
              </Link>
              {canWrite ? (
                <ClaimRepresentationForm
                  establishmentId={establishment.id}
                  currentStatus={workspace.currentStatus}
                  hasActiveClaims={workspace.activeClaimsCount > 0}
                  defaultValidFrom={referenceDate}
                  registrations={registrations}
                />
              ) : null}
              {workspace.currentStatus === "reconhecida" ? (
                <p className="text-dense text-ink-2">
                  Representação consolidada.{" "}
                  <Link href="/cobrancas/resolver" className="font-semibold text-petrol-700 hover:underline">
                    Resolver débitos e gerar cobrança
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 px-6 py-5 xl:grid-cols-[minmax(0,1fr)_22rem] xl:px-8">
        <div className="space-y-5">
          <SyntexPanel variant="raised" rail={workspace.hasConflict ? "amber" : "teal"}>
            <SyntexPanelHeader>
              <div>
                <SyntexPanelTitle>Reivindicações vigentes</SyntexPanelTitle>
                <SyntexPanelDescription>
                  {workspace.activeClaimsCount === 0
                    ? "Nenhuma representação vigente para este estabelecimento."
                    : workspace.hasConflict
                      ? "Conflito: todas as claims vigentes são listadas sem eleger vencedora."
                      : `Status consolidado: ${statusLabel(workspace.currentStatus)}.`}
                </SyntexPanelDescription>
              </div>
            </SyntexPanelHeader>
            <SyntexPanelBody className="space-y-3 px-5 py-4">
              {workspace.activeClaims.length === 0 ? (
                <p className="text-dense text-ink-2">
                  Nenhuma representação vigente para este estabelecimento.
                </p>
              ) : (
                workspace.activeClaims.map((claim) => (
                  <RepresentationClaimCard
                    key={claim.id}
                    claim={claim}
                    canDecide={canDecide}
                    hasCompetitors={workspace.activeClaimsCount > 1}
                  />
                ))
              )}
            </SyntexPanelBody>
          </SyntexPanel>

          <SyntexPanel variant="standard">
            <SyntexPanelHeader>
              <div>
                <SyntexPanelTitle>Histórico de representação</SyntexPanelTitle>
                <SyntexPanelDescription>
                  Somente fatos de union_representation · mais recente primeiro
                </SyntexPanelDescription>
              </div>
            </SyntexPanelHeader>
            <SyntexPanelBody className="space-y-3 px-5 py-4">
              {workspace.history.length === 0 ? (
                <p className="text-dense text-ink-2">Sem histórico de representação.</p>
              ) : (
                workspace.history.map((claim) => (
                  <RepresentationClaimCard key={claim.id} claim={claim} />
                ))
              )}
            </SyntexPanelBody>
          </SyntexPanel>
        </div>

        <aside className="space-y-5">
          <SyntexPanel variant="standard" rail="blue">
            <SyntexPanelHeader density="compact">
              <div>
                <SyntexPanelTitle className="text-dense">Convenção aplicável</SyntexPanelTitle>
                <SyntexPanelDescription>Resolução na data de referência</SyntexPanelDescription>
              </div>
            </SyntexPanelHeader>
            <SyntexPanelBody className="space-y-3 px-4 py-3 text-dense">
              {workspace.agreementBlockedByDispute ? (
                <p className="text-ink-2">
                  A disputa impede a seleção de uma convenção única.
                </p>
              ) : workspace.resolvedAgreement ? (
                <div className="space-y-2">
                  <p className="font-semibold text-ink">
                    {workspace.resolvedAgreement.kind.toUpperCase()}
                    {workspace.resolvedAgreement.mediadorNumber
                      ? ` · Mediador ${workspace.resolvedAgreement.mediadorNumber}`
                      : ""}
                  </p>
                  <p className="font-mono text-label text-ink-3">
                    {formatData(workspace.resolvedAgreement.validFrom)} →{" "}
                    {formatData(workspace.resolvedAgreement.validUntil)}
                  </p>
                  {(workspace.resolvedAgreement.economicCategoryName ||
                    workspace.resolvedAgreement.professionalCategoryName) && (
                    <p className="text-ink-2">
                      {[
                        workspace.resolvedAgreement.economicCategoryName,
                        workspace.resolvedAgreement.professionalCategoryName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  <Link
                    href={`/convencoes/${workspace.resolvedAgreement.id}?date=${workspace.referenceDate}`}
                    className="inline-flex text-label font-bold text-petrol-600 hover:underline"
                  >
                    Ver convenção
                  </Link>
                </div>
              ) : (
                <p className="text-ink-2">Nenhuma convenção aplicável nesta data.</p>
              )}
            </SyntexPanelBody>
          </SyntexPanel>

          <SyntexPanel variant="standard">
            <SyntexPanelHeader density="compact">
              <SyntexPanelTitle className="text-dense">Regras de contribuição</SyntexPanelTitle>
            </SyntexPanelHeader>
            <SyntexPanelBody className="px-4 py-3 text-dense">
              {workspace.contributionRules.length === 0 ? (
                <p className="text-ink-2">Nenhuma regra aplicável nesta data.</p>
              ) : (
                <ul className="space-y-2">
                  {workspace.contributionRules.map((rule) => (
                    <li key={rule.id} className="rounded-control bg-surface-2/60 px-2.5 py-2">
                      <span className="font-semibold text-ink">{rule.type}</span>
                      <span className="text-ink-2">
                        {" · "}
                        {rule.calculation_base}
                        {" · "}
                        <span className="font-mono">
                          {rule.value_type === "percentual" ? `${rule.value}%` : rule.value}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SyntexPanelBody>
          </SyntexPanel>

          <SyntexPanel variant="inset">
            <SyntexPanelHeader density="compact">
              <SyntexPanelTitle className="text-dense">Estabelecimento</SyntexPanelTitle>
            </SyntexPanelHeader>
            <SyntexPanelBody className="space-y-2 px-4 py-3 text-dense">
              <div>
                <p className="text-label font-semibold uppercase tracking-wide text-ink-3">CNPJ</p>
                <p className="font-mono text-ink">{formatCnpj(establishment.cnpj)}</p>
              </div>
              <div>
                <p className="text-label font-semibold uppercase tracking-wide text-ink-3">Tipo</p>
                <p className="capitalize text-ink">{establishment.kind}</p>
              </div>
              <div>
                <p className="text-label font-semibold uppercase tracking-wide text-ink-3">
                  Município
                </p>
                <p className="text-ink">{establishment.municipalityName ?? "—"}</p>
              </div>
              {establishment.cnaeCode ? (
                <div>
                  <p className="text-label font-semibold uppercase tracking-wide text-ink-3">CNAE</p>
                  <p className="text-ink">
                    <span className="font-mono">{establishment.cnaeCode}</span>
                    {establishment.cnaeDescription ? ` · ${establishment.cnaeDescription}` : ""}
                  </p>
                </div>
              ) : null}
            </SyntexPanelBody>
          </SyntexPanel>
        </aside>
      </div>
    </div>
  );
}
