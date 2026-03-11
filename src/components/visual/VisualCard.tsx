'use client'

import { BrandDNAScoreBadge } from './BrandDNAScoreBadge'
import { GeneratedVisual } from '@/lib/services/image-generation/types'
import { Check, Download } from 'lucide-react'

interface VisualCardProps {
  visual: GeneratedVisual
  isSelected: boolean
  onToggleSelect: (visual: GeneratedVisual) => void
  index: number
}

export function VisualCard({ visual, isSelected, onToggleSelect, index }: VisualCardProps) {
  const providerLabel: Record<string, string> = {
    fal_ai: 'Fal.ai',
    replicate: 'Replicate',
    together_ai: 'Together',
  }

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

  return (
    <div
      className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isSelected
          ? 'border-violet-500 ring-2 ring-violet-500/30'
          : 'border-white/[0.08] hover:border-white/20'
      }`}
      onClick={() => onToggleSelect(visual)}
    >
      {/* Image */}
      <div className="relative aspect-video bg-white/[0.04]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={visual.image.url}
          alt={`Direction ${visual.direction.id} — Image ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Overlay au survol */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors text-white"
            aria-label="Télécharger"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Checkmark si sélectionné */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Footer avec score */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <BrandDNAScoreBadge score={visual.brand_dna_score} />
          <span className="text-[10px] text-white/40">{providerLabel[visual.provider] ?? visual.provider}</span>
        </div>
      </div>
    </div>
  )
}
