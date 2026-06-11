// ============================================================
// Rapport client PDF — logique PURE (US-026)
// ============================================================
// Assemble le contenu d'un rapport de performance client à partir des
// analytics RÉELLES (post_metrics via assembleAnalytics — US-012).
// DÉFCON 1 : tous les chiffres viennent de la DB ; le LLM ne fait que
// COMMENTER ces chiffres (narrative) et n'a pas le droit d'en inventer.
// Aucune I/O ici → testable sans DB ni réseau.

import { z } from "zod"
import { ReportPeriodValues } from "@/lib/schemas/document.schema"
import type { AnalyticsData, LatestMetric } from "@/lib/services/analytics/aggregate"

// ── Schéma du contenu du rapport ───────────────────────────

export type ReportPeriod = (typeof ReportPeriodValues)[number]

const ReportKpisSchema = z.object({
  publishedCount: z.number(),
  impressions: z.number(),
  impressionsDelta: z.number(),
  interactions: z.number(),
  interactionsDelta: z.number(),
  engagementRate: z.number(),
  engagementDelta: z.number(),
  clicks: z.number(),
  clicksDelta: z.number(),
  likes: z.number(),
})

const ReportPlatformRowSchema = z.object({
  platform: z.string(),
  impressions: z.number(),
  interactions: z.number(),
  engagementRate: z.number(),
})

const ReportTopPostSchema = z.object({
  title: z.string(),
  platforms: z.array(z.string()),
  impressions: z.number(),
  interactions: z.number(),
  engagementRate: z.number(),
  clicks: z.number(),
})

export const ClientReportContentSchema = z.object({
  period: z.enum(ReportPeriodValues),
  period_start: z.string(),
  period_end: z.string(),
  brand_name: z.string().default(""),
  kpis: ReportKpisSchema,
  platforms: z.array(ReportPlatformRowSchema),
  top_posts: z.array(ReportTopPostSchema),
  /** Commentaire LLM sur les chiffres réels — "" si LLM indisponible (honnête). */
  narrative: z.string().default(""),
})

export type ClientReportContent = z.infer<typeof ClientReportContentSchema>

// ── Assemblage pur ─────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export interface BuildClientReportInput {
  period: ReportPeriod
  start: Date
  end: Date
  brandName: string | null
  analytics: AnalyticsData
  /** Derniers snapshots (post × plateforme) de la période — pour la ventilation par plateforme. */
  currentMetrics: LatestMetric[]
}

/**
 * Construit le contenu du rapport (sans narrative) à partir des analytics
 * réelles. Aucune donnée fabriquée : période sans publication → tout à 0.
 */
export function buildClientReportContent(input: BuildClientReportInput): ClientReportContent {
  const { period, start, end, brandName, analytics, currentMetrics } = input

  // Ventilation par plateforme (sommes réelles des snapshots).
  const byPlatform = new Map<string, { impressions: number; interactions: number }>()
  for (const m of currentMetrics) {
    const agg = byPlatform.get(m.platform) ?? { impressions: 0, interactions: 0 }
    agg.impressions += m.impressions
    agg.interactions += m.interactions
    byPlatform.set(m.platform, agg)
  }
  const platforms = Array.from(byPlatform.entries())
    .map(([platform, agg]) => ({
      platform,
      impressions: agg.impressions,
      interactions: agg.interactions,
      engagementRate: agg.impressions > 0 ? round1((agg.interactions / agg.impressions) * 100) : 0,
    }))
    .sort((a, b) => b.interactions - a.interactions)

  const top_posts = analytics.topPosts.map((p) => ({
    // Titre du post, sinon extrait du contenu (jamais de texte fabriqué).
    title: (p.title ?? p.content).slice(0, 120),
    platforms: p.platforms as string[],
    impressions: p.reach,
    interactions: p.interactions,
    engagementRate: p.engagementRate,
    clicks: p.clicks,
  }))

  const k = analytics.kpis
  return {
    period,
    period_start: toDateStr(start),
    period_end: toDateStr(end),
    brand_name: brandName ?? "",
    kpis: {
      publishedCount: k.publishedCount,
      impressions: k.impressions,
      impressionsDelta: k.impressionsDelta,
      interactions: k.interactions,
      interactionsDelta: k.interactionsDelta,
      engagementRate: k.engagementRate,
      engagementDelta: k.engagementDelta,
      clicks: k.clicks,
      clicksDelta: k.clicksDelta,
      likes: k.likes,
    },
    platforms,
    top_posts,
    narrative: "",
  }
}

// ── Prompts narrative (commentaire des chiffres réels) ─────

export function buildReportNarrativeSystemPrompt(): string {
  return [
    "Tu es un consultant social media senior pour les marchés africains et MENA.",
    "Tu rédiges la synthèse exécutive d'un rapport de performance client en français irréprochable.",
    "RÈGLE ABSOLUE : tu commentes UNIQUEMENT les chiffres fournis — tu n'inventes JAMAIS de chiffre, de pourcentage ni de comparaison non fournie.",
    "Si les chiffres sont à zéro, dis honnêtement qu'aucune publication n'a été mesurée sur la période.",
    "Réponds UNIQUEMENT par le texte de la synthèse (3-5 phrases), sans titre ni markdown.",
  ].join(" ")
}

export function buildReportNarrativeUserPrompt(content: ClientReportContent): string {
  const k = content.kpis
  const lines: string[] = []
  if (content.brand_name) lines.push(`Marque : ${content.brand_name}.`)
  lines.push(`Période : du ${content.period_start} au ${content.period_end}.`)
  lines.push(
    `Chiffres réels : ${k.publishedCount} publications, ${k.impressions} impressions (delta ${k.impressionsDelta}%), ` +
      `${k.interactions} interactions (delta ${k.interactionsDelta}%), taux d'engagement ${k.engagementRate}% ` +
      `(delta ${k.engagementDelta} pts), ${k.clicks} clics (delta ${k.clicksDelta}%), ${k.likes} mentions J'aime.`
  )
  if (content.platforms.length > 0) {
    lines.push(
      "Par plateforme : " +
        content.platforms
          .map((p) => `${p.platform} ${p.impressions} impressions / ${p.interactions} interactions (${p.engagementRate}%)`)
          .join(" ; ") +
        "."
    )
  }
  lines.push("Rédige la synthèse exécutive de ce rapport en te limitant strictement à ces chiffres.")
  return lines.join("\n")
}
