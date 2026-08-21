import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";
import { createStaffInvite } from "@/lib/domain/staff-invite";

type Client = SupabaseClient<Database>;

/**
 * Emite acesso ao portal associado para a person do trabalhador.
 * Requer e-mail na person (destino do convite).
 */
export async function issueAssociateAccess(
  supabase: Client,
  input: {
    tenantId: string;
    personId: string;
    invitedBy: string;
  },
): Promise<{ inviteToken: string; inviteId: string; email: string }> {
  const { data: person, error } = await supabase
    .from("person")
    .select("id, email, app_user_id, full_name")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.personId)
    .single();
  if (error || !person) throw error ?? new Error("pessoa não encontrada");
  if (person.app_user_id) throw new Error("pessoa já tem acesso ao portal");
  if (!person.email) throw new Error("cadastre um e-mail na pessoa antes de emitir acesso");

  await supabase
    .from("role")
    .upsert({ tenant_id: input.tenantId, name: "associate" }, { onConflict: "tenant_id,name" });

  const { invite, token } = await createStaffInvite(supabase, {
    tenantId: input.tenantId,
    email: person.email,
    roleName: "associate",
    scope: "own",
    personId: person.id,
    invitedBy: input.invitedBy,
  });

  await supabase.from("outbox_event").insert({
    tenant_id: input.tenantId,
    aggregate_type: "person",
    aggregate_id: person.id,
    event_type: "associate.access_issued",
    payload: { invite_id: invite.id, email: person.email },
  });

  return { inviteToken: token, inviteId: invite.id, email: person.email };
}

export async function resolveAssociateContext(
  supabase: Client,
  tenantId: string,
  appUserId: string,
): Promise<{
  person: Database["public"]["Tables"]["person"]["Row"];
  worker: Database["public"]["Tables"]["worker"]["Row"] | null;
}> {
  const { data: person, error } = await supabase
    .from("person")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("app_user_id", appUserId)
    .maybeSingle();
  if (error) throw error;
  if (!person) throw new Error("associado sem person vinculada");

  const { data: worker } = await supabase
    .from("worker")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("person_id", person.id)
    .maybeSingle();

  return { person, worker };
}
