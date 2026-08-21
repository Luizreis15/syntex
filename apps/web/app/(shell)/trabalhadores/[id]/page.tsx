import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hasAnyGrant } from "@syntex/permissions";
import { recordAudit } from "@syntex/database";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchWorkerDetail } from "@/features/workers/data";
import { ChangeMembershipForm } from "@/features/workers/change-membership-form";
import { IssueAssociateAccessButton } from "@/features/workers/issue-associate-access-button";
import { formatCpf } from "@/lib/formatters/cpf";

export default async function TrabalhadorDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "worker.read")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Relações" }, { label: "Trabalhadores" }]} title="Trabalhador" />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="worker.read é necessária." />
        </div>
      </div>
    );
  }

  let detail;
  try {
    detail = await fetchWorkerDetail(session.supabase, session.tenantId, params.id);
  } catch {
    notFound();
  }

  const { worker, person, employments, memberships } = detail;
  const canReadMembership = hasAnyGrant(session.grants, "membership.read");
  const canWriteMembership = hasAnyGrant(session.grants, "membership.write");
  const canIssueAccess = hasAnyGrant(session.grants, "associate.access.issue");

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "person",
    resourceId: person.id,
  });
  if (canReadMembership && memberships.length > 0) {
    await recordAudit(session.supabase, {
      tenantId: session.tenantId,
      actorId: session.appUserId,
      action: "read",
      table: "membership",
      resourceId: memberships[0]!.id,
      metadata: { personId: person.id, count: memberships.length },
    });
  }

  const currentMembership = memberships.find((m) => m.valid_until == null) ?? memberships[0] ?? null;

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[
          { label: "Relações" },
          { label: "Trabalhadores", href: "/trabalhadores" },
          { label: person.social_name ?? person.full_name },
        ]}
        title={person.social_name ?? person.full_name}
        metadata={
          <span className="font-mono text-body text-ink-2">
            {formatCpf(person.cpf)}
            {currentMembership ? ` · filiação ${currentMembership.status}` : ""}
          </span>
        }
      />

      <div className="space-y-6 p-6">
        <section className="space-y-2 border-b border-border pb-4">
          <h2 className="text-component font-semibold text-ink">Dados pessoais</h2>
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
              <dd className="font-mono">{worker.registration_number ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3 border-b border-border pb-4">
          <h2 className="text-component font-semibold text-ink">Portal do associado</h2>
          {canIssueAccess ? (
            <IssueAssociateAccessButton
              personId={person.id}
              hasAccess={Boolean(person.app_user_id)}
              hasEmail={Boolean(person.email)}
            />
          ) : (
            <p className="text-body text-ink-2">
              {person.app_user_id ? "Acesso já vinculado." : "Sem permissão para emitir acesso."}
            </p>
          )}
        </section>

        <section className="space-y-3 border-b border-border pb-4">
          <h2 className="text-component font-semibold text-ink">Vínculos empregatícios</h2>
          {employments.length === 0 ? (
            <p className="text-body text-ink-2">Nenhum vínculo cadastrado.</p>
          ) : (
            <table className="w-full border-collapse text-left text-body" aria-label="Vínculos">
              <thead>
                <tr className="border-b border-border text-label uppercase text-ink-3">
                  <th className="py-2 pr-3 font-medium">Empresa</th>
                  <th className="py-2 pr-3 font-medium">Cargo</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Vigência</th>
                </tr>
              </thead>
              <tbody>
                {employments.map((e) => (
                  <tr key={e.id} className="border-b border-border">
                    <td className="py-2.5 pr-3">
                      {e.company ? (
                        <Link href={`/empresas/${e.company.id}`} className="text-petrol-700 hover:underline">
                          {e.company.trade_name ?? e.company.legal_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-2">{e.job_title ?? "—"}</td>
                    <td className="py-2.5 pr-3 font-medium">{e.status}</td>
                    <td className="py-2.5 font-mono text-ink-2">
                      {e.valid_from} → {e.valid_until ?? "atual"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-component font-semibold text-ink">Filiação sindical</h2>
          {!canReadMembership ? (
            <p className="text-body text-ink-2">Sem permissão membership.read para ver filiação.</p>
          ) : memberships.length === 0 ? (
            <p className="text-body text-ink-2">Sem histórico de filiação.</p>
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
          {canWriteMembership && <ChangeMembershipForm personId={person.id} />}
        </section>
      </div>
    </div>
  );
}
