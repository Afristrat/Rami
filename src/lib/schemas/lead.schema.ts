import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"

// ── Enums ──────────────────────────────────────────────────────────────────────

export const LEAD_STAGES = ["lead", "contacted", "proposal", "signed"] as const
export type LeadStage = (typeof LEAD_STAGES)[number]

export const LEAD_ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const
export type LeadActivityType = (typeof LEAD_ACTIVITY_TYPES)[number]

export const CURRENCIES = ["MAD", "EUR", "USD"] as const

// ── Stage config (labels + couleurs) ───────────────────────────────────────────

export const STAGE_CONFIG: Record<
  LeadStage,
  { label: string; color: string; dotColor: string }
> = {
  lead: { label: "LEAD", color: "text-violet-400", dotColor: "bg-violet-400" },
  contacted: { label: "CONTACTÉ", color: "text-blue-400", dotColor: "bg-blue-400" },
  proposal: { label: "PROPOSITION", color: "text-amber-400", dotColor: "bg-amber-400" },
  signed: { label: "SIGNÉ", color: "text-emerald-400", dotColor: "bg-emerald-400" },
}

// ── Schemas de validation ──────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  company_name: z
    .string()
    .min(1, V.companyNameRequired)
    .max(255)
    .trim(),
  contact_name: z
    .string()
    .min(1, V.contactNameRequired)
    .max(255)
    .trim(),
  email: z
    .string()
    .email(V.emailInvalidShort)
    .max(255)
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z.string().max(50).trim().optional().or(z.literal("")),
  linkedin_url: z.string().url(V.linkedinUrlInvalid).optional().or(z.literal("")),
  sector: z.string().max(100).trim().optional().or(z.literal("")),
  company_size: z.string().max(50).trim().optional().or(z.literal("")),
  location: z.string().max(255).trim().optional().or(z.literal("")),
  stage: z.enum(LEAD_STAGES).default("lead"),
  deal_value: z.coerce.number().int().min(0).default(0),
  currency: z.enum(CURRENCIES).default("MAD"),
  score: z.coerce.number().int().min(0).max(100).default(0),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const updateLeadSchema = createLeadSchema.partial().extend({
  id: z.string().uuid(),
  next_followup_at: z.string().datetime().optional().nullable(),
  brand_dna_match: z
    .object({
      audience: z.number().min(0).max(100),
      sector: z.number().min(0).max(100),
      culture: z.number().min(0).max(100),
    })
    .optional()
    .nullable(),
})

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

export const createLeadActivitySchema = z.object({
  lead_id: z.string().uuid(),
  type: z.enum(LEAD_ACTIVITY_TYPES),
  content: z.string().min(1, V.activityContentRequired).max(5000).trim(),
})

export type CreateLeadActivityInput = z.infer<typeof createLeadActivitySchema>

// ── Types dérivés ──────────────────────────────────────────────────────────────

export interface BrandDnaMatch {
  audience: number
  sector: number
  culture: number
}

export interface LeadData {
  id: string
  tenant_id: string
  company_name: string
  contact_name: string
  email: string | null
  phone: string | null
  linkedin_url: string | null
  sector: string | null
  company_size: string | null
  location: string | null
  stage: LeadStage
  deal_value: number | null
  currency: string
  score: number | null
  brand_dna_match: BrandDnaMatch | null
  apollo_data: Record<string, unknown> | null
  next_followup_at: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LeadActivityData {
  id: string
  lead_id: string
  tenant_id: string
  type: LeadActivityType
  content: string
  created_by: string | null
  created_at: string
}

export interface LeadsByStage {
  lead: LeadData[]
  contacted: LeadData[]
  proposal: LeadData[]
  signed: LeadData[]
}
