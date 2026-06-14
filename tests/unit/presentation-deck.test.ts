import { parseDeck, buildDeckSystemPrompt, buildDeckUserPrompt } from "@/lib/services/documents/presentation-deck"
import { deckSchema } from "@/lib/schemas/presentation.schema"

describe("presentation-deck — parseDeck", () => {
  const validDeck = {
    slides: [
      { type: "cover", title: "Compte Épargne Halal", subtitle: "Lancement 2026" },
      { type: "agenda", title: "Agenda", items: ["Contexte", "Offre", "Bénéfices"] },
      { type: "content", title: "Bénéfices", bullets: ["Rendement progressif", "100% conforme"] },
      { type: "conclusion", title: "Conclusion", bullets: ["Ouvrez votre compte"] },
    ],
  }

  it("parse un JSON valide", () => {
    const deck = parseDeck(JSON.stringify(validDeck))
    expect(deck).not.toBeNull()
    expect(deck?.slides).toHaveLength(4)
    expect(deck?.slides[0].type).toBe("cover")
  })

  it("retire les fences Markdown ```json", () => {
    const wrapped = "```json\n" + JSON.stringify(validDeck) + "\n```"
    expect(parseDeck(wrapped)).not.toBeNull()
  })

  it("extrait l'objet JSON malgré du texte parasite", () => {
    const noisy = "Voici votre deck :\n" + JSON.stringify(validDeck) + "\nFin."
    expect(parseDeck(noisy)).not.toBeNull()
  })

  it("retourne null sur un JSON invalide", () => {
    expect(parseDeck("pas du json")).toBeNull()
  })

  it("retourne null si un type de slide est inconnu", () => {
    const bad = { slides: [{ type: "pyramid", title: "x" }] }
    expect(parseDeck(JSON.stringify(bad))).toBeNull()
  })

  it("retourne null si le deck est trop court (< 3 slides)", () => {
    const tooShort = { slides: [{ type: "cover", title: "x" }] }
    expect(parseDeck(JSON.stringify(tooShort))).toBeNull()
  })

  it("sauve un deck en filtrant une slide non conforme (≥ 3 valides restantes)", () => {
    const mixed = {
      slides: [
        { type: "cover", title: "A" },
        { type: "pyramid", title: "type inconnu" }, // invalide → filtrée
        { type: "content", title: "B", bullets: ["x"] },
        { type: "conclusion", title: "C", bullets: ["y"] },
      ],
    }
    const deck = parseDeck(JSON.stringify(mixed))
    expect(deck).not.toBeNull()
    expect(deck?.slides).toHaveLength(3)
    expect(deck?.slides.some((s) => (s as { type: string }).type === "pyramid")).toBe(false)
  })

  it("valide un slide twoColumn complet", () => {
    const tc = {
      slides: [
        { type: "cover", title: "A" },
        {
          type: "twoColumn",
          title: "Comparaison",
          leftTitle: "Avant",
          left: ["lent"],
          rightTitle: "Après",
          right: ["rapide"],
        },
        { type: "conclusion", title: "Fin", bullets: ["ok"] },
      ],
    }
    const r = deckSchema.safeParse(tc)
    expect(r.success).toBe(true)
  })
})

describe("presentation-deck — prompts", () => {
  it("le prompt système impose le format JSON et liste les types", () => {
    const sys = buildDeckSystemPrompt()
    expect(sys).toContain("cover")
    expect(sys).toContain("twoColumn")
    expect(sys).toMatch(/JSON/i)
  })

  it("le prompt utilisateur intègre le sujet et la langue", () => {
    const user = buildDeckUserPrompt({
      subject: "Compte épargne Halal",
      audience: "jeunes actifs",
      language: "fr",
      slideCount: 10,
      brandDNA: { identity: { name: "Banque Test" } },
    })
    expect(user).toContain("Compte épargne Halal")
    expect(user).toContain("jeunes actifs")
    expect(user).toMatch(/français/i)
    expect(user).toContain("Banque Test")
  })
})
