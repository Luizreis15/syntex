import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-xs">
        <p className="font-serif text-page-title font-semibold text-ink">Syntex</p>
        <p className="mt-1 text-body text-ink-2">Infraestrutura de gestão sindical.</p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
