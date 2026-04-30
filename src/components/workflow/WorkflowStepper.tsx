"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { WORKFLOW_STEPS } from "@/lib/schemas/workflow.schema"
import { useTranslations } from "next-intl"

interface WorkflowStepperProps {
  currentStep: number
  mode: 'guided' | 'expert'
  onStepClick?: (step: number) => void
}

export function WorkflowStepper({ currentStep, mode, onStepClick }: WorkflowStepperProps) {
  const t = useTranslations("workflow")
  const progress = (currentStep / WORKFLOW_STEPS.length) * 100

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Progress label + bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">
          {t("stepOf", { current: currentStep, total: WORKFLOW_STEPS.length })}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {t("percentComplete", { percent: Math.round(progress) })}
        </span>
      </div>

      {/* Gradient progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators with connectors */}
      <div className="flex items-start mt-6">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number
          const isUpcoming = currentStep < step.number
          const isLast = index === WORKFLOW_STEPS.length - 1

          // Clickable if completed (both modes) or any step in expert mode
          const isClickable =
            (isCompleted && !isCurrent) ||
            (mode === 'expert' && !isCurrent)

          return (
            <div key={step.number} className="flex items-start flex-1 last:flex-none">
              {/* Step circle + label */}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.number)}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all group relative",
                  isClickable && "cursor-pointer",
                  !isClickable && "cursor-default"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.label} - ${t("stepOf", { current: step.number, total: WORKFLOW_STEPS.length })}`}
              >
                {/* Circle */}
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shrink-0",
                    isCompleted &&
                      "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25",
                    isCompleted && isClickable &&
                      "group-hover:bg-emerald-600 group-hover:scale-110",
                    isCurrent &&
                      "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-4 ring-violet-600/20",
                    isUpcoming &&
                      "border-2 border-slate-300 dark:border-slate-600 bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight text-center transition-colors hidden sm:block",
                    isCurrent && "text-primary font-semibold",
                    isCompleted && "text-foreground",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 flex items-center pt-4 px-1.5">
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full transition-all duration-500",
                      isCompleted
                        ? "bg-emerald-500"
                        : isCurrent
                          ? "bg-gradient-to-r from-violet-600/60 to-slate-300 dark:to-slate-600"
                          : "bg-slate-300 dark:bg-slate-700 border-dashed"
                    )}
                    style={
                      !isCompleted && !isCurrent
                        ? { backgroundImage: "repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 8px)", backgroundColor: "transparent", color: "rgb(148 163 184)" }
                        : undefined
                    }
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
