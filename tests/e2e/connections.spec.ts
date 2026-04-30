import { test, expect } from "@playwright/test"

const CONNECTIONS_URL = "/dashboard/settings/connections"

// ─── Structure de la page ─────────────────────────────────────────────────────

test.describe("Page /dashboard/settings/connections — Non authentifié", () => {
  test("redirect vers /login", async ({ page }) => {
    await page.goto(CONNECTIONS_URL)
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test("/dashboard/settings → redirect vers /login", async ({ page }) => {
    await page.goto("/dashboard/settings")
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ─── Sécurité routes OAuth ────────────────────────────────────────────────────

test.describe("Routes OAuth — Sécurité", () => {
  test("GET /api/oauth/twitter/authorize sans auth → redirect ou 401", async ({ page }) => {
    const res = await page.request.get("/api/oauth/twitter/authorize", {
      maxRedirects: 0,
    })
    expect([301, 302, 307, 308, 401]).toContain(res.status())
  })

  test("GET /api/oauth/twitter/callback sans params → redirect avec erreur", async ({ page }) => {
    const res = await page.request.get("/api/oauth/twitter/callback", {
      maxRedirects: 0,
    })
    // Either redirects with error param or returns an error status
    const status = res.status()
    if ([301, 302, 307, 308].includes(status)) {
      expect(res.headers()["location"] ?? "").toContain("error=")
    } else {
      expect([400, 401]).toContain(status)
    }
  })

  test("POST /api/oauth/twitter/disconnect sans auth → redirect ou 401", async ({ page }) => {
    const res = await page.request.post("/api/oauth/twitter/disconnect", {
      maxRedirects: 0,
    })
    expect([301, 302, 307, 308, 401]).toContain(res.status())
  })
})
