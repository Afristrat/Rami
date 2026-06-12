import {
  isApprovalActionable,
  isValidApprovalToken,
  buildApprovalUrl,
  APPROVAL_TOKEN_TTL_DAYS,
} from "@/lib/services/workflow/approval-link"

const NOW = new Date("2026-06-12T12:00:00Z")
const FUTURE = new Date("2026-06-20T12:00:00Z")
const PAST = new Date("2026-06-01T12:00:00Z")

describe("approval-link (Step 6 — lien d'approbation externe réel)", () => {
  it("expose un TTL de 14 jours", () => {
    expect(APPROVAL_TOKEN_TTL_DAYS).toBe(14)
  })

  describe("isApprovalActionable", () => {
    it("token pending non expiré → actionnable", () => {
      expect(isApprovalActionable({ status: "pending", expires_at: FUTURE }, NOW)).toEqual({
        actionable: true,
      })
    })

    it("token déjà approuvé → already_decided", () => {
      expect(isApprovalActionable({ status: "approved", expires_at: FUTURE }, NOW)).toEqual({
        actionable: false,
        reason: "already_decided",
      })
    })

    it("token déjà rejeté → already_decided", () => {
      expect(isApprovalActionable({ status: "rejected", expires_at: FUTURE }, NOW)).toEqual({
        actionable: false,
        reason: "already_decided",
      })
    })

    it("token pending expiré → expired", () => {
      expect(isApprovalActionable({ status: "pending", expires_at: PAST }, NOW)).toEqual({
        actionable: false,
        reason: "expired",
      })
    })

    it("accepte expires_at en chaîne ISO", () => {
      expect(
        isApprovalActionable({ status: "pending", expires_at: "2026-06-20T12:00:00Z" }, NOW)
      ).toEqual({ actionable: true })
    })

    it("date d'expiration invalide → expired (jamais actionnable par défaut)", () => {
      expect(
        isApprovalActionable({ status: "pending", expires_at: "pas-une-date" }, NOW)
      ).toEqual({ actionable: false, reason: "expired" })
    })
  })

  describe("isValidApprovalToken", () => {
    it("accepte un token base64url de 43 caractères", () => {
      expect(isValidApprovalToken("Ab3_dEf-9hIjKlMnOpQrStUvWxYz0123456789AbCdE")).toBe(true)
    })

    it("rejette les tokens trop courts, trop longs ou avec caractères interdits", () => {
      expect(isValidApprovalToken("court")).toBe(false)
      expect(isValidApprovalToken("a".repeat(65))).toBe(false)
      expect(isValidApprovalToken("token/avec/slash-et-plus-de-vingt-chars")).toBe(false)
      expect(isValidApprovalToken("token'; DROP TABLE approval_tokens;--")).toBe(false)
      expect(isValidApprovalToken("")).toBe(false)
    })
  })

  describe("buildApprovalUrl", () => {
    it("construit l'URL depuis la base configurée (slash final purgé)", () => {
      expect(buildApprovalUrl("https://rami.ai-mpower.com/", "tok")).toBe(
        "https://rami.ai-mpower.com/approve/tok"
      )
    })

    it("retombe sur le domaine de prod si la base est absente", () => {
      expect(buildApprovalUrl(undefined, "tok")).toBe("https://rami.ai-mpower.com/approve/tok")
    })
  })
})
