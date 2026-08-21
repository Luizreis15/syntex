import { redirect } from "next/navigation";
import { hasAnyGrant } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";

/**
 * Placeholder Atendimento — filiação plena após discovery com o setor.
 */
export default async function FiliacaoPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (!hasAnyGrant(session.grants, "membership.read")) {
    return (
      <div>
        <SyntexPageHeader
          breadcrumbs={[{ label: "Atendimento" }, { label: "Filiação" }]}
          title="Filiação"
        />
        <div className="p-6">
          <SyntexEmptyState title="Sem permissão" description="membership.read é necessária." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Atendimento" }, { label: "Filiação" }]}
        title="Filiação"
        metadata={
          <span className="text-body text-ink-2">Área de Atendimento — em discovery</span>
        }
      />
      <div className="p-6">
        <SyntexEmptyState
          title="Painel de filiação em construção"
          description="Associação exige vínculo com empresa do setor e ausência de carta de oposição. O fluxo completo será desenhado com o time de Atendimento. Enquanto isso, use Trabalhadores para ver/alterar status de filiação pontual."
        />
        <p className="mt-4">
          <a href="/trabalhadores" className="text-body text-petrol-700 hover:underline">
            Ir para trabalhadores
          </a>
        </p>
      </div>
    </div>
  );
}
