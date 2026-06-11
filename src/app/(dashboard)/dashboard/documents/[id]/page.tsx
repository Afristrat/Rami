import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireFeature } from "@/lib/billing/require-feature"
import { getDocumentDetailAction } from "@/lib/actions/documents.actions"
import { CommercialOfferContentSchema } from "@/lib/services/documents/commercial-offer"
import { CommercialOfferView } from "@/components/documents/CommercialOfferView"

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: DocumentDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getDocumentDetailAction(id)

  return {
    title: "error" in result ? "Document — RAMI" : `${result.data.title} — RAMI`,
    description: "Détail du document.",
  }
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  await requireFeature("document_engine")

  const { id } = await params
  const result = await getDocumentDetailAction(id)

  if ("error" in result) notFound()

  const doc = result.data

  // Contenu d'offre : validé côté serveur, null si absent ou non conforme.
  const parsedContent = CommercialOfferContentSchema.safeParse(doc.content_json)
  const offerContent = parsedContent.success ? parsedContent.data : null

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <CommercialOfferView
        document={{
          id: doc.id,
          title: doc.title,
          type: doc.type,
          client_name: doc.client_name,
          status: doc.status,
          created_at: doc.created_at,
        }}
        content={offerContent}
      />
    </div>
  )
}
