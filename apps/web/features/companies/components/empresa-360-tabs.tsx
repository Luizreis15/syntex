"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EMPRESA_360_TABS, type Empresa360Tab } from "@/features/companies/demo-empresa-360";

export function Empresa360Tabs({
  visaoGeral,
  representacao,
}: {
  visaoGeral: ReactNode;
  representacao: ReactNode;
}) {
  const [tab, setTab] = useState<Empresa360Tab>("Visão geral");

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-surface/90 px-6 backdrop-blur-md xl:px-8">
        <div className="flex gap-1 overflow-x-auto">
          {EMPRESA_360_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "relative shrink-0 px-3 py-3.5 text-[0.8rem] font-bold transition-colors",
                tab === t ? "text-ink" : "text-ink-3 hover:text-ink",
              )}
            >
              {t}
              {tab === t ? (
                <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-t bg-petrol-600" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-6 py-6 xl:px-8">
        {tab === "Visão geral" ? visaoGeral : null}
        {tab === "Representação" ? representacao : null}
        {tab !== "Visão geral" && tab !== "Representação" ? (
          <div className="surface-raised px-6 py-12 text-center">
            <p className="text-component font-semibold text-ink">{tab}</p>
            <p className="mt-2 text-body text-ink-2">
              Superfície DEMO — conteúdo desta aba entra na próxima fatia.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
