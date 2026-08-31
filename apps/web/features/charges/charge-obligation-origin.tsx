import Link from "next/link";
import { representationStatusLabel } from "@/lib/domain/representation-status-label";
import type { RuleSnapshot } from "@/lib/domain/obligation";
import { formatMoeda } from "@/lib/formatters/moeda";

const RULE_TYPE_LABEL: Record<string, string> = {
  assistencial: "Contribuição assistencial",
  confederativa: "Contribuição confederativa",
  mensalidade: "Mensalidade",
  negocial: "Contribuição negocial",
  sindical: "Contribuição sindical",
  patronal: "Contribuição patronal",
  servico: "Serviço",
  outro: "Outra receita",
};

/**
 * Explica a origem da cobrança a partir do rule_snapshot (A2).
 * Não exibe evidence jurídica.
 */
export function ChargeObligationOrigin({
  snapshot,
  ruleLive,
  obligationStatus,
}: {
  snapshot: unknown;
  ruleLive: {
    type: string;
    value_type: string;
    value: number;
    calculation_base: string;
  } | null;
  obligationStatus: string;
}) {
  const parsed = parseSnapshot(snapshot);
  const rule = parsed?.rule;
  const agreement = parsed?.agreement;
  const origin = parsed?.origin;
  const assessment = parsed?.assessment?.calculation;

  const typeLabel =
    RULE_TYPE_LABEL[ruleLive?.type ?? rule?.type ?? ""] ??
    ruleLive?.type ??
    rule?.type ??
    "Contribuição";

  const valueLabel = formatRuleValue(
    ruleLive?.value_type ?? rule?.value_type,
    ruleLive?.value ?? rule?.value,
  );

  return (
    <section className="space-y-3 border-b border-border pb-4">
      <h2 className="text-component font-semibold text-ink">Por que esta cobrança existe</h2>
      <p className="text-body text-ink-2">
        Status da obrigação: <span className="font-medium text-ink">{obligationStatus}</span>
      </p>

      <dl className="grid gap-2 text-body sm:grid-cols-2">
        <div>
          <dt className="text-label text-ink-3">Regra</dt>
          <dd className="text-ink">
            {typeLabel}
            {valueLabel ? (
              <>
                {" · "}
                <span className="font-mono">{valueLabel}</span>
              </>
            ) : null}
            {ruleLive?.calculation_base || rule?.calculation_base ? (
              <span className="block text-dense text-ink-3">
                Base: {ruleLive?.calculation_base ?? rule?.calculation_base}
              </span>
            ) : null}
          </dd>
        </div>
        {assessment ? (
          <div className="sm:col-span-2 rounded-control border border-border bg-surface-inset p-3">
            <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">Memória de cálculo</dt>
            <dd className="mt-2 grid gap-2 sm:grid-cols-3">
              {assessment.inputs?.headcount != null ? <OriginValue label="Funcionários" value={String(assessment.inputs.headcount)} /> : null}
              {assessment.inputs?.categoryFloor != null ? <OriginValue label="Piso da categoria" value={formatMoeda(assessment.inputs.categoryFloor)} /> : null}
              {assessment.inputs?.declaredPayroll != null ? <OriginValue label="Folha declarada" value={formatMoeda(assessment.inputs.declaredPayroll)} /> : null}
              {assessment.unitAmount != null ? <OriginValue label="Por funcionário" value={formatMoeda(assessment.unitAmount)} /> : null}
              {assessment.formula ? <OriginValue label="Fórmula" value={assessment.formula} mono /> : null}
              {assessment.amount != null ? <OriginValue label="Total apurado" value={formatMoeda(assessment.amount)} /> : null}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-label text-ink-3">Competência</dt>
          <dd className="font-mono text-ink">{parsed?.competence ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-label text-ink-3">Instrumento coletivo</dt>
          <dd className="text-ink">
            {agreement ? (
              <>
                {agreement.kind.toUpperCase()}
                {agreement.mediador_number ? ` · ${agreement.mediador_number}` : ""}
                <span className="block font-mono text-dense text-ink-3">
                  {agreement.valid_from} → {agreement.valid_until}
                </span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-label text-ink-3">Representação na origem</dt>
          <dd className="text-ink">
            {origin?.representation_status && origin.representation_status !== "not_applicable" ? (
              <>
                Status <span className="font-medium">{representationStatusLabel(origin.representation_status)}</span>
                {origin.establishment_id ? (
                  <span className="mt-1 block">
                    <Link
                      href={`/representacao/${origin.establishment_id}`}
                      className="text-petrol-700 hover:underline"
                    >
                      Abrir workspace de representação
                    </Link>
                  </span>
                ) : null}
              </>
            ) : origin?.representation_status === "not_applicable" ? (
              <span className="text-ink-2">Não se aplica a este plano.</span>
            ) : (
              <span className="text-ink-3">
                Origem sindical não registrada neste snapshot (cobrança anterior ao A2 ou geração
                direta sem dues).
              </span>
            )}
          </dd>
        </div>
      </dl>

      <details className="rounded-sm border border-border/60 bg-surface-2">
        <summary className="cursor-pointer px-3 py-2 text-label font-semibold uppercase text-ink-3">
          Snapshot técnico
        </summary>
        <pre className="overflow-x-auto border-t border-border/40 p-3 font-mono text-label text-ink-2">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </details>
    </section>
  );
}

function OriginValue({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <span><span className="block text-label text-ink-3">{label}</span><span className={mono ? "font-mono text-label text-ink" : "font-medium text-ink"}>{value}</span></span>;
}

function parseSnapshot(snapshot: unknown): RuleSnapshot | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  return snapshot as RuleSnapshot;
}

function formatRuleValue(valueType: string | undefined, value: number | undefined): string | null {
  if (value == null || !valueType) return null;
  if (valueType === "percentual") return `${value}%`;
  return String(value);
}
