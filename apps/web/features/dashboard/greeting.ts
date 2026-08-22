/** Saudação e rótulos de tempo do Command Hero — sem serviço externo de timezone. */

const TZ = "America/Sao_Paulo";

export function greetingForNow(now = new Date()): "Bom dia" | "Boa tarde" | "Boa noite" {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: TZ,
    }).format(now),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** Ex.: "SÁBADO, 22 AGO · 09:38" */
export function formatHeroClock(now = new Date()): string {
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: TZ,
  })
    .format(now)
    .toUpperCase();

  const day = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    timeZone: TZ,
  }).format(now);

  const month = new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: TZ,
  })
    .format(now)
    .replace(".", "")
    .toUpperCase();

  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(now);

  return `${weekday}, ${day} ${month} · ${time}`;
}

export function firstNameFromFullName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/).filter(Boolean)[0];
  return first || null;
}
