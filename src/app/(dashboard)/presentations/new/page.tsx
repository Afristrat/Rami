import { getTranslations } from "next-intl/server"
import { requireFeature } from "@/lib/billing/require-feature"
import { NewPresentationForm } from "@/components/presentations/NewPresentationForm"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("presentations"),
    description: t("presentationsDescription"),
  }
}

export default async function NewPresentationPage() {
  await requireFeature("document_engine")
  return <NewPresentationForm />
}
