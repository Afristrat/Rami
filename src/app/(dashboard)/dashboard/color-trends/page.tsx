import { getTranslations } from "next-intl/server"
import { requireFeature } from "@/lib/billing/require-feature"
import { getColorTrendReportAction } from "@/lib/actions/color-trends.actions"
import { ColorTrendsClient } from "@/components/reports/ColorTrendsClient"

export async function generateMetadata() {
  const t = await getTranslations("colorTrends")
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function ColorTrendsPage() {
  // Rapport tendances couleur = feature Performance Loop (Pro et supérieurs).
  await requireFeature("performance_loop")

  const result = await getColorTrendReportAction()
  const initial = result.success ? result.data : null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <ColorTrendsClient initial={initial} />
    </div>
  )
}
