import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { allowedBranchIds, type UserGrant } from "@syntex/permissions";

type Client = SupabaseClient<Database>;

export interface WorkerListRow {
  worker_id: string;
  person_id: string;
  full_name: string;
  cpf: string;
  branch_id: string | null;
  membership_status: string | null;
  company_name: string | null;
}

export async function fetchWorkersPage(
  supabase: Client,
  tenantId: string,
  grants: UserGrant[],
  opts: { q?: string; pageIndex: number; pageSize: number },
): Promise<{ rows: WorkerListRow[]; total: number }> {
  const branchScope = allowedBranchIds(grants, "worker.read");
  if (branchScope !== "all" && branchScope.length === 0) {
    return { rows: [], total: 0 };
  }

  let query = supabase
    .from("worker")
    .select("id, branch_id, person_id, created_at", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(opts.pageIndex * opts.pageSize, (opts.pageIndex + 1) * opts.pageSize - 1);

  if (branchScope !== "all") {
    query = query.in("branch_id", branchScope);
  }

  const { data: workers, error, count } = await query;
  if (error) throw error;
  if (!workers?.length) return { rows: [], total: count ?? 0 };

  const personIds = workers.map((w) => w.person_id);
  const workerIds = workers.map((w) => w.id);

  const { data: people, error: peopleError } = await supabase
    .from("person")
    .select("id, full_name, cpf")
    .eq("tenant_id", tenantId)
    .in("id", personIds);
  if (peopleError) throw peopleError;
  const personById = new Map((people ?? []).map((p) => [p.id, p]));

  const q = opts.q?.trim().toLowerCase() ?? "";
  const digits = opts.q?.replace(/\D/g, "") ?? "";

  let filtered = workers;
  if (q) {
    filtered = workers.filter((w) => {
      const person = personById.get(w.person_id);
      if (!person) return false;
      if (digits.length >= 3 && person.cpf.includes(digits)) return true;
      return person.full_name.toLowerCase().includes(q);
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const membershipByPerson = new Map<string, string>();
  const filteredPersonIds = filtered.map((w) => w.person_id);
  if (filteredPersonIds.length > 0) {
    const { data: memberships } = await supabase
      .from("membership")
      .select("person_id, status")
      .eq("tenant_id", tenantId)
      .in("person_id", filteredPersonIds)
      .lte("valid_from", today)
      .or(`valid_until.is.null,valid_until.gte.${today}`);
    for (const m of memberships ?? []) {
      membershipByPerson.set(m.person_id, m.status);
    }
  }

  const companyByWorker = new Map<string, string>();
  const filteredWorkerIds = filtered.map((w) => w.id);
  if (filteredWorkerIds.length > 0) {
    const { data: employments } = await supabase
      .from("employment_relationship")
      .select("worker_id, company_id")
      .eq("tenant_id", tenantId)
      .in("worker_id", filteredWorkerIds)
      .eq("status", "ativo")
      .lte("valid_from", today)
      .or(`valid_until.is.null,valid_until.gte.${today}`);

    const companyIds = [...new Set((employments ?? []).map((e) => e.company_id))];
    const companyName = new Map<string, string>();
    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from("company")
        .select("id, legal_name, trade_name")
        .eq("tenant_id", tenantId)
        .in("id", companyIds);
      for (const c of companies ?? []) {
        companyName.set(c.id, c.trade_name ?? c.legal_name);
      }
    }
    for (const e of employments ?? []) {
      const name = companyName.get(e.company_id);
      if (name) companyByWorker.set(e.worker_id, name);
    }
  }

  const rows: WorkerListRow[] = filtered.flatMap((w) => {
    const person = personById.get(w.person_id);
    if (!person) return [];
    return [
      {
        worker_id: w.id,
        person_id: w.person_id,
        full_name: person.full_name,
        cpf: person.cpf,
        branch_id: w.branch_id,
        membership_status: membershipByPerson.get(w.person_id) ?? null,
        company_name: companyByWorker.get(w.id) ?? null,
      },
    ];
  });

  return { rows, total: count ?? rows.length };
}

export async function fetchWorkerDetail(supabase: Client, tenantId: string, workerId: string) {
  const { data: worker, error } = await supabase
    .from("worker")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", workerId)
    .single();
  if (error) throw error;

  const { data: person, error: personError } = await supabase
    .from("person")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", worker.person_id)
    .single();
  if (personError) throw personError;

  const { data: employments } = await supabase
    .from("employment_relationship")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("worker_id", workerId)
    .order("valid_from", { ascending: false });

  const companyIds = [...new Set((employments ?? []).map((e) => e.company_id))];
  const companiesById = new Map<string, { id: string; legal_name: string; trade_name: string | null; cnpj: string }>();
  if (companyIds.length > 0) {
    const { data: companies } = await supabase
      .from("company")
      .select("id, legal_name, trade_name, cnpj")
      .eq("tenant_id", tenantId)
      .in("id", companyIds);
    for (const c of companies ?? []) companiesById.set(c.id, c);
  }

  const employmentsWithCompany = (employments ?? []).map((e) => ({
    ...e,
    company: companiesById.get(e.company_id) ?? null,
  }));

  const { data: memberships } = await supabase
    .from("membership")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("person_id", person.id)
    .order("valid_from", { ascending: false });

  return { worker, person, employments: employmentsWithCompany, memberships: memberships ?? [] };
}
