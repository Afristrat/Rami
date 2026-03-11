"use client"

import { useState } from "react"
import { step2Schema, type Step2Data, CONTENT_FORMATS } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG, type Platform } from "@/lib/scheduler/platform-config"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

const PLATFORMS = Object.entries(PLATFORM_CONFIG) as [Platform, typeof PLATFORM_CONFIG[Platform]][]

const FORMAT_LABELS: Record<string, { label: string; desc: string; emoji: string }> = {
  post: { label: "Post", desc: "Publication standard", emoji: "📄" },
  carousel: { label: "Carrousel", desc: "Diaporama multi-images", emoji: "🎠" },
  story: { label: "Story", desc: "Format éphémère 24h", emoji: "⚡" },
  reel: { label: "Reel / Short", desc: "Vidéo courte verticale", emoji: "🎬" },
  article: { label: "Article", desc: "Contenu long format", emoji: "📰" },
}

interface Step2PlatformsProps {
  defaultValues?: Step2Data | null
  onBack: () => void
  onNext: (data: Step2Data) => void
}

export function Step2Platforms({ defaultValues, onBack, onNext }: Step2PlatformsProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(defaultValues?.platforms ?? [])
  const [selectedFormat, setSelectedFormat] = useState<Step2Data["format"] | undefined>(defaultValues?.format)
  const [errors, setErrors] = useState<{ platforms?: string; format?: string }>({})

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    )
  }

  function handleNext() {
    const result = step2Schema.safeParse({ platforms: selectedPlatforms, format: selectedFormat })
    if (!result.success) {
      const fieldErrors: { platforms?: string; format?: string } = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as "platforms" | "format"
        if (path) fieldErrors[path] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    onNext(result.data)
  }

  return (
    <div className="space-y-6">
      {/* Sélection plateformes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Plateformes cibles <span className="text-destructive">*</span>
        </Label>
        {errors.platforms && (
          <p className="text-xs text-destructive">{errors.platforms}</p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {PLATFORMS.map(([platform, config]) => {
            const isSelected = selectedPlatforms.includes(platform)
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all",
                  isSelected
                    ? "border-transparent ring-2 ring-offset-1"
                    : "border-border bg-card hover:bg-accent"
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${config.color}18`,
                        borderColor: `${config.color}40`,
                        outlineColor: config.color,
                      }
                    : undefined
                }
              >
                <span
                  className="flex size-7 items-center justify-center rounded-md text-xs font-bold"
                  style={isSelected ? { backgroundColor: config.color, color: "#fff" } : { backgroundColor: `${config.color}20`, color: config.color }}
                >
                  {config.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{config.label}</p>
                  <p className="text-[10px] text-muted-foreground">{config.charLimit.toLocaleString()} car.</p>
                </div>
              </button>
            )
          })}
        </div>
        {selectedPlatforms.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedPlatforms.length} plateforme{selectedPlatforms.length > 1 ? "s" : ""} sélectionnée{selectedPlatforms.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Format de contenu */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Format de contenu <span className="text-destructive">*</span>
        </Label>
        {errors.format && (
          <p className="text-xs text-destructive">{errors.format}</p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {CONTENT_FORMATS.map((format) => {
            const meta = FORMAT_LABELS[format]
            const isSelected = selectedFormat === format
            return (
              <button
                key={format}
                type="button"
                onClick={() => setSelectedFormat(format)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-4 text-center transition-all",
                  isSelected
                    ? "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30"
                    : "border-border bg-card hover:bg-accent"
                )}
              >
                <span className="text-2xl">{meta.emoji}</span>
                <span className={cn("text-xs font-semibold", isSelected && "text-violet-600 dark:text-violet-400")}>
                  {meta.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">{meta.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="size-4" />
          Retour
        </Button>
        <Button type="button" onClick={handleNext} className="gap-2">
          Générer les textes
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
