import { redirect } from "next/navigation";
import { recordAudit } from "@syntex/database";
import { getSession } from "@/lib/auth/session";
import { resolveAssociateContext } from "@/lib/domain/associate-access";
import { formatCpf } from "@/lib/formatters/cpf";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";

export default async function AssociadoContaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let ctx;
  try {
    ctx = await resolveAssociateContext(session.supabase, session.tenantId, session.appUserId);
  } catch {
    return (
      <SyntexEmptyState
        title="Conta incompleta"
        description="Seu login não está vinculado a uma pessoa. Contate o sindicato."
      />
    );
  }

  const { person, worker } = ctx;

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "person",
    resourceId: person.id,
    metadata: { portal: "associado" },
  });

  const { data: employments } = worker
    ? await session.supabase
        .from("employment_relationship")
        .select(
          "id, job_title, status, valid_from, valid_until, company:company_id(legal_name, trade_name, cnpj)",
        )
        .eq("tenant_id", session.tenantId)
        .eq("worker_id", worker.id)
        .order("valid_from", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-component font-semibold text-ink">Minha conta</h2>
        <dl className="grid gap-2 text-body sm:grid-cols-2">
          <div>
            <dt className="text-label text-ink-3">Nome</dt>
            <dd>{person.full_name}</dd>
          </div>
          <div>
            <dt className="text-label text-ink-3">CPF</dt>
            <dd className="font-mono">{formatCpf(person.cpf)}</dd>
          </div>
          <div>
            <dt className="text-label text-ink-3">E-mail</dt>
            <dd>{person.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-label text-ink-3">Telefone</dt>
            <dd>{person.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-label text-ink-3">Matrícula</dt>
            <dd className="font-mono">{worker?.registration_number ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-2">
        <h2 className="text-component font-semibold text-ink">Vínculos de trabalho</h2>
        {!employments?.length ? (
          <p className="text-body text-ink-2">Nenhum vínculo cadastrado.</p>
        ) : (
          <ul className="space-y-2 text-body">
            {employments.map((e) => {
              const company = e.company as unknown as {
                legal_name: string;
                trade_name: string | null;
                cnpj: string;
              } | null;
              return (
                <li key={e.id} className="border-b border-border py-2">
                  <p className="font-medium">{company?.trade_name ?? company?.legal_name ?? "—"}</p>
                  <p className="font-mono text-label text-ink-2">
                    {company?.cnpj} · {e.status} · {e.valid_from} → {e.valid_until ?? "atual"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
