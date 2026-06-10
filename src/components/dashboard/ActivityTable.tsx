"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Camera,
  Briefcase,
  PlayCircle,
  Hash,
  Image,
  Pin,
  Youtube,
  MessageCircle,
  Plus,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

/* ── Types ── */

type PostStatus = "published" | "scheduled" | "draft" | "review" | "approved" | "failed" | "publishing"

export interface ActivityRow {
  id: string
  project: string
  platform: string
  status: PostStatus
  updatedAt: string
}

/* ── Configuration ── */

type StatusConfigEntry = { labelKey: string; classes: string }

const STATUS_CONFIG: Record<PostStatus, StatusConfigEntry> = {
  published: {
    labelKey: "statusPublished",
    classes: "bg-emerald-500/10 text-emerald-500",
  },
  scheduled: {
    labelKey: "statusScheduled",
    classes: "bg-violet-500/10 text-violet-500",
  },
  review: {
    labelKey: "statusReview",
    classes: "bg-amber-500/10 text-amber-500",
  },
  approved: {
    labelKey: "statusApproved",
    classes: "bg-blue-500/10 text-blue-500",
  },
  draft: {
    labelKey: "statusDraft",
    classes: "bg-slate-500/20 text-slate-400",
  },
  failed: {
    labelKey: "statusFailed",
    classes: "bg-red-500/10 text-red-500",
  },
  publishing: {
    labelKey: "statusPublishing",
    classes: "bg-amber-500/10 text-amber-500",
  },
}

interface PlatformConfig {
  icon: LucideIcon
  bg: string
  text: string
  labelKey: string
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  instagram: {
    icon: Camera,
    bg: "bg-pink-500/20 dark:bg-pink-500/20",
    text: "text-pink-500",
    labelKey: "instagram",
  },
  linkedin: {
    icon: Briefcase,
    bg: "bg-blue-500/20 dark:bg-blue-500/20",
    text: "text-blue-500",
    labelKey: "linkedin",
  },
  twitter: {
    icon: Hash,
    bg: "bg-sky-400/20 dark:bg-sky-400/20",
    text: "text-sky-400",
    labelKey: "twitter",
  },
  facebook: {
    icon: MessageCircle,
    bg: "bg-blue-600/20 dark:bg-blue-600/20",
    text: "text-blue-600",
    labelKey: "facebook",
  },
  tiktok: {
    icon: PlayCircle,
    bg: "bg-zinc-200/60 dark:bg-white/10",
    text: "text-zinc-800 dark:text-white",
    labelKey: "tiktok",
  },
  pinterest: {
    icon: Pin,
    bg: "bg-red-500/20 dark:bg-red-500/20",
    text: "text-red-500",
    labelKey: "pinterest",
  },
  youtube: {
    icon: Youtube,
    bg: "bg-red-600/20 dark:bg-red-600/20",
    text: "text-red-600",
    labelKey: "youtube",
  },
  mastodon: {
    icon: MessageCircle,
    bg: "bg-indigo-500/20 dark:bg-indigo-500/20",
    text: "text-indigo-500",
    labelKey: "mastodon",
  },
  default: {
    icon: Image,
    bg: "bg-muted",
    text: "text-muted-foreground",
    labelKey: "platformOther",
  },
}

function getPlatformConfig(platform: string): PlatformConfig {
  return PLATFORM_CONFIG[platform.toLowerCase()] ?? PLATFORM_CONFIG.default
}

/* ── Component ── */

interface ActivityTableProps {
  rows: ActivityRow[]
}

export function ActivityTable({ rows }: ActivityTableProps) {
  const t = useTranslations("dashboard")
  const tPlatforms = useTranslations("platforms")

  return (
    <div className="glass-card flex flex-col overflow-hidden rounded-2xl lg:col-span-6">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h3 className="font-bold text-foreground">{t("recentActivity")}</h3>
        <Link
          href="/dashboard/calendar"
          className="text-sm font-medium text-violet-500 hover:underline"
        >
          {t("viewAll")}
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-muted/30 text-xs uppercase text-muted-foreground dark:bg-white/[0.02]">
            <tr>
              <th className="px-6 py-4 font-semibold">{t("tableProject")}</th>
              <th className="px-6 py-4 font-semibold">{t("tablePlatform")}</th>
              <th className="px-6 py-4 font-semibold">{t("tableStatus")}</th>
              <th className="px-6 py-4 font-semibold">{t("tableLastUpdate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-sm">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {t("emptyActivityTitle")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("emptyActivityDesc")}
                    </p>
                    <Link
                      href="/dashboard/create"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Plus className="size-3.5" />
                      {t("emptyActivityCta")}
                    </Link>
                  </div>
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const pConf = getPlatformConfig(row.platform)
              const Icon = pConf.icon
              const statusConf =
                STATUS_CONFIG[row.status] ?? STATUS_CONFIG.draft

              // Platform label: use platforms namespace for known platforms, dashboard for "other"
              const platformLabel =
                pConf.labelKey === "platformOther"
                  ? t("platformOther")
                  : tPlatforms(pConf.labelKey as Parameters<typeof tPlatforms>[0])

              return (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-muted/30 dark:hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {row.project}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-6 items-center justify-center rounded",
                          pConf.bg,
                          pConf.text
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <span className="text-muted-foreground">
                        {platformLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                        statusConf.classes
                      )}
                    >
                      {t(statusConf.labelKey as Parameters<typeof t>[0])}
                    </span>
                  </td>
                  <td className="px-6 py-4 italic text-muted-foreground">
                    {row.updatedAt}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
