'use client'

import { VisualCard } from './VisualCard'
import { GeneratedVisual, VisualDirection } from '@/lib/services/image-generation/types'
import { ChevronRight } from 'lucide-react'

interface DirectionGalleryProps {
  direction: VisualDirection
  visuals: GeneratedVisual[]
  selectedVisuals: Set<string>
  onToggleSelect: (visual: GeneratedVisual) => void
}

// Clé unique pour une image dans la sélection
function visualKey(v: GeneratedVisual): string {
  return `${v.direction.id}-${v.seed}-${v.image.url.slice(-12)}`
}

export function DirectionGallery({
  direction,
  visuals,
  selectedVisuals,
  onToggleSelect,
}: DirectionGalleryProps) {
  const directionColors: Record<number, { accent: string; badge: string }> = {
    1: { accent: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
    2: { accent: 'text-red-400', badge: 'bg-red-500/20 border-red-500/30 text-red-300' },
    3: { accent: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30 text-amber-300' },
    4: { accent: 'text-violet-400', badge: 'bg-violet-500/20 border-violet-500/30 text-violet-300' },
  }

  const colors = directionColors[direction.id] ?? directionColors[1]
  const avgScore =
    visuals.length > 0
      ? Math.round(visuals.reduce((sum, v) => sum + v.brand_dna_score, 0) / visuals.length)
      : 0

  return (
    <section className="space-y-4">
      {/* Header direction */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${colors.badge}`}>
          <ChevronRight className="w-3 h-3" />
          Direction {direction.id}
        </div>
        <div>
          <h3 className={`text-sm font-semibold ${colors.accent}`}>{direction.name}</h3>
          <p className="text-xs text-white/40">{direction.emotion} · Score ADN moy. {avgScore}/100</p>
        </div>
      </div>

      {/* Grille 5 images */}
      {visuals.length === 0 ? (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {visuals.map((visual, i) => {
            const key = visualKey(visual)
            return (
              <VisualCard
                key={key}
                visual={visual}
                isSelected={selectedVisuals.has(key)}
                onToggleSelect={(v) => {
                  onToggleSelect(v)
                }}
                index={i}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export { visualKey }
