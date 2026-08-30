import Link from "next/link";
import { formatData } from "@/lib/formatters/data";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { CreateEstablishmentForm } from "@/features/companies/create-establishment-form";
import { representationStatusLabel } from "@/lib/domain/representation-status-label";

type Resolution = Awaited<
  ReturnType<typeof import("@/lib/domain/resolve-representation").resolveRepresentation>
>;

type EstabOption = { id: string; label: string };

/**
 * Representação — resolução temporal real (visão geral) ou aba completa.
 */
export function Empresa360Representacao({
  date,
  companyId,
  establishments,
  resolution,
  timeline,
  mode = "tab",
  canWriteEstablishment = false,
  municipalities = [],
  cnaes = [],
}: {
  date: string;
  companyId: string;
  establishments: {
    id: string;
    kind: string;
    cnpj: string;
    municipalityName: string | null;
  }[];
  resolution: Resolution | null;
  timeline: {
    id: string;
    status: string;
    basis: string | null;
    valid_from: string;
    valid_until: string | null;
    evidence: string | null;
  }[];
  /** compact = só resolução (visão geral / e2e); tab = estabelecimentos + timeline */
  mode?: "compact" | "tab";
  canWriteEstablishment?: boolean;
  municipalities?: EstabOption[];
  cnaes?: EstabOption[];
}) {
  const hasMatriz = establishments.some((e) => e.kind === "matriz");
  const resolutionPanel = (
    <DashboardPanel
      title="Representação na data"
      subtitle="Resolução temporal · fonte real"
    >
      <div className="space-y-4 px-5 py-4" data-testid="representation-resolution">
        <form className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 space-y-1">
            <label htmlFor="date" className="text-label text-ink-3">
              Data de referência
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date}
              className="h-input w-full rounded-control border border-border bg-surface px-2 text-body text-ink"
            />
          </div>
          <button
            type="submit"
            className="h-input rounded-control border border-border-strong px-3 text-body font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Consultar
          </button>
        </form>

        {resolution ? (
          <div className="space-y-3 rounded-control border border-border p-4">
            <div className="flex flex-wrap items-center gap-2 text-body">
              <span className="font-semibold text-ink">
                {representationStatusLabel(resolution.status)}
              </span>
              {resolution.basis ? (
                <span className="text-ink-2">base: {resolution.basis}</span>
              ) : null}
            </div>

            {resolution.status === "disputada" && resolution.conflicts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-body font-medium">Registros concorrentes nesta data (em juízo / disputa):</p>
                {resolution.conflicts.map((c) => (
                  <div key={c.id} className="rounded-control bg-surface-2 p-2 text-body">
                    <span className="font-semibold">{representationStatusLabel(c.status)}</span>{" "}
                    <span className="font-mono text-ink-2">
                      {formatData(c.valid_from)} →{" "}
                      {c.valid_until ? formatData(c.valid_until) : "atual"}
                    </span>
                    <p className="mt-1 text-ink-2">{c.evidence}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {resolution.status === "sem_representacao" ? (
              <p className="text-body text-ink-2">Nenhuma representação vigente nesta data.</p>
            ) : null}

            {resolution.representation ? (
              <p className="text-body text-ink-2">{resolution.evidence}</p>
            ) : null}

            {resolution.agreement ? (
              <div className="space-y-2 border-t border-border pt-3 text-body">
                <p className="font-medium">
                  CCT vigente ({resolution.agreement.kind.toUpperCase()}
                  {resolution.agreement.mediador_number
                    ? ` · Mediador ${resolution.agreement.mediador_number}`
                    : ""}
                  )
                </p>
                <p className="font-mono text-ink-2">
                  {formatData(resolution.agreement.valid_from)} →{" "}
                  {formatData(resolution.agreement.valid_until)} · data-base{" "}
                  {formatData(resolution.agreement.base_date)}
                </p>
                <p>
                  <Link
                    href={`/convencoes/${resolution.agreement.id}?date=${date}`}
                    className="text-label font-semibold text-petrol-700 hover:underline"
                  >
                    Abrir convenção
                  </Link>
                  {resolution.status === "reconhecida" ? (
                    <>
                      {" · "}
                      <Link
                        href={`/cobrancas/resolver?companyId=${companyId}`}
                        className="text-label font-semibold text-petrol-700 hover:underline"
                      >
                        Gerar cobrança
                      </Link>
                    </>
                  ) : null}
                </p>
                {resolution.contributionRules.length > 0 ? (
                  <ul className="space-y-1 text-ink-2" data-testid="contribution-rules">
                    {resolution.contributionRules.map((rule) => (
                      <li key={rule.id}>
                        <span className="font-medium text-ink">{rule.type}</span>
                        {" · "}
                        {rule.calculation_base}
                        {" · "}
                        <span className="font-mono">
                          {rule.value_type === "percentual" ? `${rule.value}%` : rule.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-2">CCT sem regra de contribuição vigente nesta data.</p>
                )}
              </div>
            ) : (
              resolution.representation && (
                <p className="border-t border-border pt-3 text-body text-ink-2">
                  Nenhuma CCT vigente encontrada para esta data (categorias/território/data).
                  {resolution.status === "reconhecida" ? (
                    <>
                      {" "}
                      <Link
                        href={`/cobrancas/resolver?companyId=${companyId}`}
                        className="font-semibold text-petrol-700 hover:underline"
                      >
                        Ir para cobrança
                      </Link>
                    </>
                  ) : null}
                </p>
              )
            )}
          </div>
        ) : (
          <p className="text-body text-ink-2">
            Sem estabelecimento matriz para resolver representação.
          </p>
        )}
      </div>
    </DashboardPanel>
  );

  if (mode === "compact") return resolutionPanel;

  return (
    <div className="space-y-5">
      <DashboardPanel title="Estabelecimentos" subtitle="Matriz e filiais na base">
        <ul className="divide-y divide-border/40">
          {establishments.map((e) => (
            <li
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-body"
            >
              <span className="font-semibold text-ink">
                {e.kind === "matriz" ? "Matriz" : "Filial"}
                <span className="ml-2 font-mono text-label font-normal text-ink-3">{e.cnpj}</span>
              </span>
              <span className="flex flex-wrap items-center gap-3 text-ink-2">
                <span>{e.municipalityName ?? "—"}</span>
                <Link
                  href={`/representacao/${e.id}`}
                  className="text-label font-semibold text-petrol-700 hover:underline"
                >
                  Representação
                </Link>
              </span>
            </li>
          ))}
          {establishments.length === 0 ? (
            <li className="px-5 py-8 text-ink-2">Nenhum estabelecimento cadastrado.</li>
          ) : null}
        </ul>
        {canWriteEstablishment ? (
          <div className="border-t border-border/40 px-5 py-4">
            <CreateEstablishmentForm
              companyId={companyId}
              municipalities={municipalities}
              cnaes={cnaes}
              defaultKind={hasMatriz ? "filial" : "matriz"}
            />
          </div>
        ) : null}
      </DashboardPanel>

      <DashboardPanel title="Linha do tempo da representação" subtitle="Histórico cadastrado">
        <div className="space-y-2 px-5 py-4">
          {timeline.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-body">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{representationStatusLabel(r.status)}</span>
                {r.basis ? <span className="text-ink-2">{r.basis}</span> : null}
              </div>
              <span className="font-mono text-ink-2">
                {formatData(r.valid_from)} → {r.valid_until ? formatData(r.valid_until) : "atual"}
              </span>
            </div>
          ))}
          {timeline.length === 0 ? (
            <p className="text-body text-ink-2">Sem histórico de representação.</p>
          ) : null}
        </div>
      </DashboardPanel>
    </div>
  );
}
