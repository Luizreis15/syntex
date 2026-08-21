import { redirect } from "next/navigation";

/** Rota legada — unificada em /empresas/nova. */
export default function NovaEmpresaComMasterRedirect() {
  redirect("/empresas/nova");
}
