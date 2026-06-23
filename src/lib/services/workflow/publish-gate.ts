// ============================================================
// Verrou de publication — règle unique partagée (DRY)
// Appliquée en 3 points : API v1 publish, action publishPost, worker.
// Pure : aucune I/O, entièrement testable.
// ============================================================

export type GatePost = {
  status: string
  platforms: string[] | null
  approved_by: string | null
  approved_at: string | null
}

export type GateResult =
  | { ok: true }
  | {
      ok: false
      code: "no_platforms" | "not_human_approved" | "already_publishing"
      message: string
    }

export function isHumanApproved(
  post: Pick<GatePost, "approved_by" | "approved_at">
): boolean {
  return post.approved_by !== null && post.approved_at !== null
}

export function assertPublishable(post: GatePost): GateResult {
  if (post.status === "publishing") {
    return {
      ok: false,
      code: "already_publishing",
      message: "Publication déjà en cours pour ce post.",
    }
  }
  if (!post.platforms || post.platforms.length === 0) {
    return {
      ok: false,
      code: "no_platforms",
      message: "Aucune plateforme sélectionnée pour ce post.",
    }
  }
  if (!isHumanApproved(post)) {
    return {
      ok: false,
      code: "not_human_approved",
      message: "Ce post doit être validé par un membre avant publication.",
    }
  }
  return { ok: true }
}
