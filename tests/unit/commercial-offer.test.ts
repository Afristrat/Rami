import {
  buildOfferSystemPrompt,
  buildOfferUserPrompt,
  parseOfferContent,
  type CommercialOfferContent,
} from "@/lib/services/documents/commercial-offer"
import type { BrandDNA } from "@/lib/services/brand-dna/prompt-compiler"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const BRAND_DNA: BrandDNA = {
  identity: {
    name: "Banque Test Ralph",
    sector: "finance_islamique",
    positioning: "La banque participative de référence au Maroc",
    tagline: undefined,
  },
  cognitive_objective: "confiance",
  culture_markets: { primary_culture: "maroc" },
  color_palette: [{ hex: "#16A34A", name: "vert_emeraude" }],
  editorial_tone: { register: "expert" },
  active_platforms: undefined,
}

const VALID_CONTENT: CommercialOfferContent = {
  executive_summary: "Synthèse de l'offre.",
  context: "Contexte du client et de son marché.",
  objectives: ["Accroître la visibilité digitale"],
  services: [
    {
      name: "Stratégie social media",
      description: "Définition de la ligne éditoriale.",
      deliverables: ["Calendrier éditorial", "Charte de tonalité"],
    },
  ],
  methodology: ["Audit", "Cadrage", "Déploiement"],
  pricing: [{ label: "Forfait mensuel", description: "Accompagnement complet", price: "" }],
  next_steps: ["Réunion de cadrage"],
}

// ─── buildOfferSystemPrompt ──────────────────────────────────────────────────

describe("buildOfferSystemPrompt", () => {
  test("interdit explicitement les chiffres inventés et exige du JSON", () => {
    const prompt = buildOfferSystemPrompt()
    expect(prompt).toContain("n'invente JAMAIS de chiffres")
    expect(prompt).toContain("JSON")
    expect(prompt).toContain("executive_summary")
  })
})

// ─── buildOfferUserPrompt ────────────────────────────────────────────────────

describe("buildOfferUserPrompt", () => {
  test("intègre titre, client, brief et Brand DNA", () => {
    const prompt = buildOfferUserPrompt({
      title: "Offre Social Ads Novembre",
      clientName: "Luxe Design",
      brief: "Campagne de notoriété sur Instagram, budget 30 000 MAD.",
      brandDNA: BRAND_DNA,
    })
    expect(prompt).toContain("Offre Social Ads Novembre")
    expect(prompt).toContain("Luxe Design")
    expect(prompt).toContain("Banque Test Ralph")
    expect(prompt).toContain("finance_islamique")
    expect(prompt).toContain("maroc")
    expect(prompt).toContain("expert")
    expect(prompt).toContain("30 000 MAD")
  })

  test("sans brief → consigne générique sans données chiffrées", () => {
    const prompt = buildOfferUserPrompt({
      title: "Offre type",
      clientName: null,
      brief: null,
      brandDNA: {},
    })
    expect(prompt).toContain("Aucun brief détaillé fourni")
    expect(prompt).not.toContain("Client destinataire")
  })
})

// ─── parseOfferContent ───────────────────────────────────────────────────────

describe("parseOfferContent", () => {
  test("JSON valide nu → contenu parsé", () => {
    const parsed = parseOfferContent(JSON.stringify(VALID_CONTENT))
    expect(parsed).not.toBeNull()
    expect(parsed?.executive_summary).toBe("Synthèse de l'offre.")
    expect(parsed?.services).toHaveLength(1)
    expect(parsed?.services[0].deliverables).toContain("Calendrier éditorial")
  })

  test("JSON dans une clôture markdown ```json``` → parsé", () => {
    const raw = "```json\n" + JSON.stringify(VALID_CONTENT) + "\n```"
    const parsed = parseOfferContent(raw)
    expect(parsed).not.toBeNull()
    expect(parsed?.objectives).toEqual(["Accroître la visibilité digitale"])
  })

  test("JSON entouré de texte parasite → isolé et parsé", () => {
    const raw = "Voici l'offre demandée :\n" + JSON.stringify(VALID_CONTENT) + "\nBonne lecture."
    const parsed = parseOfferContent(raw)
    expect(parsed).not.toBeNull()
    expect(parsed?.context).toContain("Contexte")
  })

  test("champs optionnels absents → défauts appliqués (pricing/next_steps vides)", () => {
    const minimal = {
      executive_summary: "Synthèse.",
      context: "Contexte.",
      objectives: ["Objectif"],
      services: [{ name: "Service", description: "Description" }],
      methodology: ["Étape"],
    }
    const parsed = parseOfferContent(JSON.stringify(minimal))
    expect(parsed).not.toBeNull()
    expect(parsed?.pricing).toEqual([])
    expect(parsed?.next_steps).toEqual([])
    expect(parsed?.services[0].deliverables).toEqual([])
  })

  test("JSON invalide → null", () => {
    expect(parseOfferContent("{ pas du json")).toBeNull()
  })

  test("JSON valide mais schéma non conforme (services vide) → null", () => {
    const bad = { ...VALID_CONTENT, services: [] }
    expect(parseOfferContent(JSON.stringify(bad))).toBeNull()
  })

  test("chaîne vide ou sans objet → null", () => {
    expect(parseOfferContent("")).toBeNull()
    expect(parseOfferContent("aucun objet ici")).toBeNull()
  })
})
