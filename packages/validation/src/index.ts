import { z } from "zod";

const cnpjDigits = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 14, "CNPJ deve ter 14 dígitos");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve estar em formato YYYY-MM-DD");

function isValidCpfDigits(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (base: string) => {
    const start = base.length + 1;
    const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * (start - i), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 ? 0 : rem;
  };
  const base = digits.slice(0, 9);
  const dv1 = calc(base);
  const dv2 = calc(base + dv1);
  return digits === base + String(dv1) + String(dv2);
}

const cpfDigits = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine(isValidCpfDigits, "CPF inválido");

export const companyCreateSchema = z.object({
  cnpj: cnpjDigits,
  legalName: z.string().min(1),
  tradeName: z.string().min(1).optional(),
  primaryCnaeId: z.string().uuid().optional(),
  municipalityId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
});
export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;

export const establishmentCreateSchema = z.object({
  companyId: z.string().uuid(),
  cnpj: cnpjDigits,
  kind: z.enum(["matriz", "filial"]),
  cnaeId: z.string().uuid().optional(),
  municipalityId: z.string().uuid().optional(),
});
export type EstablishmentCreateInput = z.infer<typeof establishmentCreateSchema>;

export const representationCreateSchema = z.object({
  establishmentId: z.string().uuid(),
  unionRegistrationId: z.string().uuid().optional(),
  status: z.enum(["reivindicada", "reconhecida", "disputada", "perdida"]),
  validFrom: isoDate,
  validUntil: isoDate.optional(),
  basis: z.enum(["cnae", "cct_registrada", "decisao_judicial", "carta_sindical", "manual"]),
  evidence: z.string().min(1),
});
export type RepresentationCreateInput = z.infer<typeof representationCreateSchema>;

export const resolveRepresentationQuerySchema = z.object({
  establishmentId: z.string().uuid(),
  date: isoDate,
});

export const contributionRuleCreateSchema = z.object({
  collectiveAgreementId: z.string().uuid(),
  type: z.enum(["assistencial", "confederativa", "mensalidade", "negocial"]),
  validFrom: isoDate,
  validUntil: isoDate.optional().nullable(),
  calculationBase: z.string().min(1),
  valueType: z.enum(["percentual", "valor_fixo"]),
  value: z.number().nonnegative(),
});
export type ContributionRuleCreateInput = z.infer<typeof contributionRuleCreateSchema>;

/** Competência YYYY-MM → normalizada no servidor para o 1º dia do mês. */
export const generateObligationSchema = z.object({
  companyId: z.string().uuid(),
  contributionRuleId: z.string().uuid(),
  competence: z.string().regex(/^\d{4}-\d{2}$/, "competência deve ser YYYY-MM"),
  /** Obrigatório quando a regra é percentual — base de cálculo em R$. */
  calculationBaseAmount: z.number().nonnegative().optional(),
  dueDate: isoDate.optional(),
});
export type GenerateObligationInput = z.infer<typeof generateObligationSchema>;

export const createPaymentIntentSchema = z.object({
  billingType: z.enum(["pix", "boleto"]),
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const syncPaymentSchema = z.object({
  /** Só o stub aceita — força status sem rede (testes/DEV). */
  forceStatus: z.enum(["pending", "paid", "cancelled", "overdue"]).optional(),
});

export const MEMBERSHIP_STATUSES = [
  "prospect",
  "ativo",
  "suspenso",
  "inadimplente",
  "cancelado",
  "desfiliado",
  "falecido",
] as const;

export const workerCreateSchema = z.object({
  cpf: cpfDigits,
  fullName: z.string().min(1),
  socialName: z.string().min(1).optional(),
  birthDate: isoDate.optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
  municipalityId: z.string().uuid().optional(),
  /** Unidade sindical (branch do tenant) — escopo interno, não é sede da empresa. */
  branchId: z.string().uuid().optional(),
  registrationNumber: z.string().min(1).optional(),
  /** Filiação inicial opcional — domínio Atendimento; sensível LGPD. */
  membershipStatus: z.enum(MEMBERSHIP_STATUSES).optional(),
  membershipValidFrom: isoDate.optional(),
  /** Obrigatório: trabalhador existe na relação sindical via empresa do setor. */
  companyId: z.string().uuid(),
  establishmentId: z.string().uuid().optional(),
  employmentValidFrom: isoDate.optional(),
  jobTitle: z.string().min(1).optional(),
});
export type WorkerCreateInput = z.infer<typeof workerCreateSchema>;

export const employmentCreateSchema = z.object({
  workerId: z.string().uuid(),
  companyId: z.string().uuid(),
  establishmentId: z.string().uuid().optional(),
  validFrom: isoDate,
  validUntil: isoDate.optional().nullable(),
  jobTitle: z.string().min(1).optional(),
  status: z.enum(["ativo", "encerrado"]).default("ativo"),
  source: z.enum(["manual", "import", "empresa"]).default("manual"),
});
export type EmploymentCreateInput = z.infer<typeof employmentCreateSchema>;

export const membershipCreateSchema = z.object({
  personId: z.string().uuid(),
  status: z.enum(MEMBERSHIP_STATUSES),
  validFrom: isoDate,
  validUntil: isoDate.optional().nullable(),
  category: z.string().min(1).optional(),
  contributionForm: z.string().min(1).optional(),
});
export type MembershipCreateInput = z.infer<typeof membershipCreateSchema>;
