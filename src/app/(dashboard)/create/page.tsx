import { Metadata } from 'next'
import { CreatePageClient } from '@/components/visual/CreatePageClient'
import { getTenantBrandDNAAction } from '@/lib/actions/visual.actions'
import { getCurrentTenantPlan } from '@/lib/billing/require-feature'

export const metadata: Metadata = {
  title: 'Créer des visuels — RAMI',
  description: 'Génération de contenu visuel neuropsychologique calibré sur votre Brand DNA',
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
    />
  )
}
