// ============================================================
// API publique v1 — GET /api/v1/visuals/{id} (US-052)
// Statut + manifeste d'un visuel du tenant authentifié. Scope : visuals:write.
// Isolation tenant : filtre explicite par tenant_id (service-role bypass RLS).
// ============================================================

import type { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { authenticateApiRequest, requireScopes } from "@/lib/api/auth"
import { apiError, apiOk } from "@/lib/api/respond"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (!auth.ok) return auth.response
  const scopeErr = requireScopes(auth.ctx, ["visuals:write"])
  if (scopeErr) return scopeErr

  const { id } = await params
  const supabase = createServiceClient()
  const { data: visual, error } = await supabase
    .from("visuals")
    .select("id, type, format, status, manifest")
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)
    .maybeSingle<{ id: string; type: string; format: string; status: string; manifest: unknown }>()

  if (error || !visual) return apiError(404, "Visuel introuvable.")

  return apiOk({
    visual_id: visual.id,
    type: visual.type,
    format: visual.format,
    status: visual.status,
    manifest: visual.manifest,
  })
}
