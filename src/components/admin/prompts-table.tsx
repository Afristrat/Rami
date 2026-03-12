"use client"

import { useState, useCallback, useTransition } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Key,
  ChevronRight,
  AlertCircle,
} from "lucide-react"
import type { AiPromptConfig } from "@/lib/actions/admin-prompts.actions"
import { deletePromptAction } from "@/lib/actions/admin-prompts.actions"
import { PromptEditDialog } from "./prompt-edit-dialog"

const PROVIDER_LABELS: Record<string, { label: string; color: string }> = {
  anthropic:  { label: "Anthropic", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  openai:     { label: "OpenAI",    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  openrouter: { label: "OpenRouter", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  perplexity: { label: "Perplexity", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

type Props = {
  initialConfigs: AiPromptConfig[]
}

export function PromptsTable({ initialConfigs }: Props) {
  const [configs, setConfigs] = useState(initialConfigs)
  const [editingConfig, setEditingConfig] = useState<AiPromptConfig | null | "new">(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const refresh = useCallback(() => {
    // Recharge les configs depuis le serveur
    startTransition(async () => {
      try {
        const { getPromptsAction } = await import("@/lib/actions/admin-prompts.actions")
        const result = await getPromptsAction()
        if ("data" in result) {
          setConfigs(result.data)
        }
      } catch {
        // Ignore
      }
    })
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id)
      setDeleteError(null)

      const result = await deletePromptAction(id)

      setDeletingId(null)

      if ("error" in result) {
        setDeleteError(result.error)
        return
      }

      setConfigs((prev) => prev.filter((c) => c.id !== id))
    },
    []
  )

  const handleSaved = useCallback(() => {
    setEditingConfig(null)
    refresh()
  }, [refresh])

  return (
    <>
      {/* Header actions */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {configs.length} configuration{configs.length > 1 ? "s" : ""} IA
            {isPending && <span className="ml-2 text-violet-400">Actualisation…</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingConfig("new")}
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

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {configs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <Key className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Aucune configuration prompt</p>
            <button
              type="button"
              onClick={() => setEditingConfig("new")}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300"
            >
              Créer la première config →
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Clé</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Provider · Modèle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Description</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">BYOK</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">Modifié</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {configs.map((config) => {
                const provider = PROVIDER_LABELS[config.provider] ?? {
                  label: config.provider,
                  color: "text-muted-foreground bg-muted border-border",
                }
                const isDeleting = deletingId === config.id

                return (
                  <tr
                    key={config.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    {/* Clé fonctionnelle */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <code className="text-xs font-mono text-foreground font-medium">
                          {config.field_key}
                        </code>
                        {/* Mobile : provider sous la clé */}
                        <span className={`sm:hidden inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${provider.color}`}>
                          {provider.label}
                        </span>
                      </div>
                    </td>

                    {/* Provider + Modèle */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${provider.color}`}>
                          {provider.label}
                        </span>
                        <code className="text-[11px] text-muted-foreground font-mono truncate max-w-[160px]">
                          {config.model}
                        </code>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {config.description ?? <span className="opacity-40">—</span>}
                      </p>
                    </td>

                    {/* BYOK */}
                    <td className="px-4 py-3 text-center">
                      {config.has_byok_key ? (
                        <span title="Clé BYOK configurée" className="flex justify-center">
                          <CheckCircle2 className="size-3.5 text-amber-400" />
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40 mx-auto block">env</span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3 text-center">
                      {config.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-400">
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          <XCircle className="size-2.5" />
                          Inactif
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(config.updated_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditingConfig(config)}
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Modifier"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Supprimer "${config.field_key}" ?`)) {
                              void handleDelete(config.id)
                            }
                          }}
                          disabled={isDeleting}
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                        <ChevronRight className="size-3.5 text-muted-foreground/30" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit dialog */}
      {editingConfig !== null && (
        <PromptEditDialog
          config={editingConfig === "new" ? null : editingConfig}
          onClose={() => setEditingConfig(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
