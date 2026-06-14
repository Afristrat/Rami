import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireFeature } from '@/lib/billing/require-feature'
import { getTranscriptionDetailAction } from '@/lib/actions/transcriptions.actions'
import TranscriptionResult from '@/components/transcriptions/TranscriptionResult'
import { TranscriptionDetailBackLink } from './back-link'

interface TranscriptionDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TranscriptionDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const { transcription } = await getTranscriptionDetailAction(id)

  return {
    title: transcription
      ? `${transcription.title} \u2014 Transcription \u2014 RAMI`
      : 'Transcription \u2014 RAMI',
    description: transcription?.ai_summary ?? 'D\u00e9tail de la transcription.',
  }
}

export default async function TranscriptionDetailPage({ params }: TranscriptionDetailPageProps) {
  await requireFeature('transcription')

  const { id } = await params
  const { transcription } = await getTranscriptionDetailAction(id)

  // Transcription inexistante (ou hors tenant) \u2192 vrai 404, jamais de donn\u00e9es de d\u00e9mo.
  if (!transcription) notFound()

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Back navigation */}
      <TranscriptionDetailBackLink />

      {/* Transcription result */}
      <TranscriptionResult transcription={transcription} />
    </div>
  )
}
