"use client"

import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"

import * as DialogPrimitive from "@radix-ui/react-dialog"
import Image from "next/image"
import { X, Trash2, Send, Download, FileText, Play, Calendar, HardDrive } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MediaAsset } from "@/lib/actions/library.actions"

interface MediaLightboxProps {
  asset: MediaAsset | null
  open: boolean
  onClose: () => void
  onDelete: (id: string) => void
  onUseInPost: (asset: MediaAsset) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

function LightboxPreview({ asset }: { asset: MediaAsset }) {
  if (asset.fileType === "image" && asset.publicUrl) {
    return (
      <Image
        src={asset.publicUrl}
        alt={asset.originalFilename}
        fill
        className="rounded-lg object-contain"
        sizes="(max-width: 1280px) 80vw, 60vw"
      />
    )
  }

  if (asset.fileType === "video" && asset.publicUrl) {
    return (
      <video
        src={asset.publicUrl}
        controls
        className="max-h-full max-w-full rounded-lg"
        preload="metadata"
      />
    )
  }

  // Document ou image sans URL
  const isDoc = asset.fileType === "document"
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
      {isDoc ? (
        <FileText className="size-20 text-blue-400" />
      ) : (
        <Play className="size-20 text-violet-400" />
      )}
      <p className="max-w-xs text-center text-sm font-medium text-foreground">
        {asset.originalFilename}
      </p>
      {asset.publicUrl && (
        <a
          href={asset.publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <Download className="size-4" />
          Ouvrir le fichier
        </a>
      )}
    </div>
  )
}

export function MediaLightbox({ asset, open, onClose, onDelete, onUseInPost }: MediaLightboxProps) {
  const t = useTranslations("library")
  const tCommon = useTranslations("common")
  const intlLocale = useIntlLocale()
  if (!asset) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "flex h-[90vh] w-[95vw] max-w-5xl overflow-hidden",
            "rounded-2xl border border-border bg-card shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
        >
          {/* Fermeture */}
          <DialogPrimitive.Close className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-4" />
            <span className="sr-only">{tCommon("close")}</span>
          </DialogPrimitive.Close>

          {/* Aperçu principal */}
          <div className="flex flex-1 items-center justify-center overflow-hidden bg-black/40 p-6">
            <LightboxPreview asset={asset} />
          </div>

          {/* Panneau latéral */}
          <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-background p-5">
            <DialogPrimitive.Title className="sr-only">
              {asset.originalFilename}
            </DialogPrimitive.Title>

            <h2 className="mb-1 break-all text-sm font-semibold leading-snug text-foreground">
              {asset.originalFilename}
            </h2>

            <span className={cn(
              "mb-5 inline-flex w-fit items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              asset.fileType === "image" && "bg-emerald-500/15 text-emerald-500",
              asset.fileType === "video" && "bg-violet-500/15 text-violet-500",
              asset.fileType === "document" && "bg-blue-500/15 text-blue-500",
            )}>
              {asset.fileType === "image" ? t("image") : asset.fileType === "video" ? t("video") : t("document")}
            </span>

            {/* Métadonnées */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <HardDrive className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">{t("fileSize")}</p>
                  <p className="font-medium text-foreground">{formatBytes(asset.fileSizeBytes)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-muted-foreground">
                <Calendar className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">{t("addedOn")}</p>
                  <p className="font-medium text-foreground">{formatDate(asset.createdAt, intlLocale)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-muted-foreground">
                <FileText className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/60">{t("mimeType")}</p>
                  <p className="break-all font-medium text-foreground">{asset.mimeType}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-2 pt-5">
              {/* Bouton Utiliser dans un post */}
              <button
                type="button"
                onClick={() => { onUseInPost(asset); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Send className="size-4" />
                Utiliser dans un post
              </button>

              {/* Télécharger */}
              {asset.publicUrl && (
                <a
                  href={asset.publicUrl}
                  download={asset.originalFilename}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Download className="size-4" />
                  Télécharger
                </a>
              )}

              {/* Supprimer */}
              <button
                type="button"
                onClick={() => { onDelete(asset.id); onClose() }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="size-4" />
                Supprimer
              </button>
            </div>
          </aside>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
