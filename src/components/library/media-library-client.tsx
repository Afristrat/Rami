"use client"

import { useTranslations } from "next-intl"

import { useState, useCallback, useTransition, useEffect } from "react"
import {
  Search,
  Images,
  FileText,
  Play,
  LayoutGrid,
  List,
  Loader2,
  FolderOpen,
  UploadCloud,
  Wand2,
  X,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getMediaAssetsAction,
  uploadMediaAssetAction,
  deleteMediaAssetAction,
  type MediaAsset,
  type MediaFileType,
} from "@/lib/actions/library.actions"
import { MediaCard } from "./media-card"
import { MediaLightbox } from "./media-lightbox"
import { MediaUploadDialog } from "./media-upload-dialog"

type FilterType = "all" | MediaFileType

const FILTER_TABS: { id: FilterType; labelKey: string; icon: React.ElementType }[] = [
  { id: "all", labelKey: "all", icon: LayoutGrid },
  { id: "image", labelKey: "images", icon: Images },
  { id: "video", labelKey: "videos", icon: Play },
  { id: "document", labelKey: "documents", icon: FileText },
]

interface MediaLibraryClientProps {
  initialAssets: MediaAsset[]
  initialTotal: number
}

export function MediaLibraryClient({ initialAssets, initialTotal }: MediaLibraryClientProps) {
  const t = useTranslations("library")
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets)
  const [, setTotal] = useState(initialTotal)
  const [filter, setFilter] = useState<FilterType>("all")
  const [search, setSearch] = useState("")
  const [lightboxAsset, setLightboxAsset] = useState<MediaAsset | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [dnaScoreFilter, setDnaScoreFilter] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadAssets = useCallback((fileType: FilterType, searchQuery: string) => {
    startTransition(async () => {
      const result = await getMediaAssetsAction({
        fileType: fileType === "all" ? "all" : fileType,
        search: searchQuery,
      })
      if ("error" in result) {
        toast.error(result.error)
      } else {
        setAssets(result.data)
        setTotal(result.total)
      }
    })
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets(filter, search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filter, search, loadAssets])

  // Filtre Score DNA appliqué côté client (le scoring Vision AI est 0-100).
  const displayedAssets = dnaScoreFilter
    ? assets.filter((a) => (a.brandDnaScore ?? 0) >= 90)
    : assets

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter)
  }, [])

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadMediaAssetAction(formData)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success(t("addedToLibrary", { name: file.name }))
      setAssets((prev) => [result.data, ...prev])
      setTotal((prev) => prev + 1)
    }
  }

  const handleDelete = (id: string) => {
    const asset = assets.find((a) => a.id === id)
    if (!asset) return

    startTransition(async () => {
      const result = await deleteMediaAssetAction(id)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(t("deletedFromLibrary", { name: asset.originalFilename }))
        setAssets((prev) => prev.filter((a) => a.id !== id))
        setTotal((prev) => prev - 1)
      }
    })
  }

  const handleUseInPost = (asset: MediaAsset) => {
    if (asset.publicUrl) {
      const url = `/dashboard/create?mediaUrl=${encodeURIComponent(asset.publicUrl)}&mediaId=${asset.id}`
      window.location.href = url
    } else {
      toast.info(t("useFromWorkflow"))
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Bibliothèque
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gérez et analysez vos ressources média haute performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex rounded-lg border border-gray-200/60 dark:border-white/10 bg-white dark:bg-white/5 p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-primary/10 dark:bg-white/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "list"
                    ? "bg-primary/10 dark:bg-white/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="size-4" />
              </button>
            </div>

            {/* Import button */}
            <button
              onClick={() => setShowUploadDialog(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-rami-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] hover:opacity-90"
            >
              <Plus className="size-4" />
              Importer
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {/* Format filter pills */}
          {FILTER_TABS.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleFilterChange(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                filter === id
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-gray-200/60 dark:border-white/10 bg-white dark:bg-white/5 text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/10 hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {t(labelKey)}
            </button>
          ))}

          {/* DNA Score filter */}
          <button
            onClick={() => setDnaScoreFilter(!dnaScoreFilter)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
              dnaScoreFilter
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-gray-200/60 dark:border-white/10 bg-white dark:bg-white/5 text-muted-foreground"
            )}
          >
            Score DNA &ge; 90
            {dnaScoreFilter && (
              <X className="size-3" />
            )}
          </button>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "h-8 w-full rounded-lg border border-gray-200/60 dark:border-white/10 bg-white dark:bg-white/5 pl-9 pr-3 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                "transition-colors hover:border-primary/50"
              )}
            />
          </div>

          {isPending && (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 lg:px-8">
        {displayedAssets.length === 0 ? (
          <EmptyState search={search} filter={filter} />
        ) : (
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              : "space-y-2"
          )}>
            {displayedAssets.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                onDelete={handleDelete}
                onUseInPost={handleUseInPost}
                onClick={setLightboxAsset}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <MediaLightbox
        asset={lightboxAsset}
        open={lightboxAsset !== null}
        onClose={() => setLightboxAsset(null)}
        onDelete={handleDelete}
        onUseInPost={handleUseInPost}
      />

      {/* Upload Dialog */}
      <MediaUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}

function EmptyState({ search, filter }: { search: string; filter: FilterType }) {
  const t = useTranslations("library")
  const isFiltered = search.trim() || filter !== "all"

  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted dark:bg-white/5 text-muted-foreground">
          <Search className="size-8" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{t("noResultsTitle")}</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          {t("noResultsDesc")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-primary/10">
          <FolderOpen className="size-12 text-primary/60" />
        </div>
        <div className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <UploadCloud className="size-4" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground">{t("emptyTitle")}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("emptyDesc")}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label
          htmlFor="media-upload-trigger"
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-rami-blue px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <UploadCloud className="size-4" />
          {t("uploadFile")}
        </label>
        <a
          href="/dashboard/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border dark:border-white/10 bg-white dark:bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent dark:hover:bg-white/[0.06]"
        >
          <Wand2 className="size-4" />
          {t("generateVisuals")}
        </a>
      </div>
    </div>
  )
}
