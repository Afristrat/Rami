import { z } from 'zod'
import { V } from '@/lib/utils/validation-messages'

// Note : pas de .default() sur les champs — utiliser defaultValues dans useForm (Zod v4 + zodResolver)
export const GenerateBriefSchema = z.object({
  brief: z
    .string()
    .min(10, V.briefMinLength)
    .max(2000, V.briefMaxLength)
    .trim(),
  platform: z.enum(['instagram', 'linkedin', 'twitter', 'facebook', 'pinterest', 'youtube']),
  directions_count: z.number().min(1).max(4),
  images_per_direction: z.number().min(1).max(5),
  campaignType: z.string().optional(),
})

export type GenerateBriefInput = z.infer<typeof GenerateBriefSchema>

export const VisualSessionSchema = z.object({
  session_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  brief: z.string(),
  platform: z.string(),
  visuals: z.array(
    z.object({
      direction_id: z.number(),
      direction_name: z.string(),
      image_url: z.string().url(),
      brand_dna_score: z.number().min(0).max(100),
      provider: z.string(),
      prompt_used: z.string(),
      seed: z.number(),
    })
  ),
  created_at: z.string(),
})
