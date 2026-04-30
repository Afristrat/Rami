import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { DocumentStatus } from "@/lib/schemas/document.schema"

const STATUS_CONFIG: Record<DocumentStatus, { labelKey: string; className: string }> = {
  draft: {
    labelKey: "statusDraft",
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
  },
  in_progress: {
    labelKey: "statusInProgress",
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  completed: {
    labelKey: "statusCompleted",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
}

interface DocumentStatusBadgeProps {
  status: DocumentStatus
  className?: string
}

export function DocumentStatusBadge({ status, className }: DocumentStatusBadgeProps) {
  const t = useTranslations("documents")
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
        config.className,
        className
      )}
    >
      {t(config.labelKey)}
    </span>
  )
}
