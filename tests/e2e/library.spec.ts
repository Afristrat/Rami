import { test, expect } from "@playwright/test"

test.describe("Médiathèque", () => {
  test("redirige vers login si non authentifié", async ({ page }) => {
    await page.goto("/dashboard/library")
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
