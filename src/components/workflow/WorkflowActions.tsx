"use client"

import { cn } from "@/lib/utils"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import { useTranslations } from "next-intl"

interface WorkflowActionsProps {
  onBack?: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  nextDisabled?: boolean
  isPending?: boolean
  showDraftStatus?: boolean
  className?: string
}

export function WorkflowActions({
  onBack,
  onNext,
  backLabel,
  nextLabel,
  nextDisabled = false,
  isPending = false,
  showDraftStatus = true,
  className,
}: WorkflowActionsProps) {
  const t = useTranslations("common")
  const tw = useTranslations("workflow.brief")

  return (
    <div className={cn(
      "flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/10",
      className,
    )}>
      {/* Draft status */}
      {showDraftStatus && (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          <Save className="size-3.5" />
          {tw("draftSaved")}
        </div>
      )}

      <div className="flex gap-4 ml-auto">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            className={cn(
              "px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10",
              "text-sm font-semibold text-slate-700 dark:text-slate-300",
              "hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center gap-2"
            )}
          >
            <ArrowLeft className="size-4" />
            {backLabel ?? t("previous")}
          </button>
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isPending}
            className={cn(
              "px-8 py-2.5 rounded-xl",
              "bg-gradient-to-r from-violet-600 to-blue-600",
              "text-white text-sm font-bold",
              "shadow-lg shadow-violet-500/20",
              "hover:scale-[1.02] active:scale-[0.98] transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "flex items-center gap-2"
            )}
          >
            {isPending ? (
              <>
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("loading")}
              </>
            ) : (
              <>
                {nextLabel ?? t("next")}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
