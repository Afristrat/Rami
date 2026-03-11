import { test as base, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Fixture d'authentification pour les tests e2e
// Crée un utilisateur Supabase de test et gère la session

export interface TestUser {
  email: string
  password: string
  id?: string
  tenantId?: string
}

export interface TwoTenantContext {
  pageA: Page
  pageB: Page
  userA: TestUser
  userB: TestUser
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

/**
 * Crée un utilisateur onboardé avec son tenant.
 * Retourne l'utilisateur avec id et tenantId renseignés.
 */
export async function createOnboardedUser(user: TestUser): Promise<TestUser> {
  const { data } = await supabaseAdmin.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { onboarding_completed: true },
  })

  if (!data.user) {
    throw new Error(`Impossible de créer l'utilisateur : ${user.email}`)
  }

  user.id = data.user.id

  const tenantSlug = `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const tenantRes = await supabaseAdmin
    .from('tenants')
    .insert({
      name: `Test Agency ${tenantSlug}`,
      slug: tenantSlug,
      owner_id: data.user.id,
      plan: 'pro',
    })
    .select('id')
    .single()

  if (tenantRes.data) {
    user.tenantId = tenantRes.data.id

    await supabaseAdmin
      .from('users')
      .upsert({
        id: data.user.id,
        email: user.email,
        role: 'agency_owner',
        tenant_id: tenantRes.data.id,
        onboarding_completed: true,
      })
  }

  return user
}

// ── Fixture étendue ───────────────────────────────────────────────────────────

export const test = base.extend<{
  authenticatedPage: Page
  onboardedPage: Page
  testUser: TestUser
  twoTenants: TwoTenantContext
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
    await createOnboardedUser(testUser)
    await signInTestUser(page, testUser)
    await use(page)
  },

  // Deux tenants distincts — pour les tests d'isolation
  twoTenants: async ({ browser }, use) => {
    const ts = Date.now()
    const userA: TestUser = {
      email: `tenant-a-${ts}@rami-test.local`,
      password: 'TestPassword123!',
    }
    const userB: TestUser = {
      email: `tenant-b-${ts}@rami-test.local`,
      password: 'TestPassword123!',
    }

    // Créer deux utilisateurs indépendants avec leurs tenants
    await createOnboardedUser(userA)
    await createOnboardedUser(userB)

    // Créer deux contextes navigateur isolés
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    // Connecter chaque utilisateur dans son propre contexte
    await signInTestUser(pageA, userA)
    await signInTestUser(pageB, userB)

    await use({ pageA, pageB, userA, userB })

    // Nettoyage
    await contextA.close()
    await contextB.close()
    await deleteTestUser(userA.email)
    await deleteTestUser(userB.email)
  },
})

export { expect } from '@playwright/test'
