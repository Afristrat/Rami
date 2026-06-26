// Bandeau discret affiché en haut de chaque page légale.
// Server component (aucune interactivité).

import { LAST_UPDATED } from "@/lib/legal/company"

export function LegalBanner() {
  return (
    <p className="mb-8 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
      Document à jour au {LAST_UPDATED}. Information générale, ne constitue pas un
      avis juridique.
    </p>
  )
}
