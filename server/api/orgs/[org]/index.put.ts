import { updateOrgSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  // Rate limit: 20 requests per hour per user
  await enforceRateLimit(event, `org:update:${user.id}`, 20)

  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "org", orgId }, ["OWNER"])

  const body = await readBody(event)
  const result = updateOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingOrg = await db.organization.findUnique({
    where: { id: orgId },
    select: { name: true, description: true, website: true, encryptionKeyVersion: true, encryptionKeyUpdatedAt: true },
  })
  if (!existingOrg) {
    throw createError({ status: 404, statusText: "Organization not found" })
  }

  await db.organization.update({ where: { id: orgId }, data: {
    name: result.data.name,
    description: result.data.description || null,
    website: result.data.website || null,
  } })
  if (result.data.rotateEncryptionKey) {
    await rotateOrganizationKey(orgId, result.data.encryptionMode === "MANUAL" ? result.data.encryptionKey : undefined)
  }

  const updatedOrg = await db.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { id: true, name: true, description: true, website: true, encryptionKeyVersion: true, encryptionKeyUpdatedAt: true, createdAt: true, updatedAt: true },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId,
    action: "UPDATE.ORG",
    resource: "organization",
    description: `Updated organization "${updatedOrg.name}"`,
    metadata: {
      orgId,
      oldName: existingOrg.name,
      newName: updatedOrg.name,
      oldDescription: existingOrg.description,
      newDescription: updatedOrg.description,
      oldWebsite: existingOrg.website,
      newWebsite: updatedOrg.website,
      rotatedEncryptionKey: Boolean(result.data.rotateEncryptionKey),
      oldEncryptionKeyVersion: existingOrg.encryptionKeyVersion,
      newEncryptionKeyVersion: updatedOrg.encryptionKeyVersion,
      oldEncryptionKeyUpdatedAt: existingOrg.encryptionKeyUpdatedAt,
      newEncryptionKeyUpdatedAt: updatedOrg.encryptionKeyUpdatedAt,
    },
  })

  return { updatedOrg }
})
