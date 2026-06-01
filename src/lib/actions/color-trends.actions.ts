"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { colorTrendReports, tenants } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { hasFeatureAccess, type Plan } from "@/lib/billing/plans"
import { log } from "@/lib/utils/logger"
import { generateColorTrendReport } from "@/lib/services/reports/color-trends-generator"
import type { ColorTrendReport } from "@/lib/services/reports/color-trends"

interface AuthContext {
  userId: string
  tenantId: string
  plan: Plan
  sector: string | null
  culture: string | null
}

/** Lit un champ string d'un brand_dna (shape PLATE, variantes FR tolérées). */
function pickString(src: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = src[k]
    if (typeof v === "string" && v.trim().length > 0) return v
  }
  return null
}

async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return null

  const row = await db
    .select({ plan: tenants.plan, brand_dna: tenants.brand_dna })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)

  const dna = (row[0]?.brand_dna as Record<string, unknown> | null) ?? {}
  return {
    userId: user.id,
    tenantId,
    plan: (row[0]?.plan as Plan) ?? "free",
    sector: pickString(dna, "sector", "secteur"),
    culture: pickString(dna, "primaryCulture", "marchePrimaire"),
  }
}

export type GetColorTrendResult =
  | { success: true; data: { report: ColorTrendReport; generatedAt: string } | null }
  | { success: false; error: string }

/** Récupère le dernier rapport couleur du tenant (null si aucun généré). */
export async function getColorTrendReportAction(): Promise<GetColorTrendResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }
  if (!hasFeatureAccess(ctx.plan, "performance_loop")) {
    return { success: false, error: "Fonctionnalité réservée aux plans Pro et supérieurs." }
  }

  try {
    const rows = await db
      .select()
      .from(colorTrendReports)
      .where(eq(colorTrendReports.tenant_id, ctx.tenantId))
      .orderBy(desc(colorTrendReports.generated_at))
      .limit(1)

    if (rows.length === 0) return { success: true, data: null }
    return {
      success: true,
      data: {
        report: rows[0].report as ColorTrendReport,
        generatedAt: rows[0].generated_at.toISOString(),
      },
    }
  } catch (err) {
    log({
      level: "error",
      module: "color-trends",
      action: "get_report",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de la récupération du rapport couleur",
      metadata: { error: String(err) },
    })
    return { success: false, error: "Impossible de charger le rapport." }
  }
}

export type GenerateColorTrendResult =
  | { success: true; data: { report: ColorTrendReport; generatedAt: string } }
  | { success: false; error: string }

/** Génère (ou régénère) le rapport couleur MENA du tenant pour la période courante. */
export async function generateColorTrendReportAction(): Promise<GenerateColorTrendResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }
  if (!hasFeatureAccess(ctx.plan, "performance_loop")) {
    return { success: false, error: "Fonctionnalité réservée aux plans Pro et supérieurs." }
  }
  if (!ctx.sector) {
    return {
      success: false,
      error: "Secteur du Brand DNA requis. Complétez d'abord votre Brand DNA.",
    }
  }

  // Culture par défaut = Maroc (marché primaire MENA de RAMI) si non renseignée.
  const culture = ctx.culture ?? "maroc"

  try {
    const report = await generateColorTrendReport(ctx.tenantId, ctx.sector, culture)
    log({
      level: "info",
      module: "color-trends",
      action: "report_generated",
      tenant_id: ctx.tenantId,
      message: `Rapport couleur généré (${report.period})`,
      metadata: { sector: ctx.sector, culture, period: report.period, data: report.dataAvailability },
    })
    return { success: true, data: { report, generatedAt: new Date().toISOString() } }
  } catch (err) {
    log({
      level: "error",
      module: "color-trends",
      action: "generate_report",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de la génération du rapport couleur",
      metadata: { error: String(err) },
    })
    return { success: false, error: "Impossible de générer le rapport." }
  }
}
