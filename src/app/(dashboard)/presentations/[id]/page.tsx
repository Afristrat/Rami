import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireFeature } from "@/lib/billing/require-feature"
import { getPresentationDetailAction } from "@/lib/actions/presentation.actions"
import { DeckViewer } from "@/components/presentations/DeckViewer"

interface PresentationPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PresentationPageProps) {
  const { id } = await params
  const { presentation } = await getPresentationDetailAction(id)
  const t = await getTranslations("metadata")
  return {
    title: presentation ? `${presentation.title} — RAMI` : t("presentations"),
    description: t("presentationsDescription"),
  }
}

export default async function PresentationPage({ params }: PresentationPageProps) {
  await requireFeature("document_engine")
  const { id } = await params
  const { presentation } = await getPresentationDetailAction(id)
  if (!presentation) notFound()

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <DeckViewer id={presentation.id} title={presentation.title} content={presentation.content} />
    </div>
  )
}
