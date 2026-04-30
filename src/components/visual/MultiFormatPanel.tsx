'use client'

import { useState, useTransition } from 'react'
import { Loader2, RefreshCw, Download, CheckCircle2 } from 'lucide-react'
import { GeneratedVisual } from '@/lib/services/image-generation/types'
import { generateVisualsAction } from '@/lib/actions/visual.actions'
import { useTranslations } from 'next-intl'

// Formats supplémentaires disponibles
const ADDITIONAL_FORMATS = [
  { platform: 'instagram', label: 'Instagram Post', ratio: '1:1', emoji: '📸', width: 1080, height: 1080 },
  { platform: 'linkedin', label: 'LinkedIn', ratio: '1.91:1', emoji: '💼', width: 1200, height: 627 },
  { platform: 'twitter', label: 'X / Twitter', ratio: '16:9', emoji: '𝕏', width: 1200, height: 675 },
  { platform: 'facebook', label: 'Facebook', ratio: '1.91:1', emoji: '📘', width: 1200, height: 630 },
  { platform: 'pinterest', label: 'Pinterest', ratio: '2:3', emoji: '📌', width: 1000, height: 1500 },
  { platform: 'youtube', label: 'YouTube Thumb', ratio: '16:9', emoji: '▶', width: 1280, height: 720 },
  { platform: 'stories', label: 'Stories 9:16', ratio: '9:16', emoji: '📱', width: 1080, height: 1920 },
] as const

type FormatPlatform = typeof ADDITIONAL_FORMATS[number]['platform']

interface MultiFormatPanelProps {
  /** Brief original utilisé pour la génération */
  brief: string
  /** Plateforme source déjà générée */
  sourcePlatform: string
  /** Direction du visuel source (1-4) */
  directionId: 1 | 2 | 3 | 4
}

interface FormatResult {
  platform: string
  visual: GeneratedVisual | null
  error?: string
}

export function MultiFormatPanel({ brief, sourcePlatform, directionId }: MultiFormatPanelProps) {
  const t = useTranslations('visuals.multiFormat')
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [results, setResults] = useState<FormatResult[]>([])

  const toggleFormat = (platform: string) => {
    setSelectedFormats((prev) => {
      const next = new Set(prev)
      if (next.has(platform)) next.delete(platform)
      else next.add(platform)
      return next
    })
  }

  const handleGenerate = () => {
    if (selectedFormats.size === 0) return

    startTransition(async () => {
      const newResults: FormatResult[] = []

      await Promise.allSettled(
        Array.from(selectedFormats)
          .filter((p) => p !== sourcePlatform)
          .map(async (platform) => {
            const result = await generateVisualsAction({
              brief,
              platform: platform as 'instagram' | 'linkedin' | 'twitter' | 'facebook' | 'pinterest' | 'youtube',
              directions_count: 1,
              images_per_direction: 1,
            })

            if (result.success && result.visuals.length > 0) {
              // On prend le visuel correspondant à la direction souhaitée
              const matchingVisual = result.visuals.find(
                (v) => v.direction.id === directionId
              ) ?? result.visuals[0]

              newResults.push({ platform, visual: matchingVisual })
            } else {
              newResults.push({
                platform,
                visual: null,
                error: result.error ?? t('generationError'),
              })
            }
          })
      )

      setResults((prev) => {
        const existingPlatforms = new Set(prev.map((r) => r.platform))
        const updated = [...prev.filter((r) => !selectedFormats.has(r.platform))]
        for (const r of newResults) {
          if (!existingPlatforms.has(r.platform)) updated.push(r)
        }
        return updated
      })
    })
  }

  const handleDownload = async (visual: GeneratedVisual, platform: string) => {
    try {
      const response = await fetch(visual.image.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rami-${platform}-d${directionId}.webp`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(visual.image.url, '_blank')
    }
  }

  const availableFormats = ADDITIONAL_FORMATS.filter((f) => f.platform !== sourcePlatform)

  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white/80">{t('title')}</h3>
          <p className="text-xs text-white/40 mt-0.5">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isPending || selectedFormats.size === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {isPending ? t('generating') : `${t('generate')} (${selectedFormats.size})`}
        </button>
      </div>

      {/* Sélection des formats */}
      <div className="flex flex-wrap gap-2">
        {availableFormats.map((f) => {
          const isSelected = selectedFormats.has(f.platform)
          const result = results.find((r) => r.platform === f.platform)

          return (
            <button
              key={f.platform}
              onClick={() => toggleFormat(f.platform)}
              disabled={isPending}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                result?.visual
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : isSelected
                  ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/70'
              }`}
            >
              <span>{f.emoji}</span>
              <span className="font-medium">{f.label}</span>
              <span className="text-white/30">{f.ratio}</span>
              {result?.visual && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            </button>
          )
        })}
      </div>

      {/* Résultats générés */}
      {results.filter((r) => r.visual).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {results
            .filter((r) => r.visual)
            .map((r) => {
              const format = ADDITIONAL_FORMATS.find((f) => f.platform === r.platform)
              if (!r.visual || !format) return null

              return (
                <div key={r.platform} className="group relative rounded-xl overflow-hidden border border-white/[0.08]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.visual.image.url}
                    alt={format.label}
                    className="w-full object-cover"
                    style={{ aspectRatio: `${format.width}/${format.height}` }}
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleDownload(r.visual!, r.platform)}
                      className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/25 text-white"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-[10px] text-white/70 font-medium">
                      {format.emoji} {format.label} · {format.ratio}
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Erreurs */}
      {results.filter((r) => r.error).length > 0 && (
        <div className="space-y-1">
          {results
            .filter((r) => r.error)
            .map((r) => {
              const format = ADDITIONAL_FORMATS.find((f) => f.platform === r.platform)
              return (
                <p key={r.platform} className="text-xs text-red-400/70">
                  {format?.label ?? r.platform} : {r.error}
                </p>
              )
            })}
        </div>
      )}
    </div>
  )
}

export type { FormatPlatform }
