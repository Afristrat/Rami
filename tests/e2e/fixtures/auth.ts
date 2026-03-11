import { test as base, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Fixture d'authentification pour les tests e2e
// Crée un utilisateur Supabase de test et gère la session

export interface TestUser {
  email: string
  password: string
  id?: string
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function signUpTestUser(
  page: Page,
  user: TestUser
): Promise<void> {
  // Créer l'utilisateur via l'API admin Supabase (pas de confirmation email en test)
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true, // Confirmer immédiatement en test
  })

  if (error && !error.message.includes('already registered')) {
    throw new Error(`Impossible de créer l'utilisateur test : ${error.message}`)
  }

  // Se connecter via l'UI
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
}

export async function deleteTestUser(email: string): Promise<void> {
  const { data } = await supabaseAdmin.auth.admin.listUsers()
  const user = data.users.find((u) => u.email === email)
  if (user) {
    await supabaseAdmin.auth.admin.deleteUser(user.id)
  }
}

export async function signInTestUser(
  page: Page,
  user: TestUser
): Promise<void> {
  // Injection de session via Supabase pour éviter de passer par l'UI login
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  })

  if (error || !data.properties?.action_link) {
    throw new Error(`Impossible de générer le lien de connexion : ${error?.message}`)
  }

  // Naviguer vers le magic link pour créer la session
  await page.goto(data.properties.action_link)
  await page.waitForLoadState('networkidle')
}

// ── Fixture étendue ───────────────────────────────────────────────────────────

export const test = base.extend<{
  authenticatedPage: Page
  onboardedPage: Page
  testUser: TestUser
}>({
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: `test-${Date.now()}@rami-test.local`,
      password: 'TestPassword123!',
    }
    await use(user)
    // Nettoyage après le test
    await deleteTestUser(user.email)
  },

  // Utilisateur authentifié mais pas encore onboardé
  authenticatedPage: async ({ page, testUser }, use) => {
    const { data } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
    })

    if (data.user) {
      testUser.id = data.user.id
    }

    await signInTestUser(page, testUser)
    await use(page)
  },

  // Utilisateur authentifié ET onboardé (onboarding_completed = true dans metadata)
  onboardedPage: async ({ page, testUser }, use) => {
    // 1. Créer l'utilisateur
    const { data } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: { onboarding_completed: true },
    })

    if (data.user) {
      testUser.id = data.user.id

      // 2. Insérer un tenant de test + lier l'utilisateur via l'API Supabase
      //    On utilise la table REST directement avec le service role
      const tenantSlug = `test-tenant-${Date.now()}`

      const tenantRes = await supabaseAdmin
        .from('tenants')
        .insert({
          name: 'Test Agency',
          slug: tenantSlug,
          owner_id: data.user.id,
          plan: 'pro',
        })
        .select('id')
        .single()

      if (tenantRes.data) {
        await supabaseAdmin
          .from('users')
          .upsert({
            id: data.user.id,
            email: testUser.email,
            role: 'agency_owner',
            tenant_id: tenantRes.data.id,
            onboarding_completed: true,
          })
      }
    }

    // 3. Connecter l'utilisateur
    await signInTestUser(page, testUser)
    await use(page)
  },
})

export { expect } from '@playwright/test'
