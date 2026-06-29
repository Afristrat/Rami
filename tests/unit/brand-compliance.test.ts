import { readFileSync } from "node:fs"
import { join } from "node:path"

// ============================================================
// Garde de conformité « Brand DNA by design » (cf. design.md).
// Empêche la RÉGRESSION : tout moteur de création doit passer par le Brand DNA
// Resolver, et aucune couleur d'accent de marque ne doit redevenir hardcodée.
// Test ciblé (fichiers précis) → zéro faux positif sur les couleurs légitimes
// (fonds de thème, fallbacks internes au resolver).
// ============================================================

const root = process.cwd()
const read = (rel: string): string => readFileSync(join(root, rel), "utf8")

// Fichiers câblés qui DOIVENT résoudre l'identité via le resolver.
const WIRED_THROUGH_RESOLVER = [
  "src/lib/actions/post-visual.actions.ts",
  "src/lib/services/visuals/carousel-core.ts",
  "src/lib/actions/presentation.actions.ts",
  "src/lib/services/documents/pdf/branding.ts",
  // US-052 — API publique v1 : le service de génération résout l'identité.
  "src/lib/services/visuals/generate.ts",
]

describe("Brand DNA compliance-by-design", () => {
  test.each(WIRED_THROUGH_RESOLVER)("%s passe par resolveBrandIdentity", (file) => {
    expect(read(file)).toMatch(/resolveBrandIdentity/)
  })

  test("présentations : plus de couleur d'accent #7C3BED hardcodée", () => {
    expect(read("src/lib/actions/presentation.actions.ts")).not.toMatch(/#7C3BED/i)
  })

  test("carrousel : l'accent par défaut = couleur de marque (identity.accent), pas une constante", () => {
    const src = read("src/lib/services/visuals/carousel-core.ts")
    expect(src).toMatch(/identity\.accent/)
    // L'ancien défaut orange hors-marque ne doit plus servir de valeur par défaut.
    expect(src).not.toMatch(/\?\?\s*["']#F59E0B["']/)
  })

  test("API v1 : le service generateVisual n'a aucun accent de marque hardcodé", () => {
    const src = read("src/lib/services/visuals/generate.ts")
    expect(src).not.toMatch(/#7C3BED|#F59E0B/i)
  })

  test("post-visuel : score de marque CALCULÉ (preflight), pas la constante magique 1", () => {
    const src = read("src/lib/actions/post-visual.actions.ts")
    expect(src).toMatch(/preflightComposed/)
    expect(src).not.toMatch(/brandDnaScore:\s*1\b/)
  })

  test("le compilateur d'images dérive la forme du resolver (mapping unique)", () => {
    expect(read("src/lib/services/brand-dna/prompt-compiler.ts")).toMatch(/sectorToShapeKey/)
  })

  test("PPTX : la marque (logo/monogramme) est incrustée sur les slides", () => {
    expect(read("src/lib/services/documents/pptx/deck-pptx.ts")).toMatch(/brandMark/)
  })
})
