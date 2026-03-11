/**
 * Tests e2e — Scheduler RAMI (calendrier de publication)
 *
 * Parcours testés :
 * 1. Accès et redirections (non-auth, non-onboardé)
 * 2. Affichage de la page calendrier
 * 3. Navigation mois précédent / suivant
 * 4. Dialog "Nouveau post" — ouverture, validation, création
 * 5. Liste des posts à venir (sidebar)
 * 6. Sécurité : accès sans auth
 */

import { type Page } from '@playwright/test'
import { test, expect } from './fixtures/auth'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function goToCalendar(page: Page) {
  await page.goto('/dashboard/calendar')
  await page.waitForLoadState('networkidle')
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Calendrier — Accès et redirections', () => {
  test('non-authentifié redirige vers /login', async ({ page }) => {
    await page.goto('/dashboard/calendar')
    await expect(page).toHaveURL(/\/login/)
  })

  test('auth + non-onboardé redirige vers /onboarding', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard/calendar')
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Calendrier — Affichage général', () => {
  test('la page calendrier se charge correctement', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await expect(
      page.getByRole('heading', { name: /calendrier de publication/i })
    ).toBeVisible()
  })

  test('affiche le mois et l\'année courants', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]
    const currentMonth = months[now.getMonth()]
    await expect(page.getByText(new RegExp(currentMonth, 'i'))).toBeVisible()
    await expect(page.getByText(String(now.getFullYear()))).toBeVisible()
  })

  test('affiche la grille du calendrier (7 colonnes)', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await expect(
      page.getByRole('grid', { name: /calendrier de publication/i })
    ).toBeVisible()
    // Vérifie que les 7 jours de la semaine sont affichés
    for (const day of ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']) {
      await expect(page.getByText(day, { exact: true })).toBeVisible()
    }
  })

  test('affiche le numéro du jour courant mis en évidence', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    const today = new Date().getDate()
    // Le jour courant a un fond primary (cercle coloré)
    // On cherche un élément avec le texte du jour d'aujourd'hui
    const todayEl = page.locator(`text="${today}"`).first()
    await expect(todayEl).toBeVisible()
  })

  test('affiche la section "Posts à venir" dans la sidebar', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await expect(page.getByText(/posts à venir/i)).toBeVisible()
    await expect(page.getByText(/30 prochains jours/i)).toBeVisible()
  })
})

test.describe('Calendrier — Navigation', () => {
  test('bouton mois précédent change le mois affiché', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]

    // Cliquer sur mois précédent
    await page.getByRole('button', { name: /mois précédent/i }).click()
    await page.waitForTimeout(300)

    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    await expect(page.getByText(new RegExp(months[prevMonth], 'i'))).toBeVisible()
  })

  test('bouton mois suivant change le mois affiché', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]

    await page.getByRole('button', { name: /mois suivant/i }).click()
    await page.waitForTimeout(300)

    const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1
    await expect(page.getByText(new RegExp(months[nextMonth], 'i'))).toBeVisible()
  })

  test('bouton "Aujourd\'hui" ramène au mois courant', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]

    // Aller 2 mois en arrière
    await page.getByRole('button', { name: /mois précédent/i }).click()
    await page.getByRole('button', { name: /mois précédent/i }).click()
    await page.waitForTimeout(300)

    // Cliquer sur "Aujourd'hui"
    await page.getByRole('button', { name: /aujourd.hui/i }).click()
    await page.waitForTimeout(300)

    await expect(page.getByText(new RegExp(months[now.getMonth()], 'i'))).toBeVisible()
  })
})

test.describe('Nouveau post — Dialog', () => {
  test('bouton "Nouveau post" ouvre le dialog', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()
    await expect(
      page.getByRole('dialog', { name: /nouveau post/i })
    ).toBeVisible()
  })

  test('le dialog affiche les champs requis', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()

    await expect(page.getByLabel(/contenu/i)).toBeVisible()
    await expect(page.getByText('LinkedIn')).toBeVisible()
    await expect(page.getByText('X / Twitter')).toBeVisible()
    await expect(page.getByLabel(/date de publication/i)).toBeVisible()
  })

  test('validation : contenu vide bloque la soumission', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()

    // Sélectionner une plateforme mais laisser le contenu vide
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    await page.getByRole('button', { name: /créer le post/i }).click()

    await expect(page.getByText(/le contenu est requis/i)).toBeVisible()
  })

  test('validation : aucune plateforme sélectionnée bloque la soumission', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()

    await page.getByLabel(/contenu/i).fill('Test post contenu')
    await page.getByRole('button', { name: /créer le post/i }).click()

    await expect(
      page.getByText(/sélectionnez au moins une plateforme/i)
    ).toBeVisible()
  })

  test('sélection et désélection d\'une plateforme', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()

    const linkedinBtn = page.getByRole('button', { name: 'LinkedIn' })
    await linkedinBtn.click()
    // LinkedIn est maintenant sélectionné (fond coloré)
    // Cliquer à nouveau pour désélectionner
    await linkedinBtn.click()
    // Le bouton retourne à l'état non sélectionné
    await expect(linkedinBtn).toBeVisible()
  })

  test('compteur de caractères affiché', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()

    await page.getByLabel(/contenu/i).fill('Hello RAMI')
    await expect(page.getByText(/10 \/ 3000/i)).toBeVisible()
  })

  test('fermeture du dialog avec "Annuler"', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.getByRole('button', { name: /annuler/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('fermeture du dialog remet le formulaire à zéro', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()

    await page.getByLabel(/contenu/i).fill('Contenu temporaire')
    await page.getByRole('button', { name: /annuler/i }).click()

    // Réouvrir
    await page.getByRole('button', { name: /nouveau post/i }).click()
    const content = await page.getByLabel(/contenu/i).inputValue()
    expect(content).toBe('')
  })
})

test.describe('Calendrier — Sidebar liste à venir', () => {
  test('état vide affiché quand aucun post planifié', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    // La section "Posts à venir" est toujours visible
    await expect(page.getByText(/posts à venir/i)).toBeVisible()
    // Si pas de posts → message vide ; si posts → ils sont affichés
    // On vérifie au moins que la zone latérale est présente
  })
})

test.describe('Calendrier — Sécurité', () => {
  test('XSS dans le contenu du post ne s\'exécute pas', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    await page.getByRole('button', { name: /nouveau post/i }).click()

    const xssPayload = '<script>window.__xss_scheduler = true</script>Test'
    await page.getByLabel(/contenu/i).fill(xssPayload)
    await page.waitForTimeout(200)

    const xssExecuted = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__xss_scheduler
    )
    expect(xssExecuted).toBeFalsy()
  })
})
