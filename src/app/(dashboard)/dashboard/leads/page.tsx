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

// ── Mock data de démo (utilisé si pas de données en DB) ────────────────────────

const DEMO_LEADS: LeadsByStage = {
  lead: [
    {
      id: "demo-1",
      tenant_id: "",
      company_name: "TechMoove SAS",
      contact_name: "Thomas Muller",
      email: "contact@techmoove.io",
      phone: "+33 1 45 67 89 00",
      linkedin_url: "https://linkedin.com/company/techmoove",
      sector: "Software / SaaS",
      company_size: "50-200 employés",
      location: "Paris, France",
      stage: "lead",
      deal_value: 12000,
      currency: "MAD",
      score: 82,
      brand_dna_match: { audience: 92, sector: 85, culture: 74 },
      apollo_data: { enriched: true },
      next_followup_at: new Date(Date.now() + 0).toISOString(),
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-2",
      tenant_id: "",
      company_name: "LogiStream",
      contact_name: "Leila Gueroui",
      email: "l.gueroui@logistream.io",
      phone: "+33 6 12 34 56 78",
      linkedin_url: "https://linkedin.com/company/logistream",
      sector: "Logistique",
      company_size: "200-500 employés",
      location: "Lyon, France",
      stage: "lead",
      deal_value: 8000,
      currency: "MAD",
      score: 55,
      brand_dna_match: { audience: 60, sector: 50, culture: 45 },
      apollo_data: null,
      next_followup_at: new Date(Date.now() + 86400000).toISOString(),
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-6",
      tenant_id: "",
      company_name: "DataPulse",
      contact_name: "Sara Tazi",
      email: "s.tazi@datapulse.ma",
      phone: "+212 6 55 00 11 22",
      linkedin_url: "https://linkedin.com/company/datapulse",
      sector: "Data & Analytics",
      company_size: "10-50 employés",
      location: "Casablanca, Maroc",
      stage: "lead",
      deal_value: 15000,
      currency: "MAD",
      score: 71,
      brand_dna_match: { audience: 78, sector: 70, culture: 65 },
      apollo_data: { enriched: true },
      next_followup_at: new Date(Date.now() + 172800000).toISOString(),
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  contacted: [
    {
      id: "demo-3",
      tenant_id: "",
      company_name: "Alim-Services",
      contact_name: "Anas Salhi",
      email: "a.salhi@alim-services.ma",
      phone: "+212 6 00 00 00 00",
      linkedin_url: "https://linkedin.com/company/alim-services",
      sector: "Agro-alimentaire",
      company_size: "100-200 employés",
      location: "Casablanca, Maroc",
      stage: "contacted",
      deal_value: 24000,
      currency: "MAD",
      score: 32,
      brand_dna_match: { audience: 40, sector: 35, culture: 80 },
      apollo_data: { enriched: true },
      next_followup_at: new Date(Date.now() + 7200000).toISOString(),
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-7",
      tenant_id: "",
      company_name: "Zenith Consulting",
      contact_name: "Youssef El Idrissi",
      email: "y.elidrissi@zenith.ma",
      phone: "+212 5 22 33 44 55",
      linkedin_url: "https://linkedin.com/company/zenith-consulting",
      sector: "Conseil en stratégie",
      company_size: "20-50 employés",
      location: "Rabat, Maroc",
      stage: "contacted",
      deal_value: 18000,
      currency: "MAD",
      score: 67,
      brand_dna_match: { audience: 70, sector: 65, culture: 88 },
      apollo_data: null,
      next_followup_at: new Date(Date.now() + 259200000).toISOString(),
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  proposal: [
    {
      id: "demo-4",
      tenant_id: "",
      company_name: "Next Media",
      contact_name: "Nadia Mansouri",
      email: "n.mansouri@nextmedia.ma",
      phone: "+212 5 22 00 00 00",
      linkedin_url: "https://linkedin.com/company/nextmedia",
      sector: "Média / Communication",
      company_size: "20-50 employés",
      location: "Rabat, Maroc",
      stage: "proposal",
      deal_value: 36000,
      currency: "MAD",
      score: 95,
      brand_dna_match: { audience: 96, sector: 92, culture: 90 },
      apollo_data: { enriched: true },
      next_followup_at: null,
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-8",
      tenant_id: "",
      company_name: "GreenBuild SARL",
      contact_name: "Fatima Zahra Bennis",
      email: "fz.bennis@greenbuild.ma",
      phone: "+212 6 77 88 99 00",
      linkedin_url: "https://linkedin.com/company/greenbuild",
      sector: "BTP / Immobilier",
      company_size: "50-100 employés",
      location: "Tanger, Maroc",
      stage: "proposal",
      deal_value: 42000,
      currency: "MAD",
      score: 78,
      brand_dna_match: { audience: 80, sector: 75, culture: 82 },
      apollo_data: { enriched: true },
      next_followup_at: new Date(Date.now() + 86400000).toISOString(),
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  signed: [
    {
      id: "demo-5",
      tenant_id: "",
      company_name: "Kasbah Hotel",
      contact_name: "Karim Benali",
      email: "k.benali@kasbahhotel.com",
      phone: "+212 5 24 00 00 00",
      linkedin_url: "https://linkedin.com/company/kasbahhotel",
      sector: "Hôtellerie / Tourisme",
      company_size: "50-100 employés",
      location: "Marrakech, Maroc",
      stage: "signed",
      deal_value: 48000,
      currency: "MAD",
      score: 88,
      brand_dna_match: { audience: 90, sector: 85, culture: 92 },
      apollo_data: { enriched: true },
      next_followup_at: null,
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-9",
      tenant_id: "",
      company_name: "Atlas Digital",
      contact_name: "Omar Chakir",
      email: "o.chakir@atlasdigital.ma",
      phone: "+212 6 11 22 33 44",
      linkedin_url: "https://linkedin.com/company/atlas-digital",
      sector: "Marketing Digital",
      company_size: "10-20 employés",
      location: "Fès, Maroc",
      stage: "signed",
      deal_value: 28000,
      currency: "MAD",
      score: 91,
      brand_dna_match: { audience: 94, sector: 88, culture: 95 },
      apollo_data: { enriched: true },
      next_followup_at: null,
      assigned_to: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}

// ── Server Component ───────────────────────────────────────────────────────────

export default async function LeadsPage() {
  await requireFeature("lead_gen")

  const result = await getLeadsAction()

  // Utiliser les données réelles si disponibles, sinon fallback sur les démo
  let leadsData: LeadsByStage

  if (result.success) {
    const hasRealData =
      result.data.lead.length > 0 ||
      result.data.contacted.length > 0 ||
      result.data.proposal.length > 0 ||
      result.data.signed.length > 0

    leadsData = hasRealData ? result.data : DEMO_LEADS
  } else {
    leadsData = DEMO_LEADS
  }

  return <LeadsPageClient initialData={leadsData} />
}
