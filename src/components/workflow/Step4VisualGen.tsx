"use client"

import { useState, useTransition, useEffect } from "react"
import { generateVisualContentAction } from "@/lib/actions/workflow.actions"
import type { Step1Data, Step2Data, GeneratedVisual, Step4Data } from "@/lib/schemas/workflow.schema"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Image as ImageIcon, RefreshCw, CheckCircle2, Star } from "lucide-react"

interface Step4VisualGenProps {
  step1: Step1Data
  step2: Step2Data
  defaultValues?: Step4Data | null
  onBack: () => void
  onNext: (data: Step4Data) => void
}

export function Step4VisualGen({ step1, step2, defaultValues, onBack, onNext }: Step4VisualGenProps) {
  const [isPending, startTransition] = useTransition()
  const [visuals, setVisuals] = useState<GeneratedVisual[]>(defaultValues?.visuals ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(defaultValues?.selectedVisualId ?? null)
  const [error, setError] = useState<string | null>(null)

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateVisualContentAction(step1, step2)
      if (result.success) {
        setVisuals(result.visuals)
        setSelectedId(null)
      } else {
        setError(result.error)
      }
    })
  }

  // Auto-génération si pas de données
  useEffect(() => {
    if (visuals.length === 0) {
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleNext() {
    onNext({ visuals, selectedVisualId: selectedId })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Visuels générés par IA</h3>
          <p className="text-xs text-muted-foreground">
            Basés sur votre Brand DNA — sélectionnez votre préféré (optionnel)
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={isPending}
          className="gap-2"
        >
          <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
          Régénérer
        </Button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-12">
          <ImageIcon className="size-8 text-violet-500 animate-pulse" />
          <p className="text-sm text-muted-foreground">Génération des visuels via Fal.ai…</p>
          <p className="text-xs text-muted-foreground/60">Cela peut prendre 10-20 secondes</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="size-2 rounded-full bg-violet-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Galerie visuels */}
      {!isPending && visuals.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {visuals.map((visual) => {
              const isSelected = selectedId === visual.id
              return (
                <button
                  key={visual.id}
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : visual.id)}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-violet-500 ring-4 ring-violet-500/20"
                      : "border-border hover:border-violet-300 dark:hover:border-violet-700"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={visual.url}
                    alt={`Visuel ${visual.id}`}
                    className="size-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://picsum.photos/seed/${visual.id}/400/400`
                    }}
                  />

                  {/* Overlay sélectionné */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                      <CheckCircle2 className="size-8 text-violet-500 drop-shadow-lg" />
                    </div>
                  )}

                  {/* Score Brand DNA */}
                  <div className={cn(
                    "absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm",
                    visual.brandDnaScore >= 0.8
                      ? "bg-green-500/90 text-white"
                      : visual.brandDnaScore >= 0.6
                      ? "bg-amber-500/90 text-white"
                      : "bg-muted/90 text-muted-foreground"
                  )}>
                    <Star className="size-2.5" />
                    {Math.round(visual.brandDnaScore * 100)}%
                  </div>

                  {/* Provider badge */}
                  {visual.provider === "placeholder" && (
                    <div className="absolute top-2 left-2 rounded-full bg-muted/90 px-2 py-0.5 text-[9px] text-muted-foreground backdrop-blur-sm">
                      Exemple
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {selectedId ? (
            <p className="text-xs text-center text-violet-600 dark:text-violet-400 font-medium">
              ✓ Visuel sélectionné — vous pouvez modifier votre choix
            </p>
          ) : (
            <p className="text-xs text-center text-muted-foreground">
              Sélectionnez un visuel ou continuez sans visuel
            </p>
          )}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="size-4" />
          Retour
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="gap-2"
        >
          Review & sélection
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
