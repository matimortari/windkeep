import { updateOrgSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  // Rate limit: 20 requests per hour per user
  await enforceRateLimit(event, `org:update:${sessionUser.id}`, 20)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER"])

  const body = await readBody(event)
  const result = updateOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const existingOrg = await db.organization.findUnique({
    where: { id: orgId },
    select: { name: true, description: true, website: true, encryptionKeyVersion: true, encryptionKeyUpdatedAt: true },
  })
  if (!existingOrg) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" })
  }

  await db.organization.update({
    where: { id: orgId },
    data: { name: result.data.name, description: result.data.description ?? null, website: result.data.website ?? null },
  })
  if (result.data.rotateEncryptionKey) {
    await rotateOrganizationKey(orgId, result.data.encryptionMode === "MANUAL" ? result.data.encryptionKey : undefined)
  }

  const updatedOrg = await db.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      description: true,
      website: true,
      encryptionKeyVersion: true,
      encryptionKeyUpdatedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const metadata: Record<string, unknown> = {}
  const changes: string[] = []
  if (existingOrg.name !== updatedOrg.name) {
    metadata.oldName = existingOrg.name
    metadata.newName = updatedOrg.name
    changes.push(`name to "${updatedOrg.name}"`)
  }
  if (existingOrg.description !== updatedOrg.description) {
    metadata.oldDescription = existingOrg.description
    metadata.newDescription = updatedOrg.description
    changes.push("description")
  }
  if (existingOrg.website !== updatedOrg.website) {
    metadata.oldWebsite = existingOrg.website
    metadata.newWebsite = updatedOrg.website
    changes.push("website")
  }
  if (result.data.rotateEncryptionKey) {
    metadata.rotatedEncryptionKey = true
    if (existingOrg.encryptionKeyVersion !== updatedOrg.encryptionKeyVersion) {
      metadata.oldEncryptionKeyVersion = existingOrg.encryptionKeyVersion
      metadata.newEncryptionKeyVersion = updatedOrg.encryptionKeyVersion
    }
    if (existingOrg.encryptionKeyUpdatedAt?.getTime() !== updatedOrg.encryptionKeyUpdatedAt?.getTime()) {
      metadata.oldEncryptionKeyUpdatedAt = existingOrg.encryptionKeyUpdatedAt
      metadata.newEncryptionKeyUpdatedAt = updatedOrg.encryptionKeyUpdatedAt
    }
    changes.push("encryption key rotated")
  }

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId,
    action: "UPDATE.ORG",
    resource: "organization",
    description: `Updated organization "${updatedOrg.name}"${changes.length ? ` (${changes.join(", ")})` : ""}`,
    metadata,
  })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { updatedOrg }
})

defineRouteMeta({
  openAPI: {
    summary: "Update organization",
    description: "Updates organization details. Optionally rotates the encryption key. Requires organization OWNER role.",
    tags: ["Organizations"],
    parameters: [{ in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string", description: "Organization description (optional)" },
              website: { type: "string", description: "Organization website (optional)" },
              rotateEncryptionKey: { type: "boolean", description: "Rotate encryption key" },
              encryptionMode: { type: "string", enum: ["AUTO", "MANUAL"], description: "Encryption mode" },
              encryptionKey: { type: "string", description: "Encryption key (required when encryptionMode is MANUAL)" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Updated organization" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Organization not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
