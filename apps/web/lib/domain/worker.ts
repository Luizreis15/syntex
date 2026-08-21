import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { WorkerCreateInput } from "@syntex/validation";

type Client = SupabaseClient<Database>;

export interface CreateWorkerResult {
  person: Database["public"]["Tables"]["person"]["Row"];
  worker: Database["public"]["Tables"]["worker"]["Row"];
  membership: Database["public"]["Tables"]["membership"]["Row"] | null;
  employment: Database["public"]["Tables"]["employment_relationship"]["Row"];
}

/**
 * Cria person + worker + vínculo empregatício (empresa obrigatória).
 * Filiação (membership) continua opcional — domínio Atendimento.
 *
 * Trabalhador sem empresa não entra no cadastro operacional do sindicato:
 * a relação sindical parte da empresa do setor.
 */
export async function createWorkerWithPerson(
  supabase: Client,
  tenantId: string,
  input: WorkerCreateInput,
): Promise<CreateWorkerResult> {
  if (!input.companyId) {
    throw new Error("Empresa é obrigatória para cadastrar trabalhador.");
  }

  let branchId = input.branchId ?? null;
  if (!branchId) {
    const { data: company } = await supabase
      .from("company")
      .select("branch_id")
      .eq("tenant_id", tenantId)
      .eq("id", input.companyId)
      .maybeSingle();
    branchId = company?.branch_id ?? null;
  }

  const { data: person, error: personError } = await supabase
    .from("person")
    .insert({
      tenant_id: tenantId,
      cpf: input.cpf,
      full_name: input.fullName,
      social_name: input.socialName ?? null,
      birth_date: input.birthDate ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      municipality_id: input.municipalityId ?? null,
    })
    .select()
    .single();
  if (personError) throw personError;

  const { data: worker, error: workerError } = await supabase
    .from("worker")
    .insert({
      tenant_id: tenantId,
      person_id: person.id,
      branch_id: branchId,
      registration_number: input.registrationNumber ?? null,
    })
    .select()
    .single();
  if (workerError) throw workerError;

  let membership: CreateWorkerResult["membership"] = null;
  if (input.membershipStatus) {
    const { data, error } = await supabase
      .from("membership")
      .insert({
        tenant_id: tenantId,
        person_id: person.id,
        status: input.membershipStatus,
        valid_from: input.membershipValidFrom ?? new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw error;
    membership = data;
  }

  const { data: employment, error: employmentError } = await supabase
    .from("employment_relationship")
    .insert({
      tenant_id: tenantId,
      worker_id: worker.id,
      company_id: input.companyId,
      establishment_id: input.establishmentId ?? null,
      valid_from: input.employmentValidFrom ?? new Date().toISOString().slice(0, 10),
      job_title: input.jobTitle ?? null,
      status: "ativo",
      source: "manual",
    })
    .select()
    .single();
  if (employmentError) throw employmentError;

  return { person, worker, membership, employment };
}

/** Membership vigente na data (valid_until null ou >= date). */
export async function resolveMembership(
  supabase: Client,
  tenantId: string,
  personId: string,
  referenceDate: string,
) {
  const { data, error } = await supabase
    .from("membership")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("person_id", personId)
    .lte("valid_from", referenceDate)
    .or(`valid_until.is.null,valid_until.gte.${referenceDate}`)
    .maybeSingle();
  if (error) throw error;
  return data;
}
