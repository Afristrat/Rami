"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { DocumentItem } from "@/lib/actions/documents.actions"

interface WorkspaceUsageProps {
  documents: DocumentItem[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function WorkspaceUsage({ documents }: WorkspaceUsageProps) {
  const t = useTranslations("documents")
  const totalBytes = documents.reduce(
    (acc, doc) => acc + (doc.file_size_bytes ?? 0),
    0
  )
  const docCount = documents.length
  // Jauge fictive pour le MVP (50 documents = 100 %)
  const usagePercent = Math.min((docCount / 50) * 100, 100)

  return (
    <div
      className={cn(
        "rounded-2xl p-5",
        "glass-card"
      )}
    >
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {t("workspace")}
      </p>
      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mb-2">
        <div
          className="bg-gradient-to-r from-violet-600 to-blue-600 h-full rounded-full transition-all duration-500"
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {docCount} document{docCount !== 1 ? "s" : ""} · {formatBytes(totalBytes)} {t("used")}
      </p>
    </div>
  )
}
