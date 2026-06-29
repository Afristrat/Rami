import { test, expect } from "@playwright/test"

// ============================================================
// US-052 — E2E API publique v1 des visuels.
// Le contrat d'AUTHENTIFICATION (401) est testé sans coût ni génération.
// Le happy path GÉNÉRATIF (201 + QA + preview) consomme un provider d'images
// payant → exécuté UNIQUEMENT si RAMI_TEST_API_KEY est fourni (clé scope
// visuals:write d'un tenant de test), sinon skippé proprement.
// ============================================================

const ENDPOINT = "/api/v1/visuals/generate"
const BODY = { type: "image", format: "1:1", content: { brief: "Lancement produit, ton confiant et premium." } }

test.describe("API v1 visuels — authentification", () => {
  test("401 sans clé API", async ({ request }) => {
    const res = await request.post(ENDPOINT, { data: BODY })
    expect(res.status()).toBe(401)
  })

  test("401 avec clé API invalide", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: "Bearer rami_sk_invalide_0000000000" },
      data: BODY,
    })
    expect(res.status()).toBe(401)
  })

  test("422 si corps invalide (clé valide requise)", async ({ request }) => {
    const key = process.env.RAMI_TEST_API_KEY
    test.skip(!key, "RAMI_TEST_API_KEY absent : validation de corps non testée bout-en-bout")
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: `Bearer ${key}` },
      data: { type: "hologram", format: "1:1", content: {} },
    })
    expect(res.status()).toBe(422)
  })
})

test.describe("API v1 visuels — boucle QA (clé réelle)", () => {
  test("génère un carrousel → 201 + manifeste + QA + preview", async ({ request }) => {
    const key = process.env.RAMI_TEST_API_KEY
    test.skip(!key, "RAMI_TEST_API_KEY absent : happy path génératif non exécuté")
    const auth = { Authorization: `Bearer ${key}` }

    const gen = await request.post(ENDPOINT, {
      headers: auth,
      data: { type: "carousel", format: "4:5", content: { brief: "5 leviers pour fiabiliser vos négociations B2B." } },
    })
    expect(gen.status()).toBe(201)
    const body = await gen.json()
    expect(body.visual_id).toBeTruthy()
    expect(body.manifest.format).toBe("4:5")
    expect(body.qa).toHaveProperty("passed")

    const qa = await request.get(`/api/v1/visuals/${body.visual_id}/qa`, { headers: auth })
    expect(qa.status()).toBe(200)

    const preview = await request.get(`/api/v1/visuals/${body.visual_id}/preview`, { headers: auth })
    expect(preview.status()).toBe(200)
    const previewBody = await preview.json()
    expect(Array.isArray(previewBody.slides)).toBe(true)
  })
})
