'use server'

// ============================================================
// Transcriptions Actions — Server Actions pour le module transcription
// Feature flag : 'transcription' (Pro+)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { log } from '@/lib/utils/logger'
import { CreateTranscriptionSchema, type CreateTranscriptionInput } from '@/lib/schemas/transcription.schema'
import type { Speaker, Verbatim, AiAction } from '@/lib/schemas/transcription.schema'

// ── Types de résultat ─────────────────────────────────────────────────────────

export interface TranscriptionListItem {
  id: string
  title: string
  original_filename: string
  mime_type: string
  file_size_bytes: number
  duration_seconds: number | null
  language: string
  status: string
  created_at: string
}

export interface TranscriptionDetail {
  id: string
  tenant_id: string
  title: string
  original_filename: string
  storage_path: string
  mime_type: string
  file_size_bytes: number
  duration_seconds: number | null
  language: string
  status: string
  transcript_text: string | null
  speakers: Speaker[] | null
  verbatims: Verbatim[] | null
  ai_summary: string | null
  ai_actions: AiAction[] | null
  error_message: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAuthContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return null

  return { supabase, userId: user.id, tenantId }
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Liste toutes les transcriptions du tenant courant.
 */
export async function getTranscriptionsAction(): Promise<{
  transcriptions: TranscriptionListItem[]
  error?: string
}> {
  const ctx = await getAuthContext()
  if (!ctx) return { transcriptions: [], error: 'Non authentifié' }

  const { data, error } = await ctx.supabase
    .from('transcriptions')
    .select('id, title, original_filename, mime_type, file_size_bytes, duration_seconds, language, status, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })

  if (error) {
    log({
      level: 'error',
      module: 'transcriptions',
      action: 'list',
      tenant_id: ctx.tenantId,
      metadata: { error: error.message },
    })
    return { transcriptions: [], error: error.message }
  }

  return { transcriptions: data ?? [] }
}

/**
 * Récupère le détail complet d'une transcription.
 */
export async function getTranscriptionDetailAction(id: string): Promise<{
  transcription: TranscriptionDetail | null
  error?: string
}> {
  if (!id) return { transcription: null, error: 'ID requis' }

  const ctx = await getAuthContext()
  if (!ctx) return { transcription: null, error: 'Non authentifié' }

  const { data, error } = await ctx.supabase
    .from('transcriptions')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .single()

  if (error) {
    log({
      level: 'error',
      module: 'transcriptions',
      action: 'detail',
      tenant_id: ctx.tenantId,
      metadata: { transcription_id: id, error: error.message },
    })
    return { transcription: null, error: error.message }
  }

  return { transcription: data as TranscriptionDetail }
}

/**
 * Crée une entrée transcription après upload du fichier.
 */
export async function createTranscriptionAction(
  input: CreateTranscriptionInput
): Promise<{
  id: string | null
  error?: string
}> {
  const ctx = await getAuthContext()
  if (!ctx) return { id: null, error: 'Non authentifié' }

  const parsed = CreateTranscriptionSchema.safeParse(input)
  if (!parsed.success) {
    return { id: null, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { data, error } = await ctx.supabase
    .from('transcriptions')
    .insert({
      tenant_id: ctx.tenantId,
      title: parsed.data.title,
      original_filename: parsed.data.original_filename,
      storage_path: parsed.data.storage_path,
      mime_type: parsed.data.mime_type,
      file_size_bytes: parsed.data.file_size_bytes,
      language: parsed.data.language,
      status: 'uploading',
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (error) {
    log({
      level: 'error',
      module: 'transcriptions',
      action: 'create',
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      metadata: { error: error.message },
    })
    return { id: null, error: error.message }
  }

  log({
    level: 'info',
    module: 'transcriptions',
    action: 'created',
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    metadata: { transcription_id: data.id, filename: parsed.data.original_filename },
  })

  return { id: data.id }
}

/**
 * Supprime une transcription.
 */
export async function deleteTranscriptionAction(id: string): Promise<{
  success: boolean
  error?: string
}> {
  if (!id) return { success: false, error: 'ID requis' }

  const ctx = await getAuthContext()
  if (!ctx) return { success: false, error: 'Non authentifié' }

  const { error } = await ctx.supabase
    .from('transcriptions')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)

  if (error) {
    log({
      level: 'error',
      module: 'transcriptions',
      action: 'delete',
      tenant_id: ctx.tenantId,
      metadata: { transcription_id: id, error: error.message },
    })
    return { success: false, error: error.message }
  }

  log({
    level: 'info',
    module: 'transcriptions',
    action: 'deleted',
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    metadata: { transcription_id: id },
  })

  return { success: true }
}
