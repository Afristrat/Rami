import {
  API_KEY_PREFIX,
  API_SCOPES,
  generateApiKey,
  hashApiKey,
  keyPrefix,
  isApiKeyShape,
  extractBearer,
  hasScopes,
} from "@/lib/services/api-keys/keys"

// ─── generateApiKey ──────────────────────────────────────────────────────────

describe("generateApiKey", () => {
  test("génère une clé rami_sk_ avec hash et prefix cohérents", () => {
    const k = generateApiKey()
    expect(k.raw.startsWith(API_KEY_PREFIX)).toBe(true)
    expect(k.raw.length).toBeGreaterThan(40)
    expect(k.hash).toBe(hashApiKey(k.raw))
    expect(k.prefix).toBe(keyPrefix(k.raw))
    expect(k.prefix.length).toBe(12)
  })

  test("deux clés sont distinctes (raw ET hash)", () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a.raw).not.toBe(b.raw)
    expect(a.hash).not.toBe(b.hash)
  })
})

// ─── hashApiKey ──────────────────────────────────────────────────────────────

describe("hashApiKey", () => {
  test("déterministe : même entrée → même hash (SHA-256 hex 64 car.)", () => {
    expect(hashApiKey("rami_sk_abc")).toBe(hashApiKey("rami_sk_abc"))
    expect(hashApiKey("rami_sk_abc")).toMatch(/^[a-f0-9]{64}$/)
  })

  test("entrées différentes → hash différents", () => {
    expect(hashApiKey("a")).not.toBe(hashApiKey("b"))
  })
})

// ─── isApiKeyShape ───────────────────────────────────────────────────────────

describe("isApiKeyShape", () => {
  test("vrai pour une vraie clé, faux sinon", () => {
    expect(isApiKeyShape(generateApiKey().raw)).toBe(true)
    expect(isApiKeyShape("rami_sk_short")).toBe(false)
    expect(isApiKeyShape("nope_xxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe(false)
    expect(isApiKeyShape("")).toBe(false)
  })
})

// ─── extractBearer ───────────────────────────────────────────────────────────

describe("extractBearer", () => {
  test("extrait le token, insensible à la casse", () => {
    expect(extractBearer("Bearer abc.def")).toBe("abc.def")
    expect(extractBearer("bearer xyz")).toBe("xyz")
  })

  test("null si absent / malformé", () => {
    expect(extractBearer(null)).toBeNull()
    expect(extractBearer(undefined)).toBeNull()
    expect(extractBearer("Basic abc")).toBeNull()
    expect(extractBearer("abc")).toBeNull()
  })
})

// ─── hasScopes ───────────────────────────────────────────────────────────────

describe("hasScopes", () => {
  test("vrai si toutes les scopes requises présentes", () => {
    expect(hasScopes([...API_SCOPES], ["posts:write"])).toBe(true)
    expect(hasScopes(["posts:write"], ["posts:write"])).toBe(true)
  })

  test("faux si une scope manque", () => {
    expect(hasScopes(["analytics:read"], ["posts:write"])).toBe(false)
    expect(hasScopes([], ["posts:write"])).toBe(false)
  })
})
