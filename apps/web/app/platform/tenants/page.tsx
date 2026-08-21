import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@syntex/database";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { PlatformTenantsPanel } from "@/features/platform/platform-tenants-panel";

export default async function PlatformTenantsPage() {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: tenants } = await admin
    .from("tenant")
    .select(
      "id, slug, legal_name, trade_name, sector, cnpj, created_at, default_charge_provider",
    )
    .order("legal_name");

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[{ label: "Plataforma", href: "/platform" }, { label: "Sindicatos" }]}
        title="Sindicatos"
        metadata={<span className="text-body text-ink-2">Provisionar e configurar tenants</span>}
        className="border-0 bg-transparent px-0 py-0"
      />
      <div className="mt-6">
        <PlatformTenantsPanel initial={tenants ?? []} />
      </div>
    </div>
  );
}
