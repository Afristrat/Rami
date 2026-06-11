"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useIntlLocale } from "@/lib/utils/format-locale"
import { ArrowLeft, CheckCircle2, Download, FileText, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentStatusBadge } from "./DocumentStatusBadge"
import type { CommercialOfferContent } from "@/lib/services/documents/commercial-offer"
import type { DocumentType, DocumentStatus } from "@/lib/schemas/document.schema"

interface CommercialOfferViewProps {
  document: {
    id: string
    title: string
    type: DocumentType
    client_name: string | null
    status: DocumentStatus
    created_at: string
  }
  content: CommercialOfferContent | null
}

export function CommercialOfferView({ document, content }: CommercialOfferViewProps) {
  const t = useTranslations("documents")
  const intlLocale = useIntlLocale()

  const formattedDate = new Intl.DateTimeFormat(intlLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(document.created_at))

  return (
    <div className="space-y-6">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t("backToDocuments")}
        </Link>
        {content && (
          <a
            href={`/dashboard/documents/${document.id}/pdf`}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 transition-opacity"
          >
            <Download className="size-4" />
            {t("downloadPdf")}
          </a>
        )}
      </div>

      {!content ? (
        /* État honnête : pas de contenu généré (brouillon ou type non géré). */
        <div className="glass-card rounded-2xl p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground/50 mb-3" />
          <h2 className="font-semibold text-foreground dark:text-white">{t("noContentTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("noContentDesc")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* En-tête de l'offre */}
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
                  {t("typeProposal")}
                </p>
                <h1 className="mt-2 text-2xl font-bold text-foreground dark:text-white">
                  {document.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  {document.client_name && (
                    <span>
                      {t("offerClientLabel")} :{" "}
                      <span className="font-semibold text-foreground dark:text-white">
                        {document.client_name}
                      </span>
                    </span>
                  )}
                  <span>
                    {t("offerDateLabel")} :{" "}
                    <span className="font-semibold text-foreground dark:text-white">
                      {formattedDate}
                    </span>
                  </span>
                </div>
              </div>
              <DocumentStatusBadge status={document.status} />
            </div>
          </div>

          {/* Synthèse exécutive */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("offerSummaryTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-foreground dark:text-white/90">
              {content.executive_summary}
            </p>
          </section>

          {/* Contexte */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("offerContextTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-foreground dark:text-white/90">
              {content.context}
            </p>
          </section>

          {/* Objectifs */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("offerObjectivesTitle")}
            </h2>
            <ul className="space-y-2">
              {content.objectives.map((objective, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground dark:text-white/90">
                  <Target className="mt-0.5 size-4 shrink-0 text-violet-500 dark:text-violet-400" />
                  {objective}
                </li>
              ))}
            </ul>
          </section>

          {/* Prestations */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("offerServicesTitle")}
            </h2>
            <div className="space-y-4">
              {content.services.map((service, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/20 p-4">
                  <h3 className="font-semibold text-foreground dark:text-white">{service.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {service.description}
                  </p>
                  {service.deliverables.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {t("offerDeliverables")}
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {service.deliverables.map((deliverable, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-sm text-foreground dark:text-white/90"
                          >
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Méthodologie */}
          <section className="glass-card rounded-2xl p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {t("offerMethodologyTitle")}
            </h2>
            <ol className="space-y-3">
              {content.methodology.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground dark:text-white/90">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {/* Investissement */}
          {content.pricing.length > 0 && (
            <section className="glass-card rounded-2xl p-6">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("offerPricingTitle")}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-border">
                    {content.pricing.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 pr-4">
                          <span className="font-semibold text-foreground dark:text-white">
                            {item.label}
                          </span>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </td>
                        <td
                          className={cn(
                            "py-3 text-right font-semibold whitespace-nowrap",
                            item.price
                              ? "text-foreground dark:text-white"
                              : "text-muted-foreground italic"
                          )}
                        >
                          {item.price || t("offerPriceOnRequest")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Prochaines étapes */}
          {content.next_steps.length > 0 && (
            <section className="glass-card rounded-2xl p-6">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("offerNextStepsTitle")}
              </h2>
              <ul className="space-y-2">
                {content.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground dark:text-white/90">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-500 dark:text-violet-400" />
                    {step}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
