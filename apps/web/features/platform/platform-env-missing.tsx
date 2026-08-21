import Link from "next/link";

/** Mensagem legível quando o runtime Vercel não tem SERVICE_ROLE / URL. */
export function PlatformEnvMissing({ message }: { message: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-6">
      <p className="font-serif text-section-title font-semibold text-ink">
        Ambiente incompleto
      </p>
      <p className="mt-2 text-body text-ink-2">{message}</p>
      <p className="mt-4 text-body text-ink-3">
        No projeto Vercel ligado a <span className="font-mono">syntex.veramo.com.br</span>,
        confira <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span>,{" "}
        <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> e{" "}
        <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> (Production) e faça
        Redeploy.
      </p>
      <Link href="/login" className="mt-6 inline-block text-body text-petrol-700 hover:underline">
        Voltar ao login
      </Link>
    </div>
  );
}
