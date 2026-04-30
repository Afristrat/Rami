"use client"

import { useTranslations } from "next-intl"
import { FileText, BarChart3, Presentation, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DocumentType } from "@/lib/schemas/document.schema"
import type { LucideIcon } from "lucide-react"

interface TemplateCardConfig {
  type: DocumentType
  titleKey: string
  descriptionKey: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  hoverBorder: string
  ctaLabelKey: string
  ctaColor: string
}

const TEMPLATE_CARDS: TemplateCardConfig[] = [
  {
    type: "offre_commerciale",
    titleKey: "typeProposal",
    descriptionKey: "proposalDescription",
    icon: FileText,
    iconColor: "text-violet-500 dark:text-violet-400",
    iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
    hoverBorder: "hover:border-violet-300/40 dark:hover:border-violet-500/50",
    ctaLabelKey: "ctaStart",
    ctaColor: "text-violet-500 dark:text-violet-400",
  },
  {
    type: "rapport_client",
    titleKey: "typeReport",
    descriptionKey: "reportDescription",
    icon: BarChart3,
    iconColor: "text-blue-500 dark:text-blue-400",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
    hoverBorder: "hover:border-blue-300/40 dark:hover:border-blue-500/50",
    ctaLabelKey: "ctaGenerate",
    ctaColor: "text-blue-500 dark:text-blue-400",
  },
  {
    type: "presentation",
    titleKey: "typePresentation",
    descriptionKey: "presentationDescription",
    icon: Presentation,
    iconColor: "text-emerald-500 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    hoverBorder: "hover:border-emerald-300/40 dark:hover:border-emerald-500/50",
    ctaLabelKey: "ctaCreateDeck",
    ctaColor: "text-emerald-500 dark:text-emerald-400",
  },
]

interface TemplateCardsProps {
  onSelectType: (type: DocumentType) => void
}

export function TemplateCards({ onSelectType }: TemplateCardsProps) {
  const t = useTranslations("documents")

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TEMPLATE_CARDS.map((card) => {
        const Icon = card.icon
        return (
          <button
            key={card.type}
            type="button"
            onClick={() => onSelectType(card.type)}
            className={cn(
              "group relative flex flex-col items-start gap-3 rounded-2xl p-6 text-left transition-all",
              "glass-card shadow-sm hover:shadow-md dark:hover:bg-white/[0.06]",
              card.hoverBorder
            )}
          >
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                card.iconBg
              )}
            >
              <Icon className={cn("size-6", card.iconColor)} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground dark:text-white">
                {t(card.titleKey)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                {t(card.descriptionKey)}
              </p>
            </div>
            <div
              className={cn(
                "mt-1 flex items-center gap-1.5 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity",
                card.ctaColor
              )}
            >
              {t(card.ctaLabelKey)}
              <ArrowRight className="size-3" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
