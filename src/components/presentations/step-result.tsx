"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Presentation,
  Languages,
  ShieldCheck,
  CloudCog,
} from "lucide-react"

interface StepResultProps {
  totalSlides: number
  onBack: () => void
}

const MOCK_SLIDE_TITLES = [
  "Introduction",
  "Contexte Clinique",
  "Analyse Cognitive",
  "M\u00E9thodologie",
  "Donn\u00E9es Neurocognitives",
  "R\u00E9sultats Primaires",
  "Corr\u00E9lations",
  "\u00C9tude de Cas",
  "Implications Pratiques",
  "Recommandations",
  "Perspectives",
  "Conclusion",
]

export function StepResult({ totalSlides, onBack }: StepResultProps) {
  const t = useTranslations("presentations")
  const [currentSlide, setCurrentSlide] = useState(3)
  const slideCount = Math.min(totalSlides, MOCK_SLIDE_TITLES.length)

  function goToPrev() {
    setCurrentSlide((prev) => (prev > 1 ? prev - 1 : prev))
  }

  function goToNext() {
    setCurrentSlide((prev) => (prev < slideCount ? prev + 1 : prev))
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Action bar */}
      <div
        className={cn(
          "flex items-center justify-between border-b px-8 py-4",
          "border-border",
          "bg-background/50 dark:bg-background/50 backdrop-blur-md"
        )}
      >
        <h2 className="text-lg font-bold text-foreground">
          {t("resultTitle")}
        </h2>
        <div className="flex items-center gap-3">
          <button
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              "bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90",
              "text-white shadow-lg shadow-primary/20"
            )}
          >
            <Download className="size-4" />
            <span>{t("downloadPptx")}</span>
          </button>
          <button
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
              "border border-primary/20 bg-transparent hover:bg-primary/5",
              "text-foreground"
            )}
          >
            <span>{t("editInCanva")}</span>
            <ExternalLink className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar: Vertical Thumbnail Strip */}
        <aside
          className={cn(
            "w-72 border-r flex flex-col",
            "border-border",
            "bg-background dark:bg-muted/10"
          )}
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {t("slidesPreview")}
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {Array.from({ length: slideCount }, (_, i) => {
              const slideNum = i + 1
              const isSelected = slideNum === currentSlide
              return (
                <button
                  key={slideNum}
                  type="button"
                  onClick={() => setCurrentSlide(slideNum)}
                  className="group relative cursor-pointer w-full text-left"
                >
                  <div
                    className={cn(
                      "aspect-video rounded-lg overflow-hidden transition-all",
                      "bg-muted dark:bg-background",
                      isSelected
                        ? "border-2 border-primary ring-4 ring-primary/10 shadow-xl"
                        : "border border-transparent group-hover:border-primary/50 opacity-60"
                    )}
                  >
                    <div
                      className="w-full h-full p-2"
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, #7c3bed, #6366f1)"
                          : "linear-gradient(135deg, #7c3bed20, #6366f120)",
                      }}
                    >
                      <div
                        className={cn(
                          "w-2/3 h-1.5 rounded mb-1",
                          isSelected
                            ? "bg-white/40"
                            : "bg-foreground/20"
                        )}
                      />
                      <div
                        className={cn(
                          "w-1/2 h-1 rounded mb-1",
                          isSelected
                            ? "bg-white/20"
                            : "bg-foreground/10"
                        )}
                      />
                      <div
                        className={cn(
                          "w-3/4 h-1 rounded",
                          isSelected
                            ? "bg-white/20"
                            : "bg-foreground/10"
                        )}
                      />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1 block",
                      isSelected
                        ? "text-primary font-bold"
                        : "text-muted-foreground"
                    )}
                  >
                    {String(slideNum).padStart(2, "0")}{" "}
                    {MOCK_SLIDE_TITLES[i] ?? `Slide ${slideNum}`}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main area: Slide preview */}
        <section className="flex-1 flex flex-col p-8 lg:p-12 items-center justify-center relative min-h-0">
          <div className="w-full max-w-5xl flex flex-col items-center gap-8">
            {/* Slide preview */}
            <div
              className={cn(
                "relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl",
                "border border-white/10 dark:border-white/10",
                "bg-gradient-to-br from-indigo-800 via-primary to-indigo-600",
                "flex items-center justify-center p-8 md:p-16"
              )}
            >
              {/* Glassmorphism elements */}
              <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-primary/20 rounded-full blur-2xl" />

              {/* Slide Content */}
              <div className="relative z-10 w-full h-full flex flex-col justify-center gap-6">
                <div className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 self-start">
                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                    {"\u00C9"}valuation Neuropsychologique
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
                  Processus de Traitement{" "}
                  <br />
                  <span className="text-white/80">des Donn{"\u00E9"}es RAMI</span>
                </h1>
                <div className="grid grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-8">
                  {[
                    {
                      icon: "Collecte",
                      sub: "Agr\u00E9gation de signaux bruts",
                    },
                    {
                      icon: "Analyse",
                      sub: "Mapping neurologique",
                    },
                    {
                      icon: "Inf\u00E9rence",
                      sub: "G\u00E9n\u00E9ration de insights",
                    },
                  ].map((card) => (
                    <div
                      key={card.icon}
                      className="p-4 md:p-6 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20"
                    >
                      <p className="text-white/90 font-semibold text-sm md:text-base">
                        {card.icon}
                      </p>
                      <p className="text-white/60 text-xs md:text-sm mt-1">
                        {card.sub}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nav Controls */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-8">
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={currentSlide <= 1}
                  className="size-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {currentSlide} / {slideCount}
                </h2>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={currentSlide >= slideCount}
                  className="size-10 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {Array.from({ length: slideCount }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i + 1)}
                    className={cn(
                      "rounded-full transition-all",
                      i + 1 === currentSlide
                        ? "size-2 bg-primary"
                        : "size-1.5 bg-primary/20"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Absolute positioned arrows for large screens */}
          <div className="absolute inset-y-0 left-4 hidden xl:flex items-center">
            <button
              type="button"
              onClick={goToPrev}
              disabled={currentSlide <= 1}
              className={cn(
                "size-12 flex items-center justify-center rounded-full",
                "bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10",
                "text-muted-foreground disabled:opacity-20"
              )}
            >
              <ArrowLeft className="size-5" />
            </button>
          </div>
          <div className="absolute inset-y-0 right-4 hidden xl:flex items-center">
            <button
              type="button"
              onClick={goToNext}
              disabled={currentSlide >= slideCount}
              className={cn(
                "size-12 flex items-center justify-center rounded-full",
                "bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10",
                "text-muted-foreground disabled:opacity-20"
              )}
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Status Bar */}
      <footer
        className={cn(
          "h-14 border-t px-8 flex items-center justify-between",
          "border-border",
          "bg-background dark:bg-muted/10"
        )}
      >
        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <Presentation className="size-4" />
            <span>{t("slidesCount", { count: slideCount })}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2">
            <Languages className="size-4" />
            <span>Fran{"\u00E7"}ais</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-border" />
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-4" />
            <span className="font-semibold">Brand DNA</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t("backToStyle")}
          </button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CloudCog className="size-4" />
            <span>{t("autoSaved")}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
