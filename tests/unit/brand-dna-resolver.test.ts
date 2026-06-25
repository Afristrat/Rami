import {
  resolveBrandIdentity,
  readableTextColor,
  contrastRatio,
  relativeLuminance,
  isUsableLogo,
  isHex6,
  monogramFrom,
  sectorToShapeKey,
} from "@/lib/services/brand-dna/resolver"

// ─── Contraste / lisibilité (WCAG) ───────────────────────────────────────────

describe("contraste WCAG", () => {
  test("relativeLuminance : noir ≈ 0, blanc ≈ 1", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5)
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5)
  })

  test("contrastRatio noir/blanc = 21", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1)
  })

  test("contrastRatio est symétrique", () => {
    expect(contrastRatio("#1D4ED8", "#FFFFFF")).toBeCloseTo(contrastRatio("#FFFFFF", "#1D4ED8"), 6)
  })

  test("readableTextColor : texte BLANC sur fond sombre", () => {
    expect(readableTextColor("#0F172A")).toBe("#FFFFFF") // noir_elegance
    expect(readableTextColor("#1D4ED8")).toBe("#FFFFFF") // bleu_roi
    expect(readableTextColor("#9F1239")).toBe("#FFFFFF") // bordeaux
  })

  test("readableTextColor : texte SOMBRE sur fond clair", () => {
    expect(readableTextColor("#FFFFFF")).toBe("#0B0B0F")
    expect(readableTextColor("#FACC15")).toBe("#0B0B0F") // jaune vif
    expect(readableTextColor("#7DD3FC")).toBe("#0B0B0F") // bleu ciel clair
  })

  test("readableTextColor garantit un contraste lisible (≥ 4.5) sur toute la palette Causse", () => {
    const causseHex = [
      "#1E3A5F", "#1D4ED8", "#DC2626", "#059669", "#7C3AED", "#EA580C",
      "#D97706", "#DB2777", "#B45309", "#0F172A", "#0891B2", "#9F1239",
    ]
    for (const hex of causseHex) {
      const text = readableTextColor(hex)
      expect(contrastRatio(hex, text)).toBeGreaterThanOrEqual(4.5)
    }
  })

  test("readableTextColor : entrée invalide → blanc (sûr)", () => {
    expect(readableTextColor("pas-un-hex")).toBe("#FFFFFF")
  })
})

// ─── isHex6 ──────────────────────────────────────────────────────────────────

describe("isHex6", () => {
  test("valide #RRGGBB", () => {
    expect(isHex6("#1D4ED8")).toBe(true)
    expect(isHex6("#abcdef")).toBe(true)
  })
  test("rejette le reste", () => {
    expect(isHex6("#FFF")).toBe(false)
    expect(isHex6("1D4ED8")).toBe(false)
    expect(isHex6(null)).toBe(false)
    expect(isHex6(123)).toBe(false)
  })
})

// ─── Logo ─────────────────────────────────────────────────────────────────────

describe("isUsableLogo", () => {
  const tinyPng = "data:image/png;base64," + "A".repeat(200)
  test("data URI png/jpeg/webp/svg valides", () => {
    expect(isUsableLogo(tinyPng)).toBe(true)
    expect(isUsableLogo("data:image/jpeg;base64," + "A".repeat(200))).toBe(true)
    expect(isUsableLogo("data:image/webp;base64," + "A".repeat(200))).toBe(true)
    expect(isUsableLogo("data:image/svg+xml;base64," + "A".repeat(200))).toBe(true)
  })
  test("rejette URL http, vide, format non supporté, trop gros", () => {
    expect(isUsableLogo("https://cdn.example.com/logo.png")).toBe(false)
    expect(isUsableLogo("")).toBe(false)
    expect(isUsableLogo("data:image/gif;base64,AAAA")).toBe(false)
    expect(isUsableLogo("data:image/png;base64,AAA")).toBe(false) // trop court
    expect(isUsableLogo("data:image/png;base64," + "A".repeat(2_000_000))).toBe(false) // trop gros
    expect(isUsableLogo(null)).toBe(false)
  })
})

// ─── Monogramme ─────────────────────────────────────────────────────────────

describe("monogramFrom", () => {
  test("deux mots → initiales", () => {
    expect(monogramFrom("Afrique Stratégie")).toBe("AS")
    expect(monogramFrom("Banque Al Baraka")).toBe("BA")
  })
  test("un mot → deux premières lettres", () => {
    expect(monogramFrom("Rami")).toBe("RA")
  })
  test("nom avec tiret", () => {
    expect(monogramFrom("AI-Mpower")).toBe("AM")
  })
  test("vide / null → puce", () => {
    expect(monogramFrom("")).toBe("•")
    expect(monogramFrom(null)).toBe("•")
    expect(monogramFrom("   ")).toBe("•")
  })
})

// ─── Secteur → forme Gestalt ──────────────────────────────────────────────────

describe("sectorToShapeKey", () => {
  test("les 30 secteurs renvoient une forme connue (jamais de crash)", () => {
    const sectors = [
      "finance_banque", "finance_islamique", "assurance_mutuelles", "immobilier_promotion",
      "btp_construction", "industrie_manufacturing", "agroalimentaire_agriculture",
      "energie_environnement", "sante_medical", "pharmacie_parapharmacie", "bien_etre_spa",
      "tech_saas", "ia_data", "cybersecurite", "ecommerce_marketplace", "telecommunications",
      "education_formation", "edtech_elearning", "media_presse", "marketing_publicite",
      "consulting_conseil", "ressources_humaines", "juridique_droit", "luxe_haute_couture",
      "mode_pret_a_porter", "beaute_cosmetiques", "sport_fitness", "tourisme_hospitality",
      "restauration_food", "ong_social_impact", "autre",
    ]
    const known = ["cercle", "carre", "triangle", "diagonales", "courbes", "grille"]
    for (const s of sectors) {
      expect(known).toContain(sectorToShapeKey(s))
    }
  })
  test("mappings sémantiques clés", () => {
    expect(sectorToShapeKey("finance_islamique")).toBe("carre")
    expect(sectorToShapeKey("ressources_humaines")).toBe("cercle")
    expect(sectorToShapeKey("luxe_haute_couture")).toBe("courbes")
    expect(sectorToShapeKey("tech_saas")).toBe("diagonales")
    expect(sectorToShapeKey("ia_data")).toBe("grille")
    expect(sectorToShapeKey("sport_fitness")).toBe("triangle")
  })
  test("alias legacy + inconnu → fallback gracieux", () => {
    expect(sectorToShapeKey("finance")).toBe("carre")
    expect(sectorToShapeKey("tech")).toBe("diagonales")
    expect(sectorToShapeKey("inconnu_xyz")).toBe("cercle")
    expect(sectorToShapeKey(null)).toBe("cercle")
  })
})

// ─── resolveBrandIdentity — données prod réelles ──────────────────────────────

describe("resolveBrandIdentity (DNA plat réel)", () => {
  // Réplique du tenant prod "AI-Mpower" (vérifié en db-rami).
  const aiMpower = {
    brandName: "AI-Mpower",
    sector: "ressources_humaines",
    colorPrimary: "bleu_roi", // #1D4ED8
    colorSecondary: "vert_emeraude", // #059669
    colorAccent: "orange_chaleureux", // #EA580C
    voiceTone: "ludique",
    primaryCulture: "international",
  }

  test("résout la palette réelle (IDs Causse → HEX) + hasBrandColor", () => {
    const id = resolveBrandIdentity(aiMpower)
    expect(id.accent).toBe("#1D4ED8")
    expect(id.secondary).toBe("#059669")
    expect(id.palette).toEqual(["#1D4ED8", "#059669", "#EA580C"])
    expect(id.hasBrandColor).toBe(true)
  })

  test("onAccent lisible + forme dérivée du secteur RH = cercle", () => {
    const id = resolveBrandIdentity(aiMpower)
    expect(id.onAccent).toBe("#FFFFFF")
    expect(contrastRatio(id.accent, id.onAccent)).toBeGreaterThanOrEqual(4.5)
    expect(id.shapeKey).toBe("cercle")
  })

  test("monogramme + handle sans logo → hasLogo false, monogramme présent", () => {
    const id = resolveBrandIdentity(aiMpower)
    expect(id.hasLogo).toBe(false)
    expect(id.logoDataUrl).toBeNull()
    expect(id.monogram).toBe("AM")
    expect(id.handle).toBe("AI-Mpower")
  })

  test("tenant finance_islamique → vert dominant + forme carré", () => {
    const id = resolveBrandIdentity({
      brandName: "Banque Test Ralph",
      sector: "finance_islamique",
      colorPrimary: "vert_emeraude",
      colorSecondary: "rouge_passion",
      colorAccent: "bleu_marine",
    })
    expect(id.accent).toBe("#059669")
    expect(id.shapeKey).toBe("carre")
    // onAccent = la couleur la plus lisible (le resolver choisit, on vérifie le contraste réel)
    expect(contrastRatio(id.accent, id.onAccent)).toBeGreaterThanOrEqual(4.5)
  })
})

describe("resolveBrandIdentity — fallbacks gracieux", () => {
  test("DNA null → tokens sûrs, jamais de crash", () => {
    const id = resolveBrandIdentity(null, { tenantName: "Studio Démo" })
    expect(id.accent).toBe("#1D4ED8") // fallback bleu_roi
    expect(id.palette).toEqual(["#1D4ED8"])
    expect(id.onAccent).toBe("#FFFFFF")
    expect(id.shapeKey).toBe("cercle")
    expect(id.monogram).toBe("SD")
    expect(id.handle).toBe("Studio Démo")
    expect(id.hasLogo).toBe(false)
    expect(id.hasBrandColor).toBe(false) // accent = fallback, pas une vraie couleur de marque
  })

  test("DNA vide complet → fallback monogramme puce", () => {
    const id = resolveBrandIdentity({})
    expect(id.monogram).toBe("•")
    expect(id.handle).toBeNull()
    expect(id.accent).toBe("#1D4ED8")
  })

  test("logo valide → hasLogo true + data URI conservé", () => {
    const logo = "data:image/png;base64," + "Z".repeat(500)
    const id = resolveBrandIdentity({ brandName: "Acme", colorPrimary: "rouge_passion", logoDataUrl: logo })
    expect(id.hasLogo).toBe(true)
    expect(id.logoDataUrl).toBe(logo)
  })

  test("logo invalide (URL http) → ignoré proprement, fallback monogramme", () => {
    const id = resolveBrandIdentity({ brandName: "Acme", logoDataUrl: "https://x.com/logo.png" })
    expect(id.hasLogo).toBe(false)
    expect(id.logoDataUrl).toBeNull()
    expect(id.monogram).toBe("AC")
  })

  test("typographie lue si présente", () => {
    const id = resolveBrandIdentity({
      brandName: "Acme",
      colorPrimary: "bleu_roi",
      typography: { heading: { family: "Poppins", size: 40, weight: "bold" }, body: { family: "Inter", size: 16, weight: "normal" } },
    })
    expect(id.headingFamily).toBe("Poppins")
    expect(id.bodyFamily).toBe("Inter")
  })
})
