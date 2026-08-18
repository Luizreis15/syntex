import { z } from "zod";

const cnpjDigits = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 14, "CNPJ deve ter 14 dígitos");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "data deve estar em formato YYYY-MM-DD");

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
