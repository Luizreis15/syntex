import { Suspense } from "react";
import { LoginBrandPanel } from "./login-brand-panel";
import { LoginForm } from "./login-form";

const isDev = process.env.NODE_ENV === "development";

/**
 * Login — split brand + form (referência Lovable / P4.1).
 * Auth inalterada: server action signInWithPassword.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-surface">
      <LoginBrandPanel />

      <section className="relative flex min-h-screen w-full flex-col lg:w-[48%]">
        <div className="flex items-center gap-3 border-b border-border bg-shell-950 px-6 py-4 lg:hidden">
          <span className="flex size-8 items-center justify-center rounded-control bg-teal text-shell-950">
            <span className="text-dense font-black leading-none">S</span>
          </span>
          <div>
            <p className="text-dense font-black tracking-[0.08em] text-shell-ink">SYNTEX</p>
            <p className="text-label font-medium tracking-[0.04em] text-shell-ink-2">
              Soluções sindicais
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:-mt-7 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-[380px]">
            <p className="text-label font-semibold uppercase tracking-[0.12em] text-ink-3">
              Área restrita
            </p>
            <h2 className="mt-3 text-[1.75rem] font-semibold tracking-[-0.03em] text-ink">
              Acesse o Syntex
            </h2>
            <p className="mt-2 text-dense font-medium text-ink-2">
              Use suas credenciais corporativas do sindicato.
            </p>

            <div className="mt-8">
              <Suspense fallback={<p className="text-dense text-ink-2">Carregando…</p>}>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>

        {isDev ? (
          <p className="px-6 pb-6 text-center font-mono text-label text-ink-3 sm:px-10 lg:text-left lg:px-14 xl:px-20">
            Syntex · ambiente de demonstração
          </p>
        ) : (
          <div className="pb-6" aria-hidden />
        )}
      </section>
    </main>
  );
}
