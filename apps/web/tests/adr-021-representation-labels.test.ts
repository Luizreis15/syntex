import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  representationStatusLabel,
  representationStatusLabelPlural,
} from "@/lib/domain/representation-status-label";

describe("ADR-021 — labels operacionais de representação", () => {
  it("mapeia persistência → produto", () => {
    expect(representationStatusLabel("reconhecida")).toBe("Ativa");
    expect(representationStatusLabel("reivindicada")).toBe("Pendente");
    expect(representationStatusLabel("perdida")).toBe("Inativa");
    expect(representationStatusLabel("disputada")).toBe("Em disputa");
    expect(representationStatusLabelPlural("reconhecida")).toBe("Ativas");
    expect(representationStatusLabelPlural("reivindicada")).toBe("Pendentes");
  });

  it("UI principal usa Incluir/Ativar e chips Ativa/Pendente", () => {
    const feat = readdirSync(join(process.cwd(), "features")).find((n) => n.startsWith("rep"));
    expect(feat).toBeTruthy();
    const claim = readFileSync(
      join(process.cwd(), "features", feat!, "components/claim-representation-form.tsx"),
      "utf8",
    );
    expect(claim).toContain("Incluir na base");
    expect(claim).toContain("Incluir como pendente");
    expect(claim).not.toContain("Reivindicar representação");

    const activate = readFileSync(
      join(process.cwd(), "features", feat!, "components/recognize-representation-button.tsx"),
      "utf8",
    );
    expect(activate).toContain("Ativar");
    expect(activate).toContain("Confirmar ativação");
    expect(activate).not.toMatch(/^\s*Reconhecer\s*$/m);

    const status = readFileSync(join(process.cwd(), "components/ui/syntex-status.tsx"), "utf8");
    expect(status).toContain('label: "Ativa"');
    expect(status).toContain('label: "Pendente"');
    expect(status).toContain('label: "Inativa"');
  });
});
