// ============================================================
// Création d'un carrousel LinkedIn (moteur natif RAMI).
// Sujet → génération IA → aperçu fidèle → PDF document. Page tenant (auth).
// L'accent par DÉFAUT et le handle sont résolus depuis le Brand DNA du tenant.
// ============================================================

import { CarouselCreator } from "@/components/carousel/CarouselCreator"
import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"

export const dynamic = "force-dynamic"

export default async function NewCarouselPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialAccent = "#1D4ED8"
  let initialHandle = ""
  if (user) {
    const tenantId = await resolveUserTenant(supabase, user.id)
    if (tenantId) {
      const { data: t } = await supabase
        .from("tenants")
        .select("brand_dna, name")
        .eq("id", tenantId)
        .single()
      const identity = resolveBrandIdentity(t?.brand_dna ?? null, { tenantName: t?.name ?? null })
      initialAccent = identity.accent
      initialHandle = identity.handle ?? ""
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Créer un carrousel</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Décris ton sujet : RAMI génère un carrousel design (slides 4:5), accents parfaits, prêt à
          publier en document LinkedIn. Tu pourras l&apos;éditer et le valider avant publication.
        </p>
      </header>
      <CarouselCreator initialAccent={initialAccent} initialHandle={initialHandle} />
    </div>
  )
}
