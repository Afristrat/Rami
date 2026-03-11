import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const key = process.env.OAUTH_TOKEN_ENCRYPTION_KEY
  if (!key) throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY manquante")
  return Buffer.from(key.padEnd(64, "0").slice(0, 64), "hex")
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decryptToken(ciphertext: string): string {
  const key = getKey()
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const encrypted = Buffer.from(encryptedHex, "hex")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}

/**
 * Génère un state CSRF signé pour les flows OAuth.
 * Format : base64(JSON({ platform, userId, nonce }))
 */
export function generateOAuthState(platform: string, userId: string): string {
  const payload = {
    platform,
    userId,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  }
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

/**
 * Valide et parse le state OAuth.
 * Expire après 10 minutes.
 */
export function parseOAuthState(
  state: string
): { platform: string; userId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
    const ageMs = Date.now() - (decoded.issuedAt as number)
    if (ageMs > 10 * 60 * 1000) return null // expiré
    return { platform: decoded.platform as string, userId: decoded.userId as string }
  } catch {
    return null
  }
}
