import {
  computeOverall,
  heuristicLeadScore,
  parseLeadScore,
  assembleLeadScore,
  buildLeadScoringSystemPrompt,
  buildLeadScoringUserPrompt,
  type LeadScoringBrandDna,
  type LeadScoringInput,
} from "@/lib/services/leads/scorer"

const BRAND: LeadScoringBrandDna = {
  brandName: "RAMI",
  sector: "finance_islamique",
  positioning: "Agency OS B2B",
  primaryCulture: "maroc",
  audienceDescription: "Agences digitales",
  audienceLocation: "Maroc",
  audiencePainPoints: "Churn créatif",
}

// ─── computeOverall ──────────────────────────────────────────────────────────

describe("computeOverall", () => {
  test("pondération 0.35/0.35/0.30 arrondie", () => {
    // 0.35*100 + 0.35*100 + 0.30*0 = 70
    expect(computeOverall({ audience: 100, sector: 100, culture: 0 })).toBe(70)
  })
  test("borne [0,100]", () => {
    expect(computeOverall({ audience: 100, sector: 100, culture: 100 })).toBe(100)
    expect(computeOverall({ audience: 0, sector: 0, culture: 0 })).toBe(0)
  })
})

// ─── heuristicLeadScore ──────────────────────────────────────────────────────

describe("heuristicLeadScore", () => {
  test("secteur identique → 90 ; culture identique → 90 ; audience neutre 50", () => {
    const lead: LeadScoringInput = {
      company_name: "Banque X",
      sector: "finance_islamique",
      location: "maroc",
    }
    const s = heuristicLeadScore(BRAND, lead)
    expect(s.sector).toBe(90)
    expect(s.culture).toBe(90)
    expect(s.audience).toBe(50)
    expect(s.overall).toBe(computeOverall(s))
  })

  test("secteur/culture absents → neutre 50 (jamais inventé)", () => {
    const lead: LeadScoringInput = { company_name: "Inconnu" }
    const s = heuristicLeadScore(BRAND, lead)
    expect(s.sector).toBe(50)
    expect(s.culture).toBe(50)
    expect(s.audience).toBe(50)
  })

  test("secteur via industry (apollo) si lead.sector vide", () => {
    const lead: LeadScoringInput = { company_name: "X", industry: "finance_islamique" }
    expect(heuristicLeadScore(BRAND, lead).sector).toBe(90)
  })

  test("inclusion partielle → 60", () => {
    const lead: LeadScoringInput = { company_name: "X", sector: "finance" }
    // "finance_islamique" inclut "finance" après normalisation → 60
    expect(heuristicLeadScore(BRAND, lead).sector).toBe(60)
  })
})

// ─── parseLeadScore ──────────────────────────────────────────────────────────

describe("parseLeadScore", () => {
  test("JSON valide → clamp", () => {
    const r = parseLeadScore('{"audience": 80, "sector": 120, "culture": -5}')
    expect(r).toEqual({ audience: 80, sector: 100, culture: 0 })
  })
  test("JSON entouré de texte/markdown → extrait l'objet", () => {
    const r = parseLeadScore('Voici: ```json\n{"audience":70,"sector":60,"culture":50}\n``` fin')
    expect(r).toEqual({ audience: 70, sector: 60, culture: 50 })
  })
  test("champ manquant → null", () => {
    expect(parseLeadScore('{"audience": 80, "sector": 60}')).toBeNull()
  })
  test("non-numérique → null", () => {
    expect(parseLeadScore('{"audience": "x", "sector": 60, "culture": 50}')).toBeNull()
  })
  test("vide ou non-JSON → null", () => {
    expect(parseLeadScore("")).toBeNull()
    expect(parseLeadScore("pas de json")).toBeNull()
  })
})

// ─── assembleLeadScore ───────────────────────────────────────────────────────

describe("assembleLeadScore", () => {
  test("borne + overall cohérent", () => {
    const s = assembleLeadScore({ audience: 90, sector: 80, culture: 70 })
    expect(s.overall).toBe(computeOverall({ audience: 90, sector: 80, culture: 70 }))
  })
})

// ─── prompts ─────────────────────────────────────────────────────────────────

describe("prompts de scoring", () => {
  test("system prompt mentionne les 3 axes + JSON", () => {
    const sys = buildLeadScoringSystemPrompt()
    expect(sys).toContain("audience")
    expect(sys).toContain("sector")
    expect(sys).toContain("culture")
    expect(sys).toContain("JSON")
  })
  test("user prompt inclut marque et prospect", () => {
    const u = buildLeadScoringUserPrompt(BRAND, { company_name: "Banque X", sector: "finance" })
    expect(u).toContain("RAMI")
    expect(u).toContain("Banque X")
    expect(u).toContain("finance")
  })
})
