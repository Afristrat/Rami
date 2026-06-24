"use client"

import { useTranslations } from "next-intl"

import { useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"
import { TranslatedFieldError } from "@/components/ui/field-error-i18n"
import { X, Trash2, CalendarClock, Pencil, Check, RotateCcw, Copy, CheckCircle2, Clock, ThumbsUp } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useIntlLocale } from "@/lib/utils/format-locale"
import { PlatformBadge } from "./PlatformBadge"
import { deletePost, updatePost, updatePostStatus, duplicatePost } from "@/app/actions/scheduler"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/scheduler/types"
import type { ScheduledPost } from "@/lib/scheduler/types"
import {
  PLATFORM_CONFIG,
  VISIBLE_PLATFORMS,
  isPlatformSelectable,
} from "@/lib/scheduler/platform-config"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ── Schéma édition ───────────────────────────────────────────────────────────

const editSchema = z.object({
  title: z.string().max(500).trim().optional(),
  content: z.string().min(1, V.contentRequired).max(3000).trim(),
  platforms: z
    .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
    .min(1, V.platformRequired),
  scheduled_at: z.string().optional().nullable(),
})

type EditFormData = z.infer<typeof editSchema>

// ── Props ────────────────────────────────────────────────────────────────────

interface PostDetailPanelProps {
  post: ScheduledPost
  onClose: () => void
  onDeleted?: (postId: string) => void
  onUpdated?: (post: ScheduledPost) => void
  onDuplicated?: (post: ScheduledPost) => void
}

// ── Composant principal ──────────────────────────────────────────────────────

export function PostDetailPanel({ post, onClose, onDeleted, onUpdated, onDuplicated }: PostDetailPanelProps) {
  const t = useTranslations("calendar.detail")
  const _tCommon = useTranslations("common")
  const intlLocale = useIntlLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [currentPost, setCurrentPost] = useState<ScheduledPost>(post)
  const [isDeleting, startDeleteTransition] = useTransition()
  const [isActioning, startActionTransition] = useTransition()

  function handleDeleted() {
    startDeleteTransition(async () => {
      const result = await deletePost(currentPost.id)
      if (result.success) {
        toast.success(t("postDeleted"))
        onDeleted?.(currentPost.id)
        onClose()
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleUpdated(updated: ScheduledPost) {
    setCurrentPost(updated)
    onUpdated?.(updated)
    setIsEditing(false)
  }

  function handleStatusChange(status: ScheduledPost["status"]) {
    startActionTransition(async () => {
      const result = await updatePostStatus(currentPost.id, status)
      if (result.success) {
        toast.success(`Statut → ${STATUS_LABELS[status]}`)
        setCurrentPost(result.data)
        onUpdated?.(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDuplicate() {
    startActionTransition(async () => {
      const result = await duplicatePost(currentPost.id)
      if (result.success) {
        toast.success(t("duplicated"))
        onDuplicated?.(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  const scheduledDate = currentPost.scheduled_at ? new Date(currentPost.scheduled_at) : null
  const formattedDateTime = scheduledDate
    ? scheduledDate.toLocaleString(intlLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0 flex-1">
          {currentPost.title && !isEditing && (
            <p className="truncate text-sm font-semibold text-foreground">
              {currentPost.title}
            </p>
          )}
          {!isEditing && (
            <span
              className={cn(
                "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                STATUS_STYLES[currentPost.status]
              )}
            >
              {STATUS_LABELS[currentPost.status]}
            </span>
          )}
          {isEditing && (
            <p className="text-sm font-semibold text-foreground">{t("editMode")}</p>
          )}
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={t("editBtn")}
            >
              <Pencil className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Contenu : vue ou édition */}
      {isEditing ? (
        <EditForm
          post={currentPost}
          onSaved={handleUpdated}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          {/* Vue détail */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {formattedDateTime && (
              <div className="flex items-start gap-2 text-sm">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground capitalize">{formattedDateTime}</span>
              </div>
            )}

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Plateformes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentPost.platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} size="sm" />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Contenu
              </p>
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap">
                {currentPost.content}
              </div>
            </div>

            {currentPost.media_urls.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Médias ({currentPost.media_urls.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {currentPost.media_urls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={`Média ${i + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Créé le{" "}
              {new Date(currentPost.created_at).toLocaleDateString(intlLocale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Actions rapides statut */}
          <div className="border-t border-border p-4 space-y-2">
            <StatusActions
              currentStatus={currentPost.status}
              onStatusChange={handleStatusChange}
              disabled={isActioning || isDeleting}
            />

            {/* Dupliquer + Supprimer */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDuplicate}
                disabled={isActioning || isDeleting}
              >
                <Copy className="size-3.5" />
                Dupliquer
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleDeleted}
                disabled={isDeleting || isActioning}
              >
                <Trash2 className="size-3.5" />
                {isDeleting ? "…" : "Supprimer"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Formulaire d'édition inline ───────────────────────────────────────────────

function EditForm({
  post,
  onSaved,
  onCancel,
}: {
  post: ScheduledPost
  onSaved: (updated: ScheduledPost) => void
  onCancel: () => void
}) {
  const t = useTranslations("calendar.detail")
  const tCommon = useTranslations("common")
  const [isSaving, startSaveTransition] = useTransition()

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: post.title ?? "",
      content: post.content,
      platforms: post.platforms,
      scheduled_at: post.scheduled_at
        ? toLocalDateTimeString(new Date(post.scheduled_at))
        : null,
    },
  })

  const selectedPlatforms = useWatch({
    control: form.control,
    name: "platforms",
    defaultValue: post.platforms,
  })
  const content = useWatch({
    control: form.control,
    name: "content",
    defaultValue: post.content,
  })

  function togglePlatform(p: string) {
    const current = form.getValues("platforms")
    const next = current.includes(p as never)
      ? current.filter((x) => x !== p)
      : [...current, p as never]
    form.setValue("platforms", next, { shouldValidate: true })
  }

  function onSubmit(data: EditFormData) {
    startSaveTransition(async () => {
      // datetime-local produit "YYYY-MM-DDTHH:mm" sans offset → convertir en ISO UTC
      const scheduled_at = data.scheduled_at
        ? new Date(data.scheduled_at).toISOString()
        : null
      const result = await updatePost(post.id, {
        title: data.title || undefined,
        content: data.content,
        platforms: data.platforms,
        scheduled_at,
      })
      if (result.success) {
        toast.success(t("postUpdated"))
        onSaved(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Titre */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">
            Titre <span className="text-muted-foreground text-xs">(optionnel)</span>
          </Label>
          <Input
            id="edit-title"
            placeholder="Titre du post…"
            {...form.register("title")}
          />
        </div>

        {/* Contenu */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-content">
            Contenu <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="edit-content"
            className="min-h-[120px]"
            {...form.register("content")}
          />
          <PanelCharLimitIndicator
            contentLength={content.length}
            platforms={selectedPlatforms}
            error={form.formState.errors.content?.message}
          />
        </div>

        {/* Plateformes */}
        <div className="space-y-1.5">
          <Label>Plateformes <span className="text-destructive">*</span></Label>
          <div className="flex flex-wrap gap-1.5">
            {VISIBLE_PLATFORMS.map((p) => {
              const cfg = PLATFORM_CONFIG[p]
              const active = selectedPlatforms.includes(p)
              const selectable = isPlatformSelectable(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => selectable && togglePlatform(p)}
                  disabled={!selectable}
                  aria-disabled={!selectable}
                  title={!selectable ? tCommon("comingSoon") : undefined}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all",
                    !selectable
                      ? "border-dashed border-border bg-muted/30 text-muted-foreground/60 opacity-60 cursor-not-allowed"
                      : active
                      ? "text-white border-transparent"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                  style={active && selectable ? { backgroundColor: cfg.color } : {}}
                >
                  {cfg.label}
                  {!selectable && (
                    <span className="ml-1 text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      · {tCommon("comingSoon")}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {form.formState.errors.platforms && (
            <TranslatedFieldError message={form.formState.errors.platforms.message} />
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="edit-scheduled">Date de publication</Label>
          <Input
            id="edit-scheduled"
            type="datetime-local"
            {...form.register("scheduled_at")}
          />
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 border-t border-border p-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCancel}
          disabled={isSaving}
        >
          <RotateCcw className="size-3.5" />
          Annuler
        </Button>
        <Button type="submit" size="sm" className="flex-1" disabled={isSaving}>
          <Check className="size-3.5" />
          {isSaving ? t("saving") : t("saveBtn")}
        </Button>
      </div>
    </form>
  )
}

// ── Actions rapides de statut ─────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<
  ScheduledPost["status"],
  Array<{ to: ScheduledPost["status"]; label: string; icon: React.ReactNode }>
> = {
  draft: [
    { to: "review", label: "Soumettre", icon: <ThumbsUp className="size-3.5" /> },
    { to: "scheduled", label: "Planifier", icon: <Clock className="size-3.5" /> },
  ],
  review: [
    { to: "approved", label: "Approuver", icon: <CheckCircle2 className="size-3.5" /> },
    { to: "draft", label: "Retour brouillon", icon: <RotateCcw className="size-3.5" /> },
  ],
  approved: [
    { to: "scheduled", label: "Planifier", icon: <Clock className="size-3.5" /> },
    { to: "review", label: "Retour révision", icon: <RotateCcw className="size-3.5" /> },
  ],
  scheduled: [
    { to: "approved", label: "Déprogrammer", icon: <RotateCcw className="size-3.5" /> },
  ],
  publishing: [],
  published: [],
  failed: [
    { to: "draft", label: "Réessayer", icon: <RotateCcw className="size-3.5" /> },
  ],
}

function StatusActions({
  currentStatus,
  onStatusChange,
  disabled,
}: {
  currentStatus: ScheduledPost["status"]
  onStatusChange: (s: ScheduledPost["status"]) => void
  disabled: boolean
}) {
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? []
  if (transitions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {transitions.map((t) => (
        <Button
          key={t.to}
          variant="outline"
          size="sm"
          onClick={() => onStatusChange(t.to)}
          disabled={disabled}
          className="flex-1 min-w-0"
        >
          {t.icon}
          <span className="truncate">{t.label}</span>
        </Button>
      ))}
    </div>
  )
}

// ── Utilitaire ────────────────────────────────────────────────────────────────

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

// ── Indicateur de limite par plateforme (version panel) ───────────────────────

function PanelCharLimitIndicator({
  contentLength,
  platforms,
  error,
}: {
  contentLength: number
  platforms: string[]
  error?: string
}) {
  const violations = platforms
    .map((p) => {
      const cfg = PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG]
      if (!cfg || contentLength <= cfg.charLimit) return null
      return { label: cfg.label, limit: cfg.charLimit }
    })
    .filter(Boolean) as { label: string; limit: number }[]

  const minLimit = platforms.length > 0
    ? Math.min(...platforms.map((p) => PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG]?.charLimit ?? 3000))
    : 3000

  const isOverMin = contentLength > minLimit
  const isNearMin = contentLength > minLimit * 0.9 && !isOverMin

  return (
    <div className="space-y-1">
      {violations.map((v) => (
        <p key={v.label} className="text-xs text-destructive">
          Dépasse {v.label} ({v.limit} car.)
        </p>
      ))}
      {error && !violations.length && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <div className="flex justify-end">
        <span className={cn(
          "text-xs tabular-nums",
          isOverMin ? "text-destructive font-semibold" : isNearMin ? "text-orange-500" : "text-muted-foreground"
        )}>
          {contentLength}{platforms.length > 0 && minLimit < 3000 ? ` / ${minLimit}` : " / 3000"}
        </span>
      </div>
    </div>
  )
}
