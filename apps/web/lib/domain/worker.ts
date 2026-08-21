import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import type { WorkerCreateInput } from "@syntex/validation";

type Client = SupabaseClient<Database>;

export interface CreateWorkerResult {
  person: Database["public"]["Tables"]["person"]["Row"];
  worker: Database["public"]["Tables"]["worker"]["Row"];
  membership: Database["public"]["Tables"]["membership"]["Row"] | null;
  employment: Database["public"]["Tables"]["employment_relationship"]["Row"] | null;
}

/**
 * Cria person + worker na mesma operação. Opcionalmente filiação (sensível)
 * e primeiro vínculo empregatício.
 */
export async function createWorkerWithPerson(
  supabase: Client,
  tenantId: string,
  input: WorkerCreateInput,
): Promise<CreateWorkerResult> {
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
      branch_id: input.branchId ?? null,
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

  let employment: CreateWorkerResult["employment"] = null;
  if (input.companyId) {
    const { data, error } = await supabase
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
    if (error) throw error;
    employment = data;
  }

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
