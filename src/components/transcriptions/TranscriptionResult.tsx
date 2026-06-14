'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Mic, Search, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Speaker, Verbatim, AiAction } from '@/lib/schemas/transcription.schema'
import type { TranscriptionDetail } from '@/lib/actions/transcriptions.actions'
import AiSummaryPanel from './AiSummaryPanel'
import TranscriptionExportBar from './TranscriptionExportBar'

// ── Types ────────────────────────────────────────────────────────────────────

interface TranscriptionResultProps {
  transcription: TranscriptionDetail | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SPEAKER_COLORS = [
  { bg: 'bg-violet-500', text: 'text-violet-500 dark:text-violet-400' },
  { bg: 'bg-blue-500', text: 'text-blue-500 dark:text-blue-400' },
  { bg: 'bg-emerald-500', text: 'text-emerald-500 dark:text-emerald-400' },
  { bg: 'bg-amber-500', text: 'text-amber-500 dark:text-amber-400' },
  { bg: 'bg-rose-500', text: 'text-rose-500 dark:text-rose-400' },
]

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getLanguageLabel(lang: string): string {
  const map: Record<string, string> = {
    fr: 'Français (FR)',
    ar: 'Arabe (AR)',
    darija: 'Darija (MA)',
    en: 'Anglais (EN)',
    es: 'Espagnol (ES)',
  }
  return map[lang] ?? lang.toUpperCase()
}

// Aplatit les segments de tous les intervenants, triés par horodatage.
function flattenSpeakers(speakers: Speaker[]): Array<{
  speaker: string
  speakerIndex: number
  start: number
  end: number
  text: string
}> {
  const result: Array<{ speaker: string; speakerIndex: number; start: number; end: number; text: string }> = []
  speakers.forEach((s, idx) => {
    s.segments.forEach((seg) => {
      result.push({ speaker: s.speaker, speakerIndex: idx, start: seg.start, end: seg.end, text: seg.text })
    })
  })
  return result.sort((a, b) => a.start - b.start)
}

// Surligne uniquement le terme recherché (aucun mot-clé inventé).
function highlightText(text: string, searchTerm: string): React.ReactNode[] {
  const term = searchTerm.trim()
  if (!term) return [text]
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(${escaped})`, 'gi')
  return text.split(pattern).map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i} className="bg-amber-500/20 text-amber-600 dark:text-amber-300 px-0.5 rounded font-medium">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function StateCard({ icon, title, desc, tone }: { icon: React.ReactNode; title: string; desc?: string; tone: 'error' | 'muted' }) {
  return (
    <div className="glass-card rounded-2xl p-8 flex flex-col items-center text-center gap-2">
      <div className={cn('flex size-10 items-center justify-center rounded-xl', tone === 'error' ? 'bg-red-500/15 text-red-500' : 'bg-muted/40 text-muted-foreground')}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {desc && <p className="text-xs text-muted-foreground max-w-sm">{desc}</p>}
    </div>
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  const t = useTranslations('transcriptions')
  const [searchTerm, setSearchTerm] = useState('')

  const speakers = useMemo<Speaker[]>(
    () => (transcription?.speakers as Speaker[] | null) ?? [],
    [transcription]
  )
  const title = transcription?.title ?? '—'
  const duration = transcription?.duration_seconds ?? null
  const language = transcription?.language ?? 'fr'
  const status = transcription?.status ?? 'failed'
  const transcriptText = transcription?.transcript_text ?? null

  const allSegments = useMemo(() => flattenSpeakers(speakers), [speakers])

  const filteredSegments = useMemo(() => {
    if (!searchTerm.trim()) return allSegments
    const lower = searchTerm.toLowerCase()
    return allSegments.filter((seg) => seg.text.toLowerCase().includes(lower))
  }, [allSegments, searchTerm])

  const fullText = useMemo(
    () =>
      allSegments.length > 0
        ? allSegments.map((s) => `[${s.speaker}] ${s.text}`).join('\n\n')
        : (transcriptText ?? ''),
    [allSegments, transcriptText]
  )

  const isProcessing = status === 'processing' || status === 'uploading'
  const isFailed = status === 'failed'
  const hasContent = allSegments.length > 0 || (transcriptText !== null && transcriptText.trim().length > 0)

  return (
    <div className="pb-20">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Gauche : transcription ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <div className={cn('rounded-2xl p-5', 'glass-card')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20">
                  <Mic className="size-5 text-violet-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">{title}</h1>
                  <p className="text-xs text-muted-foreground">
                    {t('duration')} : {formatDuration(duration)}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-muted/30 text-muted-foreground">
                {getLanguageLabel(language)}
              </span>
            </div>

            {/* Recherche — uniquement quand il y a du contenu */}
            {hasContent && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className={cn(
                    'w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-colors',
                    'bg-background border border-border text-foreground placeholder:text-muted-foreground',
                    'focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400'
                  )}
                />
              </div>
            )}
          </div>

          {/* États honnêtes selon le statut réel */}
          {isFailed && !hasContent ? (
            <StateCard
              icon={<AlertCircle className="size-5" />}
              title={t('resultFailedTitle')}
              desc={t('resultFailedDesc')}
              tone="error"
            />
          ) : isProcessing && !hasContent ? (
            <StateCard
              icon={<Loader2 className="size-5 animate-spin" />}
              title={t('resultProcessingTitle')}
              desc={t('resultProcessingDesc')}
              tone="muted"
            />
          ) : (
            <div className={cn('rounded-2xl p-5 space-y-6', 'glass-card')}>
              {allSegments.length > 0 ? (
                filteredSegments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('noResultsFor')} &laquo; {searchTerm} &raquo;
                  </p>
                ) : (
                  filteredSegments.map((segment, idx) => {
                    const color = SPEAKER_COLORS[segment.speakerIndex % SPEAKER_COLORS.length]
                    const initial = segment.speaker.split(' ').pop()?.charAt(0) ?? '?'
                    return (
                      <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className={cn('flex size-9 items-center justify-center rounded-full text-xs font-bold text-white', color.bg)}>
                            {initial}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-sm font-semibold', color.text)}>{segment.speaker}</span>
                            <span className="text-xs text-muted-foreground font-mono">{formatTimestamp(segment.start)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {highlightText(segment.text, searchTerm)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )
              ) : transcriptText && transcriptText.trim().length > 0 ? (
                // Pas de diarisation par intervenant : texte brut réel.
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {highlightText(transcriptText, searchTerm)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">{t('transcriptEmpty')}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Droite : panneau IA ──────────────────────────────────── */}
        <div>
          <AiSummaryPanel
            aiSummary={transcription?.ai_summary ?? null}
            verbatims={(transcription?.verbatims as Verbatim[] | null) ?? null}
            aiActions={(transcription?.ai_actions as AiAction[] | null) ?? null}
          />
        </div>
      </div>

      {/* Export — uniquement s'il y a du texte réel à exporter */}
      {hasContent && <TranscriptionExportBar transcriptText={fullText} title={title} />}
    </div>
  )
}
