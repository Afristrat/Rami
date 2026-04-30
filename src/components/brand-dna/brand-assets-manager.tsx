"use client"

import { useState, useCallback, useRef, type ChangeEvent, type DragEvent } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Camera,
  Brush,
  Hexagon,
  BarChart3,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type {
  BrandAsset,
  BrandAssetCategory,
} from "@/lib/actions/brand-dna.actions"
import {
  uploadBrandAssetAction,
  deleteBrandAssetAction,
} from "@/lib/actions/brand-dna.actions"

interface Props {
  initialAssets: BrandAsset[]
}

const CATEGORIES: {
  key: BrandAssetCategory
  icon: typeof Camera
}[] = [
  { key: "photos", icon: Camera },
  { key: "illustrations", icon: Brush },
  { key: "icons", icon: Hexagon },
  { key: "graphics", icon: BarChart3 },
]

const CATEGORY_TAB_KEYS: Record<BrandAssetCategory, string> = {
  photos: "tabPhotos",
  illustrations: "tabIllustrations",
  icons: "tabIcons",
  graphics: "tabGraphics",
}

const CATEGORY_EMPTY_KEYS: Record<BrandAssetCategory, string> = {
  photos: "emptyPhotos",
  illustrations: "emptyIllustrations",
  icons: "emptyIcons",
  graphics: "emptyGraphics",
}

export function BrandAssetsManager({ initialAssets }: Props) {
  const t = useTranslations("brandDna.assets")
  const intlLocale = useIntlLocale()
  const [activeTab, setActiveTab] = useState<BrandAssetCategory>("photos")
  const [assets, setAssets] = useState<BrandAsset[]>(initialAssets)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredAssets = assets.filter((a) => a.category === activeTab)

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      try {
        const formData = new FormData()
        formData.set("file", file)
        formData.set("category", activeTab)

        const result = await uploadBrandAssetAction(formData)

        if ("data" in result) {
          setAssets((prev) => [result.data, ...prev])
        } else {
          toast.error("error" in result ? result.error : t("uploadError"))
        }
      } finally {
        setUploading(false)
      }
    },
    [activeTab]
  )

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleUpload(file)
        e.target.value = ""
      }
    },
    [handleUpload]
  )

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id)
    try {
      const result = await deleteBrandAssetAction(id)
      if ("success" in result) {
        setAssets((prev) => prev.filter((a) => a.id !== id))
      } else {
        toast.error("error" in result ? result.error : t("deleteError"))
      }
    } finally {
      setDeletingId(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 glass-card rounded-xl w-fit">
        {CATEGORIES.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key
                ? "bg-primary/10 text-primary dark:bg-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/5"
            )}
          >
            <Icon className="size-4" />
            {t(CATEGORY_TAB_KEYS[key])}
            <span className="text-[10px] bg-muted dark:bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded-full tabular-nums">
              {assets.filter((a) => a.category === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "glass-card rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border dark:border-white/10 hover:border-primary/50"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm font-medium">{t("uploading")}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="size-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              {t("uploadDragDrop")}
            </p>
            <p className="text-xs text-muted-foreground">{t("uploadFormats")}</p>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <ImageIcon className="size-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">
            {t(CATEGORY_EMPTY_KEYS[activeTab])}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group glass-card rounded-xl overflow-hidden border border-border dark:border-white/5 hover:border-primary/30 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-square bg-muted/30 dark:bg-white/5 flex items-center justify-center overflow-hidden relative">
                {asset.publicUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={asset.publicUrl}
                    alt={asset.filename}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground/40" />
                )}

                {/* Delete overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    disabled={deletingId === asset.id}
                    onClick={() => handleDelete(asset.id)}
                    className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
                  >
                    {deletingId === asset.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {asset.filename}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t("addedOn", {
                    date: new Date(asset.createdAt).toLocaleDateString(intlLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
