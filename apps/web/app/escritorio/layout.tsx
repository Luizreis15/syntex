import Link from "next/link";
import { redirect } from "next/navigation";
import { allowedCompanyIds, isOfficePortalActor, primaryOfficeId } from "@syntex/permissions";
import { getSession } from "@/lib/auth/session";

export default async function EscritorioPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isOfficePortalActor(session.grants)) redirect("/empresas");

  const officeId = primaryOfficeId(session.grants);
  const { data: office } = officeId
    ? await session.supabase
        .from("office")
        .select("name, document")
        .eq("tenant_id", session.tenantId)
        .eq("id", officeId)
        .maybeSingle()
    : { data: null };

  const companyScope = allowedCompanyIds(session.grants, "finance.read");
  const companyIds = companyScope === "all" ? [] : companyScope;

  const { data: companies } =
    companyIds.length > 0
      ? await session.supabase
          .from("company")
          .select("id, legal_name, trade_name, cnpj")
          .eq("tenant_id", session.tenantId)
          .in("id", companyIds)
          .order("legal_name")
      : { data: [] };

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
            <p className="text-label uppercase text-ink-3">Portal do escritório</p>
            <h1 className="text-title font-semibold text-ink">{office?.name ?? "Escritório"}</h1>
            {office?.document && (
              <p className="font-mono text-body text-ink-2">{office.document}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-body">
            <nav className="flex gap-3">
              <Link href="/escritorio" className="text-petrol-700 hover:underline">
                Empresas
              </Link>
            </nav>
            <span className="text-ink-2">{appUser?.full_name}</span>
          </div>
        </div>
        {companies && companies.length > 0 && (
          <div className="mx-auto mt-3 flex max-w-5xl flex-wrap gap-2">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/escritorio/empresa/${c.id}`}
                className="rounded-sm border border-border px-2 py-1 text-label text-ink-2 hover:border-petrol-600 hover:text-petrol-700"
              >
                {c.trade_name ?? c.legal_name}
              </Link>
            ))}
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
