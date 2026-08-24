import { SyntexStatus, type DomainState } from "@/components/ui/syntex-status";
import { formatData, formatDataHora } from "@/lib/formatters/data";
import { representationBasisLabel } from "@/features/representations/basis-label";
import type { WorkspaceClaim } from "@/features/representations/workspace-data";

export function RepresentationClaimCard({ claim }: { claim: WorkspaceClaim }) {
  return (
    <article className="rounded-control border border-border/50 bg-paper px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SyntexStatus kind="domain" state={claim.status as DomainState} />
        <span className="font-mono text-label text-ink-3">
          {formatData(claim.validFrom)} → {claim.validUntil ? formatData(claim.validUntil) : "aberta"}
        </span>
      </div>

      <dl className="mt-3 grid gap-2 text-dense sm:grid-cols-2">
        <div>
          <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">Base</dt>
          <dd className="font-medium text-ink">{representationBasisLabel(claim.basis)}</dd>
        </div>
        <div>
          <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">Registro</dt>
          <dd className="font-mono text-ink">
            {claim.registration?.registryNumber ?? "—"}
          </dd>
        </div>
        {claim.registration?.registeredAt ? (
          <div>
            <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">
              Registrado em
            </dt>
            <dd className="font-mono text-ink">{formatData(claim.registration.registeredAt)}</dd>
          </div>
        ) : null}
        {claim.registration?.economicCategoryName || claim.registration?.professionalCategoryName ? (
          <div className="sm:col-span-2">
            <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">
              Categorias
            </dt>
            <dd className="text-ink">
              {[claim.registration.economicCategoryName, claim.registration.professionalCategoryName]
                .filter(Boolean)
                .join(" · ") || "—"}
            </dd>
          </div>
        ) : null}
        {claim.registration && claim.registration.territoryMunicipalityNames.length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">
              Território
            </dt>
            <dd className="text-ink">{claim.registration.territoryMunicipalityNames.join(", ")}</dd>
          </div>
        ) : null}
        {claim.registration?.documentReference ? (
          <div className="sm:col-span-2">
            <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">
              Referência documental
            </dt>
            <dd className="font-mono text-ink-2">{claim.registration.documentReference}</dd>
          </div>
        ) : null}
        {claim.decidedAt ? (
          <div className="sm:col-span-2">
            <dt className="text-label font-semibold uppercase tracking-wide text-ink-3">Decisão</dt>
            <dd className="text-ink-2">
              {formatDataHora(claim.decidedAt)}
              {claim.decidedByName ? ` · ${claim.decidedByName}` : ""}
            </dd>
          </div>
        ) : null}
      </dl>

      <details className="mt-3 border-t border-border/40 pt-3">
        <summary className="cursor-pointer text-label font-semibold uppercase tracking-wide text-ink-3">
          Evidência
        </summary>
        <p className="mt-2 whitespace-pre-wrap text-dense leading-relaxed text-ink-2">{claim.evidence}</p>
      </details>
    </article>
  );
}
