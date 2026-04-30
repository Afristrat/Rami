"use client"

import { useTranslations } from "next-intl"
import { Linkedin, Mail, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeadData } from "@/lib/schemas/lead.schema"

// ── Couleur avatar déterministe basée sur le nom ───────────────────────────────

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-pink-500",
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return companyName.slice(0, 2).toUpperCase()
}

function useFormatFollowUp() {
  const t = useTranslations("leads")
  return (dateStr: string | null): string => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return t("followUpOverdue")
    if (diffDays === 0) return t("followUpToday")
    if (diffDays === 1) return t("followUpTomorrow")
    return t("followUpInDays", { count: diffDays })
  }
}

// ── Composant ──────────────────────────────────────────────────────────────────

interface LeadCardProps {
  lead: LeadData
  onClick: (lead: LeadData) => void
  onDragStart: (e: React.DragEvent, leadId: string) => void
}

export function LeadCard({ lead, onClick, onDragStart }: LeadCardProps) {
  const t = useTranslations("leads")
  const formatFollowUp = useFormatFollowUp()
  const initials = getInitials(lead.company_name)
  const avatarColor = getAvatarColor(lead.company_name)
  const followUpText = formatFollowUp(lead.next_followup_at)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onClick(lead)}
      className="group glass-card rounded-xl p-4 transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:border-violet-300/30 dark:hover:border-violet-500/20"
    >
      {/* Header : avatar + nom + icônes */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white",
              avatarColor
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground dark:text-white truncate">
              {lead.company_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {lead.contact_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lead.linkedin_url && (
            <span className="p-1 rounded text-muted-foreground">
              <Linkedin className="size-3.5" />
            </span>
          )}
          {lead.email && (
            <span className="p-1 rounded text-muted-foreground">
              <Mail className="size-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Footer : score + relance */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
            (lead.score ?? 0) >= 80
              ? "bg-emerald-500/20 text-emerald-400"
              : (lead.score ?? 0) >= 50
                ? "bg-amber-500/20 text-amber-400"
                : "bg-red-500/20 text-red-400"
          )}
        >
          {lead.score ?? 0}%
        </span>
        {followUpText && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-2.5" />
            {t("followUpLabel")} : {followUpText}
          </span>
        )}
      </div>
    </div>
  )
}
