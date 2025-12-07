import { Buffer } from "node:buffer"
import crypto from "node:crypto"

const algorithm = "aes-256-gcm"
const secret = process.env.ENCRYPTION_KEY
if (!secret) {
  throw new Error("Encryption key is missing")
}

// Derive a 32-byte key from the secret
const key = crypto.createHash("sha256").update(secret).digest()

export function encrypt(input: string): string {
  try {
    const iv = crypto.randomBytes(12) // 12 bytes recommended for GCM
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    const encrypted = Buffer.concat([cipher.update(input, "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
  }
  catch {
    throw new Error("Encryption failed")
  }
}

export function decrypt(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":")
    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error("Invalid encrypted input format")
    }

    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const encrypted = Buffer.from(encryptedHex, "hex")

    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString("utf8")
  }
  catch {
    throw new Error("Decryption failed")
  }
}
