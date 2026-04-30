import { z } from 'zod'
import { V } from '@/lib/utils/validation-messages'

export const GenerateVideoSchema = z.object({
  prompt: z
    .string()
    .min(10, V.videoPromptMinLength)
    .max(1000, V.videoPromptMaxLength)
    .trim(),
  platform: z.enum(['tiktok', 'instagram_reels', 'youtube_shorts']),
  duration_seconds: z.number().min(3).max(60),
  reference_image_url: z.string().url().optional().or(z.literal('')),
  audio_prompt: z.string().max(300).optional(),
})

export type GenerateVideoInput = z.infer<typeof GenerateVideoSchema>
