import { STYLE_PRESETS, getStylePreset } from "@/lib/services/image-generation/style-presets"

describe("style-presets (Step 4 — injection réelle dans la génération)", () => {
  it("expose 12 presets avec des ids uniques", () => {
    expect(STYLE_PRESETS).toHaveLength(12)
    const ids = STYLE_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("chaque preset a un label et un fragment de prompt non vides", () => {
    for (const preset of STYLE_PRESETS) {
      expect(preset.label.trim().length).toBeGreaterThan(0)
      expect(preset.prompt.trim().length).toBeGreaterThan(10)
    }
  })

  it("getStylePreset résout un id connu", () => {
    const preset = getStylePreset("blueprint")
    expect(preset?.label).toBe("Blueprint")
    expect(preset?.prompt).toContain("blueprint")
  })

  it("getStylePreset renvoie null pour null/undefined/vide", () => {
    expect(getStylePreset(null)).toBeNull()
    expect(getStylePreset(undefined)).toBeNull()
    expect(getStylePreset("")).toBeNull()
  })

  it("getStylePreset ignore un id inconnu (forgé côté client)", () => {
    expect(getStylePreset("style-injecte'; DROP TABLE--")).toBeNull()
    expect(getStylePreset("unknown-style")).toBeNull()
  })

  it("aucun fragment ne contient de caractères de contrôle ou d'instructions LLM", () => {
    for (const preset of STYLE_PRESETS) {
      expect(preset.prompt).not.toMatch(/system:|ignore previous/i)
      expect(preset.prompt).not.toMatch(/[\r\n]/)
    }
  })
})
