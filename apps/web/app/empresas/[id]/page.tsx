import { notFound, redirect } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { resolveRepresentation } from "@/lib/domain/resolve-representation";

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
    <div>
      <TopNav />
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold">{company.trade_name ?? company.legal_name}</h1>
          <p className="text-sm text-muted-foreground">{company.cnpj}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estabelecimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(establishments ?? []).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span>
                  {e.kind === "matriz" ? "Matriz" : "Filial"} — {e.cnpj}
                </span>
                <span className="text-muted-foreground">
                  {(e as unknown as { municipality: { name: string; state_code: string } | null }).municipality
                    ?.name ?? "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="representation-resolution">
          <CardHeader>
            <CardTitle>Representação na data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label htmlFor="date" className="text-xs text-muted-foreground">
                  Data de referência
                </label>
                <Input id="date" name="date" type="date" defaultValue={date} />
              </div>
              <Button type="submit" variant="outline">
                Consultar
              </Button>
            </form>

            {resolution && (
              <div className="space-y-3 rounded-md border border-border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(resolution.status)}>{resolution.status}</Badge>
                  {resolution.basis && (
                    <span className="text-xs text-muted-foreground">base: {resolution.basis}</span>
                  )}
                </div>

                {resolution.status === "disputada" && resolution.conflicts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Representações concorrentes nesta data:</p>
                    {resolution.conflicts.map((c) => (
                      <div key={c.id} className="rounded-md bg-muted p-2 text-sm">
                        <Badge variant={statusVariant(c.status)}>{c.status}</Badge>{" "}
                        <span className="text-muted-foreground">
                          {c.valid_from} → {c.valid_until ?? "atual"}
                        </span>
                        <p className="mt-1">{c.evidence}</p>
                      </div>
                    ))}
                  </div>
                )}

                {resolution.status === "sem_representacao" && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma representação vigente nesta data.
                  </p>
                )}

                {resolution.representation && (
                  <p className="text-sm">{resolution.evidence}</p>
                )}

                {resolution.agreement ? (
                  <div className="border-t border-border pt-3 text-sm">
                    <p className="font-medium">
                      CCT vigente ({resolution.agreement.kind.toUpperCase()}
                      {resolution.agreement.mediador_number ? ` · Mediador ${resolution.agreement.mediador_number}` : ""})
                    </p>
                    <p className="text-muted-foreground">
                      {resolution.agreement.valid_from} → {resolution.agreement.valid_until} · data-base{" "}
                      {resolution.agreement.base_date}
                    </p>
                  </div>
                ) : (
                  resolution.representation && (
                    <p className="border-t border-border pt-3 text-sm text-muted-foreground">
                      Nenhuma CCT vigente encontrada para esta data.
                    </p>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linha do tempo da representação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(timeline ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  <span>{r.basis}</span>
                </div>
                <span className="text-muted-foreground">
                  {r.valid_from} → {r.valid_until ?? "atual"}
                </span>
              </div>
            ))}
            {(timeline ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Sem histórico de representação.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
