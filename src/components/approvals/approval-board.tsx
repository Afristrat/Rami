"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { ClipboardCheck, Inbox, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ApprovalCard,
  type ApprovalItem,
  type ApprovalStatus,
} from "./approval-card"
import { ApprovalEditDialog } from "./approval-edit-dialog"
import type { Platform } from "@/lib/scheduler/platform-config"
import {
  getApprovalBoardAction,
  decideInternalApprovalAction,
} from "@/lib/actions/approval-board.actions"
import { publishPost } from "@/app/actions/scheduler"

// ── Config colonnes ──────────────────────────────────────────────────────────

const COLUMNS: { status: ApprovalStatus; labelKey: string; color: string }[] = [
  { status: "pending_approval", labelKey: "pending", color: "text-amber-500" },
  { status: "approved", labelKey: "approved", color: "text-emerald-500" },
  { status: "rejected", labelKey: "rejected", color: "text-red-500" },
]

// ── Composant ────────────────────────────────────────────────────────────────

export function ApprovalBoard() {
  const t = useTranslations("approvals")
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<ApprovalItem | null>(null)

  const refresh = useCallback(async () => {
    const { items: boardItems } = await getApprovalBoardAction()
    setItems(
      boardItems.map((it) => ({
        ...it,
        platform: it.platform as Platform,
      }))
    )
  }, [])

  useEffect(() => {
    let cancelled = false
    getApprovalBoardAction()
      .then(({ items: boardItems }) => {
        if (cancelled) return
        setItems(
          boardItems.map((it) => ({ ...it, platform: it.platform as Platform }))
        )
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleApprove = useCallback(
    async (id: string) => {
      const res = await decideInternalApprovalAction(id, "approved")
      if (res.success) {
        toast.success(t("approveSuccess"))
        await refresh()
      } else {
        toast.error(t("actionError"))
      }
    },
    [t, refresh]
  )

  const handleReject = useCallback(
    async (id: string, comment: string) => {
      const res = await decideInternalApprovalAction(id, "rejected", comment)
      if (res.success) {
        toast.success(t("rejectSuccess"))
        await refresh()
      } else {
        toast.error(t("actionError"))
      }
    },
    [t, refresh]
  )

  const handlePublish = useCallback(
    async (id: string) => {
      const res = await publishPost(id)
      if (res.success) {
        toast.success(t("publishSuccess"))
        await refresh()
      } else {
        toast.error(res.error || t("actionError"))
      }
    },
    [t, refresh]
  )

  // Ouvre la modale d'édition sur la carte choisie (fonction simple : dépend de
  // `items` qui change à chaque refresh — éviter useCallback côté React Compiler).
  const handleEdit = (id: string) => {
    setEditingItem(items.find((it) => it.id === id) ?? null)
  }

  // Le commentaire est local (textarea) ; il est persisté au moment du rejet.
  const handleUpdateComment = useCallback((id: string, comment: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment } : item))
    )
  }, [])

  const getItemsByStatus = (status: ApprovalStatus) =>
    items.filter((item) => item.status === status)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck className="size-5 text-violet-500" />
          <h1 className="text-xl font-bold text-foreground dark:text-white">
            {t("title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        /* Kanban board */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const columnItems = getItemsByStatus(col.status)

            return (
              <div key={col.status} className="flex flex-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        col.color
                      )}
                    >
                      {t(col.labelKey)}
                    </span>
                    <span className="inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                      {columnItems.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-3 min-h-[200px]">
                  {columnItems.length > 0 ? (
                    columnItems.map((item) => (
                      <ApprovalCard
                        key={item.id}
                        item={item}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onPublish={handlePublish}
                        onEdit={handleEdit}
                        onUpdateComment={handleUpdateComment}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-dashed border-border glass-card">
                      <Inbox className="size-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("noItems")}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 text-center px-4">
                        {t("noItemsDesc")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ApprovalEditDialog
        key={editingItem?.id ?? "none"}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={refresh}
      />
    </div>
  )
}
