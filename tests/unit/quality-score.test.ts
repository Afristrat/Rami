import {
  computeQualityScore,
  detectCta,
  HASHTAG_RANGES,
  type QualityInput,
} from "@/lib/services/workflow/quality-score"

function baseInput(overrides: Partial<QualityInput> = {}): QualityInput {
  return {
    caption:
      "Découvrez notre nouvelle offre de financement participatif conforme. Contactez-nous pour en savoir plus !",
    hashtags: ["finance", "islamique", "maroc"],
    charLimit: 3000,
    platform: "linkedin",
    visualBrandDnaScore: 0.85,
    ...overrides,
  }
}

describe("quality-score (Step 5 — score réel, fin du « A+ » inventé)", () => {
  it("contenu complet et conforme → grade A+/A, 4 métriques good", () => {
    const result = computeQualityScore(baseInput())
    expect(result.overLimit).toBe(false)
    expect(result.score).toBeGreaterThanOrEqual(90)
    expect(result.grade).toBe("A+")
    expect(result.metrics).toHaveLength(4)
    for (const metric of result.metrics) {
      expect(metric.status).toBe("good")
    }
  })

  it("caption au-dessus de la limite plateforme → overLimit + grade plafonné à D", () => {
    const result = computeQualityScore(
      baseInput({ caption: "x".repeat(300) + " ?", charLimit: 280, platform: "twitter", hashtags: ["a", "b"] })
    )
    expect(result.overLimit).toBe(true)
    expect(result.score).toBeLessThanOrEqual(44)
    expect(result.grade).toBe("D")
    const charMetric = result.metrics.find((m) => m.id === "charCount")
    expect(charMetric?.status).toBe("bad")
  })

  it("caption vide → métrique charCount à 0", () => {
    const result = computeQualityScore(baseInput({ caption: "" }))
    const charMetric = result.metrics.find((m) => m.id === "charCount")
    expect(charMetric?.ratio).toBe(0)
    expect(charMetric?.status).toBe("bad")
  })

  it("aucun visuel sélectionné → métrique Brand DNA en warn (pas un score inventé)", () => {
    const result = computeQualityScore(baseInput({ visualBrandDnaScore: null }))
    const dnaMetric = result.metrics.find((m) => m.id === "brandDnaScore")
    expect(dnaMetric?.ratio).toBe(0.4)
    expect(dnaMetric?.status).toBe("warn")
  })

  it("le score Brand DNA du visuel est répercuté tel quel dans la jauge", () => {
    const result = computeQualityScore(baseInput({ visualBrandDnaScore: 0.55 }))
    const dnaMetric = result.metrics.find((m) => m.id === "brandDnaScore")
    expect(dnaMetric?.ratio).toBe(0.55)
    expect(dnaMetric?.status).toBe("warn")
  })

  it("zéro hashtag sur une plateforme qui en recommande → pénalisé", () => {
    const result = computeQualityScore(baseInput({ hashtags: [] }))
    const tagMetric = result.metrics.find((m) => m.id === "hashtagVolume")
    expect(tagMetric?.ratio).toBe(0.3)
    expect(tagMetric?.status).toBe("bad")
  })

  it("trop de hashtags → effet spam pénalisé", () => {
    const result = computeQualityScore(
      baseInput({ hashtags: Array.from({ length: 12 }, (_, i) => `tag${i}`) })
    )
    const tagMetric = result.metrics.find((m) => m.id === "hashtagVolume")
    expect(tagMetric?.ratio).toBe(0.5)
  })

  it("toutes les plateformes ont une fourchette de hashtags définie", () => {
    const platforms = ["twitter", "linkedin", "facebook", "instagram", "pinterest", "youtube", "tiktok"] as const
    for (const platform of platforms) {
      const [min, max] = HASHTAG_RANGES[platform]
      expect(min).toBeLessThanOrEqual(max)
    }
  })

  describe("detectCta", () => {
    it("détecte les CTA français", () => {
      expect(detectCta("Découvrez notre offre dès maintenant.")).toBe(true)
      expect(detectCta("Contactez-nous pour un devis.")).toBe(true)
      expect(detectCta("Téléchargez le guide complet.")).toBe(true)
    })

    it("détecte les CTA anglais", () => {
      expect(detectCta("Sign up today and learn more.")).toBe(true)
      expect(detectCta("Download our free guide.")).toBe(true)
    })

    it("une question compte comme CTA conversationnel", () => {
      expect(detectCta("Et vous, quelle est votre stratégie ?")).toBe(true)
    })

    it("texte purement descriptif sans CTA → false", () => {
      expect(detectCta("Notre entreprise a été fondée en 2020 à Casablanca.")).toBe(false)
      expect(detectCta("")).toBe(false)
    })
  })
})
