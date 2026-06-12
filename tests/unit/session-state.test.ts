import { parseWorkflowStateEnvelope, MAX_STATE_BYTES } from "@/lib/services/workflow/session-state"

function validState(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    currentStep: 3,
    step1: { titre: "Lancement offre", description: "Description du brief…", objectif: "confiance" },
    step2: { platforms: ["linkedin"], format: "post" },
    step3: null,
    step4: null,
    step5: null,
    step6: null,
    step7: null,
    ...overrides,
  }
}

describe("session-state (persistance workflow — validation d'enveloppe)", () => {
  it("accepte un état valide et en extrait titre + étape", () => {
    const result = parseWorkflowStateEnvelope(validState())
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.title).toBe("Lancement offre")
      expect(result.currentStep).toBe(3)
    }
  })

  it("rejette les non-objets", () => {
    expect(parseWorkflowStateEnvelope(null)).toEqual({ valid: false, reason: "not_object" })
    expect(parseWorkflowStateEnvelope("texte")).toEqual({ valid: false, reason: "not_object" })
    expect(parseWorkflowStateEnvelope([1, 2])).toEqual({ valid: false, reason: "not_object" })
  })

  it("rejette une étape hors bornes ou non entière", () => {
    expect(parseWorkflowStateEnvelope(validState({ currentStep: 0 }))).toEqual({ valid: false, reason: "bad_step" })
    expect(parseWorkflowStateEnvelope(validState({ currentStep: 8 }))).toEqual({ valid: false, reason: "bad_step" })
    expect(parseWorkflowStateEnvelope(validState({ currentStep: 2.5 }))).toEqual({ valid: false, reason: "bad_step" })
    expect(parseWorkflowStateEnvelope(validState({ currentStep: "3" }))).toEqual({ valid: false, reason: "bad_step" })
  })

  it("rejette un step manquant ou d'un mauvais type", () => {
    const missing = validState()
    delete missing.step6
    expect(parseWorkflowStateEnvelope(missing)).toEqual({ valid: false, reason: "bad_shape" })
    expect(parseWorkflowStateEnvelope(validState({ step4: "corrompu" }))).toEqual({ valid: false, reason: "bad_shape" })
    expect(parseWorkflowStateEnvelope(validState({ step3: [1] }))).toEqual({ valid: false, reason: "bad_shape" })
  })

  it("rejette un état sans brief (rien à reprendre)", () => {
    expect(parseWorkflowStateEnvelope(validState({ step1: null }))).toEqual({ valid: false, reason: "empty" })
  })

  it("rejette un état trop volumineux", () => {
    const bloated = validState({
      step3: { captions: [{ caption: "x".repeat(MAX_STATE_BYTES) }] },
    })
    expect(parseWorkflowStateEnvelope(bloated)).toEqual({ valid: false, reason: "too_large" })
  })

  it("titre vide → title null, titre trop long → tronqué à 200", () => {
    const noTitle = parseWorkflowStateEnvelope(validState({ step1: { titre: "   " } }))
    expect(noTitle.valid && noTitle.title).toBe(null)
    const longTitle = parseWorkflowStateEnvelope(validState({ step1: { titre: "a".repeat(300) } }))
    expect(longTitle.valid && longTitle.title?.length).toBe(200)
  })
})
