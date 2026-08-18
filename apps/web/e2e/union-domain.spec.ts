import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@secabc.exemplo.org.br";
const ADMIN_PASSWORD = "syntex-dev-2026!";

test("login → busca por CNPJ → ficha → representação vigente → muda a data → vê representação anterior", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Senha").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("/empresas");

  await page.getByPlaceholder("Buscar por CNPJ ou razão social").fill("22333444000195");
  await page.getByRole("button", { name: "Buscar" }).click();

  await page.getByText("Mercado Bom Preço").click();
  await page.waitForURL(/\/empresas\/.+/);

  const resolutionCard = page.getByTestId("representation-resolution");

  // Data de hoje (2026) cai no terceiro período — reconhecida por decisão judicial.
  await expect(resolutionCard.getByText("reconhecida")).toBeVisible();
  await expect(resolutionCard.getByText("base: decisao_judicial")).toBeVisible();

  // Muda a data de referência para dentro do segundo período (2019-2023).
  await page.getByLabel("Data de referência").fill("2020-06-15");
  await page.getByRole("button", { name: "Consultar" }).click();
  await page.waitForURL(/date=2020-06-15/);

  await expect(resolutionCard.getByText("base: cnae")).toBeVisible();
});
