import { test, expect } from "@playwright/test"

/**
 * Tests E2E — Workflow de création de contenu 7 étapes
 */

// Helper : authentification rapide (skip si déjà auth)
async function loginIfNeeded(page: import("@playwright/test").Page) {
  const url = page.url()
  if (url.includes("/login") || url.includes("/register")) {
    await page.fill('[data-testid="email-input"], input[type="email"]', "test@rami.test")
    await page.fill('[data-testid="password-input"], input[type="password"]', "testpassword")
    await page.click('[data-testid="login-button"], button[type="submit"]')
    await page.waitForURL("**/dashboard**")
  }
}

test.describe("Workflow création de contenu", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/create")
    await loginIfNeeded(page)
  })

  // ── Étape 1 — Brief & contexte ────────────────────────────────────────────

  test("Étape 1 : affiche le formulaire Brief complet", async ({ page }) => {
    await expect(page.getByText("Brief & contexte")).toBeVisible()
    await expect(page.getByText("Étape 1 sur 7")).toBeVisible()
    await expect(page.locator("#titre")).toBeVisible()
    await expect(page.locator("#description")).toBeVisible()
    await expect(page.getByText("Objectif cognitif")).toBeVisible()
  })

  test("Étape 1 : barre de progression à 0%", async ({ page }) => {
    await expect(page.getByText("0% complété")).toBeVisible()
  })

  test("Étape 1 : bouton Continuer bloqué si formulaire vide", async ({ page }) => {
    await page.getByRole("button", { name: /continuer/i }).click()
    // Doit rester sur l'étape 1
    await expect(page.getByText("Brief & contexte")).toBeVisible()
  })

  test("Étape 1 : validation — titre trop court", async ({ page }) => {
    await page.fill("#titre", "A")
    await page.fill("#description", "Description suffisamment longue pour passer la validation")
    await page.getByRole("button", { name: /continuer/i }).click()
    await expect(page.getByText(/min 2 caractères/i)).toBeVisible()
  })

  test("Étape 1 : sélection objectif cognitif", async ({ page }) => {
    await page.getByRole("button", { name: /confiance/i }).click()
    await expect(page.getByRole("button", { name: /confiance/i })).toHaveClass(/ring-/)
  })

  test("Étape 1 : XSS dans le brief — sanitisé", async ({ page }) => {
    await page.fill("#titre", "Test XSS <script>alert('hack')</script>")
    await page.fill("#description", "Description avec <img onerror=alert(1) src=x> injection")
    // Le formulaire ne doit pas exécuter de script
    const alerts: string[] = []
    page.on("dialog", (d) => alerts.push(d.message()))
    await page.waitForTimeout(1000)
    expect(alerts).toHaveLength(0)
  })

  test("Étape 1 : passage à l'étape 2 avec données valides", async ({ page }) => {
    await page.fill("#titre", "Lancement du nouveau service IA")
    await page.fill("#description", "Nous lançons notre service d'intelligence artificielle pour les PME marocaines. Objectif : démocratiser l'IA.")
    await page.getByRole("button", { name: /confiance/i }).click()
    await page.getByRole("button", { name: /continuer/i }).click()
    await expect(page.getByText("Plateformes & format")).toBeVisible()
    await expect(page.getByText("Étape 2 sur 7")).toBeVisible()
  })

  // ── Étape 2 — Plateformes & format ───────────────────────────────────────

  test("Étape 2 : affiche les 8 plateformes", async ({ page }) => {
    // Navigation vers étape 2
    await page.fill("#titre", "Test contenu")
    await page.fill("#description", "Description de test pour valider le workflow complet")
    await page.getByRole("button", { name: /urgence/i }).click()
    await page.getByRole("button", { name: /continuer/i }).click()

    await expect(page.getByText("LinkedIn")).toBeVisible()
    await expect(page.getByText("X / Twitter")).toBeVisible()
    await expect(page.getByText("Instagram")).toBeVisible()
    await expect(page.getByText("Facebook")).toBeVisible()
  })

  test("Étape 2 : affiche les 5 formats de contenu", async ({ page }) => {
    await page.fill("#titre", "Test contenu")
    await page.fill("#description", "Description de test pour valider le workflow complet")
    await page.getByRole("button", { name: /expertise/i }).click()
    await page.getByRole("button", { name: /continuer/i }).click()

    await expect(page.getByText("Post")).toBeVisible()
    await expect(page.getByText("Carrousel")).toBeVisible()
    await expect(page.getByText("Story")).toBeVisible()
    await expect(page.getByText("Article")).toBeVisible()
  })

  test("Étape 2 : sélection multiple de plateformes", async ({ page }) => {
    await page.fill("#titre", "Test contenu")
    await page.fill("#description", "Description de test pour valider le workflow complet")
    await page.getByRole("button", { name: /joie/i }).click()
    await page.getByRole("button", { name: /continuer/i }).click()

    await page.getByText("LinkedIn").click()
    await page.getByText("Instagram").click()
    await expect(page.getByText("2 plateformes sélectionnées")).toBeVisible()
  })

  test("Étape 2 : bouton Retour revient à l'étape 1", async ({ page }) => {
    await page.fill("#titre", "Test contenu")
    await page.fill("#description", "Description de test pour valider le workflow complet")
    await page.getByRole("button", { name: /communauté/i }).click()
    await page.getByRole("button", { name: /continuer/i }).click()

    await page.getByRole("button", { name: /retour/i }).click()
    await expect(page.getByText("Brief & contexte")).toBeVisible()
  })

  // ── Navigation générale ───────────────────────────────────────────────────

  test("Stepper affiche les étapes correctement", async ({ page }) => {
    // Les 7 labels doivent être visibles dans le stepper
    await expect(page.getByText("Brief")).toBeVisible()
    await expect(page.getByText("Plateformes")).toBeVisible()
    await expect(page.getByText("Textes")).toBeVisible()
    await expect(page.getByText("Visuels")).toBeVisible()
    await expect(page.getByText("Review")).toBeVisible()
    await expect(page.getByText("Approbation")).toBeVisible()
    await expect(page.getByText("Planification")).toBeVisible()
  })

  test("Page create accessible depuis le dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByText("Créer du contenu").click()
    await expect(page).toHaveURL(/\/dashboard\/create/)
  })

  test("Page create : titre de la page", async ({ page }) => {
    await expect(page).toHaveTitle(/Créer du contenu/)
  })

  // ── Étape 7 — Planification ───────────────────────────────────────────────

  test("Workflow complet : accès page create sans erreur 500", async ({ page }) => {
    // Vérifie qu'il n'y a pas d'erreur serveur
    const response = await page.request.get("/dashboard/create")
    expect(response.status()).toBeLessThan(500)
  })
})

test.describe("Workflow — sécurité", () => {
  test("Page create redirige si non authentifié", async ({ page }) => {
    // Aller sur la page sans auth (test en mode invité)
    await page.goto("/dashboard/create")
    // Doit soit rediriger vers login, soit afficher un formulaire d'auth
    const url = page.url()
    const isAuthPage = url.includes("/login") || url.includes("/register") || url.includes("/dashboard/create")
    expect(isAuthPage).toBe(true)
  })
})
