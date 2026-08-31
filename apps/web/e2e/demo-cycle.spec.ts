import { test, expect } from "@playwright/test";

/**
 * Smoke do ciclo demo SECABC (docs/SECABC-DEMO-17SET.md).
 * Requer DEV seedado + app em :3100 (playwright webServer).
 * Não roda no CI sem secrets Supabase — uso local / pré-reunião.
 */
const DIRETORIA_EMAIL = "diretoria@secabc.exemplo.org.br";
const DIRETORIA_PASSWORD = "syntex-dev-2026!";

async function loginDiretoria(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(DIRETORIA_EMAIL);
  await page.getByLabel("Senha").fill(DIRETORIA_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/(empresas|painel|inicio)/);
}

test.describe("demo cycle SECABC", () => {
  test("login → Empresas → Cobranças (shell Core)", async ({ page }) => {
    await loginDiretoria(page);

    await page.goto("/empresas");
    await expect(page.getByRole("complementary").getByRole("link", { name: "Empresas" })).toBeVisible();
    await expect(page.getByRole("complementary").getByRole("link", { name: "Cobranças" })).toBeVisible();
    await expect(page.getByRole("complementary").getByText("Engajamento")).toHaveCount(0);

    const search = page.getByPlaceholder(/CNPJ|razão social/i);
    await search.fill("Empresa Teste");
    await search.press("Enter");
    await page.waitForTimeout(800);

    const testeLink = page.getByRole("link", { name: /Empresa Teste/i }).first();
    if (await testeLink.count()) {
      await testeLink.click();
      await page.waitForURL(/\/empresas\/.+/);
      await expect(page.getByText(/Representação|Ativa|Pendente/i).first()).toBeVisible({ timeout: 15_000 });
    }

    await page.goto("/cobrancas");
    await expect(page.getByRole("heading", { name: /Cobrança/i })).toBeVisible();
    await page.goto("/cobrancas/resolver");
    await expect(page.getByText(/Apurar|plano|competência/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
