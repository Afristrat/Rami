/**
 * POST /api/brand-dna/perplexity-benchmark
 *
 * Déclenche ou retourne le benchmark sectoriel Perplexity pour le tenant connecté.
 * Cache 7 jours — re-génère uniquement si le cache est périmé.
 *
 * Authentification : session Supabase obligatoire.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runPerplexityBenchmark } from "@/lib/services/perplexity/benchmark"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

export async function POST(_req: NextRequest) {
  const supabase = await createClient()

  // Vérification auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Récupérer le tenant de l'utilisateur
  const tenantId = await resolveUserTenant(supabase, user.id)

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 })
  }

  // Récupérer secteur et culture depuis le Brand DNA
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  if (tenantError) {
    return NextResponse.json({ error: "Impossible de lire le Brand DNA" }, { status: 500 })
  }

  const brandDna = tenant?.brand_dna as Record<string, unknown> | null
  const sector = brandDna?.sector as string | undefined
  const primaryCulture = brandDna?.primaryCulture as string | undefined

  if (!sector) {
    return NextResponse.json(
      { error: "Secteur non défini dans le Brand DNA. Complétez votre Brand DNA d'abord." },
      { status: 400 }
    )
  }

  const result = await runPerplexityBenchmark(tenantId, sector, primaryCulture)

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  const isFromCache =
    result.data.cachedAt !== new Date().toISOString().slice(0, 10) + "T" &&
    new Date(result.data.cachedAt).getTime() < Date.now() - 5_000

  return NextResponse.json({ data: result.data, cached: isFromCache })
}
