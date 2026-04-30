"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"
import { TranslatedFieldError } from "@/components/ui/field-error-i18n"
import {
  X,
  Save,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react"
import type { AiPromptConfig, PromptFormData } from "@/lib/actions/admin-prompts.actions"
import { savePromptAction } from "@/lib/actions/admin-prompts.actions"
import { ModelPicker } from "@/components/admin/model-picker"
import type { PromptProvider } from "@/components/admin/model-picker"

const formSchema = z.object({
  field_key: z
    .string().min(1, V.fieldKeyRequired).max(100)
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

type FormValues = z.infer<typeof formSchema>

const PROVIDER_DEFAULT_MODEL: Record<string, string> = {
  anthropic:     "claude-haiku-4-5-20251001",
  openai:        "gpt-4o-mini",
  openrouter:    "auto",
  perplexity:    "sonar",
  moonshot:      "kimi-k2-0905-preview",
  mistral:       "mistral-medium-latest",
  fal_ai:        "fal-ai/flux/pro",
  replicate:     "black-forest-labs/flux-dev",
  together_ai:   "black-forest-labs/FLUX.1-schnell-Free",
  veo:           "veo-2",
  sora:          "sora-1.0",
  runway:        "gen4-turbo",
  kling:         "kling-v2",
  luma_ray:      "ray-2",
  wan:           "wan2.1-t2v-14b",
  ltx_video:     "ltx-video-0.9.7",
  minimax_video: "video-01",
  hailuo:        "hailuo-video-01",
  elevenlabs:    "eleven_multilingual_v2",
  cartesia:      "sonic-3",
}

type Props = {
  config: AiPromptConfig | null  // null = création
  onClose: () => void
  onSaved: () => void
}

export function PromptEditDialog({ config, onClose, onSaved }: Props) {
  const t = useTranslations("admin")
  const [showApiKey, setShowApiKey] = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)
  const [isSaving, setIsSaving]     = useState(false)

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field_key:             config?.field_key ?? "",
      description:           config?.description ?? "",
      system_prompt:         config?.system_prompt ?? "",
      user_message_template: config?.user_message_template ?? "",
      output_format:         config?.output_format ?? "",
      provider:              config?.provider ?? "anthropic",
      model:                 config?.model ?? "claude-haiku-4-5-20251001",
      api_key_byok:          "",
      clear_byok_key:        false,
      is_active:             config?.is_active ?? true,
    },
  })

  const provider = useWatch({ control, name: "provider", defaultValue: "anthropic" })
  const model    = useWatch({ control, name: "model",    defaultValue: "claude-haiku-4-5-20251001" })
  const clearBYOK = useWatch({ control, name: "clear_byok_key", defaultValue: false })

  // Suggest default model when provider changes (new config only)
  useEffect(() => {
    if (config) return  // do not override when editing
    const defaultModel = PROVIDER_DEFAULT_MODEL[provider]
    if (defaultModel) setValue("model", defaultModel)
  }, [provider, setValue, config])

  async function onSubmit(values: FormValues) {
    setIsSaving(true)
    setSaveError(null)
    const result = await savePromptAction(config?.id ?? null, values as PromptFormData)
    setIsSaving(false)
    if ("error" in result) { setSaveError(result.error); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {config ? t("editConfig") : t("newConfigPrompt")}
            </h2>
            {config && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <code className="font-mono">{config.field_key}</code>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* field_key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {t("functionalKey")} <span className="text-red-400">*</span>
            </label>
            <input
              {...register("field_key")}
              disabled={!!config}
              placeholder="ex: caption_generation"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.field_key && (
              <TranslatedFieldError message={errors.field_key.message} className="text-xs text-red-400" />
            )}
            <p className="text-xs text-muted-foreground">
              {t("functionalKeyNote")}
            </p>
          </div>

          {/* description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <input
              {...register("description")}
              placeholder="Description humaine de l'usage"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* system_prompt */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <span className="text-violet-400">🤖</span> System Prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register("system_prompt")}
              rows={5}
              placeholder="Instructions système envoyées au modèle LLM…"
              className="w-full resize-y rounded-lg border border-violet-500/30 bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            {errors.system_prompt && (
              <TranslatedFieldError message={errors.system_prompt.message} className="text-xs text-red-400" />
            )}
          </div>

          {/* user_message_template */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <span className="text-blue-400">💬</span> Message utilisateur
            </label>
            <textarea
              {...register("user_message_template")}
              rows={4}
              placeholder={"Génère {count} captions pour {platform}…\n\nMarque : {brand_name}"}
              className="w-full resize-y rounded-lg border border-blue-500/30 bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-xs text-muted-foreground">
              Variables entre accolades : {"{brand_name}"}, {"{sector}"}…
            </p>
          </div>

          {/* output_format */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <span className="text-emerald-400">📊</span> Format de sortie
            </label>
            <textarea
              {...register("output_format")}
              rows={4}
              placeholder={'{\n  "captions": [{ "text": "string", "hashtags": ["string"] }]\n}'}
              className="w-full resize-y rounded-lg border border-emerald-500/30 bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <p className="text-xs text-muted-foreground">
              Schéma JSON attendu — garantit la cohérence des sorties du modèle.
            </p>
          </div>

          {/* provider + model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t("provider")} <span className="text-red-400">*</span>
              </label>
              <select
                {...register("provider")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
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
                <optgroup label="── Audio ──">
                  <option value="elevenlabs">ElevenLabs (voiceovers)</option>
                  <option value="cartesia">Cartesia (temps réel)</option>
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                {t("model")} <span className="text-red-400">*</span>
              </label>
              <ModelPicker
                provider={provider as PromptProvider}
                value={model ?? ""}
                onChange={(m) => setValue("model", m, { shouldValidate: true })}
              />
              {errors.model && (
                <TranslatedFieldError message={errors.model.message} className="text-xs text-red-400" />
              )}
            </div>
          </div>

          {/* BYOK */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="size-3.5 text-amber-400 shrink-0" />
              <p className="text-xs font-semibold text-foreground">
                {t("byokApiKey")}{" "}
                <span className="font-normal text-muted-foreground">
                  ({t("byokLeaveEmpty")})
                </span>
              </p>
            </div>

            {config?.has_byok_key && !clearBYOK && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">{t("byokConfiguredAes")}</p>
                <button
                  type="button"
                  onClick={() => setValue("clear_byok_key", true)}
                  className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="size-3" />
                  {t("delete")}
                </button>
              </div>
            )}

            {clearBYOK && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <XCircle className="size-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{t("byokWillBeDeletedOnSave")}</p>
                <button
                  type="button"
                  onClick={() => setValue("clear_byok_key", false)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                  placeholder={config?.has_byok_key ? "Laisser vide pour conserver" : "sk-… / pplx-… / r8_…"}
                  autoComplete="off"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-9 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              {t("encryptionNote")}
            </p>
          </div>

          {/* is_active */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t("configActive")}</p>
              <p className="text-xs text-muted-foreground">
                {t("configActiveNote")}
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input {...register("is_active")} type="checkbox" className="peer sr-only" />
              <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-violet-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </div>

          {/* Save error */}
          {saveError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 flex items-start gap-2">
              <XCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{saveError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {isSaving ? t("saving") : config ? t("updateConfig") : t("createConfig")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
