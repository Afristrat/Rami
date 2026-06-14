"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import Link from "next/link"
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SlideRenderer } from "./SlideRenderer"
import {
  updatePresentationDeckAction,
  revisePresentationDeckAction,
} from "@/lib/actions/presentation.actions"
import type { DeckSlide, DeckSlideType, PresentationContent } from "@/lib/schemas/presentation.schema"

interface DeckEditorProps {
  id: string
  title: string
  content: PresentationContent
}

const ADD_TYPES: { type: DeckSlideType; label: string }[] = [
  { type: "section", label: "Section" },
  { type: "content", label: "Contenu" },
  { type: "twoColumn", label: "2 colonnes" },
  { type: "stat", label: "Statistique" },
  { type: "quote", label: "Citation" },
]

/** Slide vierge d'un type donné (valeurs minimales valides). */
function blankSlide(type: DeckSlideType): DeckSlide {
  switch (type) {
    case "cover": return { type: "cover", title: "Titre" }
    case "agenda": return { type: "agenda", title: "Ordre du jour", items: ["Point 1", "Point 2"] }
    case "section": return { type: "section", title: "Nouvelle section" }
    case "content": return { type: "content", title: "Titre", bullets: ["Point clé"] }
    case "twoColumn": return { type: "twoColumn", title: "Comparaison", leftTitle: "Colonne A", left: ["Élément"], rightTitle: "Colonne B", right: ["Élément"] }
    case "stat": return { type: "stat", title: "Indicateur", stat: "100%" }
    case "quote": return { type: "quote", quote: "Votre citation." }
    case "conclusion": return { type: "conclusion", title: "Conclusion", bullets: ["À retenir"] }
  }
}

function slideLabel(s: DeckSlide): string {
  return s.type === "quote" ? s.quote.slice(0, 30) : s.title
}

const ACCENTS = ["#7C3BED", "#2563EB", "#059669", "#DC2626", "#D4AF37", "#0F766E", "#9333EA", "#EA580C"]

export function DeckEditor({ id, title, content }: DeckEditorProps) {
  const t = useTranslations("presentations")
  const [slides, setSlides] = useState<DeckSlide[]>(content.deck.slides)
  const [accent, setAccent] = useState(content.theme.accentColor)
  const [current, setCurrent] = useState(0)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [instruction, setInstruction] = useState("")
  const [revising, setRevising] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const total = slides.length
  const slide = slides[current]

  function mutate(next: DeckSlide[], idx = current) {
    setSlides(next)
    setCurrent(Math.max(0, Math.min(next.length - 1, idx)))
    setDirty(true)
  }

  /** Met à jour la slide courante via un updater type-narrowé. */
  function updateCurrent(updater: (s: DeckSlide) => DeckSlide) {
    mutate(slides.map((s, i) => (i === current ? updater(s) : s)))
  }

  function move(dir: -1 | 1) {
    const j = current + dir
    if (j < 0 || j >= total) return
    const copy = [...slides]
    ;[copy[current], copy[j]] = [copy[j], copy[current]]
    mutate(copy, j)
  }

  function addSlide(type: DeckSlideType) {
    const copy = [...slides]
    copy.splice(current + 1, 0, blankSlide(type))
    setShowAddMenu(false)
    mutate(copy, current + 1)
  }

  function deleteSlide() {
    if (total <= 3) {
      toast.error(t("minSlides"))
      return
    }
    mutate(slides.filter((_, i) => i !== current), Math.max(0, current - 1))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await updatePresentationDeckAction(id, { deck: { slides }, accentColor: accent })
      if (res.success) {
        setDirty(false)
        toast.success(t("saved"))
      } else {
        toast.error(t("saveError"))
      }
    } catch {
      toast.error(t("saveError"))
    } finally {
      setSaving(false)
    }
  }

  async function handleRevise() {
    if (instruction.trim().length < 3) return
    setRevising(true)
    try {
      const res = await revisePresentationDeckAction(id, instruction.trim())
      if ("error" in res) {
        toast.error(t("reviseError"))
        return
      }
      setSlides(res.deck.slides)
      setCurrent(0)
      setDirty(true)
      setInstruction("")
      toast.success(t("reviseDone"))
    } catch {
      toast.error(t("reviseError"))
    } finally {
      setRevising(false)
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col min-h-0 overflow-hidden">
      {/* Barre d'action */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background/50 px-4 py-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={`/presentations/${id}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h2 className="truncate text-base font-bold text-foreground">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/presentations/${id}`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <Eye className="size-4" />
            {t("preview")}
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all",
              "bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 disabled:opacity-50"
            )}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("save")}
          </button>
        </div>
      </div>

      {/* Bandeau de slides horizontal (mobile uniquement) */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-muted/10 p-2 lg:hidden">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className={cn(
              "w-24 shrink-0 overflow-hidden rounded-lg border transition-all",
              i === current ? "border-primary ring-2 ring-primary/20" : "border-border opacity-70"
            )}
          >
            <div className="aspect-video">
              <SlideRenderer slide={s} index={i} total={total} accentColor={accent} variant="thumb" />
            </div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => addSlide("content")}
          className="flex w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground"
          title={t("addSlide")}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden min-h-0">
        {/* Liste des slides (desktop) */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-muted/10 lg:flex">
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={cn(
                  "block w-full overflow-hidden rounded-lg border text-left transition-all",
                  i === current ? "border-primary ring-2 ring-primary/20" : "border-border opacity-70 hover:opacity-100"
                )}
              >
                <div className="aspect-video">
                  <SlideRenderer slide={s} index={i} total={total} accentColor={accent} variant="thumb" />
                </div>
                <span className="block truncate px-1.5 py-1 text-[10px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")} {slideLabel(s)}
                </span>
              </button>
            ))}
          </div>
          <div className="relative shrink-0 border-t border-border p-3">
            <button
              type="button"
              onClick={() => setShowAddMenu((v) => !v)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              <Plus className="size-4" />
              {t("addSlide")}
            </button>
            {showAddMenu && (
              <div className="absolute bottom-14 left-3 right-3 z-10 rounded-lg border border-border bg-popover p-1 shadow-lg">
                {ADD_TYPES.map((a) => (
                  <button
                    key={a.type}
                    type="button"
                    onClick={() => addSlide(a.type)}
                    className="block w-full rounded px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Aperçu + contrôles de slide */}
        <section className="flex flex-col items-center gap-3 p-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
          <div
            className="aspect-video w-full max-w-2xl overflow-hidden rounded-xl border border-border shadow-xl"
            style={{ maxWidth: "min(42rem, calc((100dvh - 22rem) * 16 / 9))" }}
          >
            <SlideRenderer slide={slide} index={current} total={total} accentColor={accent} variant="full" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => move(-1)} disabled={current === 0} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30" title={t("moveUp")}>
              <ChevronUp className="size-4" />
            </button>
            <button type="button" onClick={() => move(1)} disabled={current >= total - 1} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30" title={t("moveDown")}>
              <ChevronDown className="size-4" />
            </button>
            <button type="button" onClick={deleteSlide} className="rounded-lg border border-red-300/40 p-1.5 text-red-500 hover:bg-red-500/10" title={t("deleteSlide")}>
              <Trash2 className="size-4" />
            </button>
          </div>
        </section>

        {/* Panneau d'édition (sous l'aperçu sur mobile, colonne droite sur desktop) */}
        <aside className="flex w-full shrink-0 flex-col gap-4 border-t border-border bg-muted/10 p-4 lg:w-80 lg:border-l lg:border-t-0 lg:overflow-y-auto">
          {/* Retouche IA */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" />
              {t("aiRetouch")}
            </div>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={t("aiRetouchPlaceholder")}
              rows={2}
              maxLength={1000}
              className="w-full resize-none rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <button
              type="button"
              onClick={handleRevise}
              disabled={revising || instruction.trim().length < 3}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {revising ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              {revising ? t("revising") : t("applyRetouch")}
            </button>
          </div>

          {/* Couleur d'accent */}
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("accentColor")}</p>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setAccent(c); setDirty(true) }}
                  className={cn("size-7 rounded-full border-2 transition-all", accent.toLowerCase() === c.toLowerCase() ? "border-foreground scale-110" : "border-transparent")}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Champs de la slide courante */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("slideContent")}</p>
            <SlideFields slide={slide} onChange={updateCurrent} t={t} />
          </div>
        </aside>
      </div>
    </div>
  )
}

/* ─── Éditeurs de champs par type de slide ─── */

type T = ReturnType<typeof useTranslations>

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cn(cls, "resize-none")} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </label>
  )
}

function ListField({ label, items, onChange, t }: { label: string; items: string[]; onChange: (v: string[]) => void; t: T }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              type="text"
              value={it}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              disabled={items.length <= 1}
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-500 disabled:opacity-30"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
        >
          <Plus className="size-3" />
          {t("addItem")}
        </button>
      </div>
    </div>
  )
}

function SlideFields({ slide, onChange, t }: { slide: DeckSlide; onChange: (u: (s: DeckSlide) => DeckSlide) => void; t: T }) {
  switch (slide.type) {
    case "cover":
    case "section":
      return (
        <>
          <Field label={t("fieldTitle")} value={slide.title} onChange={(v) => onChange((s) => (s.type === slide.type ? { ...s, title: v } : s))} />
          <Field label={t("fieldSubtitle")} value={slide.subtitle ?? ""} onChange={(v) => onChange((s) => (s.type === slide.type ? { ...s, subtitle: v } : s))} textarea />
        </>
      )
    case "agenda":
      return (
        <>
          <Field label={t("fieldTitle")} value={slide.title} onChange={(v) => onChange((s) => (s.type === "agenda" ? { ...s, title: v } : s))} />
          <ListField label={t("fieldItems")} items={slide.items} onChange={(v) => onChange((s) => (s.type === "agenda" ? { ...s, items: v } : s))} t={t} />
        </>
      )
    case "content":
    case "conclusion":
      return (
        <>
          <Field label={t("fieldTitle")} value={slide.title} onChange={(v) => onChange((s) => (s.type === slide.type ? { ...s, title: v } : s))} />
          <ListField label={t("fieldBullets")} items={slide.bullets} onChange={(v) => onChange((s) => (s.type === slide.type ? { ...s, bullets: v } : s))} t={t} />
        </>
      )
    case "twoColumn":
      return (
        <>
          <Field label={t("fieldTitle")} value={slide.title} onChange={(v) => onChange((s) => (s.type === "twoColumn" ? { ...s, title: v } : s))} />
          <Field label={t("fieldLeftTitle")} value={slide.leftTitle} onChange={(v) => onChange((s) => (s.type === "twoColumn" ? { ...s, leftTitle: v } : s))} />
          <ListField label={t("fieldLeft")} items={slide.left} onChange={(v) => onChange((s) => (s.type === "twoColumn" ? { ...s, left: v } : s))} t={t} />
          <Field label={t("fieldRightTitle")} value={slide.rightTitle} onChange={(v) => onChange((s) => (s.type === "twoColumn" ? { ...s, rightTitle: v } : s))} />
          <ListField label={t("fieldRight")} items={slide.right} onChange={(v) => onChange((s) => (s.type === "twoColumn" ? { ...s, right: v } : s))} t={t} />
        </>
      )
    case "stat":
      return (
        <>
          <Field label={t("fieldStat")} value={slide.stat} onChange={(v) => onChange((s) => (s.type === "stat" ? { ...s, stat: v } : s))} />
          <Field label={t("fieldTitle")} value={slide.title} onChange={(v) => onChange((s) => (s.type === "stat" ? { ...s, title: v } : s))} />
          <Field label={t("fieldCaption")} value={slide.caption ?? ""} onChange={(v) => onChange((s) => (s.type === "stat" ? { ...s, caption: v } : s))} textarea />
        </>
      )
    case "quote":
      return (
        <>
          <Field label={t("fieldQuote")} value={slide.quote} onChange={(v) => onChange((s) => (s.type === "quote" ? { ...s, quote: v } : s))} textarea />
          <Field label={t("fieldAuthor")} value={slide.author ?? ""} onChange={(v) => onChange((s) => (s.type === "quote" ? { ...s, author: v } : s))} />
        </>
      )
  }
}
