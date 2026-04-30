"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Pencil, LayoutList, Palette, Sparkles, Check } from "lucide-react"

interface PresentationStepperProps {
  currentStep: 1 | 2 | 3 | 4
}

const STEP_KEYS = ["stepperBrief", "stepperStructure", "stepperDesign", "stepperGeneration"] as const

const STEP_ICONS = [Pencil, LayoutList, Palette, Sparkles] as const

export function PresentationStepper({ currentStep }: PresentationStepperProps) {
  const t = useTranslations("presentations")
  return (
    <div className="flex items-center justify-between mb-4">
      {STEP_KEYS.map((stepKey, index) => {
        const stepNumber = (index + 1) as 1 | 2 | 3 | 4
        const isActive = stepNumber === currentStep
        const isCompleted = stepNumber < currentStep
        const Icon = STEP_ICONS[index]

        return (
          <div key={stepKey} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  isActive &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  isCompleted &&
                    "bg-primary text-primary-foreground",
                  !isActive &&
                    !isCompleted &&
                    "bg-muted dark:bg-primary/5 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive && "text-primary font-semibold",
                  isCompleted && "text-primary",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                {t(stepKey)}
              </span>
            </div>
            {index < STEP_KEYS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-4 -mt-6 rounded-full",
                  stepNumber < currentStep
                    ? "bg-primary"
                    : "bg-muted dark:bg-primary/10"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
