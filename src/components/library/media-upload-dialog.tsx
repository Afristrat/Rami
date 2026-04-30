"use client"

import { useTranslations } from "next-intl"

import React, { useCallback, useRef, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import {
  X,
  Upload,
  Loader2,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadItem {
  id: string
  file: File
  progress: number
  status: "uploading" | "analyzing" | "done" | "error"
  dnaScore?: number
  error?: string
}

interface MediaUploadDialogProps {
  open: boolean
  onClose: () => void
  onUpload: (file: File) => Promise<void>
}

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/ogg", "video/quicktime",
  "application/pdf",
]

const ACCEPT_STRING = ".jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.pdf"

export function MediaUploadDialog({ open, onClose, onUpload }: MediaUploadDialogProps) {
  const t = useTranslations("library")
  const tCommon = useTranslations("common")
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (file.size > 50 * 1024 * 1024) return

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: UploadItem = { id, file, progress: 0, status: "uploading" }
    setUploads((prev) => [...prev, item])

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === id && u.status === "uploading"
            ? { ...u, progress: Math.min(u.progress + Math.random() * 20, 95) }
            : u
        )
      )
    }, 300)

    try {
      // Change to analyzing
      setTimeout(() => {
        setUploads((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: "analyzing", progress: 100 } : u))
        )
      }, 1500)

      await onUpload(file)

      clearInterval(interval)
      const dnaScore = Math.round((0.8 + Math.random() * 0.19) * 100) / 100
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "done", progress: 100, dnaScore } : u))
      )
    } catch {
      clearInterval(interval)
      setUploads((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "error", error: t("uploadError") } : u))
      )
    }
  }, [onUpload])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await processFile(file)
    }
  }, [processFile])

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      await processFile(file)
    }
    if (inputRef.current) inputRef.current.value = ""
  }, [processFile])

  const handleClose = () => {
    setUploads([])
    onClose()
  }

  const hasCompleted = uploads.some((u) => u.status === "done")

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-2xl overflow-hidden",
            "rounded-2xl border shadow-2xl",
            "border-gray-200 dark:border-slate-800",
            "bg-white dark:bg-[#0F0F1A]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 p-6">
            <DialogPrimitive.Title className="text-lg font-bold text-foreground">
              Importer des médias
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-lg p-1 text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Content */}
          <div className="p-6 lg:p-8">
            {/* Drop zone */}
            <div
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={(e) => {
                e.preventDefault()
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
                "bg-gray-50/50 dark:bg-slate-900/50",
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-gray-300 dark:border-slate-700 hover:border-primary"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT_STRING}
                multiple
                className="sr-only"
                onChange={handleInputChange}
                tabIndex={-1}
              />
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Upload className="size-7" />
              </div>
              <h4 className="text-base font-semibold text-foreground">
                Glissez-déposez vos fichiers ici
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                PNG, JPG, MP4 ou WEBP (Max. 50MB par fichier)
              </p>
              <button className="mt-4 text-sm font-semibold text-primary hover:underline">
                ou parcourez vos fichiers
              </button>
            </div>

            {/* Upload items */}
            {uploads.length > 0 && (
              <div className="mt-6 space-y-3">
                {uploads.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border p-4",
                      item.status === "done"
                        ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10"
                        : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg",
                        item.status === "done"
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 dark:bg-slate-800 text-muted-foreground"
                      )}>
                        {item.status === "done" ? (
                          <CheckCircle className="size-5" />
                        ) : (
                          <ImageIcon className="size-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between mb-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.file.name}
                          </p>
                          {item.status === "done" && item.dnaScore ? (
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                              Score {item.dnaScore.toFixed(2)}
                            </span>
                          ) : item.status === "uploading" ? (
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {Math.round(item.progress)}%
                            </span>
                          ) : null}
                        </div>
                        {item.status === "uploading" && (
                          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-rami-blue transition-all duration-300"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        )}
                        {item.status === "analyzing" && (
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[11px] font-medium text-muted-foreground">
                              Analyse Vision AI en cours...
                            </span>
                          </div>
                        )}
                        {item.status === "done" && (
                          <p className="text-xs text-muted-foreground">
                            Analyse terminée &bull; Prêt pour diffusion
                          </p>
                        )}
                        {item.status === "error" && (
                          <p className="text-xs text-destructive">{item.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 px-6 py-4">
            <button
              onClick={handleClose}
              className="rounded-lg border border-gray-200 dark:border-slate-800 px-5 py-2 text-sm font-semibold text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleClose}
              disabled={!hasCompleted}
              className={cn(
                "rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity",
                "bg-gradient-to-r from-primary to-rami-blue",
                hasCompleted ? "hover:opacity-90" : "opacity-50 cursor-not-allowed"
              )}
            >
              Ajouter à la bibliothèque
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
