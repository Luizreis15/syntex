import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { CreateOfficeForm } from "@/features/offices/create-office-form";

export default async function EscritoriosPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "office.provision")) {
    return (
      <div>
        <SyntexPageHeader breadcrumbs={[{ label: "Operação" }]} title="Escritórios" />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="office.provision é necessária." />
        </div>
      </div>
    );
  }

  const { data: offices } = await session.supabase
    .from("office")
    .select("id, name, document, created_at")
    .eq("tenant_id", session.tenantId)
    .order("name");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Operação" }, { label: "Escritórios" }]}
        title="Escritórios"
        metadata={<span className="text-body text-ink-2">Contadores e procuradorias (N empresas)</span>}
      />
      <div className="space-y-6 p-6">
        <CreateOfficeForm />
        {!offices?.length ? (
          <SyntexEmptyState
            title="Nenhum escritório"
            description="Crie um escritório e emita o convite do office_master."
          />
        ) : (
          <table className="w-full border-collapse text-left text-body" aria-label="Escritórios">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">Documento</th>
                <th className="py-2 font-medium">Criado</th>
              </tr>
            </thead>
            <tbody>
              {offices.map((o) => (
                <tr key={o.id} className="border-b border-border">
                  <td className="py-2.5 pr-3">
                    <Link href={`/escritorios/${o.id}`} className="font-medium text-petrol-700 hover:underline">
                      {o.name}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">{o.document ?? "—"}</td>
                  <td className="py-2.5 font-mono text-ink-2">{o.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
