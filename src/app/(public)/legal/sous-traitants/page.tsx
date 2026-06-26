import type { Metadata } from "next"
import { LegalBanner } from "@/components/legal/LegalBanner"
import { COMPANY } from "@/lib/legal/company"

export const metadata: Metadata = {
  title: "Sous-traitants et protection des données — RAMI",
  description:
    "Registre des sous-traitants de RAMI (DPA) : finalités et localisations des prestataires, conformément au RGPD et à la loi 09-08 (CNDP).",
  robots: { index: true, follow: true },
}

type SubProcessor = {
  name: string
  purpose: string
  location: string
}

// Liste fondée sur la stack réelle (CLAUDE.md du projet). À mettre à jour si elle évolue.
const SUB_PROCESSORS: ReadonlyArray<SubProcessor> = [
  {
    name: "Supabase (auto-hébergé)",
    purpose: "Base de données et authentification",
    location: "Maroc (infrastructure propre)",
  },
  {
    name: "Cloudflare, Inc.",
    purpose: "CDN, proxy et tunnel réseau",
    location: "International (États-Unis)",
  },
  {
    name: "Proxy LiteLLM (auto-hébergé)",
    purpose: "Passerelle vers les modèles d'intelligence artificielle",
    location: "Maroc",
  },
  {
    name: "Fal.ai, Replicate, Together AI",
    purpose: "Génération d'images par intelligence artificielle",
    location: "États-Unis",
  },
  {
    name: "Anthropic (modèles Claude, via passerelle)",
    purpose: "Traitement de texte par intelligence artificielle",
    location: "États-Unis",
  },
  {
    name: "OpenAI",
    purpose: "Transcription audio (Whisper)",
    location: "États-Unis",
  },
  {
    name: "Stripe, Inc.",
    purpose: "Traitement des paiements",
    location: "États-Unis / Union européenne",
  },
  {
    name: "Resend",
    purpose: "Envoi d'e-mails transactionnels",
    location: "États-Unis",
  },
  {
    name: "Sentry",
    purpose: "Supervision des erreurs applicatives",
    location: "États-Unis",
  },
  {
    name: "PostHog",
    purpose: "Analyse produit et mesure d'audience",
    location: "États-Unis / Union européenne",
  },
  {
    name: "Ayrshare et APIs des réseaux sociaux",
    purpose: "Publication de contenu sur les réseaux sociaux",
    location: "International",
  },
  {
    name: "Apollo.io / Hunter.io (si activé)",
    purpose: "Enrichissement de prospects",
    location: "États-Unis",
  },
]

export default function SousTraitantsPage() {
  return (
    <>
      <LegalBanner />

      <h1>Politique de protection des données et sous-traitants</h1>

      <p>
        Pour fournir la plateforme <strong>{COMPANY.produit}</strong>,{" "}
        {COMPANY.raisonSociale} a recours à des prestataires agissant en qualité
        de sous-traitants au sens du RGPD et de la loi 09-08. Le présent registre
        en dresse la liste, avec la finalité et la localisation de chacun.
      </p>

      <h2>Registre des sous-traitants</h2>
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
              <th className="py-2 pr-4 font-semibold">Sous-traitant</th>
              <th className="py-2 pr-4 font-semibold">Finalité</th>
              <th className="py-2 font-semibold">Localisation</th>
            </tr>
          </thead>
          <tbody>
            {SUB_PROCESSORS.map((sp) => (
              <tr
                key={sp.name}
                className="border-b border-zinc-200 align-top dark:border-zinc-800"
              >
                <td className="py-2 pr-4 font-medium">{sp.name}</td>
                <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">
                  {sp.purpose}
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">
                  {sp.location}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Transferts hors UE / hors Maroc</h2>
      <p>
        Certains sous-traitants sont situés en dehors de l&apos;Union européenne
        et du Maroc (notamment aux États-Unis). Ces transferts sont encadrés par
        des garanties appropriées, telles que les clauses contractuelles types,
        afin d&apos;assurer un niveau de protection adéquat des données.
      </p>

      <h2>Évolution de la liste</h2>
      <p>
        Cette liste est susceptible d&apos;évoluer en fonction des prestataires
        utilisés. Toute modification substantielle sera reflétée sur cette page.
        Pour toute question, écrivez à{" "}
        <a href={`mailto:${COMPANY.emailDpo}`}>{COMPANY.emailDpo}</a> et
        consultez notre{" "}
        <a href="/legal/confidentialite">politique de confidentialité</a>.
      </p>
    </>
  )
}
