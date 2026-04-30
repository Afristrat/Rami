import { getTranslations } from "next-intl/server"
import { requireFeature } from "@/lib/billing/require-feature"
import { getDocumentsAction } from "@/lib/actions/documents.actions"
import { DocumentsPageClient } from "@/components/documents/DocumentsPageClient"
import type { DocumentItem } from "@/lib/actions/documents.actions"
import type { DocumentType, DocumentStatus } from "@/lib/schemas/document.schema"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("documents"),
    description: t("documentsDescription"),
  }
}

/* ── Mock data pour l'affichage initial (avant migration DB) ── */

const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: "mock-1",
    title: "Stratégie Q4 — Summit",
    type: "presentation" as DocumentType,
    client_name: "ScientUp",
    status: "in_progress" as DocumentStatus,
    storage_path: null,
    public_url: null,
    file_size_bytes: 2_450_000,
    created_at: "2023-10-12T10:00:00Z",
    updated_at: "2023-10-12T10:00:00Z",
  },
  {
    id: "mock-2",
    title: "Offre Social Ads Octobre",
    type: "offre_commerciale" as DocumentType,
    client_name: "Luxe Design",
    status: "in_progress" as DocumentStatus,
    storage_path: null,
    public_url: null,
    file_size_bytes: 1_200_000,
    created_at: "2023-10-10T09:00:00Z",
    updated_at: "2023-10-10T09:00:00Z",
  },
  {
    id: "mock-3",
    title: "Rapport SEO — Septembre",
    type: "rapport_client" as DocumentType,
    client_name: "Ecom Store",
    status: "completed" as DocumentStatus,
    storage_path: null,
    public_url: null,
    file_size_bytes: 3_800_000,
    created_at: "2023-10-01T08:00:00Z",
    updated_at: "2023-10-01T08:00:00Z",
  },
  {
    id: "mock-4",
    title: "Draft — Marketing Mix V2",
    type: "presentation" as DocumentType,
    client_name: "Interne",
    status: "draft" as DocumentStatus,
    storage_path: null,
    public_url: null,
    file_size_bytes: 980_000,
    created_at: "2023-09-29T14:00:00Z",
    updated_at: "2023-09-29T14:00:00Z",
  },
]

/* ── Page serveur ─────────────────────────────────────────── */

export default async function DocumentsPage() {
  // Feature flag : plan Agency ou supérieur requis
  await requireFeature("document_engine")

  // Tentative de récupération depuis la DB
  const result = await getDocumentsAction({ limit: 50 })

  let documents: DocumentItem[]
  let total: number

  if ("error" in result || result.data.length === 0) {
    // Fallback vers les données de démo si la table n'existe pas encore
    documents = MOCK_DOCUMENTS
    total = MOCK_DOCUMENTS.length
  } else {
    documents = result.data
    total = result.total
  }

  return <DocumentsPageClient documents={documents} total={total} />
}
