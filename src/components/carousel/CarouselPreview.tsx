"use client"

// ============================================================
// Carrousel swipeable de slides React (aperçu fidèle — #3 natif).
// Affiche une slide à la fois en 4:5, avec navigation + points, comme un
// document LinkedIn. Aucun pdf.js : les slides SONT du React.
// ============================================================

import { useState } from "react"
import { CarouselSlide } from "@/components/carousel/CarouselSlide"
import type { Carousel } from "@/lib/schemas/carousel.schema"

export interface CarouselPreviewProps {
  carousel: Carousel
  maxWidth?: number // largeur max du rendu (px)
}

export function CarouselPreview({ carousel, maxWidth = 460 }: CarouselPreviewProps) {
  const [active, setActive] = useState(0)
  const total = carousel.slides.length
  const clamped = Math.min(active, total - 1)

  function go(delta: number) {
    setActive((a) => Math.max(0, Math.min(total - 1, a + delta)))
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full" style={{ maxWidth }}>
        <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10 dark:ring-white/10">
          <CarouselSlide
            slide={carousel.slides[clamped]}
            index={clamped}
            total={total}
            accentHex={carousel.accentHex}
            theme={carousel.theme}
            handle={carousel.handle}
            brand={carousel.brand}
          />
        </div>

        {/* Flèches */}
        {clamped > 0 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Slide précédente"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-white backdrop-blur transition hover:bg-black/75"
          >
            ‹
          </button>
        )}
        {clamped < total - 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Slide suivante"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 px-3 py-2 text-white backdrop-blur transition hover:bg-black/75"
          >
            ›
          </button>
        )}
      </div>

      {/* Points */}
      <div className="flex items-center gap-1.5">
        {carousel.slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === clamped ? "w-6 bg-zinc-800 dark:bg-zinc-100" : "w-2 bg-zinc-300 dark:bg-zinc-600"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Slide {clamped + 1} / {total} — aperçu fidèle (rendu LinkedIn document)
      </p>
    </div>
  )
}
