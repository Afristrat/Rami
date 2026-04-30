import { z } from 'zod'
import { V } from '@/lib/utils/validation-messages'

export const DocumentTypeValues = ['offre_commerciale', 'rapport_client', 'presentation'] as const
export type DocumentType = (typeof DocumentTypeValues)[number]

export const DocumentStatusValues = ['draft', 'in_progress', 'completed'] as const
export type DocumentStatus = (typeof DocumentStatusValues)[number]

export const CreateDocumentSchema = z.object({
  title: z
    .string()
    .min(3, V.docTitleMinLength)
    .max(500, V.docTitleMaxLength)
    .trim(),
  type: z.enum(DocumentTypeValues, {
    error: V.docTypeInvalid,
  }),
  client_name: z
    .string()
    .max(255, V.docClientNameMaxLength)
    .trim()
    .optional(),
  brief: z
    .string()
    .max(5000, V.docBriefMaxLength)
    .trim()
    .optional(),
})

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  title: z.string(),
  type: z.enum(DocumentTypeValues),
  client_name: z.string().nullable(),
  status: z.enum(DocumentStatusValues),
  storage_path: z.string().nullable(),
  public_url: z.string().nullable(),
  content_json: z.unknown().nullable(),
  brand_dna_snapshot: z.unknown().nullable(),
  file_size_bytes: z.number().nullable(),
  created_by: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type DocumentRow = z.infer<typeof DocumentSchema>
