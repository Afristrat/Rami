import { getTranslations } from "next-intl/server"
import { requireFeature } from "@/lib/billing/require-feature"
import { getLeadsAction } from "@/lib/actions/leads.actions"
import type { LeadsByStage } from "@/lib/schemas/lead.schema"
import { LeadsPageClient } from "./client"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("leads"),
    description: t("leadsDescription"),
  }
}

const EMPTY_LEADS: LeadsByStage = { lead: [], contacted: [], proposal: [], signed: [] }

// ── Server Component ───────────────────────────────────────────────────────────

export default async function LeadsPage() {
  await requireFeature("lead_gen")

  // Données réelles uniquement (US-029 : plus de leads de démo).
  // En cas d'échec de chargement, état vide honnête (jamais de données fabriquées).
  const result = await getLeadsAction()
  const leadsData: LeadsByStage = result.success ? result.data : EMPTY_LEADS

  return <LeadsPageClient initialData={leadsData} />
}
