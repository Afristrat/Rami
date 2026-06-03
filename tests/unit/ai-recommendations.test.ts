import { buildAiRecommendations } from "@/lib/services/analytics/recommendations"
import type { TopFeaturesResult } from "@/lib/services/metrics/attribution"

function res(
  dimension: TopFeaturesResult["dimension"],
  rankings: Array<{ value: string; avgEngagement: number; sampleSize: number }>
): TopFeaturesResult {
  return {
    dimension,
    sector: null,
    rankings: rankings.map((r) => ({ ...r, totalImpressions: 1000 })),
  }
}

describe("buildAiRecommendations", () => {
  test("aucune donnée → [] (état vide honnête)", () => {
    expect(buildAiRecommendations([])).toEqual([])
    expect(buildAiRecommendations([res("format", [])])).toEqual([])
    expect(buildAiRecommendations([null, undefined])).toEqual([])
  })

  test("mappe dimension→type, prend le top, convertit le ratio en %", () => {
    const r = buildAiRecommendations([
      res("scheduled_hour", [{ value: "9", avgEngagement: 0.072, sampleSize: 5 }]),
    ])
    expect(r).toEqual([{ type: "best_hour", value: "9", engagementPct: 7.2, sampleSize: 5 }])
  })

  test("trie par engagement décroissant et limite à max", () => {
    const r = buildAiRecommendations(
      [
        res("format", [{ value: "carrousel", avgEngagement: 0.03, sampleSize: 4 }]),
        res("platform", [{ value: "linkedin", avgEngagement: 0.09, sampleSize: 6 }]),
        res("dominant_color_hex", [{ value: "#059669", avgEngagement: 0.05, sampleSize: 3 }]),
        res("cognitive_objective", [{ value: "confiance", avgEngagement: 0.07, sampleSize: 8 }]),
      ],
      2
    )
    expect(r.map((x) => x.value)).toEqual(["linkedin", "confiance"])
    expect(r[0].type).toBe("best_platform")
  })

  test("ignore les dimensions non mappées (ex. hook, visual_direction)", () => {
    const r = buildAiRecommendations([
      res("hook", [{ value: "question", avgEngagement: 0.5, sampleSize: 10 }]),
      res("visual_direction", [{ value: "Blueprint", avgEngagement: 0.4, sampleSize: 10 }]),
    ])
    expect(r).toEqual([])
  })
})
