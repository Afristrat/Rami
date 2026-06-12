"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { and, eq, gte, lte, asc, count, sql } from "drizzle-orm"
import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"
import type { ScheduledPost } from "@/lib/scheduler/types"
import type { Platform } from "@/lib/scheduler/platform-config"
import { enqueuePublish, enqueueScheduledPublish } from "@/lib/queue/pgboss"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

// ── Schémas de validation ───────────────────────────────────────────────────

const NewPostSchema = z.object({
  title: z.string().max(500).trim().optional(),
  content: z
    .string()
    .min(1, V.contentRequired)
    .max(3000, V.contentTooLong)
    .trim(),
  platforms: z
    .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
    .min(1, V.platformRequired),
  scheduled_at: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(["draft", "review", "approved", "scheduled"]).default("draft"),
  media_urls: z.array(z.string().url()).max(10).optional(),
})

export type NewPostData = z.infer<typeof NewPostSchema>

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getTenantId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return resolveUserTenant(supabase, user.id)
}

function mapPost(row: typeof posts.$inferSelect): ScheduledPost {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    platforms: (row.platforms ?? []) as Platform[],
    status: row.status as ScheduledPost["status"],
    scheduled_at: row.scheduled_at?.toISOString() ?? null,
    published_at: row.published_at?.toISOString() ?? null,
    media_urls: (row.media_urls ?? []) as string[],
    created_at: row.created_at.toISOString(),
  }
}

// Mapper pour les lignes retournées par Supabase HTTP (timestamps = strings ISO)
function mapPostRow(row: Record<string, unknown>): ScheduledPost {
  return {
    id: row.id as string,
    title: (row.title as string | null) ?? null,
    content: row.content as string,
    platforms: ((row.platforms as string[]) ?? []) as Platform[],
    status: row.status as ScheduledPost["status"],
    scheduled_at: (row.scheduled_at as string | null) ?? null,
    published_at: (row.published_at as string | null) ?? null,
    media_urls: ((row.media_urls as string[]) ?? []) as string[],
    created_at: row.created_at as string,
  }
}

// ── Actions publiques ────────────────────────────────────────────────────────

/**
 * Récupère les posts d'un mois donné pour le calendrier.
 */
export async function getPostsForMonth(
  year: number,
  month: number // 0-indexed (0 = janvier)
): Promise<ActionResult<ScheduledPost[]>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: true, data: [] }

  const start = new Date(year, month, 1, 0, 0, 0, 0)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)

  try {
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.tenant_id, tenantId),
          gte(posts.scheduled_at, start),
          lte(posts.scheduled_at, end)
        )
      )
      .orderBy(asc(posts.scheduled_at))

    return { success: true, data: rows.map(mapPost) }
  } catch {
    return { success: true, data: [] }
  }
}

/**
 * Récupère les prochains posts planifiés (30 jours à venir).
 */
export async function getUpcomingPosts(limit = 20): Promise<ActionResult<ScheduledPost[]>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: true, data: [] }

  const now = new Date()
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  try {
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.tenant_id, tenantId),
          gte(posts.scheduled_at, now),
          lte(posts.scheduled_at, future),
          sql`${posts.status} IN ('scheduled', 'approved', 'review')`
        )
      )
      .orderBy(asc(posts.scheduled_at))
      .limit(limit)

    return { success: true, data: rows.map(mapPost) }
  } catch {
    return { success: true, data: [] }
  }
}

/**
 * Crée un nouveau post — utilise Supabase HTTP pour éviter les blocages Drizzle.
 */
export async function createPost(
  data: NewPostData
): Promise<ActionResult<ScheduledPost>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  const parsed = NewPostSchema.safeParse(data)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Données invalides"
    return { success: false, error: firstError }
  }

  const { title, content, platforms, scheduled_at, status, media_urls } = parsed.data
  const finalStatus = scheduled_at ? "scheduled" : status

  const { data: created, error } = await supabase
    .from("posts")
    .insert({
      tenant_id: tenantId,
      created_by: user.id,
      title: title || null,  // `||` : empty string → null (so chip affiche le contenu)
      content,
      platforms,
      status: finalStatus,
      scheduled_at: scheduled_at ?? null,
      media_urls: media_urls ?? [],
    })
    .select()
    .single()

  if (error || !created) {
    return { success: false, error: "Erreur lors de la création du post" }
  }

  return { success: true, data: mapPostRow(created as Record<string, unknown>) }
}

/**
 * Supprime un post.
 */
export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("tenant_id", tenantId)

  if (error) return { success: false, error: "Erreur lors de la suppression" }
  return { success: true, data: undefined }
}

/**
 * Met à jour le contenu, les plateformes et la date d'un post existant.
 */
export async function updatePost(
  postId: string,
  data: Partial<NewPostData>
): Promise<ActionResult<ScheduledPost>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  const UpdateSchema = z.object({
    title: z.string().max(500).trim().optional(),
    content: z.string().min(1, V.contentRequired).max(3000).trim().optional(),
    platforms: z
      .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
      .min(1, V.platformRequired)
      .optional(),
    scheduled_at: z.string().datetime({ offset: true }).optional().nullable(),
    status: z.enum(["draft", "review", "approved", "scheduled"]).optional(),
    media_urls: z.array(z.string().url()).max(10).optional(),
  })

  const parsed = UpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const { title, content, platforms, scheduled_at, status, media_urls } = parsed.data

  const finalStatus = scheduled_at
    ? "scheduled"
    : scheduled_at === null
    ? (status ?? "draft")
    : (status ?? undefined)

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updatePayload.title = title || null
  if (content) updatePayload.content = content
  if (platforms) updatePayload.platforms = platforms
  if (scheduled_at !== undefined) updatePayload.scheduled_at = scheduled_at ?? null
  if (finalStatus) updatePayload.status = finalStatus
  if (media_urls) updatePayload.media_urls = media_urls

  const { data: updated, error } = await supabase
    .from("posts")
    .update(updatePayload)
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error || !updated) return { success: false, error: "Post introuvable" }
  return { success: true, data: mapPostRow(updated as Record<string, unknown>) }
}

/**
 * Met à jour le statut d'un post.
 */
export async function updatePostStatus(
  postId: string,
  status: ScheduledPost["status"]
): Promise<ActionResult<ScheduledPost>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  const { data: updated, error } = await supabase
    .from("posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error || !updated) return { success: false, error: "Post introuvable" }
  return { success: true, data: mapPostRow(updated as Record<string, unknown>) }
}

/**
 * Duplique un post existant (en brouillon).
 */
export async function duplicatePost(postId: string): Promise<ActionResult<ScheduledPost>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  const { data: original, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !original) return { success: false, error: "Post introuvable" }

  const orig = original as Record<string, unknown>
  const { data: created, error: insertError } = await supabase
    .from("posts")
    .insert({
      tenant_id: tenantId,
      created_by: user.id,
      title: orig.title ? `${orig.title} (copie)` : null,
      content: orig.content,
      platforms: orig.platforms,
      status: "draft",
      media_urls: orig.media_urls ?? [],
    })
    .select()
    .single()

  if (insertError || !created) return { success: false, error: "Erreur lors de la duplication" }
  return { success: true, data: mapPostRow(created as Record<string, unknown>) }
}

/**
 * Récupère les posts sans date planifiée (brouillons, en révision, approuvés).
 */
export async function getDraftPosts(limit = 20): Promise<ActionResult<ScheduledPost[]>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: true, data: [] }

  try {
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.tenant_id, tenantId),
          sql`${posts.status} IN ('draft', 'review', 'approved')`,
          sql`${posts.scheduled_at} IS NULL`
        )
      )
      .orderBy(asc(posts.created_at))
      .limit(limit)

    return { success: true, data: rows.map(mapPost) }
  } catch {
    return { success: true, data: [] }
  }
}

/**
 * Replanifie un post à une nouvelle date (drag & drop calendrier).
 * Conserve l'heure d'origine si elle existait, sinon place à 09:00.
 */
export async function reschedulePost(
  postId: string,
  newDateISO: string
): Promise<ActionResult<ScheduledPost>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  // Récupérer le post actuel pour conserver l'heure
  const { data: existing } = await supabase
    .from("posts")
    .select("scheduled_at")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (!existing) return { success: false, error: "Post introuvable" }

  const existingRow = existing as Record<string, unknown>
  const newDate = new Date(newDateISO)
  if (existingRow.scheduled_at) {
    const oldDate = new Date(existingRow.scheduled_at as string)
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds())
  } else {
    newDate.setHours(9, 0, 0, 0)
  }

  const { data: updated, error } = await supabase
    .from("posts")
    .update({
      scheduled_at: newDate.toISOString(),
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .select()
    .single()

  if (error || !updated) return { success: false, error: "Erreur lors de la replanification" }
  return { success: true, data: mapPostRow(updated as Record<string, unknown>) }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SchedulerStats {
  publishedThisMonth: number
  scheduledUpcoming: number
  drafts: number
}

/**
 * Statistiques agrégées pour le dashboard.
 */
export async function getSchedulerStats(): Promise<ActionResult<SchedulerStats>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  try {
    const [publishedRow] = await db
      .select({ n: count() })
      .from(posts)
      .where(
        and(
          eq(posts.tenant_id, tenantId),
          eq(posts.status, "published"),
          gte(posts.published_at, startOfMonth),
          lte(posts.published_at, endOfMonth)
        )
      )

    const [scheduledRow] = await db
      .select({ n: count() })
      .from(posts)
      .where(
        and(
          eq(posts.tenant_id, tenantId),
          eq(posts.status, "scheduled"),
          gte(posts.scheduled_at, now)
        )
      )

    const [draftsRow] = await db
      .select({ n: count() })
      .from(posts)
      .where(
        and(
          eq(posts.tenant_id, tenantId),
          sql`${posts.status} IN ('draft', 'review', 'approved')`
        )
      )

    return {
      success: true,
      data: {
        publishedThisMonth: Number(publishedRow?.n ?? 0),
        scheduledUpcoming: Number(scheduledRow?.n ?? 0),
        drafts: Number(draftsRow?.n ?? 0),
      },
    }
  } catch {
    return { success: false, error: "Erreur lors du calcul des statistiques" }
  }
}

/**
 * Enqueue un post pour publication (immédiate ou programmée).
 * Conforme SOP-004 : statut → "scheduled" puis pg-boss prend le relais.
 */
export async function publishPost(
  postId: string,
  scheduledAt?: Date | null
): Promise<ActionResult<{ jobId: string | null }>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  // Vérifier que le post appartient au tenant
  const { data: post } = await supabase
    .from("posts")
    .select("id, status, platforms, scheduled_at")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (!post) return { success: false, error: "Post introuvable" }

  const p = post as Record<string, unknown>
  if (p.status === "publishing") {
    return { success: false, error: "Publication déjà en cours pour ce post." }
  }

  if (((p.platforms as string[]) ?? []).length === 0) {
    return { success: false, error: "Sélectionnez au moins une plateforme avant de publier." }
  }

  try {
    const dateToSchedule = scheduledAt ?? (p.scheduled_at as Date | null)
    await supabase
      .from("posts")
      .update({
        status: "scheduled",
        scheduled_at: dateToSchedule ? new Date(dateToSchedule).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("tenant_id", tenantId)

    const payload = { postId, tenantId }
    let jobId: string | null

    if (scheduledAt && scheduledAt > new Date()) {
      jobId = await enqueueScheduledPublish(payload, scheduledAt)
    } else {
      jobId = await enqueuePublish(payload)
    }

    return { success: true, data: { jobId } }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur lors de la mise en queue",
    }
  }
}
