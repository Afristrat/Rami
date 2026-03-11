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

// Type de fixture étendu
export const test = base.extend<{
  authenticatedPage: Page
  testUser: TestUser
}>({
  testUser: async ({}, use) => {
    const user: TestUser = {
      email: `test-onboarding-${Date.now()}@rami-test.local`,
      password: 'TestPassword123!',
    }
    await use(user)
    // Nettoyage après le test
    await deleteTestUser(user.email)
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    // Créer et connecter l'utilisateur
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
})

export { expect } from '@playwright/test'
