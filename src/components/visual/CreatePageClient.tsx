'use client'

import { useState, useTransition, useCallback } from 'react'
import JSZip from 'jszip'
import { GenerateForm } from './GenerateForm'
import { DirectionGallery, visualKey } from './DirectionGallery'
import { MultiFormatPanel } from './MultiFormatPanel'
import { generateVisualsAction } from '@/lib/actions/visual.actions'
import { GenerateBriefInput } from '@/lib/schemas/visual.schema'
import { GeneratedVisual } from '@/lib/services/image-generation/types'
import { useUpgradeModal } from '@/components/billing/upgrade-modal'
import {
  Download, CheckSquare, Square, AlertTriangle,
  XCircle, Wand2, Video, RefreshCw as RefreshCwIcon,
} from 'lucide-react'
import type { Plan } from '@/lib/billing/plans'
import type { BrandDNASummary } from '@/lib/actions/visual.actions'
import { useTranslations } from 'next-intl'

interface CreatePageClientProps {
  hasBrandDNA: boolean
  brandName?: string
  defaultPlatform?: string
  currentPlan?: Plan
  brandDNASummary?: BrandDNASummary
}

export function CreatePageClient({
  hasBrandDNA,
  brandName,
  defaultPlatform,
  currentPlan = 'free',
  brandDNASummary,
}: CreatePageClientProps) {
  const t = useTranslations('visuals')
  const [isPending, startTransition] = useTransition()
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<string[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [lastBrief, setLastBrief] = useState('')
  const [lastPlatform, setLastPlatform] = useState(defaultPlatform ?? 'instagram')
  const [showMultiFormat, setShowMultiFormat] = useState(false)

  const { showUpgrade, UpgradeModalContainer } = useUpgradeModal(currentPlan)

  const byDirection = [1, 2, 3, 4].map((dirId) => ({
    dirId,
    visuals: visuals.filter((v) => v.direction.id === dirId),
  }))

  const handleGenerate = useCallback(async (data: GenerateBriefInput & { platforms: string[] }): Promise<void> => {
    setGlobalError(null)
    setErrors([])
    setVisuals([])
    setSelectedKeys(new Set())
    setHasGenerated(false)
    setShowMultiFormat(false)
    setLastBrief(data.brief)
    setLastPlatform(data.platforms[0] ?? data.platform)

    const { platforms, ...briefData } = data
    const targets = platforms.length > 0 ? platforms : [data.platform]

    startTransition(async () => {
      const all: GeneratedVisual[] = []
      const errs: string[] = []
      for (const platform of targets) {
        const result = await generateVisualsAction({ ...briefData, platform: platform as GenerateBriefInput['platform'] })
        if (!result.success) {
          if (result.quota_exceeded) {
            showUpgrade(
              'visual_engine',
              `Quota de générations atteint (${result.quota_exceeded.count}/${result.quota_exceeded.limit} ce mois).`
            )
            return
          }
          errs.push(result.error ?? t('generationFailed'))
          continue
        }
        all.push(...result.visuals)
        if (result.errors && result.errors.length > 0) errs.push(...result.errors)
      }

      if (all.length === 0) {
        setGlobalError(errs[0] ?? t('generationFailed'))
        return
      }
      setVisuals(all)
      setHasGenerated(true)
      if (errs.length > 0) setErrors(errs)
    })
  }, [showUpgrade, t])

  const handleToggleSelect = useCallback((visual: GeneratedVisual) => {
    const key = visualKey(visual)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedKeys.size === visuals.length) setSelectedKeys(new Set())
    else setSelectedKeys(new Set(visuals.map(visualKey)))
  }, [visuals, selectedKeys.size])

  const handleDownloadZIP = async () => {
    const toDownload = visuals.filter((v) => selectedKeys.has(visualKey(v)))
    if (toDownload.length === 0) return
    setIsDownloading(true)
    try {
      const zip = new JSZip()
      await Promise.all(
        toDownload.map(async (visual, i) => {
          try {
            const res = await fetch(visual.image.url)
            const blob = await res.blob()
            const ext = blob.type === 'image/png' ? 'png' : 'webp'
            const filename = `dir${visual.direction.id}_img${i + 1}_score${visual.brand_dna_score}.${ext}`
            const folder = zip.folder(`direction-${visual.direction.id}_${visual.direction.name.replace(/\s/g, '-')}`)
            folder?.file(filename, blob)
          } catch { /* skip */ }
        })
      )
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `rami-visuals-${new Date().toISOString().slice(0, 10)}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {UpgradeModalContainer}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('createVisuals')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('subtitle')}
        </p>
      </div>

      {/* Formulaire — full width */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <GenerateForm
          onGenerate={handleGenerate}
          isGenerating={isPending}
          defaultPlatform={defaultPlatform}
          hasBrandDNA={hasBrandDNA}
          brandName={brandName}
          brandDNASummary={brandDNASummary}
        />
      </div>

      {/* Erreur globale */}
      {globalError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-destructive font-medium">{t('generationFailed')}</p>
            <p className="text-xs text-destructive/70 mt-0.5">{globalError}</p>
          </div>
        </div>
      )}

      {/* Avertissements providers partiels */}
      {errors.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              {t('someImagesFailed')}
            </p>
            {errors.map((e, i) => (
              <p key={i} className="text-xs text-amber-600/70 dark:text-amber-400/70">{e}</p>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton génération */}
      {isPending && (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((dir) => (
            <div key={dir} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-24 rounded-md bg-muted animate-pulse" />
                <div className="h-4 w-40 rounded-md bg-muted/70 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-video rounded-xl bg-muted border border-border animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
          <p className="text-center text-sm text-muted-foreground animate-pulse">
            {t('generationInProgress')}
          </p>
        </div>
      )}

      {/* Résultats */}
      {!isPending && hasGenerated && visuals.length > 0 && (
        <div className="space-y-6">
          {/* Barre d'actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedKeys.size === visuals.length
                ? <CheckSquare className="w-4 h-4 text-violet-500" />
                : <Square className="w-4 h-4" />
              }
              <span>{selectedKeys.size === visuals.length ? t('deselectAll') : t('selectAll')}</span>
              <span className="text-xs text-muted-foreground">({selectedKeys.size}/{visuals.length})</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedKeys.size === 1 && (
                <button
                  onClick={() => {
                    const sel = visuals.find((v) => selectedKeys.has(visualKey(v)))
                    if (sel) {
                      const params = new URLSearchParams({ image_url: sel.image.url, direction: sel.direction.name })
                      window.location.href = `/dashboard/create?${params.toString()}`
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all"
                >
                  <Wand2 className="w-4 h-4" />
                  {t('createPost')}
                </button>
              )}
              <button
                onClick={handleDownloadZIP}
                disabled={selectedKeys.size === 0 || isDownloading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? t('preparing') : `ZIP (${selectedKeys.size})`}
              </button>
            </div>
          </div>

          {/* Galeries */}
          <div className="space-y-8">
            {byDirection
              .filter((d) => d.visuals.length > 0)
              .map(({ dirId, visuals: dirVisuals }) => {
                const direction = dirVisuals[0]?.direction
                if (!direction) return null
                return (
                  <DirectionGallery
                    key={dirId}
                    direction={direction}
                    visuals={dirVisuals}
                    selectedVisuals={selectedKeys}
                    onToggleSelect={handleToggleSelect}
                  />
                )
              })}
          </div>

          {/* Multi-format */}
          <div className="pt-1">
            <button
              onClick={() => setShowMultiFormat((v) => !v)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCwIcon className="w-4 h-4" />
              {showMultiFormat ? t('hideAdditionalFormats') : t('generateOtherFormats')}
            </button>
            {showMultiFormat && lastBrief && (
              <div className="mt-3">
                <MultiFormatPanel brief={lastBrief} sourcePlatform={lastPlatform} directionId={1} />
              </div>
            )}
          </div>

          {/* CTA vidéo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl bg-card border border-border">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground font-medium">{t('transformToVideo')}</p>
              <p className="text-xs text-muted-foreground">{t('transformToVideoDesc')}</p>
            </div>
            <a
              href="/create/video"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-600 dark:text-pink-300 text-xs font-medium transition-all shrink-0"
            >
              <Video className="w-3.5 h-3.5" />
              {t('generateVideo')}
            </a>
          </div>
        </div>
      )}

      {/* État vide */}
      {!isPending && !hasGenerated && !globalError && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">{t('emptyTitle')}</p>
            <p className="text-muted-foreground text-xs mt-1">{t('emptySubtitle')}</p>
          </div>
          <a
            href="/create/video"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground text-sm transition-all"
          >
            <Video className="w-4 h-4" />
            {t('emptyVideoAlt')}
          </a>
        </div>
      )}
    </div>
  )
}
