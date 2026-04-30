import { getTranslations } from "next-intl/server"
import { getBrandAssetsAction } from "@/lib/actions/brand-dna.actions"
import { BrandAssetsManager } from "@/components/brand-dna/brand-assets-manager"
import { BrandDnaNav } from "@/components/brand-dna/brand-dna-nav"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("brandDna"),
    description: t("brandDnaDescription"),
  }
}

export default async function BrandAssetsPage() {
  const t = await getTranslations("brandDna.assets")
  const result = await getBrandAssetsAction()

  const initialAssets = "data" in result ? result.data : []

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

      <BrandAssetsManager initialAssets={initialAssets} />
    </div>
  )
}
