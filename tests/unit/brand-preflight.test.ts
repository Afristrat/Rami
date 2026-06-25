import {
  preflightComposed,
  preflightAiImage,
  preflightLabel,
} from "@/lib/services/brand-dna/preflight"

describe("preflightComposed", () => {
  test("tout appliqué → 100 / grade A", () => {
    const r = preflightComposed({
      brandColorApplied: true,
      contrastSafe: true,
      brandMarkPresent: true,
      brandShapeApplied: true,
    })
    expect(r.score).toBe(100)
    expect(r.grade).toBe("A")
  })

  test("couleur de marque absente pèse lourd (−35)", () => {
    const r = preflightComposed({
      brandColorApplied: false,
      contrastSafe: true,
      brandMarkPresent: true,
      brandShapeApplied: true,
    })
    expect(r.score).toBe(65)
    expect(r.grade).toBe("C")
  })

  test("rien appliqué → 0 / grade D", () => {
    const r = preflightComposed({
      brandColorApplied: false,
      contrastSafe: false,
      brandMarkPresent: false,
      brandShapeApplied: false,
    })
    expect(r.score).toBe(0)
    expect(r.grade).toBe("D")
  })

  test("les poids somment à 100 (couverture des 4 dimensions)", () => {
    const r = preflightComposed({
      brandColorApplied: true,
      contrastSafe: true,
      brandMarkPresent: true,
      brandShapeApplied: true,
    })
    expect(r.checks.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1, 6)
    expect(r.checks).toHaveLength(4)
  })
})

describe("preflightAiImage", () => {
  test("bonne correspondance couleur + contraintes prompt → A", () => {
    const r = preflightAiImage({
      visionColorMatch: 0.92,
      brandPaletteInPrompt: true,
      brandShapeInPrompt: true,
    })
    expect(r.score).toBe(100)
    expect(r.grade).toBe("A")
  })

  test("couleur dominante hors palette (vision faible) → score chute", () => {
    const r = preflightAiImage({
      visionColorMatch: 0.4,
      brandPaletteInPrompt: true,
      brandShapeInPrompt: true,
    })
    // vision (0.6) échoue, palette (0.25) + shape (0.15) passent → 40
    expect(r.score).toBe(40)
    expect(r.grade).toBe("D")
  })

  test("vision indisponible (null) → mesure neutralisée, score sur contraintes", () => {
    const r = preflightAiImage({
      visionColorMatch: null,
      brandPaletteInPrompt: true,
      brandShapeInPrompt: true,
    })
    expect(r.score).toBe(100) // 0.25 + 0.15 = 0.40 sur 0.40 → 100%
    expect(r.grade).toBe("A")
  })

  test("vision null + palette absente → score partiel", () => {
    const r = preflightAiImage({
      visionColorMatch: null,
      brandPaletteInPrompt: false,
      brandShapeInPrompt: true,
    })
    // shape 0.15 sur 0.40 ≈ 37 (la palette manquante fait chuter le score)
    expect(r.score).toBe(37)
    expect(r.grade).toBe("D")
  })
})

describe("preflightLabel", () => {
  test("chaque grade a un libellé FR", () => {
    expect(preflightLabel("A")).toMatch(/respectée/)
    expect(preflightLabel("B")).toMatch(/cohérence/i)
    expect(preflightLabel("C")).toMatch(/partielle/)
    expect(preflightLabel("D")).toMatch(/faible/)
  })
})
