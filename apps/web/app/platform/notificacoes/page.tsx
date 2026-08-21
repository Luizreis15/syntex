import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@syntex/database";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import {
  CreateNotificationForm,
  MarkNotificationsReadButton,
} from "@/features/platform/notification-forms";

export default async function PlatformNotificacoesPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: rows } = await admin
    .from("platform_notification")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: tenants } = await admin
    .from("tenant")
    .select("id, legal_name, trade_name, slug")
    .order("legal_name");

  const tenantOptions = (tenants ?? [])
    .filter((t) => t.slug && !t.slug.startsWith("tenant-de-teste") && !/-1\d{12,}-/.test(t.slug))
    .map((t) => ({ id: t.id, label: t.trade_name ?? t.legal_name }));

  const unread = (rows ?? []).filter((r) => !r.read_at).length;

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Plataforma", href: "/platform" }, { label: "Notificações" }]}
        title="Notificações"
        metadata={
          <span className="text-body text-ink-2">
            Inbox do control plane · {unread} não lida(s)
          </span>
        }
        actions={<MarkNotificationsReadButton />}
        className="border-0 bg-transparent px-0 py-0"
      />

      <div className="mt-6 space-y-8">
        <CreateNotificationForm tenants={tenantOptions} />

        {!rows?.length ? (
          <SyntexEmptyState
            title="Nenhuma notificação"
            description="Cancelamentos e alertas manuais aparecem aqui."
          />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {rows.map((n) => (
              <li key={n.id} className="space-y-1 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className={`font-medium ${n.read_at ? "text-ink-2" : "text-ink"}`}>
                    {n.title}
                    <span className="ml-2 font-mono text-label uppercase text-ink-3">{n.severity}</span>
                  </p>
                  <time className="font-mono text-label text-ink-3">
                    {n.created_at.slice(0, 16).replace("T", " ")}
                  </time>
                </div>
                <p className="text-body text-ink-2">{n.body}</p>
                {!n.read_at && <p className="text-label text-petrol-700">não lida</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
