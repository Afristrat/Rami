"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { posts, users } from "@/lib/db/schema"
import { and, eq, gte, lte, asc, count, sql } from "drizzle-orm"
import { z } from "zod"
import type { ScheduledPost } from "@/lib/scheduler/types"
import type { Platform } from "@/lib/scheduler/platform-config"

// ── Schémas de validation ───────────────────────────────────────────────────

const NewPostSchema = z.object({
  title: z.string().max(500).trim().optional(),
  content: z
    .string()
    .min(1, "Le contenu est requis")
    .max(3000, "Contenu trop long")
    .trim(),
  platforms: z
    .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
    .min(1, "Sélectionnez au moins une plateforme"),
  scheduled_at: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(["draft", "review", "approved", "scheduled"]).default("draft"),
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

  const row = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { tenant_id: true },
  })

  return row?.tenant_id ?? null
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

// ── Actions publiques ────────────────────────────────────────────────────────

/**
 * Récupère les posts d'un mois donné pour le calendrier.
 */
export async function getPostsForMonth(
  year: number,
  month: number // 0-indexed (0 = janvier)
): Promise<ActionResult<ScheduledPost[]>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

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
    return { success: false, error: "Erreur lors du chargement des posts" }
  }
}

/**
 * Récupère les prochains posts planifiés (30 jours à venir).
 */
export async function getUpcomingPosts(limit = 20): Promise<ActionResult<ScheduledPost[]>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

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
          lte(posts.scheduled_at, future)
        )
      )
      .orderBy(asc(posts.scheduled_at))
      .limit(limit)

    return { success: true, data: rows.map(mapPost) }
  } catch {
    return { success: false, error: "Erreur lors du chargement des posts" }
  }
}

/**
 * Crée un nouveau post.
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

  const { title, content, platforms, scheduled_at, status } = parsed.data

  // Si scheduled_at fourni, forcer le statut "scheduled"
  const finalStatus = scheduled_at ? "scheduled" : status

  try {
    const [created] = await db
      .insert(posts)
      .values({
        tenant_id: tenantId,
        created_by: user.id,
        title: title ?? null,
        content,
        platforms: platforms as typeof posts.$inferInsert["platforms"],
        status: finalStatus,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
      })
      .returning()

    return { success: true, data: mapPost(created) }
  } catch {
    return { success: false, error: "Erreur lors de la création du post" }
  }
}

/**
 * Supprime un post.
 */
export async function deletePost(postId: string): Promise<ActionResult> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  try {
    await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.tenant_id, tenantId)))

    return { success: true, data: undefined }
  } catch {
    return { success: false, error: "Erreur lors de la suppression" }
  }
}

/**
 * Met à jour le contenu, les plateformes et la date d'un post existant.
 */
export async function updatePost(
  postId: string,
  data: Partial<NewPostData>
): Promise<ActionResult<ScheduledPost>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  const UpdateSchema = z.object({
    title: z.string().max(500).trim().optional(),
    content: z.string().min(1, "Le contenu est requis").max(3000).trim().optional(),
    platforms: z
      .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
      .min(1, "Sélectionnez au moins une plateforme")
      .optional(),
    scheduled_at: z.string().datetime({ offset: true }).optional().nullable(),
    status: z.enum(["draft", "review", "approved", "scheduled"]).optional(),
  })

  const parsed = UpdateSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const { title, content, platforms, scheduled_at, status } = parsed.data
  const finalStatus = scheduled_at ? "scheduled" : (status ?? undefined)

  try {
    const [updated] = await db
      .update(posts)
      .set({
        ...(title !== undefined && { title: title ?? null }),
        ...(content && { content }),
        ...(platforms && { platforms: platforms as typeof posts.$inferInsert["platforms"] }),
        ...(scheduled_at !== undefined && { scheduled_at: scheduled_at ? new Date(scheduled_at) : null }),
        ...(finalStatus && { status: finalStatus }),
        updated_at: new Date(),
      })
      .where(and(eq(posts.id, postId), eq(posts.tenant_id, tenantId)))
      .returning()

    if (!updated) return { success: false, error: "Post introuvable" }
    return { success: true, data: mapPost(updated) }
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour" }
  }
}

/**
 * Met à jour le statut d'un post.
 */
export async function updatePostStatus(
  postId: string,
  status: ScheduledPost["status"]
): Promise<ActionResult<ScheduledPost>> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Non authentifié" }

  try {
    const [updated] = await db
      .update(posts)
      .set({ status, updated_at: new Date() })
      .where(and(eq(posts.id, postId), eq(posts.tenant_id, tenantId)))
      .returning()

    if (!updated) return { success: false, error: "Post introuvable" }
    return { success: true, data: mapPost(updated) }
  } catch {
    return { success: false, error: "Erreur lors de la mise à jour" }
  }
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

  try {
    const original = await db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.tenant_id, tenantId)),
    })

    if (!original) return { success: false, error: "Post introuvable" }

    const [created] = await db
      .insert(posts)
      .values({
        tenant_id: tenantId,
        created_by: user.id,
        title: original.title ? `${original.title} (copie)` : null,
        content: original.content,
        platforms: original.platforms,
        status: "draft",
        media_urls: original.media_urls,
      })
      .returning()

    return { success: true, data: mapPost(created) }
  } catch {
    return { success: false, error: "Erreur lors de la duplication" }
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface SchedulerStats {
  publishedThisMonth: number
  scheduledUpcoming: number
  drafts: number
}

/**
 * Statistiques agrégées pour le dashboard.
 * - publishedThisMonth : posts publiés dans le mois calendaire courant
 * - scheduledUpcoming  : posts planifiés dans le futur
 * - drafts             : brouillons (draft + review + approved)
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
