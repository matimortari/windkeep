import { Buffer } from "node:buffer"
import crypto from "node:crypto"

const algorithm = "aes-256-gcm"
const masterKeySecret = requireEnv("ENCRYPTION_KEY")
const keyCacheTtlMs = 10 * 60 * 1000

// Derive a stable 32-byte key from the master secret
const wrappingKey = crypto.createHash("sha256").update(masterKeySecret).digest()
const orgKeyCache = new Map<string, { key: Buffer, expiresAt: number }>()

function parseEncryptedData(encryptedData: string) {
  const [version, ivHex, authTagHex, encryptedHex] = encryptedData.split(":")
  if (version !== "v1" || !ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted input format")
  }

  return { iv: Buffer.from(ivHex, "hex"), authTag: Buffer.from(authTagHex, "hex"), encrypted: Buffer.from(encryptedHex, "hex") }
}

function encryptWithKey(input: string, key: Buffer): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = Buffer.concat([cipher.update(input, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

function decryptWithKey(encryptedData: string, key: Buffer): string {
  const { iv, authTag, encrypted } = parseEncryptedData(encryptedData)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}

function wrapOrgKey(orgKey: Buffer): string {
  return encryptWithKey(orgKey.toString("hex"), wrappingKey)
}

function unwrapOrgKey(wrappedKey: string): Buffer {
  return Buffer.from(decryptWithKey(wrappedKey, wrappingKey), "hex")
}

function normalizeManualKey(manualKey: string): Buffer {
  return crypto.createHash("sha256").update(manualKey.trim(), "utf8").digest()
}

async function getOrgDataKey(orgId: string): Promise<Buffer> {
  const now = Date.now()
  const cached = orgKeyCache.get(orgId)
  if (cached && cached.expiresAt > now) {
    return cached.key
  }

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { wrappedEncryptionKey: true } })
  if (!org?.wrappedEncryptionKey) {
    throw new Error("Organization encryption key not found")
  }

  const key = unwrapOrgKey(org.wrappedEncryptionKey)
  orgKeyCache.set(orgId, { key, expiresAt: now + keyCacheTtlMs })
  return key
}

export function createWrappedOrganizationKey(manualKey?: string): string {
  const orgKey = manualKey ? normalizeManualKey(manualKey) : crypto.randomBytes(32)
  return wrapOrgKey(orgKey)
}

export async function rotateOrganizationKey(orgId: string, manualKey?: string) {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { wrappedEncryptionKey: true, encryptionKeyVersion: true } })
  if (!org?.wrappedEncryptionKey) {
    throw new Error("Organization encryption key not found")
  }

  const oldKey = unwrapOrgKey(org.wrappedEncryptionKey)
  const newKey = manualKey ? normalizeManualKey(manualKey) : crypto.randomBytes(32)

  const secretValues = await db.secretValue.findMany({ where: { secret: { project: { orgId } } }, select: { id: true, value: true } })
  const historyValues = await db.secretValueHistory.findMany({ where: { secretValue: { secret: { project: { orgId } } } }, select: { id: true, value: true } })

  const updates = [
    ...secretValues.map(sv => db.secretValue.update({
      where: { id: sv.id },
      data: { value: encryptWithKey(decryptWithKey(sv.value, oldKey), newKey) },
    })),
    ...historyValues.map(h => db.secretValueHistory.update({
      where: { id: h.id },
      data: { value: encryptWithKey(decryptWithKey(h.value, oldKey), newKey) },
    })),
    db.organization.update({
      where: { id: orgId },
      data: {
        wrappedEncryptionKey: wrapOrgKey(newKey),
        encryptionKeyVersion: org.encryptionKeyVersion + 1,
        encryptionKeyUpdatedAt: new Date(),
      },
    }),
  ]

  await db.$transaction(updates)
  orgKeyCache.set(orgId, { key: newKey, expiresAt: Date.now() + keyCacheTtlMs })
}

export async function encrypt(orgId: string, input: string): Promise<string> {
  try {
    const key = await getOrgDataKey(orgId)
    return encryptWithKey(input, key)
  }
  catch {
    throw new Error("Encryption failed")
  }
}

export async function decrypt(orgId: string, encryptedData: string): Promise<string> {
  try {
    const key = await getOrgDataKey(orgId)
    return decryptWithKey(encryptedData, key)
  }
  catch {
    throw new Error("Decryption failed")
  }
}
