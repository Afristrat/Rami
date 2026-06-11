import {
  buildClientReportContent,
  buildReportNarrativeSystemPrompt,
  buildReportNarrativeUserPrompt,
  ClientReportContentSchema,
} from "@/lib/services/documents/client-report"
import type { AnalyticsData, LatestMetric } from "@/lib/services/analytics/aggregate"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const KPIS_VIDES = {
  publishedCount: 0, publishedDelta: 0,
  impressions: 0, impressionsDelta: 0,
  interactions: 0, interactionsDelta: 0,
  engagementRate: 0, engagementDelta: 0,
  clicks: 0, clicksDelta: 0,
  likes: 0, likesDelta: 0,
  topPlatform: null, topPlatformCount: 0,
} as AnalyticsData["kpis"]

const ANALYTICS_VIDE: AnalyticsData = {
  kpis: KPIS_VIDES,
  dailyEngagement: [],
  postsByStatus: [],
  topPosts: [],
}

const ANALYTICS_REELLES: AnalyticsData = {
  kpis: {
    ...KPIS_VIDES,
    publishedCount: 3,
    impressions: 18000,
    impressionsDelta: 25,
    interactions: 1248,
    interactionsDelta: -10,
    engagementRate: 6.9,
    engagementDelta: 1.2,
    clicks: 142,
    clicksDelta: 0,
    likes: 970,
  },
  dailyEngagement: [],
  postsByStatus: [],
  topPosts: [
    {
      id: "p1",
      title: "Étude Instagram",
      content: "Contenu de l'étude…",
      platforms: ["instagram"],
      publishedAt: "2026-06-01T10:00:00.000Z",
      reach: 8000,
      engagementRate: 9.4,
      clicks: 0,
      interactions: 752,
      platformResults: null,
    },
    {
      id: "p2",
      title: null,
      content: "Lancement LinkedIn de la nouvelle offre de financement participatif",
      platforms: ["linkedin"],
      publishedAt: "2026-06-02T10:00:00.000Z",
      reach: 8000,
      engagementRate: 5.4,
      clicks: 130,
      interactions: 432,
      platformResults: null,
    },
  ],
}

const METRICS: LatestMetric[] = [
  { post_id: "p1", platform: "instagram", impressions: 8000, interactions: 752, clicks: 0, likes: 600 },
  { post_id: "p2", platform: "linkedin", impressions: 8000, interactions: 432, clicks: 130, likes: 300 },
  { post_id: "p3", platform: "twitter", impressions: 2000, interactions: 64, clicks: 12, likes: 70 },
]

const INPUT_REEL = {
  period: "30d" as const,
  start: new Date("2026-05-12T00:00:00Z"),
  end: new Date("2026-06-11T00:00:00Z"),
  brandName: "Banque Test Ralph",
  analytics: ANALYTICS_REELLES,
  currentMetrics: METRICS,
}

// ─── buildClientReportContent ────────────────────────────────────────────────

describe("buildClientReportContent", () => {
  test("KPIs recopiés à l'identique depuis les analytics réelles", () => {
    const report = buildClientReportContent(INPUT_REEL)
    expect(report.kpis.publishedCount).toBe(3)
    expect(report.kpis.impressions).toBe(18000)
    expect(report.kpis.interactions).toBe(1248)
    expect(report.kpis.engagementRate).toBe(6.9)
    expect(report.kpis.clicks).toBe(142)
    expect(report.kpis.likes).toBe(970)
    expect(report.period_start).toBe("2026-05-12")
    expect(report.period_end).toBe("2026-06-11")
    expect(report.brand_name).toBe("Banque Test Ralph")
  })

  test("ventilation par plateforme : sommes réelles, taux calculé, tri par interactions", () => {
    const report = buildClientReportContent(INPUT_REEL)
    expect(report.platforms).toHaveLength(3)
    expect(report.platforms[0]).toEqual({
      platform: "instagram",
      impressions: 8000,
      interactions: 752,
      engagementRate: 9.4,
    })
    expect(report.platforms[1].platform).toBe("linkedin")
    expect(report.platforms[2]).toEqual({
      platform: "twitter",
      impressions: 2000,
      interactions: 64,
      engagementRate: 3.2,
    })
  })

  test("top posts : titre ou extrait du contenu, jamais de texte fabriqué", () => {
    const report = buildClientReportContent(INPUT_REEL)
    expect(report.top_posts[0].title).toBe("Étude Instagram")
    expect(report.top_posts[1].title).toContain("Lancement LinkedIn")
    expect(report.top_posts[1].impressions).toBe(8000)
  })

  test("période sans publication → tout à 0, aucune fabrication", () => {
    const report = buildClientReportContent({
      period: "7d",
      start: new Date("2026-06-04T00:00:00Z"),
      end: new Date("2026-06-11T00:00:00Z"),
      brandName: null,
      analytics: ANALYTICS_VIDE,
      currentMetrics: [],
    })
    expect(report.kpis.publishedCount).toBe(0)
    expect(report.kpis.impressions).toBe(0)
    expect(report.platforms).toEqual([])
    expect(report.top_posts).toEqual([])
    expect(report.brand_name).toBe("")
    expect(report.narrative).toBe("")
  })

  test("le contenu produit respecte son propre schéma Zod", () => {
    const report = buildClientReportContent(INPUT_REEL)
    expect(ClientReportContentSchema.safeParse(report).success).toBe(true)
  })

  test("plateforme à 0 impression → taux 0 (pas de division par zéro)", () => {
    const report = buildClientReportContent({
      ...INPUT_REEL,
      currentMetrics: [
        { post_id: "p9", platform: "twitter", impressions: 0, interactions: 5, clicks: 0, likes: 5 },
      ],
    })
    expect(report.platforms[0].engagementRate).toBe(0)
  })
})

// ─── Prompts narrative ───────────────────────────────────────────────────────

describe("buildReportNarrative prompts", () => {
  test("system prompt : interdiction d'inventer des chiffres", () => {
    const prompt = buildReportNarrativeSystemPrompt()
    expect(prompt).toContain("n'inventes JAMAIS de chiffre")
    expect(prompt).toContain("3-5 phrases")
  })

  test("user prompt : contient les chiffres réels et la consigne de s'y limiter", () => {
    const report = buildClientReportContent(INPUT_REEL)
    const prompt = buildReportNarrativeUserPrompt(report)
    expect(prompt).toContain("Banque Test Ralph")
    expect(prompt).toContain("18000 impressions")
    expect(prompt).toContain("taux d'engagement 6.9%")
    expect(prompt).toContain("instagram 8000 impressions")
    expect(prompt).toContain("en te limitant strictement à ces chiffres")
  })
})
