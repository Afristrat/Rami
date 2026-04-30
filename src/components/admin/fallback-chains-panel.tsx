"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { ChevronUp, ChevronDown, Save, Loader2, CheckCircle2, AlertCircle, Star, ArrowDown } from "lucide-react"
import type { AiFallbackChain, FallbackProvider } from "@/lib/actions/admin.actions"
import { updateFallbackChain } from "@/lib/actions/admin.actions"
import { cn } from "@/lib/utils"

// ── Labels & couleurs par rang ─────────────────────────────────────────────────

const RANK_META = [
  { label: "LLM principal",  color: "bg-blue-500/15 border-blue-500/40 text-blue-300",    dot: "bg-blue-400" },
  { label: "Fallback 1",     color: "bg-violet-500/15 border-violet-500/40 text-violet-300", dot: "bg-violet-400" },
  { label: "Fallback 2",     color: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",     dot: "bg-cyan-400" },
  { label: "Fallback 3",     color: "bg-amber-500/15 border-amber-500/40 text-amber-300",  dot: "bg-amber-400" },
  { label: "Fallback 4",     color: "bg-rose-500/15 border-rose-500/40 text-rose-300",     dot: "bg-rose-400" },
] as const

function getRank(rankIdx: number) {
  return RANK_META[rankIdx] ?? { label: `Fallback ${rankIdx}`, color: "bg-muted border-border text-muted-foreground", dot: "bg-muted-foreground" }
}

// ── Noms affichables par provider ──────────────────────────────────────────────

const PROVIDER_NAMES: Record<string, string> = {
  moonshot:     "Moonshot (Kimi)",
  anthropic:    "Anthropic",
  openai:       "OpenAI",
  openrouter:   "OpenRouter",
  perplexity:   "Perplexity",
  fal_ai:       "Fal.ai",
  replicate:    "Replicate",
  together_ai:  "Together AI",
  nano_banana:  "Nano Banana",
  veo:          "Google Veo",
  runway:       "Runway",
  kling:        "Kling",
  luma:         "Luma Ray",
  wan:          "Wan.ai",
  minimax:      "MiniMax",
  ltx:          "LTX",
  hailuo:       "Hailuo",
  sora:         "Sora",
}

const PROVIDER_COLORS: Record<string, string> = {
  moonshot:     "text-teal-400 bg-teal-500/10 border-teal-500/25",
  anthropic:    "text-orange-400 bg-orange-500/10 border-orange-500/25",
  openai:       "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  openrouter:   "text-blue-400 bg-blue-500/10 border-blue-500/25",
  perplexity:   "text-violet-400 bg-violet-500/10 border-violet-500/25",
  fal_ai:       "text-sky-400 bg-sky-500/10 border-sky-500/25",
  replicate:    "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
  together_ai:  "text-pink-400 bg-pink-500/10 border-pink-500/25",
  nano_banana:  "text-yellow-400 bg-yellow-500/10 border-yellow-500/25",
  veo:          "text-blue-300 bg-blue-500/10 border-blue-500/25",
  runway:       "text-emerald-300 bg-emerald-500/10 border-emerald-500/25",
  kling:        "text-rose-400 bg-rose-500/10 border-rose-500/25",
  luma:         "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
  wan:          "text-teal-400 bg-teal-500/10 border-teal-500/25",
}

// ── Carte d'un provider dans la liste ─────────────────────────────────────────

type ProviderRowProps = {
  p: FallbackProvider
  idx: number          // index dans le tableau complet trié par priorité
  total: number
  rankIdx: number      // rang parmi les enabled (-1 si disabled)
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function ProviderRow({ p, idx, total, rankIdx, onToggle, onMoveUp, onMoveDown }: ProviderRowProps) {
  const t = useTranslations("admin")
  const providerColor = PROVIDER_COLORS[p.provider] ?? "text-muted-foreground bg-muted border-border"
  const rank = rankIdx >= 0 ? getRank(rankIdx) : null

  return (
    <div className={cn(
      "flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all",
      p.enabled
        ? "border-border/60 bg-card"
        : "border-border/30 bg-muted/20 opacity-60"
    )}>
      {/* Rang (badge visible seulement si enabled) */}
      <div className="w-[90px] shrink-0">
        {rank ? (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            rank.color
          )}>
            {rankIdx === 0 && <Star className="size-2.5 shrink-0" />}
            {rank.label}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/40 font-mono">#{idx + 1}</span>
        )}
      </div>

      {/* Provider badge */}
      <span className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        providerColor
      )}>
        {PROVIDER_NAMES[p.provider] ?? p.provider}
      </span>

      {/* Modèle */}
      <code className="text-[11px] text-muted-foreground font-mono truncate flex-1 min-w-0">
        {p.model}
      </code>

      {/* Toggle enabled */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border transition-colors",
          p.enabled ? "bg-violet-600 border-violet-600" : "bg-muted border-border"
        )}
        title={p.enabled ? t("inactive") : t("active")}
        aria-label={p.enabled ? t("inactive") : t("active")}
      >
        <span className={cn(
          "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
          p.enabled ? "translate-x-3.5" : "translate-x-0.5"
        )} />
      </button>

      {/* Move up/down */}
      <div className="flex flex-col shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={idx === 0}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20"
          aria-label={t("moveUp")}
        >
          <ChevronUp className="size-3" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={idx === total - 1}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20"
          aria-label={t("moveDown")}
        >
          <ChevronDown className="size-3" />
        </button>
      </div>
    </div>
  )
}

// ── Carte principale d'une chaîne ──────────────────────────────────────────────

type ChainCardProps = {
  chain: AiFallbackChain
}

function ChainCard({ chain }: ChainCardProps) {
  const t = useTranslations("admin")
  const [providers, setProviders] = useState<FallbackProvider[]>(
    [...chain.providers].sort((a, b) => a.priority - b.priority)
  )
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcul dérivé : enabled triés par priorité (en tête), puis disabled
  const enabled  = providers.filter((p) => p.enabled)
  const disabled = providers.filter((p) => !p.enabled)

  // Map provider → index dans le tableau complet (pour move up/down)
  const providerToIdx = new Map(providers.map((p, i) => [`${p.provider}-${p.priority}`, i]))

  function getIdx(p: FallbackProvider) {
    return providerToIdx.get(`${p.provider}-${p.priority}`) ?? providers.indexOf(p)
  }

  function toggleEnabled(idx: number) {
    setProviders((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, enabled: !p.enabled } : p))
    )
    setSaved(false)
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    setProviders((prev) => {
      const next = [...prev]
      const temp = next[idx - 1]!
      next[idx - 1] = { ...next[idx]!, priority: idx }
      next[idx]     = { ...temp,         priority: idx + 1 }
      return next
    })
    setSaved(false)
  }

  function moveDown(idx: number) {
    if (idx === providers.length - 1) return
    setProviders((prev) => {
      const next = [...prev]
      const temp = next[idx + 1]!
      next[idx + 1] = { ...next[idx]!, priority: idx + 2 }
      next[idx]     = { ...temp,         priority: idx + 1 }
      return next
    })
    setSaved(false)
  }

  function handleSave() {
    setError(null)
    setSaved(false)
    const reordered = providers.map((p, i) => ({ ...p, priority: i + 1 }))

    startTransition(async () => {
      const result = await updateFallbackChain(chain.chain_key, reordered)
      if ("error" in result) { setError(result.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{chain.display_name}</h3>
          {chain.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{chain.description}</p>
          )}
        </div>
        <code className="text-[10px] font-mono text-muted-foreground/60 shrink-0 mt-0.5">
          {chain.chain_key}
        </code>
      </div>

      <div className="px-4 py-3 space-y-1">

        {/* ── Section ACTIFS : visibles directement, classés par rang ── */}
        {enabled.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 py-2 text-center">
            {t("noActiveProvider")}
          </p>
        ) : (
          <div className="space-y-1.5">
            {enabled.map((p, rankIdx) => {
              const idx = getIdx(p)
              return (
                <div key={`${p.provider}-${p.priority}-enabled`}>
                  <ProviderRow
                    p={p}
                    idx={idx}
                    total={providers.length}
                    rankIdx={rankIdx}
                    onToggle={() => toggleEnabled(idx)}
                    onMoveUp={() => moveUp(idx)}
                    onMoveDown={() => moveDown(idx)}
                  />
                  {/* Flèche de cascade entre chaque rang */}
                  {rankIdx < enabled.length - 1 && (
                    <div className="flex items-center justify-center py-0.5">
                      <ArrowDown className="size-3 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Séparateur ── */}
        {disabled.length > 0 && (
          <div className="pt-2 pb-1">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border/40" />
              <span className="text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wide">
                {t("disabled")}
              </span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
          </div>
        )}

        {/* ── Section DÉSACTIVÉS : scrollable ── */}
        {disabled.length > 0 && (
          <div className="max-h-[148px] overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
            {disabled.map((p) => {
              const idx = getIdx(p)
              return (
                <ProviderRow
                  key={`${p.provider}-${p.priority}-disabled`}
                  p={p}
                  idx={idx}
                  total={providers.length}
                  rankIdx={-1}
                  onToggle={() => toggleEnabled(idx)}
                  onMoveUp={() => moveUp(idx)}
                  onMoveDown={() => moveDown(idx)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-3">
        <div className="flex-1 min-h-[18px]">
          {error && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="size-3 text-red-400 shrink-0" />
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-400" />
              <p className="text-[11px] text-emerald-400">{t("saved")}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
          {t("save")}
        </button>
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────────

type Props = {
  initialChains: AiFallbackChain[]
}

export function FallbackChainsPanel({ initialChains }: Props) {
  const t = useTranslations("admin")
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {initialChains.map((chain) => (
        <ChainCard key={chain.chain_key} chain={chain} />
      ))}

      {initialChains.length === 0 && (
        <p className="text-sm text-muted-foreground col-span-full py-8 text-center">
          {t("noFallbackChain")}
        </p>
      )}
    </div>
  )
}
