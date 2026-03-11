/**
 * Gestion des quotas de stockage par plan.
 * Vérifie l'utilisation actuelle avant chaque upload.
 */

export type Plan = "free" | "solo" | "pro" | "agency" | "agency_plus" | "enterprise"

// Quotas en bytes (-1 = illimité)
export const PLAN_STORAGE_QUOTAS: Record<Plan, number> = {
  free:         10 * 1024 * 1024,           //  10 MB
  solo:         50 * 1024 * 1024,           //  50 MB
  pro:          1 * 1024 * 1024 * 1024,     //   1 GB
  agency:      -1,                          // Illimité
  agency_plus: -1,                          // Illimité
  enterprise:  -1,                          // Illimité
}

export const PLAN_LABELS: Record<Plan, string> = {
  free:         "Free",
  solo:         "Solo",
  pro:          "Pro",
  agency:       "Agency",
  agency_plus:  "Agency+",
  enterprise:   "Enterprise",
}

export interface QuotaStatus {
  plan: Plan
  quotaBytes: number
  usedBytes: number
  availableBytes: number
  usedPercent: number
  isUnlimited: boolean
  hasCapacity: boolean
}

export interface QuotaCheckResult {
  allowed: boolean
  error?: string
  status: QuotaStatus
}

/**
 * Calcule le statut de quota d'un tenant.
 */
export function computeQuotaStatus(
  plan: Plan,
  usedBytes: number
): QuotaStatus {
  const quotaBytes = PLAN_STORAGE_QUOTAS[plan]
  const isUnlimited = quotaBytes === -1

  if (isUnlimited) {
    return {
      plan,
      quotaBytes: -1,
      usedBytes,
      availableBytes: -1,
      usedPercent: 0,
      isUnlimited: true,
      hasCapacity: true,
    }
  }

  const availableBytes = Math.max(0, quotaBytes - usedBytes)
  const usedPercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100))

  return {
    plan,
    quotaBytes,
    usedBytes,
    availableBytes,
    usedPercent,
    isUnlimited: false,
    hasCapacity: availableBytes > 0,
  }
}

/**
 * Vérifie si un upload est possible compte tenu du quota restant.
 */
export function checkQuota(
  plan: Plan,
  usedBytes: number,
  uploadSizeBytes: number
): QuotaCheckResult {
  const status = computeQuotaStatus(plan, usedBytes)

  if (status.isUnlimited) {
    return { allowed: true, status }
  }

  if (usedBytes + uploadSizeBytes > status.quotaBytes) {
    const needMB = ((usedBytes + uploadSizeBytes - status.quotaBytes) / (1024 * 1024)).toFixed(1)
    const planLabel = PLAN_LABELS[plan]
    const quotaMB = Math.round(status.quotaBytes / (1024 * 1024))

    return {
      allowed: false,
      error: `Quota de stockage dépassé (plan ${planLabel} : ${quotaMB} MB). Il manque ${needMB} MB. Passez au plan supérieur pour continuer.`,
      status,
    }
  }

  return { allowed: true, status }
}

/**
 * Formate une taille en bytes en chaîne lisible.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 0) return "Illimité"
  if (bytes === 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
