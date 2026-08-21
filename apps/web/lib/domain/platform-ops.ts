import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@syntex/database";

type Client = SupabaseClient<Database>;
type ChargeRow = Database["public"]["Tables"]["charge"]["Row"];

/**
 * Cancela cobrança pendente/vencida. Preferência: RPC cancel_charge (migration 0023).
 * Fallback em TypeScript se a função ainda não estiver no banco.
 */
export async function cancelCharge(
  supabase: Client,
  input: {
    tenantId: string;
    chargeId: string;
    reason: string;
    platformAdminId?: string | null;
  },
): Promise<ChargeRow> {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new Error("motivo de cancelamento obrigatório (mín. 3 caracteres)");

  const { data, error } = await supabase.rpc("cancel_charge", {
    p_tenant_id: input.tenantId,
    p_charge_id: input.chargeId,
    p_reason: reason,
    p_platform_admin_id: input.platformAdminId ?? undefined,
  });

  if (!error && data) return data as ChargeRow;

  // Fallback app-layer (mesmo efeito) se RPC ausente
  if (error && !/cancel_charge|function|schema cache/i.test(error.message)) {
    throw error;
  }

  const { data: current, error: readError } = await supabase
    .from("charge")
    .select("*")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.chargeId)
    .single();
  if (readError || !current) throw readError ?? new Error("charge não encontrada");
  if (current.status === "cancelado") throw new Error("charge já cancelada");
  if (current.status === "pago") throw new Error("charge paga não pode ser cancelada");
  if (current.status !== "pendente" && current.status !== "vencido") {
    throw new Error(`charge ${input.chargeId} não pode ser cancelada no status ${current.status}`);
  }

  const { data: updated, error: upError } = await supabase
    .from("charge")
    .update({
      status: "cancelado",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
      cancelled_by_platform_admin_id: input.platformAdminId ?? null,
    })
    .eq("tenant_id", input.tenantId)
    .eq("id", input.chargeId)
    .select()
    .single();
  if (upError) throw upError;

  await supabase
    .from("obligation")
    .update({ status: "cancelada" })
    .eq("tenant_id", input.tenantId)
    .eq("id", current.obligation_id)
    .in("status", ["aberta", "cobrada"]);

  await supabase.from("outbox_event").insert({
    tenant_id: input.tenantId,
    aggregate_type: "charge",
    aggregate_id: input.chargeId,
    event_type: "charge.cancelled",
    payload: {
      charge_id: input.chargeId,
      obligation_id: current.obligation_id,
      reason,
      by_platform_admin: input.platformAdminId ?? null,
    },
  });

  return updated;
}

export async function createPlatformNotification(
  supabase: Client,
  input: {
    title: string;
    body: string;
    severity?: "info" | "warning" | "critical";
    tenantId?: string | null;
    chargeId?: string | null;
    createdByPlatformAdminId?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("platform_notification")
    .insert({
      title: input.title,
      body: input.body,
      severity: input.severity ?? "info",
      tenant_id: input.tenantId ?? null,
      charge_id: input.chargeId ?? null,
      created_by_platform_admin_id: input.createdByPlatformAdminId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
