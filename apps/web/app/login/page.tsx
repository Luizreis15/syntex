import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-background p-6 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold">Syntex</h1>
          <p className="text-sm text-muted-foreground">Entre com sua conta do sindicato</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
