// ============================================================
// Persistance du workflow — validation d'enveloppe de l'état
//
// Module PUR (zéro I/O) : valide la FORME d'un WorkflowState avant
// stockage/restauration (jsonb propre au tenant, re-consommé par le même
// client React — le contenu détaillé des steps n'est pas re-validé champ
// par champ, mais l'enveloppe est bornée et typée pour rejeter tout objet
// forgé ou corrompu).
// ============================================================

import type { WorkflowState } from "@/lib/schemas/workflow.schema"

/** Taille maximale de l'état sérialisé (les visuels sont des URLs, pas des binaires). */
export const MAX_STATE_BYTES = 500_000

export type EnvelopeResult =
  | { valid: true; state: WorkflowState; title: string | null; currentStep: number }
  | { valid: false; reason: "not_object" | "bad_step" | "bad_shape" | "too_large" | "empty" }

function isPlainObjectOrNull(value: unknown): boolean {
  return value === null || (typeof value === "object" && !Array.isArray(value))
}

/**
 * Valide l'enveloppe d'un état de workflow reçu du client (ou relu de la DB).
 * Refuse : non-objet, étape hors 1-7, steps non objet/null, état vide
 * (rien à reprendre), état trop volumineux.
 */
export function parseWorkflowStateEnvelope(input: unknown): EnvelopeResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, reason: "not_object" }
  }
  const candidate = input as Record<string, unknown>

  const step = candidate.currentStep
  if (typeof step !== "number" || !Number.isInteger(step) || step < 1 || step > 7) {
    return { valid: false, reason: "bad_step" }
  }

  for (const key of ["step1", "step2", "step3", "step4", "step5", "step6", "step7"]) {
    if (!(key in candidate) || !isPlainObjectOrNull(candidate[key])) {
      return { valid: false, reason: "bad_shape" }
    }
  }

  // Rien à persister/reprendre sans au moins un brief
  const step1 = candidate.step1 as Record<string, unknown> | null
  if (!step1) return { valid: false, reason: "empty" }

  if (JSON.stringify(candidate).length > MAX_STATE_BYTES) {
    return { valid: false, reason: "too_large" }
  }

  const title =
    typeof step1.titre === "string" && step1.titre.trim().length > 0
      ? step1.titre.trim().slice(0, 200)
      : null

  return {
    valid: true,
    state: candidate as unknown as WorkflowState,
    title,
    currentStep: step,
  }
}
