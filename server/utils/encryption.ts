import { Buffer } from "node:buffer"
import crypto from "node:crypto"

export function parseEncryptedData(encryptedData: string) {
  const [version, ivHex, authTagHex, encryptedHex] = encryptedData.split(":")
  if (version !== "v1" || !ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted input format")
  }

  return { iv: Buffer.from(ivHex, "hex"), authTag: Buffer.from(authTagHex, "hex"), encrypted: Buffer.from(encryptedHex, "hex") }
}

export function encryptWithKey(input: string, key: Buffer | Uint8Array): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(input, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `v1:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decryptWithKey(encryptedData: string, key: Buffer | Uint8Array): string {
  const { iv, authTag, encrypted } = parseEncryptedData(encryptedData)
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString("utf8")
}

function wrapOrgKey(orgKey: Buffer): string {
  return encryptWithKey(orgKey.toString("hex"), crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY!).digest())
}

function unwrapOrgKey(wrappedKey: string): Buffer {
  return Buffer.from(decryptWithKey(wrappedKey, crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY!).digest()), "hex")
}

function normalizeManualKey(manualKey: string): Buffer {
  return crypto.pbkdf2Sync(manualKey.trim(), crypto.createHash("sha256").update(process.env.ENCRYPTION_KEY!).digest(), 310_000, 32, "sha256")
}

export async function getOrgDataKey(orgId: string): Promise<Buffer> {
  const [org] = await db.$queryRaw<{ wrappedEncryptionKey: string | null }[]>`SELECT "wrappedEncryptionKey" FROM "Organization" WHERE id = ${orgId} FOR SHARE`
  if (!org?.wrappedEncryptionKey) {
    throw new Error("Organization encryption key not found")
  }
  return unwrapOrgKey(org.wrappedEncryptionKey)
}

export function createWrappedOrganizationKey(manualKey?: string): string {
  return wrapOrgKey(manualKey ? normalizeManualKey(manualKey) : crypto.randomBytes(32))
}

export async function rotateOrganizationKey(orgId: string, manualKey?: string) {
  const newKey = manualKey ? normalizeManualKey(manualKey) : crypto.randomBytes(32)

  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT id FROM "Organization" WHERE id = ${orgId} FOR UPDATE`
    const org = await tx.organization.findUnique({ where: { id: orgId }, select: { wrappedEncryptionKey: true, encryptionKeyVersion: true } })
    if (!org?.wrappedEncryptionKey) {
      throw new Error("Organization encryption key not found")
    }

    const oldKey = unwrapOrgKey(org.wrappedEncryptionKey)
    const secretValues = await tx.secretValue.findMany({ where: { secret: { project: { orgId } } }, select: { id: true, value: true } })
    const historyValues = await tx.secretValueHistory.findMany({ where: { secretValue: { secret: { project: { orgId } } } }, select: { id: true, value: true } })

    await Promise.all([
      ...secretValues.map(sv => tx.secretValue.update({
        where: { id: sv.id },
        data: { value: encryptWithKey(decryptWithKey(sv.value, oldKey), newKey) },
      })),
      ...historyValues.map(h => tx.secretValueHistory.update({
        where: { id: h.id },
        data: { value: encryptWithKey(decryptWithKey(h.value, oldKey), newKey) },
      })),
      tx.organization.update({
        where: { id: orgId },
        data: {
          wrappedEncryptionKey: wrapOrgKey(newKey),
          encryptionKeyVersion: org.encryptionKeyVersion + 1,
          encryptionKeyUpdatedAt: new Date(),
        },
      }),
    ])
  }, { isolationLevel: "Serializable" })
}
