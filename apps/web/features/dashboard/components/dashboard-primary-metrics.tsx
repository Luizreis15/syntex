import Link from "next/link";
import { cn } from "@/lib/utils";
import { SyntexProgress } from "@/components/ui/syntex-progress";
import { SyntexAccentFrame } from "@/components/ui/syntex-accent-rail";
import { DevDemoBadge } from "@/components/ui/dev-demo-mark";
import type { LovableHeroBlock } from "@/features/dashboard/compose";

/**
 * KPIs do Command Hero — surfaces integradas (sem “card com contorno”).
 * Arrecadação / deltas DEMO: ver `demo-painel.ts` (C4: rótulo visível).
 */
export function DashboardPrimaryMetrics({ block }: { block: LovableHeroBlock }) {
  const { associados, arrecadacao, inadimplencia, empresas } = block;

  if (!associados && !empresas) {
    return (
      <p className="mt-5 text-label text-shell-ink-2">
        Nenhuma métrica disponível para o seu perfil neste momento.
      </p>
    );
  }

  return (
    <div className="mt-7 grid gap-3 lg:grid-cols-12">
      {associados ? (
        <Link
          href={associados.href}
          className="group relative overflow-hidden rounded-feature bg-[color-mix(in_oklab,var(--teal)_14%,transparent)] p-5 ring-1 ring-inset ring-shell-ink/[0.06] transition-[background,ring-color] hover:bg-[color-mix(in_oklab,var(--teal)_18%,transparent)] hover:ring-shell-ink/[0.1] lg:col-span-4"
        >
          <SyntexAccentFrame tone="teal" className="pl-2.5">
            <span className="text-label font-semibold uppercase tracking-[0.1em] text-shell-ink-2/90">
              Associados
            </span>
            <p className="mt-2.5 text-[2.75rem] leading-none font-semibold tracking-[-0.04em] text-shell-ink tabular-nums">
              {associados.value}
            </p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-label font-semibold text-teal">{associados.delta}</span>
              <span className="font-mono text-label text-shell-ink-2/75">
                {associados.densityLabel}
              </span>
            </div>
            <div className="mt-4">
              <SyntexProgress
                value={associados.meter}
                tone="teal"
                dark
                size="md"
                label="Densidade de filiação"
              />
            </div>
          </SyntexAccentFrame>
        </Link>
      ) : null}

      <div
        className="relative overflow-hidden rounded-feature bg-[color-mix(in_oklab,var(--success)_12%,transparent)] p-5 ring-1 ring-inset ring-shell-ink/[0.06] lg:col-span-4"
        data-demo="true"
      >
        <SyntexAccentFrame tone="green" className="pl-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label font-semibold uppercase tracking-[0.1em] text-shell-ink-2/90">
              {arrecadacao.label}
            </span>
            <DevDemoBadge tone="onDark" />
          </div>
          <p className="mt-2.5 text-[2.35rem] leading-none font-semibold tracking-[-0.04em] text-shell-ink tabular-nums">
            {arrecadacao.valueDisplay}{" "}
            <span className="text-xl font-semibold tracking-[-0.02em] text-shell-ink-2">
              {arrecadacao.valueSuffix}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-label font-semibold text-success">{arrecadacao.delta}</span>
            <span className="font-mono text-label text-shell-ink-2/75">{arrecadacao.metaLabel}</span>
          </div>
          <div className="mt-4">
            <SyntexProgress value={arrecadacao.meter} tone="green" dark size="md" label="Meta do mês" />
          </div>
        </SyntexAccentFrame>
      </div>

      <div className="grid gap-3 lg:col-span-4">
        <div
          className={cn(
            "relative overflow-hidden rounded-feature p-4 ring-1 ring-inset ring-shell-ink/[0.06]",
            inadimplencia.source === "real"
              ? "bg-[color-mix(in_oklab,var(--warning)_10%,transparent)]"
              : "bg-[color-mix(in_oklab,var(--danger)_10%,transparent)]",
          )}
          data-demo={inadimplencia.source === "demo" ? "true" : undefined}
        >
          <SyntexAccentFrame
            tone={inadimplencia.source === "real" ? "amber" : "red"}
            className="pl-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-label font-semibold uppercase tracking-[0.1em] text-shell-ink-2/90">
                  Inadimplência
                </span>
                {inadimplencia.source === "demo" ? <DevDemoBadge tone="onDark" /> : null}
              </div>
              <span
                className={cn(
                  "font-mono text-label font-semibold",
                  inadimplencia.source === "real" ? "text-warning" : "text-danger",
                )}
              >
                {inadimplencia.delta}
              </span>
            </div>
            <p className="mt-2 text-2xl leading-none font-semibold tracking-[-0.03em] text-shell-ink tabular-nums">
              {inadimplencia.value}
            </p>
          </SyntexAccentFrame>
        </div>

        {empresas ? (
          <Link
            href={empresas.href}
            className="relative overflow-hidden rounded-feature bg-[color-mix(in_oklab,var(--petrol-600)_14%,transparent)] p-4 ring-1 ring-inset ring-shell-ink/[0.06] transition-[background] hover:bg-[color-mix(in_oklab,var(--petrol-600)_18%,transparent)]"
          >
            <SyntexAccentFrame tone="blue" className="pl-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label font-semibold uppercase tracking-[0.1em] text-shell-ink-2/90">
                  Empresas na base
                </span>
                <span className="font-mono text-label font-semibold text-teal">{empresas.delta}</span>
              </div>
              <p className="mt-2 text-2xl leading-none font-semibold tracking-[-0.03em] text-shell-ink tabular-nums">
                {empresas.value}
              </p>
            </SyntexAccentFrame>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
