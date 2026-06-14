"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { createPresentationDeckAction } from "@/lib/actions/presentation.actions"
import { DECK_LANGUAGES, type DeckLanguage } from "@/lib/schemas/presentation.schema"

const LANG_LABELS: Record<DeckLanguage, string> = { fr: "Français", ar: "العربية", en: "English" }

export function NewPresentationForm() {
  const t = useTranslations("presentations")
  const router = useRouter()

  const [subject, setSubject] = useState("")
  const [audience, setAudience] = useState("")
  const [slideCount, setSlideCount] = useState(10)
  const [language, setLanguage] = useState<DeckLanguage>("fr")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = subject.trim().length >= 3 && !isGenerating

  async function handleGenerate() {
    if (!canSubmit) return
    setError(null)
    setIsGenerating(true)
    try {
      const result = await createPresentationDeckAction({
        subject: subject.trim(),
        audience: audience.trim(),
        language,
        slideCount,
      })
      if ("error" in result) {
        setError(result.error)
        return
      }
      router.push(`/presentations/${result.id}`)
    } catch {
      setError(t("genericError"))
    } finally {
      setIsGenerating(false)
    }
  }

  const inputClasses = cn(
    "w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors",
    "bg-background border border-border text-foreground placeholder:text-muted-foreground",
    "focus-visible:ring-2 focus-visible:ring-primary/40"
  )

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/presentations" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t("title")}
      </Link>

      <h1 className="text-2xl font-bold text-foreground">{t("newPresentation")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("subtitleFull")}</p>

      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("subjectLabel")}</label>
          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("subjectPlaceholder")}
            rows={3}
            maxLength={2000}
            className={cn(inputClasses, "resize-none")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">{t("audienceLabel")}</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder={t("audiencePlaceholder")}
            maxLength={500}
            className={inputClasses}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("slidesLabel")} : {slideCount}
            </label>
            <input
              type="range"
              min={3}
              max={20}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-muted-foreground">{t("slidesRange")}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("languageLabel")}</label>
            <div className="flex gap-2">
              {DECK_LANGUAGES.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                    language === l
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all",
            "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20",
            "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isGenerating ? t("generating") : t("generatePresentation")}
        </button>
      </div>
    </div>
  )
}
