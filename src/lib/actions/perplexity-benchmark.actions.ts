"use server"

import { createClient } from "@/lib/supabase/server"
import type { PerplexityBenchmarkData } from "@/lib/services/perplexity/benchmark"
import { isBenchmarkFresh } from "@/lib/services/perplexity/benchmark"

export type { PerplexityBenchmarkData }

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

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!userData?.tenant_id) {
    return { data: null, stale: false }
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", userData.tenant_id)
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
