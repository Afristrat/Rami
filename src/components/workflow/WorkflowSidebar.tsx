"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { BarChart3, History, Palette, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type {
  WorkflowSidebarBrandDNA,
  WorkflowSidebarHistoryItem,
} from "@/lib/actions/visual.actions"

interface WorkflowSidebarProps {
  brandDNA: WorkflowSidebarBrandDNA | null
  history: WorkflowSidebarHistoryItem[]
  loading?: boolean
  className?: string
}

/** Capitalise un identifiant de plateforme pour l'affichage (linkedin → Linkedin). */
function platformLabel(id: string): string {
  if (!id) return ""
  return id.charAt(0).toUpperCase() + id.slice(1)
}

export function WorkflowSidebar({
  brandDNA,
  history,
  loading = false,
  className,
}: WorkflowSidebarProps) {
  const t = useTranslations("workflow.sidebar")
  const intlLocale = useIntlLocale()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Brand DNA Active Card */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="size-4 text-violet-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("activeBrandDna")}</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : !brandDNA ? (
          <div className="space-y-3 py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("noBrandDna")}</p>
            <Link
              href="/dashboard/brand-dna"
              className="inline-block text-xs font-semibold text-violet-500 hover:underline"
            >
              {t("configureBrandDna")}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Palette Couleurs */}
            {brandDNA.colors.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3 font-bold">
                  {t("colorPalette")}
                </p>
                <div className="flex gap-2">
                  {brandDNA.colors.map((color) => (
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
            )}

            {/* Plateformes & Ton */}
            {(brandDNA.platforms.length > 0 || brandDNA.tone) && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-500 mb-3 font-bold">
                  {t("platformsAndTone")}
                </p>
                <div className="flex items-center gap-4">
                  {brandDNA.platforms.length > 0 && (
                    <div className="flex gap-1">
                      {brandDNA.platforms.map((p) => (
                        <div
                          key={p}
                          className="size-6 bg-slate-100 dark:bg-white/[0.05] rounded flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase"
                          title={platformLabel(p)}
                        >
                          {p[0]}
                        </div>
                      ))}
                    </div>
                  )}
                  {brandDNA.platforms.length > 0 && brandDNA.tone && (
                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                  )}
                  {brandDNA.tone && (
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {brandDNA.tone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Score de cohérence culturelle RÉEL (palette × secteur) — affiché uniquement si calculable */}
            {brandDNA.culturalScore && (
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{t("alignmentScore")}</p>
                  <p className="text-sm font-bold text-violet-500">{brandDNA.culturalScore.score}/100</p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${brandDNA.culturalScore.score}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historique Card */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2 mb-4">
          <History className="size-3.5 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t("history")}</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-2 text-xs text-slate-500 dark:text-slate-400">{t("noHistory")}</p>
        ) : (
          <>
            <div className="space-y-1">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-transparent"
                >
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {item.title || "—"}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-slate-400 uppercase">
                      {platformLabel(item.platform)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString(intlLocale, {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/calendar"
              className="block w-full mt-4 py-2 text-center text-xs font-medium text-violet-500 hover:underline"
            >
              {t("viewAllHistory")}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
