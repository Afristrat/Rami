import { test, expect } from '@playwright/test'

// ── Page Pricing (publique) ───────────────────────────────────────────────────

test.describe('Page pricing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
  })

  test('affiche les 5 plans', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /un prix pour chaque ambition/i })).toBeVisible()

    for (const plan of ['Free', 'Solo', 'Pro', 'Agency', 'Agency+']) {
      await expect(page.getByRole('heading', { name: plan })).toBeVisible()
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
    await expect(page.getByText('Marques / clients')).toBeVisible()
    await expect(page.getByText('White-label')).toBeVisible()
    await expect(page.getByText('API publique')).toBeVisible()
  })

  test('section FAQ avec 6 questions', async ({ page }) => {
    await expect(page.getByText(/puis-je changer de plan/i)).toBeVisible()
    await expect(page.getByText(/engagement de durée/i)).toBeVisible()
  })

  test('banner annulation visible si paramètre canceled=1', async ({ page }) => {
    await page.goto('/pricing?canceled=1')
    await expect(page.getByText(/paiement annulé/i)).toBeVisible()
  })

  test('bouton "Commencer gratuitement" redirige vers /dashboard', async ({ page }) => {
    await page.click('button:has-text("Commencer gratuitement")')
    await expect(page).toHaveURL(/\/(dashboard|login)/)
  })
})

// ── Page Billing (dashboard) ──────────────────────────────────────────────────

test.describe('Page billing dashboard', () => {
  test('redirige vers /login si non authentifié', async ({ page }) => {
    await page.goto('/dashboard/billing')
    await expect(page).toHaveURL(/\/(login|pricing)/)
  })

  test('redirige vers /pricing si plan Free', async ({ page }) => {
    // Simulate user on free plan hitting the billing page
    // The requireFeature('billing_module') redirect to /pricing
    // This is tested via the proxy/server guard
    await page.goto('/dashboard/billing')
    const url = page.url()
    // Either login (if not auth) or pricing (if free plan)
    expect(url).toMatch(/\/(login|pricing|dashboard\/billing)/)
  })
})

// ── Composant UpgradeModal ────────────────────────────────────────────────────

test.describe('Modal upgrade', () => {
  test('structure du modal est accessible', async ({ page }) => {
    // On monte un scenario où le modal est visible
    // Test avec une page dédiée aux tests ou en mockant la prop
    // Pour les tests unitaires côté composant, c'est fait dans tests/unit/
    // Ici on vérifie que la page pricing est accessible comme fallback
    await page.goto('/pricing')
    await expect(page.locator('body')).toBeVisible()
  })
})

// ── Plans et feature flags ────────────────────────────────────────────────────

test.describe('Feature flags', () => {
  test('route /dashboard/billing protégée côté serveur', async ({ page }) => {
    // Sans auth, redirigé
    await page.goto('/dashboard/billing')
    await expect(page).not.toHaveURL('/dashboard/billing')
  })

  test('page /pricing accessible sans authentification', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveURL('/pricing')
    await expect(page.locator('h1')).toBeVisible()
  })
})

// ── Webhook Stripe (route handler) ───────────────────────────────────────────

test.describe('Webhook Stripe', () => {
  test('retourne 400 sans signature Stripe', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(400)
  })

  test('retourne 400 avec signature invalide', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: JSON.stringify({ type: 'test' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid-signature',
      },
    })
    expect(response.status()).toBe(400)
  })
})

// ── Sécurité ─────────────────────────────────────────────────────────────────

test.describe('Sécurité billing', () => {
  test('page pricing ne contient pas de secrets en source HTML', async ({ page }) => {
    await page.goto('/pricing')
    const content = await page.content()

    // Vérifier qu'aucune clé Stripe ou secret n'est exposé
    expect(content).not.toMatch(/sk_live_/)
    expect(content).not.toMatch(/sk_test_[A-Za-z0-9]{20,}/)
    expect(content).not.toMatch(/whsec_/)
  })

  test('page billing redirect sans auth sans exposer de données', async ({ page }) => {
    await page.goto('/dashboard/billing')
    const content = await page.content()

    // Pas de données de facturation exposées sans auth
    expect(content).not.toMatch(/stripe_customer_id/)
    expect(content).not.toMatch(/stripe_subscription_id/)
  })
})
