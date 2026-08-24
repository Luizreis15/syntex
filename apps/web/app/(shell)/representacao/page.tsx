import { redirect } from "next/navigation";
import { recordAudit } from "@syntex/database";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import {
  fetchRepresentationListPage,
  operationalReferenceDate,
} from "@/features/representations/data";
import { RepresentacaoListHeader } from "@/features/representations/components/representacao-list-header";
import { RepresentacaoTable } from "@/features/representations/representacao-table";

const PAGE_SIZE = 20;

export default async function RepresentacaoPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    municipio?: string;
    status?: string;
    kind?: string;
    page?: string;
  };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "representation.read")) {
    return (
      <div className="px-6 py-12">
        <SyntexEmptyState
          title="Sem permissão para ver representação"
          description="Sua conta não tem a permissão representation.read. Peça a um administrador para conceder acesso."
        />
      </div>
    );
  }

  const pageIndex = Math.max(0, Number(searchParams.page ?? "1") - 1);
  const referenceDate = operationalReferenceDate();

  const { page, summary, allItems } = await fetchRepresentationListPage(
    session.supabase,
    session.tenantId,
    session.grants,
    {
      q: searchParams.q,
      municipio: searchParams.municipio,
      status: searchParams.status,
      kind: searchParams.kind,
      pageIndex,
      pageSize: PAGE_SIZE,
    },
    { referenceDate },
  );

  await recordAudit(session.supabase, {
    tenantId: session.tenantId,
    actorId: session.appUserId,
    action: "read",
    table: "union_representation",
    resourceId: null,
    metadata: {
      surface: "representacao.list",
      count: page.rowCount,
      totalInScope: summary.total,
      referenceDate,
      filters: {
        q: searchParams.q ?? null,
        status: searchParams.status ?? null,
        municipio: searchParams.municipio ?? null,
        kind: searchParams.kind ?? null,
      },
      classification: "juridico",
    },
  });

  return (
    <div className="min-h-full bg-paper">
      <RepresentacaoListHeader summary={summary} activeStatus={searchParams.status ?? null} />
      <div className="px-6 py-5 xl:px-8">
        <RepresentacaoTable
          page={page}
          pageIndex={pageIndex}
          q={searchParams.q ?? ""}
          hasAnyEstablishments={allItems.length > 0}
        />
      </div>
    </div>
  );
}
