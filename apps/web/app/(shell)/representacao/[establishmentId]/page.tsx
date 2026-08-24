import { notFound, redirect } from "next/navigation";
import { recordAudit } from "@syntex/database";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { RepresentationWorkspaceView } from "@/features/representations/components/representation-workspace-view";
import {
  fetchRepresentationWorkspace,
} from "@/features/representations/workspace-data";
import { operationalReferenceDate } from "@/features/representations/data";

export default async function RepresentacaoWorkspacePage({
  params,
}: {
  params: { establishmentId: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "representation.read")) {
    return (
      <div className="px-6 py-12">
        <SyntexEmptyState
          title="Sem permissão para ver representação"
          description="Sua conta não tem a permissão representation.read."
        />
      </div>
    );
  }

  const referenceDate = operationalReferenceDate();
  const canWrite = hasAnyGrant(session.grants, "representation.write");
  const canDecide = hasAnyGrant(session.grants, "representation.decide");

  const result = await fetchRepresentationWorkspace(
    session.supabase,
    session.tenantId,
    session.grants,
    params.establishmentId,
    { referenceDate },
  );

  if (!result.ok) {
    if (result.reason === "out_of_scope") {
      return (
        <div className="px-6 py-12">
          <SyntexEmptyState
            title="Fora do seu escopo"
            description="Este estabelecimento não está nas unidades às quais você tem acesso."
          />
        </div>
      );
    }
    notFound();
  }

  const { workspace } = result;

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "union_representation",
    resourceId: workspace.establishment.id,
    metadata: {
      surface: "representacao.workspace",
      establishmentId: workspace.establishment.id,
      companyId: workspace.company.id,
      activeClaimsCount: workspace.activeClaimsCount,
      currentStatus: workspace.currentStatus,
      classification: "juridico",
    },
  });

  let registrations: { id: string; registryNumber: string; label: string }[] = [];
  if (canWrite) {
    const { data: regs } = await session.supabase
      .from("union_registration")
      .select("id, registry_number, registered_at")
      .eq("tenant_id", session.tenantId)
      .order("registry_number");
    registrations = (regs ?? []).map((r) => ({
      id: r.id,
      registryNumber: r.registry_number,
      label: `${r.registry_number} · desde ${r.registered_at}`,
    }));
  }

  return (
    <RepresentationWorkspaceView
      workspace={workspace}
      canWrite={canWrite}
      canDecide={canDecide}
      registrations={registrations}
    />
  );
}
