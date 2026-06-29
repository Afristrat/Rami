// ============================================================
// US-052 — Routes API v1 visuels. Auth, scope, génération et DB sont mockés :
// on teste le contrat HTTP (statuts + corps) et l'isolation tenant.
// ============================================================

import { NextResponse } from "next/server"

const mockAuth = jest.fn()
const mockRequireScopes = jest.fn((..._a: unknown[]) => null)
const mockGenerateAndEvaluate = jest.fn()
let mockDbSingle: { data: unknown; error: unknown } = { data: null, error: null }

jest.mock("@/lib/api/auth", () => ({
  authenticateApiRequest: (...a: unknown[]) => mockAuth(...a),
  requireScopes: (...a: unknown[]) => mockRequireScopes(...a),
}))
jest.mock("@/lib/services/visuals/api-helpers", () => ({
  generateAndEvaluate: (...a: unknown[]) => mockGenerateAndEvaluate(...a),
}))
jest.mock("@/lib/supabase/service", () => {
  const chain: Record<string, unknown> = {}
  for (const m of ["from", "insert", "select", "update", "eq"]) chain[m] = () => chain
  chain.single = async () => mockDbSingle
  chain.maybeSingle = async () => mockDbSingle
  return { createServiceClient: () => chain }
})

import { POST as generatePOST } from "@/app/api/v1/visuals/generate/route"
import { GET as getById } from "@/app/api/v1/visuals/[id]/route"
import { POST as regeneratePOST } from "@/app/api/v1/visuals/[id]/regenerate/route"

function req(body?: unknown): import("next/server").NextRequest {
  return new Request("http://localhost/api/v1/visuals/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest
}

const okAuth = { ok: true, ctx: { tenantId: "t1", plan: "agency_plus", scopes: ["visuals:write"], keyId: "k1" } }

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireScopes.mockReturnValue(null)
  mockDbSingle = { data: null, error: null }
})

describe("POST /api/v1/visuals/generate", () => {
  it("401 si non authentifié", async () => {
    mockAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: "x" }, { status: 401 }) })
    const res = await generatePOST(req({ type: "image", format: "1:1", content: { brief: "xxxxxxxxxx" } }))
    expect(res.status).toBe(401)
  })

  it("422 si corps invalide (type inconnu)", async () => {
    mockAuth.mockResolvedValue(okAuth)
    const res = await generatePOST(req({ type: "hologram", format: "1:1", content: {} }))
    expect(res.status).toBe(422)
  })

  it("201 + visual_id + qa au happy path", async () => {
    mockAuth.mockResolvedValue(okAuth)
    mockGenerateAndEvaluate.mockResolvedValue({
      gen: { manifest: { type: "image", format: "1:1", width: 1080, height: 1080, fonts_embedded: true, slides: 1, mime: "image/webp" }, slides: [{ n: 0, minio_path: "m", public_url: "u" }], sourceText: "", brandDnaSnapshot: { accent: "#1D4ED8" } },
      qa: { passed: true, gates: [], brandPreflightScore: 100 },
    })
    mockDbSingle = { data: { id: "v1", status: "ready" }, error: null }
    const res = await generatePOST(req({ type: "image", format: "1:1", content: { brief: "un brief assez long" } }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.visual_id).toBe("v1")
    expect(json.qa.passed).toBe(true)
  })

  it("500 si la génération échoue", async () => {
    mockAuth.mockResolvedValue(okAuth)
    mockGenerateAndEvaluate.mockRejectedValue(new Error("provider down"))
    const res = await generatePOST(req({ type: "image", format: "1:1", content: { brief: "un brief assez long" } }))
    expect(res.status).toBe(500)
  })
})

describe("GET /api/v1/visuals/[id]", () => {
  it("404 si introuvable / autre tenant", async () => {
    mockAuth.mockResolvedValue(okAuth)
    mockDbSingle = { data: null, error: null }
    const res = await getById(req(), { params: Promise.resolve({ id: "vX" }) })
    expect(res.status).toBe(404)
  })

  it("200 + manifest si trouvé", async () => {
    mockAuth.mockResolvedValue(okAuth)
    mockDbSingle = { data: { id: "v1", type: "image", format: "1:1", status: "ready", manifest: { width: 1080 } }, error: null }
    const res = await getById(req(), { params: Promise.resolve({ id: "v1" }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.visual_id).toBe("v1")
    expect(json.status).toBe("ready")
  })
})

describe("POST /api/v1/visuals/[id]/regenerate", () => {
  it("422 si defects manquants", async () => {
    mockAuth.mockResolvedValue(okAuth)
    const res = await regeneratePOST(req({ defects: [] }), { params: Promise.resolve({ id: "v1" }) })
    expect(res.status).toBe(422)
  })

  it("404 si le visuel n'existe pas", async () => {
    mockAuth.mockResolvedValue(okAuth)
    mockDbSingle = { data: null, error: null }
    const res = await regeneratePOST(req({ defects: [{ type: "chrome", desc: "file://" }] }), { params: Promise.resolve({ id: "vX" }) })
    expect(res.status).toBe(404)
  })

  it("200 après régénération", async () => {
    mockAuth.mockResolvedValue(okAuth)
    mockDbSingle = { data: { id: "v1", type: "image", format: "1:1", content: { brief: "x" } }, error: null }
    mockGenerateAndEvaluate.mockResolvedValue({
      gen: { manifest: { width: 1080, height: 1080 }, slides: [], sourceText: "", brandDnaSnapshot: {} },
      qa: { passed: true, gates: [], brandPreflightScore: 100 },
    })
    const res = await regeneratePOST(req({ defects: [{ type: "chrome", desc: "file://" }] }), { params: Promise.resolve({ id: "v1" }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe("ready")
  })
})
