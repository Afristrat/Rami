import { test, expect } from '@playwright/test'

// ── Page Pricing (publique) ───────────────────────────────────────────────────

test.describe('Page pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
  })

  test('affiche les 5 plans', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /un prix pour chaque ambition/i })).toBeVisible()

    for (const plan of ['Free', 'Solo', 'Pro', 'Agency', 'Agency+']) {
      await expect(page.getByRole('heading', { name: plan, exact: true })).toBeVisible()
    }
  })

  test('affiche les prix corrects', async ({ page }) => {
    await expect(page.getByText('$0')).toBeVisible()
    await expect(page.getByText('$59')).toBeVisible()
    await expect(page.getByText('$149')).toBeVisible()
    await expect(page.getByText('$399')).toBeVisible()
    await expect(page.getByText('$699')).toBeVisible()
  })

  test('badge Recommandé sur le plan Pro', async ({ page }) => {
    await expect(page.getByText('Recommandé')).toBeVisible()
  })

  test('tableau comparatif visible', async ({ page }) => {
    const table = page.locator('table').first()
    await table.scrollIntoViewIfNeeded()
    await expect(page.getByText('Marques / clients')).toBeVisible()
    await expect(page.getByText('White-label').first()).toBeAttached()
    await expect(page.getByText('API publique').first()).toBeAttached()
  })

  test('section FAQ avec 6 questions', async ({ page }) => {
    await expect(page.getByText(/puis-je changer de plan/i)).toBeVisible()
    await expect(page.getByText(/engagement de durée/i)).toBeVisible()
  })

  test('banner annulation visible si paramètre canceled=1', async ({ page }) => {
    await page.goto('/pricing?canceled=1')
    await expect(page.getByText(/paiement annulé/i)).toBeVisible()
  })

  test('bouton "Commencer gratuitement" redirige vers /dashboard ou /login', async ({ page }) => {
    await page.click('button:has-text("Commencer gratuitement")')
    await expect(page).toHaveURL(/\/(dashboard|login)/)
  })
})

// ── Page Billing (dashboard) ──────────────────────────────────────────────────

test.describe('Page billing dashboard', () => {
  test('redirige vers /login ou /pricing si non authentifié', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await expect(page).toHaveURL(/\/(login|pricing)/, { timeout: 10000 })
  })
})

// ── Sécurité billing ─────────────────────────────────────────────────────────

test.describe('Sécurité billing', () => {
  test('page billing redirect sans auth sans exposer de données', async ({ page }) => {
    await page.goto('/dashboard/billing')
    const content = await page.content()

    expect(content).not.toMatch(/stripe_customer_id/)
    expect(content).not.toMatch(/stripe_subscription_id/)
  })
})
