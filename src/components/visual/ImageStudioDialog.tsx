'use client'

// ============================================================
// ImageStudioDialog — modal de génération / import d'images pour le Studio vidéo
// Réutilise le workflow visuel EXISTANT (GenerateForm + generateVisualsAction +
// saveVisualToLibraryAction) et l'upload (uploadMediaAssetAction).
//
// IMPORTANT — anti-gaspillage de tokens : toute image GÉNÉRÉE est sauvegardée
// AUTOMATIQUEMENT dans la bibliothèque dès la génération (pas de clic requis),
// puis remontée au parent via `onAssetsAdded` pour rafraîchir + auto-sélectionner.
// Composant isolé : il ne touche jamais l'état (brief / sélection) de la page vidéo.
// ============================================================

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Check, Upload, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { GenerateForm } from './GenerateForm'
import {
  generateVisualsAction,
  getTenantBrandDNAAction,
  type BrandDNASummary,
} from '@/lib/actions/visual.actions'
import { registerVisualsToLibraryAction } from '@/lib/actions/register-visual.actions'
import { uploadMediaAssetAction } from '@/lib/actions/library.actions'
import type { GenerateBriefInput } from '@/lib/schemas/visual.schema'
import type { GeneratedVisual } from '@/lib/services/image-generation/types'

interface ImageStudioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Appelé avec les IDs des assets ajoutés (générés ou importés) → le parent
   *  rafraîchit sa bibliothèque et auto-sélectionne ces images. */
  onAssetsAdded: (assetIds: string[]) => void
}

interface BrandCtx {
  hasDNA: boolean
  brandName?: string
  platform?: string
  summary?: BrandDNASummary
}

export function ImageStudioDialog({ open, onOpenChange, onAssetsAdded }: ImageStudioDialogProps) {
  const t = useTranslations('videoStudio.imageStudio')
  const [tab, setTab] = useState<'generate' | 'import'>('generate')
  const [brand, setBrand] = useState<BrandCtx>({ hasDNA: false })
  const [isPending, startTransition] = useTransition()
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    void getTenantBrandDNAAction().then((r) => setBrand(r))
  }, [open])

  const handleGenerate = useCallback(async (data: GenerateBriefInput & { platforms: string[] }): Promise<void> => {
    setError(null)
    setVisuals([])
    setSavedCount(0)
    const { platforms, ...briefData } = data
    const targets = platforms.length > 0 ? platforms : [data.platform]
    startTransition(async () => {
      // Une série de visuels PAR plateforme sélectionnée (option multi-plateforme).
      const all: GeneratedVisual[] = []
      let quota = false
      for (const platform of targets) {
        const res = await generateVisualsAction({ ...briefData, platform: platform as GenerateBriefInput['platform'] })
        if (!res.success) {
          if (res.quota_exceeded) { quota = true; break }
          continue
        }
        all.push(...res.visuals)
      }
      if (all.length === 0) {
        setError(quota ? t('quotaExceeded') : t('generateError'))
        return
      }
      setVisuals(all)

      // Référencement AUTOMATIQUE dans la bibliothèque, SANS recopier le fichier :
      // les visuels sont déjà stockés sur MinIO, on insère juste une ligne
      // media_assets pointant vers l'URL existante (anti-gaspillage + anti-perte).
      const reg = await registerVisualsToLibraryAction(
        all.map((v) => ({
          url: v.image.url,
          directionId: v.direction.id,
          directionName: v.direction.name,
          brandDnaScore: v.brand_dna_score,
        })),
      )
      if ('error' in reg) {
        setError(reg.error)
        return
      }
      setSavedCount(reg.assetIds.length)
      if (reg.assetIds.length > 0) onAssetsAdded(reg.assetIds)
      if (reg.failed > 0) setError(t('partialSaveError', { count: reg.failed }))
    })
  }, [onAssetsAdded, t])

  const handleUpload = useCallback(async (file: File): Promise<void> => {
    setUploading(true)
    setUploadMsg(null)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadMediaAssetAction(fd)
    setUploading(false)
    if ('data' in res) {
      setUploadMsg(t('uploadSuccess'))
      onAssetsAdded([res.data.id])
    } else {
      setError(res.error)
    }
  }, [onAssetsAdded, t])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          <div className="flex gap-2">
            <TabButton active={tab === 'generate'} onClick={() => setTab('generate')} icon={<Sparkles className="h-4 w-4" />} label={t('tabGenerate')} />
            <TabButton active={tab === 'import'} onClick={() => setTab('import')} icon={<Upload className="h-4 w-4" />} label={t('tabImport')} />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
            </div>
          )}

          {tab === 'generate' ? (
            <>
              <GenerateForm
                onGenerate={handleGenerate}
                isGenerating={isPending}
                defaultPlatform={brand.platform}
                hasBrandDNA={brand.hasDNA}
                brandName={brand.brandName}
                brandDNASummary={brand.summary}
                multiPlatform
              />
              {savedCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> {t('savedCount', { count: savedCount })}
                </div>
              )}
              {visuals.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visuals.map((v, i) => (
                    <div key={`${v.direction.id}-${i}`} className="relative space-y-1.5 rounded-lg border border-input p-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.image.url} alt={v.direction.name} className="aspect-video w-full rounded object-cover" />
                      {savedCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <Check className="h-3.5 w-3.5" /> {t('added')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f) }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input p-8 text-sm text-muted-foreground transition hover:border-primary/50 hover:bg-muted/40 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                {uploading ? t('uploading') : t('chooseFile')}
              </button>
              {uploadMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-green-600/40 bg-green-600/10 p-3 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> {uploadMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${active ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground hover:bg-muted'}`}
    >
      {icon}
      {label}
    </button>
  )
}
