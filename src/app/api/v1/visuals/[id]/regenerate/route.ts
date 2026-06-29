// ============================================================
// API publique v1 — POST /api/v1/visuals/{id}/regenerate (US-052)
// Régénère un visuel en injectant les `defects` signalés dans content.feedback,
// ré-applique les gates QA et met à jour la ligne. Scope : visuals:write.
// Cœur de la boucle vertueuse : le gardien renvoie ce qui n'allait pas.
// ============================================================

import type { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { authenticateApiRequest, requireScopes } from "@/lib/api/auth"
import { apiError, apiOk } from "@/lib/api/respond"
import { RegenerateVisualSchema } from "@/lib/schemas/visual-api.schema"
import { generateAndEvaluate } from "@/lib/services/visuals/api-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiRequest(request)
  if (!auth.ok) return auth.response
  const scopeErr = requireScopes(auth.ctx, ["visuals:write"])
  if (scopeErr) return scopeErr

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError(400, "Corps JSON invalide.")
  }
  const parsed = RegenerateVisualSchema.safeParse(body)
  if (!parsed.success) return apiError(422, "Données invalides.", parsed.error.issues)

  const supabase = createServiceClient()
  const { data: existing, error: loadError } = await supabase
    .from("visuals")
    .select("id, type, format, content")
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)
    .maybeSingle<{ id: string; type: string; format: string; content: Record<string, unknown> | null }>()

  if (loadError || !existing) return apiError(404, "Visuel introuvable.")

  // Réinjecte les défauts signalés dans le contexte de génération.
  const content: Record<string, unknown> = { ...(existing.content ?? {}), feedback: parsed.data.defects }

  let result
  try {
    result = await generateAndEvaluate(supabase, auth.ctx.tenantId, {
      type: existing.type,
      format: existing.format,
      content,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la régénération."
    await supabase
      .from("visuals")
      .update({ status: "failed", content: { ...content, _error: message }, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", auth.ctx.tenantId)
    return apiError(500, `Échec de la régénération : ${message}`)
  }

  const { gen, qa } = result
  const { error: updateError } = await supabase
    .from("visuals")
    .update({
      status: "ready",
      manifest: gen.manifest,
      qa,
      slides: gen.slides,
      content,
      brand_dna_snapshot: gen.brandDnaSnapshot,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)

  if (updateError) return apiError(500, "Échec de la mise à jour du visuel.")

  return apiOk({ visual_id: id, status: "ready", manifest: gen.manifest, qa })
}
