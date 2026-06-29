// ============================================================
// API publique v1 — POST /api/v1/visuals/generate (US-052)
// Génère un artefact visuel (image | carrousel), applique les gates QA
// déterministes et persiste la ligne `visuals`. Scope requis : visuals:write.
// ============================================================

import type { NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { authenticateApiRequest, requireScopes } from "@/lib/api/auth"
import { apiError, apiOk } from "@/lib/api/respond"
import { GenerateVisualSchema } from "@/lib/schemas/visual-api.schema"
import { generateAndEvaluate } from "@/lib/services/visuals/api-helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request)
  if (!auth.ok) return auth.response
  const scopeErr = requireScopes(auth.ctx, ["visuals:write"])
  if (scopeErr) return scopeErr

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError(400, "Corps JSON invalide.")
  }

  const parsed = GenerateVisualSchema.safeParse(body)
  if (!parsed.success) return apiError(422, "Données invalides.", parsed.error.issues)

  const { type, format, content } = parsed.data
  const supabase = createServiceClient()

  let result
  try {
    result = await generateAndEvaluate(supabase, auth.ctx.tenantId, { type, format, content })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la génération."
    // Persistance best-effort de l'échec (audit) — n'échoue jamais la réponse.
    await supabase.from("visuals").insert({
      tenant_id: auth.ctx.tenantId,
      type,
      format,
      status: "failed",
      content: { ...content, _error: message },
    })
    return apiError(500, `Échec de la génération : ${message}`)
  }

  const { gen, qa } = result
  const { data: created, error } = await supabase
    .from("visuals")
    .insert({
      tenant_id: auth.ctx.tenantId,
      type,
      format,
      status: "ready",
      manifest: gen.manifest,
      qa,
      slides: gen.slides,
      content,
      brand_dna_snapshot: gen.brandDnaSnapshot,
    })
    .select("id, status")
    .single<{ id: string; status: string }>()

  if (error || !created) return apiError(500, "Échec de la persistance du visuel.")

  return apiOk({ visual_id: created.id, status: created.status, manifest: gen.manifest, qa }, 201)
}
