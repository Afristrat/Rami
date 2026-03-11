"use client"

import { useState, useTransition } from "react"
import { saveWorkflowPostAction } from "@/lib/actions/workflow.actions"
import type { Step1Data, Step2Data, Step5Data, Step7Data } from "@/lib/schemas/workflow.schema"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ChevronLeft, CalendarCheck, Zap, Save, CheckCircle2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface Step7ScheduleProps {
  step1: Step1Data
  step2: Step2Data
  step5: Step5Data
  defaultValues?: Step7Data | null
  onBack: () => void
}

export function Step7Schedule({ step1, step2, step5, defaultValues, onBack }: Step7ScheduleProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [publishMode, setPublishMode] = useState<"now" | "scheduled" | "draft">(
    defaultValues?.publishMode === "scheduled" ? "scheduled" : "now"
  )
  const [scheduledAt, setScheduledAt] = useState<string>(defaultValues?.scheduledAt ?? "")
  const [error, setError] = useState<string | null>(null)
  const [savedPostId, setSavedPostId] = useState<string | null>(null)
  // Date minimum calculée une fois au montage du composant
  const [minDate] = useState(() =>
    new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)
  )

  function handleSave() {
    setError(null)

    if (publishMode === "scheduled" && !scheduledAt) {
      setError("Veuillez sélectionner une date et heure de publication.")
      return
    }

    startTransition(async () => {
      const result = await saveWorkflowPostAction({
        step1,
        step2,
        finalCaption: step5.finalCaption,
        finalHashtags: step5.finalHashtags,
        finalVisualUrl: step5.finalVisualUrl,
        scheduledAt: publishMode === "scheduled" ? scheduledAt : null,
        status: publishMode === "draft" ? "draft" : publishMode === "scheduled" ? "scheduled" : "approved",
      })

      if (result.success) {
        setSavedPostId(result.postId)
      } else {
        setError(result.error)
      }
    })
  }

  // État succès
  if (savedPostId) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Contenu planifié !</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {publishMode === "scheduled"
              ? "Votre post a été planifié dans le calendrier."
              : publishMode === "draft"
              ? "Votre post a été sauvegardé en brouillon."
              : "Votre post est approuvé et prêt à publier."}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            onClick={() => router.push("/dashboard/calendar")}
            className="gap-2 w-full"
          >
            <CalendarCheck className="size-4" />
            Voir le calendrier
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/calendar?postId=${savedPostId}`)}
            className="gap-2 w-full"
          >
            <ExternalLink className="size-4" />
            Voir ce post
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSavedPostId(null)
              router.push("/dashboard/create")
            }}
            className="gap-2 w-full text-sm"
          >
            Créer un nouveau contenu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Planification du post</h3>
        <p className="text-xs text-muted-foreground">Choisissez quand et comment publier votre contenu</p>
      </div>

      {/* Résumé final */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Résumé</p>
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs text-muted-foreground shrink-0">Titre</span>
            <span className="text-xs font-medium text-foreground text-right">{step1.titre}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground shrink-0">Plateformes</span>
            <span className="text-xs font-medium text-foreground">{step2.platforms.length} plateforme{step2.platforms.length > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground shrink-0">Visuel</span>
            <span className="text-xs font-medium text-foreground">{step5.finalVisualUrl ? "Oui" : "Non"}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground shrink-0">Hashtags</span>
            <span className="text-xs font-medium text-foreground">{step5.finalHashtags.length} hashtags</span>
          </div>
        </div>
      </div>

      {/* Mode publication */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Mode de publication</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            {
              value: "now",
              label: "Prêt à publier",
              desc: "Approuvé, publication manuelle",
              icon: Zap,
              color: "text-green-500",
              bg: "border-green-500/30 bg-green-500/10",
            },
            {
              value: "scheduled",
              label: "Planifier",
              desc: "Définir une date et heure",
              icon: CalendarCheck,
              color: "text-violet-500",
              bg: "border-violet-500/30 bg-violet-500/10",
            },
            {
              value: "draft",
              label: "Brouillon",
              desc: "Sauvegarder pour plus tard",
              icon: Save,
              color: "text-muted-foreground",
              bg: "border-border bg-muted/30",
            },
          ].map((mode) => {
            const Icon = mode.icon
            const isActive = publishMode === mode.value
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setPublishMode(mode.value as typeof publishMode)}
                className={cn(
                  "flex flex-col gap-1.5 rounded-xl border-2 p-4 text-left transition-all",
                  isActive ? mode.bg + " ring-2 ring-offset-1" : "border-border bg-card hover:bg-accent"
                )}
                style={isActive && mode.value !== "draft" ? { outlineColor: "currentColor" } : undefined}
              >
                <Icon className={cn("size-5", isActive ? mode.color : "text-muted-foreground")} />
                <span className={cn("text-xs font-semibold", isActive ? mode.color : "text-foreground")}>
                  {mode.label}
                </span>
                <span className="text-[10px] text-muted-foreground">{mode.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sélecteur datetime si scheduled */}
      {publishMode === "scheduled" && (
        <div className="space-y-2">
          <Label htmlFor="scheduled-at" className="text-sm font-medium">
            Date et heure de publication <span className="text-destructive">*</span>
          </Label>
          <input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            min={minDate}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {scheduledAt && (
            <p className="text-xs text-muted-foreground">
              Publication prévue le{" "}
              <strong>
                {new Date(scheduledAt).toLocaleString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </p>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2" disabled={isPending}>
          <ChevronLeft className="size-4" />
          Retour
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="gap-2"
        >
          {isPending ? (
            <>
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Sauvegarde…
            </>
          ) : (
            <>
              {publishMode === "draft" ? <Save className="size-4" /> : <CalendarCheck className="size-4" />}
              {publishMode === "draft" ? "Sauvegarder" : publishMode === "scheduled" ? "Planifier" : "Finaliser"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
