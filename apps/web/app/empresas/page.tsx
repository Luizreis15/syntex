import Link from "next/link";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

function formatCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export default async function EmpresasPage({ searchParams }: { searchParams: { q?: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const q = searchParams.q?.trim();
  let query = session.supabase
    .from("company")
    .select("id, cnpj, legal_name, trade_name, status")
    .eq("tenant_id", session.tenantId)
    .order("legal_name")
    .limit(50);

  if (q) {
    const digits = q.replace(/\D/g, "");
    query = digits.length >= 3 ? query.ilike("cnpj", `%${digits}%`) : query.ilike("legal_name", `%${q}%`);
  }

  const { data: companies } = await query;

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-xl font-semibold">Empresas</h1>
        <form className="flex gap-2">
          <Input name="q" placeholder="Buscar por CNPJ ou razão social" defaultValue={q ?? ""} />
          <Button type="submit">Buscar</Button>
        </form>
        <div className="space-y-2">
          {(companies ?? []).map((company) => (
            <Link key={company.id} href={`/empresas/${company.id}`}>
              <Card className="transition-colors hover:bg-muted">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{company.trade_name ?? company.legal_name}</p>
                    <p className="text-sm text-muted-foreground">{formatCnpj(company.cnpj)}</p>
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">{company.status}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
          {companies?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
          )}
        </div>
      </main>
    </div>
  );
}
