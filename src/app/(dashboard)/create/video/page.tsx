import { getTranslations } from 'next-intl/server'
import { VideoWorkspace } from '@/components/visual/VideoWorkspace'

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("video"),
    description: t("videoDescription"),
  }
}

export default function VideoPage() {
  return <VideoWorkspace />
}
