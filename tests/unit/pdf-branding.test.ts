import { resolvePdfBranding, isUsableLogo } from "@/lib/services/documents/pdf/branding"

const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

const DNA = (over: Record<string, unknown> = {}) => ({
  brandName: "Agence Alpha",
  logoDataUrl: LOGO,
  ...over,
})

// ─── isUsableLogo ────────────────────────────────────────────────────────────

describe("isUsableLogo", () => {
  test("data-URL image valides", () => {
    expect(isUsableLogo(LOGO)).toBe(true)
    expect(isUsableLogo("data:image/jpeg;base64,/9j/AAA")).toBe(true)
    expect(isUsableLogo("data:image/webp;base64,UklGR")).toBe(true)
  })
  test("rejette URL distante, vide, non-string", () => {
    expect(isUsableLogo("https://cdn.example.com/logo.png")).toBe(false)
    expect(isUsableLogo("")).toBe(false)
    expect(isUsableLogo(null)).toBe(false)
    expect(isUsableLogo(123)).toBe(false)
    expect(isUsableLogo("data:text/plain;base64,AAAA")).toBe(false)
  })
})

// ─── resolvePdfBranding ──────────────────────────────────────────────────────

describe("resolvePdfBranding", () => {
  test("forfait Branding personnalisé (white_label) + logo → 100% agence", () => {
    const b = resolvePdfBranding({ plan: "agency_plus", brandDna: DNA() })
    expect(b.mode).toBe("agency")
    expect(b.logoDataUrl).toBe(LOGO)
    expect(b.displayName).toBe("Agence Alpha")
    expect(b.showPoweredBy).toBe(false)
  })

  test("enterprise + logo → agence", () => {
    const b = resolvePdfBranding({ plan: "enterprise", brandDna: DNA() })
    expect(b.mode).toBe("agency")
    expect(b.showPoweredBy).toBe(false)
  })

  test("logo SANS forfait (agency) → co-branding + Propulsé par RAMI", () => {
    const b = resolvePdfBranding({ plan: "agency", brandDna: DNA() })
    expect(b.mode).toBe("cobrand")
    expect(b.logoDataUrl).toBe(LOGO)
    expect(b.showPoweredBy).toBe(true)
  })

  test("plan modeste (solo) avec logo → co-branding", () => {
    const b = resolvePdfBranding({ plan: "solo", brandDna: DNA() })
    expect(b.mode).toBe("cobrand")
    expect(b.showPoweredBy).toBe(true)
  })

  test("aucun logo → branding RAMI seul", () => {
    const b = resolvePdfBranding({ plan: "agency_plus", brandDna: DNA({ logoDataUrl: undefined }) })
    expect(b.mode).toBe("rami")
    expect(b.logoDataUrl).toBeNull()
    expect(b.displayName).toBe("RAMI")
    expect(b.showPoweredBy).toBe(false)
  })

  test("logo non exploitable (URL distante) → traité comme absent → RAMI", () => {
    const b = resolvePdfBranding({
      plan: "enterprise",
      brandDna: DNA({ logoDataUrl: "https://cdn.example.com/logo.png" }),
    })
    expect(b.mode).toBe("rami")
    expect(b.logoDataUrl).toBeNull()
  })

  test("brand_dna nesté (identity.name) résolu", () => {
    const b = resolvePdfBranding({
      plan: "agency_plus",
      brandDna: { identity: { name: "Studio Nested" }, logoDataUrl: LOGO },
    })
    expect(b.mode).toBe("agency")
    expect(b.displayName).toBe("Studio Nested")
  })

  test("brand_dna nul/invalide → RAMI sans crash", () => {
    expect(resolvePdfBranding({ plan: "free", brandDna: null }).mode).toBe("rami")
    expect(resolvePdfBranding({ plan: "free", brandDna: "oops" }).mode).toBe("rami")
  })
})
