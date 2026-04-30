/**
 * RAMI — Fix métadonnées Auth
 * ============================================================
 * Corrige les app_metadata et user_metadata des utilisateurs seed.
 *
 * Problème : le seed original ne définissait que profiles.global_role,
 * mais le middleware vérifie user.app_metadata.role === 'super_admin'
 * et user.user_metadata.onboarding_completed === true.
 *
 * Usage : npx tsx scripts/fix-auth-metadata.ts
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Variables NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const USERS_TO_FIX = [
  {
    email: 'amine@ai-mpower.com',
    full_name: 'Amine Mansouri',
    app_metadata: { role: 'super_admin' },
    user_metadata: { full_name: 'Amine Mansouri', onboarding_completed: true },
  },
  {
    email: 'sarah@agence-casa.ma',
    full_name: 'Sarah El Mansouri',
    app_metadata: { role: 'user' },
    user_metadata: { full_name: 'Sarah El Mansouri', onboarding_completed: true },
  },
  {
    email: 'karim@consultant.ma',
    full_name: 'Karim Benali',
    app_metadata: { role: 'user' },
    user_metadata: { full_name: 'Karim Benali', onboarding_completed: true },
  },
  {
    email: 'fatima@coach-ma.com',
    full_name: 'Fatima Zahra Alaoui',
    app_metadata: { role: 'user' },
    user_metadata: { full_name: 'Fatima Zahra Alaoui', onboarding_completed: true },
  },
  {
    email: 'youssef@startup.tn',
    full_name: 'Youssef Ben Salah',
    app_metadata: { role: 'user' },
    // Youssef n'a pas de Brand DNA → onboarding non terminé intentionnellement
    user_metadata: { full_name: 'Youssef Ben Salah', onboarding_completed: false },
  },
]

async function fixAuthMetadata() {
  console.log('\n════════════════════════════════════════════════════')
  console.log('  RAMI — Fix métadonnées Auth utilisateurs seed')
  console.log('════════════════════════════════════════════════════\n')

  // Récupérer tous les utilisateurs Supabase
  const { data: allUsersData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 100 })

  if (listError) {
    console.error('❌  Impossible de lister les utilisateurs:', listError.message)
    process.exit(1)
  }

  const allUsers = allUsersData.users

  for (const userDef of USERS_TO_FIX) {
    const found = allUsers.find((u) => u.email === userDef.email)

    if (!found) {
      console.log(`⚠️   ${userDef.email} — introuvable dans Supabase Auth (pas encore seedé ?)`)
      continue
    }

    console.log(`\n── ${userDef.full_name} (${userDef.email})`)
    console.log(`   ID : ${found.id}`)
    console.log(`   app_metadata actuel :`, JSON.stringify(found.app_metadata))
    console.log(`   user_metadata actuel :`, JSON.stringify(found.user_metadata))

    const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(found.id, {
      app_metadata: userDef.app_metadata,
      user_metadata: userDef.user_metadata,
    })

    if (updateError) {
      console.error(`❌  Erreur mise à jour ${userDef.email}:`, updateError.message)
      continue
    }

    console.log(`✅  Métadonnées mises à jour`)
    console.log(`   app_metadata final :`, JSON.stringify(updated.user.app_metadata))
    console.log(`   user_metadata final :`, JSON.stringify(updated.user.user_metadata))
  }

  console.log('\n════════════════════════════════════════════════════')
  console.log('  ✅  Fix terminé')
  console.log('════════════════════════════════════════════════════\n')
  console.log('📋 Comptes corrigés :')
  console.log('┌─────────────────────────────────┬────────────────────────┬────────────────────┬──────────────────────────┐')
  console.log('│ Nom                             │ Email                  │ Mot de passe       │ Rôle                     │')
  console.log('├─────────────────────────────────┼────────────────────────┼────────────────────┼──────────────────────────┤')
  console.log('│ Amine Mansouri (Super Admin)    │ amine@ai-mpower.com    │ Admin2026!         │ super_admin              │')
  console.log('│ Sarah El Mansouri               │ sarah@agence-casa.ma   │ Test2026!          │ user (onboardé)          │')
  console.log('│ Karim Benali                    │ karim@consultant.ma    │ Test2026!          │ user (onboardé)          │')
  console.log('│ Fatima Zahra Alaoui             │ fatima@coach-ma.com    │ Test2026!          │ user (onboardée)         │')
  console.log('│ Youssef Ben Salah               │ youssef@startup.tn     │ Test2026!          │ user (onboarding pending)│')
  console.log('└─────────────────────────────────┴────────────────────────┴────────────────────┴──────────────────────────┘')
  console.log('\n🌐 Connexion : http://localhost:3000/login')
  console.log('👑 Amine → redirigé vers /dashboard (super_admin bypass onboarding)\n')
}

fixAuthMetadata().catch((err) => {
  console.error('\n❌  Erreur fatale:', err)
  process.exit(1)
})
