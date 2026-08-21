"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Department {
  id: string;
  name: string;
}

interface Invite {
  id: string;
  email: string;
  role_name: string;
  scope: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

export function StaffForms({
  departments,
  invites,
}: {
  departments: Department[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [tokenOnce, setTokenOnce] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createDepartment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "department", name: fd.get("name") }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao criar setor.");
      return;
    }
    e.currentTarget.reset();
    router.refresh();
  }

  async function createInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setTokenOnce(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "invite",
        email: fd.get("email"),
        roleName: fd.get("roleName"),
        scope: fd.get("scope"),
        departmentId: fd.get("departmentId") || null,
        branchId: fd.get("branchId") || null,
      }),
    });
    const json = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(typeof json.error === "string" ? json.error : "Falha ao convidar.");
      return;
    }
    setTokenOnce(json.data.token as string);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-body text-danger">{error}</p>}
      {tokenOnce && (
        <p className="break-all rounded-sm border border-border bg-surface-2 p-3 font-mono text-label text-ink-2">
          Token do convite (copie agora — não será mostrado de novo): {tokenOnce}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-component font-semibold text-ink">Setores</h2>
        {departments.length === 0 ? (
          <p className="text-body text-ink-2">Nenhum setor cadastrado.</p>
        ) : (
          <ul className="space-y-1 text-body">
            {departments.map((d) => (
              <li key={d.id}>{d.name}</li>
            ))}
          </ul>
        )}
        <form onSubmit={createDepartment} className="flex max-w-md flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 space-y-1">
            <label htmlFor="dept-name" className="text-label text-ink-3">
              Novo setor
            </label>
            <input
              id="dept-name"
              name="name"
              required
              className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="h-input rounded-sm border border-border-strong px-3 text-body disabled:opacity-50"
          >
            Criar
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-component font-semibold text-ink">Convites internos</h2>
        <form onSubmit={createInvite} className="max-w-xl space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="text-label text-ink-3">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="roleName" className="text-label text-ink-3">
                Papel
              </label>
              <select
                id="roleName"
                name="roleName"
                required
                className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
              >
                <option value="atendimento">atendimento</option>
                <option value="financeiro">financeiro</option>
                <option value="diretoria">diretoria</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="scope" className="text-label text-ink-3">
                Escopo
              </label>
              <select
                id="scope"
                name="scope"
                required
                defaultValue="tenant"
                className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
              >
                <option value="tenant">tenant</option>
                <option value="department">department</option>
                <option value="branch">branch</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="departmentId" className="text-label text-ink-3">
              Setor (se escopo department)
            </label>
            <select
              id="departmentId"
              name="departmentId"
              className="h-input w-full rounded-sm border border-border bg-surface px-2 text-body"
            >
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="h-input rounded-sm bg-petrol-800 px-3 text-body text-shell-ink disabled:opacity-50"
          >
            Enviar convite
          </button>
        </form>

        {invites.length > 0 && (
          <table className="w-full border-collapse text-left text-body" aria-label="Convites">
            <thead>
              <tr className="border-b border-border text-label uppercase text-ink-3">
                <th className="py-2 pr-3 font-medium">E-mail</th>
                <th className="py-2 pr-3 font-medium">Papel</th>
                <th className="py-2 pr-3 font-medium">Escopo</th>
                <th className="py-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-border">
                  <td className="py-2.5 pr-3">{inv.email}</td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">{inv.role_name}</td>
                  <td className="py-2.5 pr-3 font-mono text-ink-2">{inv.scope}</td>
                  <td className="py-2.5">
                    {inv.accepted_at
                      ? "aceito"
                      : inv.revoked_at
                        ? "revogado"
                        : "pendente"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
