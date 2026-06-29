// ============================================================
// API publique v1 — POST /api/v1/posts (US-051 LOT 1)
// Crée un post (brouillon) pour le tenant authentifié par clé API.
// Scope requis : posts:write.
// ============================================================

import type { NextRequest } from "next/server"
import { z } from "zod"
import { createServiceClient } from "@/lib/supabase/service"
import { authenticateApiRequest, requireScopes } from "@/lib/api/auth"
import { apiError, apiOk } from "@/lib/api/respond"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "instagram",
  "pinterest",
  "youtube",
  "tiktok",
] as const

const BodySchema = z.object({
  content: z.string().min(1).max(3000),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(8),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  title: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request)
  if (!auth.ok) return auth.response
  const scopeErr = requireScopes(auth.ctx, ["posts:write"])
  if (scopeErr) return scopeErr

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError(400, "Corps JSON invalide.")
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return apiError(422, "Données invalides.", parsed.error.issues)

  const { content, platforms, mediaUrls, title } = parsed.data
  const supabase = createServiceClient()

  const { data: created, error } = await supabase
    .from("posts")
    .insert({
      tenant_id: auth.ctx.tenantId,
      title: title?.trim() || null,
      content,
      platforms,
      status: "draft",
      media_urls: mediaUrls ?? [],
    })
    .select("id, status, platforms, created_at")
    .single<{ id: string; status: string; platforms: string[]; created_at: string }>()

  if (error || !created) return apiError(500, "Échec de la création du post.")

  return apiOk(
    {
      id: created.id,
      status: created.status,
      platforms: created.platforms,
      createdAt: created.created_at,
    },
    201
  )
}
