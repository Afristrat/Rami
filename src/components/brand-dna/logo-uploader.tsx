"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoUploaderProps {
  value?: string
  fileName?: string
  onChange: (dataUrl: string, fileName: string) => void
  onClear: () => void
  error?: string
}

export function LogoUploader({ value, fileName, onChange, onClear, error }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  /**
   * Redimensionne un logo PNG/JPG/WebP à max 256×256 px via Canvas API
   * pour éviter des JSONB de plusieurs Mo dans Supabase.
   * Les SVG sont passés tels quels (format vectoriel, déjà léger).
   */
  const resizeAndEncode = useCallback(
    (dataUrl: string, mimeType: string, fileName: string) => {
      if (mimeType === "image/svg+xml") {
        // SVG : pas de redimensionnement nécessaire
        onChange(dataUrl, fileName)
        return
      }

      const MAX_PX = 256
      const img = new window.Image()
      img.onload = () => {
        const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          onChange(dataUrl, fileName)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const resized = canvas.toDataURL("image/webp", 0.85)
        onChange(resized, fileName)
      }
      img.onerror = () => {
        // En cas d'échec Canvas, on stocke l'original
        onChange(dataUrl, fileName)
      }
      img.src = dataUrl
    },
    [onChange]
  )

  const processFile = useCallback(
    (file: File) => {
      if (!["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type)) {
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resizeAndEncode(result, file.type, file.name)
      }
      reader.readAsDataURL(file)
    },
    [resizeAndEncode]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div className="space-y-2">
      {value ? (
        /* Preview */
        <div className="relative flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={fileName || "Logo"}
              className="size-full object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Logo chargé avec succès</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2 text-xs font-medium text-primary hover:underline focus:outline-none"
            >
              Changer le logo
            </button>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Supprimer le logo"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isDragging
              ? "border-primary bg-primary/5"
              : error
                ? "border-destructive/50 bg-destructive/5"
                : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
          )}
        >
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {isDragging ? (
              <ImageIcon className="size-6" />
            ) : (
              <Upload className="size-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Déposez votre logo ici" : "Glissez votre logo ou cliquez"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              PNG, JPG, SVG, WebP — max 10 Mo
            </p>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
