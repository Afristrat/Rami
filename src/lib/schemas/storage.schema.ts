import { z } from "zod"

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
    .min(1, "Nom de fichier requis")
    .max(255, "Nom de fichier trop long")
    .regex(/^[a-zA-Z0-9._\-\s]+$/, "Nom de fichier invalide (caractères spéciaux non autorisés)"),
  mimeType: z.enum(ALLOWED_MIME_TYPES_LIST, {
    error: "Type de fichier non autorisé",
  }),
  sizeBytes: z
    .number()
    .int()
    .positive("Taille de fichier invalide")
    .max(500 * 1024 * 1024, "Fichier trop volumineux (max 500 MB)"),
  category: z
    .enum(["posts", "logos", "audios", "docs"])
    .default("posts"),
})

export type UploadFileInput = z.infer<typeof UploadFileSchema>

export const DeleteFileSchema = z.object({
  assetId: z.string().uuid("ID d'asset invalide"),
})

export const GetSignedUrlSchema = z.object({
  assetId: z.string().uuid("ID d'asset invalide"),
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
