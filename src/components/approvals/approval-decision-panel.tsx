"use client"

import { useState, useTransition } from "react"
import { decideApprovalAction } from "@/lib/actions/approval.actions"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface DecisionLabels {
  approve: string
  reject: string
  commentLabel: string
  commentPlaceholder: string
  approvedTitle: string
  approvedDesc: string
  rejectedTitle: string
  rejectedDesc: string
  decisionError: string
  submitting: string
}

/**
 * Panneau de décision de la page publique /approve/[token].
 * Labels traduits côté serveur et passés en props (page hors provider i18n client).
 */
export function ApprovalDecisionPanel({ token, labels }: { token: string; labels: DecisionLabels }) {
  const [isPending, startTransition] = useTransition()
  const [comment, setComment] = useState("")
  const [result, setResult] = useState<"approved" | "rejected" | null>(null)
  const [error, setError] = useState(false)

  function decide(decision: "approved" | "rejected") {
    setError(false)
    startTransition(async () => {
      const res = await decideApprovalAction(token, decision, comment)
      if (res.success) {
        setResult(res.decision)
      } else {
        setError(true)
      }
    })
  }

  if (result) {
    const approved = result === "approved"
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 px-6 py-10 text-center">
        {approved ? (
          <CheckCircle2 className="size-10 text-green-500" />
        ) : (
          <XCircle className="size-10 text-amber-500" />
        )}
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {approved ? labels.approvedTitle : labels.rejectedTitle}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {approved ? labels.approvedDesc : labels.rejectedDesc}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-5">
      <div>
        <label htmlFor="approval-comment" className="mb-2 block text-xs font-medium text-slate-600 dark:text-slate-300">
          {labels.commentLabel}
        </label>
        <textarea
          id="approval-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder={labels.commentPlaceholder}
          className={cn(
            "w-full resize-none rounded-xl border-0 bg-slate-50 dark:bg-white/[0.04] p-3 text-sm",
            "text-slate-800 dark:text-slate-200 placeholder:text-slate-400",
            "outline-none transition-all focus:ring-2 focus:ring-violet-500/40"
          )}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
          {labels.decisionError}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => decide("approved")}
          disabled={isPending}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3",
            "bg-gradient-to-r from-green-600 to-emerald-600 text-sm font-bold text-white",
            "shadow-lg shadow-green-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          )}
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          {isPending ? labels.submitting : labels.approve}
        </button>
        <button
          type="button"
          onClick={() => decide("rejected")}
          disabled={isPending}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3",
            "border border-amber-300 dark:border-amber-700/40 text-sm font-semibold text-amber-700 dark:text-amber-400",
            "transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <XCircle className="size-4" />
          {labels.reject}
        </button>
      </div>
    </div>
  )
}
