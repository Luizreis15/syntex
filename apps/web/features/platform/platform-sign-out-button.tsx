"use client";

import { signOut } from "@/app/login/sign-out";

export function PlatformSignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="inline-flex h-input items-center rounded-sm border border-border px-3 text-body text-ink-2 hover:bg-surface-2"
      >
        Sair
      </button>
    </form>
  );
}
