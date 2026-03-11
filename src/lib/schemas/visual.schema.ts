import { z } from 'zod'

// Note : pas de .default() sur les champs — utiliser defaultValues dans useForm (Zod v4 + zodResolver)
export const GenerateBriefSchema = z.object({
  brief: z
    .string()
    .min(10, 'Le brief doit contenir au moins 10 caractères')
    .max(2000, 'Le brief ne peut pas dépasser 2000 caractères')
    .trim(),
  platform: z.enum(['instagram', 'linkedin', 'twitter', 'facebook', 'pinterest', 'youtube']),
  directions_count: z.number().min(1).max(4),
  images_per_direction: z.number().min(1).max(5),
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
