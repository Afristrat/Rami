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

test.describe("Page /dashboard/settings/connections — Structure", () => {
  test("redirect vers /login si non authentifié", async ({ page }) => {
    await page.goto(CONNECTIONS_URL)
    await page.waitForURL(/\/login/)
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("Page /dashboard/settings/connections — Authentifié", () => {
  test(
    "affiche le titre et le breadcrumb",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)

      await expect(
        page.getByRole("heading", { name: "Connexions sociales" })
      ).toBeVisible()
      await expect(page.getByText("Paramètres · Connexions")).toBeVisible()
    }
  )

  test(
    "affiche les 5 plateformes (Twitter, LinkedIn, Instagram, Facebook, Pinterest)",
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
      // Au moins 1 bouton Connecter présent (toutes les plateformes déconnectées par défaut)
      await expect(connectButtons.first()).toBeVisible()
    }
  )

  test(
    "affiche le résumé du nombre de comptes connectés",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)

      // Le résumé affiche "X compte(s) connecté(s) sur 5 plateformes"
      await expect(page.getByText(/sur 5 plateformes/i)).toBeVisible()
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
    "bouton Connecter redirige vers /api/oauth/[platform]/authorize",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)

      // Intercepter la navigation sans réellement quitter la page
      let redirectUrl = ""
      page.on("request", (req) => {
        if (req.url().includes("/api/oauth/") && req.url().includes("/authorize")) {
          redirectUrl = req.url()
        }
      })

      // Cliquer sur le premier bouton Connecter (Twitter)
      const firstConnectBtn = page
        .getByRole("button", { name: /connecter/i })
        .first()
      await firstConnectBtn.click()

      // Attendre que la navigation commence
      await page.waitForTimeout(500)

      // Vérifier qu'une requête vers /api/oauth/.../authorize a été émise
      // ou que l'URL contient authorize
      const currentUrl = page.url()
      const navigatedToOAuth =
        redirectUrl.includes("/api/oauth/") || currentUrl.includes("/api/oauth/")
      expect(navigatedToOAuth).toBe(true)
    }
  )

  test(
    "badge succès affiché si URL contient ?success=connected",
    async ({ authenticatedPage: page }) => {
      await page.goto(`${CONNECTIONS_URL}?success=connected`)
      await page.waitForLoadState("networkidle")

      await expect(page.getByText(/connecté avec succès/i)).toBeVisible()
    }
  )

  test(
    "badge erreur affiché si URL contient ?error=token_exchange_failed",
    async ({ authenticatedPage: page }) => {
      await page.goto(`${CONNECTIONS_URL}?error=token_exchange_failed`)
      await page.waitForLoadState("networkidle")

      await expect(page.getByText(/token exchange failed/i)).toBeVisible()
    }
  )

  test(
    "lien Connexions visible dans la sidebar",
    async ({ authenticatedPage: page }) => {
      await gotoConnections(page)

      await expect(
        page.getByRole("link", { name: /connexions/i })
      ).toBeVisible()
    }
  )
})

// ─── Sécurité OAuth ───────────────────────────────────────────────────────────

test.describe("Routes OAuth — Sécurité", () => {
  test(
    "GET /api/oauth/invalid/authorize → 400",
    async ({ authenticatedPage: page }) => {
      const res = await page.request.get("/api/oauth/invalid/authorize")
      expect(res.status()).toBe(400)
    }
  )

  test(
    "GET /api/oauth/twitter/authorize sans auth → redirect /login",
    async ({ page }) => {
      // Non authentifié — pas de cookie de session
      const res = await page.request.get("/api/oauth/twitter/authorize", {
        maxRedirects: 0,
      })
      // Redirige (302) ou retourne 401
      expect([301, 302, 307, 308, 401]).toContain(res.status())
    }
  )

  test(
    "GET /api/oauth/twitter/callback sans state → redirect avec erreur",
    async ({ authenticatedPage: page }) => {
      const res = await page.request.get("/api/oauth/twitter/callback?code=fake", {
        maxRedirects: 0,
      })
      // Doit rediriger avec ?error= (pas de state = invalide)
      expect([301, 302, 307, 308]).toContain(res.status())
      const location = res.headers()["location"] ?? ""
      expect(location).toContain("error=")
    }
  )

  test(
    "GET /api/oauth/twitter/callback avec state invalide → redirect erreur",
    async ({ authenticatedPage: page }) => {
      const res = await page.request.get(
        "/api/oauth/twitter/callback?code=fake&state=invalidstate123",
        { maxRedirects: 0 }
      )
      expect([301, 302, 307, 308]).toContain(res.status())
      const location = res.headers()["location"] ?? ""
      expect(location).toContain("error=")
    }
  )
})
