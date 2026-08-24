import { redirect } from "next/navigation";
import Link from "next/link";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { fetchAgreementsPage } from "@/features/agreements/data";
import { ResolveAgreementApplicabilityForm } from "@/features/agreements/resolve-agreement-applicability-form";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ConvencoesPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "agreement.read")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Relações" }, { label: "Convenções" }]} title="Convenções" />
        <div className="p-6">
          <SyntexEmptyState
            title="Sem permissão para ver convenções"
            description="Sua conta não tem a permissão agreement.read."
          />
        </div>
      </div>
    );
  }

  const date = searchParams.date;
  const rows = await fetchAgreementsPage(session.supabase, session.tenantId, { date });
  const canResolveApplicability = hasAnyGrant(session.grants, "representation.read");

  let establishmentOptions: { id: string; label: string }[] = [];
  if (canResolveApplicability) {
    const { data: establishments } = await session.supabase
      .from("establishment")
      .select("id, cnpj, kind, company:establishment_company_id_tenant_id_fkey(legal_name, trade_name)")
      .eq("tenant_id", session.tenantId)
      .order("cnpj")
      .limit(400);
    establishmentOptions = (establishments ?? []).map((e) => {
      const company = e.company as unknown as { legal_name: string; trade_name: string | null } | null;
      const name = company?.trade_name ?? company?.legal_name ?? "Empresa";
      const kind = e.kind === "matriz" ? "Matriz" : "Filial";
      return {
        id: e.id,
        label: `${name} · ${kind} · ${e.cnpj}`,
      };
    });
  }

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Relações" }, { label: "Convenções" }]}
        title="Convenções"
        metadata={
          <span className="text-body text-ink-2">
            CCT/ACT por vigência
            {date ? ` · vigentes em ${date}` : ""}
          </span>
        }
      />
      <div className="space-y-6 p-6">
        {canResolveApplicability ? (
          <ResolveAgreementApplicabilityForm
            establishments={establishmentOptions}
            defaultDate={date ?? todayIso()}
          />
        ) : (
          <p className="text-dense text-ink-3">
            Para resolver qual acordo vale para um estabelecimento, é necessário representation.read.
          </p>
        )}

        <form className="flex items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="date" className="text-label text-ink-3">
              Filtrar vigentes em
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date ?? ""}
              className="h-input rounded-sm border border-border bg-surface px-2 text-body text-ink"
            />
          </div>
          <button type="submit" className="h-input rounded-sm border border-border-strong px-3 text-body text-ink">
            Filtrar
          </button>
          {date && (
            <Link href="/convencoes" className="h-input inline-flex items-center px-2 text-body text-ink-2 hover:text-ink">
              Limpar
            </Link>
          )}
        </form>

        {rows.length === 0 ? (
          <SyntexEmptyState
            title="Nenhuma convenção encontrada"
            description={
              date
                ? `Não há CCT/ACT vigente em ${date}.`
                : "Cadastre uma CCT no seed ou na próxima fatia de escrita."
            }
          />
        ) : (
          <table className="w-full border-collapse text-left text-body" aria-label="Convenções">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">Tipo</th>
                <th className="py-2 pr-3 font-medium">Mediador</th>
                <th className="py-2 pr-3 font-medium">Categorias</th>
                <th className="py-2 pr-3 font-medium">Vigência</th>
                <th className="py-2 font-medium">Território</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="py-2.5 pr-3">
                    <Link href={`/convencoes/${row.id}?date=${date ?? todayIso()}`} className="font-medium text-petrol-700 hover:underline">
                      {row.kind.toUpperCase()}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">{row.mediador_number ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-ink-2">
                    {[row.economic_name, row.professional_name].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">
                    {row.valid_from} → {row.valid_until}
                  </td>
                  <td className="py-2.5 text-ink-2">
                    {row.territory_count === 0 ? "Todos os municípios" : `${row.territory_count} município(s)`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
