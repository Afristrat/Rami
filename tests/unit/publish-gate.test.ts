import { assertPublishable, isHumanApproved } from "@/lib/services/workflow/publish-gate"

const approved = {
  status: "approved",
  platforms: ["linkedin"],
  approved_by: "u1",
  approved_at: "2026-06-23T10:00:00Z",
}

describe("publish-gate (verrou de publication)", () => {
  it("isHumanApproved exige approved_by ET approved_at", () => {
    expect(isHumanApproved({ approved_by: "u1", approved_at: "2026-06-23T10:00:00Z" })).toBe(true)
    expect(isHumanApproved({ approved_by: "u1", approved_at: null })).toBe(false)
    expect(isHumanApproved({ approved_by: null, approved_at: "2026-06-23T10:00:00Z" })).toBe(false)
    expect(isHumanApproved({ approved_by: null, approved_at: null })).toBe(false)
  })

  it("post approuvé avec plateforme → ok", () => {
    expect(assertPublishable(approved)).toEqual({ ok: true })
  })

  it("post non approuvé → not_human_approved", () => {
    const r = assertPublishable({ ...approved, approved_by: null, approved_at: null })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe("not_human_approved")
  })

  it("aucune plateforme → no_platforms (priorité sur l'approbation)", () => {
    const r = assertPublishable({ ...approved, platforms: [] })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe("no_platforms")
  })

  it("déjà en cours de publication → already_publishing", () => {
    const r = assertPublishable({ ...approved, status: "publishing" })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe("already_publishing")
  })
})
