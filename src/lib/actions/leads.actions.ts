"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { leads, leadActivities } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { log } from "@/lib/utils/logger"
import { enrichLead } from "@/lib/services/leads"
import {
  createLeadSchema,
  updateLeadSchema,
  createLeadActivitySchema,
  type LeadData,
  type LeadsByStage,
  type LeadActivityData,
  type BrandDnaMatch,
  type LeadStage,
} from "@/lib/schemas/lead.schema"

// ── Helpers ──────────────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const tenantId = await resolveUserTenant(supabase, user.id)
  return tenantId ? { userId: user.id, tenantId } : null
}

function serializeLead(row: typeof leads.$inferSelect): LeadData {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    company_name: row.company_name,
    contact_name: row.contact_name,
    email: row.email,
    phone: row.phone,
    linkedin_url: row.linkedin_url,
    sector: row.sector,
    company_size: row.company_size,
    location: row.location,
    stage: row.stage as LeadStage,
    deal_value: row.deal_value,
    currency: row.currency,
    score: row.score,
    brand_dna_match: (row.brand_dna_match as BrandDnaMatch) ?? null,
    apollo_data: (row.apollo_data as Record<string, unknown>) ?? null,
    next_followup_at: row.next_followup_at?.toISOString() ?? null,
    assigned_to: row.assigned_to,
    created_by: row.created_by,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

// ── Actions ──────────────────────────────────────────────────────────────────────

export type GetLeadsResult =
  | { success: true; data: LeadsByStage }
  | { success: false; error: string }

export async function getLeadsAction(): Promise<GetLeadsResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }

  try {
    const rows = await db
      .select()
      .from(leads)
      .where(eq(leads.tenant_id, ctx.tenantId))
      .orderBy(desc(leads.updated_at))

    const grouped: LeadsByStage = {
      lead: [],
      contacted: [],
      proposal: [],
      signed: [],
    }

    for (const row of rows) {
      const stage = row.stage as LeadStage
      if (grouped[stage]) {
        grouped[stage].push(serializeLead(row))
      }
    }

    return { success: true, data: grouped }
  } catch (err) {
    log({
      level: "error",
      module: "leads",
      action: "get_leads",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de la récupération des leads",
      metadata: { error: String(err) },
    })
    return { success: false, error: "Impossible de charger les leads." }
  }
}

export type CreateLeadResult =
  | { success: true; data: LeadData }
  | { success: false; error: string }

export async function createLeadAction(
  input: unknown
): Promise<CreateLeadResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }

  const parsed = createLeadSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  try {
    const data = parsed.data
    const [row] = await db
      .insert(leads)
      .values({
        tenant_id: ctx.tenantId,
        company_name: data.company_name,
        contact_name: data.contact_name,
        email: data.email || null,
        phone: data.phone || null,
        linkedin_url: data.linkedin_url || null,
        sector: data.sector || null,
        company_size: data.company_size || null,
        location: data.location || null,
        stage: data.stage,
        deal_value: data.deal_value,
        currency: data.currency,
        score: data.score,
        created_by: ctx.userId,
      })
      .returning()

    log({
      level: "info",
      module: "leads",
      action: "lead_created",
      tenant_id: ctx.tenantId,
      message: `Lead créé : ${data.company_name}`,
      metadata: { lead_id: row.id },
    })

    return { success: true, data: serializeLead(row) }
  } catch (err) {
    log({
      level: "error",
      module: "leads",
      action: "create_lead",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de la création du lead",
      metadata: { error: String(err) },
    })
    return { success: false, error: "Impossible de créer le lead." }
  }
}

export type UpdateLeadResult =
  | { success: true; data: LeadData }
  | { success: false; error: string }

export async function updateLeadAction(
  input: unknown
): Promise<UpdateLeadResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }

  const parsed = updateLeadSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  const { id, ...updates } = parsed.data

  try {
    // Vérifier que le lead appartient au tenant
    const existing = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.tenant_id, ctx.tenantId)))
      .limit(1)

    if (existing.length === 0) {
      return { success: false, error: "Lead introuvable." }
    }

    const values: Record<string, unknown> = { updated_at: new Date() }
    if (updates.company_name !== undefined) values.company_name = updates.company_name
    if (updates.contact_name !== undefined) values.contact_name = updates.contact_name
    if (updates.email !== undefined) values.email = updates.email || null
    if (updates.phone !== undefined) values.phone = updates.phone || null
    if (updates.linkedin_url !== undefined) values.linkedin_url = updates.linkedin_url || null
    if (updates.sector !== undefined) values.sector = updates.sector || null
    if (updates.company_size !== undefined) values.company_size = updates.company_size || null
    if (updates.location !== undefined) values.location = updates.location || null
    if (updates.stage !== undefined) values.stage = updates.stage
    if (updates.deal_value !== undefined) values.deal_value = updates.deal_value
    if (updates.currency !== undefined) values.currency = updates.currency
    if (updates.score !== undefined) values.score = updates.score
    if (updates.next_followup_at !== undefined) {
      values.next_followup_at = updates.next_followup_at
        ? new Date(updates.next_followup_at)
        : null
    }
    if (updates.brand_dna_match !== undefined) {
      values.brand_dna_match = updates.brand_dna_match
    }

    const [row] = await db
      .update(leads)
      .set(values)
      .where(and(eq(leads.id, id), eq(leads.tenant_id, ctx.tenantId)))
      .returning()

    log({
      level: "info",
      module: "leads",
      action: "lead_updated",
      tenant_id: ctx.tenantId,
      message: `Lead mis à jour : ${row.company_name}`,
      metadata: { lead_id: id, fields: Object.keys(updates) },
    })

    return { success: true, data: serializeLead(row) }
  } catch (err) {
    log({
      level: "error",
      module: "leads",
      action: "update_lead",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de la mise à jour du lead",
      metadata: { error: String(err), lead_id: id },
    })
    return { success: false, error: "Impossible de mettre à jour le lead." }
  }
}

export type DeleteLeadResult =
  | { success: true }
  | { success: false; error: string }

export async function deleteLeadAction(id: string): Promise<DeleteLeadResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }

  try {
    const deleted = await db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.tenant_id, ctx.tenantId)))
      .returning({ id: leads.id })

    if (deleted.length === 0) {
      return { success: false, error: "Lead introuvable." }
    }

    log({
      level: "info",
      module: "leads",
      action: "lead_deleted",
      tenant_id: ctx.tenantId,
      message: "Lead supprimé",
      metadata: { lead_id: id },
    })

    return { success: true }
  } catch (err) {
    log({
      level: "error",
      module: "leads",
      action: "delete_lead",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de la suppression du lead",
      metadata: { error: String(err), lead_id: id },
    })
    return { success: false, error: "Impossible de supprimer le lead." }
  }
}

export type GetLeadDetailResult =
  | { success: true; data: { lead: LeadData; activities: LeadActivityData[] } }
  | { success: false; error: string }

export async function getLeadDetailAction(
  id: string
): Promise<GetLeadDetailResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }

  try {
    const rows = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.tenant_id, ctx.tenantId)))
      .limit(1)

    if (rows.length === 0) {
      return { success: false, error: "Lead introuvable." }
    }

    const activityRows = await db
      .select()
      .from(leadActivities)
      .where(
        and(
          eq(leadActivities.lead_id, id),
          eq(leadActivities.tenant_id, ctx.tenantId)
        )
      )
      .orderBy(desc(leadActivities.created_at))

    const activities: LeadActivityData[] = activityRows.map((a) => ({
      id: a.id,
      lead_id: a.lead_id,
      tenant_id: a.tenant_id,
      type: a.type as LeadActivityData["type"],
      content: a.content,
      created_by: a.created_by,
      created_at: a.created_at.toISOString(),
    }))

    return {
      success: true,
      data: { lead: serializeLead(rows[0]), activities },
    }
  } catch (err) {
    log({
      level: "error",
      module: "leads",
      action: "get_lead_detail",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de la récupération du détail du lead",
      metadata: { error: String(err), lead_id: id },
    })
    return { success: false, error: "Impossible de charger le lead." }
  }
}

export type EnrichLeadResult =
  | { success: true; data: LeadData }
  | { success: false; error: string }

/**
 * Enrichit un lead via Apollo (US-027) : remplit `apollo_data` (titre, entreprise,
 * email…) et complète les champs vides du lead (email, secteur, taille, localisation,
 * linkedin) sans écraser les valeurs déjà saisies.
 */
export async function enrichLeadAction(leadId: string): Promise<EnrichLeadResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }

  if (typeof leadId !== "string" || leadId.length === 0) {
    return { success: false, error: "Identifiant de lead invalide." }
  }

  try {
    const rows = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.tenant_id, ctx.tenantId)))
      .limit(1)

    if (rows.length === 0) {
      return { success: false, error: "Lead introuvable." }
    }

    const lead = rows[0]
    const result = await enrichLead({
      name: lead.contact_name,
      email: lead.email,
      organization: lead.company_name,
      linkedinUrl: lead.linkedin_url,
    })

    if (!result.success) {
      const messages: Record<typeof result.reason, string> = {
        no_key: "Enrichissement Apollo non configuré (clé API absente).",
        not_found: "Aucune correspondance Apollo pour ce contact.",
        error: "Erreur lors de l'enrichissement Apollo.",
      }
      if (result.reason === "error") {
        log({
          level: "error",
          module: "leads",
          action: "enrich_lead",
          tenant_id: ctx.tenantId,
          message: "Échec enrichissement Apollo",
          metadata: { lead_id: leadId, error: result.message },
        })
      }
      return { success: false, error: messages[result.reason] }
    }

    const enrichment = result.data
    // Complète uniquement les champs vides (ne jamais écraser une saisie manuelle)
    const values: Record<string, unknown> = {
      apollo_data: enrichment,
      updated_at: new Date(),
    }
    if (!lead.email && enrichment.email) values.email = enrichment.email
    if (!lead.linkedin_url && enrichment.linkedin_url) values.linkedin_url = enrichment.linkedin_url
    if (!lead.sector && enrichment.industry) values.sector = enrichment.industry
    if (!lead.company_size && enrichment.company_size) values.company_size = enrichment.company_size
    if (!lead.location && enrichment.location) values.location = enrichment.location

    const [row] = await db
      .update(leads)
      .set(values)
      .where(and(eq(leads.id, leadId), eq(leads.tenant_id, ctx.tenantId)))
      .returning()

    log({
      level: "info",
      module: "leads",
      action: "lead_enriched",
      tenant_id: ctx.tenantId,
      message: `Lead enrichi : ${row.company_name}`,
      metadata: { lead_id: leadId },
    })

    return { success: true, data: serializeLead(row) }
  } catch (err) {
    log({
      level: "error",
      module: "leads",
      action: "enrich_lead",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de l'enrichissement du lead",
      metadata: { error: String(err), lead_id: leadId },
    })
    return { success: false, error: "Impossible d'enrichir le lead." }
  }
}

export type AddLeadActivityResult =
  | { success: true; data: LeadActivityData }
  | { success: false; error: string }

export async function addLeadActivityAction(
  input: unknown
): Promise<AddLeadActivityResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: "Non authentifié." }

  const parsed = createLeadActivitySchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    }
  }

  try {
    // Vérifier que le lead appartient au tenant
    const existing = await db
      .select({ id: leads.id })
      .from(leads)
      .where(
        and(
          eq(leads.id, parsed.data.lead_id),
          eq(leads.tenant_id, ctx.tenantId)
        )
      )
      .limit(1)

    if (existing.length === 0) {
      return { success: false, error: "Lead introuvable." }
    }

    const [row] = await db
      .insert(leadActivities)
      .values({
        lead_id: parsed.data.lead_id,
        tenant_id: ctx.tenantId,
        type: parsed.data.type,
        content: parsed.data.content,
        created_by: ctx.userId,
      })
      .returning()

    return {
      success: true,
      data: {
        id: row.id,
        lead_id: row.lead_id,
        tenant_id: row.tenant_id,
        type: row.type as LeadActivityData["type"],
        content: row.content,
        created_by: row.created_by,
        created_at: row.created_at.toISOString(),
      },
    }
  } catch (err) {
    log({
      level: "error",
      module: "leads",
      action: "add_lead_activity",
      tenant_id: ctx.tenantId,
      message: "Erreur lors de l'ajout de l'activité",
      metadata: { error: String(err) },
    })
    return { success: false, error: "Impossible d'ajouter l'activité." }
  }
}
