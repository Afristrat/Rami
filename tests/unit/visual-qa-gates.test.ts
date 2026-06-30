import { evaluateVisualQA } from "@/lib/services/visuals/qa-gates"

describe("evaluateVisualQA", () => {
  it("échoue sur géométrie A4 + chrome navigateur (cas incident 2026-06-23)", () => {
    const r = evaluateVisualQA({
      type: "carousel",
      format: "1:1",
      manifest: { width: 794, height: 1123, fonts_embedded: false }, // A4 portrait
      sourceText: "file:///opt/data/exports/carrousel.html\n6/23/26, 1:07 PM\ncarrousel.html 1/10",
    })
    expect(r.passed).toBe(false)
    const failedIds = r.gates.filter((g) => !g.ok).map((g) => g.id)
    expect(failedIds).toEqual(expect.arrayContaining(["format", "no_browser_chrome", "fonts_embedded"]))
  })

  it("détecte file:// même avec la ligature typographique ﬁ", () => {
    const r = evaluateVisualQA({
      type: "carousel",
      format: "1:1",
      manifest: { width: 1080, height: 1080, fonts_embedded: true },
      sourceText: "ﬁle:///opt/data/x.html",
    })
    const chrome = r.gates.find((g) => g.id === "no_browser_chrome")!
    expect(chrome.ok).toBe(false)
  })

  it("passe sur un carrousel propre 4:5", () => {
    const r = evaluateVisualQA({
      type: "carousel",
      format: "4:5",
      manifest: { width: 1080, height: 1350, fonts_embedded: true },
      sourceText: "Négociation Augmentée\n5 piliers",
    })
    expect(r.passed).toBe(true)
  })

  it("gate marque neutre (warning) sans brandDna", () => {
    const r = evaluateVisualQA({
      type: "image",
      format: "1:1",
      manifest: { width: 1080, height: 1080, fonts_embedded: true },
    })
    const brand = r.gates.find((g) => g.id === "brand")!
    expect(brand.severity).toBe("warning")
    expect(r.passed).toBe(true)
  })

  it("résout la marque cible quand un brandDna est fourni (jamais hardcodé)", () => {
    const r = evaluateVisualQA({
      type: "image",
      format: "1:1",
      manifest: { width: 1080, height: 1080, fonts_embedded: true },
      brandDna: { color_palette: ["#1D4ED8"] },
      tenantName: "Acme",
    })
    const brand = r.gates.find((g) => g.id === "brand")!
    expect(brand.ok).toBe(true)
    expect(r.brandPreflightScore).toBeGreaterThan(0)
  })

  it("image sans polices embarquées → passe (gates PDF non appliqués)", () => {
    const r = evaluateVisualQA({
      type: "image",
      format: "1:1",
      manifest: { width: 1080, height: 1080, fonts_embedded: false },
    })
    expect(r.passed).toBe(true)
    const ids = r.gates.map((g) => g.id)
    // Les gates propres au PDF ne sont pas évalués pour une image
    expect(ids).not.toContain("fonts_embedded")
    expect(ids).not.toContain("no_browser_chrome")
    // Les gates universels restent présents
    expect(ids).toEqual(expect.arrayContaining(["format", "brand"]))
  })

  it("carrousel sans polices embarquées → échoue encore (gate PDF appliqué)", () => {
    const r = evaluateVisualQA({
      type: "carousel",
      format: "4:5",
      manifest: { width: 1080, height: 1350, fonts_embedded: false },
    })
    expect(r.passed).toBe(false)
    expect(r.gates.filter((g) => !g.ok).map((g) => g.id)).toContain("fonts_embedded")
  })
})
