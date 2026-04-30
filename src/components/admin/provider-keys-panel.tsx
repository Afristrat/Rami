"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import {
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, AlertCircle, Key, Trash2,
  FlaskConical, Save, Type, Image, Video, Mic, LayoutTemplate,
} from "lucide-react"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type { AiProviderKey, AiProviderKeyCategory } from "@/lib/actions/admin.actions"
import { upsertProviderKey, deleteProviderKey, testProviderKey } from "@/lib/actions/admin.actions"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"

// ── Validation format de clé API ──────────────────────────────────────────────

const KEY_PATTERNS: Partial<Record<string, RegExp>> = {
  anthropic:  /^sk-ant-/,
  openai:     /^sk-/,
  openrouter: /^sk-or-/,
  replicate:  /^r8_/,
  perplexity: /^pplx-/,
}

// ── Catégories ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<AiProviderKeyCategory, { label: string; icon: React.ReactNode; color: string }> = {
  text:        { label: "Génération de texte",  icon: <Type         className="size-3.5" />, color: "text-violet-400" },
  image:       { label: "Génération d'images",  icon: <Image        className="size-3.5" />, color: "text-blue-400" },
  video:       { label: "Génération de vidéos", icon: <Video        className="size-3.5" />, color: "text-pink-400" },
  audio:       { label: "Génération audio",     icon: <Mic          className="size-3.5" />, color: "text-amber-400" },
  infographic: { label: "Infographies",         icon: <LayoutTemplate className="size-3.5" />, color: "text-teal-400" },
}

const CATEGORY_ORDER: AiProviderKeyCategory[] = ["text", "image", "video", "audio", "infographic"]

// ── Métadonnées visuelles par provider ───────────────────────────────────────

type ProviderMeta = {
  color: string
  bg: string
  icon: string
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  moonshot:      { color: "text-teal-400",    bg: "bg-teal-500/15 border-teal-500/20",     icon: "K" },
  anthropic:     { color: "text-orange-400",  bg: "bg-orange-500/15 border-orange-500/20", icon: "A" },
  openai:        { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/20", icon: "O" },
  perplexity:    { color: "text-violet-400",  bg: "bg-violet-500/15 border-violet-500/20", icon: "P" },
  fal_ai:        { color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/20",     icon: "F" },
  replicate:     { color: "text-sky-400",     bg: "bg-sky-500/15 border-sky-500/20",       icon: "R" },
  together_ai:   { color: "text-pink-400",    bg: "bg-pink-500/15 border-pink-500/20",     icon: "T" },
  openrouter:    { color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/20",   icon: "OR" },
  nano_banana:   { color: "text-yellow-400",  bg: "bg-yellow-500/15 border-yellow-500/20", icon: "N" },
  veo:           { color: "text-blue-300",    bg: "bg-blue-500/15 border-blue-500/20",     icon: "V" },
  sora:          { color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/20", icon: "S" },
  runway:        { color: "text-rose-400",    bg: "bg-rose-500/15 border-rose-500/20",     icon: "RW" },
  kling:         { color: "text-purple-400",  bg: "bg-purple-500/15 border-purple-500/20", icon: "KL" },
  luma_ray:      { color: "text-cyan-400",    bg: "bg-cyan-500/15 border-cyan-500/20",     icon: "L" },
  wan:           { color: "text-lime-400",    bg: "bg-lime-500/15 border-lime-500/20",     icon: "W" },
  ltx_video:     { color: "text-indigo-400",  bg: "bg-indigo-500/15 border-indigo-500/20", icon: "LX" },
  minimax_video: { color: "text-fuchsia-400", bg: "bg-fuchsia-500/15 border-fuchsia-500/20", icon: "M" },
  hailuo:        { color: "text-orange-300",  bg: "bg-orange-500/15 border-orange-500/20", icon: "H" },
}

function formatDate(iso: string | null, neverLabel: string, locale: string): string {
  if (!iso) return neverLabel
  return new Date(iso).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Composant modal de configuration ─────────────────────────────────────────

type ConfigModalProps = {
  providerKey: AiProviderKey
  onClose: () => void
  onSaved: () => void
}

function ConfigModal({ providerKey, onClose, onSaved }: ConfigModalProps) {
  const t = useTranslations("admin")
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [notes, setNotes] = useState(providerKey.notes ?? "")
  const [showKey, setShowKey] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const expectedPattern = KEY_PATTERNS[providerKey.provider]
  const keyFormatWarning =
    apiKeyInput.trim() && expectedPattern && !expectedPattern.test(apiKeyInput.trim())
      ? `Format inattendu pour ${providerKey.provider} — vérifiez que la clé est correcte.`
      : null

  function handleSave() {
    if (!apiKeyInput.trim()) {
      setError(t("apiKeyRequired"))
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await upsertProviderKey(providerKey.provider, apiKeyInput.trim(), notes.trim() || undefined)

      if ("error" in result) {
        setError(result.error)
        return
      }

      onSaved()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Key className="size-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-foreground">
              {t("configureProvider")}{providerKey.display_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XCircle className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Info BYOK existante */}
          {providerKey.has_byok_key && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300">
                {t("existingBYOK")}
              </p>
            </div>
          )}

          {/* Champ clé API */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("apiKeyLabel")}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-... / sk-... / fal-..."
                className="w-full rounded-lg border border-border bg-muted/30 px-3 pr-10 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {keyFormatWarning && (
              <p className="text-[11px] text-orange-400">{keyFormatWarning}</p>
            )}
            <p className="text-[11px] text-muted-foreground/70">
              {t("apiKeyEncryptionNote")}
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("notesLabel")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={2}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
              <AlertCircle className="size-3.5 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !apiKeyInput.trim()}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────

type Props = {
  initialKeys: AiProviderKey[]
}

export function ProviderKeysPanel({ initialKeys }: Props) {
  const t = useTranslations("admin")
  const intlLocale = useIntlLocale()
  const [keys, setKeys] = useState(initialKeys)
  const [configuringProvider, setConfiguringProvider] = useState<string | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [deletingProvider, setDeletingProvider] = useState<string | null>(null)
  const [confirmDeleteProvider, setConfirmDeleteProvider] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; latency?: number }>>({})
  const [deleteErrors, setDeleteErrors] = useState<Record<string, string>>({})

  function reload() {
    void (async () => {
      try {
        const { getProviderKeys } = await import("@/lib/actions/admin.actions")
        const result = await getProviderKeys()
        if ("data" in result) setKeys(result.data)
      } catch {
        // Ignore
      }
    })()
  }

  async function handleTest(provider: string) {
    setTestingProvider(provider)
    setTestResults((prev) => {
      const next = { ...prev }
      delete next[provider]
      return next
    })

    const result = await testProviderKey(provider)

    setTestingProvider(null)

    if ("error" in result) {
      setTestResults((prev) => ({ ...prev, [provider]: { success: false, message: result.error } }))
      reload()
    } else {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: true, message: result.message, latency: result.latency_ms },
      }))
      reload()
    }
  }

  async function executeDelete(provider: string) {
    setConfirmDeleteProvider(null)
    setDeletingProvider(provider)
    setDeleteErrors((prev) => {
      const next = { ...prev }
      delete next[provider]
      return next
    })

    const result = await deleteProviderKey(provider)

    setDeletingProvider(null)

    if ("error" in result) {
      setDeleteErrors((prev) => ({ ...prev, [provider]: result.error }))
    } else {
      reload()
    }
  }

  // Grouper par catégorie
  const byCategory = CATEGORY_ORDER.reduce<Record<AiProviderKeyCategory, AiProviderKey[]>>(
    (acc, cat) => {
      acc[cat] = keys.filter((k) => k.category === cat)
      return acc
    },
    { text: [], image: [], video: [], audio: [], infographic: [] }
  )

  function renderCard(k: AiProviderKey) {
    const meta = PROVIDER_META[k.provider] ?? { color: "text-muted-foreground", bg: "bg-muted border-border", icon: k.provider.slice(0, 2).toUpperCase() }
    const isTesting = testingProvider === k.provider
    const isDeleting = deletingProvider === k.provider
    const testResult = testResults[k.provider]
    const deleteError = deleteErrors[k.provider]

    let statusBadge: React.ReactNode
    if (k.has_byok_key) {
      statusBadge = (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          <span className="size-1 rounded-full bg-emerald-400" />
          BYOK
        </span>
      )
    } else if (!k.is_active) {
      statusBadge = (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {t("inactive")}
        </span>
      )
    } else {
      statusBadge = (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-400">
          ENV
        </span>
      )
    }

    return (
      <div
        key={k.provider}
        className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`size-8 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 ${meta.bg} ${meta.color}`}>
              {meta.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">{k.display_name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{k.provider}</p>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Dernière vérification */}
        <div className="text-[11px] text-muted-foreground/70 space-y-0.5">
          <p>{t("tested")}{formatDate(k.last_tested_at, t("never"), intlLocale)}</p>
          {k.last_tested_at && (
            <p>
              {t("testResult")}
              {k.last_test_success === true ? (
                <span className="text-emerald-400">{t("testSuccess")}</span>
              ) : k.last_test_success === false ? (
                <span className="text-red-400">{t("testFailure")}</span>
              ) : (
                "—"
              )}
            </p>
          )}
        </div>

        {/* Résultat du test en temps réel */}
        {testResult && (
          <div className={`rounded-lg border px-2.5 py-2 ${testResult.success ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <div className="flex items-center gap-1.5">
              {testResult.success ? (
                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="size-3 text-red-400 shrink-0" />
              )}
              <p className={`text-[11px] font-medium ${testResult.success ? "text-emerald-400" : "text-red-400"}`}>
                {testResult.message}
                {testResult.success && testResult.latency !== undefined && (
                  <span className="ml-1 opacity-70">({testResult.latency} ms)</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Erreur suppression */}
        {deleteError && (
          <div className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-2">
            <AlertCircle className="size-3 text-red-400 shrink-0" />
            <p className="text-[11px] text-red-400">{deleteError}</p>
          </div>
        )}

        {/* Notes */}
        {k.notes && (
          <p className="text-[11px] text-muted-foreground/60 italic line-clamp-2">{k.notes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            type="button"
            onClick={() => setConfiguringProvider(k.provider)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Key className="size-3" />
            {t("configure")}
          </button>

          <button
            type="button"
            onClick={() => { void handleTest(k.provider) }}
            disabled={isTesting}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1.5 text-xs text-violet-400 hover:bg-violet-500/15 transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <FlaskConical className="size-3" />
            )}
            {t("test")}
          </button>

          {k.has_byok_key && (
            <button
              type="button"
              onClick={() => setConfirmDeleteProvider(k.provider)}
              disabled={isDeleting}
              className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              title={t("deleteBYOKTooltip")}
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        {CATEGORY_ORDER.map((cat) => {
          const catKeys = byCategory[cat]
          if (catKeys.length === 0) return null
          const meta = CATEGORY_META[cat]
          return (
            <section key={cat}>
              {/* En-tête de catégorie */}
              <div className="flex items-center gap-2 mb-3">
                <span className={meta.color}>{meta.icon}</span>
                <h3 className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>
                  {meta.label}
                </h3>
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] text-muted-foreground/50 font-mono">
                  {catKeys.filter((k) => k.has_byok_key).length}/{catKeys.length} BYOK
                </span>
              </div>

              {/* Grille de cartes */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {catKeys.map((k) => renderCard(k))}
              </div>
            </section>
          )
        })}

        {keys.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {t("noProviderConfiguredMessage")}
          </p>
        )}
      </div>

      {/* Modal de configuration */}
      {configuringProvider !== null &&
        keys.find((k) => k.provider === configuringProvider) != null && (
          <ConfigModal
            providerKey={keys.find((k) => k.provider === configuringProvider)!}
            onClose={() => setConfiguringProvider(null)}
            onSaved={() => {
              setConfiguringProvider(null)
              reload()
            }}
          />
        )}

      {/* Dialog de confirmation suppression clé */}
      <ConfirmDialog
        open={confirmDeleteProvider !== null}
        title={t("deleteBYOKKey")}
        description={t("deleteBYOKKeyDescription")}
        confirmLabel={t("delete")}
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteProvider) void executeDelete(confirmDeleteProvider)
        }}
        onCancel={() => setConfirmDeleteProvider(null)}
      />
    </>
  )
}
