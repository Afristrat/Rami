'use client'

// ============================================================
// ImageStudioDialog — modal de génération / import d'images pour le Studio vidéo
// Réutilise le workflow visuel EXISTANT (GenerateForm + generateVisualsAction +
// saveVisualToLibraryAction) et l'upload (uploadMediaAssetAction). À chaque ajout,
// `onLibraryChanged` rafraîchit le picker de la page vidéo. Composant isolé : il
// ne touche jamais l'état (brief / sélection) de la page vidéo.
// ============================================================

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Check, Upload, Sparkles, ImagePlus, AlertCircle, CheckCircle2 } from 'lucide-react'
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
  saveVisualToLibraryAction,
  getTenantBrandDNAAction,
  type BrandDNASummary,
} from '@/lib/actions/visual.actions'
import { uploadMediaAssetAction } from '@/lib/actions/library.actions'
import type { GenerateBriefInput } from '@/lib/schemas/visual.schema'
import type { GeneratedVisual } from '@/lib/services/image-generation/types'

interface ImageStudioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLibraryChanged: () => void
}

interface BrandCtx {
  hasDNA: boolean
  brandName?: string
  platform?: string
  summary?: BrandDNASummary
}

export function ImageStudioDialog({ open, onOpenChange, onLibraryChanged }: ImageStudioDialogProps) {
  const t = useTranslations('videoStudio.imageStudio')
  const [tab, setTab] = useState<'generate' | 'import'>('generate')
  const [brand, setBrand] = useState<BrandCtx>({ hasDNA: false })
  const [isPending, startTransition] = useTransition()
  const [visuals, setVisuals] = useState<GeneratedVisual[]>([])
  const [error, setError] = useState<string | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    void getTenantBrandDNAAction().then((r) => setBrand(r))
  }, [open])

  const keyOf = (v: GeneratedVisual): string => `${v.direction.id}-${v.image.url}`

  const handleGenerate = useCallback(async (data: GenerateBriefInput): Promise<void> => {
    setError(null)
    setVisuals([])
    setSavedKeys(new Set())
    startTransition(async () => {
      const res = await generateVisualsAction(data)
      if (!res.success) {
        if (res.quota_exceeded) setError(t('quotaExceeded'))
        else setError(res.error ?? t('generateError'))
        return
      }
      setVisuals(res.visuals)
    })
  }, [t])

  const handleSave = useCallback(async (v: GeneratedVisual): Promise<void> => {
    const k = keyOf(v)
    setSavingKey(k)
    setError(null)
    const res = await saveVisualToLibraryAction({
      imageUrl: v.image.url,
      directionId: v.direction.id,
      directionName: v.direction.name,
      brandDnaScore: v.brand_dna_score,
    })
    setSavingKey(null)
    if (res.success) {
      setSavedKeys((prev) => new Set(prev).add(k))
      onLibraryChanged()
    } else {
      setError(res.error ?? t('saveError'))
    }
  }, [onLibraryChanged, t])

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
      onLibraryChanged()
    } else {
      setError(res.error)
    }
  }, [onLibraryChanged, t])

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
              />
              {visuals.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visuals.map((v) => {
                    const k = keyOf(v)
                    const saved = savedKeys.has(k)
                    return (
                      <div key={k} className="space-y-1.5 rounded-lg border border-input p-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.image.url} alt={v.direction.name} className="aspect-video w-full rounded object-cover" />
                        <button
                          type="button"
                          onClick={() => handleSave(v)}
                          disabled={saved || savingKey === k}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition ${saved ? 'bg-green-600/15 text-green-600' : 'bg-primary text-primary-foreground hover:opacity-90'} disabled:opacity-70`}
                        >
                          {saved ? (<><Check className="h-3.5 w-3.5" /> {t('added')}</>)
                            : savingKey === k ? (<Loader2 className="h-3.5 w-3.5 animate-spin" />)
                            : (<><ImagePlus className="h-3.5 w-3.5" /> {t('addToLibrary')}</>)}
                        </button>
                      </div>
                    )
                  })}
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
