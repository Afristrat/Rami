"use client"

import { useState, useTransition, useEffect } from "react"
import { generateTextContentAction } from "@/lib/actions/workflow.actions"
import type { Step1Data, Step2Data, GeneratedCaption, Step3Data } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw, Hash, Zap } from "lucide-react"

interface Step3TextGenProps {
  step1: Step1Data
  step2: Step2Data
  defaultValues?: Step3Data | null
  onBack: () => void
  onNext: (data: Step3Data) => void
}

export function Step3TextGen({ step1, step2, defaultValues, onBack, onNext }: Step3TextGenProps) {
  const [isPending, startTransition] = useTransition()
  const [captions, setCaptions] = useState<GeneratedCaption[]>(defaultValues?.captions ?? [])
  const [selectedIdx, setSelectedIdx] = useState(defaultValues?.selectedCaptionIndex ?? 0)
  const [error, setError] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<string>(step2.platforms[0])

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateTextContentAction(step1, step2)
      if (result.success) {
        setCaptions(result.captions)
        setSelectedIdx(0)
      } else {
        setError(result.error)
      }
    })
  }

  // Auto-génération au premier affichage si pas de données
  useEffect(() => {
    if (captions.length === 0) {
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeCaptions = captions.filter((c) => c.platform === activePlatform)
  const activeCaption = activeCaptions[0]
  const config = PLATFORM_CONFIG[activePlatform as keyof typeof PLATFORM_CONFIG]

  function handleNext() {
    if (captions.length === 0) return
    onNext({ captions, selectedCaptionIndex: selectedIdx })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Textes générés par IA</h3>
          <p className="text-xs text-muted-foreground">Captions, hashtags et hooks adaptés à chaque plateforme</p>
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
          <Sparkles className="size-8 text-violet-500 animate-pulse" />
          <p className="text-sm text-muted-foreground">Claude Haiku génère vos captions…</p>
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

      {/* Tabs plateformes */}
      {!isPending && captions.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {step2.platforms.map((platform) => {
              const cfg = PLATFORM_CONFIG[platform]
              const hasCaption = captions.some((c) => c.platform === platform)
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setActivePlatform(platform)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    activePlatform === platform
                      ? "text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                  style={activePlatform === platform ? { backgroundColor: cfg.color } : undefined}
                >
                  <span>{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  {!hasCaption && <span className="text-[10px] opacity-70">(manquant)</span>}
                </button>
              )
            })}
          </div>

          {activeCaption && config && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header plateforme */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 text-white text-xs font-medium"
                style={{ backgroundColor: config.color }}
              >
                <span className="text-base">{config.icon}</span>
                <span>{config.label}</span>
                <span className="ml-auto opacity-80">max {config.charLimit.toLocaleString()} caractères</span>
              </div>

              <div className="p-4 space-y-4">
                {/* Hook */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Zap className="size-3 text-amber-500" />
                    ACCROCHE
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      {activeCaption.hook}
                    </p>
                  </div>
                </div>

                {/* Caption */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">CAPTION</span>
                    <span className={cn(
                      "font-mono",
                      activeCaption.charCount > config.charLimit
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}>
                      {activeCaption.charCount} / {config.charLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeCaption.caption}</p>
                  </div>
                </div>

                {/* Hashtags */}
                {activeCaption.hashtags.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Hash className="size-3 text-blue-500" />
                      HASHTAGS ({activeCaption.hashtags.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCaption.hashtags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 px-2.5 py-0.5 text-xs text-blue-700 dark:text-blue-300"
                        >
                          #{tag.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
          disabled={captions.length === 0 || isPending}
          className="gap-2"
        >
          Générer les visuels
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
