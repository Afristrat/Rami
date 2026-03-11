'use client'

import { useState, useTransition, useCallback } from 'react'
import JSZip from 'jszip'
import { GenerateForm } from './GenerateForm'
import { DirectionGallery, visualKey } from './DirectionGallery'
import { generateVisualsAction } from '@/lib/actions/visual.actions'
import { GenerateBriefInput } from '@/lib/schemas/visual.schema'
import { GeneratedVisual } from '@/lib/services/image-generation/types'
import { Download, CheckSquare, Square, AlertTriangle, XCircle } from 'lucide-react'

interface CreatePageClientProps {
  hasBrandDNA: boolean
  brandName?: string
  defaultPlatform?: string
}

export function CreatePageClient({ hasBrandDNA, brandName, defaultPlatform }: CreatePageClientProps) {
  const [isPending, startTransition] = useTransition()
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<string[]>([])
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Grouper les visuels par direction
  const byDirection = [1, 2, 3, 4].map((dirId) => ({
    dirId,
    visuals: visuals.filter((v) => v.direction.id === dirId),
  }))

  const handleGenerate = useCallback(async (data: GenerateBriefInput): Promise<void> => {
    setGlobalError(null)
    setErrors([])
    setVisuals([])
    setSelectedKeys(new Set())
    setHasGenerated(false)

    startTransition(async () => {
      const result = await generateVisualsAction(data)

      if (!result.success) {
        setGlobalError(result.error ?? 'Erreur lors de la génération')
        return
      }

      setVisuals(result.visuals)
      setHasGenerated(true)

      if (result.errors && result.errors.length > 0) {
        setErrors(result.errors)
      }
    })
  }, [])

  const handleToggleSelect = useCallback((visual: GeneratedVisual) => {
    const key = visualKey(visual)
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedKeys.size === visuals.length) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(visuals.map(visualKey)))
    }
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
            const filename = `direction-${visual.direction.id}_image-${i + 1}_score-${visual.brand_dna_score}.${ext}`
            const folder = zip.folder(`direction-${visual.direction.id}_${visual.direction.name.replace(/\s/g, '-')}`)
            folder?.file(filename, blob)
          } catch {
            // Image non téléchargeable, on skip
          }
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
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Blobs de fond */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Créer des visuels</h1>
          <p className="text-sm text-white/40">
            Générateur de contenu neuropsychologique — 4 directions × 5 images calibrées
          </p>
        </div>

        {/* Layout : formulaire + résultats */}
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
          {/* Formulaire */}
          <div className="xl:sticky xl:top-8 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-white/70 mb-5 uppercase tracking-wider">
              Configuration
            </h2>
            <GenerateForm
              onGenerate={handleGenerate}
              isGenerating={isPending}
              defaultPlatform={defaultPlatform}
              hasBrandDNA={hasBrandDNA}
              brandName={brandName}
            />
          </div>

          {/* Zone résultats */}
          <div className="space-y-6">
            {/* Erreur globale */}
            {globalError && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-red-300 font-medium">Échec de la génération</p>
                  <p className="text-xs text-red-300/60 mt-0.5">{globalError}</p>
                </div>
              </div>
            )}

            {/* Avertissements providers partiels */}
            {errors.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm text-amber-300 font-medium">
                    Certaines images n&apos;ont pas pu être générées
                  </p>
                  {errors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-300/60">{e}</p>
                  ))}
                </div>
              </div>
            )}

            {/* En cours de génération */}
            {isPending && (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((dir) => (
                  <div key={dir} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-24 rounded-md bg-white/[0.06] animate-pulse" />
                      <div className="h-4 w-40 rounded-md bg-white/[0.04] animate-pulse" />
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-video rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
                          style={{ animationDelay: `${i * 100}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-center text-sm text-white/30 animate-pulse">
                  Génération en cours — jusqu&apos;à 35 secondes...
                </p>
              </div>
            )}

            {/* Résultats */}
            {!isPending && hasGenerated && visuals.length > 0 && (
              <>
                {/* Barre d'actions */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors"
                    >
                      {selectedKeys.size === visuals.length ? (
                        <CheckSquare className="w-4 h-4 text-violet-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      {selectedKeys.size === visuals.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                    <span className="text-xs text-white/30">
                      {selectedKeys.size}/{visuals.length} sélectionnés
                    </span>
                  </div>

                  <button
                    onClick={handleDownloadZIP}
                    disabled={selectedKeys.size === 0 || isDownloading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Préparation...' : `Télécharger ZIP (${selectedKeys.size})`}
                  </button>
                </div>

                {/* Galeries par direction */}
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
              </>
            )}

            {/* État vide initial */}
            {!isPending && !hasGenerated && !globalError && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <p className="text-white/50 text-sm font-medium">Prêt à générer</p>
                  <p className="text-white/25 text-xs mt-1">
                    Remplissez le brief et cliquez sur &quot;Générer les visuels&quot;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
