import Link from "next/link";
import { DEMO_EMPRESA_ARRECADACAO } from "@/features/companies/demo-empresa-360";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";

const W = 640;
const H = 220;
const PAD = { t: 16, r: 12, b: 28, l: 40 };

/**
 * DEMO UI — arrecadação da empresa (SVG).
 */
export function Empresa360Arrecadacao({ companyId }: { companyId: string }) {
  const serie = DEMO_EMPRESA_ARRECADACAO;
  const max = Math.max(...serie.flatMap((p) => [p.previsto, p.realizado])) * 1.1;
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const gap = innerW / serie.length;
  const barW = Math.min(14, gap * 0.42);
  const y = (v: number) => PAD.t + innerH - (v / max) * innerH;
  const xCenter = (i: number) => PAD.l + gap * i + gap / 2;
  const areaPoints = serie.map((p, i) => `${xCenter(i)},${y(p.realizado)}`).join(" ");
  const areaFill = [
    `${xCenter(0)},${y(0)}`,
    ...serie.map((p, i) => `${xCenter(i)},${y(p.realizado)}`),
    `${xCenter(serie.length - 1)},${y(0)}`,
  ].join(" ");
  const ticks = [0, Math.round(max / 2), Math.round(max)];

  return (
    <DashboardPanel
      title="Arrecadação da empresa"
      subtitle="Contribuições e mensalidades · 12 meses · ilustrativo"
      demo
      action={
        <Link
          href={`/cobrancas?company=${companyId}`}
          className="inline-flex items-center rounded-control border border-border px-3 py-1.5 text-label font-bold text-ink transition-colors hover:bg-surface-2"
        >
          Ver títulos
        </Link>
      }
    >
      <div className="px-2 pt-2 pr-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-52 w-full"
          role="img"
          aria-label="Arrecadação da empresa nos últimos 12 meses"
        >
          <defs>
            <linearGradient id="emp-realizado-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--petrol-600)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--petrol-600)" stopOpacity="0.02" />
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
              />
              <text
                x={PAD.l - 8}
                y={y(t) + 3}
                textAnchor="end"
                className="fill-ink-3"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {t}
              </text>
            </g>
          ))}
          {serie.map((p, i) => (
            <rect
              key={`b-${p.mes}`}
              x={xCenter(i) - barW / 2}
              y={y(p.previsto)}
              width={barW}
              height={y(0) - y(p.previsto)}
              rx={3}
              fill="var(--border)"
            />
          ))}
          <polygon points={areaFill} fill="url(#emp-realizado-fill)" />
          <polyline
            points={areaPoints}
            fill="none"
            stroke="var(--petrol-600)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {serie.map((p, i) => (
            <circle
              key={`d-${p.mes}`}
              cx={xCenter(i)}
              cy={y(p.realizado)}
              r={2.5}
              fill="var(--petrol-600)"
            />
          ))}
          {serie.map((p, i) => (
            <text
              key={`l-${p.mes}`}
              x={xCenter(i)}
              y={H - 8}
              textAnchor="middle"
              className="fill-ink-3"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {p.mes}
            </text>
          ))}
        </svg>
      </div>
    </DashboardPanel>
  );
}
