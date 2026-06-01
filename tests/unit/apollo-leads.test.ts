import { mapApolloPerson, enrichViaApollo } from "@/lib/services/leads/apollo"

// ─── mapApolloPerson (pur) ───────────────────────────────────────────────────

describe("mapApolloPerson", () => {
  test("mappe un person Apollo complet", () => {
    const e = mapApolloPerson({
      title: "Directrice Marketing",
      email: "sarah@agence.ma",
      linkedin_url: "https://linkedin.com/in/sarah",
      city: "Casablanca",
      state: "Casablanca-Settat",
      country: "Maroc",
      organization: {
        name: "Agence Digitale X",
        industry: "marketing",
        estimated_num_employees: 25,
        website_url: "https://agence.ma",
      },
    })
    expect(e.title).toBe("Directrice Marketing")
    expect(e.organization).toBe("Agence Digitale X")
    expect(e.email).toBe("sarah@agence.ma")
    expect(e.linkedin_url).toBe("https://linkedin.com/in/sarah")
    expect(e.industry).toBe("marketing")
    expect(e.company_size).toBe("25")
    expect(e.location).toBe("Casablanca, Casablanca-Settat, Maroc")
  })

  test("fallback headline pour le titre + organization_name", () => {
    const e = mapApolloPerson({ headline: "Consultant indépendant", organization_name: "Solo Inc" })
    expect(e.title).toBe("Consultant indépendant")
    expect(e.organization).toBe("Solo Inc")
  })

  test("person minimal → null partout, location null", () => {
    const e = mapApolloPerson({})
    expect(e.title).toBeNull()
    expect(e.organization).toBeNull()
    expect(e.email).toBeNull()
    expect(e.linkedin_url).toBeNull()
    expect(e.industry).toBeNull()
    expect(e.company_size).toBeNull()
    expect(e.location).toBeNull()
  })

  test("location partielle (pays seul)", () => {
    expect(mapApolloPerson({ country: "Maroc" }).location).toBe("Maroc")
  })

  test("estimated_num_employees non numérique ignoré", () => {
    const e = mapApolloPerson({ organization: { name: "X", estimated_num_employees: null } })
    expect(e.company_size).toBeNull()
  })
})

// ─── enrichViaApollo ─────────────────────────────────────────────────────────

describe("enrichViaApollo", () => {
  const ORIGINAL_KEY = process.env.APOLLO_API_KEY
  const ORIGINAL_FETCH = global.fetch

  afterEach(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.APOLLO_API_KEY
    else process.env.APOLLO_API_KEY = ORIGINAL_KEY
    global.fetch = ORIGINAL_FETCH
  })

  test("sans clé API → reason no_key (dégradation propre)", async () => {
    delete process.env.APOLLO_API_KEY
    const r = await enrichViaApollo({ name: "Sarah" })
    expect(r).toEqual({ success: false, reason: "no_key" })
  })

  test("aucun critère de recherche → not_found sans appel réseau", async () => {
    process.env.APOLLO_API_KEY = "test-key"
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    const r = await enrichViaApollo({})
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("not_found")
    expect(spy).not.toHaveBeenCalled()
  })

  test("réponse sans person → not_found", async () => {
    process.env.APOLLO_API_KEY = "test-key"
    global.fetch = (async () =>
      new Response(JSON.stringify({ person: null }), { status: 200 })) as unknown as typeof fetch
    const r = await enrichViaApollo({ email: "x@y.com" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("not_found")
  })

  test("réponse OK avec person → success + mapping", async () => {
    process.env.APOLLO_API_KEY = "test-key"
    global.fetch = (async () =>
      new Response(
        JSON.stringify({ person: { title: "CEO", organization: { name: "Acme" } } }),
        { status: 200 }
      )) as unknown as typeof fetch
    const r = await enrichViaApollo({ name: "John", organization: "Acme" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.title).toBe("CEO")
      expect(r.data.organization).toBe("Acme")
    }
  })

  test("HTTP non-ok → reason error", async () => {
    process.env.APOLLO_API_KEY = "test-key"
    global.fetch = (async () => new Response("nope", { status: 422 })) as unknown as typeof fetch
    const r = await enrichViaApollo({ email: "x@y.com" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("error")
  })
})
