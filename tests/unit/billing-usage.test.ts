import { shouldResetGenerations, effectiveGenerationCount } from "@/lib/billing/usage"

const NOW = new Date("2026-06-02T12:00:00Z")

describe("shouldResetGenerations", () => {
  test("null → pas de reset (jamais consommé)", () => {
    expect(shouldResetGenerations(null, NOW)).toBe(false)
  })
  test("échéance passée → reset dû", () => {
    expect(shouldResetGenerations(new Date("2026-06-01T00:00:00Z"), NOW)).toBe(true)
  })
  test("échéance future → pas de reset", () => {
    expect(shouldResetGenerations(new Date("2026-06-30T00:00:00Z"), NOW)).toBe(false)
  })
})

describe("effectiveGenerationCount", () => {
  test("période expirée → compteur effectif 0", () => {
    expect(effectiveGenerationCount(500, new Date("2026-06-01T00:00:00Z"), NOW)).toBe(0)
  })
  test("période en cours → compteur conservé", () => {
    expect(effectiveGenerationCount(42, new Date("2026-06-30T00:00:00Z"), NOW)).toBe(42)
  })
  test("reset_at null → compteur conservé", () => {
    expect(effectiveGenerationCount(7, null, NOW)).toBe(7)
  })
})
