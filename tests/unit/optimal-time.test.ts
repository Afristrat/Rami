import {
  suggestOptimalTime,
  toDatetimeLocalValue,
  PLATFORM_ENGAGEMENT_WINDOWS,
} from "@/lib/services/workflow/optimal-time"

// Mercredi 10 juin 2026 (getDay() = 3), 7h00 heure locale
const WEDNESDAY_7AM = new Date(2026, 5, 10, 7, 0, 0, 0)
// Mercredi 9h30 — la fenêtre LinkedIn du matin (8-10h) est déjà entamée
const WEDNESDAY_930 = new Date(2026, 5, 10, 9, 30, 0, 0)

describe("optimal-time (Step 7 — fin de la fausse suggestion « +14% »)", () => {
  it("toutes les plateformes ont au moins une fenêtre d'engagement", () => {
    for (const windows of Object.values(PLATFORM_ENGAGEMENT_WINDOWS)) {
      expect(windows.length).toBeGreaterThan(0)
      for (const w of windows) {
        expect(w.startHour).toBeLessThan(w.endHour)
        expect(w.weekdays.length).toBeGreaterThan(0)
      }
    }
  })

  it("LinkedIn + objectif confiance (matin) → mercredi 8h le jour même si encore à venir", () => {
    const result = suggestOptimalTime({ platform: "linkedin", objective: "confiance", from: WEDNESDAY_7AM })
    expect(result.getDay()).toBe(3) // mercredi
    expect(result.getHours()).toBe(8)
    expect(result.getDate()).toBe(10)
  })

  it("LinkedIn à 9h30 → créneau du matin passé → jeudi 8h", () => {
    const result = suggestOptimalTime({ platform: "linkedin", objective: "expertise", from: WEDNESDAY_930 })
    expect(result.getDay()).toBe(4) // jeudi
    expect(result.getHours()).toBe(8)
    expect(result.getDate()).toBe(11)
  })

  it("TikTok + objectif communauté (soirée) → mercredi 20h (fin de fenêtre 18-21h)", () => {
    const result = suggestOptimalTime({ platform: "tiktok", objective: "communauté", from: WEDNESDAY_7AM })
    expect(result.getDay()).toBe(3)
    expect(result.getHours()).toBe(20)
  })

  it("Instagram + objectif joie → préfère la fenêtre du soir (18-20h → 19h)", () => {
    const result = suggestOptimalTime({ platform: "instagram", objective: "joie", from: WEDNESDAY_7AM })
    expect(result.getHours()).toBe(19)
  })

  it("Instagram + objectif urgence → préfère la fenêtre de midi (11-13h → 11h)", () => {
    const result = suggestOptimalTime({ platform: "instagram", objective: "urgence", from: WEDNESDAY_7AM })
    expect(result.getHours()).toBe(11)
  })

  it("Pinterest (ven/sam soir) depuis mercredi → vendredi 21h pour un objectif soirée", () => {
    const result = suggestOptimalTime({ platform: "pinterest", objective: "communauté", from: WEDNESDAY_7AM })
    expect(result.getDay()).toBe(5) // vendredi
    expect(result.getHours()).toBe(21)
  })

  it("respecte le délai minimal de 30 minutes", () => {
    // Mercredi 7h45 : LinkedIn 8h = dans 15 min < 30 min → jeudi 8h
    const from = new Date(2026, 5, 10, 7, 45, 0, 0)
    const result = suggestOptimalTime({ platform: "linkedin", objective: "confiance", from })
    expect(result.getDate()).toBe(11)
  })

  it("est déterministe (même entrée → même sortie)", () => {
    const a = suggestOptimalTime({ platform: "twitter", objective: "expertise", from: WEDNESDAY_7AM })
    const b = suggestOptimalTime({ platform: "twitter", objective: "expertise", from: WEDNESDAY_7AM })
    expect(a.getTime()).toBe(b.getTime())
  })

  describe("toDatetimeLocalValue", () => {
    it("formate en YYYY-MM-DDTHH:mm avec zéros initiaux", () => {
      expect(toDatetimeLocalValue(new Date(2026, 0, 5, 8, 5))).toBe("2026-01-05T08:05")
      expect(toDatetimeLocalValue(new Date(2026, 11, 25, 23, 59))).toBe("2026-12-25T23:59")
    })
  })
})
