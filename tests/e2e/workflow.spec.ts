import { test, expect } from '@playwright/test'

test.describe('Content Creation Workflow', () => {
  test('create post page requires auth', async ({ page }) => {
    await page.goto('/dashboard/create')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('visual creation page requires auth', async ({ page }) => {
    await page.goto('/create')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('video creation page requires auth', async ({ page }) => {
    await page.goto('/create/video')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
