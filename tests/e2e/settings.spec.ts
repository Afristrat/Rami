/**
 * Tests e2e — Settings RAMI
 *
 * Parcours testés :
 * 1. Accès et redirections (non-auth)
 * 2. Sécurité — pas d'informations sensibles exposées
 */

import { test, expect } from '@playwright/test'

// ── Accès et redirections ─────────────────────────────────────────────────────

test.describe('Settings — Accès et redirections', () => {
  test('non-authentifié sur /dashboard/settings → redirige vers /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('non-authentifié sur /dashboard/settings/connections → redirige vers /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings/connections')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('non-authentifié sur /dashboard/settings/profile → redirige vers /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings/profile')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('non-authentifié sur /dashboard/settings/team → redirige vers /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings/team')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('non-authentifié sur /dashboard/settings/notifications → redirige vers /login', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings/notifications')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ── Sécurité ──────────────────────────────────────────────────────────────────

test.describe('Settings — Sécurité', () => {
  test('aucun secret exposé dans le HTML de settings/connections', async ({
    page,
  }) => {
    await page.goto('/dashboard/settings/connections')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    const content = await page.content()
    expect(content).not.toMatch(/OAUTH_TOKEN_ENCRYPTION_KEY/)
    expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE/)
    expect(content).not.toMatch(/sk-ant-/)
    expect(content).not.toMatch(/access_token_encrypted/)
    expect(content).not.toMatch(/refresh_token_encrypted/)
  })
})
