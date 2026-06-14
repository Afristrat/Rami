"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, Sparkles, ArrowLeft, FileText, Upload, PenLine, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  createPresentationDeckAction,
  createPresentationFromFileAction,
} from "@/lib/actions/presentation.actions"
import { DECK_LANGUAGES, type DeckLanguage } from "@/lib/schemas/presentation.schema"

const LANG_LABELS: Record<DeckLanguage, string> = { fr: "Français", ar: "العربية", en: "English" }
const ACCEPT = ".md,.markdown,.txt,.pdf,.docx,.xlsx"
const MAX_BYTES = 20 * 1024 * 1024

type Mode = "brief" | "file"

export function NewPresentationForm() {
  const t = useTranslations("presentations")
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>("brief")
  const [subject, setSubject] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [audience, setAudience] = useState("")
  const [slideCount, setSlideCount] = useState(10)
  const [language, setLanguage] = useState<DeckLanguage>("fr")
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    !isBusy && (mode === "brief" ? subject.trim().length >= 3 : file !== null)

  function pickFile(f: File | null) {
    setError(null)
    if (!f) {
      setFile(null)
      return
    }
    if (f.size > MAX_BYTES) {
      setError(t("fileTooLarge"))
      return
    }
    setFile(f)
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setError(null)
    setIsBusy(true)
    try {
      let result: { id: string } | { error: string }
      if (mode === "brief") {
        result = await createPresentationDeckAction({
          subject: subject.trim(),
          audience: audience.trim(),
          language,
          slideCount,
        })
      } else {
        const fd = new FormData()
        fd.append("file", file as File)
        fd.append("audience", audience.trim())
        fd.append("language", language)
        fd.append("slideCount", String(slideCount))
        result = await createPresentationFromFileAction(fd)
      }
      if ("error" in result) {
        setError(result.error)
        return
      }
      router.push(`/presentations/${result.id}`)
    } catch {
      setError(t("genericError"))
    } finally {
      setIsBusy(false)
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

      {/* Onglets brief / fichier */}
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-border p-1">
        {([
          { m: "brief" as const, icon: PenLine, label: t("modeBrief") },
          { m: "file" as const, icon: Upload, label: t("modeFile") },
        ]).map(({ m, icon: Icon, label }) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null) }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              mode === m ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {mode === "brief" ? (
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
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fileLabel")}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="size-5 shrink-0 text-primary" />
                  <span className="truncate text-sm text-foreground">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({Math.max(1, Math.round(file.size / 1024))} Ko)
                  </span>
                </div>
                <button type="button" onClick={() => pickFile(null)} className="shrink-0 text-muted-foreground hover:text-red-500">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Upload className="size-6" />
                <span className="text-sm font-medium">{t("fileDrop")}</span>
                <span className="text-xs">{t("fileFormats")}</span>
              </button>
            )}
          </div>
        )}

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
            <p className="mt-1 text-xs text-muted-foreground">{t("slidesRange", { min: 3, max: 20 })}</p>
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
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all",
            "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20",
            "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {isBusy ? t("generating") : mode === "file" ? t("convertFile") : t("generatePresentation")}
        </button>
      </div>
    </div>
  )
}
