import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isCompanyPortalActor, primaryCompanyId } from "@syntex/permissions";

export default async function EmpresaPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isCompanyPortalActor(session.grants)) redirect("/empresas");

  const companyId = primaryCompanyId(session.grants)!;
  const { data: company } = await session.supabase
    .from("company")
    .select("legal_name, trade_name, cnpj")
    .eq("tenant_id", session.tenantId)
    .eq("id", companyId)
    .single();

  const { data: appUser } = await session.supabase
    .from("app_user")
    .select("full_name")
    .eq("id", session.appUserId)
    .single();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-label uppercase text-ink-3">Portal empresa</p>
            <h1 className="text-title font-semibold text-ink">
              {company?.trade_name ?? company?.legal_name ?? "Empresa"}
            </h1>
            <p className="font-mono text-body text-ink-2">{company?.cnpj}</p>
          </div>
          <div className="flex items-center gap-4 text-body">
            <nav className="flex gap-3">
              <Link href="/empresa" className="text-petrol-700 hover:underline">
                Cobranças
              </Link>
              <Link href="/empresa/equipe" className="text-petrol-700 hover:underline">
                Equipe
              </Link>
            </nav>
            <span className="text-ink-2">{appUser?.full_name}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
