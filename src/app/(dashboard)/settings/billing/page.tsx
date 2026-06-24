import { redirect } from "next/navigation"

// La gestion de l'abonnement (plan, moyen de paiement, factures) vit sur la page
// `/billing` réelle (Stripe : portail, checkout, factures réelles). Cette ancienne
// route settings ne fait plus que rediriger — filet pour les liens / bookmarks
// existants. L'écran factice (carte « Visa 4242 », fausses factures) a été supprimé.
export default function BillingSettingsPage() {
  redirect("/billing")
}
