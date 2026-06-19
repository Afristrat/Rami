// ============================================================
// API publique v1 — POST /api/v1/posts/{id}/publish (US-051 LOT 1)
// Publie (immédiat) ou programme un post du tenant authentifié.
// Réutilise la file pg-boss existante (publish-worker). Scope : posts:write.
// ============================================================

import type { NextRequest } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { authenticateApiRequest, requireScopes } from "@/lib/api/auth"
import { apiError, apiOk } from "@/lib/api/respond"
import { enqueuePublish, enqueueScheduledPublish } from "@/lib/queue/pgboss"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BodySchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).optional(),
})

const PUBLISHABLE_STATUSES = ["draft", "review", "approved", "scheduled", "failed"]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request)
  if (!auth.ok) return auth.response
  const scopeErr = requireScopes(auth.ctx, ["posts:write"])
  if (scopeErr) return scopeErr

  const { id } = await params

  let body: unknown = {}
  try {
    const txt = await request.text()
    body = txt ? JSON.parse(txt) : {}
  } catch {
    return apiError(400, "Corps JSON invalide.")
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return apiError(422, "Données invalides.", parsed.error.issues)
  const { scheduledAt } = parsed.data

  const supabase = createServiceClient()
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, status, scheduled_at, platforms")
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)
    .single<{ id: string; status: string; scheduled_at: string | null; platforms: string[] | null }>()

  if (error || !post) return apiError(404, "Post introuvable.")
  if (!PUBLISHABLE_STATUSES.includes(post.status)) {
    return apiError(409, `Post en statut "${post.status}" — non publiable.`)
  }
  if (!post.platforms || post.platforms.length === 0) {
    return apiError(422, "Aucune plateforme sélectionnée pour ce post.")
  }

  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null
  await supabase
    .from("posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledDate?.toISOString() ?? post.scheduled_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  const payload = { postId: id, tenantId: auth.ctx.tenantId }
  const jobId =
    scheduledDate && scheduledDate > new Date()
      ? await enqueueScheduledPublish(payload, scheduledDate)
      : await enqueuePublish(payload)

  return apiOk(
    {
      postId: id,
      jobId,
      status: "scheduled",
      scheduledAt: scheduledDate?.toISOString() ?? null,
    },
    202
  )
}
