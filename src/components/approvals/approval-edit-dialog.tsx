"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Sparkles, Loader2, Save, Maximize2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  updateDraftContentAction,
  improveDraftAction,
} from "@/lib/actions/approval-board.actions"
import type { ApprovalItem } from "./approval-card"

interface ApprovalEditDialogProps {
  /** Post en cours d'édition, ou `null` quand la modale est fermée. */
  item: ApprovalItem | null
  onClose: () => void
  /** Appelé après un enregistrement réussi (rafraîchit le board). */
  onSaved: () => void
}

export function ApprovalEditDialog({ item, onClose, onSaved }: ApprovalEditDialogProps) {
  const t = useTranslations("approvals")
  const router = useRouter()
  // Le parent remonte ce composant via `key={item.id}` → l'état initial reflète
  // toujours le post courant, sans useEffect (pattern « reset state via key »).
  const [content, setContent] = useState(item?.content ?? "")
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)

  const handleImprove = async () => {
    if (!item) return
    setImproving(true)
    const res = await improveDraftAction({ content, platform: item.platform })
    setImproving(false)
    if (res.success) {
      setContent(res.content)
      toast.success(t("improveSuccess"))
    } else {
      toast.error(t("improveError"))
    }
  }

  const handleSave = async () => {
    if (!item) return
    setSaving(true)
    const res = await updateDraftContentAction(item.id, content)
    setSaving(false)
    if (res.success) {
      toast.success(t("saveSuccess"))
      onSaved()
      onClose()
    } else {
      toast.error(t("saveError"))
    }
  }

  const busy = saving || improving
  const canSave = content.trim().length > 0 && content.trim() !== (item?.content ?? "").trim()

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            {t("contentLabel")}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={3000}
            disabled={busy}
            className="w-full resize-y rounded-lg border border-border/60 bg-muted/30 dark:bg-white/[0.04] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40 disabled:opacity-60"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <button
              type="button"
              onClick={handleImprove}
              disabled={busy || content.trim().length < 5}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-2.5 py-1 text-[11px] font-semibold text-violet-500 transition-colors hover:bg-violet-500/25 disabled:opacity-50"
            >
              {improving ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              {improving ? t("improving") : t("improveWithAI")}
            </button>
            <span>{content.length} / 3000</span>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => item && router.push(`/dashboard/create?post=${item.id}`)}
            disabled={busy || !item}
            className="mr-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-violet-500 transition-colors hover:text-violet-400 disabled:opacity-50"
          >
            <Maximize2 className="size-3.5" />
            {t("openInWorkflow")}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !canSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {saving ? t("saving") : t("save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
