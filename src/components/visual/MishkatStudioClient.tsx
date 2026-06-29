'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Loader2, Download, AlertCircle, CheckCircle2, ImageIcon, Library, History, Wand2, ImagePlus } from 'lucide-react'
import { ImageStudioDialog } from './ImageStudioDialog'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getMediaAssetsAction, type MediaAsset } from '@/lib/actions/library.actions'
import { getVideoProductionsAction, type VideoProductionSummary } from '@/lib/actions/video-productions.actions'
import {
  MISHKAT_AUDIENCES,
  MISHKAT_TONES,
  MISHKAT_OBJECTIVES,
  MISHKAT_LANGS,
  type MishkatAudience,
  type MishkatTone,
  type MishkatObjective,
  type MishkatLang,
  type MishkatStatus,
} from '@/lib/services/mishkat/types'

interface ResultVariant {
  lang: string
  format: string
  url: string
  public_url: string | null
  media_id: string | null
}

// Plancher 18 s : reading-floor du storyboard 4 scènes (≈17 s FR / 14,5 s AR).
// Des durées plus courtes sont rejetées par Mishkāt.
const DURATIONS = [18, 20, 30, 45, 60, 90] as const
const POLL_INTERVAL_MS = 3000

// Propositions d'intention cliquables (pré-remplissent le brief).
// Chacune se termine par un appel à l'action (CTA) explicite : le studio conclut
// la vidéo sur cet appel et fiabilise la convergence (un brief sans CTA risque
// d'être rejeté). Voir aussi le prompt « Améliorer le brief ».
const BRIEF_EXAMPLES = [
  "Annoncer le lancement de notre nouveau produit aux jeunes entrepreneurs au Maroc, puis les inviter à l'essayer gratuitement dès aujourd'hui.",
  "Présenter notre service aux institutions avec un ton premium et une démonstration sobre, puis proposer de réserver une démo.",
  "Recruter des talents tech à Casablanca en montrant la culture d'équipe et l'impact concret, puis inviter à postuler maintenant.",
] as const
const POLL_TIMEOUT_MS = 6 * 60 * 1000
const MAX_BACKGROUNDS = 8

export function MishkatStudioClient() {
  const t = useTranslations('videoStudio')

  // ── Form state ──────────────────────────────────────────────────────────
  const [intent, setIntent] = useState('')
  const [audience, setAudience] = useState<MishkatAudience>('pairs_tech')
  const [tone, setTone] = useState<MishkatTone>('premium')
  const [objective, setObjective] = useState<MishkatObjective>('awareness')
  const [durationS, setDurationS] = useState<number>(30)
  const [primaryLang, setPrimaryLang] = useState<MishkatLang>('fr')
  const [secondaryLang, setSecondaryLang] = useState<MishkatLang | ''>('ar')
  const [music, setMusic] = useState(true)
  const [voiceover, setVoiceover] = useState(false)
  const [captionsBurned, setCaptionsBurned] = useState(true)

  // ── Library picker ──────────────────────────────────────────────────────
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoadingAssets, startLoadAssets] = useTransition()
  const [showImageStudio, setShowImageStudio] = useState(false)
  const [improving, setImproving] = useState(false)

  const loadAssets = useCallback(() => {
    startLoadAssets(async () => {
      const res = await getMediaAssetsAction({ fileType: 'image', limit: 60 })
      if ('data' in res) setAssets(res.data)
    })
  }, [])

  // ── Historique des productions ──────────────────────────────────────────
  const [history, setHistory] = useState<VideoProductionSummary[]>([])
  const loadHistory = useCallback(() => {
    void getVideoProductionsAction(12).then((res) => {
      if ('data' in res) setHistory(res.data)
    })
  }, [])

  // ── Production lifecycle ────────────────────────────────────────────────
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'polling' | 'done' | 'error'>('idle')
  const [status, setStatus] = useState<MishkatStatus | null>(null)
  const [variants, setVariants] = useState<ResultVariant[]>([])
  const [error, setError] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const pollStartedAt = useRef<number>(0)

  useEffect(() => {
    loadAssets()
    loadHistory()
  }, [loadAssets, loadHistory])

  // Polling piloté par l'état : tant que phase === 'polling', on interroge
  // /api/video/:id. Tout changement de phase (done/error) coupe l'effet.
  useEffect(() => {
    if (phase !== 'polling' || !jobId) return
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      if (Date.now() - pollStartedAt.current > POLL_TIMEOUT_MS) {
        setPhase('error')
        setError(t('errors.timeout'))
        return
      }
      try {
        const res = await fetch(`/api/video/${jobId}`, { cache: 'no-store' })
        const body = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setPhase('error')
          setError(body.error ?? t('errors.generic'))
          return
        }
        setStatus(body.status as MishkatStatus)
        if (body.status === 'done') {
          setVariants(Array.isArray(body.variants) ? body.variants : [])
          setPhase('done')
          loadHistory()
        } else if (body.status === 'error') {
          setPhase('error')
          setError(body.error ?? t('errors.generic'))
        }
      } catch {
        // erreur transitoire → on laisse l'intervalle réessayer
      }
    }
    const interval = setInterval(tick, POLL_INTERVAL_MS)
    void tick() // premier poll immédiat
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [phase, jobId, t, loadHistory])

  const toggleAsset = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_BACKGROUNDS) return prev
      return [...prev, id]
    })
  }, [])

  const improveBrief = useCallback(async () => {
    if (intent.trim().length < 10 || improving) return
    setImproving(true)
    setError(null)
    try {
      const res = await fetch('/api/video/improve-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intent.trim() }),
      })
      const body = await res.json()
      if (res.ok && body.result) setIntent(body.result)
      else setError(body.error ?? t('errors.generic'))
    } catch {
      setError(t('errors.network'))
    } finally {
      setImproving(false)
    }
  }, [intent, improving, t])

  // Images générées/importées dans le modal : on rafraîchit la bibliothèque ET
  // on auto-sélectionne les nouvelles images (sans jamais toucher le brief saisi).
  const handleAssetsAdded = useCallback((ids: string[]) => {
    loadAssets()
    setSelectedIds((prev) => {
      const merged = [...prev]
      for (const id of ids) {
        if (!merged.includes(id) && merged.length < MAX_BACKGROUNDS) merged.push(id)
      }
      return merged
    })
  }, [loadAssets])

  const onSubmit = useCallback(async () => {
    if (intent.trim().length < 10) {
      setError(t('errors.intentTooShort'))
      return
    }
    setError(null)
    setVariants([])
    setPhase('submitting')
    try {
      const res = await fetch('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: intent.trim(),
          audience,
          tone,
          objective,
          duration_s: durationS,
          primaryLang,
          ...(secondaryLang ? { secondaryLang } : {}),
          music,
          voiceover,
          captionsBurned,
          assetIds: selectedIds,
        }),
      })
      const body = await res.json()
      if (!res.ok || !body.id) {
        setPhase('error')
        setError(body.error ?? t('errors.generic'))
        return
      }
      setJobId(body.id)
      setStatus(body.status as MishkatStatus)
      pollStartedAt.current = Date.now()
      setPhase('polling')
    } catch {
      setPhase('error')
      setError(t('errors.network'))
    }
  }, [intent, audience, tone, objective, durationS, primaryLang, secondaryLang, music, voiceover, captionsBurned, selectedIds, t])

  const busy = phase === 'submitting' || phase === 'polling'

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* Intent */}
      <div className="space-y-1.5">
        <label htmlFor="intent" className="text-sm font-medium">{t('intentLabel')}</label>
        <textarea
          id="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder={t('intentPlaceholder')}
          rows={3}
          maxLength={1000}
          disabled={busy}
          className="w-full rounded-lg border border-input bg-background p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {BRIEF_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIntent(ex)}
                disabled={busy}
                className="max-w-[220px] truncate rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                title={ex}
              >
                {ex.slice(0, 42)}…
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={improveBrief}
            disabled={busy || improving || intent.trim().length < 10}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/40 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
          >
            {improving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {t('improveBrief')}
          </button>
        </div>
      </div>

      {/* Selects grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t('audienceLabel')}>
          <Select value={audience} onChange={(e) => setAudience(e.target.value as MishkatAudience)} disabled={busy}>
            {MISHKAT_AUDIENCES.map((v) => <option key={v} value={v}>{t(`audience.${v}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('toneLabel')}>
          <Select value={tone} onChange={(e) => setTone(e.target.value as MishkatTone)} disabled={busy}>
            {MISHKAT_TONES.map((v) => <option key={v} value={v}>{t(`tone.${v}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('objectiveLabel')}>
          <Select value={objective} onChange={(e) => setObjective(e.target.value as MishkatObjective)} disabled={busy}>
            {MISHKAT_OBJECTIVES.map((v) => <option key={v} value={v}>{t(`objective.${v}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('durationLabel')}>
          <Select value={String(durationS)} onChange={(e) => setDurationS(Number(e.target.value))} disabled={busy}>
            {DURATIONS.map((v) => <option key={v} value={v}>{v}s</option>)}
          </Select>
        </Field>
        <Field label={t('primaryLangLabel')}>
          <Select value={primaryLang} onChange={(e) => setPrimaryLang(e.target.value as MishkatLang)} disabled={busy}>
            {MISHKAT_LANGS.map((v) => <option key={v} value={v}>{t(`lang.${v}`)}</option>)}
          </Select>
        </Field>
        <Field label={t('secondaryLangLabel')}>
          <Select value={secondaryLang} onChange={(e) => setSecondaryLang(e.target.value as MishkatLang | '')} disabled={busy}>
            <option value="">{t('noSecondary')}</option>
            {MISHKAT_LANGS.map((v) => <option key={v} value={v}>{t(`lang.${v}`)}</option>)}
          </Select>
        </Field>
      </div>

      {/* Sound toggles */}
      <div className="flex flex-wrap gap-6">
        <Toggle label={t('music')} checked={music} onChange={setMusic} disabled={busy} />
        <Toggle label={t('voiceover')} checked={voiceover} onChange={setVoiceover} disabled={busy} />
        <Toggle label={t('captions')} checked={captionsBurned} onChange={setCaptionsBurned} disabled={busy} />
      </div>

      {/* Library picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Library className="h-4 w-4" /> {t('backgroundsLabel')}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowImageStudio(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
            >
              <ImagePlus className="h-3.5 w-3.5" /> {t('addImages')}
            </button>
            <span className="text-xs text-muted-foreground">{t('selectedCount', { count: selectedIds.length, max: MAX_BACKGROUNDS })}</span>
          </div>
        </div>
        {isLoadingAssets ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t('loadingAssets')}</div>
        ) : assets.length === 0 ? (
          <p className="rounded-lg border border-dashed border-input p-4 text-sm text-muted-foreground">{t('noAssets')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {assets.map((a) => {
              const selected = selectedIds.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAsset(a.id)}
                  disabled={busy}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 transition ${selected ? 'border-primary ring-2 ring-primary' : 'border-transparent'}`}
                >
                  {a.publicUrl
                    ? /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={a.publicUrl} alt={a.originalFilename} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}
                  {selected && <CheckCircle2 className="absolute right-1 top-1 h-4 w-4 text-primary" fill="white" />}
                </button>
              )
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{selectedIds.length === 0 ? t('noBackgroundsHint') : t('backgroundsHint')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {phase === 'submitting' ? t('submitting')
          : phase === 'polling' ? t(`status.${status ?? 'generating'}`)
          : t('submit')}
      </button>

      {/* Results */}
      {phase === 'done' && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="h-5 w-5 text-green-600" /> {t('resultTitle')}</h3>
          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noVariants')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {variants.map((v) => {
                const src = v.public_url ?? v.url
                return (
                  <div key={`${v.lang}-${v.format}`} className="space-y-2 rounded-lg border border-input p-2">
                    <div className="flex items-center justify-between text-xs font-medium uppercase text-muted-foreground">
                      <span>{v.lang} · {v.format}</span>
                    </div>
                    <video src={src} controls className="aspect-video w-full rounded bg-black" />
                    <a
                      href={src}
                      download={`mishkat-${v.lang}-${v.format.replace(':', 'x')}.mp4`}
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" /> {t('download')}
                    </a>
                  </div>
                )
              })}
            </div>
          )}
          <a href="/dashboard/library" className="text-sm text-primary hover:underline">{t('viewInLibrary')}</a>
        </section>
      )}

      {/* Historique des productions */}
      {history.length > 0 && (
        <section className="space-y-3 border-t border-input pt-4">
          <h3 className="flex items-center gap-2 text-base font-semibold"><History className="h-4 w-4" /> {t('history.title')}</h3>
          <ul className="space-y-2">
            {history.map((p) => {
              const ready = p.variants.filter((v) => v.public_url)
              return (
                <li key={p.jobId} className="rounded-lg border border-input p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-muted-foreground">{p.intent || t('history.untitled')}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{statusLabel(t, p.status)}</span>
                  </div>
                  {ready.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ready.map((v) => v.public_url ? (
                        <a
                          key={`${v.lang}-${v.format}`}
                          href={v.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
                        >
                          <Download className="h-3 w-3" /> {v.lang} · {v.format}
                        </a>
                      ) : null)}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <ImageStudioDialog
        open={showImageStudio}
        onOpenChange={setShowImageStudio}
        onAssetsAdded={handleAssetsAdded}
      />
    </div>
  )
}

const KNOWN_STATUSES = new Set(['queued', 'generating', 'rendering', 'done', 'error'])
function statusLabel(t: ReturnType<typeof useTranslations>, status: string): string {
  return KNOWN_STATUSES.has(status) ? t(`status.${status}`) : status
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
      {label}
    </label>
  )
}
