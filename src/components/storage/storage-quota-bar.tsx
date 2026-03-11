"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatBytes, PLAN_LABELS } from "@/lib/services/storage"
import type { QuotaStatus } from "@/lib/services/storage"

interface StorageQuotaBarProps {
  quota: QuotaStatus
  className?: string
}

export function StorageQuotaBar({ quota, className }: StorageQuotaBarProps) {
  const planLabel = PLAN_LABELS[quota.plan]

  if (quota.isUnlimited) {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Stockage — Plan <span className="font-medium text-foreground">{planLabel}</span></span>
          <span>{formatBytes(quota.usedBytes)} utilisés · Illimité</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full w-0 rounded-full bg-emerald-500" />
        </div>
      </div>
    )
  }

  const isWarning = quota.usedPercent >= 80
  const isCritical = quota.usedPercent >= 95

  const barColor = isCritical
    ? "bg-destructive"
    : isWarning
    ? "bg-amber-500"
    : "bg-emerald-500"

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Stockage —{" "}
          <span className="font-medium text-foreground">{planLabel}</span>
        </span>
        <span>
          {formatBytes(quota.usedBytes)} / {formatBytes(quota.quotaBytes)}
          {" "}
          <span className={cn("font-medium", isCritical && "text-destructive", isWarning && !isCritical && "text-amber-600 dark:text-amber-400")}>
            ({quota.usedPercent}%)
          </span>
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${quota.usedPercent}%` }}
        />
      </div>

      {isCritical && (
        <p className="text-xs text-destructive">
          Stockage presque plein. Supprimez des fichiers ou passez au plan supérieur.
        </p>
      )}
      {isWarning && !isCritical && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          80% du quota utilisé. {formatBytes(quota.availableBytes)} restants.
        </p>
      )}
    </div>
  )
}
