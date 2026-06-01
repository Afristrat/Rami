import { mapHunterData, enrichViaHunter } from "@/lib/services/leads/hunter"
import { getActiveEnrichmentProvider } from "@/lib/services/leads"

// ─── mapHunterData (pur) ─────────────────────────────────────────────────────

describe("mapHunterData", () => {
  test("mappe une réponse Hunter complète", () => {
    const e = mapHunterData({
      email: "aaron@box.com",
      score: 97,
      position: "CEO",
      company: "Box",
      linkedin_url: "https://linkedin.com/in/aaronlevie",
    })
    expect(e.email).toBe("aaron@box.com")
    expect(e.title).toBe("CEO")
    expect(e.organization).toBe("Box")
    expect(e.linkedin_url).toBe("https://linkedin.com/in/aaronlevie")
    expect(e.company_size).toBeNull()
    expect(e.location).toBeNull()
  })

  test("réponse minimale → nulls", () => {
    const e = mapHunterData({ email: "x@y.com" })
    expect(e.email).toBe("x@y.com")
    expect(e.title).toBeNull()
    expect(e.organization).toBeNull()
  })
})

// ─── enrichViaHunter ─────────────────────────────────────────────────────────

describe("enrichViaHunter", () => {
  const ORIGINAL_FETCH = global.fetch
  afterEach(() => { global.fetch = ORIGINAL_FETCH })

  test("sans clé → no_key", async () => {
    const r = await enrichViaHunter({ name: "Aaron Levie", organization: "Box" }, undefined)
    expect(r).toEqual({ success: false, reason: "no_key" })
  })

  test("critères insuffisants (pas d'entreprise/domaine) → not_found sans réseau", async () => {
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    const r = await enrichViaHunter({ name: "Aaron Levie" }, "k")
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("not_found")
    expect(spy).not.toHaveBeenCalled()
  })

  test("succès (mock) → mapping + déduction prénom/nom + company", async () => {
    let calledUrl = ""
    global.fetch = (async (url: string) => {
      calledUrl = url
      return new Response(JSON.stringify({ data: { email: "aaron@box.com", position: "CEO", company: "Box" } }), { status: 200 })
    }) as unknown as typeof fetch
    const r = await enrichViaHunter({ name: "Aaron Levie", organization: "Box" }, "k")
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.email).toBe("aaron@box.com")
      expect(r.data.title).toBe("CEO")
    }
    expect(calledUrl).toContain("first_name=Aaron")
    expect(calledUrl).toContain("last_name=Levie")
    expect(calledUrl).toContain("company=Box")
  })

  test("domaine déduit de l'email quand présent", async () => {
    let calledUrl = ""
    global.fetch = (async (url: string) => {
      calledUrl = url
      return new Response(JSON.stringify({ data: { email: "j@acme.io" } }), { status: 200 })
    }) as unknown as typeof fetch
    await enrichViaHunter({ firstName: "Jane", lastName: "Doe", email: "j@acme.io" }, "k")
    expect(calledUrl).toContain("domain=acme.io")
  })

  test("data sans email → not_found", async () => {
    global.fetch = (async () => new Response(JSON.stringify({ data: {} }), { status: 200 })) as unknown as typeof fetch
    const r = await enrichViaHunter({ name: "Aaron Levie", organization: "Box" }, "k")
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("not_found")
  })

  test("HTTP 401 → no_key ; autre HTTP → error", async () => {
    global.fetch = (async () => new Response("", { status: 401 })) as unknown as typeof fetch
    const r1 = await enrichViaHunter({ lastName: "Doe", organization: "Box" }, "k")
    expect(r1.success).toBe(false); if (!r1.success) expect(r1.reason).toBe("no_key")

    global.fetch = (async () => new Response("", { status: 500 })) as unknown as typeof fetch
    const r2 = await enrichViaHunter({ lastName: "Doe", organization: "Box" }, "k")
    expect(r2.success).toBe(false); if (!r2.success) expect(r2.reason).toBe("error")
  })
})

// ─── getActiveEnrichmentProvider ─────────────────────────────────────────────

describe("getActiveEnrichmentProvider", () => {
  const ORIG = process.env.LEADS_ENRICHMENT_PROVIDER
  afterEach(() => {
    if (ORIG === undefined) delete process.env.LEADS_ENRICHMENT_PROVIDER
    else process.env.LEADS_ENRICHMENT_PROVIDER = ORIG
  })

  test("défaut = apollo", () => {
    delete process.env.LEADS_ENRICHMENT_PROVIDER
    expect(getActiveEnrichmentProvider()).toBe("apollo")
  })
  test("'hunter' → hunter", () => {
    process.env.LEADS_ENRICHMENT_PROVIDER = "hunter"
    expect(getActiveEnrichmentProvider()).toBe("hunter")
  })
  test("valeur inconnue → apollo", () => {
    process.env.LEADS_ENRICHMENT_PROVIDER = "xyz"
    expect(getActiveEnrichmentProvider()).toBe("apollo")
  })
})
