import { test, expect } from '@playwright/test'

test.describe('Publishing & Calendar', () => {
  test('calendar page requires auth', async ({ page }) => {
    await page.goto('/dashboard/calendar')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('approvals page requires auth', async ({ page }) => {
    await page.goto('/dashboard/approvals')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('connections settings page requires auth', async ({ page }) => {
    await page.goto('/settings/connections')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('library page requires auth', async ({ page }) => {
    await page.goto('/dashboard/library')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('analytics page requires auth', async ({ page }) => {
    await page.goto('/dashboard/analytics')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
