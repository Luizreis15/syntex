/**
 * Painel de marca do login (referência Lovable / P4.1).
 * Stats numéricos sintéticos: apenas em development.
 */

const isDev = process.env.NODE_ENV === "development";

function NetworkConstellation({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="login-node-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.68" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </radialGradient>
        <filter id="login-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g stroke="color-mix(in oklab, var(--petrol-600) 48%, transparent)" strokeWidth="1.1">
        <path d="M78 310 L168 248 L248 198 L318 152 L392 118" />
        <path d="M168 248 L210 320 L292 286 L360 250" />
        <path d="M248 198 L292 286 L340 340 L410 300" />
        <path d="M318 152 L360 250 L410 300 L455 220" />
        <path d="M210 320 L248 198" />
        <path d="M292 286 L392 118" />
        <path d="M140 160 L168 248" />
        <path d="M140 160 L248 198 L360 250" />
        <path d="M392 118 L455 220" />
        <path d="M78 310 L210 320" />
        <path d="M340 340 L360 250" />
      </g>

      {[
        [78, 310],
        [140, 160],
        [168, 248],
        [210, 320],
        [248, 198],
        [292, 286],
        [318, 152],
        [340, 340],
        [360, 250],
        [392, 118],
        [410, 300],
        [455, 220],
      ].map(([x, y], i) => (
        <g key={i} filter="url(#login-soft-glow)">
          <circle cx={x} cy={y} r="14" fill="url(#login-node-glow)" opacity="0.26" />
          <circle cx={x} cy={y} r="5" fill="var(--teal)" />
          <circle cx={x} cy={y} r="2" fill="var(--shell-ink)" opacity="0.85" />
        </g>
      ))}
    </svg>
  );
}

/** DEMO UI — números só em development */
const DEMO_STATS = [
  { label: "Operação", value: "18.420", hint: "empresas" },
  { label: "Base", value: "84.231", hint: "trabalhadores" },
  { label: "Inteligência", value: "tempo real", hint: "dados operacionais" },
] as const;

/** Produção: conceitos estáticos, sem números fake */
const STATIC_PILLARS = [
  { label: "Operação", hint: "empresas e representação" },
  { label: "Base", hint: "trabalhadores e filiação" },
  { label: "Inteligência", hint: "dados operacionais" },
] as const;

export function LoginBrandPanel() {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-shell-950 lg:flex lg:w-[52%] lg:flex-col">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--shell-ink) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--shell-ink) 8%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 top-[18%] h-[52%] w-[65%] max-w-[504px] opacity-90"
        aria-hidden
      >
        <NetworkConstellation className="h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-shell-950/20 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col px-10 py-9 xl:px-14">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-control bg-teal text-shell-950">
            <span className="text-component font-black leading-none">S</span>
          </span>
          <div>
            <p className="text-dense font-black tracking-[0.08em] text-shell-ink">SYNTEX</p>
            <p className="mt-0.5 text-label font-semibold uppercase tracking-[0.08em] text-shell-ink-2">
              Soluções sindicais
            </p>
          </div>
        </div>

        <div className="mt-auto max-w-md pb-2 pt-24">
          <p className="flex items-center gap-2 text-label font-semibold uppercase tracking-[0.1em] text-teal">
            <span className="size-1.5 rounded-full bg-teal" aria-hidden />
            Union Operating System
          </p>
          <h1 className="mt-4 text-[1.875rem] font-semibold leading-[1.15] tracking-[-0.03em] text-shell-ink xl:text-[2.15rem]">
            A operação sindical em uma nova dimensão.
          </h1>
          <p className="mt-4 max-w-sm text-body font-medium leading-relaxed text-shell-ink-2">
            Trabalhadores, empresas, arrecadação e inteligência conectados em uma única
            plataforma.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-5 border-t border-shell-border pt-6">
            {isDev
              ? DEMO_STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-label font-semibold uppercase tracking-[0.1em] text-shell-ink-2">
                      {stat.label}
                    </p>
                    <p className="mt-1.5 text-dense font-semibold tabular-nums tracking-tight text-shell-ink">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-label font-medium text-shell-ink-2">{stat.hint}</p>
                  </div>
                ))
              : STATIC_PILLARS.map((pillar) => (
                  <div key={pillar.label}>
                    <p className="text-label font-semibold uppercase tracking-[0.1em] text-shell-ink-2">
                      {pillar.label}
                    </p>
                    <p className="mt-1.5 text-dense font-medium leading-snug text-shell-ink">
                      {pillar.hint}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
