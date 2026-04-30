"use client"

import { useTranslations } from "next-intl"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Eye,
  Settings,
  MoreVertical,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Mock data ────────────────────────────────────────────────── */

type TenantPlan = "AGENCY" | "PRO" | "SOLO" | "FREE"

interface MockTenant {
  id: string
  name: string
  subtitle: string
  initials: string
  postsMonth: number
  reach: string
  engagement: string
  scoreDNA: number
  plan: TenantPlan
  color: string
  miniChart: number[]
}

const PLAN_STYLES: Record<TenantPlan, { className: string }> = {
  AGENCY: { className: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  PRO: { className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  SOLO: { className: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  FREE: { className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
}

const MOCK_TENANTS: MockTenant[] = [
  { id: "1", name: "Luxe Vision", subtitle: "Mode & Luxe", initials: "LV", postsMonth: 124, reach: "850K", engagement: "5.2%", scoreDNA: 92, plan: "AGENCY", color: "bg-violet-500", miniChart: [4, 6, 5, 8, 7, 9, 11] },
  { id: "2", name: "TechKeep", subtitle: "SaaS B2B", initials: "TK", postsMonth: 42, reach: "120K", engagement: "3.8%", scoreDNA: 84, plan: "SOLO", color: "bg-blue-500", miniChart: [3, 4, 3, 5, 4, 6, 5] },
  { id: "3", name: "EcoFlow", subtitle: "Eco-Responsable", initials: "EF", postsMonth: 290, reach: "1.4M", engagement: "8.1%", scoreDNA: 78, plan: "PRO", color: "bg-emerald-500", miniChart: [7, 9, 8, 10, 12, 11, 14] },
  { id: "4", name: "NoMad", subtitle: "Tourisme", initials: "NM", postsMonth: 12, reach: "5K", engagement: "1.2%", scoreDNA: 45, plan: "FREE", color: "bg-amber-500", miniChart: [1, 2, 1, 2, 1, 3, 2] },
]

/* ── Mini sparkline component ─────────────────────────────────── */

function MiniChart({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data)
  return (
    <div className={cn("flex items-end gap-0.5 h-6", className)}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-full bg-violet-500/60 min-w-[3px]"
          style={{ height: `${(v / max) * 100}%`, minHeight: "2px" }}
        />
      ))}
    </div>
  )
}

/* ── Score indicator ──────────────────────────────────────────── */

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400"
  const _bg = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-8">
        <svg className="size-8 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-200 dark:text-white/[0.06]"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className={color}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
          />
        </svg>
      </div>
      <span className={cn("text-xs font-bold", color)}>{score}</span>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────── */

export default function TenantsPage() {
  const t = useTranslations("tenants")

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
            {t("overviewTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("overviewSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm",
              "border border-gray-200/60 bg-white text-muted-foreground",
              "dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50"
            )}
          >
            <Calendar className="size-4" />
            <span className="text-xs">Octobre 2023</span>
          </div>
        </div>
      </div>

      {/* Overview pills */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { label: t("activeBrands", { count: 12 }), color: "bg-emerald-500" },
          { label: t("postsThisMonth", { count: "4 820" }), color: "bg-violet-500" },
          { label: t("combinedReach", { value: "2.4M" }), color: "bg-blue-500" },
        ].map((pill) => (
          <div
            key={pill.label}
            className="flex items-center gap-2"
          >
            <div className={cn("size-2 rounded-full", pill.color)} />
            <span className="text-xs text-muted-foreground">{pill.label}</span>
          </div>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t("totalPosts"), value: "45.2K", change: "+10.8%", positive: true },
          { label: t("totalReach"), value: "2.4M", change: "-3.4%", positive: false },
          { label: t("averageEngagement"), value: "4.8%", change: "+14.4%", positive: true },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={cn(
              "rounded-2xl p-5",
              "bg-white border border-gray-200/60 shadow-sm",
              "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground dark:text-white">{kpi.value}</p>
            <p className={cn(
              "text-xs mt-1 flex items-center gap-1",
              kpi.positive ? "text-emerald-400" : "text-red-400"
            )}>
              {kpi.positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {kpi.change}
            </p>
          </div>
        ))}
      </div>

      {/* Tenants comparison table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground dark:text-white">{t("brandComparison")}</h2>
          <button
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
              "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
            )}
          >
            <Plus className="size-4" />
            {t("newBrand")}
          </button>
        </div>

        <div
          className={cn(
            "rounded-2xl overflow-hidden",
            "bg-white border border-gray-200/60 shadow-sm",
            "dark:bg-white/[0.04] dark:backdrop-blur-xl dark:border-white/[0.08]"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200/60 dark:border-white/[0.06]">
                  {[t("brandColumn"), t("postsColumn"), t("reachColumn"), t("engagementColumn"), t("scoreDnaColumn"), t("planColumn"), t("actionsColumn")].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60 dark:divide-white/[0.06]">
                {MOCK_TENANTS.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("flex size-9 items-center justify-center rounded-lg text-xs font-bold text-white", tenant.color)}>
                          {tenant.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground dark:text-white">{tenant.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tenant.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground dark:text-white">{tenant.postsMonth}</span>
                        <MiniChart data={tenant.miniChart} className="w-16" />
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground dark:text-white">{tenant.reach}</td>
                    <td className="px-5 py-4 font-medium text-foreground dark:text-white">{tenant.engagement}</td>
                    <td className="px-5 py-4">
                      <ScoreBadge score={tenant.scoreDNA} />
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider",
                        PLAN_STYLES[tenant.plan].className
                      )}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-md hover:bg-muted dark:hover:bg-white/[0.08] transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="size-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-muted dark:hover:bg-white/[0.08] transition-colors text-muted-foreground hover:text-foreground">
                          <Settings className="size-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-muted dark:hover:bg-white/[0.08] transition-colors text-muted-foreground hover:text-foreground">
                          <MoreVertical className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200/60 dark:border-white/[0.06] px-5 py-3">
            <p className="text-xs text-muted-foreground">{t("displayingBrands", { shown: 4, total: 12 })}</p>
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                  "border border-gray-200/60 bg-white text-muted-foreground hover:bg-gray-50",
                  "dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                )}
              >
                {t("previousPage")}
              </button>
              <button
                className={cn(
                  "inline-flex items-center gap-1 h-8 px-3 rounded-lg text-xs font-medium transition-colors",
                  "border border-gray-200/60 bg-white text-muted-foreground hover:bg-gray-50",
                  "dark:border-white/[0.08] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                )}
              >
                {t("nextPage")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
