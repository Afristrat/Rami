"use client"

import { useState } from "react"
import {
  CreditCard,
  Check,
  Zap,
  Users,
  Building2,
  Rocket,
  Star,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Plan = "free" | "solo" | "pro" | "agency" | "agency_plus"

interface PlanConfig {
  id: Plan
  name: string
  price: number
  period: string
  icon: React.ReactNode
  description: string
  tenants: string
  generations: string
  features: string[]
  badge?: string
  highlighted?: boolean
}

const PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    period: "mois",
    icon: <Star className="size-5" />,
    description: "Pour découvrir RAMI",
    tenants: "1 marque",
    generations: "10 gén./mois",
    features: [
      "1 marque client",
      "10 générations/mois",
      "Filigrane sur les visuels",
      "Brand DNA basique",
    ],
  },
  {
    id: "solo",
    name: "Solo",
    price: 59,
    period: "mois",
    icon: <Zap className="size-5" />,
    description: "Pour les consultants indépendants",
    tenants: "3 marques",
    generations: "150 gén./mois",
    features: [
      "3 marques clientes",
      "150 générations/mois",
      "Sans filigrane",
      "Export ZIP structuré",
      "Brand DNA complet",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    period: "mois",
    icon: <Rocket className="size-5" />,
    description: "Pour les équipes créatives",
    tenants: "10 marques",
    generations: "500 gén./mois",
    badge: "Recommandé",
    highlighted: true,
    features: [
      "10 marques clientes",
      "500 générations/mois",
      "Transcriptions audio",
      "Rapports performance",
      "Analytics avancés",
      "Performance Loop IA",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 399,
    period: "mois",
    icon: <Users className="size-5" />,
    description: "Pour les agences digitales",
    tenants: "Illimité",
    generations: "2 000 gén./mois",
    features: [
      "Marques illimitées",
      "2 000 générations/mois",
      "Document Engine",
      "Module facturation",
      "Génération de leads",
      "Portail client",
    ],
  },
  {
    id: "agency_plus",
    name: "Agency+",
    price: 699,
    period: "mois",
    icon: <Building2 className="size-5" />,
    description: "Pour les grandes agences",
    tenants: "Illimité",
    generations: "Illimité",
    features: [
      "Tout Agency +",
      "White-label complet",
      "API publique",
      "SLA garanti",
      "Onboarding dédié",
      "Support prioritaire",
    ],
  },
]

interface StepPlanProps {
  defaultPlan?: Plan
  onSubmit: (plan: Plan) => void
  onBack: () => void
  isSubmitting?: boolean
}

export function StepPlan({
  defaultPlan = "free",
  onSubmit,
  onBack,
  isSubmitting,
}: StepPlanProps) {
  const [selected, setSelected] = useState<Plan>(defaultPlan)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <CreditCard className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Choisissez votre plan
          </h2>
          <p className="text-sm text-muted-foreground">
            Changeable à tout moment — commencez gratuitement si vous hésitez
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelected(plan.id)}
            className={cn(
              "relative flex flex-col gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected === plan.id
                ? plan.highlighted
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-primary bg-primary/5"
                : plan.highlighted
                  ? "border-primary/30 bg-primary/[0.02] hover:border-primary/60"
                  : "border-border bg-card hover:border-muted-foreground/40"
            )}
          >
            {/* Badge */}
            {plan.badge && (
              <Badge
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap"
                variant="default"
              >
                {plan.badge}
              </Badge>
            )}

            {/* Header */}
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  selected === plan.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {plan.icon}
              </div>

              {/* Checkmark */}
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border-2 transition-all",
                  selected === plan.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}
              >
                {selected === plan.id && (
                  <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                )}
              </div>
            </div>

            {/* Nom & Prix */}
            <div>
              <p className="font-semibold text-foreground">{plan.name}</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {plan.price === 0 ? "Gratuit" : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-xs text-muted-foreground">/{plan.period}</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
            </div>

            {/* Quota rapide */}
            <div className="flex gap-2 text-xs">
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                {plan.tenants}
              </span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                {plan.generations}
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-1.5">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-primary"
                    strokeWidth={2.5}
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Note Free */}
      {selected === "free" && (
        <p className="text-xs text-muted-foreground text-center">
          Le plan gratuit inclut un filigrane RAMI sur les visuels. Vous pourrez
          upgrader à tout moment depuis votre tableau de bord.
        </p>
      )}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          ← Retour
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => onSubmit(selected)}
          disabled={isSubmitting}
          className="min-w-[180px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Création en cours…
            </>
          ) : (
            "Créer mon espace →"
          )}
        </Button>
      </div>
    </div>
  )
}
