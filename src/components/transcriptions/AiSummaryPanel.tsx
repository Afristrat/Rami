'use client'

import { useTranslations } from 'next-intl'
import { Sparkles, MessageSquareQuote, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Verbatim, AiAction } from '@/lib/schemas/transcription.schema'

// ── Types ────────────────────────────────────────────────────────────────────

interface AiSummaryPanelProps {
  aiSummary: string | null
  verbatims: Verbatim[] | null
  aiActions: AiAction[] | null
}

// ── Card wrapper ─────────────────────────────────────────────────────────────

function PanelCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5',
        'glass-card',
        className
      )}
    >
      {children}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-muted-foreground/60 italic">{text}</p>
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AiSummaryPanel({ aiSummary, verbatims, aiActions }: AiSummaryPanelProps) {
  const t = useTranslations('transcriptions')
  const verbatimList = verbatims ?? []
  const actionList = aiActions ?? []

  return (
    <div className="space-y-4">
      {/* Résumé IA — réel ou état vide honnête */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">{t('aiSummary')}</h3>
        </div>
        {aiSummary && aiSummary.trim().length > 0 ? (
          <p className="text-xs text-muted-foreground leading-relaxed">{aiSummary}</p>
        ) : (
          <EmptyHint text={t('summaryEmpty')} />
        )}
      </PanelCard>

      {/* Verbatims clés */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareQuote className="size-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-foreground">{t('verbatimsKey')}</h3>
        </div>
        {verbatimList.length > 0 ? (
          <div className="space-y-3">
            {verbatimList.map((v, i) => (
              <div
                key={i}
                className={cn('rounded-xl p-3 text-xs leading-relaxed', 'bg-muted/30 text-muted-foreground')}
              >
                <p className="italic">&laquo; {v.quote} &raquo;</p>
                <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                  &mdash; {v.speaker} &middot; {v.timestamp}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text={t('verbatimsEmpty')} />
        )}
      </PanelCard>

      {/* Actions identifiées */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="size-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">{t('actionsIdentified')}</h3>
        </div>
        {actionList.length > 0 ? (
          <div className="space-y-2.5">
            {actionList.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-1 size-3.5 rounded border border-border flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground leading-relaxed">{a.action}</span>
                  {(a.assignee || a.deadline) && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {a.assignee && <span>{a.assignee}</span>}
                      {a.assignee && a.deadline && <span> &middot; </span>}
                      {a.deadline && <span>{a.deadline}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text={t('actionsEmpty')} />
        )}
      </PanelCard>
    </div>
  )
}
