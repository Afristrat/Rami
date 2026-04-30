import { z } from 'zod'
import { V } from '@/lib/utils/validation-messages'

// ── Enums ────────────────────────────────────────────────────────────────────

export const TranscriptionStatus = z.enum(['uploading', 'processing', 'completed', 'failed'])
export type TranscriptionStatus = z.infer<typeof TranscriptionStatus>

export const TranscriptionLanguage = z.enum(['fr', 'ar', 'darija', 'en', 'es'])
export type TranscriptionLanguage = z.infer<typeof TranscriptionLanguage>

// ── Speaker segment ──────────────────────────────────────────────────────────

export const SpeakerSegmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
})

export const SpeakerSchema = z.object({
  speaker: z.string().min(1),
  segments: z.array(SpeakerSegmentSchema),
})

export type Speaker = z.infer<typeof SpeakerSchema>
export type SpeakerSegment = z.infer<typeof SpeakerSegmentSchema>

// ── Verbatim ─────────────────────────────────────────────────────────────────

export const VerbatimSchema = z.object({
  quote: z.string().min(1),
  speaker: z.string(),
  timestamp: z.string(),
  importance: z.enum(['high', 'medium', 'low']),
})

export type Verbatim = z.infer<typeof VerbatimSchema>

// ── AI Action ────────────────────────────────────────────────────────────────

export const AiActionSchema = z.object({
  action: z.string().min(1),
  assignee: z.string().optional(),
  deadline: z.string().optional(),
})

export type AiAction = z.infer<typeof AiActionSchema>

// ── Create transcription ─────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/m4a',
  'video/mp4',
  'video/mpeg',
] as const

export const CreateTranscriptionSchema = z.object({
  title: z.string().min(1, V.transcriptionTitleRequired).max(500).trim(),
  original_filename: z.string().min(1).max(500),
  storage_path: z.string().min(1),
  mime_type: z.string().refine(
    (v) => (ACCEPTED_MIME_TYPES as readonly string[]).includes(v),
    V.transcriptionMimeInvalid
  ),
  file_size_bytes: z
    .number()
    .int()
    .positive()
    .max(500 * 1024 * 1024, V.transcriptionFileTooLarge),
  language: TranscriptionLanguage.default('fr'),
})

export type CreateTranscriptionInput = z.infer<typeof CreateTranscriptionSchema>

// ── Transcription row (from DB) ──────────────────────────────────────────────

export const TranscriptionRowSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  title: z.string(),
  original_filename: z.string(),
  storage_path: z.string(),
  mime_type: z.string(),
  file_size_bytes: z.number(),
  duration_seconds: z.number().nullable(),
  language: z.string(),
  status: TranscriptionStatus,
  transcript_text: z.string().nullable(),
  speakers: z.array(SpeakerSchema).nullable(),
  verbatims: z.array(VerbatimSchema).nullable(),
  ai_summary: z.string().nullable(),
  ai_actions: z.array(AiActionSchema).nullable(),
  error_message: z.string().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type TranscriptionRow = z.infer<typeof TranscriptionRowSchema>
