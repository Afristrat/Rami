import { computeDnaScore } from "@/components/brand-dna/dna-score-badge"
import {
  brandDnaFormSchema,
  CAUSSE_COLORS,
  VOICE_TONES,
  SECTORS,
} from "@/lib/schemas/brand-dna.schema"

// ─── computeDnaScore ────────────────────────────────────────────────────────

describe("computeDnaScore", () => {
  test("retourne 0 pour un objet vide", () => {
    expect(computeDnaScore({})).toBe(0)
  })

  test("retourne 0 pour des chaînes vides", () => {
    expect(computeDnaScore({
      brandName: "",
      sector: "",
      positioning: "",
      logoDataUrl: "",
      colorPrimary: "",
      colorSecondary: "",
      colorAccent: "",
      voiceTone: "",
      audienceDescription: "",
    })).toBe(0)
  })

  test("score identité partielle — nom seulement : 0.10", () => {
    const score = computeDnaScore({ brandName: "RAMI" })
    expect(score).toBe(0.10)
  })

  test("score identité complète sans logo : 0.25", () => {
    const score = computeDnaScore({
      brandName: "RAMI",
      sector: "Tech & SaaS",
      positioning: "Plateforme SaaS de contenu neuropsychologique.",
      tagline: "L'IA qui vise juste.",
    })
    expect(score).toBe(0.25)
  })

  test("logo ajoute +0.15 au score", () => {
    const without = computeDnaScore({ brandName: "RAMI" })
    const with_ = computeDnaScore({ brandName: "RAMI", logoDataUrl: "data:image/png;base64,abc" })
    expect(with_ - without).toBeCloseTo(0.15)
  })

  test("palette partielle — couleur principale seulement : +0.10", () => {
    const score = computeDnaScore({ colorPrimary: "bleu_marine" })
    expect(score).toBe(0.10)
  })

  test("palette complète (3 couleurs) : +0.25 total", () => {
    const score = computeDnaScore({
      colorPrimary: "bleu_marine",
      colorSecondary: "vert_emeraude",
      colorAccent: "or_prestige",
    })
    expect(score).toBe(0.25)
  })

  test("ton de voix : +0.15", () => {
    const score = computeDnaScore({ voiceTone: "expert" })
    expect(score).toBe(0.15)
  })

  test("audience complète : +0.20 total", () => {
    const score = computeDnaScore({
      audienceDescription: "Directeurs d'agences digitales au Maroc, 30-50 ans.",
      audienceAge: "30-50 ans",
      audienceLocation: "Maroc",
      audiencePainPoints: "Manque de temps pour le contenu.",
    })
    expect(score).toBe(0.20)
  })

  test("audience description trop courte (<20 chars) n'ajoute pas de score", () => {
    const score = computeDnaScore({ audienceDescription: "Court" })
    expect(score).toBe(0)
  })

  test("score maximal (toutes dimensions) : 1.0", () => {
    const score = computeDnaScore({
      brandName: "RAMI",
      sector: "Tech & SaaS",
      positioning: "Plateforme SaaS de contenu neuropsychologique pour agences.",
      tagline: "L'IA qui vise juste.",
      logoDataUrl: "data:image/png;base64,abc123",
      colorPrimary: "bleu_marine",
      colorSecondary: "vert_emeraude",
      colorAccent: "or_prestige",
      voiceTone: "expert",
      audienceDescription: "Directeurs d'agences digitales au Maroc et en Afrique francophone.",
      audienceAge: "30-50 ans",
      audienceLocation: "Maroc, Tunisie",
      audiencePainPoints: "Manque de temps pour le design.",
    })
    expect(score).toBe(1.0)
  })

  test("ne dépasse jamais 1.0", () => {
    const score = computeDnaScore({
      brandName: "Test très long nom de marque avec beaucoup de caractères",
      sector: "Tech & SaaS",
      positioning: "Un positionnement très détaillé qui dépasse les critères minimum pour tester les limites.",
      tagline: "Slogan de test.",
      logoDataUrl: "data:image/png;base64,abc123",
      colorPrimary: "bleu_marine",
      colorSecondary: "vert_emeraude",
      colorAccent: "or_prestige",
      voiceTone: "expert",
      audienceDescription: "Une description d'audience très détaillée qui dépasse largement les 20 caractères minimaux.",
      audienceAge: "25-55 ans",
      audienceLocation: "Monde entier",
      audiencePainPoints: "De nombreux points de douleur documentés en détail.",
    })
    expect(score).toBeLessThanOrEqual(1.0)
  })

  test("score arrondi à 2 décimales", () => {
    const score = computeDnaScore({ brandName: "RAMI", sector: "Tech & SaaS" })
    // 0.10 + 0.05 = 0.15
    expect(score).toBe(0.15)
    // Vérifier que c'est bien un nombre avec max 2 décimales
    expect(Number.isInteger(score * 100)).toBe(true)
  })
})

// ─── brandDnaFormSchema (Zod) ────────────────────────────────────────────────

describe("brandDnaFormSchema", () => {
  const validData = {
    brandName: "RAMI",
    tagline: "L'IA qui vise juste.",
    sector: "Tech & SaaS",
    positioning: "Plateforme SaaS de contenu neuropsychologique pour agences.",
    logoDataUrl: "",
    logoFileName: "",
    colorPrimary: "bleu_marine",
    colorSecondary: "vert_emeraude",
    colorAccent: "or_prestige",
    voiceTone: "expert",
    audienceDescription: "Directeurs d'agences digitales au Maroc et en Afrique francophone.",
    audienceAge: "30-50 ans",
    audienceLocation: "Maroc",
    audiencePainPoints: "Manque de temps.",
  }

  test("valide un formulaire complet", () => {
    const result = brandDnaFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  test("échoue si brandName est vide", () => {
    const result = brandDnaFormSchema.safeParse({ ...validData, brandName: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path.join("."))
      expect(fields).toContain("brandName")
    }
  })

  test("échoue si brandName dépasse 100 caractères", () => {
    const result = brandDnaFormSchema.safeParse({
      ...validData,
      brandName: "A".repeat(101),
    })
    expect(result.success).toBe(false)
  })

  test("échoue si sector est vide", () => {
    const result = brandDnaFormSchema.safeParse({ ...validData, sector: "" })
    expect(result.success).toBe(false)
  })

  test("échoue si positioning < 10 caractères", () => {
    const result = brandDnaFormSchema.safeParse({ ...validData, positioning: "Court" })
    expect(result.success).toBe(false)
  })

  test("échoue si positioning > 500 caractères", () => {
    const result = brandDnaFormSchema.safeParse({
      ...validData,
      positioning: "A".repeat(501),
    })
    expect(result.success).toBe(false)
  })

  test("échoue si colorPrimary est vide", () => {
    const result = brandDnaFormSchema.safeParse({ ...validData, colorPrimary: "" })
    expect(result.success).toBe(false)
  })

  test("échoue si voiceTone est vide", () => {
    const result = brandDnaFormSchema.safeParse({ ...validData, voiceTone: "" })
    expect(result.success).toBe(false)
  })

  test("échoue si audienceDescription < 20 caractères", () => {
    const result = brandDnaFormSchema.safeParse({
      ...validData,
      audienceDescription: "Trop court",
    })
    expect(result.success).toBe(false)
  })

  test("échoue si audienceDescription > 1000 caractères", () => {
    const result = brandDnaFormSchema.safeParse({
      ...validData,
      audienceDescription: "A".repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  test("tagline optionnel — valide sans tagline", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tagline: _tagline, ...withoutTagline } = validData
    const result = brandDnaFormSchema.safeParse(withoutTagline)
    expect(result.success).toBe(true)
  })

  test("logoDataUrl optionnel — valide sans logo", () => {
    const result = brandDnaFormSchema.safeParse({ ...validData, logoDataUrl: "" })
    expect(result.success).toBe(true)
  })

  test("audienceAge, audienceLocation, audiencePainPoints optionnels", () => {
    const result = brandDnaFormSchema.safeParse({
      ...validData,
      audienceAge: "",
      audienceLocation: "",
      audiencePainPoints: "",
    })
    expect(result.success).toBe(true)
  })
})

// ─── CAUSSE_COLORS ──────────────────────────────────────────────────────────

describe("CAUSSE_COLORS", () => {
  test("contient exactement 12 couleurs", () => {
    expect(CAUSSE_COLORS).toHaveLength(12)
  })

  test("chaque couleur a un id, hex, name, emotion, psycho et sectors", () => {
    for (const color of CAUSSE_COLORS) {
      expect(color.id).toBeTruthy()
      expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
      expect(color.name).toBeTruthy()
      expect(color.emotion).toBeTruthy()
      expect(color.psycho).toBeTruthy()
      expect(Array.isArray(color.sectors)).toBe(true)
      expect(color.sectors.length).toBeGreaterThan(0)
    }
  })

  test("tous les ids sont uniques", () => {
    const ids = CAUSSE_COLORS.map((c) => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(CAUSSE_COLORS.length)
  })

  test("tous les hex sont valides et uniques", () => {
    const hexes = CAUSSE_COLORS.map((c) => c.hex.toLowerCase())
    const unique = new Set(hexes)
    expect(unique.size).toBe(CAUSSE_COLORS.length)
  })

  test("contient bleu_marine (couleur confiance)", () => {
    const bleu = CAUSSE_COLORS.find((c) => c.id === "bleu_marine")
    expect(bleu).toBeDefined()
    expect(bleu?.emotion).toContain("Confiance")
  })

  test("contient rouge_passion (couleur urgence)", () => {
    const rouge = CAUSSE_COLORS.find((c) => c.id === "rouge_passion")
    expect(rouge).toBeDefined()
    expect(rouge?.emotion.toLowerCase()).toContain("urgence")
  })

  test("contient vert_emeraude (croissance + Islam)", () => {
    const vert = CAUSSE_COLORS.find((c) => c.id === "vert_emeraude")
    expect(vert).toBeDefined()
    expect(vert?.sectors).toContain("islam")
  })
})

// ─── VOICE_TONES ────────────────────────────────────────────────────────────

describe("VOICE_TONES", () => {
  test("contient exactement 6 tons de voix", () => {
    expect(VOICE_TONES).toHaveLength(6)
  })

  test("chaque ton a un id, label, description, icon et keywords", () => {
    for (const tone of VOICE_TONES) {
      expect(tone.id).toBeTruthy()
      expect(tone.label).toBeTruthy()
      expect(tone.description).toBeTruthy()
      expect(tone.icon).toBeTruthy()
      expect(Array.isArray(tone.keywords)).toBe(true)
      expect(tone.keywords.length).toBeGreaterThan(0)
    }
  })

  test("tous les ids sont uniques", () => {
    const ids = VOICE_TONES.map((t) => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(VOICE_TONES.length)
  })

  test("contient le ton 'expert'", () => {
    const expert = VOICE_TONES.find((t) => t.id === "expert")
    expect(expert).toBeDefined()
    expect(expert?.label).toContain("Expert")
    expect(expert?.keywords).toContain("analytique")
  })

  test("contient le ton 'premium'", () => {
    const premium = VOICE_TONES.find((t) => t.id === "premium")
    expect(premium).toBeDefined()
    expect(premium?.keywords).toContain("exclusif")
  })
})

// ─── SECTORS ────────────────────────────────────────────────────────────────

describe("SECTORS", () => {
  test("contient au moins 10 secteurs", () => {
    expect(SECTORS.length).toBeGreaterThanOrEqual(10)
  })

  test("contient 'Finance & Banque'", () => {
    expect(SECTORS).toContain("Finance & Banque")
  })

  test("contient 'Finance Islamique'", () => {
    expect(SECTORS).toContain("Finance Islamique")
  })

  test("se termine par 'Autre'", () => {
    expect(SECTORS[SECTORS.length - 1]).toBe("Autre")
  })

  test("tous les secteurs sont des chaînes non vides", () => {
    for (const sector of SECTORS) {
      expect(typeof sector).toBe("string")
      expect(sector.length).toBeGreaterThan(0)
    }
  })
})
