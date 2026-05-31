"use client"

import { useTranslations } from "next-intl"

import { useState, useTransition, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { TranslatedFieldError } from "@/components/ui/field-error-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PLATFORM_CONFIG, ALL_PLATFORMS } from "@/lib/scheduler/platform-config"
import { createPost, type NewPostData } from "@/app/actions/scheduler"
import type { ScheduledPost } from "@/lib/scheduler/types"

// ── Schéma local (identique à l'action, dupliqué pour le resolver) ──────────

const formSchema = z.object({
  title: z.string().max(500).trim().optional(),
  content: z
    .string()
    .min(1, V.contentRequired)
    .max(3000, V.contentTooLong)
    .trim(),
  platforms: z
    .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
    .min(1, V.platformRequired),
  scheduled_at: z.string().optional().nullable(),
  status: z.enum(["draft", "review", "approved", "scheduled"]),
})

type FormData = z.infer<typeof formSchema>

// ── Props ────────────────────────────────────────────────────────────────────

interface NewPostDialogProps {
  defaultDate?: Date | null
  onCreated?: (post: ScheduledPost) => void
  trigger?: React.ReactNode
}

// ── Composant ────────────────────────────────────────────────────────────────

export function NewPostDialog({ defaultDate, onCreated, trigger }: NewPostDialogProps) {
  const t = useTranslations("calendar.dialog")
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const defaultScheduled = defaultDate
    ? toLocalDateTimeString(defaultDate)
    : ""

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      platforms: [],
      scheduled_at: defaultScheduled || null,
      status: "draft",
    },
  })

  // useWatch pour compatibilité React Compiler
  const selectedPlatforms = useWatch({ control: form.control, name: "platforms", defaultValue: [] })
  const content = useWatch({ control: form.control, name: "content", defaultValue: "" })

  function togglePlatform(p: string) {
    const current = form.getValues("platforms")
    const next = current.includes(p as never)
      ? current.filter((x) => x !== p)
      : [...current, p as never]
    form.setValue("platforms", next, { shouldValidate: true })
  }

  // Sync la date pré-remplie quand defaultDate change (clic sur un jour du calendrier)
  useEffect(() => {
    if (open) {
      form.setValue(
        "scheduled_at",
        defaultDate ? toLocalDateTimeString(defaultDate) : null
      )
    }
  }, [defaultDate, open, form])

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      form.reset()
    }
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      // datetime-local produit "YYYY-MM-DDTHH:mm" sans offset → convertir en ISO UTC
      const result = await createPost({
        ...data,
        scheduled_at: data.scheduled_at
          ? new Date(data.scheduled_at).toISOString()
          : null,
      } as NewPostData)
      if (result.success) {
        toast.success(t("createPost"))
        onCreated?.(result.data)
        handleOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="size-4" />
          Nouveau post
        </Button>
      )}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              Créez et planifiez un post sur vos plateformes sociales.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 px-6 pb-2">
              {/* Titre (optionnel) */}
              <div className="space-y-1.5">
                <Label htmlFor="post-title">
                  Titre <span className="text-muted-foreground text-xs">{t("titleOptional")}</span>
                </Label>
                <Input
                  id="post-title"
                  placeholder={t("titlePlaceholder")}
                  {...form.register("title")}
                />
              </div>

              {/* Contenu */}
              <div className="space-y-1.5">
                <Label htmlFor="post-content">
                  Contenu <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="post-content"
                  placeholder={t("contentPlaceholder")}
                  className="min-h-[120px]"
                  {...form.register("content")}
                />
                <CharLimitIndicator
                  contentLength={content.length}
                  platforms={selectedPlatforms}
                  error={form.formState.errors.content?.message}
                />
              </div>

              {/* Plateformes */}
              <div className="space-y-1.5">
                <Label>
                  Plateformes <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_PLATFORMS.map((p) => {
                    const cfg = PLATFORM_CONFIG[p]
                    const active = selectedPlatforms.includes(p)
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                          active
                            ? "text-white border-transparent"
                            : "border-border bg-muted/50 text-muted-foreground hover:border-border hover:bg-muted"
                        )}
                        style={active ? { backgroundColor: cfg.color, borderColor: cfg.color } : {}}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
                {form.formState.errors.platforms && (
                  <TranslatedFieldError message={form.formState.errors.platforms.message} />
                )}
              </div>

              {/* Date de planification */}
              <div className="space-y-1.5">
                <Label htmlFor="post-scheduled">
                  Date de publication <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input
                  id="post-scheduled"
                  type="datetime-local"
                  {...form.register("scheduled_at")}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour sauvegarder en brouillon.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("creating") : t("createPost")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Indicateur de limite de caractères par plateforme ────────────────────────

function CharLimitIndicator({
  contentLength,
  platforms,
  error,
}: {
  contentLength: number
  platforms: string[]
  error?: string
}) {
  // Trouver les plateformes dépassant leur limite
  const violations = platforms
    .map((p) => {
      const cfg = PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG]
      if (!cfg || contentLength <= cfg.charLimit) return null
      return { label: cfg.label, limit: cfg.charLimit, color: cfg.color }
    })
    .filter(Boolean) as { label: string; limit: number; color: string }[]

  // Limite la plus restrictive parmi les plateformes sélectionnées
  const minLimit = platforms.length > 0
    ? Math.min(...platforms.map((p) => PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG]?.charLimit ?? 3000))
    : 3000

  const isOverMin = contentLength > minLimit
  const isNearMin = contentLength > minLimit * 0.9 && !isOverMin

  return (
    <div className="space-y-1">
      {/* Violations par plateforme */}
      {violations.map((v) => (
        <p key={v.label} className="text-xs text-destructive">
          Dépasse la limite {v.label} ({v.limit} car.)
        </p>
      ))}
      {/* Erreur de validation Zod */}
      {error && !violations.length && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      {/* Compteur */}
      <div className="flex items-center justify-end">
        <span className={cn(
          "text-xs tabular-nums",
          isOverMin ? "text-destructive font-semibold" : isNearMin ? "text-orange-500" : "text-muted-foreground"
        )}>
          {contentLength}
          {platforms.length > 0 && minLimit < 3000 ? ` / ${minLimit}` : " / 3000"}
        </span>
      </div>
    </div>
  )
}

// ── Utilitaire ───────────────────────────────────────────────────────────────

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}
