// ============================================================
// Lien d'approbation externe — Step 6 du workflow « Créer un post »
//
// Module PUR (zéro I/O) : règles d'actionnabilité d'un token d'approbation
// et construction de l'URL publique. Le token (capability URL aléatoire,
// durée limitée) permet à un approbateur externe SANS compte RAMI de
// consulter le post et de décider via /approve/[token].
// ============================================================

export const APPROVAL_TOKEN_TTL_DAYS = 14

/** Longueur d'un token base64url généré depuis 32 octets aléatoires. */
export const APPROVAL_TOKEN_LENGTH = 43

export type ApprovalTokenStatus = "pending" | "approved" | "rejected"

export interface ApprovalTokenState {
  status: ApprovalTokenStatus
  expires_at: string | Date
}

export type ApprovalActionability =
  | { actionable: true }
  | { actionable: false; reason: "expired" | "already_decided" }

/** Un token est actionnable s'il est en attente ET non expiré. */
export function isApprovalActionable(
  state: ApprovalTokenState,
  now: Date = new Date()
): ApprovalActionability {
  if (state.status !== "pending") {
    return { actionable: false, reason: "already_decided" }
  }
  const expiresAt = state.expires_at instanceof Date ? state.expires_at : new Date(state.expires_at)
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
    return { actionable: false, reason: "expired" }
  }
  return { actionable: true }
}

/**
 * Valide la forme d'un token reçu d'une URL publique avant tout accès DB
 * (base64url uniquement, longueur bornée — jamais de caractère SQL/chemin).
 */
export function isValidApprovalToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{20,64}$/.test(token)
}

/** Construit l'URL publique d'approbation à partir de la base de l'app. */
export function buildApprovalUrl(baseUrl: string | undefined, token: string): string {
  const base = (baseUrl ?? "https://rami.ai-mpower.com").replace(/\/+$/, "")
  return `${base}/approve/${token}`
}
