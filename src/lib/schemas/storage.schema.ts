import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"

export const ALLOWED_MIME_TYPES_LIST = [

  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "video/mp4",
  "video/webm",
  "application/pdf",
] as const

export const UploadFileSchema = z.object({
  filename: z
    .string()
    .min(1, V.filenameRequired)
    .max(255, V.filenameTooLong)
    .regex(/^[a-zA-Z0-9._\-\s]+$/, V.filenameInvalidChars),
  mimeType: z.enum(ALLOWED_MIME_TYPES_LIST, {
    error: V.mimeTypeNotAllowed,
  }),
  sizeBytes: z
    .number()
    .int()
    .positive(V.fileSizeInvalid)
    .max(500 * 1024 * 1024, V.fileTooLarge),
  category: z
    .enum(["posts", "logos", "audios", "docs"])
    .default("posts"),
})

export type UploadFileInput = z.infer<typeof UploadFileSchema>

export const DeleteFileSchema = z.object({
  assetId: z.string().uuid(V.assetIdInvalid),
})

export const GetSignedUrlSchema = z.object({
  assetId: z.string().uuid(V.assetIdInvalid),
  ttl: z.enum(["short", "medium", "long"]).default("medium"),
})

export const MediaAssetSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  storagePath: z.string(),
  bucket: z.string(),
  publicUrl: z.string().nullable(),
  altText: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  wasResized: z.boolean(),
  compressionRatio: z.number().nullable(),
  createdAt: z.string(),
})

export type MediaAsset = z.infer<typeof MediaAssetSchema>
