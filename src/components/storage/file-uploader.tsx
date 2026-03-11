"use client"

import * as React from "react"
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, FileAudio, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { uploadFileAction } from "@/lib/actions/storage.actions"
import { ALLOWED_MIME_TYPES } from "@/lib/services/storage/mime"
import type { ResizePreset } from "@/lib/services/storage"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string
  filename: string
  publicUrl: string | null
  signedUrl: string | null
  mimeType: string
  sizeBytes: number
  width?: number | null
  height?: number | null
  wasResized: boolean
}

interface FileUploaderProps {
  category?: "posts" | "logos" | "audios" | "docs"
  resizePreset?: ResizePreset
  accept?: string           // MIME types acceptés (défaut : images)
  maxFiles?: number
  onUploadComplete?: (files: UploadedFile[]) => void
  className?: string
  disabled?: boolean
}

type FileState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "success"; file: UploadedFile }
  | { status: "error"; message: string }

interface PendingFile {
  id: string
  file: File
  state: FileState
  preview?: string
}

// ─── Icône par type MIME ──────────────────────────────────────────────────

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className={cn("text-violet-500", className)} />
  if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return <FileAudio className={cn("text-blue-500", className)} />
  return <FileText className={cn("text-orange-500", className)} />
}

// ─── FileRow ─────────────────────────────────────────────────────────────

function FileRow({
  pending,
  onRemove,
}: {
  pending: PendingFile
  onRemove: (id: string) => void
}) {
  const { file, state, preview } = pending
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {/* Preview ou icône */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted overflow-hidden">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={file.name} className="size-full object-cover" />
        ) : (
          <FileTypeIcon mimeType={file.type} className="size-5" />
        )}
      </div>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">{sizeMB} MB</p>

        {state.status === "uploading" && (
          <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        )}
        {state.status === "error" && (
          <p className="mt-0.5 text-xs text-destructive">{state.message}</p>
        )}
        {state.status === "success" && (
          <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
            Upload réussi{state.file.wasResized ? " · Converti WebP" : ""}
          </p>
        )}
      </div>

      {/* Statut / action */}
      <div className="shrink-0">
        {state.status === "uploading" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
        {state.status === "success" && <CheckCircle2 className="size-4 text-emerald-500" />}
        {state.status === "error" && <AlertCircle className="size-4 text-destructive" />}
        {(state.status === "idle" || state.status === "error") && (
          <button
            onClick={() => onRemove(pending.id)}
            className="rounded-md p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── FileUploader ─────────────────────────────────────────────────────────

export function FileUploader({
  category = "posts",
  resizePreset,
  accept,
  maxFiles = 10,
  onUploadComplete,
  className,
  disabled = false,
}: FileUploaderProps) {
  const [pending, setPending] = React.useState<PendingFile[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Calcul de l'accept par défaut selon la catégorie
  const defaultAccept = React.useMemo(() => {
    if (accept) return accept
    if (category === "audios") return "audio/*,video/mp4,video/webm"
    if (category === "docs") return "application/pdf"
    return "image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
  }, [accept, category])

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files)
    const remaining = maxFiles - pending.length
    const toAdd = arr.slice(0, remaining).map((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const preview = file.type.startsWith("image/") && file.type !== "image/svg+xml"
        ? URL.createObjectURL(file)
        : undefined
      return { id, file, state: { status: "idle" } as FileState, preview }
    })
    setPending((prev) => [...prev, ...toAdd])
  }

  function removeFile(id: string) {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item?.preview) URL.revokeObjectURL(item.preview)
      return prev.filter((p) => p.id !== id)
    })
  }

  async function uploadFile(item: PendingFile) {
    // Passer en "uploading"
    setPending((prev) =>
      prev.map((p) =>
        p.id === item.id ? { ...p, state: { status: "uploading", progress: 10 } } : p
      )
    )

    const formData = new FormData()
    formData.append("file", item.file)
    formData.append("category", category)
    if (resizePreset) formData.append("resizePreset", resizePreset)

    // Simulation progression (l'API ne stream pas la progression)
    const progressInterval = setInterval(() => {
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id && p.state.status === "uploading"
            ? { ...p, state: { status: "uploading", progress: Math.min(p.state.progress + 15, 85) } }
            : p
        )
      )
    }, 400)

    const result = await uploadFileAction(formData)
    clearInterval(progressInterval)

    if (result.success && result.asset) {
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? {
                ...p,
                state: {
                  status: "success",
                  file: {
                    id: result.asset!.id,
                    filename: item.file.name,
                    publicUrl: result.asset!.publicUrl,
                    signedUrl: result.asset!.signedUrl,
                    mimeType: result.asset!.mimeType,
                    sizeBytes: result.asset!.sizeBytes,
                    width: result.asset!.width,
                    height: result.asset!.height,
                    wasResized: result.asset!.wasResized,
                  },
                },
              }
            : p
        )
      )
    } else {
      setPending((prev) =>
        prev.map((p) =>
          p.id === item.id
            ? { ...p, state: { status: "error", message: result.error ?? "Erreur inconnue." } }
            : p
        )
      )
    }
  }

  async function handleUploadAll() {
    const toUpload = pending.filter((p) => p.state.status === "idle" || p.state.status === "error")
    await Promise.allSettled(toUpload.map(uploadFile))

    // Notifier les uploads réussis
    const successful = pending
      .filter((p) => p.state.status === "success")
      .map((p) => (p.state as { status: "success"; file: UploadedFile }).file)
    if (successful.length > 0) onUploadComplete?.(successful)
  }

  const idleCount = pending.filter((p) => p.state.status === "idle").length
  const hasIdle = idleCount > 0

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (!disabled) addFiles(e.dataTransfer.files)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragging
            ? "border-violet-500 bg-violet-500/5"
            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Upload className="size-8 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Glissez vos fichiers ici</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ou <span className="text-violet-600 dark:text-violet-400">cliquez pour sélectionner</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {category === "audios" && "MP3, MP4, WAV · Max 500 MB"}
          {category === "docs" && "PDF · Max 50 MB"}
          {(category === "posts" || category === "logos") && "JPEG, PNG, WebP, GIF · Max 10 MB — Auto-converti en WebP"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={maxFiles > 1}
          accept={defaultAccept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {/* Liste des fichiers */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((item) => (
            <FileRow key={item.id} pending={item} onRemove={removeFile} />
          ))}

          {hasIdle && (
            <Button
              onClick={handleUploadAll}
              className="w-full"
              size="sm"
            >
              <Upload className="size-4" />
              Uploader {idleCount} fichier{idleCount > 1 ? "s" : ""}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
