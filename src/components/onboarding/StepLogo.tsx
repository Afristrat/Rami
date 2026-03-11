"use client"

import { useState, useRef, useCallback } from "react"
import { ImageIcon, Upload, X, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadLogoToSupabase } from "@/app/actions/onboarding"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface StepLogoProps {
  tenantName: string
  defaultLogoUrl?: string | null
  onNext: (logoUrl: string | null) => void
  onBack: () => void
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
const MAX_SIZE_MB = 10

export function StepLogo({
  tenantName,
  defaultLogoUrl,
  onNext,
  onBack,
}: StepLogoProps) {
  const [preview, setPreview] = useState<string | null>(defaultLogoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(defaultLogoUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format non supporté. Utilisez PNG, JPEG, SVG ou WebP.")
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Le fichier ne doit pas dépasser ${MAX_SIZE_MB} MB.`)
      return
    }

    // Aperçu local immédiat
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("logo", file)
      const result = await uploadLogoToSupabase(formData)

      if (result.error) {
        setError(result.error)
        setPreview(null)
        setUploadedUrl(null)
      } else {
        setUploadedUrl(result.url)
      }
    } catch {
      setError("Erreur lors de l'upload. Veuillez réessayer.")
      setPreview(null)
      setUploadedUrl(null)
    } finally {
      setUploading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const clearLogo = () => {
    setPreview(null)
    setUploadedUrl(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const initials = tenantName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <ImageIcon className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Logo de votre marque
          </h2>
          <p className="text-sm text-muted-foreground">
            Optionnel — RAMI analysera les couleurs pour construire votre Brand DNA
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        {/* Zone de drop */}
        <div
          className={cn(
            "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all",
            dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30",
            preview && "border-solid border-muted-foreground/30"
          )}
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          aria-label="Zone d'upload du logo"
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          {preview ? (
            <div className="relative flex items-center justify-center w-full h-full p-4">
              <Image
                src={preview}
                alt="Aperçu du logo"
                width={200}
                height={120}
                className="max-h-[120px] w-auto object-contain rounded-lg"
                unoptimized
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Glissez votre logo ici
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ou cliquez pour parcourir
                </p>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  PNG, JPEG, SVG, WebP · Max {MAX_SIZE_MB} MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="sr-only"
            onChange={handleInputChange}
          />
        </div>

        {/* Aperçu initiales / logo */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground font-medium">Aperçu</p>

          {/* Avatar avec logo ou initiales */}
          <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 overflow-hidden">
            {preview && !uploading ? (
              <Image
                src={preview}
                alt="Logo"
                width={80}
                height={80}
                className="size-full object-contain p-1"
                unoptimized
              />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">
                {initials || "?"}
              </span>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground max-w-[100px] leading-tight">
            {tenantName || "Votre marque"}
          </p>

          {preview && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                clearLogo()
              }}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="size-3 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Indicateur analyse Brand DNA */}
      {uploadedUrl && !uploading && (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3">
          <Sparkles className="size-4 text-primary shrink-0" />
          <p className="text-sm text-primary">
            Logo uploadé ! RAMI extraira les couleurs pour calibrer votre Brand DNA.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Retour
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => onNext(uploadedUrl)}
          disabled={uploading}
          className="min-w-[140px]"
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Upload...
            </>
          ) : (
            "Continuer →"
          )}
        </Button>
      </div>
    </div>
  )
}
