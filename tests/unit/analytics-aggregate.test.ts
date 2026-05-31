import {
  assembleAnalytics,
  pctDelta,
  round1,
  sumMetrics,
  type AnalyticsPost,
  type LatestMetric,
} from "@/lib/services/analytics/aggregate"

// ─── Helpers purs ─────────────────────────────────────────────────────────────

describe("pctDelta", () => {
  test("variation relative classique", () => {
    expect(pctDelta(150, 100)).toBe(50)
    expect(pctDelta(50, 100)).toBe(-50)
  })
  test("base zéro → 100 si valeur, 0 sinon (pas de division par zéro)", () => {
    expect(pctDelta(10, 0)).toBe(100)
    expect(pctDelta(0, 0)).toBe(0)
  })
})

describe("sumMetrics", () => {
  test("somme les snapshots", () => {
    const m: LatestMetric[] = [
      { post_id: "p1", platform: "twitter", impressions: 100, interactions: 10, clicks: 5, likes: 6 },
      { post_id: "p2", platform: "linkedin", impressions: 200, interactions: 30, clicks: 7, likes: 20 },
    ]
    expect(sumMetrics(m)).toEqual({ impressions: 300, interactions: 40, clicks: 12, likes: 26 })
  })
  test("liste vide → tout à 0", () => {
    expect(sumMetrics([])).toEqual({ impressions: 0, interactions: 0, clicks: 0, likes: 0 })
  })
})

// ─── assembleAnalytics ────────────────────────────────────────────────────────

const FIXED_END = new Date("2026-05-31T12:00:00.000Z")

function post(id: string, opts: Partial<AnalyticsPost> = {}): AnalyticsPost {
  return {
    id,
    title: opts.title ?? `Post ${id}`,
    content: opts.content ?? `Contenu ${id}`,
    platforms: opts.platforms ?? ["twitter"],
    publishedAt: opts.publishedAt ?? FIXED_END,
    platformResults: opts.platformResults ?? null,
  }
}

describe("assembleAnalytics — KPIs réels", () => {
  test("KPIs calculés depuis les metrics réelles (aucune estimation)", () => {
    const currentPosts = [post("p1"), post("p2", { platforms: ["linkedin"] })]
    const currentMetrics: LatestMetric[] = [
      { post_id: "p1", platform: "twitter", impressions: 1000, interactions: 50, clicks: 12, likes: 30 },
      { post_id: "p2", platform: "linkedin", impressions: 1000, interactions: 150, clicks: 8, likes: 90 },
    ]

    const { kpis } = assembleAnalytics({
      period: "30d",
      end: FIXED_END,
      currentPosts,
      currentMetrics,
      prevPostCount: 0,
      prevMetrics: [],
      statusCounts: [],
    })

    expect(kpis.publishedCount).toBe(2)
    expect(kpis.impressions).toBe(2000)
    expect(kpis.interactions).toBe(200)
    expect(kpis.clicks).toBe(20)
    expect(kpis.likes).toBe(120)
    // taux = 200 / 2000 = 10 %
    expect(kpis.engagementRate).toBe(10)
  })

  test("aucune metric → tous les KPIs à 0 (zéro donnée inventée)", () => {
    const { kpis, topPosts } = assembleAnalytics({
      period: "7d",
      end: FIXED_END,
      currentPosts: [post("p1")],
      currentMetrics: [],
      prevPostCount: 0,
      prevMetrics: [],
      statusCounts: [],
    })
    expect(kpis.impressions).toBe(0)
    expect(kpis.interactions).toBe(0)
    expect(kpis.clicks).toBe(0)
    expect(kpis.likes).toBe(0)
    expect(kpis.engagementRate).toBe(0)
    // Le post reste listé mais avec des metrics réelles à 0 (pas de fabrication).
    expect(topPosts).toHaveLength(1)
    expect(topPosts[0]).toMatchObject({ reach: 0, interactions: 0, clicks: 0, engagementRate: 0 })
  })

  test("deltas calculés vs période précédente", () => {
    const { kpis } = assembleAnalytics({
      period: "30d",
      end: FIXED_END,
      currentPosts: [post("p1")],
      currentMetrics: [{ post_id: "p1", platform: "twitter", impressions: 200, interactions: 40, clicks: 10, likes: 20 }],
      prevPostCount: 1,
      prevMetrics: [{ post_id: "old", platform: "twitter", impressions: 100, interactions: 10, clicks: 5, likes: 5 }],
      statusCounts: [],
    })
    expect(kpis.impressionsDelta).toBe(100) // 200 vs 100
    expect(kpis.clicksDelta).toBe(100)      // 10 vs 5
    // taux courant 20 %, précédent 10 % → delta = 10 points
    expect(kpis.engagementDelta).toBe(10)
  })

  test("topPlatform = plateforme la plus publiée", () => {
    const { kpis } = assembleAnalytics({
      period: "30d",
      end: FIXED_END,
      currentPosts: [
        post("p1", { platforms: ["linkedin"] }),
        post("p2", { platforms: ["linkedin"] }),
        post("p3", { platforms: ["twitter"] }),
      ],
      currentMetrics: [],
      prevPostCount: 0,
      prevMetrics: [],
      statusCounts: [],
    })
    expect(kpis.topPlatform).toBe("linkedin")
    expect(kpis.topPlatformCount).toBe(2)
  })
})

describe("assembleAnalytics — topPosts & daily", () => {
  test("topPosts triés par interactions réelles décroissantes, max 5", () => {
    const posts = Array.from({ length: 7 }, (_, i) => post(`p${i}`))
    const metrics: LatestMetric[] = posts.map((p, i) => ({
      post_id: p.id,
      platform: "twitter",
      impressions: 1000,
      interactions: i * 10, // p6 le plus élevé
      clicks: i,
      likes: i,
    }))

    const { topPosts } = assembleAnalytics({
      period: "30d",
      end: FIXED_END,
      currentPosts: posts,
      currentMetrics: metrics,
      prevPostCount: 0,
      prevMetrics: [],
      statusCounts: [],
    })

    expect(topPosts).toHaveLength(5)
    expect(topPosts[0].id).toBe("p6")
    expect(topPosts[0].interactions).toBe(60)
    // décroissant
    const interactions = topPosts.map((p) => p.interactions)
    expect(interactions).toEqual([...interactions].sort((a, b) => b - a))
  })

  test("dailyEngagement : interactions réelles agrégées par jour/plateforme", () => {
    const { dailyEngagement } = assembleAnalytics({
      period: "7d",
      end: FIXED_END,
      currentPosts: [post("p1", { platforms: ["twitter"], publishedAt: FIXED_END })],
      currentMetrics: [{ post_id: "p1", platform: "twitter", impressions: 500, interactions: 42, clicks: 3, likes: 20 }],
      prevPostCount: 0,
      prevMetrics: [],
      statusCounts: [],
    })

    expect(dailyEngagement).toHaveLength(7)
    const today = dailyEngagement[dailyEngagement.length - 1]
    expect(today.date).toBe("2026-05-31")
    expect(today.twitter).toBe(42)
    // Jour sans post → 0 (réel, pas simulé)
    const earlier = dailyEngagement[0]
    expect(earlier.twitter).toBe(0)
  })
})

describe("round1", () => {
  test("arrondit à une décimale", () => {
    expect(round1(10.04)).toBe(10)
    expect(round1(10.05)).toBeCloseTo(10.1, 6)
  })
})
