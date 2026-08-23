import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hasAnyGrant } from "@syntex/permissions";
import { recordAudit } from "@syntex/database";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchWorkerDetail } from "@/features/workers/data";
import { ChangeMembershipForm } from "@/features/workers/change-membership-form";
import { IssueAssociateAccessButton } from "@/features/workers/issue-associate-access-button";
import { formatCpf } from "@/lib/formatters/cpf";
import { formatData } from "@/lib/formatters/data";
import {
  buildTrabalhadorSummary,
  initialsFromName,
} from "@/features/workers/trabalhador-360-compose";
import { Trabalhador360Header } from "@/features/workers/components/trabalhador-360-header";
import { Trabalhador360Tabs } from "@/features/workers/components/trabalhador-360-tabs";
import { Trabalhador360Timeline } from "@/features/workers/components/trabalhador-360-timeline";
import { Trabalhador360Intelligence } from "@/features/workers/components/trabalhador-360-intelligence";
import { Trabalhador360Vinculos } from "@/features/workers/components/trabalhador-360-vinculos";
import { Trabalhador360Financeiro } from "@/features/workers/components/trabalhador-360-financeiro";
import { Trabalhador360AssociacaoCard } from "@/features/workers/components/trabalhador-360-associacao";
import { Trabalhador360Beneficios } from "@/features/workers/components/trabalhador-360-beneficios";
import { Trabalhador360Agenda } from "@/features/workers/components/trabalhador-360-agenda";
import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { firstNameFromFullName } from "@/features/dashboard/greeting";

/**
 * Trabalhador 360 — Modo A (Lovable-like): seed real + DEMO UI rotulado.
 */
export default async function TrabalhadorDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "worker.read")) {
    return (
      <div className="px-6 py-12">
        <SyntexEmptyState title="Sem permissão" description="worker.read é necessária." />
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

  const currentMembership =
    memberships.find((m) => m.valid_until == null && m.status === "ativo") ??
    memberships.find((m) => m.valid_until == null) ??
    null;
  const displayName = person.social_name ?? person.full_name;
  const activeEmployment =
    employments.find((e) => e.status === "ativo" && !e.valid_until) ?? employments[0] ?? null;

  let branchLabel: string | null = null;
  if (worker.branch_id) {
    const { data: branch } = await session.supabase
      .from("branch")
      .select("name")
      .eq("id", worker.branch_id)
      .maybeSingle();
    branchLabel = branch?.name ? `Unidade ${branch.name}` : null;
  }

  const summary = buildTrabalhadorSummary({
    membershipStatus: canReadMembership ? (currentMembership?.status ?? null) : null,
    membershipSince: canReadMembership ? (currentMembership?.valid_from ?? null) : null,
    hasActiveEmployment: Boolean(activeEmployment),
  });

  const associadoAtivo = canReadMembership && currentMembership?.status === "ativo";

  return (
    <div className="min-h-full bg-paper">
      <Trabalhador360Header
        name={displayName}
        cpf={person.cpf}
        registrationNumber={worker.registration_number}
        jobTitle={activeEmployment?.job_title ?? null}
        companyName={
          activeEmployment?.company
            ? (activeEmployment.company.trade_name ?? activeEmployment.company.legal_name)
            : null
        }
        companyId={activeEmployment?.company?.id ?? null}
        branchLabel={branchLabel}
        associadoAtivo={associadoAtivo}
        initials={initialsFromName(displayName)}
        summary={summary}
      />

      <Trabalhador360Tabs
        visaoGeral={
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <Trabalhador360Timeline />
              <Trabalhador360Intelligence firstName={firstNameFromFullName(displayName)} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Trabalhador360Vinculos employments={employments} />
                <Trabalhador360Financeiro />
              </div>
            </div>
            <div className="space-y-5">
              <Trabalhador360AssociacaoCard
                status={canReadMembership ? (currentMembership?.status ?? null) : null}
                since={canReadMembership ? (currentMembership?.valid_from ?? null) : null}
                branchLabel={branchLabel}
              />
              <Trabalhador360Beneficios />
              <Trabalhador360Agenda />
            </div>
          </div>
        }
        associacao={
          <div className="mx-auto max-w-3xl space-y-5">
            <Trabalhador360AssociacaoCard
              status={canReadMembership ? (currentMembership?.status ?? null) : null}
              since={canReadMembership ? (currentMembership?.valid_from ?? null) : null}
              branchLabel={branchLabel}
            />

            <DashboardPanel title="Dados pessoais" subtitle="Cadastro na base">
              <dl className="grid gap-3 px-5 py-4 text-body sm:grid-cols-2">
                <div>
                  <dt className="text-label text-ink-3">Nome</dt>
                  <dd className="font-semibold text-ink">{person.full_name}</dd>
                </div>
                <div>
                  <dt className="text-label text-ink-3">CPF</dt>
                  <dd className="font-mono text-ink">{formatCpf(person.cpf)}</dd>
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
            </DashboardPanel>

            <DashboardPanel title="Portal do associado" subtitle="Acesso digital">
              <div className="px-5 py-4">
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
              </div>
            </DashboardPanel>

            <DashboardPanel title="Filiação sindical" subtitle="Histórico e alteração">
              <div className="space-y-4 px-5 py-4">
                {!canReadMembership ? (
                  <p className="text-body text-ink-2">
                    Sem permissão membership.read para ver filiação.
                  </p>
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
                        <tr key={m.id} className="border-b border-border/50">
                          <td className="py-2.5 pr-3 font-medium capitalize">{m.status}</td>
                          <td className="py-2.5 pr-3 text-ink-2">{m.category ?? "—"}</td>
                          <td className="py-2.5 font-mono text-ink-2">
                            {formatData(m.valid_from)} →{" "}
                            {m.valid_until ? formatData(m.valid_until) : "atual"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {canWriteMembership ? <ChangeMembershipForm personId={person.id} /> : null}
              </div>
            </DashboardPanel>
          </div>
        }
        vinculos={
          <div className="mx-auto max-w-3xl space-y-5">
            <Trabalhador360Vinculos employments={employments} />
            <DashboardPanel title="Detalhe dos vínculos" subtitle="Fonte real">
              {employments.length === 0 ? (
                <p className="px-5 py-8 text-body text-ink-2">Nenhum vínculo cadastrado.</p>
              ) : (
                <table className="w-full border-collapse text-left text-body" aria-label="Vínculos">
                  <thead>
                    <tr className="border-b border-border text-label uppercase text-ink-3">
                      <th className="px-5 py-2 font-medium">Empresa</th>
                      <th className="py-2 pr-3 font-medium">Cargo</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-5 font-medium">Vigência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employments.map((e) => (
                      <tr key={e.id} className="border-b border-border/50">
                        <td className="px-5 py-2.5">
                          {e.company ? (
                            <Link
                              href={`/empresas/${e.company.id}`}
                              className="text-petrol-700 hover:underline"
                            >
                              {e.company.trade_name ?? e.company.legal_name}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-ink-2">{e.job_title ?? "—"}</td>
                        <td className="py-2.5 pr-3 font-medium capitalize">{e.status}</td>
                        <td className="py-2.5 pr-5 font-mono text-ink-2">
                          {formatData(e.valid_from)} →{" "}
                          {e.valid_until ? formatData(e.valid_until) : "atual"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </DashboardPanel>
          </div>
        }
      />
    </div>
  );
}
