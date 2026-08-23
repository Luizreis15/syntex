import Link from "next/link";
import { cn } from "@/lib/utils";
import { SyntexProgress } from "@/components/ui/syntex-progress";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { formatInteiro } from "@/features/dashboard/format";

const TONE_PROGRESS = {
  ok: "green",
  syntex: "blue",
  amber: "amber",
} as const;

export function Empresa360Workers({
  total,
  rows,
  source,
}: {
  total: number;
  source: "demo" | "mixed";
  rows: {
    label: string;
    value: number;
    pct: number;
    tone: "ok" | "syntex" | "amber";
    demo?: boolean;
  }[];
}) {
  return (
    <DashboardPanel
      title="Trabalhadores"
      subtitle={`${formatInteiro(total)} identificados na base${source === "demo" ? " · mix demo" : ""}`}
    >
      <div className="space-y-3 px-5 py-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold text-ink-3">
                {r.label}
                {r.demo ? (
                  <span className="ml-1 font-medium normal-case text-ink-3/70">· demo</span>
                ) : null}
              </span>
              <span className="font-mono text-sm font-extrabold tabular-nums text-ink">
                {formatInteiro(r.value)}
              </span>
            </div>
            <div className="mt-1.5">
              <SyntexProgress
                value={r.pct}
                tone={TONE_PROGRESS[r.tone]}
                size="sm"
                label={r.label}
              />
            </div>
          </div>
        ))}
        <Link
          href="/trabalhadores"
          className={cn("mt-1 block text-xs font-bold text-petrol-600 hover:underline")}
        >
          Abrir trabalhadores →
        </Link>
      </div>
    </DashboardPanel>
  );
}
