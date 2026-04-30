"use client"

import { AlertTriangle, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

type Variant = "danger" | "warning"

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: Variant
}

/**
 * Dialog de confirmation stylisé — remplace window.confirm partout dans l'admin.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  variant = "danger",
}: Props) {
  const t = useTranslations("admin")

  if (!open) return null

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-500 text-white"
      : "bg-orange-600 hover:bg-orange-500 text-white"

  const iconClass =
    variant === "danger"
      ? "text-red-400 bg-red-500/10 border-red-500/20"
      : "text-orange-400 bg-orange-500/10 border-orange-500/20"

  const Icon = variant === "danger" ? Trash2 : AlertTriangle

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
        <div className="px-5 py-5 space-y-4">
          {/* Icon */}
          <div className={`flex size-10 items-center justify-center rounded-xl border ${iconClass}`}>
            <Icon className="size-5" />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${confirmClass}`}
          >
            {confirmLabel ?? t("confirm")}
          </button>
        </div>
      </div>
    </div>
  )
}
