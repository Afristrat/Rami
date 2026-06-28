'use client'

import { useState } from 'react'
import { GeneratedVisual } from '@/lib/services/image-generation/types'
import { registerVisualsToLibraryAction } from '@/lib/actions/register-visual.actions'
import { Check, Download, BookmarkPlus, BookmarkCheck, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface VisualCardProps {
  visual: GeneratedVisual
  isSelected: boolean
  onToggleSelect: (visual: GeneratedVisual) => void
  index: number
}

function getScoreBadgeColor(score: number) {
  if (score >= 80) return 'bg-emerald-500/80 text-white'
  if (score >= 60) return 'bg-amber-500/80 text-white'
  return 'bg-red-500/80 text-white'
}

const PROVIDER_LABELS: Record<string, string> = {
  fal_ai: 'Fal.ai',
  replicate: 'Replicate',
  together_ai: 'Together',
  nano_banana: 'Gemini',
}

export function VisualCard({ visual, isSelected, onToggleSelect, index }: VisualCardProps) {
  const t = useTranslations('visuals')
  const [isSaving, setIsSaving] = useState(false)
  const [savedToLibrary, setSavedToLibrary] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(visual.image.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rami-visual-d${visual.direction.id}-${index + 1}.webp`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(visual.image.url, '_blank')
    }
  }

  const handleSaveToLibrary = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (savedToLibrary || isSaving) return

    setIsSaving(true)
    setSaveError(null)

    const result = await registerVisualsToLibraryAction([{
      url: visual.image.url,
      directionId: visual.direction.id,
      directionName: visual.direction.name,
      brandDnaScore: visual.brand_dna_score,
    }])

    setIsSaving(false)

    if ('assetIds' in result && result.assetIds.length > 0) {
      setSavedToLibrary(true)
    } else {
      setSaveError('error' in result ? result.error : t('saveError'))
      setTimeout(() => setSaveError(null), 3000)
    }
  }

  return (
    <div
      className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isSelected
          ? 'border-violet-500 ring-2 ring-violet-500/30'
          : 'border-border hover:border-foreground/30'
      }`}
      onClick={() => onToggleSelect(visual)}
    >
      {/* Image */}
      <div className="relative aspect-video bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.image.url}
          alt={`${t('directionLabel')} ${visual.direction.id} — Image ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Score Brand DNA overlay — coin bas-droit */}
        <div className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm ${getScoreBadgeColor(visual.brand_dna_score)}`}>
          {visual.brand_dna_score}
        </div>

        {/* Hover overlay — provider + seed */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/25 transition-colors text-white"
              aria-label={t('downloadLabel')}
              title={t('downloadLabel')}
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleSaveToLibrary}
              disabled={isSaving || savedToLibrary}
              className={`p-2 rounded-lg backdrop-blur-sm transition-all ${
                savedToLibrary
                  ? 'bg-emerald-500/30 text-emerald-300 cursor-default'
                  : saveError
                  ? 'bg-red-500/30 text-red-300'
                  : 'bg-white/10 hover:bg-violet-500/40 text-white'
              }`}
              aria-label={savedToLibrary ? t('savedToLibrary') : t('saveToLibrary')}
              title={savedToLibrary ? t('savedToLibrary') : t('saveToLibrary')}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedToLibrary ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Provider + seed info on hover */}
          <div className="text-[9px] text-white/60 text-center leading-tight mt-1">
            <span>{PROVIDER_LABELS[visual.provider] ?? visual.provider}</span>
            {visual.seed != null && (
              <span className="ml-1.5">seed: {visual.seed}</span>
            )}
          </div>
        </div>

        {/* Checkmark si selectionne */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Badge "Enregistre" persistant */}
        {savedToLibrary && !isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500/90 flex items-center justify-center">
            <BookmarkCheck className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Message erreur sauvegarde */}
        {saveError && (
          <div className="absolute bottom-8 left-1 right-1 px-1.5 py-1 rounded bg-red-500/90 text-[9px] text-white text-center leading-tight">
            {t('saveError')}
          </div>
        )}
      </div>
    </div>
  )
}
