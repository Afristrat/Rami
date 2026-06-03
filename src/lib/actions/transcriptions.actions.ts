'use server'

// ============================================================
// Transcriptions Actions — Server Actions pour le module transcription
// Feature flag : 'transcription' (Pro+)
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { log } from '@/lib/utils/logger'
import { uploadToStorage, buildStoragePath } from '@/lib/services/storage/client'
import { transcribeAudio, resolveWhisperKey, WHISPER_MAX_BYTES } from '@/lib/services/transcription/whisper'
import type { Speaker, Verbatim, AiAction } from '@/lib/schemas/transcription.schema'

const ACCEPTED_AUDIO_MIME = [
  'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav',
  'audio/x-m4a', 'audio/m4a', 'video/mp4', 'video/mpeg',
]
const ACCEPTED_LANGUAGES = ['fr', 'ar', 'darija', 'en', 'es']
const MAX_UPLOAD_BYTES = 500 * 1024 * 1024 // 500 Mo (limite produit, cf. CLAUDE.md §1.2)

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

export interface TranscribeUploadResult {
  id: string | null
  status?: 'completed' | 'failed'
  error?: string
}

/**
 * Upload réel d'un fichier audio (MinIO) + transcription Whisper (US-022).
 * Reçoit un FormData {file, language}. Stocke le fichier, crée l'entrée
 * (status=processing), appelle Whisper, puis met à jour (completed/failed).
 * Dégradation propre si la clé Whisper est absente (status=failed + message).
 */
export async function transcribeUploadAction(
  formData: FormData
): Promise<TranscribeUploadResult> {
  const ctx = await getAuthContext()
  if (!ctx) return { id: null, error: 'Non authentifié' }

  const file = formData.get('file')
  const language = String(formData.get('language') ?? 'fr')
  if (!(file instanceof File)) return { id: null, error: 'Fichier audio manquant.' }
  if (!ACCEPTED_AUDIO_MIME.includes(file.type)) return { id: null, error: 'Format audio non supporté.' }
  if (!ACCEPTED_LANGUAGES.includes(language)) return { id: null, error: 'Langue non supportée.' }
  if (file.size > MAX_UPLOAD_BYTES) return { id: null, error: 'Fichier trop volumineux (max 500 Mo).' }
  if (file.size > WHISPER_MAX_BYTES) {
    return { id: null, error: `Fichier trop volumineux pour la transcription (max ${Math.floor(WHISPER_MAX_BYTES / (1024 * 1024))} Mo par requête).` }
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // 1. Stockage MinIO (bucket privé 'audios'). Best-effort : on poursuit même si KO.
  const path = buildStoragePath(ctx.tenantId, file.name)
  let storedPath = `audios/${path}`
  const up = await uploadToStorage({ bucket: 'audios', path, buffer, mimeType: file.type })
  if (up.data?.path) storedPath = up.data.path
  else if (up.error) {
    log({ level: 'warn', module: 'transcriptions', action: 'storage_failed', tenant_id: ctx.tenantId, metadata: { error: up.error.message } })
  }

  // 2. Entrée DB en cours de traitement.
  const { data: row, error: insErr } = await ctx.supabase
    .from('transcriptions')
    .insert({
      tenant_id: ctx.tenantId,
      title: file.name.replace(/\.[^.]+$/, ''),
      original_filename: file.name,
      storage_path: storedPath,
      mime_type: file.type,
      file_size_bytes: file.size,
      language,
      status: 'processing',
      created_by: ctx.userId,
    })
    .select('id')
    .single()

  if (insErr || !row) {
    log({ level: 'error', module: 'transcriptions', action: 'create', tenant_id: ctx.tenantId, metadata: { error: insErr?.message } })
    return { id: null, error: insErr?.message ?? 'Création de la transcription impossible.' }
  }

  // 3. Transcription Whisper.
  const result = await transcribeAudio(
    { buffer, filename: file.name, mimeType: file.type, language },
    resolveWhisperKey()
  )

  if (result.success) {
    await ctx.supabase
      .from('transcriptions')
      .update({ transcript_text: result.text, status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('tenant_id', ctx.tenantId)
    log({ level: 'info', module: 'transcriptions', action: 'transcribed', tenant_id: ctx.tenantId, user_id: ctx.userId, metadata: { transcription_id: row.id, chars: result.text.length } })
    return { id: row.id, status: 'completed' }
  }

  const msg =
    result.reason === 'no_key'
      ? 'Transcription non configurée (clé Whisper absente).'
      : result.message ?? 'Échec de la transcription.'
  await ctx.supabase
    .from('transcriptions')
    .update({ status: 'failed', error_message: msg, updated_at: new Date().toISOString() })
    .eq('id', row.id)
    .eq('tenant_id', ctx.tenantId)
  if (result.reason === 'error' || result.reason === 'no_key') {
    log({ level: 'error', module: 'transcriptions', action: 'transcribe_failed', tenant_id: ctx.tenantId, metadata: { transcription_id: row.id, reason: result.reason, error: result.message } })
  }
  return { id: row.id, status: 'failed', error: msg }
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
