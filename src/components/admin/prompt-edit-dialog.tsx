"use client"

import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  X,
  Save,
  FlaskConical,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  Trash2,
} from "lucide-react"
import type { AiPromptConfig, PromptFormData } from "@/lib/actions/admin-prompts.actions"
import { savePromptAction, testPromptAction } from "@/lib/actions/admin-prompts.actions"

// Schema Zod côté formulaire (sans clé BYOK obligatoire)
const formSchema = z.object({
  field_key: z
    .string()
    .min(1, "Requis")
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Lettres minuscules, chiffres et _ uniquement"),
  description: z.string().max(500).optional(),
  system_prompt: z
    .string()
    .min(10, "Minimum 10 caractères")
    .max(10_000),
  provider: z.enum(["anthropic", "openai", "openrouter", "perplexity"]),
  model: z.string().min(1, "Requis").max(100),
  api_key_byok: z.string().max(500).optional(),
  clear_byok_key: z.boolean().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-6",
  ],
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  openrouter: ["auto", "openai/gpt-4o", "mistralai/mixtral-8x7b-instruct"],
  perplexity: ["sonar", "sonar-pro", "sonar-reasoning"],
}

type TestState = "idle" | "loading" | "success" | "error"

type Props = {
  config: AiPromptConfig | null // null = création
  onClose: () => void
  onSaved: () => void
}

export function PromptEditDialog({ config, onClose, onSaved }: Props) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [testState, setTestState] = useState<TestState>("idle")
  const [testResponse, setTestResponse] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testLatency, setTestLatency] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      field_key: config?.field_key ?? "",
      description: config?.description ?? "",
      system_prompt: config?.system_prompt ?? "",
      provider: (config?.provider as FormValues["provider"]) ?? "anthropic",
      model: config?.model ?? "claude-haiku-4-5-20251001",
      api_key_byok: "",
      clear_byok_key: false,
      is_active: config?.is_active ?? true,
    },
  })

  const provider = useWatch({ control, name: "provider", defaultValue: "anthropic" })
  const clearBYOK = useWatch({ control, name: "clear_byok_key", defaultValue: false })

  // Reset model suggestion when provider changes
  useEffect(() => {
    const models = PROVIDER_MODELS[provider] ?? []
    if (models[0]) setValue("model", models[0])
  }, [provider, setValue])

  async function onSubmit(values: FormValues) {
    setIsSaving(true)
    setSaveError(null)

    const result = await savePromptAction(config?.id ?? null, values as PromptFormData)

    setIsSaving(false)

    if ("error" in result) {
      setSaveError(result.error)
      return
    }

    onSaved()
  }

  async function handleTest() {
    if (!config?.id) {
      setTestError("Sauvegardez d'abord la config avant de tester.")
      setTestState("error")
      return
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 backdrop-blur-sm px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {config ? "Modifier la config" : "Nouvelle config prompt"}
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* field_key */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Clé fonctionnelle <span className="text-red-400">*</span>
            </label>
            <input
              {...register("field_key")}
              disabled={!!config} // Immutable après création
              placeholder="ex: caption_generation"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {errors.field_key && (
              <p className="text-xs text-red-400">{errors.field_key.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Identifiant unique immuable · utilisé dans le code pour charger ce prompt.
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
            <label className="text-sm font-medium text-foreground">
              System prompt <span className="text-red-400">*</span>
            </label>
            <textarea
              {...register("system_prompt")}
              rows={6}
              placeholder="Instructions système envoyées au modèle LLM…"
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            {errors.system_prompt && (
              <p className="text-xs text-red-400">{errors.system_prompt.message}</p>
            )}
          </div>

          {/* provider + model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Provider <span className="text-red-400">*</span>
              </label>
              <select
                {...register("provider")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="openai">OpenAI (GPT)</option>
                <option value="openrouter">OpenRouter</option>
                <option value="perplexity">Perplexity</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Modèle <span className="text-red-400">*</span>
              </label>
              <input
                {...register("model")}
                list={`models-${provider}`}
                placeholder="ex: claude-haiku-4-5-20251001"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <datalist id={`models-${provider}`}>
                {(PROVIDER_MODELS[provider] ?? []).map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
              {errors.model && (
                <p className="text-xs text-red-400">{errors.model.message}</p>
              )}
            </div>
          </div>

          {/* BYOK API Key */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="size-3.5 text-amber-400 shrink-0" />
              <p className="text-xs font-semibold text-foreground">
                Clé API BYOK{" "}
                <span className="font-normal text-muted-foreground">
                  (optionnel — laissez vide pour utiliser la variable d&apos;environnement)
                </span>
              </p>
            </div>

            {config?.has_byok_key && !clearBYOK && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">Clé BYOK configurée — chiffrée AES-256</p>
                <button
                  type="button"
                  onClick={() => setValue("clear_byok_key", true)}
                  className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                >
                  <Trash2 className="size-3" />
                  Supprimer
                </button>
              </div>
            )}

            {clearBYOK && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                <XCircle className="size-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">La clé BYOK sera supprimée à la sauvegarde.</p>
                <button
                  type="button"
                  onClick={() => setValue("clear_byok_key", false)}
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                >
                  Annuler
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              Chiffrée AES-256-GCM avant stockage en base de données. Ne sera jamais retournée en clair.
            </p>
          </div>

          {/* is_active */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Config active</p>
              <p className="text-xs text-muted-foreground">
                Si désactivé, le code fallback sur le prompt par défaut.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                {...register("is_active")}
                type="checkbox"
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-muted peer-checked:bg-violet-600 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </div>

          {/* Test section */}
          {config && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="size-3.5 text-blue-400 shrink-0" />
                  <p className="text-xs font-semibold text-foreground">Tester le prompt</p>
                </div>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testState === "loading"}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-medium text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testState === "loading" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FlaskConical className="size-3.5" />
                  )}
                  {testState === "loading" ? "Test en cours…" : "Tester"}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Envoie un message de test simple au modèle configuré avec la clé API résolue.
              </p>

              {testState === "success" && testResponse && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs font-medium text-emerald-400">Succès</span>
                    </div>
                    {testLatency !== null && (
                      <span className="text-[11px] text-muted-foreground">{testLatency} ms</span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {testResponse}
                  </p>
                </div>
              )}

              {testState === "error" && testError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                  <XCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{testError}</p>
                </div>
              )}
            </div>
          )}

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
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {isSaving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
