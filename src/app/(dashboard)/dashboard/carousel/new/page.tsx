// ============================================================
// Création d'un carrousel LinkedIn (moteur natif RAMI).
// Sujet → génération IA → aperçu fidèle → PDF document. Page tenant (auth).
// ============================================================

import { CarouselCreator } from "@/components/carousel/CarouselCreator"

export const dynamic = "force-dynamic"

export default function NewCarouselPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Créer un carrousel</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Décris ton sujet : RAMI génère un carrousel design (slides 4:5), accents parfaits, prêt à
          publier en document LinkedIn. Tu pourras l&apos;éditer et le valider avant publication.
        </p>
      </header>
      <CarouselCreator />
    </div>
  )
}
