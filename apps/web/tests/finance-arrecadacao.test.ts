import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createTestTenant, deleteTestTenant, unique } from "./helpers";
import { generateObligationWithCharge } from "@/lib/domain/generate-obligation";
import { computeObligationAmount, competenceToDate } from "@/lib/domain/obligation";

describe("arrecadação — obrigação, snapshot, cobrança e baixa", () => {
  let tenant: { id: string };
  let companyId: string;
  let ruleId: string;
  let agreementId: string;

  beforeAll(async () => {
    tenant = await createTestTenant("finance");

    const { data: company, error: companyError } = await admin
      .from("company")
      .insert({ tenant_id: tenant.id, cnpj: unique("00"), legal_name: "Empresa Cobrança" })
      .select()
      .single();
    if (companyError) throw companyError;
    companyId = company.id;

    const { data: economic, error: ecoError } = await admin
      .from("economic_category")
      .insert({ tenant_id: tenant.id, name: unique("Eco") })
      .select()
      .single();
    if (ecoError) throw ecoError;

    const { data: professional, error: proError } = await admin
      .from("professional_category")
      .insert({ tenant_id: tenant.id, name: unique("Pro") })
      .select()
      .single();
    if (proError) throw proError;

    const { data: agreement, error: agreementError } = await admin
      .from("collective_agreement")
      .insert({
        tenant_id: tenant.id,
        kind: "cct",
        mediador_number: "MR-TEST-2026",
        valid_from: "2026-01-01",
        valid_until: "2026-12-31",
        base_date: "2026-01-01",
        economic_category_id: economic.id,
        professional_category_id: professional.id,
      })
      .select()
      .single();
    if (agreementError) throw agreementError;
    agreementId = agreement.id;

    const { data: rule, error: ruleError } = await admin
      .from("contribution_rule")
      .insert({
        tenant_id: tenant.id,
        collective_agreement_id: agreementId,
        type: "mensalidade",
        valid_from: "2026-01-01",
        valid_until: null,
        calculation_base: "folha",
        value_type: "percentual",
        value: 1.5,
      })
      .select()
      .single();
    if (ruleError) throw ruleError;
    ruleId = rule.id;
  });

  afterAll(async () => {
    await deleteTestTenant(tenant.id);
  });

  it("calcula valor percentual e normaliza competência", () => {
    expect(competenceToDate("2026-08")).toBe("2026-08-01");
    expect(computeObligationAmount({ value_type: "percentual", value: 1.5 }, 10_000)).toBe(150);
    expect(computeObligationAmount({ value_type: "valor_fixo", value: 89.9 })).toBe(89.9);
  });

  it("gera obrigação com snapshot imutável + charge + outbox", async () => {
    const result = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-08",
      calculationBaseAmount: 10_000,
    });

    expect(result.created).toBe(true);
    expect(Number(result.obligation.amount)).toBe(150);
    expect(result.obligation.competence).toBe("2026-08-01");
    expect(result.charge.status).toBe("pendente");

    const snapshot = result.obligation.rule_snapshot as {
      rule: { value: number; type: string };
      competence: string;
      calculation_base_amount: number;
    };
    expect(snapshot.rule.value).toBe(1.5);
    expect(snapshot.rule.type).toBe("mensalidade");
    expect(snapshot.competence).toBe("2026-08");
    expect(snapshot.calculation_base_amount).toBe(10_000);

    const { error: mutateError } = await admin
      .from("obligation")
      .update({ amount: 1 })
      .eq("id", result.obligation.id);
    expect(mutateError).not.toBeNull();

    const { data: events } = await admin
      .from("outbox_event")
      .select("event_type")
      .eq("tenant_id", tenant.id)
      .in("aggregate_id", [result.obligation.id, result.charge.id]);
    const types = (events ?? []).map((e) => e.event_type).sort();
    expect(types).toEqual(["charge.created", "obligation.created"]);
  });

  it("segunda geração na mesma competência é idempotente", async () => {
    const first = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-09",
      calculationBaseAmount: 8_000,
    });
    const second = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-09",
      calculationBaseAmount: 99_999,
    });
    expect(second.created).toBe(false);
    expect(second.obligation.id).toBe(first.obligation.id);
    expect(Number(second.obligation.amount)).toBe(120);
  });

  it("baixa manual atualiza charge, ledger balanceado e outbox settled", async () => {
    const { charge } = await generateObligationWithCharge(admin, {
      tenantId: tenant.id,
      companyId,
      contributionRuleId: ruleId,
      competence: "2026-10",
      calculationBaseAmount: 2_000,
    });

    const { data: settled, error } = await admin.rpc("settle_charge_manual", {
      p_tenant_id: tenant.id,
      p_charge_id: charge.id,
    });
    if (error) throw error;
    expect(settled.status).toBe("pago");
    expect(settled.payment_method).toBe("manual");

    const { data: entry } = await admin
      .from("journal_entry")
      .select("id, journal_line(debit, credit, account)")
      .eq("tenant_id", tenant.id)
      .eq("charge_id", charge.id)
      .single();
    expect(entry).not.toBeNull();
    const lines = entry!.journal_line as { debit: number; credit: number; account: string }[];
    const debit = lines.reduce((s, l) => s + Number(l.debit), 0);
    const credit = lines.reduce((s, l) => s + Number(l.credit), 0);
    expect(debit).toBe(credit);
    expect(debit).toBe(30);

    const { data: settledEvent } = await admin
      .from("outbox_event")
      .select("event_type")
      .eq("tenant_id", tenant.id)
      .eq("aggregate_id", charge.id)
      .eq("event_type", "charge.settled")
      .maybeSingle();
    expect(settledEvent).not.toBeNull();

    const { data: obligation } = await admin
      .from("obligation")
      .select("status")
      .eq("id", charge.obligation_id)
      .single();
    expect(obligation?.status).toBe("cobrada");
  });
});
