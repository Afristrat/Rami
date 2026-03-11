"use client"

import { useState } from "react"
import { Trash2, Send, FileText, Play, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MediaAsset } from "@/lib/actions/library.actions"

interface MediaCardProps {
  asset: MediaAsset
  onDelete: (id: string) => void
  onUseInPost: (asset: MediaAsset) => void
  onClick: (asset: MediaAsset) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function MediaPreview({ asset }: { asset: MediaAsset }) {
  const [imgError, setImgError] = useState(false)

  if (asset.fileType === "image" && asset.publicUrl && !imgError) {
    return (
      <img
        src={asset.publicUrl}
        alt={asset.originalFilename}
        className="h-full w-full object-cover"
        onError={() => setImgError(true)}
        loading="lazy"
      />
    )
  }

  if (asset.fileType === "video") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900 text-zinc-400">
        <Play className="size-8 fill-current" />
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide opacity-60">Vidéo</span>
      </div>
    )
  }

  if (asset.fileType === "document") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-blue-950/40 text-blue-400">
        <FileText className="size-8" />
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide opacity-60">
          {asset.mimeType === "application/pdf" ? "PDF" : "DOC"}
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-muted text-muted-foreground">
      <ImageIcon className="size-8" />
    </div>
  )
}

export function MediaCard({ asset, onDelete, onUseInPost, onClick }: MediaCardProps) {
  const [showActions, setShowActions] = useState(false)

  // Hauteur variable pour l'effet masonry naturel
  const cardHeight = asset.fileType === "image"
    ? "h-40 sm:h-44 md:h-48"
    : "h-32"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card",
        "cursor-pointer transition-all duration-200",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        cardHeight
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick(asset)}
    >
      {/* Aperçu */}
      <MediaPreview asset={asset} />

      {/* Overlay sombre au hover */}
      <div className={cn(
        "absolute inset-0 bg-black/0 transition-colors duration-200",
        showActions && "bg-black/40"
      )} />

      {/* Actions au hover */}
      {showActions && (
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Utiliser dans un post"
            onClick={() => onUseInPost(asset)}
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-1",
              "text-[11px] font-medium text-white",
              "bg-primary/90 hover:bg-primary transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Send className="size-3" />
            Utiliser
          </button>

          <button
            type="button"
            title="Supprimer"
            onClick={() => onDelete(asset.id)}
            className={cn(
              "flex size-7 items-center justify-center rounded-md",
              "bg-destructive/80 hover:bg-destructive text-white transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}

      {/* Badge type */}
      <div className="absolute left-2 top-2">
        <span className={cn(
          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          asset.fileType === "image" && "bg-emerald-500/90 text-white",
          asset.fileType === "video" && "bg-violet-500/90 text-white",
          asset.fileType === "document" && "bg-blue-500/90 text-white",
        )}>
          {asset.fileType === "image" ? "IMG" : asset.fileType === "video" ? "VID" : "DOC"}
        </span>
      </div>

      {/* Infos nom + taille */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 p-2",
        "bg-gradient-to-t from-black/70 to-transparent",
        showActions ? "opacity-0" : "opacity-100",
        "transition-opacity duration-200"
      )}>
        <p className="truncate text-[11px] font-medium text-white/90">
          {asset.originalFilename}
        </p>
        <p className="text-[10px] text-white/50">
          {formatBytes(asset.fileSizeBytes)}
        </p>
      </div>
    </div>
  )
}
