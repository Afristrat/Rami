// Contrat du cœur de génération partagé (US-052).
// Garantit que `generateVisuals` honore un contexte tenant EXPLICITE et ne
// dépend d'AUCUNE session (pas de getUser, pas de quota de session) : c'est ce
// qui permet à l'API publique v1 de réutiliser le même moteur que l'action UI.

// ── Mocks de la chaîne de génération (aucun appel réseau réel) ──
const mockStoreVisual = jest.fn(async (..._args: unknown[]) => ({
  data: {
    public_url: "https://minio.example/v.webp",
    minio_path: "tenants/x/v.webp",
    width: 1080,
    height: 1080,
    file_size_bytes: 12_345,
  },
}))

jest.mock("@/lib/services/image-generation", () => ({
  generateBatch: jest.fn(async () => [
    {
      provider: "fal",
      model: "flux",
      images: [{ url: "https://gen.example/raw.png", width: 1080, height: 1080, seed: 7 }],
    },
  ]),
}))
jest.mock("@/lib/services/brand-dna/vision-scorer", () => ({
  scoreImageWithVision: jest.fn(async () => ({
    score: 88,
    vision_scored: true,
    dominant_color_hex: "#1d4ed8",
  })),
}))
jest.mock("@/lib/services/storage/visual-storage", () => ({
  storeVisual: (...args: unknown[]) => mockStoreVisual(...args),
}))
jest.mock("@/lib/services/brand-dna/prompt-compiler", () => ({
  compileBrandDNAToPrompts: jest.fn(() => [
    {
      positive_prompt: "p",
      negative_prompt: "n",
      parameters: { width: 1080, height: 1080, guidance_scale: 7, num_inference_steps: 30, seed: 1 },
      direction: { id: "d1", name: "Direction 1", style: "editorial", emotion: "confiance" },
    },
  ]),
}))
jest.mock("@/lib/services/brand-dna/normalize", () => ({
  normalizeBrandDNA: jest.fn(() => ({
    color_palette: [{ hex: "#1d4ed8" }],
    cognitive_objective: "confiance",
    identity: { sector: "tech" },
  })),
}))
jest.mock("@/lib/services/metrics/attribution", () => ({
  buildPerformancePrior: jest.fn(async () => null),
}))
jest.mock("@/lib/billing", () => ({
  hasFeatureAccess: jest.fn(() => true), // plan payant → pas de watermark
  incrementGenerationCount: jest.fn(async () => undefined),
}))
jest.mock("@/lib/utils/logger", () => ({ log: jest.fn() }))
jest.mock("@/lib/utils/posthog-server", () => ({ captureServerEvent: jest.fn() }))

import { generateVisuals, type VisualGenContext } from "@/lib/services/visuals/generate-core"

/** Faux client Supabase : capture les lignes persistées, sans DB réelle. */
function makeFakeSupabase() {
  const inserts: Record<string, unknown[]> = { visual_sessions: [], visual_session_images: [] }
  const supabase = {
    from(table: string) {
      return {
        insert(row: unknown) {
          inserts[table]?.push(row)
          if (table === "visual_sessions") {
            return {
              select: () => ({
                single: async () => ({ data: { id: "session-123" }, error: null }),
              }),
            }
          }
          // visual_session_images : insert « awaité » directement
          return Promise.resolve({ error: null })
        },
      }
    },
  }
  return { supabase, inserts }
}

const validInput = {
  brief: "Lancer une campagne de notoriété pour notre nouvelle gamme premium.",
  platform: "instagram" as const,
  directions_count: 1,
  images_per_direction: 1,
}

describe("generateVisuals (cœur partagé US-052)", () => {
  beforeEach(() => {
    mockStoreVisual.mockClear()
  })

  it("génère et persiste en utilisant le tenant du CONTEXTE (jamais une session)", async () => {
    const { supabase, inserts } = makeFakeSupabase()
    const ctx: VisualGenContext = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      tenantId: "tenant-from-api-key",
      plan: "pro",
      brandDNARaw: { whatever: true },
      tenantRowId: "tenant-row-1",
      actorId: "tenant-from-api-key", // en API, l'acteur = le tenant (pas un user de session)
    }

    const result = await generateVisuals(ctx, validInput)

    expect(result.success).toBe(true)
    expect(result.session_id).toBeTruthy()
    expect(result.visuals).toHaveLength(1)

    // Le stockage MinIO reçoit le tenant du contexte, pas un tenant de session.
    expect(mockStoreVisual).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "tenant-from-api-key" })
    )

    // La persistance porte le tenant + l'acteur du contexte.
    const session = inserts.visual_sessions[0] as { tenant_id: string; user_id: string }
    expect(session.tenant_id).toBe("tenant-from-api-key")
    expect(session.user_id).toBe("tenant-from-api-key")
  })

  it("rejette un brief invalide via Zod, sans toucher la génération", async () => {
    const { supabase } = makeFakeSupabase()
    const ctx: VisualGenContext = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      tenantId: "t1",
      plan: "free",
      brandDNARaw: null,
      tenantRowId: null,
      actorId: "t1",
    }

    // brief vide → invalide
    const result = await generateVisuals(ctx, { ...validInput, brief: "" })

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockStoreVisual).not.toHaveBeenCalled()
  })
})
