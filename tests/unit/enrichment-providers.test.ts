import { mapPdlData, enrichViaPdl } from "@/lib/services/leads/pdl"
import { mapDropcontactContact, enrichViaDropcontact } from "@/lib/services/leads/dropcontact"
import { mapEnrichData, enrichViaEnrich } from "@/lib/services/leads/enrich"
import { getActiveEnrichmentProvider } from "@/lib/services/leads"

const ORIGINAL_FETCH = global.fetch
afterEach(() => {
  global.fetch = ORIGINAL_FETCH
})

// ─── PDL ─────────────────────────────────────────────────────────────────────

describe("mapPdlData", () => {
  test("mappe une réponse PDL complète", () => {
    const e = mapPdlData({
      full_name: "Aaron Levie",
      job_title: "CEO",
      job_company_name: "Box",
      work_email: "aaron@box.com",
      linkedin_url: "https://linkedin.com/in/aaronlevie",
      job_company_industry: "Software",
      job_company_size: "1001-5000",
      location_name: "San Francisco, California",
    })
    expect(e.email).toBe("aaron@box.com")
    expect(e.title).toBe("CEO")
    expect(e.organization).toBe("Box")
    expect(e.industry).toBe("Software")
    expect(e.company_size).toBe("1001-5000")
    expect(e.location).toBe("San Francisco, California")
  })

  test("fallback work_email → personal_emails", () => {
    const e = mapPdlData({ personal_emails: ["x@y.com"] })
    expect(e.email).toBe("x@y.com")
  })

  test("réponse minimale → nulls", () => {
    const e = mapPdlData({ full_name: "Jane Doe" })
    expect(e.email).toBeNull()
    expect(e.title).toBeNull()
    expect(e.organization).toBeNull()
  })
})

describe("enrichViaPdl", () => {
  test("sans clé → no_key", async () => {
    const r = await enrichViaPdl({ name: "Aaron Levie", organization: "Box" }, undefined)
    expect(r).toEqual({ success: false, reason: "no_key" })
  })

  test("critères insuffisants → not_found sans réseau", async () => {
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    const r = await enrichViaPdl({ name: "Aaron" }, "k")
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("not_found")
    expect(spy).not.toHaveBeenCalled()
  })

  test("succès (mock) → mapping + critères nom+entreprise", async () => {
    let calledUrl = ""
    global.fetch = (async (url: string) => {
      calledUrl = url
      return new Response(
        JSON.stringify({ status: 200, data: { job_title: "CEO", job_company_name: "Box", work_email: "a@box.com" } }),
        { status: 200 }
      )
    }) as unknown as typeof fetch
    const r = await enrichViaPdl({ firstName: "Aaron", lastName: "Levie", organization: "Box" }, "k")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe("a@box.com")
    expect(calledUrl).toContain("first_name=Aaron")
    expect(calledUrl).toContain("company=Box")
  })

  test("HTTP 404 → not_found ; 401 → no_key ; 500 → error", async () => {
    global.fetch = (async () => new Response("", { status: 404 })) as unknown as typeof fetch
    const r1 = await enrichViaPdl({ email: "a@box.com" }, "k")
    expect(r1.success).toBe(false); if (!r1.success) expect(r1.reason).toBe("not_found")

    global.fetch = (async () => new Response("", { status: 401 })) as unknown as typeof fetch
    const r2 = await enrichViaPdl({ email: "a@box.com" }, "k")
    expect(r2.success).toBe(false); if (!r2.success) expect(r2.reason).toBe("no_key")

    global.fetch = (async () => new Response("", { status: 500 })) as unknown as typeof fetch
    const r3 = await enrichViaPdl({ email: "a@box.com" }, "k")
    expect(r3.success).toBe(false); if (!r3.success) expect(r3.reason).toBe("error")
  })
})

// ─── Dropcontact ─────────────────────────────────────────────────────────────

describe("mapDropcontactContact", () => {
  test("mappe un contact complet + premier email qualifié", () => {
    const e = mapDropcontactContact({
      email: [{ email: "aaron@box.com", qualification: "nominative@pro" }],
      job: "CEO",
      company: "Box",
      industry: "Software",
      nb_employees: "1000",
      country: "France",
      linkedin: "https://linkedin.com/in/x",
    })
    expect(e.email).toBe("aaron@box.com")
    expect(e.title).toBe("CEO")
    expect(e.organization).toBe("Box")
    expect(e.company_size).toBe("1000")
    expect(e.location).toBe("France")
  })

  test("email vide → null", () => {
    const e = mapDropcontactContact({ email: [], company: "Box" })
    expect(e.email).toBeNull()
    expect(e.organization).toBe("Box")
  })
})

describe("enrichViaDropcontact", () => {
  test("sans clé → no_key", async () => {
    const r = await enrichViaDropcontact({ name: "Aaron Levie", organization: "Box" }, undefined)
    expect(r).toEqual({ success: false, reason: "no_key" })
  })

  test("critères insuffisants → not_found sans réseau", async () => {
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    const r = await enrichViaDropcontact({ name: "Aaron" }, "k")
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("not_found")
    expect(spy).not.toHaveBeenCalled()
  })

  test("submit + poll prêt immédiat → success", async () => {
    let call = 0
    global.fetch = (async () => {
      call++
      if (call === 1) {
        return new Response(JSON.stringify({ error: false, request_id: "req_1", success: true }), { status: 200 })
      }
      return new Response(
        JSON.stringify({ success: true, error: false, data: [{ job: "CEO", company: "Box", email: [{ email: "a@box.com" }] }] }),
        { status: 200 }
      )
    }) as unknown as typeof fetch
    const r = await enrichViaDropcontact({ name: "Aaron Levie", organization: "Box" }, "k", { pollDelayMs: 0 })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.email).toBe("a@box.com")
    expect(call).toBe(2)
  })

  test("poll « not ready » puis prêt → success (sans attente)", async () => {
    let call = 0
    global.fetch = (async () => {
      call++
      if (call === 1) return new Response(JSON.stringify({ request_id: "req_2", success: true }), { status: 200 })
      if (call === 2) return new Response(JSON.stringify({ success: false, reason: "not ready yet" }), { status: 200 })
      return new Response(JSON.stringify({ success: true, data: [{ company: "Box", email: [{ email: "a@box.com" }] }] }), { status: 200 })
    }) as unknown as typeof fetch
    const r = await enrichViaDropcontact({ name: "Aaron Levie", organization: "Box" }, "k", { pollDelayMs: 0, maxPolls: 3 })
    expect(r.success).toBe(true)
    expect(call).toBe(3)
  })

  test("submit 403 → no_key", async () => {
    global.fetch = (async () => new Response("", { status: 403 })) as unknown as typeof fetch
    const r = await enrichViaDropcontact({ name: "Aaron Levie", organization: "Box" }, "k", { pollDelayMs: 0 })
    expect(r.success).toBe(false); if (!r.success) expect(r.reason).toBe("no_key")
  })

  test("jamais prêt → error après maxPolls", async () => {
    global.fetch = (async (url: string) => {
      if (url.endsWith("/enrich/all")) return new Response(JSON.stringify({ request_id: "req_3" }), { status: 200 })
      return new Response(JSON.stringify({ success: false, reason: "not ready" }), { status: 200 })
    }) as unknown as typeof fetch
    const r = await enrichViaDropcontact({ name: "Aaron Levie", organization: "Box" }, "k", { pollDelayMs: 0, maxPolls: 2 })
    expect(r.success).toBe(false); if (!r.success) expect(r.reason).toBe("error")
  })
})

// ─── Enrich.so ───────────────────────────────────────────────────────────────

describe("mapEnrichData", () => {
  test("mappe (variantes de champs) racine", () => {
    const e = mapEnrichData({
      email: "a@box.com",
      job_title: "CEO",
      company_name: "Box",
      linkedin: "https://linkedin.com/in/x",
      industry: "Software",
      location_name: "Paris",
    })
    expect(e.email).toBe("a@box.com")
    expect(e.title).toBe("CEO")
    expect(e.organization).toBe("Box")
    expect(e.linkedin_url).toBe("https://linkedin.com/in/x")
    expect(e.location).toBe("Paris")
  })

  test("réponse minimale → nulls", () => {
    const e = mapEnrichData({ name: "Jane" })
    expect(e.email).toBeNull()
    expect(e.organization).toBeNull()
  })
})

describe("enrichViaEnrich", () => {
  test("sans clé → no_key", async () => {
    const r = await enrichViaEnrich({ email: "a@box.com" }, undefined)
    expect(r).toEqual({ success: false, reason: "no_key" })
  })

  test("sans email → not_found sans réseau", async () => {
    const spy = jest.fn()
    global.fetch = spy as unknown as typeof fetch
    const r = await enrichViaEnrich({ name: "Aaron" }, "k")
    expect(r.success).toBe(false)
    if (!r.success) expect(r.reason).toBe("not_found")
    expect(spy).not.toHaveBeenCalled()
  })

  test("succès (réponse imbriquée data) → mapping + Bearer", async () => {
    let calledHeaders: Record<string, string> = {}
    global.fetch = (async (_url: string, init: RequestInit) => {
      calledHeaders = init.headers as Record<string, string>
      return new Response(JSON.stringify({ data: { email: "a@box.com", title: "CEO", company: "Box" } }), { status: 200 })
    }) as unknown as typeof fetch
    const r = await enrichViaEnrich({ email: "a@box.com" }, "k")
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.title).toBe("CEO")
    expect(calledHeaders.Authorization).toBe("Bearer k")
  })

  test("HTTP 401 → no_key ; 404 → not_found ; 500 → error", async () => {
    global.fetch = (async () => new Response("", { status: 401 })) as unknown as typeof fetch
    const r1 = await enrichViaEnrich({ email: "a@box.com" }, "k")
    expect(r1.success).toBe(false); if (!r1.success) expect(r1.reason).toBe("no_key")

    global.fetch = (async () => new Response("", { status: 404 })) as unknown as typeof fetch
    const r2 = await enrichViaEnrich({ email: "a@box.com" }, "k")
    expect(r2.success).toBe(false); if (!r2.success) expect(r2.reason).toBe("not_found")

    global.fetch = (async () => new Response("", { status: 500 })) as unknown as typeof fetch
    const r3 = await enrichViaEnrich({ email: "a@box.com" }, "k")
    expect(r3.success).toBe(false); if (!r3.success) expect(r3.reason).toBe("error")
  })

  test("data sans champs utiles → not_found", async () => {
    global.fetch = (async () => new Response(JSON.stringify({ data: { foo: "bar" } }), { status: 200 })) as unknown as typeof fetch
    const r = await enrichViaEnrich({ email: "a@box.com" }, "k")
    expect(r.success).toBe(false); if (!r.success) expect(r.reason).toBe("not_found")
  })
})

// ─── getActiveEnrichmentProvider (providers étendus) ─────────────────────────

describe("getActiveEnrichmentProvider — providers étendus", () => {
  const ORIG = process.env.LEADS_ENRICHMENT_PROVIDER
  afterEach(() => {
    if (ORIG === undefined) delete process.env.LEADS_ENRICHMENT_PROVIDER
    else process.env.LEADS_ENRICHMENT_PROVIDER = ORIG
  })

  test.each(["pdl", "dropcontact", "enrich"])("'%s' reconnu", (p) => {
    process.env.LEADS_ENRICHMENT_PROVIDER = p
    expect(getActiveEnrichmentProvider()).toBe(p)
  })

  test("casse insensible (PDL → pdl)", () => {
    process.env.LEADS_ENRICHMENT_PROVIDER = "PDL"
    expect(getActiveEnrichmentProvider()).toBe("pdl")
  })

  test("valeur inconnue → apollo", () => {
    process.env.LEADS_ENRICHMENT_PROVIDER = "xyz"
    expect(getActiveEnrichmentProvider()).toBe("apollo")
  })
})
