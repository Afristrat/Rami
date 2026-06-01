import {
  nearestCausseColor,
  getCulturalLevel,
  scoreCulturalCoherence,
  scoreCulturalCoherenceFromHex,
} from "@/lib/services/brand-dna/cultural-scorer"
import { CAUSSE_COLORS } from "@/lib/schemas/brand-dna.schema"

// ─── nearestCausseColor ──────────────────────────────────────────────────────

describe("nearestCausseColor", () => {
  test("HEX exact d'une couleur Causse → son identifiant", () => {
    expect(nearestCausseColor("#DC2626")).toBe("rouge_passion")
    expect(nearestCausseColor("#1E3A5F")).toBe("bleu_marine")
    expect(nearestCausseColor("#059669")).toBe("vert_emeraude")
  })

  test("accepte les HEX sans #", () => {
    expect(nearestCausseColor("DC2626")).toBe("rouge_passion")
  })

  test("HEX très proche → couleur la plus proche", () => {
    // #DD2525 quasi identique à #DC2626 (rouge_passion)
    expect(nearestCausseColor("#DD2525")).toBe("rouge_passion")
  })

  test("HEX invalide → null", () => {
    expect(nearestCausseColor("pas-un-hex")).toBeNull()
    expect(nearestCausseColor("#FFF")).toBeNull()
    expect(nearestCausseColor("")).toBeNull()
  })

  test("chaque couleur Causse se retrouve elle-même", () => {
    for (const c of CAUSSE_COLORS) {
      expect(nearestCausseColor(c.hex)).toBe(c.id)
    }
  })
})

// ─── getCulturalLevel ────────────────────────────────────────────────────────

describe("getCulturalLevel", () => {
  test("bornes des niveaux", () => {
    expect(getCulturalLevel(100)).toBe("excellent")
    expect(getCulturalLevel(85)).toBe("excellent")
    expect(getCulturalLevel(84)).toBe("good")
    expect(getCulturalLevel(65)).toBe("good")
    expect(getCulturalLevel(64)).toBe("warning")
    expect(getCulturalLevel(45)).toBe("warning")
    expect(getCulturalLevel(44)).toBe("poor")
    expect(getCulturalLevel(0)).toBe("poor")
  })
})

// ─── scoreCulturalCoherence ──────────────────────────────────────────────────

describe("scoreCulturalCoherence", () => {
  test("couleur recommandée → bonus + verdict recommended", () => {
    const r = scoreCulturalCoherence({ sector: "finance_islamique", colorIds: ["vert_emeraude"] })
    expect(r.hasRules).toBe(true)
    expect(r.score).toBe(80)
    expect(r.level).toBe("good")
    expect(r.justifications).toEqual([{ colorId: "vert_emeraude", verdict: "recommended" }])
  })

  test("couleur à éviter → pénalité + raison + alternative (finance_islamique)", () => {
    const r = scoreCulturalCoherence({ sector: "finance_islamique", colorIds: ["rouge_passion"] })
    expect(r.score).toBe(50)
    expect(r.level).toBe("warning")
    expect(r.justifications[0]).toEqual({
      colorId: "rouge_passion",
      verdict: "avoid",
      reasonKey: "finance_islamique",
      alternativeColorId: "bordeaux_premium",
    })
  })

  test("sante_medical évite rouge_passion avec raison + alternative bordeaux", () => {
    const r = scoreCulturalCoherence({ sector: "sante_medical", colorIds: ["rouge_passion"] })
    expect(r.justifications[0].reasonKey).toBe("sante_medical")
    expect(r.justifications[0].alternativeColorId).toBe("bordeaux_premium")
  })

  test("pharmacie_parapharmacie : avoid rouge_passion porte désormais une raison (FIX dette)", () => {
    const r = scoreCulturalCoherence({ sector: "pharmacie_parapharmacie", colorIds: ["rouge_passion"] })
    expect(r.justifications[0].verdict).toBe("avoid")
    expect(r.justifications[0].reasonKey).toBe("sante_medical")
    expect(r.justifications[0].alternativeColorId).toBe("bordeaux_premium")
  })

  test("secteur sans règle Causse → hasRules false, score neutre, tout neutre", () => {
    const r = scoreCulturalCoherence({ sector: "tech", colorIds: ["bleu_marine", "rouge_passion"] })
    expect(r.hasRules).toBe(false)
    expect(r.score).toBe(70)
    expect(r.level).toBe("good")
    expect(r.justifications.every((j) => j.verdict === "neutral")).toBe(true)
  })

  test("palette idéale (3 recommandées) → 100 excellent", () => {
    const r = scoreCulturalCoherence({
      sector: "finance_banque",
      colorIds: ["bleu_marine", "bleu_roi", "or_prestige"],
    })
    expect(r.score).toBe(100)
    expect(r.level).toBe("excellent")
  })

  test("score plafonné à 100 (4 recommandées)", () => {
    const r = scoreCulturalCoherence({
      sector: "finance_banque",
      colorIds: ["bleu_marine", "bleu_roi", "or_prestige", "noir_elegance"],
    })
    expect(r.score).toBe(100)
  })

  test("score planché à 0 (3 à éviter)", () => {
    const r = scoreCulturalCoherence({
      sector: "finance_banque",
      colorIds: ["orange_chaleureux", "rose_empathique", "jaune_optimiste"],
    })
    expect(r.score).toBe(10)
    expect(r.level).toBe("poor")
  })

  test("couleur mixte : recommandée + à éviter + neutre", () => {
    // bleu_marine (reco +10) + rouge_passion (avoid -20) + noir_elegance (neutre, ni reco ni avoid pour assurance)
    const r = scoreCulturalCoherence({
      sector: "assurance_mutuelles",
      colorIds: ["bleu_marine", "rouge_passion", "noir_elegance"],
    })
    // 70 + 10 - 20 = 60 → warning
    expect(r.score).toBe(60)
    expect(r.level).toBe("warning")
    expect(r.justifications.map((j) => j.verdict)).toEqual(["recommended", "avoid", "neutral"])
  })

  test("identifiants de couleur inconnus sont ignorés", () => {
    const r = scoreCulturalCoherence({
      sector: "finance_islamique",
      colorIds: ["vert_emeraude", "couleur_inexistante"],
    })
    expect(r.justifications).toHaveLength(1)
    expect(r.score).toBe(80)
  })

  test("palette vide → baseline neutre", () => {
    const r = scoreCulturalCoherence({ sector: "finance_islamique", colorIds: [] })
    expect(r.score).toBe(70)
    expect(r.justifications).toHaveLength(0)
  })
})

// ─── scoreCulturalCoherenceFromHex ───────────────────────────────────────────

describe("scoreCulturalCoherenceFromHex", () => {
  test("HEX rouge → famille rouge_passion → verdict avoid pour finance_islamique", () => {
    const r = scoreCulturalCoherenceFromHex({ sector: "finance_islamique", hexColors: ["#DC2626"] })
    expect(r.justifications[0].colorId).toBe("rouge_passion")
    expect(r.justifications[0].verdict).toBe("avoid")
    expect(r.score).toBe(50)
  })

  test("HEX invalides ignorés", () => {
    const r = scoreCulturalCoherenceFromHex({ sector: "finance_islamique", hexColors: ["zzz", "#059669"] })
    expect(r.justifications).toHaveLength(1)
    expect(r.justifications[0].colorId).toBe("vert_emeraude")
  })
})
