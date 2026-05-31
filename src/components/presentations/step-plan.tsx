"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Trash2,
  PlusCircle,
  Sparkles,
} from "lucide-react"
import type { SlideItem } from "./presentation-types"

interface StepPlanProps {
  slides: SlideItem[]
  onUpdate: (slides: SlideItem[]) => void
  onNext: () => void
  onBack: () => void
}

export function StepPlan({ slides, onUpdate, onNext, onBack }: StepPlanProps) {
  const t = useTranslations("presentations")
  const [localSlides, setLocalSlides] = useState<SlideItem[]>(slides)

  function handleSlideChange(id: string, title: string) {
    const updated = localSlides.map((s) =>
      s.id === id ? { ...s, title } : s
    )
    setLocalSlides(updated)
    onUpdate(updated)
  }

  function handleDelete(id: string) {
    if (localSlides.length <= 1) return
    const updated = localSlides.filter((s) => s.id !== id)
    setLocalSlides(updated)
    onUpdate(updated)
  }

  function handleAdd() {
    const newSlide: SlideItem = {
      id: crypto.randomUUID(),
      title: "",
    }
    const updated = [...localSlides, newSlide]
    setLocalSlides(updated)
    onUpdate(updated)
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = [...localSlides]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setLocalSlides(updated)
    onUpdate(updated)
  }

  const progressPercent = 50

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        {/* Progress header */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-wider">
                {t("stepPlan")}
              </span>
              <h2 className="text-2xl font-extrabold text-foreground">{t("planTitle")}</h2>
            </div>
            <span className="text-muted-foreground text-sm font-medium">
              {t("planCompleted", { percent: progressPercent })}
            </span>
          </div>
          <div className="w-full bg-muted dark:bg-muted/50 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            {t("planDescription")}
          </p>
        </div>

        {/* Slide list */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground px-1">
            {t("slideStructure")}
          </h3>

          {localSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl group transition-all",
                "bg-muted/50 dark:bg-muted/30",
                "border border-border dark:border-border",
                "hover:border-primary/50"
              )}
            >
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                className="cursor-grab p-2 text-muted-foreground hover:text-foreground"
                title="D\u00E9placer"
              >
                <GripVertical className="size-5" />
              </button>
              <input
                type="text"
                value={slide.title}
                onChange={(e) => handleSlideChange(slide.id, e.target.value)}
                placeholder={t("slidePlaceholder")}
                className={cn(
                  "flex-1 bg-transparent border-none text-foreground text-base font-medium py-2",
                  "outline-none focus:ring-0",
                  "placeholder:text-muted-foreground"
                )}
              />
              <button
                type="button"
                onClick={() => handleDelete(slide.id)}
                className={cn(
                  "p-2 text-muted-foreground hover:text-destructive transition-colors",
                  "opacity-0 group-hover:opacity-100"
                )}
                title="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}

          {/* Add button */}
          <button
            type="button"
            onClick={handleAdd}
            className={cn(
              "w-full mt-4 flex items-center justify-center gap-2 py-4",
              "border-2 border-dashed border-border dark:border-border rounded-xl",
              "text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5",
              "transition-all"
            )}
          >
            <PlusCircle className="size-5" />
            <span className="font-semibold">{t("addSlide")}</span>
          </button>
        </div>

        {/* Suggestion card */}
        <div
          className={cn(
            "mt-12 p-6 rounded-xl flex gap-4 items-start",
            "bg-primary/10 border border-primary/20"
          )}
        >
          <Sparkles className="size-7 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-primary font-bold">{t("ramiTip")}</h4>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
              {t("ramiTipText")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <footer
        className={cn(
          "border-t px-8 py-6",
          "border-border",
          "bg-background/50 dark:bg-background/50 backdrop-blur-md"
        )}
      >
        <div className="max-w-3xl mx-auto w-full flex justify-between items-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-muted-foreground hover:bg-muted transition-all font-semibold"
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={localSlides.length === 0}
            className={cn(
              "flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "shadow-lg shadow-primary/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {t("next")}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  )
}
