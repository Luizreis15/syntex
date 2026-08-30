/**
 * ADR-021 — nomenclatura operacional de representação (UI).
 * Persistência continua: reivindicada | reconhecida | disputada | perdida.
 */

export type RepresentationDbStatus =
  | "reconhecida"
  | "reivindicada"
  | "disputada"
  | "perdida"
  | "sem_representacao";

/** Rótulo curto para chip / tabela / filtro. */
export function representationStatusLabel(
  status: string | null | undefined,
): string {
  switch (status) {
    case "reconhecida":
      return "Ativa";
    case "reivindicada":
      return "Pendente";
    case "perdida":
      return "Inativa";
    case "disputada":
      return "Em disputa";
    case "sem_representacao":
      return "Sem representação";
    default:
      return status ?? "—";
  }
}

/** Forma plural para cards de lista (empresas / estabelecimentos). */
export function representationStatusLabelPlural(
  status: "reconhecida" | "reivindicada" | "disputada" | "perdida",
): string {
  switch (status) {
    case "reconhecida":
      return "Ativas";
    case "reivindicada":
      return "Pendentes";
    case "perdida":
      return "Inativas";
    case "disputada":
      return "Em disputa";
  }
}
