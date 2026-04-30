import { CreatePageClient } from '@/components/visual/CreatePageClient'
import { getTenantBrandDNAAction } from '@/lib/actions/visual.actions'
import { getCurrentTenantPlan } from '@/lib/billing/require-feature'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("create"),
    description: t("createDescription"),
  }
}

export default async function CreatePage() {
  const [dnaInfo, planData] = await Promise.all([
    getTenantBrandDNAAction(),
    getCurrentTenantPlan(),
  ])

  return (
    <CreatePageClient
      hasBrandDNA={dnaInfo.hasDNA}
      brandName={dnaInfo.brandName}
      defaultPlatform={dnaInfo.platform ?? 'instagram'}
      currentPlan={planData?.plan ?? 'free'}
      brandDNASummary={dnaInfo.summary}
    />
  )
}
