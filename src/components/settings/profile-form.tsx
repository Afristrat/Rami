"use client"

import { useState, useTransition, useRef } from "react"
import { User, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { updateProfileAction, type UserProfile } from "@/lib/actions/settings.actions"
import { cn } from "@/lib/utils"

interface ProfileFormProps {
  profile: UserProfile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations("settings.profileSection")
  const _tCommon = useTranslations("common")
  const tSettings = useTranslations("settings")

  const [fullName, setFullName] = useState(profile.fullName)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "")
  const [previewUrl, setPreviewUrl] = useState(profile.avatarUrl ?? "")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage({ type: "error", text: t("invalidFormat") })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: t("fileTooLarge") })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setPreviewUrl(result)
      setAvatarUrl(result)
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await updateProfileAction({
        fullName,
        avatarUrl: avatarUrl || undefined,
      })
      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else if (result.success) {
        setMessage({ type: "success", text: result.success })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>{t("avatar")}</CardTitle>
          <CardDescription>
            {t("avatarFormats")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            {/* Avatar preview */}
            <div className="relative size-20 shrink-0">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="size-20 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
                  {fullName ? (
                    <span className="text-2xl font-semibold text-primary">
                      {getInitials(fullName)}
                    </span>
                  ) : (
                    <User className="size-8 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3.5" />
                {t("changeAvatar")}
              </Button>
              {previewUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewUrl("")
                    setAvatarUrl("")
                  }}
                  className="text-muted-foreground"
                >
                  {t("remove")}
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle>{t("personalInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted/50 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              {t("emailReadonly")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Message de retour */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-3 text-sm",
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {isPending ? tSettings("savingButton") : tSettings("saveButton")}
        </Button>
      </div>
    </form>
  )
}
