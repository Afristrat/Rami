import {
  TEXT_CORRECTION_PRESETS,
  resolveCorrectionPresets,
  buildCorrectionInstruction,
} from "@/lib/services/workflow/correction-presets"

describe("correction-presets (presets de correction de texte)", () => {
  it("chaque preset a un id, un label et un fragment non vides", () => {
    for (const p of TEXT_CORRECTION_PRESETS) {
      expect(p.id.length).toBeGreaterThan(0)
      expect(p.label.length).toBeGreaterThan(0)
      expect(p.promptFragment.length).toBeGreaterThan(0)
      expect(p.scope).toBe("text")
    }
  })

  it("resolveCorrectionPresets ignore les id inconnus et déduplique", () => {
    const r = resolveCorrectionPresets(["too_long", "inconnu", "too_long", "tone_pro"])
    expect(r.map((p) => p.id)).toEqual(["too_long", "tone_pro"])
  })

  it("buildCorrectionInstruction liste les fragments sélectionnés", () => {
    const instr = buildCorrectionInstruction(["too_long", "add_cta"])
    expect(instr).toContain("Corrections demandées")
    expect(instr).toContain("Raccourcis")
    expect(instr).toContain("appel à l'action")
  })

  it("buildCorrectionInstruction intègre le texte libre", () => {
    const instr = buildCorrectionInstruction(["too_long"], "Mentionne notre garantie 30 jours")
    expect(instr).toContain("garantie 30 jours")
  })

  it("buildCorrectionInstruction renvoie une chaîne vide si rien n'est demandé", () => {
    expect(buildCorrectionInstruction([], "")).toBe("")
    expect(buildCorrectionInstruction(["inconnu"], null)).toBe("")
  })
})
