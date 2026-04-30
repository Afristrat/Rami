/**
 * Tests e2e — Santé du build RAMI
 *
 * Vérifie que les pages publiques et critiques se chargent sans erreurs JavaScript.
 * Ces tests ne nécessitent pas de base de données réelle.
 */

import { test, expect } from '@playwright/test'

test.describe('Santé du build — Pages publiques', () => {
  test('la page /login se charge sans erreurs JS', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    expect(errors, `JS errors detected: ${errors.join('\n')}`).toHaveLength(0)
  })

  test('la page /pricing se charge sans erreurs JS', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')

    expect(errors, `JS errors detected: ${errors.join('\n')}`).toHaveLength(0)
  })

  test('la page /register se charge sans erreurs JS', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    expect(errors, `JS errors detected: ${errors.join('\n')}`).toHaveLength(0)
  })
})

test.describe('Santé du build — Rendu visuel', () => {
  test('/login affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 })
  })

  test('/pricing affiche au moins un plan', async ({ page }) => {
    await page.goto('/pricing')
    await expect(
      page.locator('text=/Free|Solo|Pro|Agency/i').first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('/register affiche le formulaire d\'inscription', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 })
  })
})
