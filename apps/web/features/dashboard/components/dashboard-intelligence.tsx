import Link from "next/link";
import { DEMO_INTELLIGENCE } from "@/features/dashboard/demo-painel";
import { DevDemoBadge } from "@/components/ui/dev-demo-mark";

/**
 * Syntex Intelligence — painel dark protagonista.
 * Conteúdo: DEV_DEMO (`demo-painel.ts`). C4: rótulo DEMO obrigatório.
 */
export function DashboardIntelligence() {
  const intel = DEMO_INTELLIGENCE;

  return (
    <section
      className="surface-command relative overflow-hidden rounded-feature ring-1 ring-inset ring-shell-ink/[0.08]"
      data-demo="true"
    >
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="intel-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="var(--shell-border)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#intel-grid)" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="h-px w-2/5 bg-gradient-to-r from-teal/80 via-teal/40 to-transparent" />
      </div>
      <span
        className="pointer-events-none absolute inset-y-4 left-0 w-[3px] rounded-r bg-gradient-to-b from-teal to-petrol-600/80"
        aria-hidden
      />

      <div className="relative py-5 pr-6 pl-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-teal" aria-hidden>
              ✦
            </span>
            <span className="text-dense font-semibold tracking-tight text-shell-ink">
              Syntex Intelligence
            </span>
            <DevDemoBadge tone="onDark" />
          </div>
          <span className="font-mono text-label text-shell-ink-2/80">{intel.tag}</span>
        </div>

        <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed font-medium text-shell-ink">
          {intel.insight}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-shell-ink-2">{intel.detail}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {intel.actions.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                i === 0
                  ? "inline-flex items-center rounded-control bg-petrol-600 px-3.5 py-2 text-label font-semibold text-shell-ink transition-opacity hover:opacity-90"
                  : "inline-flex items-center rounded-control px-3.5 py-2 text-label font-semibold text-shell-ink/90 ring-1 ring-inset ring-shell-ink/[0.14] transition-colors hover:bg-shell-ink/[0.08]"
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
