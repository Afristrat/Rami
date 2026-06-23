// ============================================================
// Démo design du moteur de carrousel natif RAMI (étape 1 — validation design).
// Reprend le contenu « Négociation Augmentée » (artisan : version Hermès tronquée
// + accents perdus à la publication) rendu ici en slides React 4:5 soignées,
// accents parfaits, sans troncature ni chrome navigateur. Route publique.
// ============================================================

import type { Metadata } from "next"
import { CarouselPreview } from "@/components/carousel/CarouselPreview"
import { DEMO_CAROUSEL as DEMO } from "@/lib/services/documents/carousel/demo-deck"

export const metadata: Metadata = {
  title: "Démo carrousel — RAMI",
  robots: { index: false, follow: false },
}

export default function CarouselDemoPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Carrousel RAMI — démo design</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Même contenu que la version Hermès, rendu en slides React 4:5 : accents parfaits, aucune
          troncature, aucun chrome navigateur. Fais défiler avec les flèches ou les points.
        </p>
      </header>
      <CarouselPreview carousel={DEMO} maxWidth={460} />

      <div className="mt-8 text-center">
        <a
          href="/carousel-demo/pdf"
          className="inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Télécharger le PDF (document LinkedIn)
        </a>
        <p className="mt-2 text-xs text-zinc-500">
          Vérifie : accents parfaits, aucune troncature, aucun chrome navigateur — identique à
          l&apos;aperçu.
        </p>
      </div>
    </main>
  )
}
