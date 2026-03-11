"use client"

import { useState } from "react"
import type { Step1Data, Step2Data, Step3Data, Step4Data, Step5Data } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Edit2, Image as ImageIcon } from "lucide-react"

interface Step5ReviewProps {
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
  defaultValues?: Step5Data | null
  onBack: () => void
  onNext: (data: Step5Data) => void
}

export function Step5Review({ step1, step2, step3, step4, defaultValues, onBack, onNext }: Step5ReviewProps) {
  const firstCaption = step3.captions[step3.selectedCaptionIndex] ?? step3.captions[0]
  const selectedVisual = step4.visuals.find((v) => v.id === step4.selectedVisualId)

  const [finalCaption, setFinalCaption] = useState(
    defaultValues?.finalCaption ?? firstCaption?.caption ?? ""
  )
  const [finalHashtags, setFinalHashtags] = useState<string[]>(
    defaultValues?.finalHashtags ?? firstCaption?.hashtags ?? []
  )
  const [finalVisualUrl, setFinalVisualUrl] = useState<string | null>(
    defaultValues?.finalVisualUrl ?? selectedVisual?.url ?? null
  )
  const [notes, setNotes] = useState(defaultValues?.notes ?? "")
  const [activePlatform, setActivePlatform] = useState(step2.platforms[0])

  function handleNext() {
    onNext({ finalCaption, finalHashtags, finalVisualUrl, notes })
  }

  const activePlatformConfig = PLATFORM_CONFIG[activePlatform]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Review du contenu</h3>
        <p className="text-xs text-muted-foreground">Ajustez le texte final avant approbation</p>
      </div>

      {/* Résumé brief */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
        <p className="text-xs font-medium text-foreground">{step1.titre}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{step1.description}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {step2.platforms.map((p) => {
            const cfg = PLATFORM_CONFIG[p]
            return (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: cfg.color }}
              >
                {cfg.icon} {cfg.label}
              </span>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Colonne texte */}
        <div className="space-y-4">
          {/* Sélecteur plateforme */}
          <div className="flex gap-1 overflow-x-auto">
            {step2.platforms.map((platform) => {
              const cfg = PLATFORM_CONFIG[platform]
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => {
                    setActivePlatform(platform)
                    const cap = step3.captions.find((c) => c.platform === platform)
                    if (cap) {
                      setFinalCaption(cap.caption)
                      setFinalHashtags(cap.hashtags)
                    }
                  }}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all",
                    activePlatform === platform
                      ? "text-white"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                  style={activePlatform === platform ? { backgroundColor: cfg.color } : undefined}
                >
                  {cfg.icon} {cfg.label}
                </button>
              )
            })}
          </div>

          {/* Caption éditable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Edit2 className="size-3" />
                Caption ({activePlatformConfig?.label})
              </Label>
              <span className={cn(
                "text-[10px] font-mono",
                finalCaption.length > (activePlatformConfig?.charLimit ?? 9999)
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}>
                {finalCaption.length} / {activePlatformConfig?.charLimit?.toLocaleString()}
              </span>
            </div>
            <Textarea
              value={finalCaption}
              onChange={(e) => setFinalCaption(e.target.value)}
              rows={6}
              className="resize-none text-sm"
            />
          </div>

          {/* Hashtags éditables */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Hashtags</Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/30 p-2 min-h-[40px]">
              {finalHashtags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFinalHashtags((prev) => prev.filter((t) => t !== tag))}
                  className="rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 px-2.5 py-0.5 text-xs text-blue-700 dark:text-blue-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  title="Cliquer pour supprimer"
                >
                  #{tag.replace(/^#/, "")} ×
                </button>
              ))}
              {finalHashtags.length === 0 && (
                <span className="text-xs text-muted-foreground">Aucun hashtag</span>
              )}
            </div>
          </div>

          {/* Notes internes */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Notes internes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes pour l'équipe ou le client…"
              rows={2}
              className="resize-none text-xs"
            />
          </div>
        </div>

        {/* Colonne visuel */}
        <div className="space-y-3">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <ImageIcon className="size-3" />
            Visuel sélectionné
          </Label>

          {finalVisualUrl ? (
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-xl border border-border aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={finalVisualUrl}
                  alt="Visuel sélectionné"
                  className="size-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFinalVisualUrl(null)}
                className="w-full text-xs"
              >
                Retirer le visuel
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 aspect-square">
              <ImageIcon className="size-8 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground text-center">
                Aucun visuel sélectionné
                {step4.visuals.length > 0 && (
                  <><br />
                    <button
                      type="button"
                      onClick={() => {
                        const first = step4.visuals[0]
                        if (first) setFinalVisualUrl(first.url)
                      }}
                      className="text-violet-500 hover:underline"
                    >
                      Utiliser le premier visuel
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="size-4" />
          Retour
        </Button>
        <Button type="button" onClick={handleNext} className="gap-2">
          Soumettre à approbation
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
