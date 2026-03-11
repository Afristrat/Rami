"use client"

import { useState } from "react"
import { Stepper } from "@/components/ui/stepper"
import { StepTenant } from "@/components/onboarding/StepTenant"
import { StepLogo } from "@/components/onboarding/StepLogo"
import { StepPlan } from "@/components/onboarding/StepPlan"
import { createTenantOnboarding } from "@/app/actions/onboarding"

type Plan = "free" | "solo" | "pro" | "agency" | "agency_plus"

interface WizardData {
  name: string
  slug: string
  logoUrl: string | null
  plan: Plan
}

const STEPS = [
  {
    id: 1,
    label: "Votre espace",
    description: "Nom & identifiant",
  },
  {
    id: 2,
    label: "Logo",
    description: "Identité visuelle",
  },
  {
    id: 3,
    label: "Plan",
    description: "Choisissez votre offre",
  },
]

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<Partial<WizardData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleTenantNext = (data: { name: string; slug: string }) => {
    setWizardData((prev) => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  const handleLogoNext = (logoUrl: string | null) => {
    setWizardData((prev) => ({ ...prev, logoUrl }))
    setCurrentStep(3)
  }

  const handlePlanSubmit = async (plan: Plan) => {
    const data = { ...wizardData, plan }

    if (!data.name || !data.slug) {
      setCurrentStep(1)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await createTenantOnboarding({
        name: data.name,
        slug: data.slug,
        plan,
        logoUrl: data.logoUrl ?? null,
      })

      if (!result.success) {
        setSubmitError(result.error ?? "Une erreur est survenue")
        setIsSubmitting(false)
      }
      // Si success → redirect() est appelé côté serveur, le composant est démonté
    } catch {
      setSubmitError("Une erreur inattendue est survenue. Veuillez réessayer.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="mb-10">
        <Stepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Contenu de l'étape */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        {currentStep === 1 && (
          <StepTenant
            defaultValues={
              wizardData.name
                ? { name: wizardData.name, slug: wizardData.slug }
                : undefined
            }
            onNext={handleTenantNext}
          />
        )}

        {currentStep === 2 && (
          <StepLogo
            tenantName={wizardData.name ?? ""}
            defaultLogoUrl={wizardData.logoUrl}
            onNext={handleLogoNext}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <>
            {submitError && (
              <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive">{submitError}</p>
              </div>
            )}
            <StepPlan
              defaultPlan={(wizardData.plan as Plan) ?? "free"}
              onSubmit={handlePlanSubmit}
              onBack={() => setCurrentStep(2)}
              isSubmitting={isSubmitting}
            />
          </>
        )}
      </div>

      {/* Indicateur de progression texte */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Étape {currentStep} sur {STEPS.length}
      </p>
    </div>
  )
}
