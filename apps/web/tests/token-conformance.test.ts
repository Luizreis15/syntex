import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOTS = ["components", "features", "app"].map((dir) => join(__dirname, "..", dir));

function listFiles(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out = out.concat(listFiles(full));
    } else if (/\.(tsx?|css)$/.test(entry) && !entry.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

const files = ROOTS.flatMap((root) => {
  try {
    return listFiles(root);
  } catch {
    return [];
  }
}).filter((f) => !f.endsWith("globals.css"));

// globals.css é a fonte dos tokens — hex ali é esperado. Todo outro arquivo
// só pode referenciar cor via classe/var do token, nunca hex/rgb literal.
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;
const RGB_COLOR = /\brgba?\(/;
const ARBITRARY_Z = /\bz-\[\d+\]/;
const ARBITRARY_RADIUS = /\brounded(-[a-z]+)?-\[[^\]]+\]/;
const ARBITRARY_SPACING = /\b(?:p|m|gap|space)[trblxy]?-\[[0-9.]+(px|rem)\]/;
const ARBITRARY_SHADOW = /\bshadow-\[/;

describe("conformidade de tokens (design/SYNTEX-UI.md)", () => {
  it("existem arquivos de componente para varrer", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.length ? files : ["__none__"])("%s não usa cor, raio, sombra, z-index ou espaçamento literal", (file) => {
    if (file === "__none__") return;
    const content = readFileSync(file, "utf-8");
    const relative = file.replace(join(__dirname, "..") + "/", "");

    expect(content, `${relative}: cor hex literal fora de globals.css`).not.toMatch(HEX_COLOR);
    expect(content, `${relative}: rgb()/rgba() literal — use um token`).not.toMatch(RGB_COLOR);
    expect(content, `${relative}: z-index arbitrário — use z-base/sticky/dropdown/popover/drawer/modal/command/toast`).not.toMatch(
      ARBITRARY_Z,
    );
    expect(content, `${relative}: border-radius arbitrário — use rounded-xs/sm/md`).not.toMatch(ARBITRARY_RADIUS);
    expect(content, `${relative}: espaçamento arbitrário — use a escala 4/8/12/16/20/24/32/40/48`).not.toMatch(
      ARBITRARY_SPACING,
    );
    expect(content, `${relative}: shadow arbitrária — use shadow-sm/elevated`).not.toMatch(ARBITRARY_SHADOW);
  });
});
