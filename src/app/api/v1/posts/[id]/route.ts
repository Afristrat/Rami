// ============================================================
// API publique v1 — GET /api/v1/posts/{id} (US-051 LOT 1)
// État d'un post du tenant authentifié (pour le polling de publication).
// Scope requis : posts:write.
// ============================================================

import type { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { authenticateApiRequest, requireScopes } from "@/lib/api/auth"
import { apiError, apiOk } from "@/lib/api/respond"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateApiRequest(request)
  if (!auth.ok) return auth.response
  const scopeErr = requireScopes(auth.ctx, ["posts:write"])
  if (scopeErr) return scopeErr

  const { id } = await params

  const supabase = createServiceClient()
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, status, platforms, platform_results, published_at, scheduled_at")
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)
    .single<{
      id: string
      status: string
      platforms: string[] | null
      platform_results: unknown
      published_at: string | null
      scheduled_at: string | null
    }>()

  if (error || !post) return apiError(404, "Post introuvable.")

  return apiOk({
    id: post.id,
    status: post.status,
    platforms: post.platforms ?? [],
    platformResults: post.platform_results ?? null,
    publishedAt: post.published_at,
    scheduledAt: post.scheduled_at,
  })
}
