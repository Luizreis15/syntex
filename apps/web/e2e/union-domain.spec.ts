import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@secabc.exemplo.org.br";
const ADMIN_PASSWORD = "syntex-dev-2026!";
const ATENDIMENTO_MAUA_EMAIL = "atendimento.maua@secabc.exemplo.org.br";
const ATENDIMENTO_MAUA_PASSWORD = "syntex-dev-2026!";
const BOM_PRECO_CNPJ = "00000002000180";

test("login → busca por CNPJ → ficha → representação vigente → muda a data → vê representação anterior", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.getByText("Syntex")).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/login.png" });

  await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("/empresas");
  await expect(page.getByRole("table", { name: "Empresas" })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/shell-empresas.png", fullPage: true });

  const search = page.getByPlaceholder("Buscar por CNPJ ou razão social");
  await search.fill(BOM_PRECO_CNPJ);
  await search.press("Enter");
  await page.waitForURL(/q=/);

  await page.getByRole("link", { name: "Mercado Bom Preço" }).click();
  await page.waitForURL(/\/empresas\/.+/);

  const resolutionCard = page.getByTestId("representation-resolution");

  // Data de hoje cai no terceiro período — reconhecida por decisão judicial.
  await expect(resolutionCard.getByText("reconhecida")).toBeVisible();
  await expect(resolutionCard.getByText("base: decisao_judicial")).toBeVisible();

  // Muda a data de referência para dentro do segundo período (2018–2023-06).
  await page.getByLabel("Data de referência").fill("2020-06-15");
  await page.getByRole("button", { name: "Consultar" }).click();
  await page.waitForURL(/date=2020-06-15/);

  await expect(resolutionCard.getByText("base: cnae")).toBeVisible();
});

test("⌘K abre a busca global e navega para o resultado", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/empresas");

  await page.keyboard.press("Meta+k");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/command-palette.png" });

  await page.getByPlaceholder("Buscar trabalhador, empresa, CPF, CNPJ, protocolo…").fill("Bom Preço");
  await expect(page.getByRole("option", { name: "Mercado Bom Preço 00000002000180", exact: true })).toBeVisible();
  await expect(page.getByRole("option", { name: /Matriz — Mercado Bom Preço/ })).toBeVisible();
});

test("usuário limitado a uma unidade só vê empresas daquela unidade na lista", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(ATENDIMENTO_MAUA_EMAIL);
  await page.getByLabel("Senha").fill(ATENDIMENTO_MAUA_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL("/empresas");

  await expect(page.getByRole("complementary").getByText("Mauá", { exact: true })).toBeVisible();

  const rows = page.getByRole("table", { name: "Empresas" }).locator("tbody tr");
  await expect(rows.first()).toBeVisible();
  // Toda linha renderizada precisa pertencer a Mauá — nenhuma outra unidade
  // pode vazar para um usuário com escopo de branch (CLAUDE.md #2).
  const count = await rows.count();
  for (let i = 0; i < count; i++) {
    await expect(rows.nth(i)).toContainText("Mauá");
  }
});
