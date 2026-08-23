import Link from "next/link";
import { DEMO_TRAB_INTELLIGENCE } from "@/features/workers/demo-trabalhador-360";

/** DEMO UI — Syntex Intelligence inline. */
export function Trabalhador360Intelligence({ firstName }: { firstName?: string | null }) {
  const intel = DEMO_TRAB_INTELLIGENCE;
  const insight = firstName
    ? `${firstName} é elegível a benefícios que ainda não utilizou.`
    : intel.insight;

  return (
    <section className="relative overflow-hidden rounded-panel border border-border/50 bg-tint-blue">
      <span
        className="absolute inset-y-0 left-0 w-[3px] rounded-r bg-gradient-to-b from-teal to-petrol-600"
        aria-hidden
      />
      <div className="relative py-4 pr-5 pl-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-teal" aria-hidden>
              ✦
            </span>
            <span className="text-dense font-extrabold tracking-tight text-ink">
              Syntex Intelligence
            </span>
            <span className="rounded-control bg-surface/80 px-1.5 py-0.5 text-label font-medium text-ink-3">
              demo
            </span>
          </div>
          <span className="font-mono text-label text-ink-3">{intel.tag}</span>
        </div>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed font-semibold text-ink">
          {insight}
        </p>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">{intel.detail}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {intel.actions.map((action, i) => (
            <Link
              key={action.label}
              href={action.href}
              className={
                i === 0
                  ? "inline-flex items-center rounded-control bg-petrol-600 px-3 py-2 text-label font-bold text-shell-ink transition-opacity hover:opacity-90"
                  : "inline-flex items-center rounded-control border border-border px-3 py-2 text-label font-bold text-ink hover:bg-surface"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
