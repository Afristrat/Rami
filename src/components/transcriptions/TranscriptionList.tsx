'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FileAudio, Clock, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIntlLocale } from '@/lib/utils/format-locale'
import { useState } from 'react'
import { deleteTranscriptionAction } from '@/lib/actions/transcriptions.actions'
import type { TranscriptionListItem } from '@/lib/actions/transcriptions.actions'

// ── Types ────────────────────────────────────────────────────────────────────

type TranscriptionStatus = 'uploading' | 'processing' | 'completed' | 'failed'

interface TranscriptionListProps {
  transcriptions: TranscriptionListItem[]
  showViewAll?: boolean
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRANSCRIPTIONS: TranscriptionListItem[] = [
  {
    id: 'mock-1',
    title: 'R\u00e9union Strat\u00e9gique \u2014 E-commerce Hub',
    original_filename: 'reunion_strategie_ecommerce.mp3',
    mime_type: 'audio/mpeg',
    file_size_bytes: 45_000_000,
    duration_seconds: 2712,
    language: 'fr',
    status: 'completed',
    created_at: '2026-03-12T10:00:00Z',
  },
  {
    id: 'mock-2',
    title: 'interview_marketing',
    original_filename: 'interview_marketing.mp3',
    mime_type: 'audio/mpeg',
    file_size_bytes: 32_000_000,
    duration_seconds: 1935,
    language: 'fr',
    status: 'processing',
    created_at: '2026-03-10T14:20:00Z',
  },
  {
    id: 'mock-3',
    title: 'reunion_hebdo_final',
    original_filename: 'reunion_hebdo_final.mp4',
    mime_type: 'video/mp4',
    file_size_bytes: 120_000_000,
    duration_seconds: 3750,
    language: 'fr',
    status: 'completed',
    created_at: '2026-03-08T09:30:00Z',
  },
  {
    id: 'mock-4',
    title: 'podcast_episode_04',
    original_filename: 'podcast_episode_04.wav',
    mime_type: 'audio/wav',
    file_size_bytes: 85_000_000,
    duration_seconds: 2925,
    language: 'fr',
    status: 'completed',
    created_at: '2026-03-05T16:00:00Z',
  },
  {
    id: 'mock-5',
    title: 'audio_corrompue',
    original_filename: 'audio_corrompue.mp3',
    mime_type: 'audio/mpeg',
    file_size_bytes: 15_000_000,
    duration_seconds: 920,
    language: 'fr',
    status: 'failed',
    created_at: '2026-03-03T11:45:00Z',
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<TranscriptionStatus, { labelKey: string; className: string; iconBg: string; iconColor: string }> = {
  uploading: {
    labelKey: 'statusUpload',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
  },
  processing: {
    labelKey: 'statusProcessing',
    className: 'bg-violet-500/20 text-violet-400 border-violet-500/30 animate-pulse',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
  },
  completed: {
    labelKey: 'statusCompleted',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-400',
  },
  failed: {
    labelKey: 'statusFailed',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
  },
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TranscriptionList({ transcriptions, showViewAll = true }: TranscriptionListProps) {
  const t = useTranslations("transcriptions")
  const tCommon = useTranslations("common")
  const intlLocale = useIntlLocale()
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const items = transcriptions.length > 0 ? transcriptions : MOCK_TRANSCRIPTIONS
  const isDemo = transcriptions.length === 0

  const handleDelete = async (id: string) => {
    if (isDemo) return
    setDeletingId(id)
    await deleteTranscriptionAction(id)
    setDeletingId(null)
    setMenuOpenId(null)
    router.refresh()
  }

  const handleClick = (item: TranscriptionListItem) => {
    if (item.status === 'completed') {
      router.push(`/dashboard/transcriptions/${item.id}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          {t("recentTranscriptions")}
        </h2>
        {showViewAll && (
          <button className="text-xs font-medium text-violet-500 hover:text-violet-400 transition-colors">
            {t("viewAll")}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const statusCfg = STATUS_CONFIG[item.status as TranscriptionStatus] ?? STATUS_CONFIG.completed

          return (
            <div
              key={item.id}
              onClick={() => handleClick(item)}
              className={cn(
                'group relative flex items-center gap-4 rounded-xl p-4 transition-colors',
                'glass-card',
                item.status === 'completed'
                  ? 'cursor-pointer hover:bg-muted/50'
                  : 'cursor-default',
                deletingId === item.id && 'opacity-50'
              )}
            >
              {/* Icon */}
              <div className={cn('flex size-10 items-center justify-center rounded-xl', statusCfg.iconBg)}>
                <FileAudio className={cn('size-5', statusCfg.iconColor)} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title || item.original_filename}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(item.created_at, intlLocale)} &middot; {formatFileSize(item.file_size_bytes)}
                </p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3">
                {item.duration_seconds && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {formatDuration(item.duration_seconds)}
                  </div>
                )}

                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium border',
                    statusCfg.className
                  )}
                >
                  {t(statusCfg.labelKey)}
                </span>

                {/* Context menu */}
                {!isDemo && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === item.id ? null : item.id)
                      }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MoreVertical className="size-4" />
                    </button>

                    {menuOpenId === item.id && (
                      <div
                        className={cn(
                          'absolute right-0 top-8 z-50 w-36 rounded-lg py-1 shadow-lg',
                          'glass-card'
                        )}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.id)
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-muted/50',
                          )}
                        >
                          <Trash2 className="size-3.5" />
                          {tCommon("delete")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
