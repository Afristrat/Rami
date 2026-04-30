"use client"

import { useTranslations } from "next-intl"
import { Sparkles, Clock, Palette, LayoutGrid } from "lucide-react"

interface Recommendation {
  icon: React.ReactNode
  iconBg: string
  accentIcon: React.ReactNode
  accentColor: string
  title: string
  action: React.ReactNode
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    icon: <Clock className="size-5" />,
    iconBg: "bg-primary/20 text-primary",
    accentIcon: <Sparkles className="size-8" />,
    accentColor: "text-primary",
    title: "Vos posts LinkedIn ont 40% plus d\u2019engagement le mardi matin",
    action: (
      <button className="w-full rounded-lg bg-primary py-2.5 text-xs font-bold text-white transition-colors hover:bg-primary/90">
        Planifier pour mardi
      </button>
    ),
  },
  {
    icon: <Palette className="size-5" />,
    iconBg: "bg-blue-500/20 text-blue-400",
    accentIcon: <Palette className="size-8" />,
    accentColor: "text-blue-400",
    title: "Les visuels avec palette bleue ont un score DNA 15% sup\u00e9rieur",
    action: (
      <a
        href="#"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
      >
        Voir la palette <span className="text-xs">&rarr;</span>
      </a>
    ),
  },
  {
    icon: <LayoutGrid className="size-5" />,
    iconBg: "bg-emerald-500/20 text-emerald-400",
    accentIcon: <LayoutGrid className="size-8" />,
    accentColor: "text-emerald-400",
    title: "Le format carrousel g\u00e9n\u00e8re 2.3x plus de partages sur Instagram",
    action: (
      <button className="w-full rounded-lg border border-emerald-500/50 py-2.5 text-xs font-bold text-emerald-400 transition-colors hover:bg-emerald-500/10">
        Cr\u00e9er un carrousel
      </button>
    ),
  },
]

function RecommendationCard({ icon, iconBg, accentIcon, accentColor, title, action }: Recommendation) {
  return (
    <div className="rounded-xl glass-card p-6 relative group overflow-hidden transition-all hover:border-gray-300 dark:hover:border-white/20">
      {/* Background accent icon */}
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity ${accentColor}`}>
        {accentIcon}
      </div>

      <div className="flex items-start gap-4 mb-6">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div className="pr-8">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {title}
          </p>
        </div>
      </div>
      {action}
    </div>
  )
}

export function AiRecommendations() {
  const t = useTranslations("analytics")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">{t("aiRecommendations")}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {RECOMMENDATIONS.map((rec, i) => (
          <RecommendationCard key={i} {...rec} />
        ))}
      </div>
    </div>
  )
}
