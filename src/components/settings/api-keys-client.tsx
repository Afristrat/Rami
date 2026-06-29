"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { toast } from "sonner"
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  createApiKeyAction,
  revokeApiKeyAction,
  type ApiKeyListItem,
} from "@/lib/actions/api-keys.actions"
import { API_SCOPES, type ApiScope } from "@/lib/services/api-keys/keys"

// ─── Mapping scope → clé i18n ─────────────────────────────────────────────────

const SCOPE_LABEL_KEYS: Record<ApiScope, string> = {
  "posts:write": "scopePostsWrite",
  "content:write": "scopeContentWrite",
  "presentations:write": "scopePresentationsWrite",
  "visuals:write": "scopeVisualsWrite",
  "analytics:read": "scopeAnalyticsRead",
}

// ─── Encart « nouvelle clé » copiable ─────────────────────────────────────────

function NewKeyReveal({ rawKey, onDone }: { rawKey: string; onDone: () => void }) {
  const t = useTranslations("apiKeys")
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rawKey)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("genericError"))
    }
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <div className="mb-3 flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h4 className="font-bold text-amber-800 dark:text-amber-200">
            {t("newKeyTitle")}
          </h4>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/90">
            {t("newKeyWarning")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-amber-500/20 bg-background/60 px-3 py-2 font-mono text-sm dark:bg-black/30">
          {rawKey}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label={t("copy")}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? t("copied") : t("copy")}
        </Button>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t("dismiss")}
        </Button>
      </div>
    </div>
  )
}

// ─── Formulaire de création ───────────────────────────────────────────────────

function CreateKeyForm({ onCreated }: { onCreated: (rawKey: string) => void }) {
  const t = useTranslations("apiKeys")
  const router = useRouter()
  const [name, setName] = React.useState("")
  const [selectedScopes, setSelectedScopes] = React.useState<ApiScope[]>([])
  const [submitting, setSubmitting] = React.useState(false)

  function toggleScope(scope: ApiScope) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    const trimmed = name.trim()
    if (!trimmed) {
      toast.error(t("errorNameRequired"))
      return
    }
    if (selectedScopes.length === 0) {
      toast.error(t("errorScopeRequired"))
      return
    }

    setSubmitting(true)
    try {
      const result = await createApiKeyAction({ name: trimmed, scopes: selectedScopes })
      if (result.success) {
        toast.success(t("createSuccess"))
        setName("")
        setSelectedScopes([])
        onCreated(result.rawKey)
        router.refresh()
      } else {
        toast.error(result.error || t("genericError"))
      }
    } catch {
      toast.error(t("genericError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="size-4" />
          {t("createTitle")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="api-key-name">{t("nameLabel")}</Label>
            <Input
              id="api-key-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={100}
              disabled={submitting}
            />
          </div>

          <fieldset className="space-y-3" disabled={submitting}>
            <legend className="text-sm font-medium">{t("scopesLabel")}</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {API_SCOPES.map((scope) => {
                const checked = selectedScopes.includes(scope)
                return (
                  <label
                    key={scope}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      checked
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-input hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="size-4 accent-violet-600"
                      checked={checked}
                      onChange={() => toggleScope(scope)}
                    />
                    <span className="font-medium">{t(SCOPE_LABEL_KEYS[scope])}</span>
                    <code className="ms-auto font-mono text-xs text-muted-foreground">
                      {scope}
                    </code>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {submitting ? t("creating") : t("createButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Ligne de clé ─────────────────────────────────────────────────────────────

function KeyRow({ apiKey }: { apiKey: ApiKeyListItem }) {
  const t = useTranslations("apiKeys")
  const locale = useLocale()
  const router = useRouter()
  const [confirming, setConfirming] = React.useState(false)
  const [revoking, setRevoking] = React.useState(false)

  const isRevoked = apiKey.revoked_at !== null

  const dateFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [locale]
  )

  function formatDate(value: string | null): string {
    if (!value) return t("neverUsed")
    return dateFmt.format(new Date(value))
  }

  async function handleRevoke() {
    if (revoking) return
    setRevoking(true)
    try {
      const result = await revokeApiKeyAction(apiKey.id)
      if (result.success) {
        toast.success(t("revokeSuccess"))
        router.refresh()
      } else {
        toast.error(result.error || t("genericError"))
        setConfirming(false)
      }
    } catch {
      toast.error(t("genericError"))
      setConfirming(false)
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-colors",
        "border-gray-200/60 bg-white dark:border-white/5 dark:bg-white/[0.04]",
        isRevoked && "opacity-60"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 shrink-0 text-violet-500" />
            <h3 className="truncate font-bold text-foreground dark:text-white">
              {apiKey.name}
            </h3>
            {isRevoked ? (
              <Badge variant="destructive">{t("statusRevoked")}</Badge>
            ) : (
              <Badge variant="secondary" className="bg-green-500/15 text-green-700 dark:text-green-400">
                {t("statusActive")}
              </Badge>
            )}
          </div>

          <code className="block font-mono text-sm text-muted-foreground">
            {apiKey.key_prefix}…
          </code>

          <div className="flex flex-wrap gap-1.5">
            {apiKey.scopes.map((scope) => (
              <Badge key={scope} variant="outline" className="font-mono text-[11px]">
                {scope}
              </Badge>
            ))}
          </div>

          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <div className="flex gap-1.5">
              <dt className="font-semibold">{t("colCreated")}:</dt>
              <dd>{formatDate(apiKey.created_at)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-semibold">{t("colLastUsed")}:</dt>
              <dd>{formatDate(apiKey.last_used_at)}</dd>
            </div>
          </dl>
        </div>

        {!isRevoked && (
          <div className="shrink-0">
            {confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t("revokeConfirmText")}
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRevoke}
                  disabled={revoking}
                >
                  {revoking ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  {revoking ? t("revoking") : t("revokeConfirm")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                  disabled={revoking}
                >
                  {t("cancel")}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="size-3.5" />
                {t("revoke")}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ApiKeysClient ────────────────────────────────────────────────────────────

interface Props {
  initialKeys: ApiKeyListItem[]
}

export function ApiKeysClient({ initialKeys }: Props) {
  const t = useTranslations("apiKeys")
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="mb-2 text-3xl font-black tracking-tight text-foreground dark:text-white">
          {t("title")}
        </h2>
        <p className="text-muted-foreground dark:text-slate-400">{t("description")}</p>
      </div>

      {revealedKey && (
        <NewKeyReveal rawKey={revealedKey} onDone={() => setRevealedKey(null)} />
      )}

      <CreateKeyForm onCreated={(rawKey) => setRevealedKey(rawKey)} />

      {/* Liste des clés */}
      {initialKeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center dark:border-white/10">
          <KeyRound className="mx-auto mb-3 size-8 text-muted-foreground/60" />
          <h3 className="font-bold text-foreground dark:text-white">{t("emptyTitle")}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialKeys.map((apiKey) => (
            <KeyRow key={apiKey.id} apiKey={apiKey} />
          ))}
        </div>
      )}
    </div>
  )
}
