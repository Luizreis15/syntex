export { createSupabaseBrowserClient } from "./browser";
export { createSupabaseServerClient, type SupabaseServerClient } from "./server";
export { createSupabaseAdminClient } from "./admin";
export { recordAudit, type AuditEntry } from "./audit";
export { TABLE_DATA_CLASSIFICATION, classificationOf, type AuditableTable } from "./classification";
export type { Database, Tables, TablesInsert, TablesUpdate } from "./types-helpers";
