import type { Metadata } from "next"
import { LegalBanner } from "@/components/legal/LegalBanner"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Politique de cookies — RAMI",
  description:
    "Politique de cookies de RAMI : cookies strictement nécessaires, mesure d'audience (PostHog) soumise au consentement, gestion et refus, conformément à la directive ePrivacy et à la CNDP.",
  robots: { index: true, follow: true },
}

export default function CookiesPage() {
  return (
    <>
      <LegalBanner />

      <h1>Politique de cookies</h1>

      <h2>1. Qu&apos;est-ce qu&apos;un cookie&nbsp;?</h2>
      <p>
        Un cookie est un petit fichier déposé sur votre terminal (ordinateur,
        tablette, téléphone) lors de la consultation d&apos;un site. Il permet de
        reconnaître votre navigateur, de mémoriser certaines informations et de
        faciliter votre utilisation du service. La présente politique précise les
        cookies utilisés par la plateforme <strong>{COMPANY.produit}</strong> et
        la manière de les gérer.
      </p>

      <h2>2. Cookies strictement nécessaires</h2>
      <p>
        Ces cookies sont indispensables au fonctionnement du service. Ils
        permettent notamment la gestion de votre session, votre authentification
        et la sécurité de votre navigation. Ils ne nécessitent pas votre
        consentement, car sans eux le service ne peut être fourni.
      </p>

      <h2>3. Cookies de mesure d&apos;audience</h2>
      <p>
        Nous utilisons des outils de mesure d&apos;audience et d&apos;analyse
        produit, en particulier <strong>PostHog</strong>, afin de comprendre
        l&apos;usage du service et de l&apos;améliorer. Ces cookies, non
        essentiels, ne sont déposés qu&apos;après votre consentement préalable et
        peuvent être refusés sans conséquence sur l&apos;accès au service.
      </p>

      <h2>4. Consentement, gestion et refus</h2>
      <p>
        Conformément à la directive ePrivacy et aux exigences de la CNDP (loi
        09-08), le dépôt des cookies non essentiels est soumis à votre
        consentement préalable. Vous pouvez à tout moment accepter ou refuser ces
        cookies via le mécanisme de gestion du consentement proposé sur le site,
        et modifier votre choix ultérieurement.
      </p>
      <p>
        Vous pouvez également configurer votre navigateur pour bloquer ou
        supprimer les cookies. Le refus des cookies strictement nécessaires peut
        toutefois altérer le bon fonctionnement du service.
      </p>

      <h2>5. Durée de conservation</h2>
      <p>
        Les cookies sont conservés pour une durée n&apos;excédant pas celle
        nécessaire à leur finalité, conformément à la réglementation applicable.
        Au terme de cette durée, votre consentement vous est de nouveau demandé
        pour les cookies non essentiels.
      </p>

      <h2>6. En savoir plus</h2>
      <p>
        Pour plus d&apos;informations sur le traitement de vos données, consultez
        notre{" "}
        <a href="/legal/confidentialite">politique de confidentialité</a>. Pour
        toute question, écrivez à{" "}
        <a href={`mailto:${COMPANY.emailDpo}`}>{COMPANY.emailDpo}</a>.
      </p>
    </>
  )
}
