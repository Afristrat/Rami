"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"
import { ArrowLeft, BarChart3, Download, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentStatusBadge } from "./DocumentStatusBadge"
import type { ClientReportContent } from "@/lib/services/documents/client-report"
import type { DocumentType, DocumentStatus } from "@/lib/schemas/document.schema"

interface ClientReportViewProps {
  document: {
    id: string
    title: string
    type: DocumentType
    client_name: string | null
    status: DocumentStatus
    created_at: string
  }
  content: ClientReportContent
}

function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(n)
}

function DeltaBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value === 0) return null
  const positive = value > 0
  const Icon = positive ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
        positive ? "text-emerald-400" : "text-red-400"
      )}
    >
      <Icon className="size-3" />
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  )
}

export function ClientReportView({ document, content }: ClientReportViewProps) {
  const t = useTranslations("documents")
  const intlLocale = useIntlLocale()

  const k = content.kpis
  const hasData = k.publishedCount > 0 || k.impressions > 0

  const kpiCards: Array<{ label: string; value: string; delta?: number; suffix?: string }> = [
    { label: t("kpiPublished"), value: formatNumber(k.publishedCount, intlLocale) },
    { label: t("kpiImpressions"), value: formatNumber(k.impressions, intlLocale), delta: k.impressionsDelta },
    { label: t("kpiInteractions"), value: formatNumber(k.interactions, intlLocale), delta: k.interactionsDelta },
    { label: t("kpiEngagementRate"), value: `${k.engagementRate}%`, delta: k.engagementDelta, suffix: " pts" },
    { label: t("kpiClicks"), value: formatNumber(k.clicks, intlLocale), delta: k.clicksDelta },
    { label: t("kpiLikes"), value: formatNumber(k.likes, intlLocale) },
  ]

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t("backToDocuments")}
        </Link>
        <a
          href={`/dashboard/documents/${document.id}/pdf`}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
        >
          <Download className="size-4" />
          {t("downloadPdf")}
        </a>
      </div>

      <div className="space-y-6">
        {/* En-tête brandé */}
        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {t("typeReport")}
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground dark:text-white">
                {document.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                {content.brand_name && (
                  <span>
                    {t("reportBrandLabel")} :{" "}
                    <span className="font-semibold text-foreground dark:text-white">
                      {content.brand_name}
                    </span>
                  </span>
                )}
                {document.client_name && (
                  <span>
                    {t("reportClientLabel")} :{" "}
                    <span className="font-semibold text-foreground dark:text-white">
                      {document.client_name}
                    </span>
                  </span>
                )}
                <span>
                  {t("reportPeriodLabel")} :{" "}
                  <span className="font-semibold text-foreground dark:text-white">
                    {t("reportPeriodRange", { start: content.period_start, end: content.period_end })}
                  </span>
                </span>
              </div>
            </div>
            <DocumentStatusBadge status={document.status} />
          </div>
        </div>

        {/* Synthèse exécutive (commentaire LLM des chiffres réels) */}
        {content.narrative && (
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("offerSummaryTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-foreground dark:text-white/90">
              {content.narrative}
            </p>
          </section>
        )}

        {/* État honnête si aucune donnée mesurée */}
        {!hasData && (
          <section className="glass-card rounded-2xl p-10 text-center">
            <BarChart3 className="mx-auto size-8 text-muted-foreground/50" />
            <h2 className="mt-3 font-semibold text-foreground dark:text-white">
              {t("reportEmptyTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("reportEmptyDesc")}</p>
          </section>
        )}

        {/* Indicateurs clés */}
        <section className="glass-card rounded-2xl p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {t("reportKpisTitle")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {kpiCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-xl font-bold text-foreground dark:text-white">{card.value}</p>
                {card.delta !== undefined && <DeltaBadge value={card.delta} suffix={card.suffix} />}
              </div>
            ))}
          </div>
        </section>

        {/* Performance par plateforme */}
        {content.platforms.length > 0 && (
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("reportPlatformsTitle")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t("colPlatform")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("kpiImpressions")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("kpiInteractions")}</th>
                    <th className="pb-2 font-medium">{t("kpiEngagementRate")}</th>
                  </tr>
                </thead>
                <tbody>
                  {content.platforms.map((p) => (
                    <tr key={p.platform} className="border-t border-border">
                      <td className="py-2 pr-4 capitalize font-semibold text-foreground dark:text-white">
                        {p.platform}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatNumber(p.impressions, intlLocale)}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatNumber(p.interactions, intlLocale)}
                      </td>
                      <td className="py-2 font-semibold text-foreground dark:text-white">
                        {p.engagementRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Meilleures publications */}
        {content.top_posts.length > 0 && (
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("reportTopPostsTitle")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">{t("colPost")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("kpiImpressions")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("kpiInteractions")}</th>
                    <th className="pb-2 pr-4 font-medium">{t("kpiEngagementRate")}</th>
                    <th className="pb-2 font-medium">{t("kpiClicks")}</th>
                  </tr>
                </thead>
                <tbody>
                  {content.top_posts.map((p, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-2 pr-4 max-w-md">
                        <span className="font-medium text-foreground dark:text-white line-clamp-1">
                          {p.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground capitalize">
                          {p.platforms.join(", ")}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatNumber(p.impressions, intlLocale)}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatNumber(p.interactions, intlLocale)}
                      </td>
                      <td className="py-2 pr-4 font-semibold text-foreground dark:text-white">
                        {p.engagementRate}%
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {formatNumber(p.clicks, intlLocale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
