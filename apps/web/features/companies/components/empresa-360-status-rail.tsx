import { cn } from "@/lib/utils";
import type { DomainState } from "@/components/ui/syntex-status";
import { formatData } from "@/lib/formatters/data";
import { DEMO_EMPRESA_CLAIM } from "@/features/companies/demo-empresa-360";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { SyntexStatus } from "@/components/ui/syntex-status";

export interface StatusRailStop {
  year: string;
  label: string;
  detail?: string;
  state: DomainState | "neutral" | "future";
  current?: boolean;
}

const STATE_BAR: Record<StatusRailStop["state"], string> = {
  reconhecida: "bg-status-reconhecida",
  reivindicada: "bg-status-reivindicada",
  disputada: "bg-status-disputada",
  perdida: "bg-status-perdida",
  sensivel: "bg-status-sensivel",
  neutral: "bg-border",
  future: "bg-border",
};

const STATE_TEXT: Record<StatusRailStop["state"], string> = {
  reconhecida: "text-status-reconhecida",
  reivindicada: "text-status-reivindicada",
  disputada: "text-status-disputada",
  perdida: "text-status-perdida",
  sensivel: "text-status-sensivel",
  neutral: "text-ink-3",
  future: "text-ink-3",
};

const DOMAIN_LABEL: Record<DomainState, string> = {
  reconhecida: "SECABC reconhecido",
  reivindicada: "Representação reivindicada",
  disputada: "Em disputa",
  perdida: "Inativa",
  sensivel: "Situação sensível",
};

export function buildRailFromTimeline(
  rows: { valid_from: string; valid_until: string | null; status: string }[],
  currentStatus: string | null,
): StatusRailStop[] {
  if (rows.length === 0) {
    return [
      {
        year: "—",
        label: "Sem representação",
        detail: "Base não mapeada",
        state: "neutral",
      },
      {
        year: new Date().getFullYear().toString(),
        label: "Definição pendente",
        detail: "Aguarda cadastro",
        state: "future",
        current: true,
      },
    ];
  }

  const sorted = [...rows].sort((a, b) => a.valid_from.localeCompare(b.valid_from));
  const stops: StatusRailStop[] = sorted.slice(0, 3).map((r, i, arr) => {
    const year = r.valid_from.slice(0, 4);
    const state = (["reconhecida", "reivindicada", "disputada", "perdida", "sensivel"].includes(
      r.status,
    )
      ? r.status
      : "neutral") as StatusRailStop["state"];
    const isCurrent = r.valid_until === null || i === arr.length - 1;
    return {
      year,
      label: DOMAIN_LABEL[state as DomainState] ?? r.status,
      detail: r.valid_until
        ? `${formatData(r.valid_from)} → ${formatData(r.valid_until)}`
        : `desde ${formatData(r.valid_from)}`,
      state,
      current: isCurrent && (currentStatus ? r.status === currentStatus : true),
    };
  });

  const lastYear = Number(stops[stops.length - 1]?.year ?? new Date().getFullYear());
  stops.push({
    year: String(lastYear + 1),
    label: "Definição pendente",
    detail: "Aguarda decisão",
    state: "future",
  });

  // Garante um único current
  const currents = stops.filter((s) => s.current);
  if (currents.length > 1) {
    stops.forEach((s) => {
      s.current = false;
    });
    const live = stops.find((s) => s.state !== "future" && s.detail?.startsWith("desde"));
    if (live) live.current = true;
    else if (stops[stops.length - 2]) stops[stops.length - 2]!.current = true;
  }

  return stops;
}

export function Empresa360StatusRail({
  stops,
  domainStatus,
  sinceLabel,
  showClaimSplit,
}: {
  stops: StatusRailStop[];
  domainStatus: DomainState | null;
  sinceLabel?: string | null;
  showClaimSplit: boolean;
}) {
  return (
    <DashboardPanel
      title="Situação sindical"
      subtitle="Syntex Status Rail · vigências e mudanças de estado"
      action={
        domainStatus ? (
          <SyntexStatus
            kind="domain"
            state={domainStatus}
            label={
              sinceLabel
                ? `${DOMAIN_LABEL[domainStatus]} desde ${sinceLabel}`
                : undefined
            }
          />
        ) : null
      }
    >
      <div className="px-5 py-6">
        <div className="relative">
          <span className="absolute top-[0.6rem] right-0 left-0 h-px bg-border" />
          <div
            className="relative grid"
            style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}
          >
            {stops.map((s) => (
              <div key={`${s.year}-${s.label}`} className="relative pr-4">
                <span
                  className={cn(
                    "absolute top-0 left-0 h-[1.2rem] w-[3px]",
                    STATE_BAR[s.state],
                  )}
                />
                <div className="pt-8">
                  <span className={cn("block font-mono text-label", STATE_TEXT[s.state])}>
                    {s.year}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-sm font-bold",
                      s.state === "future" ? "text-ink-3" : "text-ink",
                    )}
                  >
                    {s.label}
                  </span>
                  {s.detail ? (
                    <span className="mt-0.5 block text-xs text-ink-3">{s.detail}</span>
                  ) : null}
                  {s.current ? (
                    <span
                      className={cn(
                        "mt-2 inline-flex items-center gap-1.5 rounded-control px-1.5 py-1 text-label font-bold uppercase tracking-wide",
                        s.state === "disputada" || s.state === "reivindicada"
                          ? "bg-tint-red text-danger"
                          : s.state === "reconhecida"
                            ? "bg-tint-green text-success"
                            : "bg-tint-amber text-warning",
                      )}
                    >
                      <i
                        className={cn(
                          "live-dot size-1.5 rounded-full",
                          s.state === "disputada" || s.state === "reivindicada"
                            ? "bg-danger"
                            : s.state === "reconhecida"
                              ? "bg-success"
                              : "bg-warning",
                        )}
                        aria-hidden
                      />{" "}
                      vigente
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showClaimSplit ? (
        <div className="border-t border-border/50 px-5 py-5">
          <span className="text-label font-bold uppercase tracking-[0.12em] text-ink-3">
            Entidades na base · demo
          </span>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full">
            {DEMO_EMPRESA_CLAIM.map((e) => (
              <div
                key={e.sigla}
                className={cn(e.tone === "syntex" ? "bg-petrol-600" : "bg-warning")}
                style={{ width: `${e.share}%` }}
                title={e.name}
              />
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DEMO_EMPRESA_CLAIM.map((e) => (
              <div
                key={e.sigla}
                className="flex items-start gap-3 rounded-control bg-surface-2/80 p-3"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-control font-mono text-label font-bold text-shell-ink",
                    e.tone === "syntex" ? "bg-petrol-600" : "bg-warning",
                  )}
                >
                  {e.sigla}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{e.name}</p>
                  <p className="text-xs text-ink-3">{e.note}</p>
                </div>
                <span
                  className={cn(
                    "font-mono text-sm font-extrabold tabular-nums",
                    e.tone === "syntex" ? "text-petrol-600" : "text-warning",
                  )}
                >
                  {e.share}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </DashboardPanel>
  );
}
