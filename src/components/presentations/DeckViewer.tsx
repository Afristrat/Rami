"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Download, ChevronLeft, ChevronRight, ArrowLeft, Presentation } from "lucide-react"
import { cn } from "@/lib/utils"
import { SlideRenderer } from "./SlideRenderer"
import type { PresentationContent } from "@/lib/schemas/presentation.schema"

interface DeckViewerProps {
  id: string
  title: string
  content: PresentationContent
}

function slideLabel(slide: PresentationContent["deck"]["slides"][number]): string {
  if (slide.type === "quote") return slide.quote.slice(0, 40)
  // Toutes les autres variantes possèdent un `title`.
  return slide.title
}

export function DeckViewer({ id, title, content }: DeckViewerProps) {
  const t = useTranslations("presentations")
  const slides = content.deck.slides
  const accent = content.theme.accentColor
  const [current, setCurrent] = useState(0)
  const total = slides.length

  function go(delta: number) {
    setCurrent((c) => Math.max(0, Math.min(total - 1, c + delta)))
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Barre d'action */}
      <div className="flex items-center justify-between border-b border-border bg-background/50 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/presentations" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <h2 className="truncate text-base font-bold text-foreground">{title}</h2>
        </div>
        <a
          href={`/presentations/${id}/pptx`}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
            "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/20 hover:opacity-90"
          )}
        >
          <Download className="size-4" />
          {t("downloadPptx")}
        </a>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Vignettes */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/10 md:flex">
          <div className="border-b border-border p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("slidesPreview")}
            </h3>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {slides.map((slide, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className="group w-full text-left"
              >
                <div
                  className={cn(
                    "aspect-video overflow-hidden rounded-lg border transition-all",
                    i === current ? "border-primary ring-2 ring-primary/20" : "border-border opacity-70 group-hover:opacity-100"
                  )}
                >
                  <SlideRenderer slide={slide} index={i} total={total} accentColor={accent} variant="thumb" />
                </div>
                <span className={cn("mt-1 block text-[10px]", i === current ? "font-bold text-primary" : "text-muted-foreground")}>
                  {String(i + 1).padStart(2, "0")} {slideLabel(slide)}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Aperçu principal */}
        <section className="flex flex-1 flex-col items-center justify-center gap-6 p-6 lg:p-10 min-h-0">
          <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-2xl border border-border shadow-2xl">
            <SlideRenderer slide={slides[current]} index={current} total={total} accentColor={accent} variant="full" />
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={current === 0}
              className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-30"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-sm font-bold text-foreground">{current + 1} / {total}</span>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={current >= total - 1}
              className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </section>
      </div>

      {/* Pied */}
      <footer className="flex h-12 items-center gap-2 border-t border-border px-6 text-sm text-muted-foreground">
        <Presentation className="size-4" />
        <span>{t("slidesCount", { count: total })}</span>
      </footer>
    </div>
  )
}
