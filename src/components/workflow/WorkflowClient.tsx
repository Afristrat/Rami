"use client"

import { useState } from "react"
import type { WorkflowState, Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, Step6Data } from "@/lib/schemas/workflow.schema"
import { WorkflowStepper } from "./WorkflowStepper"
import { WorkflowSidebar } from "./WorkflowSidebar"
import { Step1Brief } from "./Step1Brief"
import { Step2Platforms } from "./Step2Platforms"
import { Step3TextGen } from "./Step3TextGen"
import { Step4VisualGen } from "./Step4VisualGen"
import { Step5Review } from "./Step5Review"
import { Step6Approval } from "./Step6Approval"
import { Step7Schedule } from "./Step7Schedule"
import {
  AlertCircle, Shield, ChevronDown,
  FileText, Share2, Type, Image, Eye, CheckCircle2, CalendarClock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useExpertMode } from "@/lib/hooks/use-expert-mode"
import { ExpertModeToggle } from "@/components/ui/expert-mode-toggle"

const STEP_KEYS = {
  1: "step1",
  2: "step2",
  3: "step3",
  4: "step4",
  5: "step5",
  6: "step6",
  7: "step7",
} as const

const STEP_REQUIREMENT_KEYS: Record<number, { steps: number[]; labelKey: string }> = {
  3: { steps: [1, 2], labelKey: "requirements.briefAndPlatforms" },
  4: { steps: [1, 2], labelKey: "requirements.briefAndPlatforms" },
  5: { steps: [1, 2, 3, 4], labelKey: "requirements.briefPlatformsTextsVisuals" },
  6: { steps: [1, 2, 5], labelKey: "requirements.briefPlatformsReview" },
  7: { steps: [1, 2, 5], labelKey: "requirements.briefPlatformsReview" },
}

const EXPERT_STEP_ICONS: LucideIcon[] = [
  FileText,       // Step 1 — Brief
  Share2,         // Step 2 — Plateformes
  Type,           // Step 3 — Textes
  Image,          // Step 4 — Visuels
  Eye,            // Step 5 — Revue
  CheckCircle2,   // Step 6 — Approbation
  CalendarClock,  // Step 7 — Planification
]

/* ─── Accordion section (expert mode) ─── */

function WorkflowAccordionSection({
  icon: Icon,
  label,
  children,
  defaultOpen = false,
  completed = false,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
  completed?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn(
      "rounded-xl border transition-all",
      open ? "border-primary/20 bg-card" : "border-border bg-card/50"
    )}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
      >
        <div className={cn(
          "flex size-8 items-center justify-center rounded-lg transition-colors",
          completed
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : open
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
        )}>
          {completed ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
        </div>
        <span className={cn(
          "text-sm font-semibold flex-1",
          open ? "text-foreground" : "text-foreground/70"
        )}>
          {label}
        </span>
        <ChevronDown className={cn(
          "size-4 text-muted-foreground transition-transform",
          open && "rotate-180"
        )} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0">
          {children}
        </div>
      )}
    </div>
  )
}

export function WorkflowClient() {
  const t = useTranslations("workflow")
  const { isExpert } = useExpertMode()
  // Keep local mode state in sync with global expert mode for the stepper
  const mode = isExpert ? 'expert' as const : 'guided' as const
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
    setState((prev) => ({
      ...prev,
      step1: data,
      ...(isExpert ? {} : { currentStep: 2 as const }),
    }))
  }

  function handleStep2(data: Step2Data) {
    setState((prev) => ({
      ...prev,
      step2: data,
      ...(isExpert ? {} : { currentStep: 3 as const }),
    }))
  }

  function handleStep3(data: Step3Data) {
    setState((prev) => ({
      ...prev,
      step3: data,
      ...(isExpert ? {} : { currentStep: 4 as const }),
    }))
  }

  function handleStep4(data: Step4Data) {
    setState((prev) => ({
      ...prev,
      step4: data,
      ...(isExpert ? {} : { currentStep: 5 as const }),
    }))
  }

  function handleStep5(data: Step5Data) {
    setState((prev) => ({
      ...prev,
      step5: data,
      ...(isExpert ? {} : { currentStep: 6 as const }),
    }))
  }

  function handleStep6(data: Step6Data) {
    setState((prev) => ({
      ...prev,
      step6: data,
      ...(isExpert ? {} : { currentStep: 7 as const }),
    }))
  }

  // Verifie si les donnees requises pour l'etape courante sont manquantes (mode Expert)
  function getMissingDataWarning(): string | null {
    if (mode !== 'expert') return null
    const req = STEP_REQUIREMENT_KEYS[state.currentStep]
    if (!req) return null
    const stepDataMap: Record<number, unknown> = {
      1: state.step1, 2: state.step2, 3: state.step3,
      4: state.step4, 5: state.step5, 6: state.step6,
    }
    const missing = req.steps.filter((s) => !stepDataMap[s])
    if (missing.length === 0) return null
    return `${t(req.labelKey as Parameters<typeof t>[0])} -- ${t("requirements.completeFirst")} ${missing.join(', ')}`
  }

  const stepKey = STEP_KEYS[state.currentStep as keyof typeof STEP_KEYS]
  const currentTitle = {
    title: t(`${stepKey}.title` as Parameters<typeof t>[0]),
    desc: t(`${stepKey}.desc` as Parameters<typeof t>[0]),
  }
  const missingWarning = getMissingDataWarning()

  // En mode Expert, on affiche l'etape meme si les donnees amont manquent
  const canRenderStep3 = mode === 'expert' || (!!state.step1 && !!state.step2)
  const canRenderStep45 = mode === 'expert' || (!!state.step1 && !!state.step2)
  const canRenderStep567 = mode === 'expert' || (!!state.step1 && !!state.step2 && !!state.step5)

  /* ── Expert mode: all steps as accordions ── */
  if (isExpert) {
    const accordionLabels = [
      t("expertAccordion.step1" as Parameters<typeof t>[0]),
      t("expertAccordion.step2" as Parameters<typeof t>[0]),
      t("expertAccordion.step3" as Parameters<typeof t>[0]),
      t("expertAccordion.step4" as Parameters<typeof t>[0]),
      t("expertAccordion.step5" as Parameters<typeof t>[0]),
      t("expertAccordion.step6" as Parameters<typeof t>[0]),
      t("expertAccordion.step7" as Parameters<typeof t>[0]),
    ]

    return (
      <div className="w-full px-4 sm:px-8 py-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">
              {t("expertTitle" as Parameters<typeof t>[0])}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t("expertDesc" as Parameters<typeof t>[0])}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Brand DNA badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
              <Shield className="size-3.5 text-violet-500" />
              <span className="text-xs font-medium text-violet-500 uppercase tracking-tight">
                {state.step1?.objectif ? `${state.step1.titre?.slice(0, 20) ?? "Marque"} -- ${state.step1.objectif}` : "Brand DNA"}
              </span>
            </div>

            <ExpertModeToggle />
          </div>
        </div>

        {/* Main content grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Workflow Area — accordion sections */}
          <div className="lg:col-span-8 space-y-3">
            {/* Step 1 — Brief */}
            <WorkflowAccordionSection
              icon={EXPERT_STEP_ICONS[0]}
              label={accordionLabels[0]}
              defaultOpen
              completed={!!state.step1}
            >
              <Step1Brief
                defaultValues={state.step1}
                onNext={handleStep1}
              />
            </WorkflowAccordionSection>

            {/* Step 2 — Plateformes */}
            <WorkflowAccordionSection
              icon={EXPERT_STEP_ICONS[1]}
              label={accordionLabels[1]}
              completed={!!state.step2}
            >
              <Step2Platforms
                defaultValues={state.step2}
                onBack={() => {}}
                onNext={handleStep2}
              />
            </WorkflowAccordionSection>

            {/* Step 3 — Textes */}
            <WorkflowAccordionSection
              icon={EXPERT_STEP_ICONS[2]}
              label={accordionLabels[2]}
              completed={!!state.step3}
            >
              {state.step1 && state.step2 ? (
                <Step3TextGen
                  step1={state.step1}
                  step2={state.step2}
                  defaultValues={state.step3}
                  onBack={() => {}}
                  onNext={handleStep3}
                />
              ) : (
                <MissingDataNotice
                  message={t("requirements.briefAndPlatforms" as Parameters<typeof t>[0])}
                />
              )}
            </WorkflowAccordionSection>

            {/* Step 4 — Visuels */}
            <WorkflowAccordionSection
              icon={EXPERT_STEP_ICONS[3]}
              label={accordionLabels[3]}
              completed={!!state.step4}
            >
              {state.step1 && state.step2 ? (
                <Step4VisualGen
                  step1={state.step1}
                  step2={state.step2}
                  defaultValues={state.step4}
                  onBack={() => {}}
                  onNext={handleStep4}
                />
              ) : (
                <MissingDataNotice
                  message={t("requirements.briefAndPlatforms" as Parameters<typeof t>[0])}
                />
              )}
            </WorkflowAccordionSection>

            {/* Step 5 — Revue */}
            <WorkflowAccordionSection
              icon={EXPERT_STEP_ICONS[4]}
              label={accordionLabels[4]}
              completed={!!state.step5}
            >
              {state.step1 && state.step2 && state.step3 && state.step4 ? (
                <Step5Review
                  step1={state.step1}
                  step2={state.step2}
                  step3={state.step3}
                  step4={state.step4}
                  defaultValues={state.step5}
                  onBack={() => {}}
                  onNext={handleStep5}
                />
              ) : (
                <MissingDataNotice
                  message={t("requirements.briefPlatformsTextsVisuals" as Parameters<typeof t>[0])}
                />
              )}
            </WorkflowAccordionSection>

            {/* Step 6 — Approbation */}
            <WorkflowAccordionSection
              icon={EXPERT_STEP_ICONS[5]}
              label={accordionLabels[5]}
              completed={!!state.step6}
            >
              {state.step1 && state.step2 && state.step5 ? (
                <Step6Approval
                  step1={state.step1}
                  step2={state.step2}
                  step5={state.step5}
                  onBack={() => {}}
                  onNext={handleStep6}
                />
              ) : (
                <MissingDataNotice
                  message={t("requirements.briefPlatformsReview" as Parameters<typeof t>[0])}
                />
              )}
            </WorkflowAccordionSection>

            {/* Step 7 — Planification */}
            <WorkflowAccordionSection
              icon={EXPERT_STEP_ICONS[6]}
              label={accordionLabels[6]}
              completed={!!state.step7}
            >
              {state.step1 && state.step2 && state.step5 ? (
                <Step7Schedule
                  step1={state.step1}
                  step2={state.step2}
                  step5={state.step5}
                  defaultValues={state.step7}
                  onBack={() => {}}
                />
              ) : (
                <MissingDataNotice
                  message={t("requirements.briefPlatformsReview" as Parameters<typeof t>[0])}
                />
              )}
            </WorkflowAccordionSection>
          </div>

          {/* Side Panels */}
          <div className="lg:col-span-4">
            <WorkflowSidebar />
          </div>
        </div>
      </div>
    )
  }

  /* ── Guided mode: sequential wizard (existing behavior) ── */
  return (
    <div className="w-full px-4 sm:px-8 py-6">
      {/* Stepper */}
      <div className="mb-10">
        <WorkflowStepper
          currentStep={state.currentStep}
          mode={mode}
          onStepClick={(step) => goTo(step as WorkflowState["currentStep"])}
        />
      </div>

      {/* Page Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-[#F8FAFC]">
            {currentTitle.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {currentTitle.desc}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand DNA badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
            <Shield className="size-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-500 uppercase tracking-tight">
              {state.step1?.objectif ? `${state.step1.titre?.slice(0, 20) ?? "Marque"} -- ${state.step1.objectif}` : "Brand DNA"}
            </span>
          </div>

          <ExpertModeToggle />
        </div>
      </div>

      {/* Avertissement donnees manquantes (mode Expert) */}
      {missingWarning && (
        <div className="max-w-6xl mx-auto mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-3.5 shrink-0" />
          {missingWarning}
        </div>
      )}

      {/* Main content grid: 8 cols workflow + 4 cols sidebar */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Workflow Area */}
        <div className="lg:col-span-8">
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/[0.05] rounded-2xl p-8 shadow-xl dark:shadow-none backdrop-blur-sm">
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

        {/* Side Panels */}
        <div className="lg:col-span-4">
          <WorkflowSidebar />
        </div>
      </div>

      {/* Aide contextuelle */}
      {state.currentStep <= 2 && (
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
          {t("briefTip")}
        </p>
      )}
    </div>
  )
}

/* ─── Missing data notice for expert accordion sections ─── */

function MissingDataNotice({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </div>
  )
}
