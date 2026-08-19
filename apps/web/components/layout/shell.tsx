import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { filterNavSections } from "./nav-config";

/**
 * Server Component: resolve sessão, tenant e branch, filtra a navegação por
 * permissão, e entrega tudo pronto para os componentes client (Sidebar,
 * Topbar) — que não decidem autorização, só renderizam o que chegou.
 */
export async function Shell({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

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

  return (
    <div className="flex h-screen">
      <Sidebar
        sections={sections}
        tenantName={tenant?.slug?.toUpperCase() ?? "SYNTEX"}
        tenantLegalName={tenant?.legal_name ?? ""}
        branchLabel={branchLabel}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar userName={appUser?.full_name ?? ""} userEmail={appUser?.email ?? ""} />
        <main className="flex-1 overflow-y-auto bg-paper">{children}</main>
      </div>
    </div>
  );
}
