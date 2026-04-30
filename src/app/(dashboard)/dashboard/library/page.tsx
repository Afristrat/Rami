import { getTranslations } from "next-intl/server"
import { getMediaAssetsAction } from "@/lib/actions/library.actions"
import { MediaLibraryClient } from "@/components/library/media-library-client"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("library"),
    description: t("libraryDescription"),
  }
}

export default async function LibraryPage() {
  const result = await getMediaAssetsAction()

  const initialAssets = "error" in result ? [] : result.data
  const initialTotal = "error" in result ? 0 : result.total

  return (
    <div className="h-full overflow-hidden">
      <MediaLibraryClient
        initialAssets={initialAssets}
        initialTotal={initialTotal}
      />
    </div>
  )
}
