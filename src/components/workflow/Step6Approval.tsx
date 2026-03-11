"use client"

import { useState } from "react"
import type { Step1Data, Step2Data, Step5Data, Step6Data } from "@/lib/schemas/workflow.schema"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, CheckCircle2, XCircle, Eye, Hash } from "lucide-react"

interface Step6ApprovalProps {
  step1: Step1Data
  step2: Step2Data
  step5: Step5Data
  onBack: () => void
  onNext: (data: Step6Data) => void
}

export function Step6Approval({ step1, step2, step5, onBack, onNext }: Omit<Step6ApprovalProps, "defaultValues">) {
  const [decision, setDecision] = useState<boolean | null>(null)

  function handleApprove() {
    setDecision(true)
    onNext({ approved: true, approvedAt: new Date().toISOString() })
  }

  function handleReject() {
    setDecision(false)
    // Retour à la review
    onBack()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Approbation du contenu</h3>
        <p className="text-xs text-muted-foreground">Validez le contenu avant de le planifier</p>
      </div>

      {/* Preview complète */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header preview */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
          <Eye className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">APERÇU DU CONTENU</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Titre */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">TITRE</p>
            <p className="text-sm font-semibold text-foreground">{step1.titre}</p>
          </div>

          {/* Plateformes */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">PLATEFORMES</p>
            <div className="flex flex-wrap gap-1.5">
              {step2.platforms.map((p) => {
                const cfg = PLATFORM_CONFIG[p]
                return (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: cfg.color }}
                  >
                    <span>{cfg.icon}</span>
                    {cfg.label}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Caption */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">CAPTION</p>
              <div className="rounded-lg bg-muted/50 p-3 max-h-48 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{step5.finalCaption}</p>
              </div>

              {/* Hashtags */}
              {step5.finalHashtags.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Hash className="size-3" />
                    {step5.finalHashtags.length} hashtags
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {step5.finalHashtags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-300"
                      >
                        #{tag.replace(/^#/, "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Visuel */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">VISUEL</p>
              {step5.finalVisualUrl ? (
                <div className="overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step5.finalVisualUrl}
                    alt="Visuel du post"
                    className="w-full object-cover max-h-48"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 h-32 text-xs text-muted-foreground">
                  Aucun visuel
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {step5.notes && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">NOTES INTERNES</p>
              <p className="text-xs text-muted-foreground italic">{step5.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Décision */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleReject}
          disabled={decision !== null}
          className="flex-1 gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <XCircle className="size-4" />
          Réviser le contenu
        </Button>
        <Button
          type="button"
          onClick={handleApprove}
          disabled={decision !== null}
          className={cn(
            "flex-1 gap-2 transition-all",
            decision === true && "bg-green-600 hover:bg-green-600"
          )}
        >
          <CheckCircle2 className="size-4" />
          {decision === true ? "Approuvé ✓" : "Approuver & planifier"}
        </Button>
      </div>

      <div className="flex justify-start">
        <Button type="button" variant="ghost" onClick={onBack} size="sm" className="gap-2 text-xs">
          <ChevronLeft className="size-3" />
          Retour à la review
        </Button>
      </div>

      {/* Info */}
      <p className="text-center text-xs text-muted-foreground">
        En approuvant, le contenu passera à l&apos;étape de planification.
        <br />
        &quot;Réviser&quot; vous ramène à l&apos;étape précédente pour modifications.
      </p>
    </div>
  )
}
