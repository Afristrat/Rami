"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  createDocumentAction,
  createCommercialOfferAction,
} from "@/lib/actions/documents.actions"
import type { DocumentType } from "@/lib/schemas/document.schema"

const TYPE_LABEL_KEYS: Record<DocumentType, string> = {
  offre_commerciale: "typeProposal",
  rapport_client: "typeReport",
  presentation: "typePresentation",
}

interface CreateDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: DocumentType
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
  defaultType = "offre_commerciale",
}: CreateDocumentDialogProps) {
  const t = useTranslations("documents")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [type, setType] = useState<DocumentType>(defaultType)
  const [title, setTitle] = useState("")
  const [clientName, setClientName] = useState("")
  const [brief, setBrief] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Synchroniser le type par défaut quand le dialog s'ouvre
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setType(defaultType)
      setTitle("")
      setClientName("")
      setBrief("")
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (title.trim().length < 3) {
      setError(t("titleMinError"))
      return
    }

    startTransition(async () => {
      const input = {
        title: title.trim(),
        type,
        client_name: clientName.trim() || undefined,
        brief: brief.trim() || undefined,
      }

      // Offre commerciale → génération IA réelle (US-025) puis ouverture du document.
      // Autres types → brouillon honnête (génération à venir : US-026, US-041+).
      const result =
        type === "offre_commerciale"
          ? await createCommercialOfferAction(input)
          : await createDocumentAction(input)

      if ("error" in result) {
        setError(result.error)
      } else {
        onOpenChange(false)
        if (type === "offre_commerciale") {
          router.push(`/dashboard/documents/${result.data.id}`)
        }
      }
    })
  }

  const inputClasses = cn(
    "w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors",
    "bg-background border border-border text-foreground placeholder:text-muted-foreground",
    "focus-visible:ring-2 focus-visible:ring-violet-500/50"
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("createDocumentTitle")}</DialogTitle>
          <DialogDescription>
            {t("createDocumentDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-2">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground dark:text-white">
              {t("documentType")}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className={inputClasses}
            >
              {(Object.entries(TYPE_LABEL_KEYS) as [DocumentType, string][]).map(
                ([value, key]) => (
                  <option key={value} value={value}>
                    {t(key)}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Titre */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground dark:text-white">
              {t("titleLabel")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
              className={inputClasses}
              maxLength={500}
            />
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground dark:text-white">
              {t("clientLabel")}
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t("clientPlaceholder")}
              className={inputClasses}
              maxLength={255}
            />
          </div>

          {/* Brief */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground dark:text-white">
              {t("briefLabel")}
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder={t("briefPlaceholder")}
              rows={4}
              className={cn(inputClasses, "resize-none")}
              maxLength={5000}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </form>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={cn(
              "inline-flex items-center h-9 px-4 rounded-lg text-sm font-medium transition-colors",
              "bg-card border-border text-foreground hover:bg-muted"
            )}
          >
            {tCommon("cancel")}
          </button>
          <button
            type="submit"
            disabled={isPending}
            onClick={handleSubmit}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-5 rounded-lg text-sm font-semibold text-white",
              "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Sparkles className="size-4" />
            {isPending ? t("generating") : t("generateWithAi")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
