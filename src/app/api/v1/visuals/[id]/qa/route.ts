// ============================================================
// API publique v1 — GET /api/v1/visuals/{id}/qa (US-052)
// Résultat des gates QA déterministes (passed, gates, brandPreflightScore).
// Scope : visuals:write. Isolation tenant par filtre explicite.
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
    .select("id, qa")
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)
    .maybeSingle<{ id: string; qa: unknown }>()

  if (error || !visual) return apiError(404, "Visuel introuvable.")
  if (!visual.qa) return apiError(404, "Aucun résultat QA pour ce visuel.")

  return apiOk(visual.qa)
}
