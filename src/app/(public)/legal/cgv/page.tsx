import type { Metadata } from "next"
import { LegalBanner } from "@/components/legal/LegalBanner"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — RAMI",
  description:
    "Conditions Générales de Vente de RAMI : abonnements et plans, prix, paiement via Stripe, rétractation, renouvellement, résiliation, remboursement et droit applicable.",
  robots: { index: true, follow: true },
}

export default function CgvPage() {
  return (
    <>
      <LegalBanner />

      <h1>Conditions Générales de Vente (CGV)</h1>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales de vente régissent la souscription aux
        abonnements payants de la plateforme <strong>{COMPANY.produit}</strong>{" "}
        éditée par {COMPANY.raisonSociale} ({COMPANY.formeJuridique}). Elles
        complètent les <a href="/legal/cgu">conditions générales
        d&apos;utilisation</a>.
      </p>

      <h2>2. Abonnements et plans</h2>
      <p>
        Le service est proposé sous forme d&apos;abonnements (plans) offrant
        différents niveaux de fonctionnalités et de volumes d&apos;utilisation.
        Le détail des plans et leurs caractéristiques sont présentés sur la page{" "}
        <a href="/pricing">tarifs</a>.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix applicables sont ceux indiqués sur la page{" "}
        <a href="/pricing">tarifs</a> au moment de la souscription. Ils sont
        susceptibles d&apos;évoluer&nbsp;; le prix applicable à un abonnement en
        cours est celui en vigueur lors de sa souscription ou de son
        renouvellement. Les taxes éventuellement applicables sont précisées lors
        du paiement.
      </p>

      <h2>4. Paiement</h2>
      <p>
        Le paiement des abonnements est traité par notre prestataire de paiement{" "}
        <strong>Stripe</strong>. {COMPANY.raisonSociale} ne conserve pas les
        coordonnées bancaires de l&apos;utilisateur, celles-ci étant traitées
        directement et de manière sécurisée par Stripe.
      </p>

      <h2>5. Droit de rétractation</h2>
      <p>
        Lorsque la réglementation applicable reconnaît un droit de rétractation,
        celui-ci s&apos;exerce dans les conditions et délais prévus par cette
        réglementation. L&apos;utilisateur reconnaît que, pour un service
        numérique dont l&apos;exécution a commencé avec son accord, le droit de
        rétractation peut ne plus s&apos;appliquer une fois le service
        pleinement fourni. Pour toute demande, contactez{" "}
        <a href={`mailto:${COMPANY.emailContact}`}>{COMPANY.emailContact}</a>.
      </p>

      <h2>6. Renouvellement et résiliation</h2>
      <p>
        Sauf indication contraire, les abonnements sont renouvelés
        automatiquement à l&apos;échéance de chaque période. L&apos;utilisateur
        peut désactiver le renouvellement automatique ou résilier son abonnement
        à tout moment depuis son espace ou en contactant le support. La
        résiliation prend effet à la fin de la période en cours.
      </p>

      <h2>7. Remboursement</h2>
      <p>
        Sauf disposition légale impérative contraire ou accord exprès de{" "}
        {COMPANY.raisonSociale}, les sommes versées au titre d&apos;une période
        d&apos;abonnement entamée ne donnent pas lieu à remboursement. Toute
        demande peut être adressée à{" "}
        <a href={`mailto:${COMPANY.emailContact}`}>{COMPANY.emailContact}</a>.
      </p>

      <h2>8. Droit applicable et juridiction compétente</h2>
      <p>
        Les présentes CGV sont régies par le droit marocain. En cas de litige et
        à défaut de résolution amiable, compétence est attribuée aux tribunaux
        compétents de Casablanca.
      </p>
    </>
  )
}
