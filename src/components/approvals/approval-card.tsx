"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"
import {
  Check,
  X,
  Send,
  Pencil,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PlatformBadge } from "@/components/scheduler/PlatformBadge"
import type { Platform } from "@/lib/scheduler/platform-config"

// ── Types ────────────────────────────────────────────────────────────────────

export type ApprovalStatus = "pending_approval" | "approved" | "rejected"

export interface ApprovalItem {
  id: string
  content: string
  platform: Platform
  thumbnailUrl: string | null
  authorName: string
  submittedAt: string
  status: ApprovalStatus
  /** Vrai si le post est un brouillon (badge « Brouillon » au lieu de « En attente »). */
  isDraft?: boolean
  comment: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ApprovalStatus, string> = {
  pending_approval: "bg-amber-500/15 text-amber-500",
  approved: "bg-emerald-500/15 text-emerald-500",
  rejected: "bg-red-500/15 text-red-500",
}

function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr))
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Composant ────────────────────────────────────────────────────────────────

interface ApprovalCardProps {
  item: ApprovalItem
  onApprove: (id: string) => void
  onReject: (id: string, comment: string) => void
  onPublish: (id: string) => void
  onEdit: (id: string) => void
  onUpdateComment: (id: string, comment: string) => void
}

export function ApprovalCard({
  item,
  onApprove,
  onReject,
  onPublish,
  onEdit,
  onUpdateComment,
}: ApprovalCardProps) {
  const t = useTranslations("approvals")
  const intlLocale = useIntlLocale()
  const [showComment, setShowComment] = useState(false)
  const [localComment, setLocalComment] = useState(item.comment)

  const initials = getInitials(item.authorName)
  const avatarColor = getAvatarColor(item.authorName)

  return (
    <div className="glass-card rounded-xl p-4 transition-all hover:shadow-md hover:border-violet-300/30 dark:hover:border-violet-500/20">
      {/* Status badge + Platform */}
      <div className="flex items-center justify-between mb-3">
        <PlatformBadge platform={item.platform} size="xs" />
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
            STATUS_STYLES[item.status]
          )}
        >
          {t(item.status === "pending_approval" ? "pending" : item.status)}
        </span>
      </div>

      {/* Thumbnail */}
      {item.thumbnailUrl && (
        <div className="mb-3 overflow-hidden rounded-lg bg-muted/30 dark:bg-white/[0.04]">
          <div className="flex aspect-video items-center justify-center">
            <ImageIcon className="size-8 text-muted-foreground/30" />
          </div>
        </div>
      )}

      {/* Content preview */}
      <p className="mb-3 text-sm text-foreground dark:text-white/90 line-clamp-2 leading-relaxed">
        {item.content}
      </p>

      {/* Author + date */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white",
            avatarColor
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <User className="size-3 shrink-0" />
            <span className="truncate">{item.authorName}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <Calendar className="size-3" />
          {formatDate(item.submittedAt, intlLocale)}
        </div>
      </div>

      {/* Comment section */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setShowComment(!showComment)}
          className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showComment ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
          {t("addComment")}
        </button>
        {showComment && (
          <textarea
            value={localComment}
            onChange={(e) => {
              setLocalComment(e.target.value)
              onUpdateComment(item.id, e.target.value)
            }}
            placeholder={t("addComment")}
            rows={2}
            className="mt-2 w-full resize-none rounded-lg border border-border/60 bg-muted/30 dark:bg-white/[0.04] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {item.status === "pending_approval" && (
          <>
            <button
              type="button"
              onClick={() => onApprove(item.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/25"
            >
              <Check className="size-3.5" />
              {t("approve")}
            </button>
            <button
              type="button"
              onClick={() => onReject(item.id, localComment)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/25"
            >
              <X className="size-3.5" />
              {t("reject")}
            </button>
          </>
        )}
        {item.status === "approved" && (
          <>
            <button
              type="button"
              onClick={() => onPublish(item.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-500 transition-colors hover:bg-violet-500/25"
            >
              <Send className="size-3.5" />
              {t("publish")}
            </button>
            <button
              type="button"
              onClick={() => onEdit(item.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted/50 dark:bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted dark:hover:bg-white/[0.10]"
            >
              <Pencil className="size-3.5" />
              {t("edit")}
            </button>
          </>
        )}
        {item.status === "rejected" && (
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-muted/50 dark:bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted dark:hover:bg-white/[0.10]"
          >
            <Pencil className="size-3.5" />
            {t("edit")}
          </button>
        )}
      </div>
    </div>
  )
}
