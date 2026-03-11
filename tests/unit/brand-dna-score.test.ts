import { computeDnaScore } from "@/lib/utils/dna-score"
import {
  brandDnaFormSchema,
  CAUSSE_COLORS,
  VOICE_TONES,
  SECTORS,
  SECTOR_COLOR_RULES,
  COGNITIVE_OBJECTIVES,
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

  test("audience complète (description + culture + âge + géo + pain) : +0.20 total", () => {
    const score = computeDnaScore({
      audienceDescription: "Directeurs d'agences digitales au Maroc, 30-50 ans.",
      primaryCulture: "maroc",
      audienceAge: "30-50 ans",
      audienceLocation: "Maroc",
      audiencePainPoints: "Manque de temps pour le contenu.",
    })
    expect(score).toBe(0.20)
  })

  test("culture cible seule : +0.04", () => {
    const score = computeDnaScore({ primaryCulture: "maroc" })
    expect(score).toBe(0.04)
  })

  test("audience sans culture : 0.16 (description + âge + géo + pain)", () => {
    const score = computeDnaScore({
      audienceDescription: "Directeurs d'agences digitales au Maroc, 30-50 ans.",
      audienceAge: "30-50 ans",
      audienceLocation: "Maroc",
      audiencePainPoints: "Manque de temps pour le contenu.",
    })
    expect(score).toBe(0.16)
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
      primaryCulture: "maroc",
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
      primaryCulture: "international",
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

// ─── SECTOR_COLOR_RULES ──────────────────────────────────────────────────────

describe("SECTOR_COLOR_RULES", () => {
  // Cast to string set to avoid TS literal-type restriction on Set.has()
  const allColorIds = new Set<string>(CAUSSE_COLORS.map((c) => c.id))

  test("contient au moins 5 secteurs configurés", () => {
    expect(Object.keys(SECTOR_COLOR_RULES).length).toBeGreaterThanOrEqual(5)
  })

  test("chaque secteur a les champs recommended et avoid (tableaux)", () => {
    for (const rule of Object.values(SECTOR_COLOR_RULES)) {
      expect(Array.isArray(rule.recommended)).toBe(true)
      expect(Array.isArray(rule.avoid)).toBe(true)
    }
  })

  test("tous les IDs de couleurs recommended existent dans CAUSSE_COLORS", () => {
    for (const [sector, rule] of Object.entries(SECTOR_COLOR_RULES)) {
      for (const colorId of rule.recommended) {
        if (!allColorIds.has(colorId)) {
          throw new Error(`Secteur "${sector}" : l'ID recommandé "${colorId}" n'existe pas dans CAUSSE_COLORS`)
        }
      }
    }
  })

  test("tous les IDs de couleurs avoid existent dans CAUSSE_COLORS", () => {
    for (const [sector, rule] of Object.entries(SECTOR_COLOR_RULES)) {
      for (const colorId of rule.avoid) {
        if (!allColorIds.has(colorId)) {
          throw new Error(`Secteur "${sector}" : l'ID évité "${colorId}" n'existe pas dans CAUSSE_COLORS`)
        }
      }
    }
  })

  test("avoidAlternative est un ID valide quand présent", () => {
    for (const [sector, rule] of Object.entries(SECTOR_COLOR_RULES)) {
      if (rule.avoidAlternative !== undefined) {
        if (!allColorIds.has(rule.avoidAlternative)) {
          throw new Error(`Secteur "${sector}" : avoidAlternative "${rule.avoidAlternative}" n'existe pas dans CAUSSE_COLORS`)
        }
      }
    }
  })

  test("aucune couleur n'est simultanément recommended et avoided", () => {
    for (const [sector, rule] of Object.entries(SECTOR_COLOR_RULES)) {
      const recommended = new Set<string>(rule.recommended)
      for (const colorId of rule.avoid) {
        if (recommended.has(colorId)) {
          throw new Error(`Secteur "${sector}" : "${colorId}" est à la fois recommandé et à éviter`)
        }
      }
    }
  })

  test("avoidReason est présente quand avoidAlternative est définie", () => {
    for (const [sector, rule] of Object.entries(SECTOR_COLOR_RULES)) {
      if (rule.avoidAlternative !== undefined) {
        if (typeof rule.avoidReason !== "string") {
          throw new Error(`Secteur "${sector}" : avoidReason manquante alors qu'avoidAlternative est définie`)
        }
      }
    }
  })

  test("Finance Islamique recommande vert_emeraude et évite rouge_passion", () => {
    const rule = SECTOR_COLOR_RULES["Finance Islamique"]
    expect(rule).toBeDefined()
    expect(rule.recommended).toContain("vert_emeraude")
    expect(rule.avoid).toContain("rouge_passion")
  })

  test("Santé & Médical évite rouge_passion avec alternative bordeaux_premium", () => {
    const rule = SECTOR_COLOR_RULES["Santé & Médical"]
    expect(rule).toBeDefined()
    expect(rule.avoid).toContain("rouge_passion")
    expect(rule.avoidAlternative).toBe("bordeaux_premium")
  })

  test("Luxe & Mode évite orange et jaune (incompatibles avec positionnement luxe)", () => {
    const rule = SECTOR_COLOR_RULES["Luxe & Mode"]
    expect(rule).toBeDefined()
    expect(rule.avoid).toContain("orange_chaleureux")
    expect(rule.avoid).toContain("jaune_optimiste")
  })

  test("les clés de SECTOR_COLOR_RULES sont toutes dans SECTORS", () => {
    const sectorsSet = new Set(SECTORS as readonly string[])
    for (const sectorKey of Object.keys(SECTOR_COLOR_RULES)) {
      if (!sectorsSet.has(sectorKey)) {
        throw new Error(`La clé "${sectorKey}" dans SECTOR_COLOR_RULES n'existe pas dans SECTORS`)
      }
    }
  })
})

// ─── COGNITIVE_OBJECTIVES ────────────────────────────────────────────────────

describe("COGNITIVE_OBJECTIVES", () => {
  test("contient exactement 6 objectifs", () => {
    expect(COGNITIVE_OBJECTIVES).toHaveLength(6)
  })

  test("chaque objectif a id, label, icon, description, visualStyles et keywords", () => {
    for (const obj of COGNITIVE_OBJECTIVES) {
      expect(obj.id).toBeTruthy()
      expect(obj.label).toBeTruthy()
      expect(obj.icon).toBeTruthy()
      expect(obj.description).toBeTruthy()
      expect(Array.isArray(obj.visualStyles)).toBe(true)
      expect(obj.visualStyles.length).toBeGreaterThan(0)
      expect(Array.isArray(obj.keywords)).toBe(true)
      expect(obj.keywords.length).toBeGreaterThan(0)
    }
  })

  test("tous les IDs sont uniques", () => {
    const ids = COGNITIVE_OBJECTIVES.map((o) => o.id)
    expect(new Set(ids).size).toBe(COGNITIVE_OBJECTIVES.length)
  })

  test("contient 'confiance' → styles Blueprint + Scientifique (CLAUDE.md §2.2)", () => {
    const obj = COGNITIVE_OBJECTIVES.find((o) => o.id === "confiance")
    expect(obj).toBeDefined()
    expect(obj?.visualStyles).toContain("Blueprint")
    expect(obj?.visualStyles).toContain("Scientifique")
  })

  test("contient 'urgence' → styles Machine + Narratif", () => {
    const obj = COGNITIVE_OBJECTIVES.find((o) => o.id === "urgence")
    expect(obj).toBeDefined()
    expect(obj?.visualStyles).toContain("Machine")
    expect(obj?.visualStyles).toContain("Narratif")
  })

  test("contient 'expertise' → styles Dashboard + Stack", () => {
    const obj = COGNITIVE_OBJECTIVES.find((o) => o.id === "expertise")
    expect(obj).toBeDefined()
    expect(obj?.visualStyles).toContain("Dashboard")
    expect(obj?.visualStyles).toContain("Stack")
  })

  test("contient 'communaute' → styles Narratif + Carte/Tuile", () => {
    const obj = COGNITIVE_OBJECTIVES.find((o) => o.id === "communaute")
    expect(obj).toBeDefined()
    expect(obj?.visualStyles).toContain("Narratif")
    expect(obj?.visualStyles).toContain("Carte/Tuile")
  })
})
