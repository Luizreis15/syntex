"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatCnpj } from "@/lib/formatters/cnpj";

interface TenantRow {
  id: string;
  slug: string;
  legal_name: string;
  trade_name?: string | null;
  sector?: string | null;
  cnpj: string;
  created_at: string;
  default_charge_provider?: string | null;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function PlatformTenantsPanel({ initial }: { initial: TenantRow[] }) {
  const router = useRouter();
  const [tenants, setTenants] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [slugOverride, setSlugOverride] = useState("");
  const [cnpj, setCnpj] = useState("");

  const suggestedSlug = useMemo(
    () => slugify(tradeName || legalName) || "sindicato",
    [tradeName, legalName],
  );

  async function provision(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setPending(true);
    setError(null);
    setSuccess(null);
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: fd.get("legalName"),
          tradeName: fd.get("tradeName") || null,
          sector: fd.get("sector") || null,
          cnpj: fd.get("cnpj"),
          email: fd.get("email") || null,
          phone: fd.get("phone") || null,
          slug: (fd.get("slug") as string)?.trim() || suggestedSlug,
          masterName: fd.get("masterName"),
          masterEmail: fd.get("masterEmail"),
          masterPassword: fd.get("masterPassword"),
          masterPasswordConfirm: fd.get("masterPasswordConfirm"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Falha ao cadastrar sindicato.");
        return;
      }
      const tenant = json.data.tenant as TenantRow;
      setTenants((prev) =>
        [...prev.filter((t) => t.id !== tenant.id), tenant].sort((a, b) =>
          a.legal_name.localeCompare(b.legal_name, "pt-BR"),
        ),
      );
      setSuccess(
        `Sindicato criado. Login do responsável: ${json.data.masterEmail} — use /login (mesma senha informada).`,
      );
      form.reset();
      setLegalName("");
      setTradeName("");
      setSlugOverride("");
      setCnpj("");
      router.push(`/platform/tenants/${tenant.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha inesperada ao cadastrar.");
    } finally {
      setPending(false);
    }
  }

  const realTenants = tenants.filter(
    (t) => t.slug && !t.slug.startsWith("tenant-de-teste") && !/-1\d{12,}-/.test(t.slug),
  );
  const testNoise = tenants.length - realTenants.length;

  return (
    <div className="space-y-10">
      {error && <p className="text-body text-danger">{error}</p>}
      {success && (
        <p className="rounded-sm border border-border bg-surface-2 p-3 text-body text-ink">{success}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-component font-semibold text-ink">Sindicatos</h2>
        {testNoise > 0 && (
          <p className="text-label text-ink-3">
            {testNoise} tenant(s) de teste automatizado ocultos nesta lista.
          </p>
        )}
        {realTenants.length === 0 ? (
          <p className="text-body text-ink-2">Nenhum sindicato ainda.</p>
        ) : (
          <table className="w-full border-collapse text-left text-body" aria-label="Sindicatos">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">Nome</th>
                <th className="py-2 pr-3 font-medium">Setor</th>
                <th className="py-2 pr-3 font-medium">Slug</th>
                <th className="py-2 pr-3 font-medium">Gateway</th>
                <th className="py-2 font-medium">CNPJ</th>
              </tr>
            </thead>
            <tbody>
              {realTenants.map((t) => (
                <tr key={t.id} className="border-b border-border">
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/platform/tenants/${t.id}`}
                      className="font-medium text-petrol-700 hover:underline"
                    >
                      {t.trade_name ?? t.legal_name}
                    </Link>
                    {t.trade_name && (
                      <span className="mt-0.5 block text-label text-ink-3">{t.legal_name}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-ink-2">{t.sector ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">{t.slug}</td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">
                    {t.default_charge_provider ?? "stub"}
                  </td>
                  <td className="py-2.5 font-mono text-ink-2">
                    {t.cnpj ? formatCnpj(t.cnpj) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-component font-semibold text-ink">Cadastrar sindicato</h2>
          <p className="text-body text-ink-2">
            Cria o tenant e o responsável (union master) já com login e senha — sem token de convite.
          </p>
        </div>

        <form onSubmit={provision} className="max-w-2xl space-y-8">
          <fieldset className="space-y-3">
            <legend className="text-label uppercase text-ink-3">Sindicato</legend>
            <Field
              label="Razão social"
              name="legalName"
              required
              value={legalName}
              onChange={setLegalName}
            />
            <Field
              label="Nome fantasia"
              name="tradeName"
              value={tradeName}
              onChange={setTradeName}
            />
            <Field label="Setor / ramo" name="sector" placeholder="Ex.: comércio, indústria, serviços" />
            <div className="space-y-1">
              <label htmlFor="cnpj" className="text-label text-ink-3">
                CNPJ
              </label>
              <input
                id="cnpj"
                name="cnpj"
                required
                inputMode="numeric"
                value={cnpj}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 14);
                  let masked = d;
                  if (d.length > 12) masked = d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
                  else if (d.length > 8) masked = d.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
                  else if (d.length > 5) masked = d.replace(/(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
                  else if (d.length > 2) masked = d.replace(/(\d{2})(\d{0,3})/, "$1.$2");
                  setCnpj(masked);
                }}
                placeholder="00.000.000/0000-00"
                className="h-input w-full rounded-sm border border-border bg-surface px-2 font-mono text-body"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail institucional" name="email" type="email" />
              <Field label="Telefone" name="phone" />
            </div>
            <div className="space-y-1">
              <label htmlFor="slug" className="text-label text-ink-3">
                Identificador (slug)
              </label>
              <input
                id="slug"
                name="slug"
                pattern="[a-z0-9-]*"
                value={slugOverride}
                onChange={(e) => setSlugOverride(e.target.value.toLowerCase())}
                placeholder={suggestedSlug}
                className="h-input w-full rounded-sm border border-border bg-surface px-2 font-mono text-body"
              />
              <p className="text-label text-ink-3">
                Se vazio, usa: <span className="font-mono">{suggestedSlug}</span>
              </p>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-label uppercase text-ink-3">Responsável (acesso master)</legend>
            <Field label="Nome completo" name="masterName" required />
            <Field label="E-mail de login" name="masterEmail" type="email" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Senha de acesso" name="masterPassword" type="password" required minLength={6} />
              <Field
                label="Confirmar senha"
                name="masterPasswordConfirm"
                type="password"
                required
                minLength={6}
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={pending}
            className="h-input rounded-sm bg-petrol-800 px-4 text-body text-shell-ink disabled:opacity-50"
          >
            {pending ? "Cadastrando…" : "Criar sindicato e acesso"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  value,
  onChange,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  minLength?: number;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-label text-ink-3">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        {...(value !== undefined
          ? { value, onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value) }
          : {})}
        className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
      />
    </div>
  );
}
