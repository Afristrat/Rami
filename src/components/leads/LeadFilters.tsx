"use client"

import { useTranslations } from "next-intl"
import { Search, Plus, Zap, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

type FilterTab = "all" | "mine" | "priority"

interface LeadFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeFilter: FilterTab
  onFilterChange: (filter: FilterTab) => void
  onImport: () => void
}

// ── Composant ──────────────────────────────────────────────────────────────────

export function LeadFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onImport,
}: LeadFiltersProps) {
  const t = useTranslations("leads")

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "mine", label: t("filterMine") },
    { key: "priority", label: t("filterPriority") },
  ]

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
            {t("crmTitle")}
          </h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              {t("apolloEngine")}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              {t("connected")}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("crmSubtitle")}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={cn(
              "h-9 w-64 rounded-lg pl-9 pr-3 text-sm outline-none transition-colors",
              "bg-background border border-border text-foreground placeholder:text-muted-foreground",
              "focus-visible:ring-2 focus-visible:ring-violet-500/50"
            )}
          />
        </div>

        {/* Pills filtres */}
        <div className="flex items-center gap-1 rounded-lg glass-card p-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                activeFilter === tab.key
                  ? "bg-violet-500/10 text-violet-400"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Import */}
        <button
          onClick={onImport}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
            "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
          )}
        >
          <Plus className="size-4" />
          {t("importLeads")}
        </button>
      </div>
    </div>
  )
}

// ── Section filtres avancés Apollo ─────────────────────────────────────────────

interface ApolloSearchFiltersProps {
  onSearch: (filters: Record<string, string>) => void
}

export function ApolloSearchFilters({ onSearch }: ApolloSearchFiltersProps) {
  const t = useTranslations("leads")

  return (
    <div
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <Zap className="size-5 text-amber-400" />
        <h3 className="font-semibold text-foreground dark:text-white">
          {t("advancedFilters")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("poweredByApollo")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { id: "job_title", label: t("jobTitle"), placeholder: t("jobTitlePlaceholder") },
          { id: "sector", label: t("sector"), placeholder: t("sectorPlaceholder") },
          { id: "company_size", label: t("sizeLabel"), placeholder: t("companySizePlaceholder") },
          { id: "location", label: t("location"), placeholder: t("locationPlaceholder") },
        ].map((field) => (
          <div key={field.id}>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {field.label}
            </label>
            <input
              type="text"
              placeholder={field.placeholder}
              className={cn(
                "h-9 w-full rounded-lg px-3 text-sm outline-none transition-colors",
                "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-violet-500/50"
              )}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={() => onSearch({})}
          className={cn(
            "inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white",
            "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
          )}
        >
          <Search className="size-4" />
          {t("searchButton")}
        </button>
        <button
          className={cn(
            "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors",
            "glass-card text-foreground hover:bg-muted/50"
          )}
        >
          <FileText className="size-4" />
          {t("createProposal")}
        </button>
      </div>
    </div>
  )
}
