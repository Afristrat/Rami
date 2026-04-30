'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Mic, Search, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Speaker, Verbatim, AiAction } from '@/lib/schemas/transcription.schema'
import type { TranscriptionDetail } from '@/lib/actions/transcriptions.actions'
import AiSummaryPanel from './AiSummaryPanel'
import TranscriptionExportBar from './TranscriptionExportBar'

// ── Types ────────────────────────────────────────────────────────────────────

interface TranscriptionResultProps {
  transcription: TranscriptionDetail | null
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SPEAKERS: Speaker[] = [
  {
    speaker: 'Intervenant 1',
    segments: [
      {
        start: 0,
        end: 45,
        text: "Bonjour \u00e0 tous. Aujourd\u2019hui, nous allons valider les axes de notre nouvelle strat\u00e9gie marketing pour le troisi\u00e8me trimestre. L\u2019objectif est de doubler notre engagement organique sur les plateformes sociales.",
      },
      {
        start: 345,
        end: 420,
        text: "Justement, j\u2019ai analys\u00e9 les retours de l\u2019algorithme pr\u00e9dictif. Il semblerait que notre cible principale r\u00e9agisse mieux aux contenus de type \u00ab Behind the scenes \u00bb. Nous devrions pivoter notre marketing vers plus d\u2019authenticit\u00e9 et moins de production l\u00e9ch\u00e9e.",
      },
    ],
  },
  {
    speaker: 'Intervenant 2',
    segments: [
      {
        start: 134,
        end: 210,
        text: "C\u2019est ambitieux. Concernant le budget allou\u00e9 au marketing d\u2019influence, nous devons rester prudents sur les indicateurs de performance actuels. La conversion n\u2019est pas encore au niveau attendu sur la derni\u00e8re campagne.",
      },
      {
        start: 750,
        end: 830,
        text: "Je suis d\u2019accord. Je vais demander \u00e0 l\u2019\u00e9quipe de pr\u00e9parer un prototype de planning \u00e9ditorial pour la semaine prochaine. Est-ce qu\u2019on garde le m\u00eame prestataire pour le montage vid\u00e9o ?",
      },
    ],
  },
]

const KEYWORDS = [
  'strat\u00e9gie',
  'marketing',
  'engagement organique',
  'indicateurs de performance',
  'algorithme',
  'authenticit\u00e9',
  'prototype',
  'planning \u00e9ditorial',
]

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
    fr: 'Fran\u00e7ais (FR)',
    ar: 'Arabe (AR)',
    darija: 'Darija (MA)',
    en: 'Anglais (EN)',
    es: 'Espagnol (ES)',
  }
  return map[lang] ?? lang.toUpperCase()
}

// Build a flattened list of all segments sorted by start time
function flattenSpeakers(speakers: Speaker[]): Array<{
  speaker: string
  speakerIndex: number
  start: number
  end: number
  text: string
}> {
  const result: Array<{
    speaker: string
    speakerIndex: number
    start: number
    end: number
    text: string
  }> = []

  speakers.forEach((s, idx) => {
    s.segments.forEach((seg) => {
      result.push({
        speaker: s.speaker,
        speakerIndex: idx,
        start: seg.start,
        end: seg.end,
        text: seg.text,
      })
    })
  })

  return result.sort((a, b) => a.start - b.start)
}

// Highlight keywords in text
function highlightText(text: string, keywords: string[], searchTerm: string): React.ReactNode[] {
  const allTerms = [...keywords]
  if (searchTerm.trim()) {
    allTerms.push(searchTerm.trim())
  }

  if (allTerms.length === 0) return [text]

  const escapedTerms = allTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi')

  return text.split(pattern).map((part, i) => {
    const isKeyword = keywords.some((k) => k.toLowerCase() === part.toLowerCase())
    const isSearch = searchTerm.trim() && part.toLowerCase() === searchTerm.trim().toLowerCase()

    if (isKeyword || isSearch) {
      return (
        <mark
          key={i}
          className="bg-amber-500/20 text-amber-600 dark:text-amber-300 px-0.5 rounded font-medium"
        >
          {part}
        </mark>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  const t = useTranslations("transcriptions")
  const [searchTerm, setSearchTerm] = useState('')

  // Use real data or mock
  const speakers: Speaker[] = transcription?.speakers && (transcription.speakers as Speaker[]).length > 0
    ? transcription.speakers as Speaker[]
    : MOCK_SPEAKERS

  const title = transcription?.title ?? 'R\u00e9union Strat\u00e9gie Q3.mp3'
  const duration = transcription?.duration_seconds ?? 2712
  const language = transcription?.language ?? 'fr'

  const allSegments = useMemo(() => flattenSpeakers(speakers), [speakers])

  // Filter segments by search term
  const filteredSegments = useMemo(() => {
    if (!searchTerm.trim()) return allSegments
    const lower = searchTerm.toLowerCase()
    return allSegments.filter((seg) => seg.text.toLowerCase().includes(lower))
  }, [allSegments, searchTerm])

  const fullText = useMemo(
    () => allSegments.map((s) => `[${s.speaker}] ${s.text}`).join('\n\n'),
    [allSegments]
  )

  return (
    <div className="pb-20">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: Transcription ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <div
            className={cn(
              'rounded-2xl p-5',
              'glass-card'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-violet-500/20">
                  <Mic className="size-5 text-violet-400" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">{title}</h1>
                  <p className="text-xs text-muted-foreground">
                    {t("duration")} : {formatDuration(duration)}
                  </p>
                </div>
              </div>
              <span
                className="px-3 py-1 rounded-full text-[11px] font-medium bg-muted/30 text-muted-foreground"
              >
                {getLanguageLabel(language)}
              </span>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className={cn(
                  'w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-colors',
                  'bg-background border border-border text-foreground placeholder:text-muted-foreground',
                  'focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400'
                )}
              />
            </div>
          </div>

          {/* Audio waveform placeholder */}
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-3',
              'glass-card'
            )}
          >
            <button className="flex size-8 items-center justify-center rounded-full bg-violet-500 text-white hover:bg-violet-600 transition-colors flex-shrink-0">
              <Play className="size-3.5 ml-0.5" />
            </button>
            <div className="flex-1 h-8 flex items-end gap-px overflow-hidden">
              {Array.from({ length: 80 }).map((_, i) => {
                // Deterministic pseudo-random heights based on index
                const h = ((Math.sin(i * 0.7) + 1) / 2) * 80 + 20
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-full min-w-[2px]',
                      i < 30 ? 'bg-violet-500' : 'bg-muted/30'
                    )}
                    style={{ height: `${h}%`, minHeight: '4px' }}
                  />
                )
              })}
            </div>
            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
              00:00 / {formatDuration(duration)}
            </span>
          </div>

          {/* Speaker segments */}
          <div
            className={cn(
              'rounded-2xl p-5 space-y-6',
              'glass-card'
            )}
          >
            {filteredSegments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t("noResultsFor")} &laquo; {searchTerm} &raquo;
              </p>
            ) : (
              filteredSegments.map((segment, idx) => {
                const color = SPEAKER_COLORS[segment.speakerIndex % SPEAKER_COLORS.length]
                const initial = segment.speaker.split(' ').pop()?.charAt(0) ?? '?'

                return (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className={cn(
                          'flex size-9 items-center justify-center rounded-full text-xs font-bold text-white',
                          color.bg
                        )}
                      >
                        {initial}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('text-sm font-semibold', color.text)}>
                          {segment.speaker}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatTimestamp(segment.start)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {highlightText(segment.text, KEYWORDS, searchTerm)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Right: AI Panel ──────────────────────────────────────── */}
        <div>
          <AiSummaryPanel
            aiSummary={transcription?.ai_summary ?? null}
            verbatims={(transcription?.verbatims as Verbatim[] | null) ?? null}
            aiActions={(transcription?.ai_actions as AiAction[] | null) ?? null}
          />
        </div>
      </div>

      {/* Export bar */}
      <TranscriptionExportBar
        transcriptText={transcription?.transcript_text ?? fullText}
        title={title}
      />
    </div>
  )
}
