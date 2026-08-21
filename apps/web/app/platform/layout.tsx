import Link from "next/link";
import { redirect } from "next/navigation";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { PlatformSignOutButton } from "@/features/platform/platform-sign-out-button";

const NAV = [
  { href: "/platform", label: "Visão geral", exact: true },
  { href: "/platform/tenants", label: "Sindicatos" },
  { href: "/platform/cobrancas", label: "Cobranças" },
  { href: "/platform/notificacoes", label: "Notificações" },
] as const;

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-label uppercase text-ink-3">Syntex</p>
              <p className="text-component font-semibold text-ink">Control plane</p>
            </div>
            <nav className="flex flex-wrap gap-3 text-body">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-petrol-700 hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-body">
            <span className="text-ink-2">
              {session.fullName}
              <span className="mx-1 text-ink-3">·</span>
              <span className="font-mono text-label">{session.email}</span>
            </span>
            <PlatformSignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
