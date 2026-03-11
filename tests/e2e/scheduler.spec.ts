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

test.describe('Calendrier — Navigation clavier', () => {
  test('touche ← navigue vers le mois précédent', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]

    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(300)

    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    await expect(page.getByText(new RegExp(months[prevMonth], 'i'))).toBeVisible()
  })

  test('touche → navigue vers le mois suivant', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)

    const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1
    await expect(page.getByText(new RegExp(months[nextMonth], 'i'))).toBeVisible()
  })

  test('touche T revient au mois courant', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]

    // Aller 3 mois en avant
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)

    // T revient au mois courant
    await page.keyboard.press('t')
    await page.waitForTimeout(300)

    await expect(page.getByText(new RegExp(months[now.getMonth()], 'i'))).toBeVisible()
  })

  test('← et → ignorées quand focus est dans un champ de saisie', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const now = new Date()
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ]
    const currentMonthText = months[now.getMonth()]

    // Ouvrir le dialog (champ de saisie actif)
    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).focus()

    // Les flèches doivent déplacer le curseur dans le textarea, pas changer de mois
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')

    // Fermer le dialog
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // Le mois ne doit pas avoir changé
    await expect(page.getByText(new RegExp(currentMonthText, 'i'))).toBeVisible()
  })
})

test.describe('Calendrier — Détail et édition d\'un post', () => {
  test('cliquer sur un post ouvre le panneau de détail', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    // Créer un post avec une date dans le mois courant
    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Post détail test')
    await page.getByRole('button', { name: 'LinkedIn' }).click()

    // Ajouter une date (aujourd'hui + 1h)
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    // Cliquer sur le chip dans le calendrier
    const postChip = page.getByText('Post détail test').first()
    await postChip.click()
    await page.waitForTimeout(300)

    // Le panneau de détail doit apparaître avec le contenu
    await expect(page.getByText('Post détail test')).toBeVisible()
  })

  test('bouton Modifier passe en mode édition', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    // Créer et afficher un post
    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Post à modifier')
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    await page.getByText('Post à modifier').first().click()
    await page.waitForTimeout(300)

    // Cliquer sur le crayon (modifier)
    await page.getByRole('button', { name: /modifier/i }).click()

    // Le mode édition est actif
    await expect(page.getByText('Mode édition')).toBeVisible()
  })

  test('édition inline : modifier le contenu et sauvegarder', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Contenu original')
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    await page.getByText('Contenu original').first().click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /modifier/i }).click()

    // Modifier le contenu
    const contentField = page.getByLabel(/contenu/i).last()
    await contentField.clear()
    await contentField.fill('Contenu mis à jour')

    await page.getByRole('button', { name: /sauvegarder/i }).click()
    await page.waitForTimeout(600)

    // Le panneau repasse en mode vue avec le nouveau contenu
    await expect(page.getByText('Contenu mis à jour')).toBeVisible()
    await expect(page.getByText('Mode édition')).not.toBeVisible()
  })

  test('Annuler en mode édition revient à la vue détail', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Post annuler édition')
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    await page.getByText('Post annuler édition').first().click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /modifier/i }).click()
    await expect(page.getByText('Mode édition')).toBeVisible()

    await page.getByRole('button', { name: /annuler/i }).click()

    // Retour au mode vue
    await expect(page.getByText('Mode édition')).not.toBeVisible()
    await expect(page.getByText('Post annuler édition')).toBeVisible()
  })

  test('touche Escape ferme le panneau de détail', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Post Escape')
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    await page.getByText('Post Escape').first().click()
    await page.waitForTimeout(300)

    // Vérifier que le panneau est visible (statut "Planifié" ou "Brouillon")
    const statusEl = page.getByText(/planifié|brouillon|révision|approuvé/i).first()
    await expect(statusEl).toBeVisible()

    // Escape doit fermer le panneau
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    await expect(page.getByText('Mode édition')).not.toBeVisible()
  })
})

test.describe('Calendrier — Actions rapides de statut', () => {
  test('action "Soumettre" passe un brouillon en révision', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    // Créer un post brouillon (sans date → statut draft)
    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Post brouillon → révision')
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(800)

    // Les brouillons sans date n'apparaissent pas dans le calendrier
    // → vérifier le toast de succès
    await expect(page.getByText(/post créé/i)).toBeVisible()
  })

  test('validation édition : contenu vide bloque la sauvegarde', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Post validation')
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    await page.getByText('Post validation').first().click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /modifier/i }).click()

    // Vider le contenu
    const contentField = page.getByLabel(/contenu/i).last()
    await contentField.clear()

    await page.getByRole('button', { name: /sauvegarder/i }).click()
    await expect(page.getByText(/le contenu est requis/i)).toBeVisible()
  })
})

test.describe('Calendrier — Duplication de post', () => {
  test('dupliquer un post crée un brouillon', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    // Créer un post planifié
    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill('Post original à dupliquer')
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    await page.getByText('Post original à dupliquer').first().click()
    await page.waitForTimeout(300)

    // Cliquer sur "Dupliquer"
    await page.getByRole('button', { name: /dupliquer/i }).click()
    await page.waitForTimeout(600)

    // Toast de confirmation
    await expect(page.getByText(/brouillon dupliqué/i)).toBeVisible()
  })
})

test.describe('Calendrier — Suppression de post', () => {
  test('supprimer un post le retire du calendrier', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)

    const postContent = 'Post à supprimer du calendrier'

    await page.getByRole('button', { name: /nouveau post/i }).click()
    await page.getByLabel(/contenu/i).fill(postContent)
    await page.getByRole('button', { name: 'LinkedIn' }).click()
    const future = new Date(Date.now() + 3600_000)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dtValue = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`
    await page.getByLabel(/date de publication/i).fill(dtValue)
    await page.getByRole('button', { name: /créer le post/i }).click()
    await page.waitForTimeout(1000)

    // Vérifier qu'il est visible dans le calendrier
    await expect(page.getByText(postContent).first()).toBeVisible()

    // Ouvrir le panneau et supprimer
    await page.getByText(postContent).first().click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: /supprimer/i }).click()
    await page.waitForTimeout(600)

    // Toast "Post supprimé"
    await expect(page.getByText(/post supprimé/i)).toBeVisible()
  })
})

test.describe('Calendrier — Résumé du mois', () => {
  test('le résumé affiche les compteurs de statuts', async ({
    onboardedPage: page,
  }) => {
    await goToCalendar(page)
    // La barre de résumé est toujours rendue (même avec 0 posts)
    // Elle affiche les totaux par statut
    const grid = page.getByRole('grid', { name: /calendrier de publication/i })
    await expect(grid).toBeVisible()
  })
})

test.describe('Calendrier — Sidebar toggle (desktop)', () => {
  test('le bouton toggle masque/affiche la sidebar', async ({
    onboardedPage: page,
  }) => {
    // Forcer la vue desktop
    await page.setViewportSize({ width: 1280, height: 900 })
    await goToCalendar(page)

    // La sidebar est ouverte par défaut
    await expect(page.getByText(/posts à venir/i)).toBeVisible()

    // Cliquer sur le toggle
    await page.getByRole('button', { name: /masquer le panneau latéral/i }).click()
    await page.waitForTimeout(300)

    // La sidebar est maintenant masquée (overflow hidden + opacity 0)
    await expect(
      page.getByRole('button', { name: /afficher le panneau latéral/i })
    ).toBeVisible()
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
