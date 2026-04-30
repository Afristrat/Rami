import { PresentationsListContent } from "./list-content"

export async function generateMetadata() {
  const { getTranslations } = await import("next-intl/server")
  const t = await getTranslations("metadata")
  return {
    title: t("presentations"),
    description: t("presentationsDescription"),
  }
}

export default function PresentationsListPage() {
  return <PresentationsListContent />
}
