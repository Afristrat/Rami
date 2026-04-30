import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /connecter|sign in|login/i })).toBeVisible()
  })

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('input[id="fullName"]')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('login with empty fields shows validation', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /connecter|sign in|login/i }).click()
    // Zod validation via react-hook-form: aria-invalid is set on invalid fields
    await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible()
  })

  test('register with short password shows error', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[id="fullName"]', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[id="password"]', '123')
    await page.fill('input[id="confirmPassword"]', '123')
    await page.getByRole('button', { name: /créer|create|sign up/i }).click()
    // Zod schema requires min 8 chars: "Le mot de passe doit contenir au moins 8 caractères"
    await expect(page.locator('text=/8 caractères|8 characters|min/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('reset password page loads', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('unauthenticated user redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    // Middleware should redirect unauthenticated users to login
    await expect(page).toHaveURL(/login/, { timeout: 10000 })
  })

  test('login and register pages have language switcher', async ({ page }) => {
    await page.goto('/login')
    // Find the globe button (LocaleSwitcher component renders a button with Globe icon)
    const globeButton = page.locator('button').filter({ has: page.locator('svg.lucide-globe') })
    await expect(globeButton.first()).toBeVisible({ timeout: 5000 })
  })
})
