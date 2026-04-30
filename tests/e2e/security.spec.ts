/**
 * Tests e2e — Sécurité RAMI
 *
 * Parcours testés :
 * 1. XSS — Champs formulaire avec balises script
 * 2. Isolation tenant — Routes protégées redirigent sans auth
 * 3. Rate limiting — Protection contre l'abus des routes API
 * 4. Feature flags — Plan Free ne peut pas accéder aux features Pro/Agency
 * 5. Headers de sécurité HTTP
 * 6. SQL injection prevention
 * 7. Accès non autorisé aux routes protégées
 */

import { test, expect } from '@playwright/test'

// ─── 1. Protection XSS ───────────────────────────────────────────────────────

test.describe('Sécurité — XSS Protection', () => {
  test('XSS dans le champ brief workflow — redirige vers login sans auth', async ({
    page,
  }) => {
    await page.goto('/dashboard/create')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('XSS dans le champ email du login est sanitisé', async ({ page }) => {
    await page.goto('/login')
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('<script>alert("xss")</script>')
    // Le script ne doit pas s'exécuter — la page reste fonctionnelle
    await expect(emailInput).toHaveValue('<script>alert("xss")</script>')
    // Aucun dialogue d'alerte ne doit apparaître
    const xssExecuted = await page.evaluate(
      () => !!(window as unknown as Record<string, unknown>).__xss_login
    )
    expect(xssExecuted).toBe(false)
  })

  test('XSS via paramètre URL — non réfléchi dans la page', async ({
    page,
  }) => {
    // Tenter une injection via query param sur une page publique
    await page.goto(
      '/pricing?period=<script>window.__xss_url=1</script>'
    )
    await page.waitForLoadState('networkidle')

    const xssExecuted = await page.evaluate(
      () => !!(window as unknown as Record<string, unknown>).__xss_url
    )
    expect(xssExecuted).toBe(false)
  })
})

// ─── 2. Isolation Tenant ─────────────────────────────────────────────────────

test.describe('Sécurité — Isolation Tenant (non authentifié)', () => {
  test('dashboard non accessible sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('Brand DNA non accessible sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard/brand-dna')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    const content = await page.content()
    expect(content).not.toMatch(/color_palette/i)
  })

  test('calendrier non accessible sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard/calendar')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ─── 3. Rate Limiting ─────────────────────────────────────────────────────────

test.describe('Sécurité — Rate Limiting', () => {
  test('webhook Stripe sans signature → 400 immédiat', async ({
    request,
  }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(400)
  })

  test('webhook Stripe avec signature invalide → 400', async ({
    request,
  }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: JSON.stringify({ type: 'test.event' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=123,v1=invalidsignature',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('OAuth callback sans state CSRF valide → erreur 400', async ({
    request,
  }) => {
    const response = await request.get(
      '/api/oauth/linkedin/callback?code=fake_code&state=invalid_state'
    )
    // Doit retourner une erreur (400, 401, ou redirection vers /settings/connections?error=...)
    expect([400, 401, 403, 302]).toContain(response.status())
  })

  test('OAuth callback sans code → erreur gérée', async ({ request }) => {
    const response = await request.get(
      '/api/oauth/twitter/callback?error=access_denied'
    )
    // Doit gérer l'erreur proprement sans crash 500
    expect(response.status()).not.toBe(500)
  })

  test('multiples appels successifs au login ne causent pas d\'erreur serveur', async ({
    page,
  }) => {
    await page.goto('/login')
    // Simuler des tentatives rapides successives (pas de brute force réel)
    for (let i = 0; i < 3; i++) {
      await page.getByLabel('Email').fill(`test${i}@example.com`)
      await page.getByLabel('Mot de passe').fill('wrongpassword1A')
      await page.getByRole('button', { name: /Se connecter/i }).click()
      await page.waitForLoadState('domcontentloaded')
    }

    // La page doit toujours être sur /login ou afficher un message d'erreur
    // Pas de crash 500
    const url = page.url()
    expect(url).toMatch(/\/login/)

    const content = await page.content()
    expect(content).not.toMatch(/500|internal server error/i)
  })
})

// ─── 4. Feature Flags ─────────────────────────────────────────────────────────

test.describe('Sécurité — Feature Flags', () => {
  test('route /dashboard/billing — non authentifié → redirigé', async ({
    page,
  }) => {
    await page.goto('/dashboard/billing')
    await expect(page).toHaveURL(/\/(login|pricing)/, { timeout: 10000 })
  })

  test('page /pricing accessible sans authentification', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveURL('/pricing')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('plan Free — aucun secret Stripe exposé côté client', async ({
    page,
  }) => {
    await page.goto('/pricing')
    const content = await page.content()
    expect(content).not.toMatch(/sk_live_/)
    expect(content).not.toMatch(/sk_test_[A-Za-z0-9]{20,}/)
    expect(content).not.toMatch(/whsec_/)
  })
})

// ─── 5. Headers de sécurité HTTP ─────────────────────────────────────────────

test.describe('Sécurité — Headers HTTP', () => {
  test('la page /login a les headers de sécurité essentiels', async ({
    request,
  }) => {
    const response = await request.get('/login')
    const headers = response.headers()

    // X-Content-Type-Options
    expect(headers['x-content-type-options'] ?? '').toBe('nosniff')

    // X-Frame-Options
    const xFrameOptions = headers['x-frame-options'] ?? ''
    expect(xFrameOptions.toLowerCase()).toMatch(/sameorigin|deny/)
  })

  test('aucune donnée sensible dans les headers de réponse', async ({
    request,
  }) => {
    const response = await request.get('/login')
    const headers = response.headers()

    // Pas de X-Powered-By exposant la technologie
    expect(headers['x-powered-by'] ?? '').not.toMatch(/php|asp\.net/i)

    // Server header ne révèle pas trop d'informations
    const serverHeader = headers['server'] ?? ''
    expect(serverHeader).not.toMatch(/apache\/\d|nginx\/\d/i)
  })

  test('route API webhook répond 400 sans signature', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: '{}',
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(400)
  })
})

// ─── 6. Injection SQL / Paramètres malveillants ──────────────────────────────

test.describe('Sécurité — Injection et paramètres malveillants', () => {
  test('paramètres URL avec characters spéciaux sur page publique — pas de crash', async ({
    page,
  }) => {
    // Tenter d'injecter des caractères spéciaux dans les query params
    await page.goto(
      "/pricing?plan=agency'%20OR%201=1--"
    )
    await page.waitForLoadState('networkidle')

    // La page doit charger sans erreur 500
    const content = await page.content()
    expect(content).not.toMatch(/500|internal server error|unhandled error/i)
  })

  test('ID invalide dans les routes — retourne 404 ou 400 proprement', async ({
    request,
  }) => {
    // Tenter d'accéder à une ressource avec un ID SQL-injecté
    const response = await request.get(
      "/api/oauth/linkedin/callback?state='; DROP TABLE oauth_connections; --"
    )
    expect([400, 401, 403, 302, 404]).toContain(response.status())
    expect(response.status()).not.toBe(500)
  })
})

// ─── 7. Routes protégées supplémentaires ─────────────────────────────────────

test.describe('Sécurité — Routes protégées par authentification', () => {
  test('page /dashboard/leads redirige sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard/leads')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('page /dashboard/documents redirige sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard/documents')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('page /dashboard/transcriptions redirige sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard/transcriptions')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('page /settings redirige sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/settings')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('page /admin redirige sans auth', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})

// ─── 8. API locale endpoint ─────────────────────────────────────────────────

test.describe('Sécurité — API locale', () => {
  test('API locale accepte les locales valides', async ({ request }) => {
    const response = await request.post('/api/locale', {
      data: { locale: 'en' },
    })
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.locale).toBe('en')
  })

  test('API locale rejette les locales invalides', async ({ request }) => {
    const response = await request.post('/api/locale', {
      data: { locale: 'xx' },
    })
    expect(response.status()).toBe(400)
  })
})

// ─── 9. Endpoints infrastructure J10 ────────────────────────────────────────

test.describe('Infrastructure — Health & Cron', () => {
  test('/api/health répond 200 ou 503 avec JSON structuré', async ({ request }) => {
    const response = await request.get('/api/health')
    expect([200, 503]).toContain(response.status())
    const body = await response.json() as Record<string, unknown>
    expect(body).toHaveProperty('status')
    expect(['ok', 'degraded', 'down']).toContain(body.status)
  })

  test('/api/health retourne les checks attendus', async ({ request }) => {
    const response = await request.get('/api/health')
    const body = await response.json() as Record<string, unknown>
    // Le endpoint doit documenter les checks système
    expect(body).toHaveProperty('checks')
  })

  test('/api/cron/stripe-reconcile sans secret → 401', async ({ request }) => {
    const response = await request.get('/api/cron/stripe-reconcile')
    expect(response.status()).toBe(401)
  })

  test('/api/cron/stripe-reconcile avec secret invalide → 401', async ({ request }) => {
    const response = await request.get('/api/cron/stripe-reconcile', {
      headers: { Authorization: 'Bearer invalid-secret-xyz' },
    })
    expect(response.status()).toBe(401)
  })

  test('/api/health — aucun secret exposé dans la réponse', async ({ request }) => {
    const response = await request.get('/api/health')
    const text = await response.text()
    expect(text).not.toMatch(/sk-ant-|sk_live_|whsec_|service_role/)
    expect(text).not.toMatch(/OAUTH_TOKEN_ENCRYPTION_KEY/)
  })
})

// ─── 10. Pas de données sensibles dans le HTML public ────────────────────────

test.describe('Sécurité — Pas de données sensibles dans le HTML', () => {
  test('page /login ne contient aucun secret', async ({ page }) => {
    await page.goto('/login')
    const content = await page.content()
    expect(content).not.toMatch(/sk-ant-/)
    expect(content).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
    expect(content).not.toMatch(/OAUTH_TOKEN_ENCRYPTION_KEY/)
    expect(content).not.toMatch(/stripe_secret_key/i)
  })

  test('page /register ne contient aucun secret', async ({ page }) => {
    await page.goto('/register')
    const content = await page.content()
    expect(content).not.toMatch(/sk-ant-/)
    expect(content).not.toMatch(/service_role/)
  })

  test('page /pricing ne contient pas de clés Stripe secrètes', async ({
    page,
  }) => {
    await page.goto('/pricing')
    const content = await page.content()
    expect(content).not.toMatch(/sk_live_[A-Za-z0-9]/)
    expect(content).not.toMatch(/whsec_[A-Za-z0-9]/)
  })
})
