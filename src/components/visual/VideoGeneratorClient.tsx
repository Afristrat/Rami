'use client'

import { useState, useTransition, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { generateVideoAction } from '@/lib/actions/video.actions'
import { GenerateVideoSchema, type GenerateVideoInput } from '@/lib/schemas/video.schema'
import { TranslatedFieldError } from '@/components/ui/field-error-i18n'
import {
  Sparkles, Loader2, Video, Download, AlertCircle,
  Music2, Image as ImageIcon, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', emoji: '🎵', maxDuration: 60 },
  { value: 'instagram_reels', label: 'Instagram Reels', emoji: '📸', maxDuration: 90 },
  { value: 'youtube_shorts', label: 'YouTube Shorts', emoji: '▶', maxDuration: 60 },
] as const

const DURATION_OPTIONS = [5, 8, 10, 15, 20, 30] as const

const PROVIDER_LABELS: Record<string, string> = {
  veo: 'Veo 3.1',
  runway: 'Runway Gen-4',
  kling: 'Kling 2.6',
  luma_ray: 'Luma Ray3',
  wan: 'Wan 2.2',
}

interface GeneratedVideoState {
  url: string
  provider: string
  model: string
  duration_ms: number
  width: number
  height: number
  duration_seconds: number
  has_audio: boolean
}

export function VideoGeneratorClient() {
  const t = useTranslations('video')
  const _tc = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideoState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const PROMPT_EXAMPLES = [
    'Caf\u00e9 marocain traditionnel, vapeur montante, lumi\u00e8re dor\u00e9e du matin, ambiance chaleureuse',
    'Startup tech Casablanca, \u00e9quipe dynamique en action, bureau moderne, \u00e9nergie cr\u00e9ative',
    'Collection mode \u00e9co-responsable, mannequin en ext\u00e9rieur naturel, palette terracotta et vert',
  ]

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<GenerateVideoInput>({
    resolver: zodResolver(GenerateVideoSchema),
    defaultValues: {
      prompt: '',
      platform: 'instagram_reels',
      duration_seconds: 10,
      reference_image_url: '',
      audio_prompt: '',
    },
  })

  const selectedPlatform = watch('platform')
  const selectedDuration = watch('duration_seconds')
  const promptValue = watch('prompt')
  const charCount = promptValue?.length ?? 0

  const onSubmit = useCallback((data: GenerateVideoInput) => {
    setError(null)
    setGeneratedVideo(null)
    startTransition(async () => {
      const result = await generateVideoAction(data)
      if (!result.success) {
        setError(result.error ?? t('generationFailed'))
        return
      }
      setGeneratedVideo({
        url: result.video_url!,
        provider: result.provider!,
        model: result.model!,
        duration_ms: result.duration_ms!,
        width: result.width!,
        height: result.height!,
        duration_seconds: result.duration_seconds!,
        has_audio: result.has_audio!,
      })
    })
  }, [t])

  const handleDownload = async () => {
    if (!generatedVideo) return
    setIsDownloading(true)
    try {
      const response = await fetch(generatedVideo.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rami-video-${Date.now()}.mp4`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(generatedVideo.url, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center shrink-0">
          <Video className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('generateVideo')}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('providerChain')}
          </p>
        </div>
      </div>

      {/* Formulaire full-width */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Layout 2 colonnes sur lg+ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne gauche : prompt */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  {t('promptLabel')} <span className="text-pink-500">*</span>
                </label>
                <span className={`text-xs ${charCount > 900 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {charCount}/1000
                </span>
              </div>

              <textarea
                {...register('prompt')}
                rows={5}
                placeholder={t('promptPlaceholder')}
                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-input text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all"
              />

              {errors.prompt && <TranslatedFieldError message={errors.prompt.message} />}

              {/* Exemples */}
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValue('prompt', ex)}
                    className="text-xs px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground transition-all truncate max-w-[200px]"
                  >
                    {ex.slice(0, 35)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Colonne droite : plateforme + durée + options */}
            <div className="space-y-4">
              {/* Plateforme */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t('platform')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setValue('platform', p.value)}
                      className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs transition-all ${
                        selectedPlatform === p.value
                          ? 'border-pink-500 bg-pink-500/15 text-pink-600 dark:text-pink-300'
                          : 'border-border bg-muted/40 text-muted-foreground hover:border-pink-500/40 hover:text-foreground'
                      }`}
                    >
                      <span className="text-lg">{p.emoji}</span>
                      <span className="font-medium leading-tight text-center">{p.label}</span>
                      <span className="text-[10px] text-muted-foreground">max {p.maxDuration}s</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Durée */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('duration')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setValue('duration_seconds', d)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedDuration === d
                          ? 'border-pink-500 bg-pink-500/15 text-pink-600 dark:text-pink-300'
                          : 'border-border bg-muted/40 text-muted-foreground hover:border-pink-500/40'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Options avancées */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{t('advancedOptions')}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-input">
                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      {...register('reference_image_url')}
                      type="url"
                      placeholder={t('referenceImage')}
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-xs focus:outline-none min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-input">
                    <Music2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      {...register('audio_prompt')}
                      type="text"
                      placeholder={t('audioAmbiance')}
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-xs focus:outline-none min-w-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton générer — pleine largeur */}
          <button
            type="submit"
            disabled={isPending || charCount < 10}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-violet-600 text-white font-semibold text-sm transition-all hover:from-pink-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('generatingDuration')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t('generateButton')}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-destructive font-medium">{t('generationFailed')}</p>
            <p className="text-xs text-destructive/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Génération en cours */}
      {isPending && (
        <div className="flex flex-col items-center justify-center py-20 space-y-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-pink-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-violet-500/40 animate-pulse" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-600/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-foreground text-sm font-medium animate-pulse">{t('generationInProgress')}</p>
            <p className="text-muted-foreground text-xs">{t('patienceNote')}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" />
            {t('providerChainLabel')}
          </div>
        </div>
      )}

      {/* Vidéo générée */}
      {!isPending && generatedVideo && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              {t('generatedBy', { provider: PROVIDER_LABELS[generatedVideo.provider] ?? generatedVideo.provider })}
            </p>
            <span className="ml-auto text-xs text-emerald-600/60 dark:text-emerald-300/50">
              {(generatedVideo.duration_ms / 1000).toFixed(1)}s
            </span>
          </div>

          {/* Lecteur — centré et limité en largeur pour éviter une vidéo 9:16 trop étirée */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden bg-black border border-border">
              <video
                src={generatedVideo.url}
                controls
                loop
                autoPlay
                muted
                playsInline
                className="w-full"
                style={{ aspectRatio: `${generatedVideo.width}/${generatedVideo.height}` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{generatedVideo.width}×{generatedVideo.height}px</span>
              <span>{generatedVideo.duration_seconds}s</span>
              {generatedVideo.has_audio && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Music2 className="w-3 h-3" /> {t('audioIncluded')}
                </span>
              )}
              <span>{PROVIDER_LABELS[generatedVideo.provider] ?? generatedVideo.provider}</span>
            </div>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? t('downloading') : t('downloadMp4')}
            </button>
          </div>
        </div>
      )}

      {/* État vide */}
      {!isPending && !generatedVideo && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Video className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-foreground text-sm font-medium">{t('describeVideo')}</p>
            <p className="text-muted-foreground text-xs mt-1">{t('choosePlatform')}</p>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-sm text-left">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300/80">
              {t('apiKeyRequired')}{' '}
              <a href="/settings" className="underline hover:text-amber-600 dark:hover:text-amber-300">{t('settingsLink')}</a>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
