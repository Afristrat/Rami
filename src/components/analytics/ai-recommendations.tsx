"use client"

import { useTranslations } from "next-intl"
import { Sparkles, Clock, Palette, LayoutGrid, Share2, Brain } from "lucide-react"
import type { AiRecommendation, AiRecommendationType } from "@/lib/services/analytics/recommendations"

interface AiRecommendationsProps {
  recommendations: AiRecommendation[]
}

const TYPE_STYLE: Record<
  AiRecommendationType,
  { icon: React.ReactNode; iconBg: string; accentColor: string }
> = {
  best_hour: { icon: <Clock className="size-5" />, iconBg: "bg-primary/20 text-primary", accentColor: "text-primary" },
  best_color: { icon: <Palette className="size-5" />, iconBg: "bg-blue-500/20 text-blue-400", accentColor: "text-blue-400" },
  best_format: { icon: <LayoutGrid className="size-5" />, iconBg: "bg-emerald-500/20 text-emerald-400", accentColor: "text-emerald-400" },
  best_platform: { icon: <Share2 className="size-5" />, iconBg: "bg-violet-500/20 text-violet-400", accentColor: "text-violet-400" },
  best_objective: { icon: <Brain className="size-5" />, iconBg: "bg-amber-500/20 text-amber-400", accentColor: "text-amber-400" },
}

const TYPE_TO_KEY: Record<AiRecommendationType, string> = {
  best_hour: "recoBestHour",
  best_color: "recoBestColor",
  best_format: "recoBestFormat",
  best_platform: "recoBestPlatform",
  best_objective: "recoBestObjective",
}

export function AiRecommendations({ recommendations }: AiRecommendationsProps) {
  const t = useTranslations("analytics")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">{t("aiRecommendations")}</h3>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-xl glass-card p-6 text-center">
          <Brain className="mx-auto size-7 text-muted-foreground/40" />
          <p className="mt-2 text-sm font-semibold text-foreground">{t("recoEmptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("recoEmptyDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recommendations.map((rec, i) => {
            const style = TYPE_STYLE[rec.type]
            return (
              <div
                key={`${rec.type}-${i}`}
                className="rounded-xl glass-card p-6 relative group overflow-hidden transition-all hover:border-gray-300 dark:hover:border-white/20"
              >
                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity ${style.accentColor}`}>
                  {style.icon}
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
                    {style.icon}
                  </div>
                  <div className="pr-8">
                    <p className="text-sm font-semibold text-foreground leading-snug">
                      {t(TYPE_TO_KEY[rec.type], { value: rec.value, pct: rec.engagementPct })}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t("recoSampleSize", { count: rec.sampleSize })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
