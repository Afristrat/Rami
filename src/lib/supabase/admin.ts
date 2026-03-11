/**
 * Client Supabase admin (service role) — bypass RLS.
 * Utilisé uniquement côté serveur : webhooks, workers, migrations.
 * JAMAIS exposé côté client.
 */

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url        = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
