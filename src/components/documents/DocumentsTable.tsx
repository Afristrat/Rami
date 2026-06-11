"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"
import {
  FileText,
  BarChart3,
  Presentation,
  Eye,
  Download,
  Copy,
  Trash2,
  LayoutList,
  LayoutGrid,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentStatusBadge } from "./DocumentStatusBadge"
import {
  deleteDocumentAction,
  duplicateDocumentAction,
  type DocumentItem,
} from "@/lib/actions/documents.actions"
import type { DocumentType } from "@/lib/schemas/document.schema"
import type { LucideIcon } from "lucide-react"

// ── Config par type (libellés via i18n) ────────────────────

interface TypeConfig {
  labelKey: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  badgeClass: string
}

const TYPE_CONFIG: Record<DocumentType, TypeConfig> = {
  offre_commerciale: {
    labelKey: "typeProposal",
    icon: FileText,
    iconColor: "text-violet-500 dark:text-violet-400",
    iconBg: "bg-violet-500/10",
    badgeClass: "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400",
  },
  rapport_client: {
    labelKey: "typeReport",
    icon: BarChart3,
    iconColor: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-500/10",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  presentation: {
    labelKey: "typePresentation",
    icon: Presentation,
    iconColor: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
    badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
}

// ── Formatage date ─────────────────────────────────────────

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

// ── Props ──────────────────────────────────────────────────

interface DocumentsTableProps {
  documents: DocumentItem[]
  total: number
}

// ── Composant ──────────────────────────────────────────────

export function DocumentsTable({ documents, total }: DocumentsTableProps) {
  const t = useTranslations("documents")
  const intlLocale = useIntlLocale()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      await deleteDocumentAction(id)
      setDeletingId(null)
    })
  }

  const handleView = (id: string) => {
    router.push(`/dashboard/documents/${id}`)
  }

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      await duplicateDocumentAction(id)
      router.refresh()
    })
  }

  const actionButtonClasses = cn(
    "p-1.5 rounded-md transition-colors",
    "hover:bg-muted",
    "text-muted-foreground hover:text-foreground dark:hover:text-white"
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground dark:text-white">
          {t("recentDocuments")}
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({total})
            </span>
          )}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={cn(
              "p-2 rounded-lg transition-colors",
              "hover:bg-muted text-muted-foreground"
            )}
          >
            <Filter className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-muted text-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-muted text-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <LayoutList className="size-4" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <div
          className={cn(
            "rounded-2xl p-12 text-center",
            "glass-card"
          )}
        >
          <FileText className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">
            {t("noDocumentsCreate")}
          </p>
        </div>
      )}

      {/* List view */}
      {documents.length > 0 && viewMode === "list" && (
        <div
          className={cn(
            "rounded-2xl overflow-hidden shadow-sm",
            "glass-card"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("documentColumn")}
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("typeColumn")}
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("clientColumn")}
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("dateColumn")}
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("statusColumn")}
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("actionsColumn")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map((doc) => {
                  const typeConfig = TYPE_CONFIG[doc.type]
                  const Icon = typeConfig.icon
                  const isDeleting = deletingId === doc.id && isPending

                  return (
                    <tr
                      key={doc.id}
                      className={cn(
                        "group transition-colors hover:bg-muted/50",
                        isDeleting && "opacity-50"
                      )}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-8 items-center justify-center rounded-lg",
                              typeConfig.iconBg
                            )}
                          >
                            <Icon className={cn("size-4", typeConfig.iconColor)} />
                          </div>
                          <span className="font-medium text-foreground dark:text-white">
                            {doc.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                            typeConfig.badgeClass
                          )}
                        >
                          {t(typeConfig.labelKey)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {doc.client_name ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {formatDate(doc.created_at, intlLocale)}
                      </td>
                      <td className="px-6 py-4">
                        <DocumentStatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleView(doc.id)}
                            className={actionButtonClasses}
                            title={t("viewAction")}
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleView(doc.id)}
                            className={actionButtonClasses}
                            title={t("downloadAction")}
                          >
                            <Download className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(doc.id)}
                            disabled={isPending}
                            className={actionButtonClasses}
                            title={t("duplicateAction")}
                          >
                            <Copy className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            disabled={isDeleting}
                            className={cn(
                              "p-1.5 rounded-md transition-colors",
                              "hover:bg-red-50 dark:hover:bg-red-500/10",
                              "text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
                            )}
                            title={t("deleteAction")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid view */}
      {documents.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const typeConfig = TYPE_CONFIG[doc.type]
            const Icon = typeConfig.icon
            const isDeleting = deletingId === doc.id && isPending

            return (
              <div
                key={doc.id}
                className={cn(
                  "group rounded-2xl p-5 transition-all",
                  "glass-card shadow-sm hover:shadow-md dark:hover:border-white/[0.15]",
                  isDeleting && "opacity-50"
                )}
              >
                {/* Preview zone */}
                <div
                  className={cn(
                    "flex items-center justify-center h-28 rounded-xl mb-4",
                    "bg-muted/30"
                  )}
                >
                  <Icon className={cn("size-10 opacity-30", typeConfig.iconColor)} />
                </div>

                {/* Info */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-sm text-foreground dark:text-white line-clamp-1">
                    {doc.title}
                  </h3>
                  <DocumentStatusBadge status={doc.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{doc.client_name ?? "—"}</span>
                  <span>{formatDate(doc.created_at, intlLocale)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => handleView(doc.id)}
                    className={actionButtonClasses}
                    title={t("viewAction")}
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleView(doc.id)}
                    className={actionButtonClasses}
                    title={t("downloadAction")}
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(doc.id)}
                    disabled={isPending}
                    className={actionButtonClasses}
                    title={t("duplicateAction")}
                  >
                    <Copy className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    disabled={isDeleting}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      "hover:bg-red-50 dark:hover:bg-red-500/10",
                      "text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
                    )}
                    title={t("deleteAction")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
