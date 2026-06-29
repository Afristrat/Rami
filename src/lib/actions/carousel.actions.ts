"use server"

// ============================================================
// Génération d'un carrousel (deck de slides typées) par le LLM, à partir d'un
// brief — parcours UI (session). La logique LLM réelle vit dans le cœur partagé
// `carousel-core` (réutilisé par l'API publique v1, sans duplication).
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { generateCarouselDeck } from "@/lib/services/visuals/carousel-core"
import { type Carousel } from "@/lib/schemas/carousel.schema"

export async function createCarouselAction(input: {
  brief: string
  slideCount?: number
  accentHex?: string
  theme?: "dark" | "light"
  handle?: string
  author?: string
}): Promise<{ success: true; carousel: Carousel } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }
  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  // Brand DNA + nom du tenant résolus depuis la session, puis délégation au cœur.
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("brand_dna, name")
    .eq("id", tenantId)
    .single()

  return generateCarouselDeck({
    brandDnaRaw: tenantRow?.brand_dna ?? null,
    tenantName: tenantRow?.name ?? null,
    brief: input.brief,
    slideCount: input.slideCount,
    accentHex: input.accentHex,
    theme: input.theme,
    handle: input.handle,
    author: input.author,
  })
}
