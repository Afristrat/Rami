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

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY =
  "R\u00e9union ax\u00e9e sur la validation des axes strat\u00e9giques du Q3. Objectif de croissance organique via les r\u00e9seaux sociaux, accent sur la sous-performance des campagnes d\u2019influence. Pivot strat\u00e9gique vers des contenus plus authentiques (\"BTS\")."

const MOCK_VERBATIMS: Verbatim[] = [
  {
    quote: "L\u2019objectif est de doubler notre engagement organique sur les plateformes sociales.",
    speaker: 'Intervenant 1',
    timestamp: '00:14',
    importance: 'high',
  },
  {
    quote: "Nous devons pivoter notre marketing vers plus d\u2019authenticit\u00e9.",
    speaker: 'Intervenant 1',
    timestamp: '05:45',
    importance: 'high',
  },
  {
    quote: "La conversion n\u2019est pas encore au niveau attendu.",
    speaker: 'Intervenant 2',
    timestamp: '02:45',
    importance: 'medium',
  },
]

const MOCK_ACTIONS: AiAction[] = [
  { action: "Revoir les indicateurs de performance et ajuster la strat\u00e9gie", assignee: '\u00c9quipe Marketing' },
  { action: "Faire les estimations du planning \u00e9ditorial", assignee: 'Intervenant 2', deadline: 'Semaine prochaine' },
  { action: "D\u00e9cider du maintien du prestataire vid\u00e9o", assignee: 'Direction' },
]

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

// ── Component ────────────────────────────────────────────────────────────────

export default function AiSummaryPanel({ aiSummary, verbatims, aiActions }: AiSummaryPanelProps) {
  const t = useTranslations("transcriptions")
  const summary = aiSummary ?? MOCK_SUMMARY
  const verbatimList = verbatims && verbatims.length > 0 ? verbatims : MOCK_VERBATIMS
  const actionList = aiActions && aiActions.length > 0 ? aiActions : MOCK_ACTIONS

  return (
    <div className="space-y-4">
      {/* R\u00e9sum\u00e9 IA */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">{t("aiSummary")}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {summary}
        </p>
      </PanelCard>

      {/* Verbatims cl\u00e9s */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareQuote className="size-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-foreground">{t("verbatimsKey")}</h3>
        </div>
        <div className="space-y-3">
          {verbatimList.map((v, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl p-3 text-xs leading-relaxed',
                'bg-muted/30 text-muted-foreground'
              )}
            >
              <p className="italic">&laquo; {v.quote} &raquo;</p>
              <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                \u2014 {v.speaker} &middot; {v.timestamp}
              </p>
            </div>
          ))}
        </div>
      </PanelCard>

      {/* Actions identifi\u00e9es */}
      <PanelCard>
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="size-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-foreground">{t("actionsIdentified")}</h3>
        </div>
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
      </PanelCard>
    </div>
  )
}
