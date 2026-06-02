/**
 * Quotas de génération — consommation et reset mensuel (US-020).
 *
 * Le compteur `tenants.generation_count` est borné par plan (PLAN_GENERATION_QUOTAS)
 * et se réinitialise tous les 30 jours via `generation_reset_at`. Le reset est
 * appliqué de façon PARESSEUSE (lazy) côté serveur — sans dépendre du cron de
 * réconciliation — pour que le quota soit réellement mensuel même si le cron est en
 * retard. Les fonctions de calcul sont PURES (testables sans DB).
 */

import { sql, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { tenants } from "@/lib/db/schema"

/** Durée d'une période de quota (30 jours). */
export const GENERATION_PERIOD_MS = 30 * 24 * 60 * 60 * 1000

/** Indique si la période est expirée (reset dû). PURE. */
export function shouldResetGenerations(resetAt: Date | null, now: Date): boolean {
  return resetAt !== null && resetAt.getTime() < now.getTime()
}

/**
 * Compteur effectif pour la vérification de quota : 0 si la période est expirée
 * (le reset sera matérialisé à la prochaine consommation), sinon la valeur stockée. PURE.
 */
export function effectiveGenerationCount(
  count: number,
  resetAt: Date | null,
  now: Date
): number {
  return shouldResetGenerations(resetAt, now) ? 0 : count
}

/**
 * Incrémente le compteur de générations d'un tenant de façon ATOMIQUE et reset-aware :
 * si la période est expirée, repart de 1 et fixe la prochaine échéance à +30 jours ;
 * sinon incrémente simplement. Une seule requête → pas de course.
 */
export async function incrementGenerationCount(tenantId: string): Promise<void> {
  await db
    .update(tenants)
    .set({
      generation_count: sql`CASE
        WHEN ${tenants.generation_reset_at} IS NOT NULL AND ${tenants.generation_reset_at} < now()
        THEN 1
        ELSE ${tenants.generation_count} + 1 END`,
      generation_reset_at: sql`CASE
        WHEN ${tenants.generation_reset_at} IS NULL OR ${tenants.generation_reset_at} < now()
        THEN now() + interval '30 days'
        ELSE ${tenants.generation_reset_at} END`,
      updated_at: new Date(),
    })
    .where(eq(tenants.id, tenantId))
}
