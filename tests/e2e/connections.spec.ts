import { test, expect } from "./fixtures/auth"
import { Page } from "@playwright/test"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CONNECTIONS_URL = "/dashboard/settings/connections"

const PLATFORMS = [
  { id: "twitter", label: "X (Twitter)" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "pinterest", label: "Pinterest" },
]

async function gotoConnections(page: Page) {
  await page.goto(CONNECTIONS_URL)
  await page.waitForLoadState("networkidle")
}

// ─── Structure de la page ─────────────────────────────────────────────────────

test.describe("Page /dashboard/settings/connections — Non authentifié", () => {
  test("redirect vers /login", async ({ page }) => {
    await page.goto(CONNECTIONS_URL)
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })

  test("/dashboard/settings → redirect vers /connections", async ({ page }) => {
    await page.goto("/dashboard/settings")
    // Doit finir sur /login (non auth) ou /connections (auth)
    await page.waitForLoadState("networkidle")
    const url = page.url()
    expect(url).toMatch(/\/login|\/connections/)
  })
})

test.describe("Page /dashboard/settings/connections — Authentifié", () => {
  test(
    "affiche le titre et le breadcrumb",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      await expect(page.getByRole("heading", { name: "Connexions sociales" })).toBeVisible()
      await expect(page.getByText("Paramètres · Connexions")).toBeVisible()
    }
  )

  test(
    "affiche les 5 plateformes",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      for (const platform of PLATFORMS) {
        await expect(page.getByText(platform.label)).toBeVisible()
      }
    }
  )

  test(
    "affiche un bouton Connecter pour chaque plateforme non connectée",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      const connectButtons = page.getByRole("button", { name: /connecter/i })
      await expect(connectButtons.first()).toBeVisible()
      // Nouveau compte = toutes les plateformes déconnectées
      const count = await connectButtons.count()
      expect(count).toBeGreaterThanOrEqual(5)
    }
  )

  test(
    "affiche le résumé 'sur 5 plateformes'",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      await expect(page.getByText(/sur 5 plateformes/i)).toBeVisible()
    }
  )

  test(
    "nouveau compte → 0 compte connecté",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      await expect(page.getByText(/^0 compte/i)).toBeVisible()
    }
  )

  test(
    "affiche la note de sécurité AES-256",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      await expect(page.getByText(/AES-256/i)).toBeVisible()
    }
  )

  test(
    "affiche la sous-navigation Settings (Connexions, Profil, Équipe, Notifications)",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      for (const label of ["Connexions", "Profil", "Équipe", "Notifications"]) {
        await expect(page.getByRole("link", { name: label })).toBeVisible()
      }
    }
  )

  test(
    "lien Connexions actif (style primary) sur la page courante",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      const connexionsLink = page.getByRole("link", { name: "Connexions" })
      // Le lien actif a la classe text-primary
      await expect(connexionsLink).toHaveClass(/text-primary/)
    }
  )

  test(
    "lien Paramètres visible dans la sidebar principale",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      await expect(page.getByRole("link", { name: /paramètres/i })).toBeVisible()
    }
  )
})

// ─── Feedback URL params (retour OAuth callback) ──────────────────────────────

test.describe("Feedback URL params", () => {
  test(
    "?success=connected → badge vert 'connecté avec succès'",
    async ({ authenticatedPage: page }) => {
      await page.goto(`${CONNECTIONS_URL}?success=connected`)
      await page.waitForLoadState("networkidle")
      await expect(page.getByText(/connecté avec succès/i)).toBeVisible()
    }
  )

  test(
    "?disconnected=true → badge gris 'accès a été révoqué'",
    async ({ authenticatedPage: page }) => {
      await page.goto(`${CONNECTIONS_URL}?disconnected=true`)
      await page.waitForLoadState("networkidle")
      await expect(page.getByText(/révoqué/i)).toBeVisible()
    }
  )

  test(
    "?error=token_exchange_failed → message d'erreur lisible",
    async ({ authenticatedPage: page }) => {
      await page.goto(`${CONNECTIONS_URL}?error=token_exchange_failed`)
      await page.waitForLoadState("networkidle")
      await expect(page.getByText(/token exchange failed/i)).toBeVisible()
    }
  )

  test(
    "?error=invalid_state → message d'erreur lisible",
    async ({ authenticatedPage: page }) => {
      await page.goto(`${CONNECTIONS_URL}?error=invalid_state`)
      await page.waitForLoadState("networkidle")
      await expect(page.getByText(/invalid state/i)).toBeVisible()
    }
  )

  test(
    "?error=auth_mismatch → message d'erreur lisible",
    async ({ authenticatedPage: page }) => {
      await page.goto(`${CONNECTIONS_URL}?error=auth_mismatch`)
      await page.waitForLoadState("networkidle")
      await expect(page.getByText(/auth mismatch/i)).toBeVisible()
    }
  )
})

// ─── Navigation OAuth — bouton Connecter ──────────────────────────────────────

test.describe("Bouton Connecter → flow OAuth", () => {
  test(
    "clic Connecter → navigue vers /api/oauth/[platform]/authorize",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)

      let oauthUrl = ""
      page.on("request", (req) => {
        if (req.url().includes("/api/oauth/") && req.url().includes("/authorize")) {
          oauthUrl = req.url()
        }
      })

      await page.getByRole("button", { name: /^connecter$/i }).first().click()
      await page.waitForTimeout(500)

      const isOAuth =
        oauthUrl.includes("/api/oauth/") || page.url().includes("/api/oauth/")
      expect(isOAuth).toBe(true)
    }
  )

  test(
    "chaque plateforme a un bouton Connecter distinct avec son id",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)
      // Tous les 5 boutons Connecter doivent être présents
      const btns = page.getByRole("button", { name: /^connecter$/i })
      await expect(btns).toHaveCount(5)
    }
  )
})

// ─── Sécurité routes OAuth ────────────────────────────────────────────────────

test.describe("Routes OAuth — Sécurité", () => {
  test(
    "GET /api/oauth/invalid/authorize → 400",
    async ({ authenticatedPage: page }) => {
      const res = await page.request.get("/api/oauth/invalid/authorize")
      expect(res.status()).toBe(400)
    }
  )

  test(
    "GET /api/oauth/twitter/authorize sans auth → redirect",
    async ({ page }) => {
      const res = await page.request.get("/api/oauth/twitter/authorize", {
        maxRedirects: 0,
      })
      expect([301, 302, 307, 308, 401]).toContain(res.status())
    }
  )

  test(
    "GET /api/oauth/twitter/callback sans params → redirect ?error=",
    async ({ authenticatedPage: page }) => {
      const res = await page.request.get("/api/oauth/twitter/callback", {
        maxRedirects: 0,
      })
      expect([301, 302, 307, 308]).toContain(res.status())
      expect(res.headers()["location"] ?? "").toContain("error=")
    }
  )

  test(
    "GET /api/oauth/twitter/callback state invalide → redirect ?error=",
    async ({ authenticatedPage: page }) => {
      const res = await page.request.get(
        "/api/oauth/twitter/callback?code=fake&state=INVALID",
        { maxRedirects: 0 }
      )
      expect([301, 302, 307, 308]).toContain(res.status())
      expect(res.headers()["location"] ?? "").toContain("error=")
    }
  )

  test(
    "POST /api/oauth/invalid/disconnect → 400 ou redirect erreur",
    async ({ authenticatedPage: page }) => {
      const res = await page.request.post("/api/oauth/invalid/disconnect", {
        maxRedirects: 0,
      })
      // Plateforme invalide → 400 JSON ou redirect avec error=invalid_platform
      const status = res.status()
      if (status === 400) {
        expect(status).toBe(400)
      } else {
        expect([301, 302, 307, 308]).toContain(status)
        expect(res.headers()["location"] ?? "").toContain("error=")
      }
    }
  )

  test(
    "POST /api/oauth/twitter/disconnect sans auth → redirect",
    async ({ page }) => {
      const res = await page.request.post("/api/oauth/twitter/disconnect", {
        maxRedirects: 0,
      })
      expect([301, 302, 307, 308, 401]).toContain(res.status())
    }
  )

  test(
    "POST /api/oauth/twitter/disconnect connexion inexistante → redirect erreur",
    async ({ authenticatedPage: page }) => {
      // Utilisateur authentifié mais sans connexion Twitter → connection_not_found
      const res = await page.request.post("/api/oauth/twitter/disconnect", {
        maxRedirects: 0,
      })
      expect([301, 302, 307, 308]).toContain(res.status())
      const location = res.headers()["location"] ?? ""
      expect(location).toMatch(/error=connection_not_found|error=auth/)
    }
  )
})
