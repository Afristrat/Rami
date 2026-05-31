#!/usr/bin/env tsx
/**
 * RAMI — Script de promotion super_admin
 *
 * Promeut un utilisateur existant en super_admin via le service role Supabase.
 * La promotion consiste à :
 *  1. Trouver l'utilisateur par email dans auth.users
 *  2. Mettre à jour raw_app_meta_data avec { role: "super_admin" }
 *  3. Mettre à jour la table profiles (si elle existe) avec role = "super_admin"
 *
 * Usage :
 *   npx tsx scripts/create-super-admin.ts <email>
 *   npx tsx scripts/create-super-admin.ts admin@example.com
 *
 * Prérequis :
 *   - SUPABASE_SERVICE_ROLE_KEY définie dans .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL définie dans .env.local
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function usage(): void {
  console.error("Usage : npx tsx scripts/create-super-admin.ts <email>")
  console.error("Exemple : npx tsx scripts/create-super-admin.ts admin@example.com")
  process.exit(1)
}

async function main(): Promise<void> {
  // ── Validation arguments ───────────────────────────────────────────────────
  const email = process.argv[2]
  if (!email || !email.includes("@")) {
    console.error("Erreur : email invalide ou manquant.")
    usage()
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
      "Erreur : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local"
    )
    process.exit(1)
  }

  // ── Client Supabase service role (bypass RLS) ──────────────────────────────
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`\n🔍 Recherche de l'utilisateur : ${email}`)

  // ── Étape 1 : Trouver l'utilisateur par email ──────────────────────────────
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers()

  if (listError) {
    console.error("Erreur lors de la récupération des utilisateurs :", listError.message)
    process.exit(1)
  }

  const user = listData.users.find((u) => u.email === email)

  if (!user) {
    console.error(`Utilisateur introuvable avec l'email : ${email}`)
    console.error("Vérifiez que l'utilisateur est bien inscrit dans Supabase Auth.")
    process.exit(1)
  }

  console.log(`✅ Utilisateur trouvé : ${user.id} (${user.email})`)
  console.log(`   Rôle actuel : ${JSON.stringify(user.app_metadata?.role ?? "(aucun)")}`)

  // ── Étape 2 : Mettre à jour raw_app_meta_data ──────────────────────────────
  const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      app_metadata: {
        ...user.app_metadata,
        role: "super_admin",
      },
    }
  )

  if (updateError) {
    console.error("Erreur lors de la mise à jour des métadonnées :", updateError.message)
    process.exit(1)
  }

  console.log(`✅ app_metadata mis à jour : role = "super_admin"`)
  console.log(`   Nouveau app_metadata : ${JSON.stringify(updateData.user.app_metadata)}`)

  // ── Étape 3 : Mettre à jour la table profiles (si elle existe) ─────────────
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        global_role: "super_admin",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (profileError) {
    if (profileError.code === "42P01") {
      // Table profiles inexistante — pas bloquant
      console.log("ℹ️  Table profiles absente (normal si non encore créée).")
    } else {
      console.warn("Avertissement : erreur table profiles :", profileError.message)
    }
  } else {
    console.log(`✅ Table profiles mise à jour.`)
  }

  // ── Résumé ─────────────────────────────────────────────────────────────────
  console.log(`
═══════════════════════════════════════════════
✅ PROMOTION SUPER_ADMIN RÉUSSIE

  Email    : ${email}
  User ID  : ${user.id}
  Rôle     : super_admin
═══════════════════════════════════════════════

Le rôle est accessible dans les Server Actions via :
  const session = await supabase.auth.getSession()
  const role = session.data.session?.user?.app_metadata?.role
  // → "super_admin"
`)
}

main().catch((err) => {
  console.error("Erreur inattendue :", err)
  process.exit(1)
})
