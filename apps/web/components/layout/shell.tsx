import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  isAssociatePortalActor,
  isCompanyPortalActor,
  isOfficePortalActor,
  type RoleName,
} from "@syntex/permissions";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { filterNavSections } from "./nav-config";

const ROLE_LABEL: Record<RoleName, string> = {
  admin: "Administração",
  diretoria: "Diretoria",
  atendimento: "Atendimento",
  financeiro: "Financeiro",
  company_master: "Responsável pela conta",
  company_user: "Empresa",
  associate: "Associado",
  office_master: "Escritório",
  office_user: "Escritório",
};

/**
 * Server Component: resolve sessão, tenant e branch, filtra a navegação por
 * permissão, e entrega tudo pronto para os componentes client (Sidebar,
 * Topbar) — que não decidem autorização, só renderizam o que chegou.
 */
export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (isAssociatePortalActor(session.grants)) redirect("/associado");
  if (isOfficePortalActor(session.grants)) redirect("/escritorio");
  if (isCompanyPortalActor(session.grants)) redirect("/empresa");

  const { data: tenant } = await session.supabase
    .from("tenant")
    .select("slug, legal_name")
    .eq("id", session.tenantId)
    .single();

  const { data: appUser } = await session.supabase
    .from("app_user")
    .select("full_name, email")
    .eq("id", session.appUserId)
    .single();

  const branchScoped = session.grants.find((g) => g.scope === "branch" && g.branchId);
  let branchLabel = "Todas as unidades";
  if (branchScoped?.branchId) {
    const { data: branch } = await session.supabase
      .from("branch")
      .select("name")
      .eq("id", branchScoped.branchId)
      .single();
    branchLabel = branch?.name ?? branchLabel;
  }

  const sections = filterNavSections(session.grants, session.tenantId);
  const firstRole = session.grants[0]?.role;
  const roleLabel = (firstRole && ROLE_LABEL[firstRole]) ?? "Sindicato";

  return (
    <div className="flex h-screen">
      <Sidebar
        sections={sections}
        tenantName={tenant?.slug?.toUpperCase() ?? "SYNTEX"}
        tenantLegalName={tenant?.legal_name ?? ""}
        branchLabel={branchLabel}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar
          userName={appUser?.full_name ?? ""}
          userEmail={appUser?.email ?? ""}
          roleLabel={roleLabel}
          branchLabel={branchLabel}
        />
        <main className="min-h-0 flex-1 overflow-y-auto bg-paper">{children}</main>
      </div>
    </div>
  );
}
