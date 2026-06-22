"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { and, eq, gte, lte, asc, count, sql } from "drizzle-orm"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { normalizeBrandDNA } from "@/lib/services/brand-dna/normalize"

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
    id: string
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

    // ── Visuels générés ce mois-ci (bibliothèque réelle media_assets) ──
    let visualsCount = 0
    try {
      const { count: vc } = await supabase
        .from("media_assets")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("file_type", "image")
        .gte("created_at", startOfMonth.toISOString())
        .lte("created_at", endOfMonth.toISOString())
      visualsCount = vc ?? 0
    } catch {
      // table absente — reste 0
    }

    // ── Brand DNA score = complétude réelle des dimensions configurées ──
    let brandDnaScore: number | null = null
    try {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("brand_dna")
        .eq("id", tenantId)
        .single()

      if (tenant?.brand_dna) {
        const dna = normalizeBrandDNA(tenant.brand_dna)
        const checks: Array<string | undefined> = [
          dna.identity?.name,
          dna.identity?.sector,
          dna.identity?.positioning,
          dna.cognitive_objective,
          dna.culture_markets?.primary_culture,
          dna.editorial_tone?.register,
          (dna.color_palette?.length ?? 0) > 0 ? "ok" : undefined,
        ]
        const filled = checks.filter((v) => typeof v === "string" && v.trim().length > 0).length
        brandDnaScore = Math.round((filled / checks.length) * 100)
      }
    } catch {
      // Table inexistante ou erreur — brandDnaScore reste null
    }

    // ── Prochain post planifié ──
    let nextScheduledPost: DashboardStats["nextScheduledPost"] = null
    try {
      const [nextPost] = await db
        .select({
          id: posts.id,
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

      if (nextPost?.id && nextPost.scheduled_at) {
        nextScheduledPost = {
          id: nextPost.id,
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
