"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Droplets, Loader2, Printer, RefreshCw, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { generateColorTrendReportAction } from "@/lib/actions/color-trends.actions"
import type { ColorTrendReport, ColorStance } from "@/lib/services/reports/color-trends"

interface ColorTrendsClientProps {
  initial: { report: ColorTrendReport; generatedAt: string } | null
}

const STANCE_STYLES: Record<ColorStance, string> = {
  recommended: "border-emerald-500/30 bg-emerald-500/[0.06]",
  neutral: "border-border bg-muted/20",
  avoid: "border-red-500/30 bg-red-500/[0.06]",
}

export function ColorTrendsClient({ initial }: ColorTrendsClientProps) {
  const t = useTranslations("colorTrends")
  const [data, setData] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, startGenerate] = useTransition()

  const handleGenerate = () => {
    setError(null)
    startGenerate(async () => {
      const result = await generateColorTrendReportAction()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    })
  }

  const report = data?.report ?? null

  return (
    <div className="space-y-6">
      {/* Style impression : n'imprimer que le rapport (PDF propre, sans sidebar). */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #color-report, #color-report * { visibility: visible !important; }
        #color-report { position: absolute; left: 0; top: 0; width: 100%; padding: 0; }
        .no-print { display: none !important; }
      }`}</style>

      {/* En-tête + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
            <Droplets className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground dark:text-white">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold glass-card text-foreground dark:text-white hover:bg-muted/50 transition-colors"
            >
              <Printer className="size-4" />
              {t("exportPdf")}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-opacity",
              "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                {report ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}
                {report ? t("regenerate") : t("generate")}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.06] p-4 text-sm text-red-400 no-print">
          {error}
        </div>
      )}

      {/* Cadence trimestrielle */}
      <p className="text-xs text-muted-foreground no-print">{t("cadenceNote")}</p>

      {!report ? (
        <div className="glass-card rounded-2xl p-10 text-center no-print">
          <Droplets className="mx-auto size-8 text-muted-foreground/50" />
          <h2 className="mt-3 font-semibold text-foreground dark:text-white">{t("emptyTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
        </div>
      ) : (
        <div id="color-report" className="space-y-6">
          {/* Méta du rapport */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span>
                <span className="text-muted-foreground">{t("sector")} : </span>
                <span className="font-semibold text-foreground dark:text-white">{report.sector}</span>
              </span>
              <span>
                <span className="text-muted-foreground">{t("culture")} : </span>
                <span className="font-semibold text-foreground dark:text-white">{report.culture}</span>
              </span>
              <span>
                <span className="text-muted-foreground">{t("period")} : </span>
                <span className="font-semibold text-foreground dark:text-white">{report.period}</span>
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  report.dataAvailability === "collective"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400"
                )}
              >
                {report.dataAvailability === "collective" ? t("dataCollective") : t("dataAuthorityOnly")}
              </span>
            </div>
            {data?.generatedAt && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                {t("generatedAt")} : {new Date(data.generatedAt).toLocaleString("fr-FR")}
              </p>
            )}
          </div>

          {/* Synthèse exécutive */}
          {report.narrative && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("narrativeTitle")}
              </h2>
              <p className="text-sm leading-relaxed text-foreground dark:text-white/90">
                {report.narrative}
              </p>
            </div>
          )}

          {/* Cartes couleurs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {report.colors.map((c) => (
              <div key={c.id} className={cn("rounded-2xl border p-4", STANCE_STYLES[c.stance])}>
                <div className="flex items-center gap-3">
                  <span
                    className="size-9 shrink-0 rounded-lg border border-border"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground dark:text-white">{c.name}</span>
                      <span className="text-[11px] text-muted-foreground">{c.hex}</span>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        c.stance === "recommended"
                          ? "text-emerald-400"
                          : c.stance === "avoid"
                            ? "text-red-400"
                            : "text-muted-foreground"
                      )}
                    >
                      {t(`stance.${c.stance}`)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.emotions.map((e) => (
                    <span
                      key={e}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {e}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-foreground/80 dark:text-white/70">
                  <span className="font-semibold">{t("culturalNote")} : </span>
                  {c.culturalNote}
                </p>
                <p className="mt-1 text-[11px] italic text-muted-foreground">« {c.causseQuote} »</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {t("networks")} : {c.networks.join(", ")}
                </p>
              </div>
            ))}
          </div>

          {/* Benchmarks plateformes */}
          {report.platformBenchmarks.length > 0 ? (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("benchmarks")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-4 font-medium">{t("platform")}</th>
                      <th className="pb-2 pr-4 font-medium">{t("metric")}</th>
                      <th className="pb-2 pr-4 font-medium">{t("value")}</th>
                      <th className="pb-2 font-medium">{t("sampleSize")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.platformBenchmarks.map((b, i) => (
                      <tr key={`${b.platform}-${b.metric}-${i}`} className="border-t border-border">
                        <td className="py-2 pr-4 capitalize text-foreground dark:text-white">{b.platform}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{b.metric}</td>
                        <td className="py-2 pr-4 font-semibold text-foreground dark:text-white">
                          {b.value.toFixed(2)}
                        </td>
                        <td className="py-2 text-muted-foreground">{b.sampleSize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("noBenchmarks")}</p>
          )}

          {/* Source */}
          <p className="text-[11px] text-muted-foreground">{t("sourceCausse")}</p>
        </div>
      )}
    </div>
  )
}
