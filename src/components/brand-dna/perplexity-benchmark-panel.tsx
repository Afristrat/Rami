"use client"

import { useTranslations } from "next-intl"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  TrendingUp,
  Palette,
  Layout,
  MessageSquare,
  Hash,
  RefreshCw,
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react"
import type { PerplexityBenchmarkData } from "@/lib/services/perplexity/benchmark"

type PanelProps = {
  /** Données initiales depuis le serveur (cache DB). Null si pas encore généré. */
  initialBenchmark: PerplexityBenchmarkData | null
  /** Le cache est-il périmé (> 7 jours) ? */
  initialStale?: boolean
  /** Secteur du Brand DNA (pour affichage) */
  sector?: string
  /** Culture primaire du Brand DNA (pour affichage) */
  primaryCulture?: string
}

type FetchState = "idle" | "loading" | "error"

export function PerplexityBenchmarkPanel({
  initialBenchmark,
  initialStale = false,
  sector,
  primaryCulture: _primaryCulture,
}: PanelProps) {
  const t = useTranslations("brandDna.benchmark")

  const SECTIONS = [
    {
      key: "tendancesVisuelles" as const,
      icon: TrendingUp,
      label: t("visualTrends"),
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      key: "tendancesCouleurs" as const,
      icon: Palette,
      label: t("colorTrends"),
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      key: "formatContenu" as const,
      icon: Layout,
      label: t("contentFormats"),
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      key: "tonEditorial" as const,
      icon: MessageSquare,
      label: t("editorialTone"),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      key: "strategieHashtags" as const,
      icon: Hash,
      label: t("hashtagStrategy"),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ] as const

  function formatCacheAge(cachedAt: string): string {
    const diffMs = Date.now() - new Date(cachedAt).getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 1) return t("lessThanHour")
    if (diffHours < 24) return t("hoursAgo", { count: diffHours })
    const diffDays = Math.floor(diffHours / 24)
    return t("daysAgo", { count: diffDays })
  }
  const [benchmark, setBenchmark] = useState<PerplexityBenchmarkData | null>(initialBenchmark)
  // Si pas de données initiales ou cache périmé, démarrer en état "loading" pour éviter
  // le flash de l'état vide avant l'auto-fetch (setTimeout 0 dans l'effet).
  const [fetchState, setFetchState] = useState<FetchState>(
    !initialBenchmark || initialStale ? "loading" : "idle"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(initialStale)

  const triggerFetch = useCallback(async () => {
    setFetchState("loading")
    setErrorMessage(null)

    try {
      const res = await fetch("/api/brand-dna/perplexity-benchmark", {
        method: "POST",
      })

      const json = await res.json() as { data?: PerplexityBenchmarkData; error?: string }

      if (!res.ok || json.error) {
        setErrorMessage(json.error ?? t("errorDesc"))
        setFetchState("error")
        return
      }

      if (json.data) {
        setBenchmark(json.data)
        setIsStale(false)
      }

      setFetchState("idle")
    } catch {
      setErrorMessage("Impossible de contacter le service de benchmark")
      setFetchState("error")
    }
  }, [])

  // Auto-déclencher si pas de données ou cache périmé.
  // setTimeout(0) reporte l'appel après le commit React pour éviter la règle
  // react-hooks/set-state-in-effect (setState asynchrone, hors corps de l'effet).
  const autoFetchDone = useRef(false)
  useEffect(() => {
    if (autoFetchDone.current) return
    if (!benchmark || isStale) {
      autoFetchDone.current = true
      const timer = setTimeout(() => { void triggerFetch() }, 0)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isLoading = fetchState === "loading"

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("title")}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {t("subtitle")}
              {sector && <span className="ml-1 opacity-60">{sector}</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {benchmark?.cachedAt && !isLoading && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="size-3" />
              {formatCacheAge(benchmark.cachedAt)}
              {isStale && <span className="text-amber-400 ml-0.5">{`(${t("stale")})`}</span>}
            </span>
          )}
          <button
            type="button"
            onClick={() => void triggerFetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            title={t("refresh")}
          >
            <RefreshCw className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? t("analyzing") : t("refreshBtn")}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && !benchmark && (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
          <div className="size-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="text-sm text-muted-foreground">
            {t("loadingDesc")}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {t("firstGeneration")}
          </p>
        </div>
      )}

      {/* Error state */}
      {fetchState === "error" && !benchmark && (
        <div className="flex items-start gap-3 px-4 py-4">
          <AlertCircle className="size-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-400 font-medium">{t("errorTitle")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {errorMessage ?? t("errorDesc")}
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {benchmark && (
        <div className="divide-y divide-border">
          {SECTIONS.map(({ key, icon: Icon, label, color, bg, border }) => {
            const value = benchmark[key]
            if (!value) return null
            return (
              <div key={key} className="flex gap-3 px-4 py-3">
                <div
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${bg} border ${border}`}
                >
                  <Icon className={`size-3.5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${color} mb-0.5`}>{label}</p>
                  <p className="text-[13px] text-foreground/80 leading-relaxed">{value}</p>
                </div>
              </div>
            )
          })}

          {/* Footer stale warning */}
          {isStale && !isLoading && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/5">
              <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                {t("staleWarning")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state (no data, no loading, no error) */}
      {!benchmark && fetchState === "idle" && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <Sparkles className="size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t("noData")}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {t("noDataHint")}
          </p>
        </div>
      )}
    </div>
  )
}
