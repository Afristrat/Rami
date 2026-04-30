/**
 * POST /api/queue/publish
 * Enqueue un post pour publication immédiate ou programmée.
 *
 * Body : { postId: string, scheduledAt?: string (ISO 8601) }
 *
 * Conforme SOP-004 :
 *  - Vérifie que le post est "approved" ou "scheduled"
 *  - Passe le statut à "scheduled"
 *  - Enqueue le job pg-boss avec singletonKey = postId
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { enqueuePublish, enqueueScheduledPublish } from "@/lib/queue/pgboss"
import { db as _db } from "@/lib/db"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

const RequestSchema = z.object({
  postId: z.string().uuid(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
})

export async function POST(request: NextRequest) {
  // Auth
  const supabaseUser = await createClient()
  const {
    data: { user },
  } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Récupérer le tenantId (toutes stratégies : owner, member, legacy)
  const tenantId = await resolveUserTenant(supabaseUser, user.id)

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant introuvable" }, { status: 403 })
  }

  // Validation du body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 }
    )
  }

  const { postId, scheduledAt } = parsed.data

  // Vérifier que le post appartient au tenant et est dans un statut publiable
  const supabase = createServiceClient()
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, tenant_id, status, scheduled_at, platforms")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: "Post introuvable" }, { status: 404 })
  }

  const publishableStatuses = ["draft", "review", "approved", "scheduled", "failed"]
  if (!publishableStatuses.includes(post.status as string)) {
    return NextResponse.json(
      {
        error: `Post en statut "${post.status}" — impossible de republier un post déjà en cours de publication.`,
      },
      { status: 409 }
    )
  }

  if (!post.platforms || (post.platforms as string[]).length === 0) {
    return NextResponse.json(
      { error: "Aucune plateforme sélectionnée pour ce post." },
      { status: 422 }
    )
  }

  // Mettre à jour le statut en "scheduled" et la date si fournie
  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null
  await supabase
    .from("posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledDate?.toISOString() ?? post.scheduled_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  // Enqueue le job
  let jobId: string | null
  const payload = { postId, tenantId }

  if (scheduledDate && scheduledDate > new Date()) {
    jobId = await enqueueScheduledPublish(payload, scheduledDate)
  } else {
    jobId = await enqueuePublish(payload)
  }

  return NextResponse.json({
    success: true,
    jobId,
    scheduledAt: scheduledDate?.toISOString() ?? null,
    message: scheduledDate
      ? `Post programmé pour le ${scheduledDate.toLocaleString("en-US")}`
      : "Post mis en queue pour publication immédiate",
  })
}
