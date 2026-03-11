import { Metadata } from 'next'
import { CreatePageClient } from '@/components/visual/CreatePageClient'
import { getTenantBrandDNAAction } from '@/lib/actions/visual.actions'

export const metadata: Metadata = {
  title: 'Créer des visuels — RAMI',
  description: 'Génération de contenu visuel neuropsychologique calibré sur votre Brand DNA',
}

export default async function CreatePage() {
  const dnaInfo = await getTenantBrandDNAAction()

  return (
    <CreatePageClient
      hasBrandDNA={dnaInfo.hasDNA}
      brandName={dnaInfo.brandName}
      defaultPlatform={dnaInfo.platform ?? 'instagram'}
    />
  )
}
