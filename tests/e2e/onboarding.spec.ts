import { test, expect } from '@playwright/test'

test.describe('Brand DNA', () => {
  test('brand DNA edit page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/brand-dna/edit')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('brand DNA view page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/brand-dna')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('brand DNA assets page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/brand-dna/assets')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('brand DNA guidelines page redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard/brand-dna/guidelines')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('brand DNA edit page loads without JS errors after redirect', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto('/dashboard/brand-dna/edit')
    await page.waitForLoadState('networkidle')

    expect(errors, `JS errors detected: ${errors.join('\n')}`).toHaveLength(0)
  })
})
