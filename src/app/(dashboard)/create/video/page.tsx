import { getTranslations } from 'next-intl/server'
import { VideoGeneratorClient } from '@/components/visual/VideoGeneratorClient'

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("video"),
    description: t("videoDescription"),
  }
}

export default function VideoPage() {
  return <VideoGeneratorClient />
}
