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
  className?: string
}

function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progression" className={cn("flex items-center gap-0", className)}>
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep
        const isActive = step.id === currentStep
        const isLast = index === steps.length - 1

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                  isCompleted &&
                    "border-primary bg-primary text-primary-foreground",
                  isActive &&
                    "border-primary bg-background text-primary shadow-sm",
                  !isCompleted &&
                    !isActive &&
                    "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-medium leading-tight",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground/70 hidden sm:block">
                    {step.description}
                  </p>
                )}
              </div>
            </div>

            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1 mt-[-18px] transition-all duration-500",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export { Stepper, type Step }
