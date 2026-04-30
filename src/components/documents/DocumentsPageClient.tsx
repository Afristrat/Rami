"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Plus, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { TemplateCards } from "./TemplateCards"
import { DocumentsTable } from "./DocumentsTable"
import { CreateDocumentDialog } from "./CreateDocumentDialog"
import { DocumentsCTA } from "./DocumentsCTA"
import { WorkspaceUsage } from "./WorkspaceUsage"
import type { DocumentItem } from "@/lib/actions/documents.actions"
import type { DocumentType } from "@/lib/schemas/document.schema"

interface DocumentsPageClientProps {
  documents: DocumentItem[]
  total: number
}

export function DocumentsPageClient({ documents, total }: DocumentsPageClientProps) {
  const t = useTranslations("documents")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<DocumentType>("offre_commerciale")
  const templateRef = useRef<HTMLDivElement>(null)

  const openCreateDialog = (type: DocumentType) => {
    setSelectedType(type)
    setDialogOpen(true)
  }

  const scrollToTemplates = () => {
    templateRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("subtitleFull")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className={cn(
                "h-9 w-64 rounded-lg pl-9 pr-3 text-sm outline-none transition-colors",
                "bg-background border border-border text-foreground placeholder:text-muted-foreground",
                "focus-visible:ring-2 focus-visible:ring-violet-500/50"
              )}
            />
          </div>
          <button
            type="button"
            onClick={() => openCreateDialog("offre_commerciale")}
            className={cn(
              "inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
              "bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
            )}
          >
            <Plus className="size-4" />
            {t("createDocument")}
          </button>
        </div>
      </div>

      {/* Template cards */}
      <div ref={templateRef}>
        <TemplateCards onSelectType={openCreateDialog} />
      </div>

      {/* Documents table */}
      <DocumentsTable documents={documents} total={total} />

      {/* Workspace usage */}
      <WorkspaceUsage documents={documents} />

      {/* CTA */}
      <DocumentsCTA
        onLaunchOffer={() => openCreateDialog("offre_commerciale")}
        onViewTemplates={scrollToTemplates}
      />

      {/* Create dialog */}
      <CreateDocumentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={selectedType}
      />
    </div>
  )
}
