"use client"

import { cn } from "@/lib/utils"
import { BarChart3, History, Palette } from "lucide-react"
import { useTranslations } from "next-intl"

interface BrandDNAInfo {
  name?: string
  colors?: string[]
  platforms?: string[]
  tone?: string
  alignmentScore?: number
}

interface HistoryItem {
  title: string
  platform: string
  time: string
}

interface WorkflowSidebarProps {
  brandDNA?: BrandDNAInfo
  history?: HistoryItem[]
  className?: string
}

export function WorkflowSidebar({
  brandDNA,
  history,
  className,
}: WorkflowSidebarProps) {
  const t = useTranslations("workflow.sidebar")

  const DEFAULT_BRAND_DNA: BrandDNAInfo = {
    name: t("defaultBrand"),
    colors: ["#001D4A", "#D4AF37", "#F8FAFC"],
    platforms: ["LinkedIn", "X"],
    tone: t("defaultTone"),
    alignmentScore: 0.87,
  }

  const DEFAULT_HISTORY: HistoryItem[] = [
    { title: "Annonce levee de fonds Serie A", platform: "LinkedIn", time: "Il y a 2h" },
    { title: "Guide : 5 conseils SEO 2024", platform: "Blog post", time: "Hier" },
    { title: "Recap evenement Networking", platform: "Twitter Thread", time: "24 Oct" },
  ]

  const dna = brandDNA ?? DEFAULT_BRAND_DNA
  const hist = history ?? DEFAULT_HISTORY
  const score = dna.alignmentScore ?? 0.87

  return (
    <div className={cn("space-y-6", className)}>
      {/* Brand DNA Active Card */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="size-4 text-violet-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("activeBrandDna")}</h3>
        </div>

        <div className="space-y-6">
          {/* Palette Couleurs */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3 font-bold">
              {t("colorPalette")}
            </p>
            <div className="flex gap-2">
              {(dna.colors ?? []).map((color) => (
                <div
                  key={color}
                  className="size-8 rounded-lg shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <div className="size-8 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center">
                <Palette className="size-3.5 text-slate-400 dark:text-slate-600" />
              </div>
            </div>
          </div>

          {/* Plateformes & Ton */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3 font-bold">
              {t("platformsAndTone")}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {(dna.platforms ?? []).map((p) => (
                  <div
                    key={p}
                    className="size-6 bg-slate-100 dark:bg-white/[0.05] rounded flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400"
                  >
                    {p[0]}
                  </div>
                ))}
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {dna.tone ?? t("defaultTone")}
              </p>
            </div>
          </div>

          {/* Score d'alignement */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("alignmentScore")}</p>
              <p className="text-sm font-bold text-violet-500">{score.toFixed(2)}</p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${score * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Historique Card */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <History className="size-3.5 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("history")}</h3>
        </div>
        <div className="space-y-1">
          {hist.map((item) => (
            <div
              key={item.title}
              className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-white/10"
            >
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-slate-400 uppercase">{item.platform}</span>
                <span className="text-[10px] text-slate-400">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-2 text-xs font-medium text-violet-500 hover:underline" type="button">
          {t("viewAllHistory")}
        </button>
      </div>
    </div>
  )
}
