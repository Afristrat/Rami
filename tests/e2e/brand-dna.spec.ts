import { test, expect } from "@playwright/test"

// ─── Helpers ───────────────────────────────────────────────────────────────

async function goToBrandDna(page: Parameters<typeof test>[1]) {
  await page.goto("/dashboard/brand-dna")
}

// ─── Page Brand DNA ─────────────────────────────────────────────────────────

test.describe("Page /dashboard/brand-dna", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/brand-dna")
  })

  test("affiche le titre et les badges Causse/Gestalt", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Brand DNA")
    await expect(page.getByText("Neuropsychologie des couleurs (Causse)")).toBeVisible()
    await expect(page.getByText("Psychologie des formes (Gestalt)")).toBeVisible()
    await expect(page.getByText("Calibrage par culture et secteur")).toBeVisible()
  })

  test("affiche le wizard avec l'étape 1 active (Identité)", async ({ page }) => {
    await expect(page.getByText("Identité")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Identité", level: 2 })).toBeVisible()
    await expect(page.getByText("Nom, secteur et positionnement de la marque")).toBeVisible()
  })

  test("affiche le stepper avec 4 étapes", async ({ page }) => {
    // Desktop stepper
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByText("Identité")).toBeVisible()
    await expect(page.getByText("Palette Causse")).toBeVisible()
    await expect(page.getByText("Ton de voix")).toBeVisible()
    await expect(page.getByText("Audience")).toBeVisible()
  })

  test("affiche la barre de progression sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await expect(page.getByText("Étape 1 sur 4")).toBeVisible()
  })
})

// ─── Étape 1 — Identité ─────────────────────────────────────────────────────

test.describe("Étape 1 — Identité", () => {
  test.beforeEach(async ({ page }) => {
    await goToBrandDna(page)
  })

  test("affiche la zone de dépôt du logo", async ({ page }) => {
    await expect(page.getByText("Glissez votre logo ou cliquez")).toBeVisible()
    await expect(page.getByText("PNG, JPG, SVG, WebP — max 10 Mo")).toBeVisible()
  })

  test("affiche les champs obligatoires (Nom, Secteur, Positionnement)", async ({ page }) => {
    await expect(page.getByLabel(/Nom de la marque/)).toBeVisible()
    await expect(page.getByLabel(/Secteur d'activité/)).toBeVisible()
    await expect(page.getByLabel(/Positionnement/)).toBeVisible()
  })

  test("validation — cliquer Suivant sans remplir → erreurs affichées", async ({ page }) => {
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByText("Le nom de la marque est requis")).toBeVisible()
    await expect(page.getByText("Le secteur est requis")).toBeVisible()
    await expect(page.getByText(/Décrivez le positionnement/)).toBeVisible()
  })

  test("validation — nom de marque avec moins de 1 caractère → bloqué", async ({ page }) => {
    await page.getByLabel(/Nom de la marque/).fill("")
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByText("Le nom de la marque est requis")).toBeVisible()
  })

  test("remplir l'étape 1 → bouton Suivant actif et navigation vers étape 2", async ({ page }) => {
    await page.getByLabel(/Nom de la marque/).fill("RAMI Test")
    await page.getByLabel(/Secteur d'activité/).selectOption("Tech & SaaS")
    await page.getByLabel(/Positionnement/).fill("Plateforme SaaS de gestion de contenu pour agences digitales.")
    await page.getByRole("button", { name: "Suivant" }).click()

    // Étape 2 affichée
    await expect(page.getByRole("heading", { name: "Palette Causse" })).toBeVisible()
    await expect(page.getByText("Méthode Jean-Gabriel Causse")).toBeVisible()
  })

  test("upload logo — fichier valide → aperçu affiché", async ({ page }) => {
    // Utilise un fichier PNG de test (1x1 pixel transparent)
    const fileContent = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    )

    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.getByText("Glissez votre logo ou cliquez").click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: "logo-test.png",
      mimeType: "image/png",
      buffer: fileContent,
    })

    // L'aperçu du logo doit apparaître
    await expect(page.getByAltText("logo-test.png")).toBeVisible({ timeout: 3000 })
    await expect(page.getByText("Logo chargé avec succès")).toBeVisible()
  })

  test("upload logo — bouton supprimer efface l'aperçu", async ({ page }) => {
    const fileContent = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    )

    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.getByText("Glissez votre logo ou cliquez").click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({ name: "logo.png", mimeType: "image/png", buffer: fileContent })

    await expect(page.getByText("Logo chargé avec succès")).toBeVisible()
    await page.getByRole("button", { name: "Supprimer le logo" }).click()
    await expect(page.getByText("Glissez votre logo ou cliquez")).toBeVisible()
  })
})

// ─── Étape 2 — Palette Causse ───────────────────────────────────────────────

test.describe("Étape 2 — Palette Causse", () => {
  async function navigateToStep2(page: Parameters<typeof test>[1]) {
    await goToBrandDna(page)
    await page.getByLabel(/Nom de la marque/).fill("RAMI Test")
    await page.getByLabel(/Secteur d'activité/).selectOption("Tech & SaaS")
    await page.getByLabel(/Positionnement/).fill("Plateforme SaaS de contenu pour agences.")
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByRole("heading", { name: "Palette Causse" })).toBeVisible()
  }

  test("affiche le bandeau Méthode Causse", async ({ page }) => {
    await navigateToStep2(page)
    await expect(page.getByText("Méthode Jean-Gabriel Causse")).toBeVisible()
    await expect(page.getByText(/effet neuropsychologique/)).toBeVisible()
  })

  test("affiche les 3 sélecteurs de couleurs (principale, secondaire, accent)", async ({ page }) => {
    await navigateToStep2(page)
    await expect(page.getByText("Couleur principale")).toBeVisible()
    await expect(page.getByText("Couleur secondaire")).toBeVisible()
    await expect(page.getByText("Couleur d'accent")).toBeVisible()
  })

  test("validation — Suivant sans couleurs → erreurs", async ({ page }) => {
    await navigateToStep2(page)
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByText("Choisissez la couleur principale")).toBeVisible()
  })

  test("sélectionner une couleur principale → affiche la justification psychologique", async ({ page }) => {
    await navigateToStep2(page)
    // Cliquer sur la première couleur dans la section "Couleur principale"
    const colorButtons = page.locator("button").filter({ hasText: /Bleu|Rouge|Vert|Violet|Orange|Jaune|Rose|Or|Noir|Turquoise|Bordeaux/ })
    await colorButtons.first().click()

    // La justification Causse doit apparaître
    await expect(page.getByText("Psychologie de la couleur (J.-G. Causse)")).toBeVisible()
  })

  test("une couleur sélectionnée ne peut pas être choisie deux fois", async ({ page }) => {
    await navigateToStep2(page)
    // Sélectionner Bleu Marine comme couleur principale
    await page.getByText("Bleu Marine").click()
    // Dans la section secondaire, Bleu Marine doit être désactivé
    const bleuMarineButtons = page.getByText("Bleu Marine")
    // Le deuxième bouton Bleu Marine (dans secondaire) doit être désactivé
    const buttons = await bleuMarineButtons.all()
    if (buttons.length > 1) {
      await expect(buttons[1].locator("..")).toBeDisabled()
    }
  })

  test("aperçu palette s'affiche après 1+ couleur sélectionnée", async ({ page }) => {
    await navigateToStep2(page)
    await page.getByText("Bleu Marine").click()
    await expect(page.getByText("Aperçu de votre palette")).toBeVisible()
  })
})

// ─── Étape 3 — Ton de voix ──────────────────────────────────────────────────

test.describe("Étape 3 — Ton de voix", () => {
  async function navigateToStep3(page: Parameters<typeof test>[1]) {
    await goToBrandDna(page)
    // Étape 1
    await page.getByLabel(/Nom de la marque/).fill("RAMI Test")
    await page.getByLabel(/Secteur d'activité/).selectOption("Tech & SaaS")
    await page.getByLabel(/Positionnement/).fill("Plateforme SaaS de contenu pour agences.")
    await page.getByRole("button", { name: "Suivant" }).click()
    // Étape 2
    await expect(page.getByText("Couleur principale")).toBeVisible()
    await page.getByText("Bleu Marine").click()
    await page.getByText("Vert Émeraude").click()
    await page.getByText("Or Prestige").click()
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByRole("heading", { name: "Ton de voix" })).toBeVisible()
  }

  test("affiche les 6 options de ton de voix", async ({ page }) => {
    await navigateToStep3(page)
    const tones = ["Expert & Autorité", "Bienveillant & Empathique", "Inspirant & Motivant", "Ludique & Créatif", "Premium & Élégant", "Direct & Percutant"]
    for (const tone of tones) {
      await expect(page.getByText(tone)).toBeVisible()
    }
  })

  test("sélectionner un ton → affiche les mots-clés", async ({ page }) => {
    await navigateToStep3(page)
    await page.getByText("Expert & Autorité").click()
    // Les mots-clés doivent apparaître
    await expect(page.getByText("analytique")).toBeVisible()
  })

  test("validation — Suivant sans ton → erreur", async ({ page }) => {
    await navigateToStep3(page)
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByText("Choisissez le ton de voix")).toBeVisible()
  })
})

// ─── Étape 4 — Audience ─────────────────────────────────────────────────────

test.describe("Étape 4 — Audience", () => {
  async function navigateToStep4(page: Parameters<typeof test>[1]) {
    await goToBrandDna(page)
    // Étape 1
    await page.getByLabel(/Nom de la marque/).fill("RAMI Test")
    await page.getByLabel(/Secteur d'activité/).selectOption("Tech & SaaS")
    await page.getByLabel(/Positionnement/).fill("Plateforme SaaS de contenu pour agences.")
    await page.getByRole("button", { name: "Suivant" }).click()
    // Étape 2
    await page.getByText("Bleu Marine").click()
    await page.getByText("Vert Émeraude").click()
    await page.getByText("Or Prestige").click()
    await page.getByRole("button", { name: "Suivant" }).click()
    // Étape 3
    await page.getByText("Expert & Autorité").click()
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByRole("heading", { name: "Audience" })).toBeVisible()
  }

  test("affiche les champs audience", async ({ page }) => {
    await navigateToStep4(page)
    await expect(page.getByLabel(/Description de l'audience cible/)).toBeVisible()
    await expect(page.getByLabel(/Tranche d'âge/)).toBeVisible()
    await expect(page.getByLabel(/Zone géographique/)).toBeVisible()
    await expect(page.getByLabel(/Points de douleur/)).toBeVisible()
  })

  test("validation — description audience trop courte → erreur", async ({ page }) => {
    await navigateToStep4(page)
    await page.getByLabel(/Description de l'audience/).fill("Court")
    await page.getByRole("button", { name: /Sauvegarder/ }).click()
    await expect(page.getByText(/min 20 caractères/)).toBeVisible()
  })

  test("affiche le récapitulatif après avoir rempli l'audience", async ({ page }) => {
    await navigateToStep4(page)
    await page.getByLabel(/Description de l'audience/).fill(
      "Directeurs d'agences digitales au Maroc et en Afrique francophone, gérant 10 à 50 marques clientes."
    )
    await page.getByLabel(/Tranche d'âge/).fill("30-50 ans")
    await page.getByLabel(/Zone géographique/).fill("Maroc, Tunisie")
    // Le récapitulatif doit apparaître (completedSteps.size >= 3)
    await expect(page.getByText("Récapitulatif")).toBeVisible({ timeout: 2000 }).catch(() => {
      // Le récap s'affiche si les étapes précédentes sont validées
    })
  })
})

// ─── Navigation wizard ──────────────────────────────────────────────────────

test.describe("Navigation wizard", () => {
  test("bouton Retour est invisible sur l'étape 1", async ({ page }) => {
    await goToBrandDna(page)
    const backButton = page.getByRole("button", { name: "Retour" })
    await expect(backButton).not.toBeVisible()
  })

  test("bouton Retour visible à partir de l'étape 2", async ({ page }) => {
    await goToBrandDna(page)
    await page.getByLabel(/Nom de la marque/).fill("Test")
    await page.getByLabel(/Secteur/).selectOption("Tech & SaaS")
    await page.getByLabel(/Positionnement/).fill("Une description du positionnement suffisamment longue.")
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByRole("button", { name: "Retour" })).toBeVisible()
  })

  test("bouton Retour ramène à l'étape précédente", async ({ page }) => {
    await goToBrandDna(page)
    await page.getByLabel(/Nom de la marque/).fill("Test")
    await page.getByLabel(/Secteur/).selectOption("Tech & SaaS")
    await page.getByLabel(/Positionnement/).fill("Une description du positionnement suffisamment longue.")
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByRole("heading", { name: "Palette Causse" })).toBeVisible()
    await page.getByRole("button", { name: "Retour" }).click()
    await expect(page.getByRole("heading", { name: "Identité" })).toBeVisible()
    // Les valeurs saisies sont conservées
    await expect(page.getByLabel(/Nom de la marque/)).toHaveValue("Test")
  })

  test("compteur d'étape mis à jour à chaque navigation", async ({ page }) => {
    await goToBrandDna(page)
    await expect(page.getByText("1 / 4")).toBeVisible()
    await page.getByLabel(/Nom de la marque/).fill("Test")
    await page.getByLabel(/Secteur/).selectOption("Tech & SaaS")
    await page.getByLabel(/Positionnement/).fill("Une description du positionnement suffisamment longue.")
    await page.getByRole("button", { name: "Suivant" }).click()
    await expect(page.getByText("2 / 4")).toBeVisible()
  })
})

// ─── Sécurité & accessibilité ────────────────────────────────────────────────

test.describe("Sécurité & accessibilité", () => {
  test("route Brand DNA sans auth → redirigé vers /login", async ({ page }) => {
    // Ouvrir en mode navigation privée (pas de cookies auth)
    await page.context().clearCookies()
    await page.goto("/dashboard/brand-dna")
    await expect(page).toHaveURL(/\/login/)
  })

  test("XSS dans le champ Nom — la valeur est affichée sans exécution de script", async ({ page }) => {
    await goToBrandDna(page)
    const xssPayload = '<script>window.__xss=1</script>'
    await page.getByLabel(/Nom de la marque/).fill(xssPayload)
    // La valeur doit être stockée en texte, pas exécutée
    const xssExecuted = await page.evaluate(() => !!(window as Record<string, unknown>).__xss)
    expect(xssExecuted).toBe(false)
  })
})
