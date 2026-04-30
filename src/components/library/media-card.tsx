"use client"

import { useTranslations } from "next-intl"

import { useState } from "react"
import Image from "next/image"
import { Trash2, Send, FileText, Play, Image as ImageIcon, MoreVertical, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MediaAsset } from "@/lib/actions/library.actions"

interface MediaCardProps {
  asset: MediaAsset
  onDelete: (id: string) => void
  onUseInPost: (asset: MediaAsset) => void
  onClick: (asset: MediaAsset) => void
  viewMode?: "grid" | "list"
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
      <Image
        src={asset.publicUrl}
        alt={asset.originalFilename}
        fill
        className="object-cover"
        onError={() => setImgError(true)}
        sizes="(max-width: 768px) 50vw, 25vw"
      />
    )
  }

  if (asset.fileType === "video") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
        <Play className="size-8 fill-current" />
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide opacity-60">Vidéo</span>
      </div>
    )
  }

  if (asset.fileType === "document") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400">
        <FileText className="size-8" />
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-wide opacity-60">
          {asset.mimeType === "application/pdf" ? "PDF" : "DOC"}
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-100 dark:bg-muted text-muted-foreground">
      <ImageIcon className="size-8" />
    </div>
  )
}

// Simulated DNA score for design purposes
function getDnaScore(): number {
  return Math.round((0.7 + Math.random() * 0.28) * 100) / 100
}

export function MediaCard({ asset, onDelete, onUseInPost, onClick, viewMode = "grid" }: MediaCardProps) {
  const t = useTranslations("library")
  const [showActions, setShowActions] = useState(false)
  const dnaScore = getDnaScore()
  const isHighScore = dnaScore >= 0.85

  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "group flex items-center gap-4 rounded-xl border p-3 cursor-pointer transition-all",
          "border-gray-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]",
          "hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
        )}
        onClick={() => onClick(asset)}
      >
        <div className="relative size-12 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
          <MediaPreview asset={asset} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{asset.originalFilename}</p>
          <p className="text-xs text-muted-foreground">{formatBytes(asset.fileSizeBytes)}</p>
        </div>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold",
          isHighScore
            ? "bg-emerald-500/10 text-emerald-500"
            : "bg-amber-500/10 text-amber-500"
        )}>
          {dnaScore.toFixed(2)} DNA
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            title={t("use")}
            onClick={() => onUseInPost(asset)}
            className="rounded-md p-1.5 text-primary hover:bg-primary/10 transition-colors"
          >
            <Send className="size-3.5" />
          </button>
          <button
            title={t("deleteFile")}
            onClick={() => onDelete(asset.id)}
            className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-200",
        "border-gray-200/60 dark:border-white/[0.06] bg-white dark:bg-white/[0.02]",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "aspect-[3/4]"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={() => onClick(asset)}
    >
      {/* Preview */}
      <MediaPreview asset={asset} />

      {/* Hover overlay */}
      <div className={cn(
        "absolute inset-0 bg-black/0 transition-colors duration-200",
        showActions && "bg-black/60"
      )} />

      {/* Hover content */}
      <div className={cn(
        "absolute inset-0 p-3.5 flex flex-col justify-between transition-opacity duration-200",
        showActions ? "opacity-100" : "opacity-0"
      )}>
        {/* Top row */}
        <div className="flex justify-between items-start">
          <span className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-white",
            isHighScore ? "bg-emerald-500" : "bg-amber-500"
          )}>
            <CheckCircle className="size-3" />
            {dnaScore.toFixed(2)} DNA
          </span>
          <button
            className="flex size-7 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white"
            onClick={(e) => { e.stopPropagation() }}
          >
            <MoreVertical className="size-4" />
          </button>
        </div>

        {/* Bottom row */}
        <div>
          <p className="text-sm font-semibold text-white truncate">
            {asset.originalFilename}
          </p>
          <p className="text-xs text-white/60 mt-0.5">
            {formatBytes(asset.fileSizeBytes)}
          </p>
        </div>
      </div>

      {/* Actions on hover */}
      {showActions && (
        <div
          className="absolute bottom-3 right-3 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title={t("useInPost")}
            onClick={() => onUseInPost(asset)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white bg-primary/90 hover:bg-primary transition-colors"
          >
            <Send className="size-3" />
            Utiliser
          </button>
        </div>
      )}

      {/* Default bottom info (hidden on hover) */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-200",
        showActions ? "opacity-0" : "opacity-100"
      )}>
        <p className="truncate text-[11px] font-medium text-white/90">
          {asset.originalFilename}
        </p>
        <p className="text-[10px] text-white/50">
          {formatBytes(asset.fileSizeBytes)}
        </p>
      </div>

      {/* File type badge */}
      <div className={cn(
        "absolute left-2.5 top-2.5 transition-opacity duration-200",
        showActions ? "opacity-0" : "opacity-100"
      )}>
        <span className={cn(
          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          asset.fileType === "image" && "bg-emerald-500/90 text-white",
          asset.fileType === "video" && "bg-violet-500/90 text-white",
          asset.fileType === "document" && "bg-blue-500/90 text-white",
        )}>
          {asset.fileType === "image" ? "IMG" : asset.fileType === "video" ? "VID" : "DOC"}
        </span>
      </div>

      {/* Video indicator */}
      {asset.fileType === "video" && !showActions && (
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/40 backdrop-blur-sm p-1.5">
          <Play className="size-4 text-white" />
        </div>
      )}
    </div>
  )
}
