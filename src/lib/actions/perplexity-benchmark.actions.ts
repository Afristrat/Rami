"use server"

import { createClient } from "@/lib/supabase/server"
import type { PerplexityBenchmarkData } from "@/lib/services/perplexity/benchmark"
import { isBenchmarkFresh } from "@/lib/services/perplexity/benchmark"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"


export type GetBenchmarkResult =
  | { data: PerplexityBenchmarkData | null; stale: boolean }
  | { error: string }

/**
 * Récupère le benchmark Perplexity mis en cache dans brand_dna du tenant.
 * Retourne les données + un flag `stale` si le cache a > 7 jours.
 */
export async function getBenchmarkAction(): Promise<GetBenchmarkResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Non authentifié" }
  }

  const tenantId = await resolveUserTenant(supabase, user.id)

  if (!tenantId) {
    return { data: null, stale: false }
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  const brandDna = tenant?.brand_dna as Record<string, unknown> | null
  const benchmark = brandDna?.perplexity_benchmark as PerplexityBenchmarkData | undefined

  if (!benchmark) {
    return { data: null, stale: false }
  }

  return {
    data: benchmark,
    stale: !isBenchmarkFresh(benchmark),
  }
}
