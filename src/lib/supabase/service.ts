/**
 * Client Supabase avec service role key — pour le worker pg-boss.
 * JAMAIS exposé côté client. Utilisé uniquement dans :
 *  - src/lib/queue/publish-worker.ts
 *  - src/app/api/webhooks/
 *
 * Bypass RLS intentionnel pour les opérations worker-level.
 */

import { createClient } from "@supabase/supabase-js"

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant"
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
