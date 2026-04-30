"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { ArrowRight, FileText, Users, Layers, Languages } from "lucide-react"
import { PresentationStepper } from "./presentation-stepper"
import type { PresentationBrief } from "./presentation-types"

interface StepBriefProps {
  brief: PresentationBrief
  onUpdate: (brief: PresentationBrief) => void
  onNext: () => void
}

export function StepBrief({ brief, onUpdate, onNext }: StepBriefProps) {
  const t = useTranslations("presentations")
  const [localBrief, setLocalBrief] = useState<PresentationBrief>(brief)

  function handleChange(field: keyof PresentationBrief, value: string | number) {
    const updated = { ...localBrief, [field]: value }
    setLocalBrief(updated)
    onUpdate(updated)
  }

  const canContinue = localBrief.subject.trim().length >= 3

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Stepper */}
        <div className="mb-10">
          <PresentationStepper currentStep={1} />
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("briefInit")}
            </h1>
            <p className="text-muted-foreground dark:text-primary/60">
              {t("briefStep")}
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Subject Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                {t("subjectLabel")}
              </label>
              <input
                type="text"
                value={localBrief.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                className={cn(
                  "w-full rounded-lg border p-4 text-foreground outline-none transition-all",
                  "border-border dark:border-primary/20",
                  "bg-background/50 dark:bg-background/50",
                  "focus:border-primary focus:ring-1 focus:ring-primary",
                  "placeholder:text-muted-foreground"
                )}
                placeholder="Ex: L'impact de l'IA sur la neuropsychologie cognitive"
              />
            </div>

            {/* Audience Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                <Users className="size-4 text-primary" />
                {t("audienceLabel")}
              </label>
              <input
                type="text"
                value={localBrief.audience}
                onChange={(e) => handleChange("audience", e.target.value)}
                className={cn(
                  "w-full rounded-lg border p-4 text-foreground outline-none transition-all",
                  "border-border dark:border-primary/20",
                  "bg-background/50 dark:bg-background/50",
                  "focus:border-primary focus:ring-1 focus:ring-primary",
                  "placeholder:text-muted-foreground"
                )}
                placeholder="Ex: Professionnels de sant\u00E9, \u00C9tudiants..."
              />
            </div>

            {/* Language and Slides Count Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Slides Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    {t("slidesLabel")}
                  </label>
                  <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded">
                    {t("slidesCount", { count: localBrief.slideCount })}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={20}
                  value={localBrief.slideCount}
                  onChange={(e) =>
                    handleChange("slideCount", parseInt(e.target.value, 10))
                  }
                  className="w-full h-2 bg-muted dark:bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>5 slides</span>
                  <span>20 slides</span>
                </div>
              </div>

              {/* Language Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                  <Languages className="size-4 text-primary" />
                  {t("languageLabel")}
                </label>
                <div className="relative">
                  <select
                    value={localBrief.language}
                    onChange={(e) =>
                      handleChange(
                        "language",
                        e.target.value as "fr" | "ar" | "en"
                      )
                    }
                    className={cn(
                      "w-full rounded-lg border p-4 appearance-none text-foreground outline-none transition-all",
                      "border-border dark:border-primary/20",
                      "bg-background/50 dark:bg-background/50",
                      "focus:border-primary focus:ring-1 focus:ring-primary"
                    )}
                  >
                    <option value="fr">Fran{"\u00E7"}ais (FR)</option>
                    <option value="ar">{"\u0627\u0644\u0639\u0631\u0628\u064A\u0629"} (AR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Footer Action */}
          <div className="mt-12 flex justify-end">
            <button
              onClick={onNext}
              disabled={!canContinue}
              className={cn(
                "flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all transform",
                "bg-gradient-to-r from-primary to-indigo-600 text-white",
                "hover:shadow-[0_0_20px_rgba(124,59,237,0.4)] hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              )}
            >
              {t("continue")}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Decorative dots */}
        <div className="mt-8 flex justify-center opacity-30">
          <div className="flex gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}
