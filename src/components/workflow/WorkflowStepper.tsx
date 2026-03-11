"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { WORKFLOW_STEPS } from "@/lib/schemas/workflow.schema"

interface WorkflowStepperProps {
  currentStep: number
}

export function WorkflowStepper({ currentStep }: WorkflowStepperProps) {
  const progress = ((currentStep - 1) / (WORKFLOW_STEPS.length - 1)) * 100

  return (
    <div className="w-full space-y-4">
      {/* Barre de progression */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>Étape {currentStep} sur {WORKFLOW_STEPS.length}</span>
        <span>{Math.round(progress)}% complété</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps indicators */}
      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number
          const isUpcoming = currentStep < step.number

          return (
            <div key={step.number} className="flex flex-1 items-center">
              {/* Connecteur */}
              {idx > 0 && (
                <div
                  className={cn(
                    "h-px flex-1 transition-colors duration-300",
                    isCompleted || isCurrent ? "bg-violet-500/50" : "bg-border"
                  )}
                />
              )}

              {/* Cercle + label */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                    isCompleted && "border-violet-500 bg-violet-500 text-white",
                    isCurrent && "border-violet-500 bg-background text-violet-500 shadow-[0_0_0_4px] shadow-violet-500/20",
                    isUpcoming && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "hidden sm:block text-[10px] font-medium transition-colors",
                    isCurrent && "text-violet-500",
                    isCompleted && "text-muted-foreground",
                    isUpcoming && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
