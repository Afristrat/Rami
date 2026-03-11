"use client"

import React, { useCallback, useRef, useState } from "react"
import { Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MediaUploadZoneProps {
  onUpload: (file: File) => Promise<void>
  disabled?: boolean
}

const ACCEPTED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/ogg", "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]

const ACCEPT_STRING = ".jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.webm,.mov,.pdf,.doc,.docx,.xls,.xlsx,.txt"

export function MediaUploadZone({ onUpload, disabled }: MediaUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(`Type non supporté : ${file.type}`)
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Fichier trop volumineux (max 50 MB).")
      return
    }
    setError(null)
    setIsUploading(true)
    try {
      await onUpload(file)
    } catch {
      setError("Erreur lors de l'upload.")
    } finally {
      setIsUploading(false)
    }
  }, [onUpload])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Seulement si on quitte la zone entière (pas un enfant)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await processFile(file)
    }
  }, [disabled, isUploading, processFile])

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      await processFile(file)
    }
    // Reset input pour permettre le re-upload du même fichier
    if (inputRef.current) inputRef.current.value = ""
  }, [processFile])

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) inputRef.current?.click()
  }, [disabled, isUploading])

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Zone d'upload — cliquer ou déposer des fichiers"
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick() }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3",
          "rounded-xl border-2 border-dashed transition-all duration-200",
          "py-10 px-6 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/40",
          (disabled || isUploading) && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_STRING}
          multiple
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          tabIndex={-1}
        />

        {isUploading ? (
          <Loader2 className="size-8 animate-spin text-primary" />
        ) : (
          <div className={cn(
            "flex size-12 items-center justify-center rounded-xl transition-colors",
            isDragging ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            <Upload className="size-5" />
          </div>
        )}

        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isUploading ? "Upload en cours…" : isDragging ? "Déposer ici" : "Cliquez ou déposez vos fichiers"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Images, vidéos, documents — max 50 MB par fichier
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
