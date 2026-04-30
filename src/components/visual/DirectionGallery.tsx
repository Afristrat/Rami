'use client'

import { useState } from 'react'
import { VisualCard } from './VisualCard'
import { GeneratedVisual, VisualDirection } from '@/lib/services/image-generation/types'
import { ChevronRight, ChevronDown, Eye } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DirectionGalleryProps {
  direction: VisualDirection
  visuals: GeneratedVisual[]
  selectedVisuals: Set<string>
  onToggleSelect: (visual: GeneratedVisual) => void
}

// Cle unique pour une image dans la selection
function visualKey(v: GeneratedVisual): string {
  return `${v.direction.id}-${v.seed}-${v.image.url.slice(-12)}`
}

// Score breakdown categories weights (matching vision-scorer.ts logic)
function computeScoreBreakdown(score: number): {
  colors: number
  emotion: number
  quality: number
  relevance: number
} {
  // Approximate breakdown based on total score using vision-scorer weights:
  // colors 40%, emotion 30%, quality 20%, relevance 10%
  const base = Math.max(0, Math.min(100, score))
  return {
    colors: Math.round(base * 0.40),
    emotion: Math.round(base * 0.30),
    quality: Math.round(base * 0.20),
    relevance: Math.round(base * 0.10),
  }
}

export function DirectionGallery({
  direction,
  visuals,
  selectedVisuals,
  onToggleSelect,
}: DirectionGalleryProps) {
  const t = useTranslations('visuals')
  const [showPrompt, setShowPrompt] = useState(false)

  const directionColors: Record<number, { accent: string; badge: string; emotionBg: string }> = {
    1: { accent: 'text-blue-400', badge: 'bg-blue-500/20 border-blue-500/30 text-blue-300', emotionBg: 'bg-blue-500/15 text-blue-300 border-blue-500/20' },
    2: { accent: 'text-red-400', badge: 'bg-red-500/20 border-red-500/30 text-red-300', emotionBg: 'bg-red-500/15 text-red-300 border-red-500/20' },
    3: { accent: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30 text-amber-300', emotionBg: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
    4: { accent: 'text-violet-400', badge: 'bg-violet-500/20 border-violet-500/30 text-violet-300', emotionBg: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
  }

  const colors = directionColors[direction.id] ?? directionColors[1]
  const avgScore =
    visuals.length > 0
      ? Math.round(visuals.reduce((sum, v) => sum + v.brand_dna_score, 0) / visuals.length)
      : 0

  const breakdown = computeScoreBreakdown(avgScore)

  // Get the prompt from the first visual (all visuals in a direction share the same prompt)
  const promptUsed = visuals[0]?.prompt_used ?? ''

  return (
    <section className="space-y-4">
      {/* Header direction */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${colors.badge}`}>
            <ChevronRight className="w-3 h-3" />
            {t('directionLabel')} {direction.id}
          </div>
          <div>
            <h3 className={`text-sm font-semibold ${colors.accent}`}>{t(`directions.${direction.id}.name`)}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border ${colors.emotionBg}`}>
                {direction.emotion}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('avgDnaScore')} {avgScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* Score breakdown mini bars */}
        {visuals.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
            <div className="flex items-center gap-1.5">
              <span>{t('scoreColors')}</span>
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, breakdown.colors / 0.40)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{t('scoreEmotion')}</span>
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min(100, breakdown.emotion / 0.30)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{t('scoreQuality')}</span>
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.min(100, breakdown.quality / 0.20)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{t('scoreRelevance')}</span>
              <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${Math.min(100, breakdown.relevance / 0.10)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt accordion */}
      {promptUsed && (
        <div className="rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPrompt(!showPrompt)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <Eye className="w-3 h-3" />
            <span>{t('viewPrompt')}</span>
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
          </button>
          {showPrompt && (
            <div className="px-3 pb-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed font-mono bg-muted/40 rounded-lg p-2.5 break-words">
                {promptUsed}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Grille images */}
      {visuals.length === 0 ? (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-xl bg-muted border border-border animate-pulse"
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
