"use client"

import { useState, useCallback, useTransition, useEffect } from "react"
import { Search, Images, FileText, Play, LayoutGrid, Loader2, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  getMediaAssetsAction,
  uploadMediaAssetAction,
  deleteMediaAssetAction,
  type MediaAsset,
  type MediaFileType,
} from "@/lib/actions/library.actions"
import { MediaUploadZone } from "./media-upload-zone"
import { MediaCard } from "./media-card"
import { MediaLightbox } from "./media-lightbox"

type FilterType = "all" | MediaFileType

const FILTER_TABS: { id: FilterType; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "Tous", icon: LayoutGrid },
  { id: "image", label: "Images", icon: Images },
  { id: "video", label: "Vidéos", icon: Play },
  { id: "document", label: "Documents", icon: FileText },
]

interface MediaLibraryClientProps {
  initialAssets: MediaAsset[]
  initialTotal: number
}

export function MediaLibraryClient({ initialAssets, initialTotal }: MediaLibraryClientProps) {
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets)
  const [total, setTotal] = useState(initialTotal)
  const [filter, setFilter] = useState<FilterType>("all")
  const [search, setSearch] = useState("")
  const [lightboxAsset, setLightboxAsset] = useState<MediaAsset | null>(null)
  const [isPending, startTransition] = useTransition()

  // Rechargement des assets lors du changement de filtre/recherche
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

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets(filter, search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filter, search, loadAssets])

  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter)
  }, [])

  const handleUpload = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadMediaAssetAction(formData)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success(`"${file.name}" ajouté à la médiathèque.`)
      setAssets((prev) => [result.data, ...prev])
      setTotal((prev) => prev + 1)
    }
  }, [])

  const handleDelete = useCallback((id: string) => {
    const asset = assets.find((a) => a.id === id)
    if (!asset) return

    startTransition(async () => {
      const result = await deleteMediaAssetAction(id)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(`"${asset.originalFilename}" supprimé.`)
        setAssets((prev) => prev.filter((a) => a.id !== id))
        setTotal((prev) => prev - 1)
      }
    })
  }, [assets])

  const handleUseInPost = useCallback((asset: MediaAsset) => {
    // Navigation vers le workflow de création avec l'asset pré-sélectionné
    if (asset.publicUrl) {
      const url = `/dashboard/create?mediaUrl=${encodeURIComponent(asset.publicUrl)}&mediaId=${asset.id}`
      window.location.href = url
    } else {
      toast.info("Utilisez cet asset depuis le workflow de création.")
    }
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Médiathèque</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total} fichier{total !== 1 ? "s" : ""} dans votre bibliothèque
            </p>
          </div>
        </div>

        {/* Filtres + Recherche */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Tabs filtres */}
          <div className="flex shrink-0 gap-1 rounded-lg bg-muted p-1" role="tablist">
            {FILTER_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={filter === id}
                onClick={() => handleFilterChange(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  filter === id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher un fichier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "h-8 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
                "transition-colors hover:border-primary/50"
              )}
            />
          </div>

          {/* Indicateur chargement */}
          {isPending && (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Zone d'upload */}
        <div className="mb-6">
          <MediaUploadZone onUpload={handleUpload} />
        </div>

        {/* Grille masonry */}
        {assets.length === 0 ? (
          <EmptyState search={search} filter={filter} />
        ) : (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
            {assets.map((asset) => (
              <div key={asset.id} className="mb-3 break-inside-avoid">
                <MediaCard
                  asset={asset}
                  onDelete={handleDelete}
                  onUseInPost={handleUseInPost}
                  onClick={setLightboxAsset}
                />
              </div>
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
    </div>
  )
}

function EmptyState({ search, filter }: { search: string; filter: FilterType }) {
  const isFiltered = search.trim() || filter !== "all"

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <FolderOpen className="size-8" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {isFiltered ? "Aucun résultat" : "Médiathèque vide"}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        {isFiltered
          ? "Aucun fichier ne correspond à votre recherche."
          : "Glissez-déposez vos fichiers dans la zone ci-dessus pour commencer."}
      </p>
    </div>
  )
}
