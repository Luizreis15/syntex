import Link from "next/link";
import { LogoutButton } from "./logout-button";

export function TopNav() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <Link href="/empresas" className="text-sm font-semibold">
        Syntex
      </Link>
      <LogoutButton />
    </header>
  );
}
