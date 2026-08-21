"use client";

import { useRouter } from "next/navigation";
import { SyntexCommand } from "@/components/ui/syntex-command";
import { SyntexEmptyState } from "@/components/ui/syntex-empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IconBell, IconChevronDown, IconUser } from "@/components/ui/icons";
import { signOut } from "@/app/login/sign-out";

export interface TopbarProps {
  userName: string;
  userEmail: string;
}

/**
 * Topbar 58px (design/SYNTEX-UI.md §8). Sem rótulo de seção: o breadcrumb
 * e o <h1> do SyntexPageHeader já dizem onde o usuário está — repetir aqui
 * era a mesma palavra três vezes na tela (prompt 02.1 §6). "Criar" fica de
 * fora desta fatia — não há formulário de criação no escopo do prompt 02,
 * e um botão sem ação real é pior que a ausência dele.
 */
export function Topbar({ userName, userEmail }: TopbarProps) {
  const router = useRouter();

  return (
    <header className="flex h-topbar shrink-0 items-center justify-end gap-4 border-b border-border bg-surface px-4">
      <div className="flex-1">
        <SyntexCommand />
      </div>

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Notificações"
              className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-2 hover:bg-surface-2"
            >
              <IconBell size={18} />
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
              className="flex items-center gap-1.5 rounded-sm px-2 py-1 text-ink-2 hover:bg-surface-2"
            >
              <IconUser size={18} />
              <IconChevronDown size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>
              {userName}
              <br />
              <span className="normal-case text-ink-3">{userEmail}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
