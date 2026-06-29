// ============================================================
// API publique v1 — GET /api/v1/visuals/{id}/preview (US-052)
// Sans `?slide` : liste les slides { n, url }. Avec `?slide=n` : redirige vers
// l'artefact MinIO public (image/webp ou application/pdf pour un carrousel).
// Scope : visuals:write. Isolation tenant par filtre explicite.
// ============================================================

import { NextResponse, type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { authenticateApiRequest, requireScopes } from "@/lib/api/auth"
import { apiError, apiOk } from "@/lib/api/respond"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface SlideRow {
  n: number
  minio_path: string
  public_url: string | null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (!auth.ok) return auth.response
  const scopeErr = requireScopes(auth.ctx, ["visuals:write"])
  if (scopeErr) return scopeErr

  const { id } = await params
  const supabase = createServiceClient()
  const { data: visual, error } = await supabase
    .from("visuals")
    .select("id, slides")
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)
    .maybeSingle<{ id: string; slides: SlideRow[] | null }>()

  if (error || !visual) return apiError(404, "Visuel introuvable.")

  const slides = Array.isArray(visual.slides) ? visual.slides : []
  const slideParam = new URL(request.url).searchParams.get("slide")

  if (slideParam === null) {
    return apiOk({ slides: slides.map((s) => ({ n: s.n, url: s.public_url })) })
  }

  const n = Number(slideParam)
  const slide = Number.isInteger(n) ? slides.find((s) => s.n === n) : undefined
  if (!slide || !slide.public_url) return apiError(404, "Slide introuvable.")

  return NextResponse.redirect(slide.public_url, 302)
}
