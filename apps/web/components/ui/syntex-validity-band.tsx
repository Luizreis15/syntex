import { cn } from "@/lib/utils";
import type { DomainState } from "./syntex-status";

export interface ValidityPeriod {
  from: string;
  until: string | null;
  state: DomainState;
}

export interface SyntexValidityBandProps {
  periods: ValidityPeriod[];
  referenceDate: string;
  /**
   * Só 'reduced' existe nesta fatia (coluna de tabela). A versão 'full'
   * (linha do tempo com rótulos e eixo, na ficha da empresa) é escopo do
   * prompt 03 — a API já recebe os mesmos dois campos (`periods`,
   * `referenceDate`) para que a versão completa seja um novo `variant`,
   * não um componente novo.
   */
  variant?: "reduced";
  className?: string;
}

const STATE_COLOR: Record<DomainState, string> = {
  reconhecida: "bg-status-reconhecida",
  reivindicada: "bg-status-reivindicada",
  disputada: "bg-status-disputada",
  perdida: "bg-status-perdida",
  sensivel: "bg-status-sensivel",
};

const STATE_LABEL: Record<DomainState, string> = {
  reconhecida: "Reconhecida",
  reivindicada: "Reivindicada",
  disputada: "Disputada",
  perdida: "Perdida",
  sensivel: "Sensível",
};

/**
 * Faixa de vigência — uma das quatro assinaturas do produto
 * (design/SYNTEX-UI.md §0). Nesta fatia, versão reduzida para coluna de
 * tabela: barra fina, segmentos proporcionais ao tempo, marcador na data de
 * referência. `periods` não pode se sobrepor — quem monta a lista resolve
 * disputa antes (ver lib/domain/representation-timeline.ts).
 */
export function SyntexValidityBand({ periods, referenceDate, className }: SyntexValidityBandProps) {
  if (periods.length === 0) {
    return (
      <div
        className={cn("h-1.5 w-full rounded-xs bg-surface-2", className)}
        role="img"
        aria-label="Sem período de vigência registrado"
      />
    );
  }

  const from = periods.map((p) => p.from);
  const until = periods.map((p) => p.until ?? referenceDate);
  const domainStart = [...from, referenceDate].sort()[0]!;
  const domainEnd = [...until, referenceDate].sort().at(-1)!;
  const domainSpan = toDays(domainEnd) - toDays(domainStart) || 1;

  const pct = (date: string) => ((toDays(date) - toDays(domainStart)) / domainSpan) * 100;
  const markerPct = Math.min(100, Math.max(0, pct(referenceDate)));

  const summary = periods
    .map((p) => `${STATE_LABEL[p.state]} de ${p.from} até ${p.until ?? "atual"}`)
    .join("; ");

  return (
    <div className={cn("relative h-1.5 w-full", className)} role="img" aria-label={`Vigência: ${summary}`}>
      <div className="absolute inset-0 flex overflow-hidden rounded-xs bg-surface-2">
        {periods.map((period, i) => {
          const left = pct(period.from);
          const right = pct(period.until ?? referenceDate);
          return (
            <span
              key={i}
              className={cn("absolute top-0 h-full", STATE_COLOR[period.state])}
              style={{ left: `${left}%`, width: `${Math.max(right - left, 1)}%` }}
            />
          );
        })}
      </div>
      <span
        className="absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
        style={{ left: `${markerPct}%` }}
      />
    </div>
  );
}

function toDays(iso: string): number {
  return Date.parse(iso) / 86_400_000;
}
