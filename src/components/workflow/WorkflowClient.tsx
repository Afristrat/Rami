"use client"

import { useState } from "react"
import type { WorkflowState, Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, Step6Data } from "@/lib/schemas/workflow.schema"
import { WorkflowStepper } from "./WorkflowStepper"
import { Step1Brief } from "./Step1Brief"
import { Step2Platforms } from "./Step2Platforms"
import { Step3TextGen } from "./Step3TextGen"
import { Step4VisualGen } from "./Step4VisualGen"
import { Step5Review } from "./Step5Review"
import { Step6Approval } from "./Step6Approval"
import { Step7Schedule } from "./Step7Schedule"
import { Zap, BookOpen, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type WorkflowMode = 'guided' | 'expert'

const STEP_TITLES = {
  1: { title: "Brief & contexte", desc: "Définissez votre message et l'objectif psychologique" },
  2: { title: "Plateformes & format", desc: "Choisissez vos canaux de diffusion" },
  3: { title: "Génération des textes", desc: "Claude Haiku génère vos captions adaptées" },
  4: { title: "Génération des visuels", desc: "Fal.ai crée vos visuels basés sur votre Brand DNA" },
  5: { title: "Review & sélection", desc: "Affinez le contenu final" },
  6: { title: "Approbation", desc: "Validez le contenu avant planification" },
  7: { title: "Planification", desc: "Définissez quand et comment publier" },
} as const

// Données requises par étape pour afficher un avertissement en mode Expert
const STEP_REQUIREMENTS: Record<number, { steps: number[]; label: string }> = {
  3: { steps: [1, 2], label: "Brief et plateformes requis" },
  4: { steps: [1, 2], label: "Brief et plateformes requis" },
  5: { steps: [1, 2, 3, 4], label: "Brief, plateformes, textes et visuels requis" },
  6: { steps: [1, 2, 5], label: "Brief, plateformes et review requis" },
  7: { steps: [1, 2, 5], label: "Brief, plateformes et review requis" },
}

export function WorkflowClient() {
  const [mode, setMode] = useState<WorkflowMode>('guided')
  const [state, setState] = useState<WorkflowState>({
    currentStep: 1,
    step1: null,
    step2: null,
    step3: null,
    step4: null,
    step5: null,
    step6: null,
    step7: null,
  })

  function goTo(step: WorkflowState["currentStep"]) {
    setState((prev) => ({ ...prev, currentStep: step }))
  }

  function handleStep1(data: Step1Data) {
    setState((prev) => ({ ...prev, step1: data, currentStep: 2 }))
  }

  function handleStep2(data: Step2Data) {
    setState((prev) => ({ ...prev, step2: data, currentStep: 3 }))
  }

  function handleStep3(data: Step3Data) {
    setState((prev) => ({ ...prev, step3: data, currentStep: 4 }))
  }

  function handleStep4(data: Step4Data) {
    setState((prev) => ({ ...prev, step4: data, currentStep: 5 }))
  }

  function handleStep5(data: Step5Data) {
    setState((prev) => ({ ...prev, step5: data, currentStep: 6 }))
  }

  function handleStep6(data: Step6Data) {
    setState((prev) => ({ ...prev, step6: data, currentStep: 7 }))
  }

  // Vérifie si les données requises pour l'étape courante sont manquantes (mode Expert)
  function getMissingDataWarning(): string | null {
    if (mode !== 'expert') return null
    const req = STEP_REQUIREMENTS[state.currentStep]
    if (!req) return null
    const stepDataMap: Record<number, unknown> = {
      1: state.step1, 2: state.step2, 3: state.step3,
      4: state.step4, 5: state.step5, 6: state.step6,
    }
    const missing = req.steps.filter((s) => !stepDataMap[s])
    if (missing.length === 0) return null
    return `${req.label} — complétez d'abord ${missing.length === 1 ? "l'étape" : "les étapes"} ${missing.join(', ')}`
  }

  const currentTitle = STEP_TITLES[state.currentStep]
  const missingWarning = getMissingDataWarning()

  // En mode Expert, on affiche l'étape même si les données amont manquent
  const canRenderStep3 = mode === 'expert' || (!!state.step1 && !!state.step2)
  const canRenderStep45 = mode === 'expert' || (!!state.step1 && !!state.step2)
  const canRenderStep567 = mode === 'expert' || (!!state.step1 && !!state.step2 && !!state.step5)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* En-tête + toggle mode */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Créer du contenu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Workflow 7 étapes — contenu psychologiquement ciblé
          </p>
        </div>

        {/* Toggle Guidé / Expert */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border shrink-0">
          <button
            type="button"
            onClick={() => setMode('guided')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              mode === 'guided'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="size-3.5" />
            Guidé
          </button>
          <button
            type="button"
            onClick={() => setMode('expert')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              mode === 'expert'
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="size-3.5" />
            Expert
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <WorkflowStepper
          currentStep={state.currentStep}
          mode={mode}
          onStepClick={(step) => goTo(step as WorkflowState["currentStep"])}
        />
      </div>

      {/* Avertissement données manquantes (mode Expert) */}
      {missingWarning && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-3.5 shrink-0" />
          {missingWarning}
        </div>
      )}

      {/* Carte étape courante */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header étape */}
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
              {state.currentStep}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{currentTitle.title}</h2>
              <p className="text-xs text-muted-foreground">{currentTitle.desc}</p>
            </div>
            {mode === 'expert' && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded-full">
                <Zap className="size-2.5" />
                Mode expert
              </span>
            )}
          </div>
        </div>

        {/* Contenu étape */}
        <div className="p-6">
          {state.currentStep === 1 && (
            <Step1Brief
              defaultValues={state.step1}
              onNext={handleStep1}
            />
          )}

          {state.currentStep === 2 && (
            <Step2Platforms
              defaultValues={state.step2}
              onBack={() => goTo(1)}
              onNext={handleStep2}
            />
          )}

          {state.currentStep === 3 && canRenderStep3 && state.step1 && state.step2 && (
            <Step3TextGen
              step1={state.step1}
              step2={state.step2}
              defaultValues={state.step3}
              onBack={() => goTo(2)}
              onNext={handleStep3}
            />
          )}

          {state.currentStep === 4 && canRenderStep45 && state.step1 && state.step2 && (
            <Step4VisualGen
              step1={state.step1}
              step2={state.step2}
              defaultValues={state.step4}
              onBack={() => goTo(3)}
              onNext={handleStep4}
            />
          )}

          {state.currentStep === 5 && canRenderStep45 && state.step1 && state.step2 && state.step3 && state.step4 && (
            <Step5Review
              step1={state.step1}
              step2={state.step2}
              step3={state.step3}
              step4={state.step4}
              defaultValues={state.step5}
              onBack={() => goTo(4)}
              onNext={handleStep5}
            />
          )}

          {state.currentStep === 6 && canRenderStep567 && state.step1 && state.step2 && state.step5 && (
            <Step6Approval
              step1={state.step1}
              step2={state.step2}
              step5={state.step5}
              onBack={() => goTo(5)}
              onNext={handleStep6}
            />
          )}

          {state.currentStep === 7 && canRenderStep567 && state.step1 && state.step2 && state.step5 && (
            <Step7Schedule
              step1={state.step1}
              step2={state.step2}
              step5={state.step5}
              defaultValues={state.step7}
              onBack={() => goTo(6)}
            />
          )}
        </div>
      </div>

      {/* Aide contextuelle */}
      {mode === 'guided' && state.currentStep <= 2 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          💡 Astuce : Plus votre brief est précis, plus les textes générés seront pertinents.
        </p>
      )}
    </div>
  )
}
