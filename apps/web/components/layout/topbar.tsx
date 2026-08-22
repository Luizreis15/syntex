"use client";

import { Suspense } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { SyntexCommand } from "@/components/ui/syntex-command";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import { SyntexCompetenceScope } from "@/components/ui/syntex-competence-scope";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signOut } from "@/app/login/sign-out";

export interface TopbarProps {
  userName: string;
  userEmail: string;
  roleLabel: string;
  branchLabel: string;
  hasNotifications?: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).toUpperCase();
}

/**
 * Topbar 64px, superfícies claras (Visual System v2). Competência e Unidade
 * são pills reais na topbar — a "Vigência em" v1 (banda full-width) saiu do
 * chrome permanente; ver SyntexCompetenceScope.
 */
export function Topbar({ userName, userEmail, roleLabel, branchLabel, hasNotifications }: TopbarProps) {
  return (
    <header className="sticky top-0 z-sticky flex h-topbar shrink-0 items-center gap-4 border-b border-border bg-surface/85 px-5 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <SyntexCommand />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Suspense fallback={null}>
          <SyntexCompetenceScope />
        </Suspense>

        <span className="hidden items-center gap-2 rounded-sm border border-border px-2.5 py-2 text-label font-bold text-ink md:inline-flex">
          <span className="text-label uppercase tracking-wide text-ink-3">Unidade</span>
          {branchLabel}
        </span>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Notificações"
              className="relative flex h-8 w-8 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-2"
            >
              <Bell size={17} />
              {hasNotifications && (
                <span className="live-dot absolute right-1.5 top-1.5 size-1.5 rounded-full bg-danger" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <SyntexEmptyState
              title="Sem notificações"
              description="Alertas operacionais (SLA, integrações, pendências) aparecerão aqui."
            />
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-sm py-1 pl-1 pr-2 text-ink hover:bg-surface-2"
            >
              <span className="flex size-7 items-center justify-center rounded-xs bg-petrol-800 text-label font-black text-shell-ink">
                {initials(userName || userEmail)}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-label font-extrabold text-ink">{userName || userEmail}</span>
                <span className="block text-label text-ink-3">{roleLabel}</span>
              </span>
              <ChevronDown size={14} className="text-ink-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>
              {userName}
              <br />
              <span className="normal-case text-ink-3">{userEmail}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                void signOut();
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
