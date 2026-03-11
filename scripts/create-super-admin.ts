#!/usr/bin/env tsx
/**
 * RAMI — Promotion d'un utilisateur en super_admin
 *
 * Usage :
 *   npx tsx scripts/create-super-admin.ts <email>
 *
 * Prérequis :
 *   - SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local
 *   - L'utilisateur doit déjà exister dans Supabase Auth
 *   - La table profiles doit exister (migration 20260311_profiles.sql)
 *
 * Ce script ne peut être exécuté que localement par un développeur
 * disposant de la clé service_role (jamais en CI/CD public).
 */

import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { resolve } from "path"

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), ".env.local") })
// Fallback sur .env si .env.local absent
config({ path: resolve(process.cwd(), ".env") })

// ── Validation des arguments ──────────────────────────────────────────────────

const email = process.argv[2]

if (!email) {
  console.error("❌  Usage : npx tsx scripts/create-super-admin.ts <email>")
  console.error("   Exemple : npx tsx scripts/create-super-admin.ts admin@example.com")
  process.exit(1)
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(`❌  Email invalide : "${email}"`)
  process.exit(1)
}

// ── Validation des variables d'environnement ──────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌  Variables manquantes :")
  if (!supabaseUrl)      console.error("   • NEXT_PUBLIC_SUPABASE_URL")
  if (!serviceRoleKey)   console.error("   • SUPABASE_SERVICE_ROLE_KEY")
  console.error("   Vérifiez votre fichier .env.local")
  process.exit(1)
}

// ── Client Supabase avec service role ────────────────────────────────────────

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ── Promotion en super_admin ──────────────────────────────────────────────────

async function promoteToSuperAdmin(targetEmail: string): Promise<void> {
  console.log(`\n🔍  Recherche de l'utilisateur : ${targetEmail}`)

  // 1. Trouver l'utilisateur dans auth.users via l'Admin API
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    throw new Error(`Impossible de lister les utilisateurs : ${listError.message}`)
  }

  const user = usersData.users.find(
    (u) => u.email?.toLowerCase() === targetEmail.toLowerCase()
  )

  if (!user) {
    throw new Error(
      `Aucun utilisateur trouvé avec l'email : ${targetEmail}\n` +
      "  Assurez-vous que l'utilisateur s'est inscrit et a confirmé son email."
    )
  }

  console.log(`✅  Utilisateur trouvé : ${user.id} (${user.email})`)
  console.log(`    Créé le : ${new Date(user.created_at).toLocaleString("fr-FR")}`)

  // 2. Upsert dans la table profiles avec global_role = 'super_admin'
  const { error: upsertError } = await supabase
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

  if (upsertError) {
    // Si la table profiles n'existe pas encore
    if (upsertError.code === "42P01") {
      throw new Error(
        "La table profiles n'existe pas.\n" +
        "  Exécutez d'abord : supabase db push\n" +
        "  (ou appliquez la migration supabase/migrations/20260311_profiles.sql)"
      )
    }
    throw new Error(`Erreur lors de la mise à jour : ${upsertError.message}`)
  }

  // 3. Vérification
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, email, global_role, updated_at")
    .eq("id", user.id)
    .single()

  if (fetchError || !profile) {
    throw new Error("Mise à jour effectuée mais impossible de vérifier le profil.")
  }

  console.log("\n🎉  Promotion réussie !")
  console.log(`    ID          : ${profile.id}`)
  console.log(`    Email       : ${profile.email}`)
  console.log(`    Rôle global : ${profile.global_role}`)
  console.log(`    Mis à jour  : ${new Date(profile.updated_at as string).toLocaleString("fr-FR")}`)
  console.log("\n⚠️   Ce compte a maintenant accès à toutes les fonctionnalités super_admin.")
  console.log("    Gardez cette information confidentielle.\n")
}

// ── Point d'entrée ────────────────────────────────────────────────────────────

promoteToSuperAdmin(email).catch((error: unknown) => {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`\n❌  Erreur : ${msg}\n`)
  process.exit(1)
})
