import {
  PLATFORM_CONFIG,
  ALL_PLATFORMS,
  aspectRatioToCss,
  checkPlatformConformity,
} from "@/lib/scheduler/platform-config"

describe("platform-config (contraintes média enrichies)", () => {
  it("chaque plateforme a des contraintes média cohérentes", () => {
    for (const p of ALL_PLATFORMS) {
      const cfg = PLATFORM_CONFIG[p]
      expect(cfg.aspectRatios.length).toBeGreaterThan(0)
      expect(cfg.maxImages).toBeGreaterThanOrEqual(1)
      expect(typeof cfg.supportsCarousel).toBe("boolean")
      expect(typeof cfg.mediaRequired).toBe("boolean")
    }
  })

  it("aspectRatioToCss convertit w:h en CSS, avec repli 1/1", () => {
    expect(aspectRatioToCss("16:9")).toBe("16 / 9")
    expect(aspectRatioToCss("1:1")).toBe("1 / 1")
    expect(aspectRatioToCss(undefined)).toBe("1 / 1")
    expect(aspectRatioToCss("nimporte")).toBe("1 / 1")
  })

  it("texte trop long → erreur de conformité", () => {
    const issues = checkPlatformConformity("twitter", { content: "x".repeat(281), imageCount: 0 })
    expect(issues.some((i) => i.level === "error")).toBe(true)
  })

  it("Instagram sans média → erreur (média requis)", () => {
    const issues = checkPlatformConformity("instagram", { content: "ok", imageCount: 0 })
    expect(issues.some((i) => i.level === "error" && /média/.test(i.message))).toBe(true)
  })

  it("plusieurs images sur X (pas de carrousel) → avertissement", () => {
    const issues = checkPlatformConformity("twitter", { content: "ok", imageCount: 3 })
    expect(issues.some((i) => i.level === "warning" && /carrousel/.test(i.message))).toBe(true)
  })

  it("contenu conforme → aucune issue", () => {
    expect(checkPlatformConformity("linkedin", { content: "Bonjour", imageCount: 1 })).toEqual([])
  })
})
