import type { RepresentationBasis } from "@syntex/types";

const BASIS_LABEL: Record<RepresentationBasis, string> = {
  cnae: "CNAE",
  cct_registrada: "CCT registrada",
  decisao_judicial: "Decisão judicial",
  carta_sindical: "Carta sindical",
  manual: "Manual",
};

export function representationBasisLabel(basis: RepresentationBasis | null): string {
  if (!basis) return "—";
  return BASIS_LABEL[basis] ?? basis;
}
