"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  id: number
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepId: number) => void
  className?: string
}

function Stepper({ steps, currentStep, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progression" className={cn("flex items-start gap-0", className)}>
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep
        const isActive = step.id === currentStep
        const isLast = index === steps.length - 1
        const isClickable = isCompleted && onStepClick !== undefined

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(step.id)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                  isCompleted &&
                    "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25",
                  isCompleted && isClickable &&
                    "cursor-pointer hover:bg-emerald-600 hover:scale-110",
                  isActive &&
                    "bg-primary text-primary-foreground shadow-md shadow-primary/30 ring-4 ring-primary/20",
                  !isCompleted &&
                    !isActive &&
                    "border-2 border-muted-foreground/30 bg-background text-muted-foreground",
                  !isClickable && !isActive && "cursor-default"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <span>{step.id}</span>
                )}
              </button>
              <div className="text-center max-w-[80px]">
                <p
                  className={cn(
                    "text-xs font-medium leading-tight",
                    isActive && "text-primary font-semibold",
                    isCompleted && "text-foreground",
                    !isCompleted && !isActive && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[10px] text-muted-foreground/70 hidden sm:block mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {!isLast && (
              <div className="flex-1 flex items-center pt-4 px-1.5">
                <div
                  className={cn(
                    "h-0.5 w-full rounded-full transition-all duration-500",
                    isCompleted ? "bg-emerald-500" : "bg-muted-foreground/20"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export { Stepper, type Step }
