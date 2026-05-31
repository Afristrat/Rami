import {
  computeTenantPlatformStats,
  aggregateCollective,
  benchmarkKey,
  K_ANONYMITY_MIN,
  type TenantPlatformStat,
  type MetricFact,
} from "@/lib/services/metrics/collective"

// ─── computeTenantPlatformStats ──────────────────────────────────────────────

describe("computeTenantPlatformStats", () => {
  test("moyenne par plateforme des posts d'un tenant", () => {
    const facts: MetricFact[] = [
      { platform: "twitter", engagement_rate: 0.10, impressions: 100 },
      { platform: "twitter", engagement_rate: 0.20, impressions: 300 },
      { platform: "linkedin", engagement_rate: 0.05, impressions: 1000 },
    ]
    const stats = computeTenantPlatformStats("t1", "tech", "maroc", facts)

    const twitter = stats.find((s) => s.platform === "twitter")
    const linkedin = stats.find((s) => s.platform === "linkedin")

    expect(stats).toHaveLength(2)
    expect(twitter).toMatchObject({ tenantId: "t1", sector: "tech", culture: "maroc" })
    expect(twitter?.avgEngagement).toBeCloseTo(0.15, 6)
    expect(twitter?.avgImpressions).toBeCloseTo(200, 6)
    expect(linkedin?.avgEngagement).toBeCloseTo(0.05, 6)
    expect(linkedin?.avgImpressions).toBeCloseTo(1000, 6)
  })

  test("ignore les plateformes sans aucune mesure exploitable", () => {
    const facts: MetricFact[] = [
      { platform: "twitter", engagement_rate: null, impressions: null },
    ]
    expect(computeTenantPlatformStats("t1", "tech", "maroc", facts)).toHaveLength(0)
  })

  test("liste de facts vide → aucune stat", () => {
    expect(computeTenantPlatformStats("t1", "tech", "maroc", [])).toHaveLength(0)
  })
})

// ─── aggregateCollective (k-anonymity) ───────────────────────────────────────

/** Fabrique N tenants distincts dans le même bucket (secteur, culture, plateforme). */
function makeBucket(
  count: number,
  opts: { sector?: string; culture?: string; platform?: string; eng?: number; imp?: number } = {}
): TenantPlatformStat[] {
  const { sector = "tech", culture = "maroc", platform = "twitter", eng = 0.1, imp = 100 } = opts
  return Array.from({ length: count }, (_, i) => ({
    tenantId: `${sector}-${culture}-${platform}-tenant-${i}`,
    sector,
    culture,
    platform,
    avgEngagement: eng,
    avgImpressions: imp,
  }))
}

describe("aggregateCollective — k-anonymity", () => {
  test(`< ${K_ANONYMITY_MIN} tenants → AUCUNE ligne (k-anonymity)`, () => {
    expect(aggregateCollective(makeBucket(K_ANONYMITY_MIN - 1))).toHaveLength(0)
  })

  test("aucune stat → aucune ligne", () => {
    expect(aggregateCollective([])).toHaveLength(0)
  })

  test(`exactement ${K_ANONYMITY_MIN} tenants → 2 metrics (engagement + impressions)`, () => {
    const rows = aggregateCollective(makeBucket(K_ANONYMITY_MIN))
    expect(rows).toHaveLength(2)
    const metrics = rows.map((r) => r.metric).sort()
    expect(metrics).toEqual(["avg_engagement", "avg_impressions"])
    for (const r of rows) {
      expect(r.sampleSize).toBe(K_ANONYMITY_MIN)
      expect(r).toMatchObject({ sector: "tech", culture: "maroc", platform: "twitter" })
    }
  })

  test("moyenne des moyennes-tenant : un gros tenant ne domine pas", () => {
    // 4 tenants à 0.10 + 1 tenant à 0.60 → moyenne = 0.20 (pas pondérée par volume).
    const stats: TenantPlatformStat[] = [
      ...makeBucket(4, { eng: 0.1, imp: 100 }),
      ...makeBucket(1, { eng: 0.6, imp: 600 }).map((s) => ({ ...s, tenantId: "whale" })),
    ]
    const rows = aggregateCollective(stats)
    const eng = rows.find((r) => r.metric === "avg_engagement")
    const imp = rows.find((r) => r.metric === "avg_impressions")

    expect(rows).toHaveLength(2)
    expect(eng?.sampleSize).toBe(5)
    expect(eng?.value).toBeCloseTo((0.1 * 4 + 0.6) / 5, 6) // 0.20
    expect(imp?.value).toBeCloseTo((100 * 4 + 600) / 5, 6) // 200
  })

  test("le même tenant n'est compté qu'une fois par bucket (dédup)", () => {
    // 5 entrées mais 4 tenants distincts → sous le seuil → aucune ligne.
    const base = makeBucket(4)
    const duplicate = { ...base[0] } // doublon du tenant 0
    expect(aggregateCollective([...base, duplicate])).toHaveLength(0)
  })

  test("buckets séparés par secteur/culture/plateforme, chacun évalué indépendamment", () => {
    const stats: TenantPlatformStat[] = [
      ...makeBucket(K_ANONYMITY_MIN, { sector: "tech", platform: "twitter" }), // qualifie
      ...makeBucket(K_ANONYMITY_MIN - 1, { sector: "finance", platform: "linkedin" }), // ne qualifie pas
    ]
    const rows = aggregateCollective(stats)
    // Seul le bucket tech/twitter qualifie → 2 lignes.
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.sector === "tech" && r.platform === "twitter")).toBe(true)
  })
})

// ─── benchmarkKey ─────────────────────────────────────────────────────────────

describe("benchmarkKey", () => {
  test("clé canonique stable et sans collision de séparateur", () => {
    const a = benchmarkKey({ sector: "a", culture: "b", platform: "twitter", metric: "avg_engagement" })
    const b = benchmarkKey({ sector: "a", culture: "b", platform: "twitter", metric: "avg_engagement" })
    expect(a).toBe(b)

    // ("a b", "c") ne doit pas collisionner avec ("a", "b c").
    const k1 = benchmarkKey({ sector: "a b", culture: "c", platform: "twitter", metric: "avg_engagement" })
    const k2 = benchmarkKey({ sector: "a", culture: "b c", platform: "twitter", metric: "avg_engagement" })
    expect(k1).not.toBe(k2)
  })
})
