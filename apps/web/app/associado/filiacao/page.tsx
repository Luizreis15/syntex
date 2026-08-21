import { redirect } from "next/navigation";
import { recordAudit } from "@syntex/database";
import { getSession } from "@/lib/auth/session";
import { resolveAssociateContext } from "@/lib/domain/associate-access";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";

export default async function AssociadoFiliacaoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let ctx;
  try {
    ctx = await resolveAssociateContext(session.supabase, session.tenantId, session.appUserId);
  } catch {
    return <SyntexEmptyState title="Conta incompleta" description="Sem person vinculada." />;
  }

  const { data: memberships, error } = await session.supabase
    .from("membership")
    .select("id, status, category, valid_from, valid_until")
    .eq("tenant_id", session.tenantId)
    .eq("person_id", ctx.person.id)
    .order("valid_from", { ascending: false });
  if (error) throw error;

  for (const m of memberships ?? []) {
    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "read",
      table: "membership",
      resourceId: m.id,
      metadata: { portal: "associado", self: true },
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-component font-semibold text-ink">Minha filiação</h2>
      <p className="text-body text-ink-2">
        Filiação sindical é dado sensível (LGPD). Este acesso fica registrado em auditoria.
      </p>
      {!memberships?.length ? (
        <SyntexEmptyState
          title="Sem filiação registrada"
          description="Quando o sindicato registrar sua associação, ela aparece aqui."
        />
      ) : (
        <table className="w-full border-collapse text-left text-body" aria-label="Filiação">
          <thead>
            <tr className="border-b border-border text-label uppercase text-ink-3">
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Categoria</th>
              <th className="py-2 font-medium">Vigência</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.id} className="border-b border-border">
                <td className="py-2.5 pr-3 font-medium">{m.status}</td>
                <td className="py-2.5 pr-3 text-ink-2">{m.category ?? "—"}</td>
                <td className="py-2.5 font-mono text-ink-2">
                  {m.valid_from} → {m.valid_until ?? "atual"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
