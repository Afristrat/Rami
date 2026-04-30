/**
 * Tests e2e — Analytics RAMI
 *
 * Parcours testés :
 * 1. Accès et redirections (non-auth)
 * 2. Sécurité (accès sans auth, pas de secrets exposés)
 */

import { test, expect } from '@playwright/test'

// ── Accès et redirections ─────────────────────────────────────────────────────

test.describe('Analytics — Accès et redirections', () => {
  test('non-authentifié redirige vers /login', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ── Sécurité ──────────────────────────────────────────────────────────────────

test.describe('Analytics — Sécurité', () => {
  test('la page analytics redirige sans exposer de secrets', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    const content = await page.content()
    expect(content).not.toMatch(/sk-ant-/)
    expect(content).not.toMatch(/sk_live_/)
    expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE/)
    expect(content).not.toMatch(/whsec_/)
  })

  test('paramètres de filtre invalides ne causent pas d\'erreur serveur', async ({ page }) => {
    await page.goto('/dashboard/analytics?period=INVALID&platforms=<script>')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
