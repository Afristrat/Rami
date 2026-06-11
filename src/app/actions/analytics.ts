"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { log } from "@/lib/utils/logger"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { Platform } from "@/lib/scheduler/platform-config"
import type { AnalyticsData, PeriodOption } from "@/lib/services/analytics/aggregate"
import { fetchAnalyticsBundle } from "@/lib/services/analytics/fetch"
import { topFeatures, type AttributionDimension } from "@/lib/services/metrics/attribution"
import { buildAiRecommendations, type AiRecommendation } from "@/lib/services/analytics/recommendations"

export type { AiRecommendation } from "@/lib/services/analytics/recommendations"

// Ré-exports : les composants importent ces types depuis cette action.
export type {
  AnalyticsData,
  KPIData,
  DailyEngagement,
  PostStatusData,
  TopPost,
  PeriodOption,
} from "@/lib/services/analytics/aggregate"

// ── Helpers I/O ────────────────────────────────────────────────────────────────

async function getTenantId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  try {
    const row = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { tenant_id: true },
    })
    return row?.tenant_id ?? null
  } catch {
    // DB direct (Drizzle) indisponible — l'isolation tenant via RLS Supabase reste le filet.
    return null
  }
}

/** Dimensions d'attribution exploitées pour les recommandations IA. */
const RECO_DIMENSIONS: AttributionDimension[] = [
  "scheduled_hour",
  "dominant_color_hex",
  "format",
  "platform",
  "cognitive_objective",
]

/**
 * Recommandations IA fondées sur l'attribution RÉELLE du tenant (US-007).
 * Retourne [] si aucune dimension n'a assez d'échantillon (état vide honnête).
 */
export async function getAiRecommendationsAction(): Promise<AiRecommendation[]> {
  const tenantId = await getTenantId()
  if (!tenantId) return []
  try {
    const results = await Promise.all(
      RECO_DIMENSIONS.map((d) =>
        topFeatures(tenantId, null, d).catch(() => null)
      )
    )
    return buildAiRecommendations(results)
  } catch {
    return []
  }
}

// ── Action principale ─────────────────────────────────────────────────────────

export async function getAnalyticsData(
  period: PeriodOption = "30d",
  platforms?: Platform[]
): Promise<{ success: true; data: AnalyticsData } | { success: false; error: string }> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Données analytics indisponibles" }

  try {
    const { data } = await fetchAnalyticsBundle(tenantId, period, platforms)
    return { success: true, data }
  } catch (error) {
    log({ level: "error", module: "analytics", action: "getAnalyticsData_error", metadata: { error: error instanceof Error ? error.message : String(error) } })
    return { success: false, error: "Erreur lors du chargement des analytics" }
  }
}
