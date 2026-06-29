import { GenerateVisualSchema, assertFormatForType } from "@/lib/schemas/visual-api.schema"

describe("visual-api.schema", () => {
  it("accepte un carousel 4:5", () => {
    const r = GenerateVisualSchema.safeParse({ type: "carousel", format: "4:5", content: { brief: "x" } })
    expect(r.success).toBe(true)
  })

  it("rejette un format hors-liste pour le type", () => {
    expect(assertFormatForType("carousel", "16:9")).toBe(false)
    expect(assertFormatForType("carousel", "1:1")).toBe(true)
    expect(assertFormatForType("image", "9:16")).toBe(true)
  })

  it("rejette un type inconnu", () => {
    expect(GenerateVisualSchema.safeParse({ type: "hologram", format: "1:1", content: {} }).success).toBe(false)
  })

  it("rejette un carousel en 16:9 (format interdit pour ce type)", () => {
    expect(GenerateVisualSchema.safeParse({ type: "carousel", format: "16:9", content: {} }).success).toBe(false)
  })
})
