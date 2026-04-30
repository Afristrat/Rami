"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Key,
  Save,
  FlaskConical,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"
import { TranslatedFieldError } from "@/components/ui/field-error-i18n"
import type { AiPromptConfig, PromptFormData } from "@/lib/actions/admin-prompts.actions"
import { deletePromptAction, savePromptAction, testPromptAction } from "@/lib/actions/admin-prompts.actions"
import { useIntlLocale } from "@/lib/utils/format-locale"
import { PromptEditDialog } from "./prompt-edit-dialog"
import { ModelPicker } from "./model-picker"
import type { PromptProvider } from "./model-picker"
import { ConfirmDialog } from "./confirm-dialog"

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  // Texte
  anthropic:     { label: "Anthropic",  color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  openai:        { label: "OpenAI",     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  openrouter:    { label: "OpenRouter", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  perplexity:    { label: "Perplexity", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  moonshot:      { label: "Moonshot",   color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  mistral:       { label: "Mistral",    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  // Image
  fal_ai:        { label: "Fal.ai",     color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  replicate:     { label: "Replicate",  color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  together_ai:   { label: "Together",   color: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20" },
  // Vidéo
  veo:           { label: "Veo",        color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  sora:          { label: "Sora",       color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  runway:        { label: "Runway",     color: "text-orange-300 bg-orange-500/10 border-orange-500/20" },
  kling:         { label: "Kling",      color: "text-red-400 bg-red-500/10 border-red-500/20" },
  luma_ray:      { label: "Luma Ray",   color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  wan:           { label: "WAN",        color: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  ltx_video:     { label: "LTX Video", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  minimax_video: { label: "MiniMax V.", color: "text-orange-300 bg-orange-500/10 border-orange-500/20" },
  hailuo:        { label: "Hailuo",    color: "text-red-300 bg-red-500/10 border-red-500/20" },
  // Audio
  elevenlabs:    { label: "ElevenLabs", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  cartesia:      { label: "Cartesia",   color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
}

// Modèle par défaut à sélectionner quand l'utilisateur change de provider
const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  // Texte
  anthropic:     "claude-haiku-4-5-20251001",
  openai:        "gpt-4o-mini",
  openrouter:    "auto",
  perplexity:    "sonar",
  moonshot:      "kimi-k2-0905-preview",
  mistral:       "mistral-medium-latest",
  // Image
  fal_ai:        "fal-ai/flux/pro",
  replicate:     "black-forest-labs/flux-dev",
  together_ai:   "black-forest-labs/FLUX.1-schnell-Free",
  // Vidéo
  veo:           "veo-2",
  sora:          "sora-1.0",
  runway:        "gen4-turbo",
  kling:         "kling-v2",
  luma_ray:      "ray-2",
  wan:           "wan2.1-t2v-14b",
  ltx_video:     "ltx-video-0.9.7",
  minimax_video: "video-01",
  hailuo:        "hailuo-video-01",
  // Audio
  elevenlabs:    "eleven_multilingual_v2",
  cartesia:      "sonic-3",
}

// ── Row editor schema ──────────────────────────────────────────────────────────

const editSchema = z.object({
  field_key:             z.string().min(1, V.fieldKeyRequired).max(100)
                          .regex(/^[a-z0-9_]+$/, V.fieldKeyInvalidChars),
  description:           z.string().max(500).optional(),
  system_prompt:         z.string().min(10, V.systemPromptMinLength).max(20_000),
  user_message_template: z.string().max(5_000).optional(),
  output_format:         z.string().max(5_000).optional(),
  provider:              z.string().min(1, V.providerRequired).max(50),
  model:                 z.string().min(1, V.modelRequired).max(200),
  api_key_byok:          z.string().max(500).optional(),
  clear_byok_key:        z.boolean().optional(),
  is_active:             z.boolean(),
})

type EditValues = z.infer<typeof editSchema>
type TestState = "idle" | "loading" | "success" | "error"

// ── Inline row editor ──────────────────────────────────────────────────────────

function PromptRowEditor({
  config,
  onSaved,
  onCancel,
}: {
  config: AiPromptConfig
  onSaved: () => void
  onCancel: () => void
}) {
  const t = useTranslations("admin")
  const [showApiKey, setShowApiKey]   = useState(false)
  const [testState, setTestState]     = useState<TestState>("idle")
  const [testResponse, setTestResponse] = useState<string | null>(null)
  const [testError, setTestError]     = useState<string | null>(null)
  const [testLatency, setTestLatency] = useState<number | null>(null)
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [isSaving, setIsSaving]       = useState(false)

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      field_key:             config.field_key,
      description:           config.description ?? "",
      system_prompt:         config.system_prompt,
      user_message_template: config.user_message_template ?? "",
      output_format:         config.output_format ?? "",
      provider:              config.provider as EditValues["provider"],
      model:                 config.model,
      api_key_byok:          "",
      clear_byok_key:        false,
      is_active:             config.is_active,
    },
  })

  const provider  = useWatch({ control, name: "provider",       defaultValue: config.provider as EditValues["provider"] })
  const model     = useWatch({ control, name: "model",          defaultValue: config.model })
  const clearBYOK = useWatch({ control, name: "clear_byok_key", defaultValue: false })

  // Réinitialise le modèle uniquement quand l'utilisateur CHANGE de provider (pas au mount)
  const prevProviderRef = useRef(provider)
  useEffect(() => {
    if (prevProviderRef.current === provider) return
    prevProviderRef.current = provider
    const defaultModel = PROVIDER_DEFAULT_MODEL[provider]
    if (defaultModel) setValue("model", defaultModel, { shouldValidate: true })
  }, [provider, setValue])

  async function onSubmit(values: EditValues) {
    setIsSaving(true)
    setSaveError(null)
    const result = await savePromptAction(config.id, values as PromptFormData)
    setIsSaving(false)
    if ("error" in result) { setSaveError(result.error); return }
    onSaved()
  }

  async function handleTest() {
    setTestState("loading")
    setTestResponse(null)
    setTestError(null)
    setTestLatency(null)
    const result = await testPromptAction(config.id)
    if ("error" in result) {
      setTestError(result.error)
      setTestState("error")
    } else {
      setTestResponse(result.response)
      setTestLatency(result.latencyMs)
      setTestState("success")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-5 pt-2 space-y-4 bg-muted/10 border-t border-border">
      {/* ── 3 panels ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">

        {/* System Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="text-violet-400">🤖</span> System Prompt
            <span className="text-red-400">*</span>
          </label>
          <textarea
            {...register("system_prompt")}
            rows={10}
            className="w-full resize-y rounded-lg border border-violet-500/30 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            placeholder="Instructions système envoyées au modèle…"
          />
          {errors.system_prompt && (
            <TranslatedFieldError message={errors.system_prompt.message} className="text-[10px] text-red-400" />
          )}
        </div>

        {/* User Message Template */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="text-blue-400">💬</span> Message utilisateur
          </label>
          <textarea
            {...register("user_message_template")}
            rows={10}
            className="w-full resize-y rounded-lg border border-blue-500/30 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            placeholder={"Génère {count} captions pour {platform}…\n\nMarque : {brand_name}\nSecteur : {sector}"}
          />
          <p className="text-[10px] text-muted-foreground/50">
            Variables entre accolades : {"{brand_name}"}, {"{sector}"}, {"{platform}"}…
          </p>
        </div>

        {/* Output Format */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span className="text-emerald-400">📊</span> Format de sortie
          </label>
          <textarea
            {...register("output_format")}
            rows={10}
            className="w-full resize-y rounded-lg border border-emerald-500/30 bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            placeholder={'{\n  "captions": [\n    {\n      "text": "string",\n      "hashtags": ["string"]\n    }\n  ]\n}'}
          />
          <p className="text-[10px] text-muted-foreground/50">
            Schéma JSON attendu — garantit la cohérence des sorties.
          </p>
        </div>
      </div>

      {/* ── Provider / Model / Description / Active ─────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-border/50">

        {/* Provider */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Provider</label>
          <select
            {...register("provider")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          >
            <optgroup label="── Texte / LLM ──">
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="openrouter">OpenRouter</option>
              <option value="perplexity">Perplexity</option>
              <option value="moonshot">Moonshot (Kimi)</option>
              <option value="mistral">Mistral AI</option>
            </optgroup>
            <optgroup label="── Image ──">
              <option value="fal_ai">Fal.ai (FLUX · Ideogram)</option>
              <option value="replicate">Replicate (FLUX · SDXL)</option>
              <option value="together_ai">Together AI (FLUX)</option>
            </optgroup>
            <optgroup label="── Vidéo ──">
              <option value="veo">Google Veo</option>
              <option value="sora">OpenAI Sora</option>
              <option value="runway">Runway</option>
              <option value="kling">Kling AI</option>
              <option value="luma_ray">Luma Ray</option>
              <option value="wan">WAN Video</option>
              <option value="ltx_video">LTX Video</option>
              <option value="minimax_video">MiniMax Video</option>
              <option value="hailuo">Hailuo AI</option>
            </optgroup>
            <optgroup label="── Audio / Voix ──">
              <option value="elevenlabs">ElevenLabs (voiceovers)</option>
              <option value="cartesia">Cartesia (temps réel)</option>
            </optgroup>
          </select>
        </div>

        {/* Model */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("model")}</label>
          <ModelPicker
            provider={provider as PromptProvider}
            value={model ?? ""}
            onChange={(m) => setValue("model", m, { shouldValidate: true })}
          />
          {errors.model && <TranslatedFieldError message={errors.model.message} className="text-[10px] text-red-400" />}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <input
            {...register("description")}
            placeholder="Usage humain…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        {/* is_active toggle */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{t("status")}</label>
          <label className="flex items-center gap-2 cursor-pointer pt-1.5">
            <input {...register("is_active")} type="checkbox" className="peer sr-only" />
            <div className="relative h-5 w-9 rounded-full bg-muted peer-checked:bg-violet-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            <span className="text-xs text-muted-foreground">{t("active")}</span>
          </label>
        </div>
      </div>

      {/* ── BYOK ─────────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Key className="size-3.5 text-amber-400 shrink-0" />
          <p className="text-xs font-medium text-amber-400">
            {t("byokApiKey")}{" "}
            <span className="font-normal text-muted-foreground">
              ({t("byokLeaveEmpty")})
            </span>
          </p>
        </div>

        {config.has_byok_key && !clearBYOK && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
            <CheckCircle2 className="size-3 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400 flex-1">{t("byokConfigured")}</p>
            <button
              type="button"
              onClick={() => setValue("clear_byok_key", true)}
              className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
            >
              {t("delete")}
            </button>
          </div>
        )}

        {clearBYOK && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5">
            <XCircle className="size-3 text-red-400 shrink-0" />
            <p className="text-xs text-red-400 flex-1">La clé sera supprimée à la sauvegarde.</p>
            <button
              type="button"
              onClick={() => setValue("clear_byok_key", false)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("cancel")}
            </button>
          </div>
        )}

        {!clearBYOK && (
          <div className="relative">
            <input
              {...register("api_key_byok")}
              type={showApiKey ? "text" : "password"}
              placeholder={config.has_byok_key ? "Laisser vide pour conserver" : "sk-… / pplx-… / r8_…"}
              autoComplete="off"
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 pr-9 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* ── Test result ──────────────────────────────────────────────────────── */}
      {testState === "success" && testResponse && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-emerald-400">{t("testSuccess")}</span>
            </div>
            {testLatency !== null && (
              <span className="text-[10px] text-muted-foreground">{testLatency} ms</span>
            )}
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{testResponse}</p>
        </div>
      )}

      {testState === "error" && testError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
          <XCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{testError}</p>
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 flex items-start gap-2">
          <AlertCircle className="size-3 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{saveError}</p>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => { void handleTest() }}
          disabled={testState === "loading"}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {testState === "loading" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <FlaskConical className="size-3" />
          )}
          {testState === "loading" ? t("testing") : t("testPrompt")}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            {isSaving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Main PromptsTable ─────────────────────────────────────────────────────────

type Props = {
  initialConfigs: AiPromptConfig[]
}

export function PromptsTable({ initialConfigs }: Props) {
  const t = useTranslations("admin")
  const intlLocale = useIntlLocale()
  const [configs, setConfigs]               = useState(initialConfigs)
  const [expandedId, setExpandedId]         = useState<string | null>(null)
  const [showNewDialog, setShowNewDialog]   = useState(false)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete]   = useState<AiPromptConfig | null>(null)
  const [deleteError, setDeleteError]       = useState<string | null>(null)
  const [isPending, startTransition]        = useTransition()

  function refresh() {
    startTransition(async () => {
      try {
        const { getPromptsAction } = await import("@/lib/actions/admin-prompts.actions")
        const result = await getPromptsAction()
        if ("data" in result) setConfigs(result.data)
      } catch { /* ignore */ }
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setDeleteError(null)
    const result = await deletePromptAction(id)
    setDeletingId(null)
    if ("error" in result) { setDeleteError(result.error); return }
    setConfigs((prev) => prev.filter((c) => c.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function handleRowSaved() {
    setExpandedId(null)
    refresh()
  }

  function handleNewSaved() {
    setShowNewDialog(false)
    refresh()
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(intlLocale, { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {configs.length} config{configs.length > 1 ? "s" : ""} IA
          {isPending && <span className="ml-2 text-violet-400">{t("refreshing")}</span>}
        </p>
        <button
          type="button"
          onClick={() => setShowNewDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
        >
          <Plus className="size-3.5" />
          Nouvelle config
        </button>
      </div>

      {/* Delete error */}
      {deleteError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <AlertCircle className="size-3.5 text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-400">{deleteError}</p>
        </div>
      )}

      {/* Accordion list */}
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Key className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">{t("noPromptConfig")}</p>
            <button
              type="button"
              onClick={() => setShowNewDialog(true)}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              {t("createFirstConfig")}
            </button>
          </div>
        ) : (
          configs.map((config) => {
            const providerMeta = PROVIDER_LABELS[config.provider] ?? {
              label: config.provider,
              color: "text-muted-foreground bg-muted border-border",
            }
            const isExpanded  = expandedId === config.id
            const isDeleting  = deletingId === config.id

            return (
              <div key={config.id}>
                {/* ── Row header ──────────────────────────────────────────── */}
                <div
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors ${
                    isExpanded ? "bg-muted/40" : "hover:bg-muted/20"
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : config.id)}
                >
                  {/* Chevron */}
                  <span className="text-muted-foreground/50 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="size-3.5 text-violet-400" />
                    ) : (
                      <ChevronRight className="size-3.5" />
                    )}
                  </span>

                  {/* field_key */}
                  <code className="text-xs font-mono font-semibold text-foreground min-w-0 truncate flex-1">
                    {config.field_key}
                  </code>

                  {/* Provider badge + model */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${providerMeta.color}`}>
                      {providerMeta.label}
                    </span>
                    <code className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                      {config.model}
                    </code>
                  </div>

                  {/* BYOK indicator */}
                  {config.has_byok_key && (
                    <span title={t("byokConfigured")} className="shrink-0">
                      <Key className="size-3.5 text-amber-400" />
                    </span>
                  )}

                  {/* Status dot */}
                  <span
                    className={`size-2 rounded-full shrink-0 ${
                      config.is_active ? "bg-emerald-400" : "bg-muted-foreground/30"
                    }`}
                    title={config.is_active ? t("active") : t("inactive")}
                  />

                  {/* Date — hidden on small screens */}
                  <span className="hidden lg:block text-[10px] text-muted-foreground/50 shrink-0">
                    {formatDate(config.updated_at)}
                  </span>

                  {/* Delete — stop propagation to prevent accordion toggle */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(config) }}
                    disabled={isDeleting}
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 transition-colors"
                    title={t("delete")}
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Trash2 className="size-3" />
                    )}
                  </button>
                </div>

                {/* ── Inline editor ───────────────────────────────────────── */}
                {isExpanded && (
                  <PromptRowEditor
                    config={config}
                    onSaved={handleRowSaved}
                    onCancel={() => setExpandedId(null)}
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* New config dialog */}
      {showNewDialog && (
        <PromptEditDialog
          config={null}
          onClose={() => setShowNewDialog(false)}
          onSaved={handleNewSaved}
        />
      )}

      {/* Confirmation suppression */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title={`${t("delete")} "${confirmDelete?.field_key}" ?`}
        description={t("deletePromptDescription")}
        confirmLabel={t("delete")}
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) void handleDelete(confirmDelete.id)
          setConfirmDelete(null)
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
