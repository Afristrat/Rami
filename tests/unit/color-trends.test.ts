import {
  buildColorTrendReport,
  quarterLabel,
  isMenaCulture,
  buildColorTrendSystemPrompt,
  buildColorTrendUserPrompt,
  type PlatformBenchmark,
} from "@/lib/services/reports/color-trends"

// ─── quarterLabel ────────────────────────────────────────────────────────────

describe("quarterLabel", () => {
  test("trimestres corrects (UTC)", () => {
    expect(quarterLabel(new Date("2026-01-15T00:00:00Z"))).toBe("2026-T1")
    expect(quarterLabel(new Date("2026-04-01T00:00:00Z"))).toBe("2026-T2")
    expect(quarterLabel(new Date("2026-07-31T00:00:00Z"))).toBe("2026-T3")
    expect(quarterLabel(new Date("2026-12-31T00:00:00Z"))).toBe("2026-T4")
  })
})

// ─── isMenaCulture ───────────────────────────────────────────────────────────

describe("isMenaCulture", () => {
  test("cultures MENA reconnues", () => {
    expect(isMenaCulture("maroc")).toBe(true)
    expect(isMenaCulture("moyen_orient")).toBe(true)
    expect(isMenaCulture("afrique_subsaharienne")).toBe(true)
    expect(isMenaCulture("europe")).toBe(false)
  })
})

// ─── buildColorTrendReport ───────────────────────────────────────────────────

describe("buildColorTrendReport", () => {
  test("finance_islamique → vert recommandé, rouge à éviter, classement par posture", () => {
    const r = buildColorTrendReport({ sector: "finance_islamique", culture: "maroc", period: "2026-T2" })
    const vert = r.colors.find((c) => c.id === "vert")
    const rouge = r.colors.find((c) => c.id === "rouge")
    expect(vert?.stance).toBe("recommended")
    expect(rouge?.stance).toBe("avoid")
    // Les recommandées apparaissent avant les « à éviter ».
    const idxVert = r.colors.findIndex((c) => c.id === "vert")
    const idxRouge = r.colors.findIndex((c) => c.id === "rouge")
    expect(idxVert).toBeLessThan(idxRouge)
  })

  test("note culturelle dépend de la culture (Maroc vs Moyen-Orient)", () => {
    const maroc = buildColorTrendReport({ sector: "tech", culture: "maroc", period: "p" })
    const mo = buildColorTrendReport({ sector: "tech", culture: "moyen_orient", period: "p" })
    const vertMaroc = maroc.colors.find((c) => c.id === "vert")?.culturalNote
    const vertMo = mo.colors.find((c) => c.id === "vert")?.culturalNote
    expect(vertMaroc).not.toBe(vertMo)
    expect(vertMo).toContain("Islam")
  })

  test("dataAvailability selon présence de benchmarks", () => {
    const empty = buildColorTrendReport({ sector: "tech", culture: "maroc", period: "p" })
    expect(empty.dataAvailability).toBe("authority_only")
    expect(empty.platformBenchmarks).toEqual([])

    const benchmarks: PlatformBenchmark[] = [
      { platform: "linkedin", metric: "avg_engagement", value: 0.05, sampleSize: 6 },
    ]
    const withData = buildColorTrendReport({ sector: "tech", culture: "maroc", period: "p", benchmarks })
    expect(withData.dataAvailability).toBe("collective")
    expect(withData.platformBenchmarks).toHaveLength(1)
  })

  test("contient les 8 couleurs Causse + narrative null par défaut", () => {
    const r = buildColorTrendReport({ sector: "tech", culture: "maroc", period: "p" })
    expect(r.colors).toHaveLength(8)
    expect(r.narrative).toBeNull()
  })
})

// ─── prompts ─────────────────────────────────────────────────────────────────

describe("prompts narratifs", () => {
  test("system prompt mentionne Causse + MENA", () => {
    const sys = buildColorTrendSystemPrompt()
    expect(sys).toContain("Causse")
    expect(sys.toLowerCase()).toContain("mena")
  })

  test("user prompt inclut secteur, période et la mention k-anonymat si aucune donnée", () => {
    const report = buildColorTrendReport({ sector: "finance_islamique", culture: "maroc", period: "2026-T2" })
    const u = buildColorTrendUserPrompt(report)
    expect(u).toContain("finance_islamique")
    expect(u).toContain("2026-T2")
    expect(u).toContain("k-anonymat")
  })
})
