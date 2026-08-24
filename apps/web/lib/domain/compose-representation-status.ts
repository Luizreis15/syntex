import type { RepresentationBasis, RepresentationStatus } from "@syntex/types";

/** Status de leitura: row real ou agregação (nunca persistido). */
export type RepresentationListStatus = RepresentationStatus | "sem_representacao";

export interface ActiveRepresentationClaim {
  status: RepresentationStatus;
  validFrom: string;
  validUntil: string | null;
  basis: RepresentationBasis;
  evidence: string;
  unionRegistrationId: string | null;
  decidedAt: string | null;
}

export interface ComposedRepresentationCurrent {
  status: RepresentationListStatus;
  validFrom: string | null;
  validUntil: string | null;
  basis: RepresentationBasis | null;
  evidence: string | null;
  unionRegistrationId: string | null;
  decidedAt: string | null;
  activeClaimsCount: number;
  hasConflict: boolean;
}

/** Vigência inclusiva — mesma regra de `resolveRepresentation`. */
export function isRepresentationActiveOnDate(
  validFrom: string,
  validUntil: string | null,
  referenceDate: string,
): boolean {
  return validFrom <= referenceDate && (validUntil === null || validUntil >= referenceDate);
}

/**
 * Compõe o status atual a partir das rows vigentes na referenceDate.
 * 0 → sem_representacao; 1 → status da row; 2+ → disputada (agregado).
 * Em conflito: basis/vigência/registration/evidence/decidedAt ficam null — nunca elege uma claim.
 */
export function composeCurrentRepresentation(
  activeClaims: ActiveRepresentationClaim[],
): ComposedRepresentationCurrent {
  if (activeClaims.length === 0) {
    return {
      status: "sem_representacao",
      validFrom: null,
      validUntil: null,
      basis: null,
      evidence: null,
      unionRegistrationId: null,
      decidedAt: null,
      activeClaimsCount: 0,
      hasConflict: false,
    };
  }

  if (activeClaims.length > 1) {
    return {
      status: "disputada",
      validFrom: null,
      validUntil: null,
      basis: null,
      evidence: null,
      unionRegistrationId: null,
      decidedAt: null,
      activeClaimsCount: activeClaims.length,
      hasConflict: true,
    };
  }

  const only = activeClaims[0]!;
  return {
    status: only.status,
    validFrom: only.validFrom,
    validUntil: only.validUntil,
    basis: only.basis,
    evidence: only.evidence,
    unionRegistrationId: only.unionRegistrationId,
    decidedAt: only.decidedAt,
    activeClaimsCount: 1,
    hasConflict: false,
  };
}
