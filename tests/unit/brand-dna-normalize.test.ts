import { normalizeBrandDNA, causseColorToHex } from "@/lib/services/brand-dna/normalize"

// ─── causseColorToHex ────────────────────────────────────────────────────────

describe("causseColorToHex", () => {
  test("ID Causse → HEX", () => {
    expect(causseColorToHex("vert_emeraude")).toBe("#059669")
    expect(causseColorToHex("bleu_marine")).toBe("#1E3A5F")
  })
  test("HEX direct → passthrough", () => {
    expect(causseColorToHex("#FF0000")).toBe("#FF0000")
  })
  test("inconnu / vide → null", () => {
    expect(causseColorToHex("inexistant")).toBeNull()
    expect(causseColorToHex(null)).toBeNull()
    expect(causseColorToHex(undefined)).toBeNull()
  })
})

// ─── normalizeBrandDNA — shape PLATE réelle ──────────────────────────────────

describe("normalizeBrandDNA (PLAT réel)", () => {
  const flat = {
    brandName: "Banque Al Baraka",
    sector: "finance_islamique",
    positioning: "Banque participative de référence",
    objectifCognitif: "confiance",
    primaryCulture: "maroc",
    voiceTone: "expert",
    colorPrimary: "vert_emeraude",
    colorSecondary: "bleu_marine",
    colorAccent: "or_prestige",
    activePlatforms: ["linkedin", "instagram"],
  }

  test("mappe secteur/objectif/culture/positionnement/nom", () => {
    const n = normalizeBrandDNA(flat)
    expect(n.identity?.sector).toBe("finance_islamique")
    expect(n.identity?.name).toBe("Banque Al Baraka")
    expect(n.identity?.positioning).toBe("Banque participative de référence")
    expect(n.cognitive_objective).toBe("confiance")
    expect(n.culture_markets?.primary_culture).toBe("maroc")
    expect(n.editorial_tone?.register).toBe("expert")
  })

  test("résout les IDs Causse → HEX dans la palette (ordre préservé)", () => {
    const n = normalizeBrandDNA(flat)
    expect(n.color_palette).toEqual([
      { hex: "#059669", name: "vert_emeraude" },
      { hex: "#1E3A5F", name: "bleu_marine" },
      { hex: "#B45309", name: "or_prestige" },
    ])
  })

  test("active_platforms mappé", () => {
    expect(normalizeBrandDNA(flat).active_platforms).toEqual(["linkedin", "instagram"])
  })

  test("objectifsCognitifs[0] en repli si objectifCognitif absent", () => {
    const n = normalizeBrandDNA({ ...flat, objectifCognitif: undefined, objectifsCognitifs: ["urgence", "joie"] })
    expect(n.cognitive_objective).toBe("urgence")
  })

  test("ID couleur inconnu filtré (jamais inventé)", () => {
    const n = normalizeBrandDNA({ colorPrimary: "vert_emeraude", colorSecondary: "inexistant", colorAccent: "bleu_roi" })
    expect(n.color_palette).toEqual([
      { hex: "#059669", name: "vert_emeraude" },
      { hex: "#1D4ED8", name: "bleu_roi" },
    ])
  })
})

// ─── normalizeBrandDNA — robustesse ──────────────────────────────────────────

describe("normalizeBrandDNA (robustesse)", () => {
  test("null / non-objet → {}", () => {
    expect(normalizeBrandDNA(null)).toEqual({})
    expect(normalizeBrandDNA("x")).toEqual({})
    expect(normalizeBrandDNA(undefined)).toEqual({})
  })

  test("shape déjà NESTÉE préservée", () => {
    const nested = {
      identity: { name: "X", sector: "tech", positioning: "p" },
      cognitive_objective: "expertise",
      culture_markets: { primary_culture: "international" },
      color_palette: [{ hex: "#123456", name: "custom" }],
    }
    const n = normalizeBrandDNA(nested)
    expect(n.identity?.sector).toBe("tech")
    expect(n.cognitive_objective).toBe("expertise")
    expect(n.color_palette).toEqual([{ hex: "#123456", name: "custom" }])
  })

  test("HEX custom dans colorPrimary → passthrough", () => {
    const n = normalizeBrandDNA({ colorPrimary: "#ABCDEF" })
    expect(n.color_palette).toEqual([{ hex: "#ABCDEF", name: "#ABCDEF" }])
  })

  test("aucune couleur → palette vide (fallback Causse en aval)", () => {
    expect(normalizeBrandDNA({ sector: "tech" }).color_palette).toEqual([])
  })
})
