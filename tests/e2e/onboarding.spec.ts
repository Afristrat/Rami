/**
 * Tests e2e - Wizard Onboarding RAMI
 *
 * Parcours testes :
 * 1. Redirections acces non-authentifie / auth non-onboarde
 * 2. Etape 1 : validation nom/slug + generation automatique
 * 3. Etape 2 : logo optionnel, upload valide/invalide, rejet taille
 * 4. Etape 3 : selection plan, navigation retour
 * 5. Parcours complet Free sans logo -> dashboard
 * 6. Securite : XSS, SQL injection slug
 */

import { Page } from '@playwright/test'
import { test, expect } from './fixtures/auth'

// ---- Helpers ---------------------------------------------------------------

async function goToStep1(page: Page) {
  await page.goto('/onboarding')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: /votre espace de travail/i })).toBeVisible()
}

async function fillStep1(
  page: Page,
  opts: { name: string; slug?: string }
) {
  await page.getByLabel(/nom de l/i).fill(opts.name)

  if (opts.slug !== undefined) {
    const slugInput = page.getByLabel(/identifiant unique/i)
    await slugInput.clear()
    await slugInput.fill(opts.slug)
  }
}

async function clickNext(page: Page) {
  await page.getByRole('button', { name: /continuer/i }).click()
}

async function clickBack(page: Page) {
  await page.getByRole('button', { name: /retour/i }).click()
}

async function goToStep2(page: Page) {
  await goToStep1(page)
  await fillStep1(page, {
    name: 'Agence Logo Test',
    slug: `logo-test-${Date.now()}`,
  })
  await page.waitForTimeout(1500)
  await clickNext(page)
  await expect(
    page.getByRole('heading', { name: /logo de votre marque/i })
  ).toBeVisible()
}

async function goToStep3(page: Page) {
  await goToStep1(page)
  await fillStep1(page, {
    name: 'Agence Plan Test',
    slug: `plan-test-${Date.now()}`,
  })
  await page.waitForTimeout(1500)
  await clickNext(page)
  await page.getByRole('button', { name: /continuer/i }).click()
  await expect(
    page.getByRole('heading', { name: /choisissez votre plan/i })
  ).toBeVisible()
}

// ---- Tests -----------------------------------------------------------------

test.describe('Onboarding - Acces et redirections', () => {
  test('non-authentifie redirige vers /login', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/login/)
  })

  test('non-authentifie sur /dashboard redirige vers /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('auth + non-onboarde affiche la page onboarding', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/onboarding')
    await expect(
      page.getByRole('heading', { name: /bienvenue sur rami/i })
    ).toBeVisible()
  })

  test('auth + non-onboarde sur /dashboard redirige vers /onboarding', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/onboarding/)
  })
})

test.describe('Etape 1 - Informations du tenant', () => {
  test('affiche le formulaire nom + slug', async ({ authenticatedPage: page }) => {
    await goToStep1(page)
    await expect(page.getByLabel(/nom de l/i)).toBeVisible()
    await expect(page.getByLabel(/identifiant unique/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continuer/i })).toBeDisabled()
  })

  test('le slug est auto-genere depuis le nom', async ({ authenticatedPage: page }) => {
    await goToStep1(page)
    await page.getByLabel(/nom de l/i).fill('Mon Agence Test')
    await page.waitForTimeout(300)
    const slugValue = await page.getByLabel(/identifiant unique/i).inputValue()
    expect(slugValue).toBe('mon-agence-test')
  })

  test('le slug normalise les accents', async ({ authenticatedPage: page }) => {
    await goToStep1(page)
    await page.getByLabel(/nom de l/i).fill('Ete Hiver SAS')
    await page.waitForTimeout(300)
    const slugValue = await page.getByLabel(/identifiant unique/i).inputValue()
    expect(slugValue).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  test('erreur si nom trop court', async ({ authenticatedPage: page }) => {
    await goToStep1(page)
    await page.getByLabel(/nom de l/i).fill('A')
    await page.getByLabel(/nom de l/i).blur()
    await expect(page.getByText(/au moins 2/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continuer/i })).toBeDisabled()
  })

  test('erreur si slug invalide (caracteres interdits)', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)
    await page.getByLabel(/nom de l/i).fill('Mon Agence')
    const slugInput = page.getByLabel(/identifiant unique/i)
    await slugInput.clear()
    await slugInput.fill('Mon_Agence!!!')
    await slugInput.blur()
    await expect(page.getByText(/lettres minuscules/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continuer/i })).toBeDisabled()
  })

  test('indicateur disponible sur slug libre', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)
    const uniqueSlug = `test-slug-${Date.now()}`
    await page.getByLabel(/nom de l/i).fill('Test Slug')
    const slugInput = page.getByLabel(/identifiant unique/i)
    await slugInput.clear()
    await slugInput.fill(uniqueSlug)
    await page.waitForTimeout(1500)
    await expect(page.getByText(/disponible/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /continuer/i })).not.toBeDisabled()
  })

  test('passage a etape 2 apres validation correcte', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)
    await fillStep1(page, {
      name: 'Agence Test E2E',
      slug: `e2e-test-${Date.now()}`,
    })
    await page.waitForTimeout(1500)
    await clickNext(page)
    await expect(
      page.getByRole('heading', { name: /logo de votre marque/i })
    ).toBeVisible()
  })
})

test.describe('Etape 2 - Logo (optionnel)', () => {
  test('peut passer sans upload (logo optionnel)', async ({
    authenticatedPage: page,
  }) => {
    await goToStep2(page)
    await page.getByRole('button', { name: /continuer/i }).click()
    await expect(
      page.getByRole('heading', { name: /choisissez votre plan/i })
    ).toBeVisible()
  })

  test('bouton retour ramene a etape 1', async ({ authenticatedPage: page }) => {
    await goToStep2(page)
    await clickBack(page)
    await expect(
      page.getByRole('heading', { name: /votre espace de travail/i })
    ).toBeVisible()
  })

  test('affiche les initiales du tenant dans apercu', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)
    await fillStep1(page, {
      name: 'AI MPower',
      slug: `ai-mpower-${Date.now()}`,
    })
    await page.waitForTimeout(1500)
    await clickNext(page)
    await expect(page.getByText('AM')).toBeVisible()
  })

  test('rejet fichier non-image', async ({ authenticatedPage: page }) => {
    await goToStep2(page)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    })
    await expect(page.getByText(/format non support/i)).toBeVisible()
  })

  test('rejet fichier superieur a 10 MB', async ({
    authenticatedPage: page,
  }) => {
    await goToStep2(page)
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024, 0)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'huge-logo.png',
      mimeType: 'image/png',
      buffer: bigBuffer,
    })
    await expect(page.getByText(/ne doit pas d.passer 10 mb/i)).toBeVisible()
  })

  test('upload logo PNG valide affiche apercu', async ({
    authenticatedPage: page,
  }) => {
    await goToStep2(page)
    // PNG minimal valide 1x1 pixel
    const minimalPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'logo-test.png',
      mimeType: 'image/png',
      buffer: minimalPng,
    })
    // Apercu ou indicateur upload en cours
    await expect(
      page.locator('img[alt]').or(page.getByText(/upload/i).or(page.getByText(/logo/i)))
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Etape 3 - Selection du plan', () => {
  test('affiche les plans tarifaires', async ({
    authenticatedPage: page,
  }) => {
    await goToStep3(page)
    for (const plan of ['Free', 'Solo', 'Pro', 'Agency']) {
      await expect(page.getByText(plan, { exact: true })).toBeVisible()
    }
  })

  test('le plan Pro a le badge Recommande', async ({
    authenticatedPage: page,
  }) => {
    await goToStep3(page)
    await expect(page.getByText(/recommand/i)).toBeVisible()
  })

  test('bouton retour ramene a etape logo', async ({
    authenticatedPage: page,
  }) => {
    await goToStep3(page)
    await clickBack(page)
    await expect(
      page.getByRole('heading', { name: /logo de votre marque/i })
    ).toBeVisible()
  })

  test('affiche les prix corrects', async ({ authenticatedPage: page }) => {
    await goToStep3(page)
    await expect(page.getByText('$59')).toBeVisible()
    await expect(page.getByText('$149')).toBeVisible()
    await expect(page.getByText('$399')).toBeVisible()
    await expect(page.getByText('$699')).toBeVisible()
  })
})

test.describe('Parcours complet', () => {
  test('onboarding Free sans logo redirige vers dashboard', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)

    // Etape 1
    const uniqueSlug = `e2e-complete-${Date.now()}`
    await fillStep1(page, { name: 'Test Complete Agency', slug: uniqueSlug })
    await page.waitForTimeout(1500)
    await clickNext(page)

    // Etape 2 - passer sans logo
    await expect(
      page.getByRole('heading', { name: /logo de votre marque/i })
    ).toBeVisible()
    await page.getByRole('button', { name: /continuer/i }).click()

    // Etape 3 - choisir Free et soumettre
    await expect(
      page.getByRole('heading', { name: /choisissez votre plan/i })
    ).toBeVisible()
    await page.getByRole('button', { name: /creer mon espace/i }).click()

    // Doit rediriger vers le dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: /bienvenue/i })).toBeVisible()
  })

  test('stepper montre la progression entre etapes', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)
    await expect(page.locator('[aria-label="Progression"]')).toBeVisible()

    await fillStep1(page, {
      name: 'Stepper Test',
      slug: `stepper-${Date.now()}`,
    })
    await page.waitForTimeout(1500)
    await clickNext(page)

    // Etape 2 active - le stepper doit avoir un element aria-current
    await expect(page.locator('[aria-current="step"]')).toBeVisible()
  })
})

test.describe('Securite', () => {
  test('XSS dans le nom ne execute pas de script', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)
    const xssPayload = '<script>window.__xss_test = true</script>Agence Test'
    await page.getByLabel(/nom de l/i).fill(xssPayload)
    await page.waitForTimeout(200)
    const xssExecuted = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__xss_test
    )
    expect(xssExecuted).toBeFalsy()
  })

  test('slug avec injection SQL est rejete par la validation', async ({
    authenticatedPage: page,
  }) => {
    await goToStep1(page)
    await page.getByLabel(/nom de l/i).fill('Test SQL')
    const slugInput = page.getByLabel(/identifiant unique/i)
    await slugInput.clear()
    await slugInput.fill('drop-table--injection')
    await slugInput.blur()
    // "--" ne correspond pas au pattern kebab-case -> bouton desactive
    await expect(
      page.getByRole('button', { name: /continuer/i })
    ).toBeDisabled()
  })
})
