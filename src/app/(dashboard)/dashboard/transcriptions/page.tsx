import { getTranslations } from 'next-intl/server'
import { requireFeature } from '@/lib/billing/require-feature'
import { getTranscriptionsAction } from '@/lib/actions/transcriptions.actions'
import TranscriptionUploadZone from '@/components/transcriptions/TranscriptionUploadZone'
import TranscriptionList from '@/components/transcriptions/TranscriptionList'
import { TranscriptionsPageHeader } from './header'

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("transcriptions"),
    description: t("transcriptionsDescription"),
  }
}

export default async function TranscriptionsPage() {
  // Feature flag : transcription disponible \u00e0 partir du plan Pro
  await requireFeature('transcription')

  const { transcriptions } = await getTranscriptionsAction()

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <TranscriptionsPageHeader />

      {/* Upload zone */}
      <TranscriptionUploadZone />

      {/* Transcription list */}
      <TranscriptionList transcriptions={transcriptions} />
    </div>
  )
}
