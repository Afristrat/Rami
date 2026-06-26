import type { Metadata } from "next"
import { LegalBanner } from "@/components/legal/LegalBanner"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Politique de confidentialité — RAMI",
  description:
    "Politique de confidentialité de RAMI conforme au RGPD (UE) et à la loi 09-08 (CNDP, Maroc) : données collectées, finalités, sous-traitants, durées de conservation et droits des personnes.",
  robots: { index: true, follow: true },
}

export default function ConfidentialitePage() {
  return (
    <>
      <LegalBanner />

      <h1>Politique de confidentialité</h1>

      <p>
        La présente politique décrit la manière dont la plateforme{" "}
        <strong>{COMPANY.produit}</strong> collecte, utilise et protège les
        données à caractère personnel, conformément à la loi 09-08 (Maroc) et au
        Règlement (UE) 2016/679 (RGPD).
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est {COMPANY.raisonSociale} (
        {COMPANY.formeJuridique}), dont le siège est situé&nbsp;: {COMPANY.siege}.
      </p>

      <h2>2. Délégué à la protection des données / contact</h2>
      <p>
        Pour toute question relative à la protection de vos données ou pour
        exercer vos droits, vous pouvez contacter notre point de contact dédié à
        l&apos;adresse{" "}
        <a href={`mailto:${COMPANY.emailDpo}`}>{COMPANY.emailDpo}</a>.
      </p>

      <h2>3. Catégories de données collectées</h2>
      <ul>
        <li>
          <strong>Données de compte</strong> : nom et adresse e-mail.
        </li>
        <li>
          <strong>Contenu créé</strong> : briefs, textes, visuels et autres
          contenus générés ou importés via le service.
        </li>
        <li>
          <strong>Jetons d&apos;accès (OAuth) aux réseaux sociaux</strong> :
          stockés chiffrés (AES-256), afin de permettre la publication en votre
          nom.
        </li>
        <li>
          <strong>Données d&apos;usage et d&apos;analyse</strong> : données de
          connexion, journaux techniques et statistiques d&apos;utilisation.
        </li>
        <li>
          <strong>Données de facturation</strong> : traitées via notre
          prestataire de paiement Stripe (les coordonnées bancaires ne sont pas
          stockées par {COMPANY.raisonSociale}).
        </li>
      </ul>

      <h2>4. Finalités et bases légales</h2>
      <ul>
        <li>
          <strong>Fourniture du service</strong> (création de compte, génération
          et publication de contenu) — base légale : exécution du contrat.
        </li>
        <li>
          <strong>Facturation et gestion des abonnements</strong> — base légale :
          exécution du contrat et obligations légales et comptables.
        </li>
        <li>
          <strong>Amélioration du service et mesure d&apos;audience</strong> —
          base légale : intérêt légitime ou consentement (pour les cookies non
          essentiels, voir notre{" "}
          <a href="/legal/cookies">politique de cookies</a>).
        </li>
        <li>
          <strong>Sécurité et prévention de la fraude</strong> — base légale :
          intérêt légitime.
        </li>
        <li>
          <strong>Communications transactionnelles</strong> (e-mails liés au
          compte et au service) — base légale : exécution du contrat.
        </li>
      </ul>

      <h2>5. Destinataires et sous-traitants</h2>
      <p>
        Pour fournir le service, {COMPANY.raisonSociale} fait appel à des
        prestataires agissant en qualité de sous-traitants (hébergement,
        génération et traitement par intelligence artificielle, paiement, envoi
        d&apos;e-mails, supervision et mesure d&apos;audience, publication sur
        les réseaux sociaux). La liste détaillée, avec les finalités et les
        localisations, est consultable sur notre page{" "}
        <a href="/legal/sous-traitants">sous-traitants</a>. Cette liste peut
        évoluer.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li>
          <strong>Données de compte</strong> : conservées tant que le compte est
          actif, puis supprimées au plus tard douze (12) mois après la clôture du
          compte.
        </li>
        <li>
          <strong>Contenus créés</strong> : conservés pendant la durée
          d&apos;utilisation du service, puis supprimés selon le même délai après
          clôture.
        </li>
        <li>
          <strong>Jetons OAuth</strong> : conservés jusqu&apos;à la déconnexion
          du compte concerné ou la suppression du compte.
        </li>
        <li>
          <strong>Données de facturation</strong> : conservées pour la durée
          imposée par les obligations légales et comptables applicables.
        </li>
        <li>
          <strong>Journaux techniques</strong> : conservés pour une durée
          limitée à des fins de sécurité et de diagnostic.
        </li>
      </ul>

      <h2>7. Transferts hors UE / hors Maroc</h2>
      <p>
        Certains de nos sous-traitants sont situés en dehors de l&apos;Union
        européenne et du Maroc (notamment aux États-Unis). Ces transferts sont
        encadrés par des garanties appropriées, telles que les clauses
        contractuelles types, afin d&apos;assurer un niveau de protection adéquat
        de vos données.
      </p>

      <h2>8. Vos droits</h2>
      <p>
        Conformément à la loi 09-08 et au RGPD, vous disposez des droits
        suivants sur vos données&nbsp;:
      </p>
      <ul>
        <li>droit d&apos;accès&nbsp;;</li>
        <li>droit de rectification&nbsp;;</li>
        <li>droit à l&apos;effacement&nbsp;;</li>
        <li>droit d&apos;opposition&nbsp;;</li>
        <li>droit à la portabilité&nbsp;;</li>
        <li>droit à la limitation du traitement.</li>
      </ul>
      <p>
        Pour exercer ces droits, écrivez à{" "}
        <a href={`mailto:${COMPANY.emailDpo}`}>{COMPANY.emailDpo}</a>. Nous nous
        efforçons de répondre dans les meilleurs délais et, en tout état de
        cause, dans les délais prévus par la réglementation applicable.
      </p>

      <h2>9. Réclamation auprès d&apos;une autorité de contrôle</h2>
      <p>
        Si vous estimez que le traitement de vos données n&apos;est pas conforme
        à la réglementation, vous pouvez introduire une réclamation&nbsp;:
      </p>
      <ul>
        <li>
          au Maroc, auprès de la Commission Nationale de contrôle de la
          protection des Données à caractère Personnel (CNDP)&nbsp;;
        </li>
        <li>
          dans l&apos;Union européenne, auprès de l&apos;autorité de contrôle
          compétente de votre pays (par exemple, la CNIL en France).
        </li>
      </ul>

      <h2>10. Sécurité</h2>
      <p>
        {COMPANY.raisonSociale} met en œuvre des mesures techniques et
        organisationnelles appropriées pour protéger vos données&nbsp;:
        chiffrement AES-256 des jetons OAuth, cloisonnement des données par
        client au niveau de la base (Row Level Security), chiffrement des
        échanges via HTTPS, et contrôle des accès.
      </p>
    </>
  )
}
