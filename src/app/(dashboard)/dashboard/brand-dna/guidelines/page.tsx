import { getTranslations } from "next-intl/server"
import { getGuidelinesAction } from "@/lib/actions/brand-dna.actions"
import { BrandGuidelinesEditor } from "@/components/brand-dna/brand-guidelines-editor"
import { BrandDnaNav } from "@/components/brand-dna/brand-dna-nav"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("brandDna"),
    description: t("brandDnaDescription"),
  }
}

export default async function BrandGuidelinesPage() {
  const t = await getTranslations("brandDna.guidelines")
  const result = await getGuidelinesAction()

  const initialGuidelines = "data" in result
    ? result.data
    : { brandStory: "", coreValues: "", usageRules: "" }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      <BrandDnaNav />

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t("subtitle")}
        </p>
      </div>

      <BrandGuidelinesEditor initialGuidelines={initialGuidelines} />
    </div>
  )
}
