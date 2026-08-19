import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";

/**
 * Tela ainda crua (prompt 02 §"Não faz parte deste prompt": Empresa 360 é
 * prompt 03). Só trocado aqui o suficiente para não quebrar visualmente com
 * a troca de tokens — cor, raio e espaçonto literais nunca, mesmo numa tela
 * que continua feia de propósito.
 */
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const date = searchParams.date ?? todayIso();

  const { data: company } = await session.supabase
    .from("company")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .eq("id", params.id)
    .single();
  if (!company) notFound();

  const { data: establishments } = await session.supabase
    .from("establishment")
    .select("*, municipality:municipality_id(name, state_code)")
    .eq("tenant_id", session.tenantId)
    .eq("company_id", company.id)
    .order("kind");

  const matriz = (establishments ?? []).find((e) => e.kind === "matriz") ?? establishments?.[0] ?? null;

  const resolution = matriz
    ? await resolveRepresentation(session.supabase, session.tenantId, matriz.id, date)
    : null;

  const { data: timeline } = matriz
    ? await session.supabase
        .from("union_representation")
        .select("*")
        .eq("tenant_id", session.tenantId)
        .eq("establishment_id", matriz.id)
        .order("valid_from", { ascending: false })
    : { data: [] };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-component font-semibold text-ink">{company.trade_name ?? company.legal_name}</h1>
        <p className="font-mono text-body text-ink-2">{company.cnpj}</p>
      </div>

      <section className="rounded-md border border-border bg-surface p-4">
        <h2 className="mb-2 text-component font-semibold text-ink">Estabelecimentos</h2>
        <div className="space-y-2">
          {(establishments ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between text-body">
              <span>
                {e.kind === "matriz" ? "Matriz" : "Filial"} — {e.cnpj}
              </span>
              <span className="text-ink-2">
                {(e as unknown as { municipality: { name: string; state_code: string } | null }).municipality
                  ?.name ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-4" data-testid="representation-resolution">
        <h2 className="mb-2 text-component font-semibold text-ink">Representação na data</h2>
        <div className="space-y-4">
          <form className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <label htmlFor="date" className="text-label text-ink-3">
                Data de referência
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={date}
                className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body text-ink"
              />
            </div>
            <button type="submit" className="h-input rounded-sm border border-border-strong px-3 text-body text-ink">
              Consultar
            </button>
          </form>

          {resolution && (
            <div className="space-y-3 rounded-sm border border-border p-4">
              <div className="flex items-center gap-2 text-body">
                <span className="font-semibold">{resolution.status}</span>
                {resolution.basis && <span className="text-ink-2">base: {resolution.basis}</span>}
              </div>

              {resolution.status === "disputada" && resolution.conflicts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-body font-medium">Representações concorrentes nesta data:</p>
                  {resolution.conflicts.map((c) => (
                    <div key={c.id} className="rounded-sm bg-surface-2 p-2 text-body">
                      <span className="font-semibold">{c.status}</span>{" "}
                      <span className="font-mono text-ink-2">
                        {c.valid_from} → {c.valid_until ?? "atual"}
                      </span>
                      <p className="mt-1">{c.evidence}</p>
                    </div>
                  ))}
                </div>
              )}

              {resolution.status === "sem_representacao" && (
                <p className="text-body text-ink-2">Nenhuma representação vigente nesta data.</p>
              )}

              {resolution.representation && <p className="text-body">{resolution.evidence}</p>}

              {resolution.agreement ? (
                <div className="border-t border-border pt-3 text-body">
                  <p className="font-medium">
                    CCT vigente ({resolution.agreement.kind.toUpperCase()}
                    {resolution.agreement.mediador_number
                      ? ` · Mediador ${resolution.agreement.mediador_number}`
                      : ""}
                    )
                  </p>
                  <p className="font-mono text-ink-2">
                    {resolution.agreement.valid_from} → {resolution.agreement.valid_until} · data-base{" "}
                    {resolution.agreement.base_date}
                  </p>
                </div>
              ) : (
                resolution.representation && (
                  <p className="border-t border-border pt-3 text-body text-ink-2">
                    Nenhuma CCT vigente encontrada para esta data.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-md border border-border bg-surface p-4">
        <h2 className="mb-2 text-component font-semibold text-ink">Linha do tempo da representação</h2>
        <div className="space-y-2">
          {(timeline ?? []).map((r) => (
            <div key={r.id} className="flex items-center justify-between text-body">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{r.status}</span>
                <span>{r.basis}</span>
              </div>
              <span className="font-mono text-ink-2">
                {r.valid_from} → {r.valid_until ?? "atual"}
              </span>
            </div>
          ))}
          {(timeline ?? []).length === 0 && <p className="text-body text-ink-2">Sem histórico de representação.</p>}
        </div>
      </section>
    </main>
  );
}
