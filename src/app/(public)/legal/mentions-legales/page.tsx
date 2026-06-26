import type { Metadata } from "next"
import { LegalBanner } from "@/components/legal/LegalBanner"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Mentions légales — RAMI",
  description:
    "Mentions légales de la plateforme RAMI éditée par AIMPOWER SARL-AU : éditeur, hébergeur, propriété intellectuelle et déclaration CNDP.",
  robots: { index: true, follow: true },
}

export default function MentionsLegalesPage() {
  return (
    <>
      <LegalBanner />

      <h1>Mentions légales</h1>

      <p>
        Les présentes mentions légales régissent l&apos;utilisation de la
        plateforme <strong>{COMPANY.produit}</strong> (marque commerciale{" "}
        {COMPANY.marqueCommerciale}), accessible à l&apos;adresse{" "}
        <a href={COMPANY.siteUrl}>{COMPANY.siteUrl}</a>.
      </p>

      <h2>1. Éditeur du site</h2>
      <p>Le site et le service sont édités par&nbsp;:</p>
      <ul>
        <li>
          <strong>Raison sociale</strong> : {COMPANY.raisonSociale}
        </li>
        <li>
          <strong>Forme juridique</strong> : {COMPANY.formeJuridique}
        </li>
        <li>
          <strong>Capital social</strong> : {COMPANY.capitalSocial}
        </li>
        <li>
          <strong>Activité</strong> : {COMPANY.activite}
        </li>
        <li>
          <strong>Registre du commerce (RC)</strong> : {COMPANY.rc}
        </li>
        <li>
          <strong>Identifiant Commun de l&apos;Entreprise (ICE)</strong> :{" "}
          {COMPANY.ice}
        </li>
        <li>
          <strong>Identifiant fiscal (IF)</strong> : {COMPANY.if}
        </li>
        <li>
          <strong>Taxe professionnelle</strong> : {COMPANY.taxeProfessionnelle}
        </li>
        <li>
          <strong>Siège social</strong> : {COMPANY.siege}
        </li>
        <li>
          <strong>Gérant</strong> : {COMPANY.gerant}
        </li>
        <li>
          <strong>Directeur de la publication</strong> :{" "}
          {COMPANY.directeurPublication}
        </li>
        <li>
          <strong>Contact</strong> :{" "}
          <a href={`mailto:${COMPANY.emailContact}`}>{COMPANY.emailContact}</a>
          {COMPANY.telephone ? <> — {COMPANY.telephone}</> : null}
        </li>
      </ul>

      <h2>2. Hébergement</h2>
      <p>{COMPANY.hebergeur}</p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments composant le site et le service{" "}
        {COMPANY.produit} (structure, code, textes, interfaces, logos, marques,
        bases de données, contenus éditoriaux) est protégé par les lois en
        vigueur relatives à la propriété intellectuelle et demeure la propriété
        exclusive de {COMPANY.raisonSociale} ou de ses partenaires.
      </p>
      <p>
        Toute reproduction, représentation, modification, publication ou
        adaptation de tout ou partie de ces éléments, par quelque procédé que ce
        soit, est interdite sans l&apos;autorisation écrite préalable de{" "}
        {COMPANY.raisonSociale}. Les contenus créés par l&apos;utilisateur au
        moyen du service demeurent la propriété de l&apos;utilisateur, dans les
        conditions prévues par les conditions générales d&apos;utilisation.
      </p>

      <h2>4. Protection des données personnelles — Déclaration CNDP</h2>
      <p>
        Conformément à la loi 09-08 relative à la protection des personnes
        physiques à l&apos;égard du traitement des données à caractère personnel
        (Maroc), {COMPANY.raisonSociale} a engagé les démarches de déclaration
        auprès de la Commission Nationale de contrôle de la protection des
        Données à caractère Personnel (CNDP).
      </p>
      <p>
        <strong>Statut actuel</strong> : {COMPANY.cndpRecepisse}. Le numéro de
        récépissé sera mentionné ici dès son obtention.
      </p>
      <p>
        Pour en savoir plus sur les traitements réalisés et l&apos;exercice de
        vos droits, consultez notre{" "}
        <a href="/legal/confidentialite">politique de confidentialité</a>. Pour
        toute question, écrivez à{" "}
        <a href={`mailto:${COMPANY.emailDpo}`}>{COMPANY.emailDpo}</a>.
      </p>

      <h2>5. Responsabilité</h2>
      <p>
        {COMPANY.raisonSociale} s&apos;efforce d&apos;assurer l&apos;exactitude
        et la mise à jour des informations diffusées sur le site, sans toutefois
        pouvoir en garantir l&apos;exhaustivité. L&apos;utilisation du service
        est régie par les{" "}
        <a href="/legal/cgu">conditions générales d&apos;utilisation</a> et, le
        cas échéant, par les{" "}
        <a href="/legal/cgv">conditions générales de vente</a>.
      </p>
    </>
  )
}
