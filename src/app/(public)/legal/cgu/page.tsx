import type { Metadata } from "next"
import { LegalBanner } from "@/components/legal/LegalBanner"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — RAMI",
  description:
    "Conditions Générales d'Utilisation de la plateforme RAMI : accès au service, compte, obligations, contenu généré, propriété intellectuelle, résiliation et droit applicable.",
  robots: { index: true, follow: true },
}

export default function CguPage() {
  return (
    <>
      <LegalBanner />

      <h1>Conditions Générales d&apos;Utilisation (CGU)</h1>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales d&apos;utilisation ont pour objet de
        définir les modalités de mise à disposition et d&apos;utilisation de la
        plateforme <strong>{COMPANY.produit}</strong> éditée par{" "}
        {COMPANY.raisonSociale} ({COMPANY.formeJuridique}). Toute utilisation du
        service implique l&apos;acceptation pleine et entière des présentes CGU.
      </p>

      <h2>2. Accès au service</h2>
      <p>
        {COMPANY.produit} est une plateforme en ligne (SaaS) accessible à
        l&apos;adresse <a href={COMPANY.siteUrl}>{COMPANY.siteUrl}</a>. L&apos;accès
        à certaines fonctionnalités est subordonné à la souscription d&apos;un
        abonnement, dans les conditions prévues par les{" "}
        <a href="/legal/cgv">conditions générales de vente</a>.
      </p>

      <h2>3. Compte utilisateur</h2>
      <p>
        L&apos;utilisation du service nécessite la création d&apos;un compte.
        L&apos;utilisateur s&apos;engage à fournir des informations exactes et à
        les maintenir à jour. Il est responsable de la confidentialité de ses
        identifiants et de toute activité réalisée depuis son compte.
      </p>

      <h2>4. Obligations de l&apos;utilisateur</h2>
      <p>L&apos;utilisateur s&apos;engage à&nbsp;:</p>
      <ul>
        <li>
          utiliser le service conformément aux lois et règlements en vigueur&nbsp;;
        </li>
        <li>
          ne pas porter atteinte aux droits de tiers (propriété intellectuelle,
          vie privée, droit à l&apos;image)&nbsp;;
        </li>
        <li>
          ne pas diffuser de contenu illicite, diffamatoire, haineux,
          trompeur ou contraire à l&apos;ordre public&nbsp;;
        </li>
        <li>
          ne pas tenter de perturber, contourner ou compromettre la sécurité du
          service&nbsp;;
        </li>
        <li>
          respecter les conditions d&apos;utilisation des plateformes tierces
          (réseaux sociaux) connectées au service.
        </li>
      </ul>

      <h2>5. Contenu généré et responsabilité</h2>
      <p>
        Le service permet de générer du contenu à l&apos;aide d&apos;outils
        d&apos;intelligence artificielle. L&apos;utilisateur demeure seul
        responsable du contenu qu&apos;il crée, valide, programme et publie. Il
        lui appartient de vérifier l&apos;exactitude, la légalité et la pertinence
        de chaque contenu avant publication. {COMPANY.raisonSociale} ne saurait
        être tenue responsable des contenus produits ou diffusés par
        l&apos;utilisateur.
      </p>

      <h2>6. Disponibilité du service</h2>
      <p>
        {COMPANY.raisonSociale} s&apos;efforce d&apos;assurer la disponibilité du
        service. Toutefois, l&apos;accès peut être temporairement suspendu pour
        des opérations de maintenance, des mises à jour ou en raison de
        circonstances indépendantes de sa volonté. Le service est fourni en
        l&apos;état, sans garantie de disponibilité ininterrompue.
      </p>

      <h2>7. Propriété intellectuelle</h2>
      <p>
        La plateforme {COMPANY.produit}, ses composants logiciels, ses interfaces
        et ses marques demeurent la propriété exclusive de{" "}
        {COMPANY.raisonSociale}. Les contenus créés par l&apos;utilisateur via le
        service restent sa propriété, sous réserve du respect des droits des
        tiers et des présentes CGU.
      </p>

      <h2>8. Résiliation</h2>
      <p>
        L&apos;utilisateur peut résilier son compte à tout moment depuis son
        espace ou en contactant{" "}
        <a href={`mailto:${COMPANY.emailContact}`}>{COMPANY.emailContact}</a>.{" "}
        {COMPANY.raisonSociale} se réserve le droit de suspendre ou de résilier
        l&apos;accès d&apos;un utilisateur en cas de manquement aux présentes
        CGU, dans le respect des règles applicables.
      </p>

      <h2>9. Droit applicable et juridiction compétente</h2>
      <p>
        Les présentes CGU sont régies par le droit marocain. En cas de litige et
        à défaut de résolution amiable, compétence est attribuée aux tribunaux
        compétents de Casablanca.
      </p>
    </>
  )
}
