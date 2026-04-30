"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { posts, media } from "@/lib/db/schema"
import { and, eq, gte, lte, asc, count, sql } from "drizzle-orm"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  /** Nombre de posts publiés ce mois-ci */
  postsThisMonth: number
  /** Nombre de visuels/médias générés ce mois-ci */
  visualsGenerated: number
  /** Score Brand DNA (0-100), null si pas de Brand DNA */
  brandDnaScore: number | null
  /** Prochain post planifié */
  nextScheduledPost: {
    title: string
    scheduledAt: string // ISO string
  } | null
  /** Répartition par statut ce mois-ci */
  postsByStatus: {
    published: number
    scheduled: number
    draft: number
    failed: number
  }
}

// ── Action principale ────────────────────────────────────────────────────────

/**
 * Récupère toutes les statistiques du dashboard pour le tenant courant.
 * Gère gracieusement les tables inexistantes (retourne des valeurs par défaut).
 */
export async function getDashboardStatsAction(): Promise<
  { success: true; data: DashboardStats } | { success: false; error: string }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "Non authentifié" }
    }

    const tenantId = await resolveUserTenant(supabase, user.id)
    if (!tenantId) {
      return { success: false, error: "Aucun espace de travail trouvé" }
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // ── Posts publiés ce mois-ci ──
    const publishedCount = await safeCount(() =>
      db
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
    )

    // ── Posts planifiés (à venir) ──
    const scheduledCount = await safeCount(() =>
      db
        .select({ n: count() })
        .from(posts)
        .where(
          and(
            eq(posts.tenant_id, tenantId),
            eq(posts.status, "scheduled"),
            gte(posts.scheduled_at, now)
          )
        )
    )

    // ── Brouillons (draft + review + approved) ──
    const draftCount = await safeCount(() =>
      db
        .select({ n: count() })
        .from(posts)
        .where(
          and(
            eq(posts.tenant_id, tenantId),
            sql`${posts.status} IN ('draft', 'review', 'approved')`
          )
        )
    )

    // ── Posts échoués ce mois-ci ──
    const failedCount = await safeCount(() =>
      db
        .select({ n: count() })
        .from(posts)
        .where(
          and(
            eq(posts.tenant_id, tenantId),
            eq(posts.status, "failed"),
            gte(posts.updated_at, startOfMonth),
            lte(posts.updated_at, endOfMonth)
          )
        )
    )

    // ── Visuels/médias générés ce mois-ci ──
    const visualsCount = await safeCount(() =>
      db
        .select({ n: count() })
        .from(media)
        .where(
          and(
            eq(media.tenant_id, tenantId),
            gte(media.created_at, startOfMonth),
            lte(media.created_at, endOfMonth)
          )
        )
    )

    // ── Brand DNA score ──
    let brandDnaScore: number | null = null
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("brand_dna")
        .eq("id", tenantId)
        .single()

      if (tenant?.brand_dna) {
        const dna = tenant.brand_dna as Record<string, unknown>
        if (typeof dna.dna_score === "number") {
          brandDnaScore = Math.round(dna.dna_score * 100)
        }
      }
    } catch {
      // Table inexistante ou erreur — brandDnaScore reste null
    }

    // ── Prochain post planifié ──
    let nextScheduledPost: DashboardStats["nextScheduledPost"] = null
    try {
      const [nextPost] = await db
        .select({
          title: posts.title,
          content: posts.content,
          scheduled_at: posts.scheduled_at,
        })
        .from(posts)
        .where(
          and(
            eq(posts.tenant_id, tenantId),
            eq(posts.status, "scheduled"),
            gte(posts.scheduled_at, now)
          )
        )
        .orderBy(asc(posts.scheduled_at))
        .limit(1)

      if (nextPost?.scheduled_at) {
        nextScheduledPost = {
          title: nextPost.title ?? nextPost.content.slice(0, 40),
          scheduledAt: nextPost.scheduled_at.toISOString(),
        }
      }
    } catch {
      // Table inexistante — nextScheduledPost reste null
    }

    return {
      success: true,
      data: {
        postsThisMonth: publishedCount,
        visualsGenerated: visualsCount,
        brandDnaScore,
        nextScheduledPost,
        postsByStatus: {
          published: publishedCount,
          scheduled: scheduledCount,
          draft: draftCount,
          failed: failedCount,
        },
      },
    }
  } catch {
    // Erreur globale inattendue — retourner des valeurs par défaut
    return {
      success: true,
      data: {
        postsThisMonth: 0,
        visualsGenerated: 0,
        brandDnaScore: null,
        nextScheduledPost: null,
        postsByStatus: {
          published: 0,
          scheduled: 0,
          draft: 0,
          failed: 0,
        },
      },
    }
  }
}

// ── Helper : count sécurisé (gère tables inexistantes) ───────────────────────

async function safeCount(
  queryFn: () => Promise<{ n: number }[]>
): Promise<number> {
  try {
    const [row] = await queryFn()
    return Number(row?.n ?? 0)
  } catch {
    return 0
  }
}
