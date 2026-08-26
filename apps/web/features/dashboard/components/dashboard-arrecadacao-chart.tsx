import {
  DEMO_ARRECADACAO_HERO,
  DEMO_ARRECADACAO_SERIE,
  type DemoArrecadacaoPoint,
} from "@/features/dashboard/demo-painel";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";

const W = 640;
const H = 220;
const PAD = { t: 16, r: 12, b: 28, l: 40 };

function chartGeometry(serie: DemoArrecadacaoPoint[]) {
  const max = Math.max(...serie.flatMap((p) => [p.previsto, p.realizado])) * 1.08;
  const min = 0;
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const n = serie.length;
  const gap = innerW / n;
  const barW = Math.min(14, gap * 0.4);

  const y = (v: number) => PAD.t + innerH - ((v - min) / (max - min)) * innerH;
  const xCenter = (i: number) => PAD.l + gap * i + gap / 2;

  return { max, barW, y, xCenter };
}

/**
 * Série prevista vs. realizado — DEV-only (`demo-painel.ts`).
 * SVG puro; sem lib de chart. Acabamento P1.
 */
export function DashboardArrecadacaoChart() {
  const serie = DEMO_ARRECADACAO_SERIE;
  const { max, barW, y, xCenter } = chartGeometry(serie);
  const areaPoints = serie.map((p, i) => `${xCenter(i)},${y(p.realizado)}`).join(" ");
  const areaFill = [
    `${xCenter(0)},${y(0)}`,
    ...serie.map((p, i) => `${xCenter(i)},${y(p.realizado)}`),
    `${xCenter(serie.length - 1)},${y(0)}`,
  ].join(" ");

  const ticks = [0, Math.round(max / 2), Math.round(max)];

  return (
    <DashboardPanel
      title="Arrecadação"
      subtitle="Últimos 12 meses · previsto vs. realizado · ilustrativo"
      demo
      className="rounded-feature"
      action={
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1.5 text-label font-semibold text-ink-3">
            <i className="size-2 rounded-xs bg-border-strong/50" aria-hidden /> Previsto
          </span>
          <span className="flex items-center gap-1.5 text-label font-semibold text-ink-3">
            <i className="size-2 rounded-full bg-petrol-600" aria-hidden /> Realizado
          </span>
        </div>
      }
    >
      <div className="px-3 pt-3 pr-4 pb-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-56 w-full"
          role="img"
          aria-label="Arrecadação prevista versus realizada nos últimos 12 meses"
        >
          <defs>
            <linearGradient id="painel-realizado-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--petrol-600)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--petrol-600)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--border)"
                strokeWidth="1"
                strokeOpacity="0.55"
              />
              <text
                x={PAD.l - 8}
                y={y(t) + 3}
                textAnchor="end"
                fill="var(--ink-3)"
                style={{ fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono, ui-monospace)" }}
              >
                {t}
              </text>
            </g>
          ))}

          {serie.map((p, i) => (
            <rect
              key={`bar-${p.mes}`}
              x={xCenter(i) - barW / 2}
              y={y(p.previsto)}
              width={barW}
              height={Math.max(0, y(0) - y(p.previsto))}
              rx={2.5}
              fill="var(--border)"
              fillOpacity="0.85"
            />
          ))}

          <polygon points={areaFill} fill="url(#painel-realizado-fill)" />
          <polyline
            points={areaPoints}
            fill="none"
            stroke="var(--petrol-600)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {serie.map((p, i) => (
            <circle
              key={`dot-${p.mes}`}
              cx={xCenter(i)}
              cy={y(p.realizado)}
              r={2}
              fill="var(--petrol-600)"
              stroke="var(--surface)"
              strokeWidth="1.5"
            />
          ))}

          {serie.map((p, i) => (
            <text
              key={`lbl-${p.mes}`}
              x={xCenter(i)}
              y={H - 8}
              textAnchor="middle"
              fill="var(--ink-3)"
              style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--font-mono, ui-monospace)" }}
            >
              {p.mes}
            </text>
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border/40 border-t border-border/40">
        {[
          { l: "Previsto 12m", v: DEMO_ARRECADACAO_HERO.previsto12m },
          { l: "Realizado 12m", v: DEMO_ARRECADACAO_HERO.realizado12m },
          { l: "Aderência", v: DEMO_ARRECADACAO_HERO.aderencia },
        ].map((s) => (
          <div key={s.l} className="px-5 py-3.5">
            <span className="text-label font-semibold uppercase tracking-[0.08em] text-ink-3">
              {s.l}
            </span>
            <p className="mt-1 text-lg font-semibold tracking-[-0.02em] tabular-nums text-ink">
              {s.v}
            </p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}
