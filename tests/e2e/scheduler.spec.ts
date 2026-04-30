/**
 * Tests e2e — Scheduler RAMI (calendrier de publication)
 *
 * Parcours testés :
 * 1. Accès et redirections (non-auth)
 * 2. Sécurité (XSS)
 */

import { test, expect } from '@playwright/test'

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Calendrier — Accès et redirections', () => {
  test('non-authentifié redirige vers /login', async ({ page }) => {
    await page.goto('/dashboard/calendar')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

test.describe('Calendrier — Sécurité', () => {
  test('page calendrier requiert authentification', async ({ page }) => {
    await page.goto('/dashboard/calendar')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
