"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  X,
  Star,
  Zap,
  MoreHorizontal,
  Phone,
  Mail,
  Linkedin,
  MapPin,
  Building2,
  Users as UsersIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeadData, BrandDnaMatch } from "@/lib/schemas/lead.schema"

// ── Couleur avatar (même logique que LeadCard) ─────────────────────────────────

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

// ── Tabs ────────────────────────────────────────────────────────────────────────

const TAB_KEYS = ["tabInfos", "tabActivity", "tabDocuments", "tabNotes"] as const
type TabKey = (typeof TAB_KEYS)[number]

// ── Composant ──────────────────────────────────────────────────────────────────

interface LeadDetailPanelProps {
  lead: LeadData
  onClose: () => void
  onEdit: (lead: LeadData) => void
}

export function LeadDetailPanel({ lead, onClose, onEdit }: LeadDetailPanelProps) {
  const t = useTranslations("leads")
  const [activeTab, setActiveTab] = useState<TabKey>("tabInfos")
  const initials = getInitials(lead.company_name)
  const avatarColor = getAvatarColor(lead.company_name)
  const dnaMatch = lead.brand_dna_match as BrandDnaMatch | null

  const dnaBreakdown = [
    {
      label: t("audienceMatch"),
      value: dnaMatch?.audience ?? 0,
      color: "bg-violet-500",
    },
    {
      label: t("sectorMatch"),
      value: dnaMatch?.sector ?? 0,
      color: "bg-emerald-500",
    },
    {
      label: t("cultureMatch"),
      value: dnaMatch?.culture ?? 0,
      color: "bg-amber-500",
    },
  ]

  return (
    <div
      className="glass-card rounded-2xl p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-xl text-sm font-bold text-white",
              avatarColor
            )}
          >
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-foreground dark:text-white">
              {lead.company_name}
            </h3>
            <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <Star className="size-2.5" />
              {lead.score ?? 0}/100 Brand DNA Match
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TAB_KEYS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={cn(
              "px-3 py-2 text-xs font-medium transition-colors relative",
              activeTab === tabKey
                ? "text-foreground dark:text-white"
                : "text-muted-foreground hover:text-foreground dark:hover:text-white/70"
            )}
          >
            {t(tabKey)}
            {activeTab === tabKey && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "tabInfos" && (
        <>
          {/* Informations générales */}
          <div className="space-y-3 text-sm">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("generalInfo")}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground">Email</p>
                <p className="text-xs font-medium text-foreground dark:text-white truncate">
                  {lead.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("phone")}</p>
                <p className="text-xs font-medium text-foreground dark:text-white">
                  {lead.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">LinkedIn</p>
                {lead.linkedin_url ? (
                  <a
                    href={lead.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-violet-400 truncate block hover:underline"
                  >
                    {lead.linkedin_url.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <p className="text-xs font-medium text-foreground dark:text-white">—</p>
                )}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("sector")}</p>
                <p className="text-xs font-medium text-foreground dark:text-white">
                  {lead.sector || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("size")}</p>
                <p className="text-xs font-medium text-foreground dark:text-white">
                  {lead.company_size || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{t("location")}</p>
                <p className="text-xs font-medium text-foreground dark:text-white">
                  {lead.location || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Enrichissement Apollo */}
          <div
            className="rounded-xl p-4 bg-muted/30 border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-blue-400" />
                <span className="text-xs font-semibold text-foreground dark:text-white">
                  {t("apolloEnrichment")}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {lead.apollo_data ? t("apolloUpdated") : t("apolloNotEnriched")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lead.apollo_data
                ? t("apolloEnrichedDesc")
                : t("apolloNotEnrichedDesc")}
            </p>
          </div>

          {/* Brand DNA Breakdown */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("brandDnaBreakdown")}
            </h4>
            {dnaBreakdown.map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                  <span className="text-xs font-bold text-foreground dark:text-white">
                    {metric.value}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      metric.color
                    )}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "tabActivity" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("noActivity")}
          </p>
        </div>
      )}

      {activeTab === "tabDocuments" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("noDocuments")}
          </p>
        </div>
      )}

      {activeTab === "tabNotes" && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {t("noNotes")}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => onEdit(lead)}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
            "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
          )}
        >
          {t("editProfile")}
        </button>
        <button
          className="flex size-9 items-center justify-center rounded-lg transition-colors glass-card text-muted-foreground hover:bg-muted/50"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    </div>
  )
}
