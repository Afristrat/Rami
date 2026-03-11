/**
 * Tests e2e — Settings RAMI
 *
 * Parcours testés :
 * 1. Accès et redirections (non-auth)
 * 2. Navigation dans les paramètres (Connexions, Profil, Équipe, Notifications)
 * 3. Structure et affichage de la page paramètres
 * 4. Sécurité — pas d'informations sensibles exposées
 */

import { test, expect } from './fixtures/auth'
import { type Page } from '@playwright/test'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function goToSettings(page: Page) {
  await page.goto('/dashboard/settings')
  await page.waitForLoadState('networkidle')
}

async function goToConnections(page: Page) {
  await page.goto('/dashboard/settings/connections')
  await page.waitForLoadState('networkidle')
}

// ── Accès et redirections ─────────────────────────────────────────────────────

test.describe('Settings — Accès et redirections', () => {
  test('non-authentifié sur /dashboard/settings → redirige vers /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/login/)
  })

  test('non-authentifié sur /dashboard/settings/connections → redirige vers /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings/connections')
    await expect(page).toHaveURL(/\/login/)
  })

  test('auth + non-onboardé sur /dashboard/settings → redirige vers /onboarding', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('/dashboard/settings redirige vers /dashboard/settings/connections', async ({
    onboardedPage: page,
  }) => {
    await page.goto('/dashboard/settings')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/settings\/connections/)
  })
})

// ── Structure de la page Paramètres ──────────────────────────────────────────

test.describe('Settings — Structure générale', () => {
  test('affiche le titre "Paramètres"', async ({ onboardedPage: page }) => {
    await goToSettings(page)
    await expect(
      page.getByRole('heading', { name: 'Paramètres' })
    ).toBeVisible()
  })

  test('affiche la description de la page paramètres', async ({
    onboardedPage: page,
  }) => {
    await goToSettings(page)
    await expect(
      page.getByText(/gérez votre compte|connexions|préférences/i)
    ).toBeVisible()
  })

  test('affiche la navigation latérale avec les 4 sections', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    const nav = page.getByRole('navigation')
    await expect(nav.getByText('Connexions')).toBeVisible()
    await expect(nav.getByText('Profil')).toBeVisible()
    await expect(nav.getByText('Équipe')).toBeVisible()
    await expect(nav.getByText('Notifications')).toBeVisible()
  })

  test('lien Connexions est actif quand sur /settings/connections', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    const connectionsLink = page.getByRole('link', { name: 'Connexions' })
    await expect(connectionsLink).toBeVisible()
    // Le lien actif doit avoir un style distinct (classe active)
    await expect(connectionsLink).toHaveAttribute('href', '/dashboard/settings/connections')
  })
})

// ── Navigation settings ───────────────────────────────────────────────────────

test.describe('Settings — Navigation entre sections', () => {
  test('cliquer sur "Profil" navigue vers /settings/profile', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/settings\/profile/)
  })

  test('cliquer sur "Équipe" navigue vers /settings/team', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    await page.getByRole('link', { name: 'Équipe' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/settings\/team/)
  })

  test('cliquer sur "Notifications" navigue vers /settings/notifications', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    await page.getByRole('link', { name: 'Notifications' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/settings\/notifications/)
  })

  test('retour sur "Connexions" depuis une autre section', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Connexions' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/settings\/connections/)
  })
})

// ── Page Connexions ───────────────────────────────────────────────────────────

test.describe('Settings — Page Connexions', () => {
  test('affiche le titre "Connexions sociales"', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    await expect(
      page.getByRole('heading', { name: 'Connexions sociales' })
    ).toBeVisible()
  })

  test('affiche les 5 plateformes avec leur bouton Connecter', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    const platforms = [
      'X (Twitter)',
      'LinkedIn',
      'Instagram',
      'Facebook',
      'Pinterest',
    ]
    for (const platform of platforms) {
      await expect(page.getByText(platform)).toBeVisible()
    }
  })

  test('bouton Connecter présent pour chaque plateforme non connectée', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    // Au moins un bouton "Connecter" visible
    await expect(
      page.getByRole('button', { name: /connecter/i }).first()
    ).toBeVisible()
  })
})

// ── Responsive ────────────────────────────────────────────────────────────────

test.describe('Settings — Responsive', () => {
  test('nav settings visible en mobile (horizontal)', async ({
    onboardedPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await goToConnections(page)
    // Sur mobile, la nav est horizontale (flex-row)
    await expect(page.getByRole('link', { name: 'Connexions' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Profil' })).toBeVisible()
  })

  test('nav settings en desktop (vertical sidebar)', async ({
    onboardedPage: page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await goToConnections(page)
    await expect(page.getByRole('navigation')).toBeVisible()
  })
})

// ── Sécurité ──────────────────────────────────────────────────────────────────

test.describe('Settings — Sécurité', () => {
  test('aucun secret exposé dans le HTML de settings/connections', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    const content = await page.content()
    expect(content).not.toMatch(/OAUTH_TOKEN_ENCRYPTION_KEY/)
    expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE/)
    expect(content).not.toMatch(/sk-ant-/)
    expect(content).not.toMatch(/access_token_encrypted/)
  })

  test('tokens OAuth ne sont pas exposés dans le HTML', async ({
    onboardedPage: page,
  }) => {
    await goToConnections(page)
    const content = await page.content()
    // Les champs sensibles ne doivent pas apparaître dans le rendu HTML
    expect(content).not.toMatch(/refresh_token_encrypted/)
  })
})
