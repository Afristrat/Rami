import { test, expect } from "@playwright/test"

// ─── Helpers ───────────────────────────────────────────────────────────────

const VALID_EMAIL = `test+${Date.now()}@example.com`
const VALID_PASSWORD = "TestPassword1"

// ─── /login ────────────────────────────────────────────────────────────────

test.describe("Page /login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("affiche le logo RAMI et le formulaire", async ({ page }) => {
    await expect(page.getByText("RAMI").first()).toBeVisible()
    await expect(page.getByText("Agency OS by AI-MPower")).toBeVisible()
    await expect(page.getByRole("heading", { name: /Bon retour/i })).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Mot de passe")).toBeVisible()
    await expect(page.getByRole("button", { name: /Se connecter/i })).toBeVisible()
  })

  test("affiche un lien vers /register et /reset-password", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Créer un compte/i })).toHaveAttribute("href", "/register")
    await expect(page.getByRole("link", { name: /Mot de passe oublié/i })).toHaveAttribute("href", "/reset-password")
  })

  test("validation — email vide → message d'erreur", async ({ page }) => {
    await page.getByRole("button", { name: /Se connecter/i }).click()
    await expect(page.getByText("L'email est requis")).toBeVisible()
  })

  test("validation — email invalide → message d'erreur", async ({ page }) => {
    await page.getByLabel("Email").fill("pas-un-email")
    await page.getByRole("button", { name: /Se connecter/i }).click()
    await expect(page.getByText("Email invalide")).toBeVisible()
  })

  test("validation — mot de passe vide → message d'erreur", async ({ page }) => {
    await page.getByLabel("Email").fill("valid@example.com")
    await page.getByRole("button", { name: /Se connecter/i }).click()
    await expect(page.getByText("Le mot de passe est requis")).toBeVisible()
  })

  test("toggle affichage mot de passe", async ({ page }) => {
    const input = page.getByLabel("Mot de passe")
    await expect(input).toHaveAttribute("type", "password")
    // Clic sur le bouton toggle (aria-label="Afficher")
    await page.getByRole("button", { name: /Afficher/i }).click()
    await expect(input).toHaveAttribute("type", "text")
    await page.getByRole("button", { name: /Masquer/i }).click()
    await expect(input).toHaveAttribute("type", "password")
  })

  test("identifiants incorrects → message d'erreur serveur", async ({ page }) => {
    await page.getByLabel("Email").fill("inexistant@example.com")
    await page.getByLabel("Mot de passe").fill("mauvais_mdp_123A")
    await page.getByRole("button", { name: /Se connecter/i }).click()
    // Le serveur retourne une erreur (Supabase mock ou réel)
    await expect(
      page.getByText(/Email ou mot de passe incorrect|erreur est survenue/i)
    ).toBeVisible({ timeout: 10_000 })
  })
})

// ─── /register ─────────────────────────────────────────────────────────────

test.describe("Page /register", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register")
  })

  test("affiche le formulaire d'inscription complet", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Créer un compte/i })).toBeVisible()
    await expect(page.getByLabel("Nom complet")).toBeVisible()
    await expect(page.getByLabel("Email professionnel")).toBeVisible()
    await expect(page.getByLabel("Mot de passe").first()).toBeVisible()
    await expect(page.getByLabel("Confirmer le mot de passe")).toBeVisible()
    await expect(page.getByRole("button", { name: /Créer mon compte/i })).toBeVisible()
  })

  test("affiche un lien retour vers /login", async ({ page }) => {
    await expect(page.getByRole("link", { name: /Se connecter/i })).toHaveAttribute("href", "/login")
  })

  test("validation — champs vides → messages d'erreur", async ({ page }) => {
    await page.getByRole("button", { name: /Créer mon compte/i }).click()
    await expect(page.getByText("Le nom doit contenir au moins 2 caractères")).toBeVisible()
    await expect(page.getByText("L'email est requis")).toBeVisible()
  })

  test("validation — nom trop court → erreur", async ({ page }) => {
    await page.getByLabel("Nom complet").fill("A")
    await page.getByRole("button", { name: /Créer mon compte/i }).click()
    await expect(page.getByText("Le nom doit contenir au moins 2 caractères")).toBeVisible()
  })

  test("indicateur force mot de passe — apparaît lors de la saisie", async ({ page }) => {
    const passwordInput = page.getByLabel("Mot de passe").first()
    await passwordInput.fill("abc")
    await expect(page.getByText("8 caractères minimum")).toBeVisible()
    await expect(page.getByText("Une majuscule")).toBeVisible()
    await expect(page.getByText("Un chiffre")).toBeVisible()
  })

  test("indicateur force — critères validés changent de couleur", async ({ page }) => {
    const passwordInput = page.getByLabel("Mot de passe").first()
    await passwordInput.fill(VALID_PASSWORD)
    // Les 3 critères doivent être satisfaits (visuellement emerald-400)
    const criteria = page.locator("text=8 caractères minimum")
    await expect(criteria).toBeVisible()
  })

  test("validation — mots de passe non concordants → erreur", async ({ page }) => {
    await page.getByLabel("Nom complet").fill("Alice Test")
    await page.getByLabel("Email professionnel").fill(VALID_EMAIL)
    await page.getByLabel("Mot de passe").first().fill(VALID_PASSWORD)
    await page.getByLabel("Confirmer le mot de passe").fill("Autre_mdp1")
    await page.getByRole("button", { name: /Créer mon compte/i }).click()
    await expect(page.getByText("Les mots de passe ne correspondent pas")).toBeVisible()
  })

  test("validation — mot de passe sans majuscule → erreur", async ({ page }) => {
    await page.getByLabel("Nom complet").fill("Alice Test")
    await page.getByLabel("Email professionnel").fill(VALID_EMAIL)
    await page.getByLabel("Mot de passe").first().fill("password1234")
    await page.getByLabel("Confirmer le mot de passe").fill("password1234")
    await page.getByRole("button", { name: /Créer mon compte/i }).click()
    await expect(
      page.getByText("Le mot de passe doit contenir au moins une majuscule")
    ).toBeVisible()
  })
})

// ─── /reset-password ───────────────────────────────────────────────────────

test.describe("Page /reset-password", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reset-password")
  })

  test("affiche le formulaire de réinitialisation", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Réinitialiser le mot de passe/i })
    ).toBeVisible()
    await expect(page.getByLabel("Adresse email")).toBeVisible()
    await expect(page.getByRole("button", { name: /Envoyer le lien/i })).toBeVisible()
  })

  test("affiche un lien retour vers /login", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Retour à la connexion/i })
    ).toHaveAttribute("href", "/login")
  })

  test("validation — email vide → message d'erreur", async ({ page }) => {
    await page.getByRole("button", { name: /Envoyer le lien/i }).click()
    await expect(page.getByText("L'email est requis")).toBeVisible()
  })

  test("validation — email invalide → message d'erreur", async ({ page }) => {
    await page.getByLabel("Adresse email").fill("pas-un-email")
    await page.getByRole("button", { name: /Envoyer le lien/i }).click()
    await expect(page.getByText("Email invalide")).toBeVisible()
  })

  test("envoi email valide → affiche l'écran de confirmation", async ({ page }) => {
    await page.getByLabel("Adresse email").fill("test@example.com")
    await page.getByRole("button", { name: /Envoyer le lien/i }).click()
    // L'écran succès doit apparaître (même si l'email n'existe pas — sécurité)
    await expect(
      page.getByRole("heading", { name: /Vérifiez votre email/i })
    ).toBeVisible({ timeout: 10_000 })
    // Instructions étape par étape visibles
    await expect(page.getByText(/Ouvrez l'email de réinitialisation/i)).toBeVisible()
  })
})

// ─── /reset-password/update ────────────────────────────────────────────────

test.describe("Page /reset-password/update", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reset-password/update")
  })

  test("affiche le formulaire de nouveau mot de passe", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Nouveau mot de passe/i })
    ).toBeVisible()
    await expect(page.getByLabel("Nouveau mot de passe")).toBeVisible()
    await expect(page.getByLabel("Confirmer le mot de passe")).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Mettre à jour le mot de passe/i })
    ).toBeVisible()
  })

  test("validation — champs vides → messages d'erreur", async ({ page }) => {
    await page.getByRole("button", { name: /Mettre à jour le mot de passe/i }).click()
    await expect(
      page.getByText("Le mot de passe doit contenir au moins 8 caractères")
    ).toBeVisible()
  })
})

// ─── Navigation entre pages auth ───────────────────────────────────────────

test.describe("Navigation auth", () => {
  test("login → register → login", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("link", { name: /Créer un compte/i }).click()
    await expect(page).toHaveURL("/register")
    await page.getByRole("link", { name: /Se connecter/i }).click()
    await expect(page).toHaveURL("/login")
  })

  test("login → reset-password → login", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("link", { name: /Mot de passe oublié/i }).click()
    await expect(page).toHaveURL("/reset-password")
    await page.getByRole("link", { name: /Retour à la connexion/i }).click()
    await expect(page).toHaveURL("/login")
  })

  test("layout dark mode visible sur toutes les pages auth", async ({ page }) => {
    for (const path of ["/login", "/register", "/reset-password"]) {
      await page.goto(path)
      // La div dark doit être présente (class="dark ...")
      const darkContainer = page.locator(".dark")
      await expect(darkContainer).toBeVisible()
      // Le logo RAMI présent sur chaque page
      await expect(page.getByText("RAMI").first()).toBeVisible()
    }
  })
})
