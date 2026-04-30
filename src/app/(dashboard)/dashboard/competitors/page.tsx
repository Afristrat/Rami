"use client"

import { useTranslations } from "next-intl"
import {
  TrendingUp,
  Plus,
  Lightbulb,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Image,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Mock data ────────────────────────────────────────────────── */

interface Competitor {
  id: string
  name: string
  handle: string
  avatar: string
  followers: string
  posts: string
  engagement: string
  color: string
}

const COMPETITORS: Competitor[] = [
  { id: "1", name: "CompetitorAlpha", handle: "@CompetitorAlpha", avatar: "CA", followers: "12.4K", posts: "4.2", engagement: "3.7%", color: "bg-violet-500" },
  { id: "2", name: "CompetitorBox", handle: "@CompetitorBox", avatar: "CB", followers: "8.9K", posts: "2.5", engagement: "2.8%", color: "bg-blue-500" },
  { id: "3", name: "CompetitorGamma", handle: "@CompetitorGamma", avatar: "CG", followers: "15.2K", posts: "5.0", engagement: "4.7%", color: "bg-emerald-500" },
]

interface TopContent {
  id: string
  title: string
  platform: string
  engagement: string
  type: string
  color: string
}

const TOP_CONTENT: TopContent[] = [
  { id: "1", title: "Comment nous avons double notre reach en 30 jours", platform: "LinkedIn", engagement: "12.4K", type: "Carrousel", color: "bg-gradient-to-br from-amber-500/20 to-orange-500/20" },
  { id: "2", title: "Les 5 erreurs marketing a eviter en 2026", platform: "Instagram", engagement: "8.2K", type: "Reel", color: "bg-gradient-to-br from-violet-500/20 to-blue-500/20" },
  { id: "3", title: "Notre stack marketing — outils et process", platform: "YouTube", engagement: "5.7K", type: "Video", color: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20" },
  { id: "4", title: "Behind the scenes — journee type agence", platform: "TikTok", engagement: "15.1K", type: "Short", color: "bg-gradient-to-br from-pink-500/20 to-red-500/20" },
]

interface GapItem {
  label: string
  status: "advantage" | "disadvantage" | "neutral"
  description: string
}

const GAP_ANALYSIS: GapItem[] = [
  { label: "Analyse IA Temps Reel", status: "advantage", description: "RAMI offre une analyse en temps reel que les concurrents n'ont pas." },
  { label: "Automatisation Publication", status: "neutral", description: "Fonctionnalite similaire chez tous les acteurs." },
  { label: "Marque Blanche (White Label)", status: "disadvantage", description: "CompetitorAlpha propose du white-label, RAMI bientot." },
  { label: "Transcriptions Multilingues", status: "advantage", description: "Support FR/AR/EN unique dans le marche MENA." },
]

const FREQ_DATA = [
  { label: "Lun", you: 4, comp: 2 },
  { label: "Mar", you: 3, comp: 3 },
  { label: "Mer", you: 5, comp: 1 },
  { label: "Jeu", you: 2, comp: 4 },
  { label: "Ven", you: 6, comp: 3 },
  { label: "Sam", you: 1, comp: 2 },
  { label: "Dim", you: 0, comp: 1 },
]

const ENGAGEMENT_TREND = [
  { label: "Jan", you: 3.2, comp: 2.8 },
  { label: "Fev", you: 3.5, comp: 3.1 },
  { label: "Mar", you: 4.1, comp: 2.9 },
  { label: "Avr", you: 3.8, comp: 3.4 },
  { label: "Mai", you: 4.7, comp: 3.2 },
  { label: "Jun", you: 5.2, comp: 3.5 },
]

/* ── Page ──────────────────────────────────────────────────────── */

export default function CompetitorAnalysisPage() {
  const t = useTranslations("competitors")

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{t("breadcrumb")}</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
            {t("titleShort")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitleFull")}
          </p>
        </div>
        <button
          className={cn(
            "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
            "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
          )}
        >
          <Plus className="size-4" />
          {t("addCompetitor")}
        </button>
      </div>

      {/* Competitor profiles */}
      <div className="flex items-center gap-6 flex-wrap">
        {COMPETITORS.map((c) => (
          <div key={c.id} className="flex items-center gap-3">
            <div className={cn("flex size-10 items-center justify-center rounded-full text-xs font-bold text-white", c.color)}>
              {c.avatar}
            </div>
            <span className="text-sm text-muted-foreground">{c.handle}</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
        {COMPETITORS.map((c, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl p-4 text-center",
              "bg-white border border-gray-200/60 shadow-sm",
              "dark:bg-white/[0.04] dark:border-white/[0.08]"
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">{c.name}</p>
            <p className="text-lg font-bold text-foreground dark:text-white">{c.followers}</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground">{c.posts} {t("postsPerWeek")}</span>
              <span className="text-[10px] text-emerald-400">{c.engagement} {t("engShort")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Publication frequency chart */}
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <h3 className="text-sm font-semibold text-foreground dark:text-white mb-4">{t("publicationFrequency")}</h3>
          <div className="flex items-end gap-2 h-40">
            {FREQ_DATA.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-end gap-0.5 h-32 w-full">
                  <div
                    className="flex-1 rounded-t bg-violet-500/80 transition-all"
                    style={{ height: `${(d.you / 6) * 100}%` }}
                  />
                  <div
                    className="flex-1 rounded-t bg-blue-400/50 transition-all"
                    style={{ height: `${(d.comp / 6) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-violet-500" />
              <span className="text-[10px] text-muted-foreground">{t("you")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-blue-400" />
              <span className="text-[10px] text-muted-foreground">{t("competitorsAverage")}</span>
            </div>
          </div>
        </div>

        {/* Engagement trend chart */}
        <div
          className={cn(
            "rounded-2xl p-5",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <h3 className="text-sm font-semibold text-foreground dark:text-white mb-4">{t("engagementTrend")}</h3>
          <div className="flex items-end gap-3 h-40">
            {ENGAGEMENT_TREND.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative flex items-end h-32 w-full justify-center gap-0.5">
                  <div
                    className="flex-1 rounded-t bg-violet-500/80 transition-all"
                    style={{ height: `${(d.you / 6) * 100}%` }}
                  />
                  <div
                    className="flex-1 rounded-t bg-blue-400/50 transition-all"
                    style={{ height: `${(d.comp / 6) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-violet-500" />
              <span className="text-[10px] text-muted-foreground">{t("you")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-blue-400" />
              <span className="text-[10px] text-muted-foreground">{t("competitorsAverage")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top content concurrent */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-4 text-violet-400" />
          <h2 className="text-lg font-semibold text-foreground dark:text-white">{t("topCompetitorContent")}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOP_CONTENT.map((content) => (
            <div
              key={content.id}
              className={cn(
                "group rounded-2xl overflow-hidden transition-all cursor-pointer",
                "bg-white border border-gray-200/60 shadow-sm hover:shadow-md hover:border-violet-300/30",
                "dark:bg-white/[0.04] dark:border-white/[0.08] dark:hover:border-violet-500/20"
              )}
            >
              <div className={cn("h-32 flex items-center justify-center", content.color)}>
                <Image className="size-8 text-white/30" />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-foreground dark:text-white line-clamp-2 leading-relaxed">{content.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">{content.platform} · {content.type}</span>
                  <span className="text-[10px] font-bold text-violet-400">{content.engagement}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap Analysis & Strategy */}
      <div
        className={cn(
          "rounded-2xl p-5",
          "bg-white border border-gray-200/60 shadow-sm",
          "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
        )}
      >
        <h3 className="text-sm font-semibold text-foreground dark:text-white mb-4">
          {t("gapAnalysis")}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GAP_ANALYSIS.map((gap) => (
            <div
              key={gap.label}
              className={cn(
                "flex items-start gap-3 rounded-xl p-4",
                "bg-gray-50 border border-gray-200/60",
                "dark:bg-white/[0.03] dark:border-white/[0.06]"
              )}
            >
              <div className="mt-0.5">
                {gap.status === "advantage" ? (
                  <CheckCircle2 className="size-4 text-emerald-400" />
                ) : gap.status === "disadvantage" ? (
                  <XCircle className="size-4 text-red-400" />
                ) : (
                  <AlertTriangle className="size-4 text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground dark:text-white">{gap.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{gap.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Recommendation */}
        <div
          className={cn(
            "mt-4 rounded-xl p-4",
            "bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20",
            "dark:from-violet-500/5 dark:to-blue-500/5 dark:border-violet-500/10"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="size-4 text-amber-400" />
            <span className="text-xs font-semibold text-foreground dark:text-white">{t("recommendedActions")}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("recommendationsText")}
          </p>
        </div>
      </div>
    </div>
  )
}
