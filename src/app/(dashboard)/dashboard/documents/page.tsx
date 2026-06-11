import { getTranslations } from "next-intl/server"
import { requireFeature } from "@/lib/billing/require-feature"
import { getDocumentsAction } from "@/lib/actions/documents.actions"
import { DocumentsPageClient } from "@/components/documents/DocumentsPageClient"
import type { DocumentItem } from "@/lib/actions/documents.actions"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("documents"),
    description: t("documentsDescription"),
  }
}

/* ── Page serveur ─────────────────────────────────────────── */

export default async function DocumentsPage() {
  // Feature flag : plan Agency ou supérieur requis
  await requireFeature("document_engine")

  // Lecture exclusive de la vraie table — état vide honnête, jamais de démo.
  const result = await getDocumentsAction({ limit: 50 })

  const documents: DocumentItem[] = "error" in result ? [] : result.data
  const total = "error" in result ? 0 : result.total

  return <DocumentsPageClient documents={documents} total={total} />
}
