import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditableTable } from "./classification";
import { classificationOf } from "./classification";
import type { Database, Json } from "./types";

export interface AuditEntry {
  tenantId: string;
  actorId: string | null;
  action: "read" | "create" | "update" | "delete";
  table: AuditableTable;
  resourceId?: string | null;
  metadata?: Record<string, Json>;
}

/**
 * Grava audit_log com a classificação do dado acessado (CLAUDE.md #5).
 * Chame em toda leitura/escrita de tabela com dado pessoal, sensível,
 * financeiro ou jurídico — não só em escrita.
 */
export async function recordAudit(client: SupabaseClient<Database>, entry: AuditEntry) {
  const { error } = await client.from("audit_log").insert({
    tenant_id: entry.tenantId,
    actor_id: entry.actorId,
    action: entry.action,
    resource_table: entry.table,
    resource_id: entry.resourceId ?? null,
    data_classification: classificationOf(entry.table),
    metadata: entry.metadata ?? {},
  });
  if (error) throw error;
}
