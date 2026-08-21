import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseAdminClient, recordAudit } from "@syntex/database";
import { getPlatformSession } from "@/lib/auth/platform-session";
import { SyntexPageHeader } from "@/components/ui/syntex-page-header";
import { formatCnpj } from "@/lib/formatters/cnpj";
import { TenantGatewayForm } from "@/features/platform/tenant-gateway-form";

export default async function PlatformTenantDetailPage({ params }: { params: { id: string } }) {
  const session = await getPlatformSession();
  if (!session) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: tenant, error } = await admin
    .from("tenant")
    .select(
      "id, slug, legal_name, trade_name, sector, cnpj, email, phone, created_at, default_charge_provider, itau_beneficiario_id, itau_pix_key, itau_carteira_code",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (error || !tenant) notFound();

  await recordAudit(admin, {
    tenantId: tenant.id,
    actorId: null,
    action: "read",
    table: "tenant",
    resourceId: tenant.id,
    metadata: { portal: "platform", by: session.platformAdminId },
  });

  const { data: masters } = await admin
    .from("app_user")
    .select("id, full_name, email, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true })
    .limit(10);

  const { count: chargeCount } = await admin
    .from("charge")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  const { count: companyCount } = await admin
    .from("company")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  const itauIncomplete =
    tenant.default_charge_provider === "itau_bolecode" &&
    (!tenant.itau_beneficiario_id || !tenant.itau_pix_key || !tenant.itau_carteira_code);

  return (
    <div>
      <SyntexPageHeader
        breadcrumbs={[
          { label: "Plataforma", href: "/platform" },
          { label: "Sindicatos", href: "/platform/tenants" },
          { label: tenant.trade_name ?? tenant.legal_name },
        ]}
        title={tenant.trade_name ?? tenant.legal_name}
        metadata={
          <span className="font-mono text-body text-ink-2">
            {tenant.slug} · {formatCnpj(tenant.cnpj)}
          </span>
        }
        className="border-0 bg-transparent px-0 py-0"
      />

      <div className="mt-6 space-y-8">
        {itauIncomplete && (
          <p className="rounded-sm border border-border bg-surface-2 p-3 text-body text-ink">
            Configuração Itaú incompleta — preencha beneficiário, chave PIX e carteira abaixo.
          </p>
        )}

        <section className="space-y-2">
          <h2 className="text-component font-semibold text-ink">Dados do sindicato</h2>
          <dl className="grid gap-2 text-body sm:grid-cols-2">
            <div>
              <dt className="text-label text-ink-3">Razão social</dt>
              <dd>{tenant.legal_name}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">Fantasia</dt>
              <dd>{tenant.trade_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">Setor</dt>
              <dd>{tenant.sector ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">CNPJ</dt>
              <dd className="font-mono">{formatCnpj(tenant.cnpj)}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">E-mail</dt>
              <dd>{tenant.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label text-ink-3">Telefone</dt>
              <dd>{tenant.phone ?? "—"}</dd>
            </div>
          </dl>
          <p className="text-label text-ink-3">
            {companyCount ?? 0} empresa(s) · {chargeCount ?? 0} cobrança(s) ·{" "}
            <Link
              href={`/platform/cobrancas?tenant=${tenant.id}`}
              className="text-petrol-700 hover:underline"
            >
              ver cobranças
            </Link>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-component font-semibold text-ink">Usuários do tenant</h2>
          {!masters?.length ? (
            <p className="text-body text-ink-2">Nenhum app_user ainda.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border text-body">
              {masters.map((u) => (
                <li key={u.id} className="flex flex-wrap justify-between gap-2 py-2">
                  <span>{u.full_name}</span>
                  <span className="font-mono text-label text-ink-2">{u.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-component font-semibold text-ink">Gateway de cobrança</h2>
          <TenantGatewayForm
            tenantId={tenant.id}
            initial={{
              defaultChargeProvider: tenant.default_charge_provider,
              itauBeneficiarioId: tenant.itau_beneficiario_id ?? "",
              itauPixKey: tenant.itau_pix_key ?? "",
              itauCarteiraCode: tenant.itau_carteira_code ?? "",
            }}
          />
        </section>
      </div>
    </div>
  );
}
