/**
 * Geradores determinísticos para o seed DEV — sem Math.random(), sem Faker.
 * CPFs: estruturalmente válidos (módulo 11), gerados só para DEV.
 */

/** Mulberry32 — PRNG com seed numérico, reproduzível. */
export function createPrng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** CPF 11 dígitos com DV válido. Índice → raiz determinística. */
export function generateDemoCpf(index: number): string {
  // Evita sequências óbvias; raiz em [100_000_000, 999_999_998] sem repetição trivial.
  const root = 100_000_000 + ((index * 7919 + 104_729) % 899_999_999);
  const base = String(root).padStart(9, "0").slice(0, 9);
  const dv1 = cpfCheckDigit(base);
  const dv2 = cpfCheckDigit(base + String(dv1));
  return base + String(dv1) + String(dv2);
}

function cpfCheckDigit(base: string): number {
  const weightStart = base.length + 1;
  const sum = base.split("").reduce((acc, digit, i) => acc + Number(digit) * (weightStart - i), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isStructurallyValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const base = digits.slice(0, 9);
  const dv1 = cpfCheckDigit(base);
  const dv2 = cpfCheckDigit(base + String(dv1));
  return digits === base + String(dv1) + String(dv2);
}

/** Soma headcounts por empresa ≈ target (default 1240). */
export function buildActiveHeadcountByCompany(companyCount: number, target = 1240): number[] {
  if (companyCount <= 0) return [];
  const counts = Array.from({ length: companyCount }, (_, i) => {
    const tier = i % 10;
    if (tier < 2) return 95; // grandes
    if (tier < 5) return 38; // médias
    return 12; // pequenas
  });
  let sum = counts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (sum < target) {
    counts[i % companyCount]! += 1;
    sum += 1;
    i += 1;
  }
  while (sum > target) {
    const idx = i % companyCount;
    if (counts[idx]! > 5) {
      counts[idx]! -= 1;
      sum -= 1;
    }
    i += 1;
    if (i > companyCount * 200) break;
  }
  return counts;
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function parseReferenceDate(envValue: string | undefined, fallback: string): string {
  if (!envValue) return fallback;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(envValue)) {
    throw new Error(`SYNTEX_SEED_REFERENCE_DATE inválida: ${envValue}`);
  }
  return envValue;
}

export async function insertInChunks<T extends Record<string, unknown>>(
  insertFn: (chunk: T[]) => Promise<{ data: { id: string }[] | null; error: { message: string } | null }>,
  rows: T[],
  chunkSize = 250,
): Promise<{ id: string }[]> {
  const out: { id: string }[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { data, error } = await insertFn(chunk);
    if (error) throw new Error(error.message);
    out.push(...(data ?? []));
  }
  return out;
}
