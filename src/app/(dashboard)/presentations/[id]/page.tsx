import { getTranslations } from "next-intl/server"
import { PresentationWizard } from "@/components/presentations/presentation-wizard"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("presentations"),
    description: t("presentationsDescription"),
  }
}

export default function PresentationPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <PresentationWizard />
    </div>
  )
}
