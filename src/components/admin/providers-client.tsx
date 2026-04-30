"use client"

import { useState } from "react"
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  ChevronUp,
  ChevronDown,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useTranslations } from "next-intl"
import type { AiProviderChain } from "@/lib/actions/admin-prompts.actions"
import { saveCategoryChainAction } from "@/lib/actions/admin-prompts.actions"

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  anthropic:    { label: "Anthropic",    color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  openai:       { label: "OpenAI",       color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  openrouter:   { label: "OpenRouter",   color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  perplexity:   { label: "Perplexity",   color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  moonshot:     { label: "Moonshot",     color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  mistral:      { label: "Mistral",      color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  fal_ai:       { label: "Fal.ai",       color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  replicate:    { label: "Replicate",    color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  together_ai:  { label: "Together AI",  color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
}

const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic:    ["claude-haiku-4-5-20251001", "claude-sonnet-4-6", "claude-opus-4-6"],
  openai:       ["gpt-4o", "gpt-4o-mini", "whisper-1"],
  openrouter:   ["auto", "openai/gpt-4o", "anthropic/claude-haiku"],
  perplexity:   ["sonar", "sonar-pro", "sonar-reasoning"],
  moonshot:     ["moonshot-v1-8k", "moonshot-v1-32k"],
  mistral:      ["mistral-small-latest", "mistral-medium-latest", "mistral-large-latest"],
  fal_ai:       ["fal-ai/flux/dev", "fal-ai/flux/schnell", "fal-ai/kling-video/v1.6/standard/image-to-video"],
  replicate:    ["black-forest-labs/flux-dev", "minimax/video-01"],
  together_ai:  ["black-forest-labs/FLUX.1-schnell"],
}

const CATEGORY_META: Record<string, { label: string; icon: string; description: string }> = {
  image_gen:       { label: "Génération d'images",    icon: "🖼️",  description: "Visual Engine FLUX — visuels posts" },
  llm_text:        { label: "LLM Texte",              icon: "📝",  description: "Captions, Brand DNA, ton éditorial" },
  llm_vision:      { label: "LLM Vision",             icon: "👁️",  description: "Analyse logo, scoring visuel Brand DNA" },
  search_research: { label: "Recherche / Benchmark",  icon: "🔍",  description: "Perplexity benchmark sectoriel" },
  transcription:   { label: "Transcription",          icon: "🎙️",  description: "Whisper — réunions et notes audio" },
  video_gen:       { label: "Génération vidéo",       icon: "🎬",  description: "TikTok, Reels, YouTube Shorts" },
}

// ── Entry type used in local state ────────────────────────────────────────────

type LocalEntry = {
  tempId: string          // local-only id (for keying before DB save)
  dbId?: string           // server UUID if already persisted
  provider: string
  model: string
  is_active: boolean
  has_byok_key: boolean
  api_key_byok?: string   // unsaved value
  clear_byok_key: boolean
  showKey: boolean
}

function chainToLocal(c: AiProviderChain): LocalEntry {
  return {
    tempId:         c.id,
    dbId:           c.id,
    provider:       c.provider,
    model:          c.model,
    is_active:      c.is_active,
    has_byok_key:   c.has_byok_key,
    api_key_byok:   "",
    clear_byok_key: false,
    showKey:        false,
  }
}

// ── CategoryCard ──────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  initialEntries,
}: {
  category: string
  initialEntries: AiProviderChain[]
}) {
  const meta = CATEGORY_META[category] ?? {
    label: category,
    icon: "⚙️",
    description: "",
  }

  const [entries, setEntries] = useState<LocalEntry[]>(
    initialEntries.map(chainToLocal)
  )
  const t = useTranslations("admin")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  function addEntry() {
    const defaultProvider = category === "image_gen" ? "fal_ai"
      : category === "transcription" ? "openai"
      : category === "video_gen" ? "fal_ai"
      : category === "search_research" ? "perplexity"
      : "anthropic"

    const defaultModel = PROVIDER_MODELS[defaultProvider]?.[0] ?? ""

    setEntries((prev) => [
      ...prev,
      {
        tempId:         `new-${Date.now()}`,
        provider:       defaultProvider,
        model:          defaultModel,
        is_active:      true,
        has_byok_key:   false,
        api_key_byok:   "",
        clear_byok_key: false,
        showKey:        false,
      },
    ])
    setSaveOk(false)
  }

  function removeEntry(tempId: string) {
    setEntries((prev) => prev.filter((e) => e.tempId !== tempId))
    setSaveOk(false)
  }

  function updateEntry(tempId: string, patch: Partial<LocalEntry>) {
    setEntries((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, ...patch } : e))
    )
    setSaveOk(false)
  }

  function moveUp(index: number) {
    if (index === 0) return
    setEntries((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index]!, next[index - 1]!]
      return next
    })
    setSaveOk(false)
  }

  function moveDown(index: number) {
    setEntries((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1]!, next[index]!]
      return next
    })
    setSaveOk(false)
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)
    setSaveOk(false)

    const formData = entries.map((e) => ({
      id:             e.dbId,
      category,
      priority:       1,           // will be overridden by saveCategoryChainAction based on index
      provider:       e.provider,
      model:          e.model,
      is_active:      e.is_active,
      api_key_byok:   e.api_key_byok || undefined,
      clear_byok_key: e.clear_byok_key,
    }))

    const result = await saveCategoryChainAction(category, formData)
    setIsSaving(false)

    if ("error" in result) {
      setSaveError(result.error)
    } else {
      setSaveOk(true)
      // Reload to get fresh dbIds
      setTimeout(() => setSaveOk(false), 3000)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-base">{meta.icon}</span>
          <div>
            <p className="text-sm font-semibold text-foreground">{meta.label}</p>
            <p className="text-[11px] text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground/50 font-mono">{category}</span>
          <button
            type="button"
            onClick={addEntry}
            className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="size-3" />
            {t("add")}
          </button>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-border/50">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{t("noProviderConfigured")}</p>
              <button
                type="button"
                onClick={addEntry}
                className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {t("addFirstProvider")}
              </button>
            </div>
          </div>
        ) : (
          entries.map((entry, index) => {
            const providerMeta = PROVIDER_LABELS[entry.provider] ?? {
              label: entry.provider,
              color: "text-muted-foreground bg-muted border-border",
            }

            return (
              <div key={entry.tempId} className="flex gap-3 px-4 py-3 items-start">
                {/* Priority number + reorder */}
                <div className="flex flex-col items-center gap-0.5 shrink-0 pt-1">
                  <span className="text-[10px] font-bold text-muted-foreground/50">
                    P{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                    title={t("moveUp")}
                  >
                    <ChevronUp className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === entries.length - 1}
                    className="text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                    title={t("moveDown")}
                  >
                    <ChevronDown className="size-3" />
                  </button>
                </div>

                {/* Main fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {/* Provider select */}
                  <div>
                    <select
                      value={entry.provider}
                      onChange={(e) => {
                        const p = e.target.value
                        const firstModel = PROVIDER_MODELS[p]?.[0] ?? ""
                        updateEntry(entry.tempId, { provider: p, model: firstModel })
                      }}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    >
                      {Object.entries(PROVIDER_LABELS).map(([key, { label }]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <span className={`mt-1 inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-medium ${providerMeta.color}`}>
                      {providerMeta.label}
                    </span>
                  </div>

                  {/* Model */}
                  <div>
                    <input
                      value={entry.model}
                      onChange={(e) => updateEntry(entry.tempId, { model: e.target.value })}
                      list={`prov-models-${entry.tempId}`}
                      placeholder={t("modelPlaceholder")}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <datalist id={`prov-models-${entry.tempId}`}>
                      {(PROVIDER_MODELS[entry.provider] ?? []).map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>

                  {/* BYOK */}
                  <div className="space-y-1">
                    {entry.has_byok_key && !entry.clear_byok_key ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1.5">
                        <Key className="size-3 text-amber-400 shrink-0" />
                        <span className="text-[10px] text-amber-400 flex-1">{t("byokKey")}</span>
                        <button
                          type="button"
                          onClick={() => updateEntry(entry.tempId, { clear_byok_key: true })}
                          className="text-[10px] text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ) : entry.clear_byok_key ? (
                      <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1.5">
                        <XCircle className="size-3 text-red-400 shrink-0" />
                        <span className="text-[10px] text-red-400 flex-1">{t("keyDeleted")}</span>
                        <button
                          type="button"
                          onClick={() => updateEntry(entry.tempId, { clear_byok_key: false })}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          ↩
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type={entry.showKey ? "text" : "password"}
                          value={entry.api_key_byok ?? ""}
                          onChange={(e) => updateEntry(entry.tempId, { api_key_byok: e.target.value })}
                          placeholder={t("byokKeyOptional")}
                          autoComplete="off"
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 pr-7 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => updateEntry(entry.tempId, { showKey: !entry.showKey })}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
                        >
                          {entry.showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active toggle + delete */}
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <label className="relative inline-flex cursor-pointer items-center" title={entry.is_active ? t("active") : t("inactive")}>
                    <input
                      type="checkbox"
                      checked={entry.is_active}
                      onChange={(e) => updateEntry(entry.tempId, { is_active: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="h-4 w-7 rounded-full bg-muted peer-checked:bg-emerald-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3 after:w-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3" />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeEntry(entry.tempId)}
                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title={t("delete")}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center gap-2">
          {saveOk && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span className="text-xs text-emerald-400">{t("saved")}</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="size-3.5 text-red-400 shrink-0" />
              <span className="text-xs text-red-400">{saveError}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => { void handleSave() }}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
          {isSaving ? t("saving") : t("saveChain")}
        </button>
      </div>
    </div>
  )
}

// ── ProvidersClient ───────────────────────────────────────────────────────────

type Props = {
  chains: AiProviderChain[]
}

export function ProvidersClient({ chains }: Props) {
  // Group by category, preserve order
  const categories = Object.keys(CATEGORY_META)
  const byCategory: Record<string, AiProviderChain[]> = {}

  for (const cat of categories) {
    byCategory[cat] = chains
      .filter((c) => c.category === cat)
      .sort((a, b) => a.priority - b.priority)
  }

  // Also include any unknown category in the chains
  for (const chain of chains) {
    if (!byCategory[chain.category]) {
      byCategory[chain.category] = [chain]
    }
  }

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([category, entries]) => (
        <CategoryCard key={category} category={category} initialEntries={entries} />
      ))}
    </div>
  )
}
