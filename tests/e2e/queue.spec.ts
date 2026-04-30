/**
 * Tests E2E — Queue de publication pg-boss
 * Conforme CLAUDE.md Section 5.3 : parcours critiques publishing
 *
 * Ces tests vérifient :
 *  - L'API /api/queue/publish (auth, validation, enqueue)
 *  - La gestion des erreurs explicites par plateforme
 */

import { test, expect } from "@playwright/test"

// ── Configuration ──────────────────────────────────────────────────────────

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"

// ── Tests API /api/queue/publish ───────────────────────────────────────────

test.describe("API /api/queue/publish", () => {
  test("Rejet sans auth → 401", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: { postId: "00000000-0000-0000-0000-000000000001" },
    })
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty("error")
  })

  test("Body JSON invalide → 400 ou 401", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      headers: { "Content-Type": "text/plain" },
      data: "not json",
    })
    expect([400, 401]).toContain(res.status())
  })

  test("postId non-UUID → 401 ou 422", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: { postId: "not-a-uuid" },
    })
    expect([401, 422]).toContain(res.status())
  })
})

// ── Tests de l'interface Publier ───────────────────────────────────────────

test.describe("Interface de publication", () => {
  test("Page calendrier requiert authentification", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/calendar`)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("API /api/queue/publish accepte POST (pas 404 ni 405)", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: { postId: "00000000-0000-0000-0000-000000000001" },
    })
    expect(res.status()).not.toBe(404)
    expect(res.status()).not.toBe(405)
  })

  test("API /api/queue/publish refuse GET", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/queue/publish`)
    expect(res.status()).toBe(405)
  })
})

// ── Tests de sécurité ─────────────────────────────────────────────────────

test.describe("Sécurité queue publish", () => {
  test("Injection SQL dans postId → rejeté proprement (jamais 500)", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: { postId: "'; DROP TABLE posts; --" },
    })
    expect([401, 422]).toContain(res.status())
    expect(res.status()).not.toBe(500)
  })

  test("postId d'un autre tenant → 401 ou 404 (isolation)", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: { postId: "ffffffff-ffff-ffff-ffff-ffffffffffff" },
    })
    expect([401, 404]).toContain(res.status())
  })

  test("scheduledAt dans le passé → pas d'erreur serveur", async ({ request }) => {
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: {
        postId: "00000000-0000-0000-0000-000000000001",
        scheduledAt: pastDate,
      },
    })
    expect([401, 404, 409]).toContain(res.status())
  })
})

// ── Tests de robustesse ───────────────────────────────────────────────────

test.describe("Robustesse et messages d'erreur", () => {
  test("Réponse JSON structurée sur les erreurs API", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: { postId: "not-valid" },
    })
    const body = await res.json()
    expect(body).toBeDefined()
    expect(typeof body).toBe("object")
  })

  test("API retourne un champ erreur explicite", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: { postId: "invalid" },
    })
    const body = await res.json()
    const hasErrorField = "error" in body || "message" in body || "details" in body
    expect(hasErrorField).toBe(true)
  })

  test("scheduledAt mal formé → 401 ou 422", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/queue/publish`, {
      data: {
        postId: "00000000-0000-0000-0000-000000000001",
        scheduledAt: "not-a-date",
      },
    })
    expect([401, 422]).toContain(res.status())
  })
})
