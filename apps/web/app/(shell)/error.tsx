"use client";

import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";

/**
 * Estado de erro obrigatório (design/SYNTEX-UI.md §11) — cada domínio
 * importante tem seu próprio boundary; erro de uma tela não derruba o shell
 * inteiro (sidebar/topbar continuam de pé, só o conteúdo troca).
 */
export default function ShellError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-6">
      <SyntexEmptyState
        title="Não conseguimos carregar esta tela"
        description={error.message || "Algo deu errado. Tente novamente."}
        action={
          <button
            type="button"
            onClick={reset}
            className="h-input rounded-sm border border-border-strong px-3 text-body text-ink"
          >
            Tentar de novo
          </button>
        }
      />
    </div>
  );
}
