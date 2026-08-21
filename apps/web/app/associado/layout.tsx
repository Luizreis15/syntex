import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAssociatePortalActor } from "@syntex/permissions";
import { resolveAssociateContext } from "@/lib/domain/associate-access";

export default async function AssociadoLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isAssociatePortalActor(session.grants)) redirect("/empresas");

  let personName = "Associado";
  try {
    const { person } = await resolveAssociateContext(
      session.supabase,
      session.tenantId,
      session.appUserId,
    );
    personName = person.social_name ?? person.full_name;
  } catch {
    // layout ainda renderiza; páginas filhas tratam erro
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-label uppercase text-ink-3">Portal do associado</p>
            <h1 className="text-title font-semibold text-ink">{personName}</h1>
          </div>
          <nav className="flex gap-3 text-body">
            <Link href="/associado" className="text-petrol-700 hover:underline">
              Conta
            </Link>
            <Link href="/associado/filiacao" className="text-petrol-700 hover:underline">
              Filiação
            </Link>
            <Link href="/associado/cobrancas" className="text-petrol-700 hover:underline">
              Cobranças
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
