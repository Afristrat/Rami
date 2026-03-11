"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"

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
    .min(1, "Le contenu est requis")
    .max(3000, "Contenu trop long")
    .trim(),
  platforms: z
    .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
    .min(1, "Sélectionnez au moins une plateforme"),
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
      const result = await createPost(data as NewPostData)
      if (result.success) {
        toast.success("Post créé avec succès !")
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
            <DialogTitle>Nouveau post</DialogTitle>
            <DialogDescription>
              Créez et planifiez un post sur vos plateformes sociales.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4 px-6 pb-2">
              {/* Titre (optionnel) */}
              <div className="space-y-1.5">
                <Label htmlFor="post-title">
                  Titre <span className="text-muted-foreground text-xs">(optionnel)</span>
                </Label>
                <Input
                  id="post-title"
                  placeholder="Ex : Lancement produit Été 2026"
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
                  placeholder="Rédigez votre post…"
                  className="min-h-[120px]"
                  {...form.register("content")}
                />
                <div className="flex items-center justify-between">
                  {form.formState.errors.content && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                  <p className={cn(
                    "ml-auto text-xs tabular-nums",
                    content.length > 2800 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {content.length} / 3000
                  </p>
                </div>
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
                  <p className="text-xs text-destructive">
                    {form.formState.errors.platforms.message}
                  </p>
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
                {isPending ? "Création…" : "Créer le post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
