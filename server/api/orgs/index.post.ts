import { createOrgSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 10 requests per hour per user
  await enforceRateLimit(event, `org:create:${sessionUser.id}`, 10)

  const body = await readBody(event)
  const result = createOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const organization = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: result.data.name,
        description: result.data.description || null,
        website: result.data.website || null,
        wrappedEncryptionKey: createWrappedOrganizationKey(result.data.encryptionMode === "MANUAL" ? result.data.encryptionKey : undefined),
        memberships: { create: { userId: sessionUser.id, role: "OWNER", isActive: true } },
      },
    })

    // Deactivate all other orgs for the user
    await tx.orgMembership.updateMany({ where: { userId: sessionUser.id, orgId: { not: org.id }, isActive: true }, data: { isActive: false } })

    return tx.organization.findUniqueOrThrow({
      where: { id: org.id },
      select: { id: true, name: true, description: true, website: true, encryptionKeyVersion: true, encryptionKeyUpdatedAt: true, createdAt: true, updatedAt: true },
    })
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: organization.id,
    action: "CREATE.ORG",
    resource: "organization",
    description: `Created organization "${organization.name}"`,
    metadata: {
      orgId: organization.id,
      orgName: organization.name,
    },
  })

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { organization }
})

defineRouteMeta({
  openAPI: {
    summary: "Create organization",
    description: "Creates a new organization and sets the creator as OWNER. Deactivates all other org memberships for the user.",
    tags: ["Organizations"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["name"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              website: { type: "string" },
              encryptionMode: { type: "string", enum: ["AUTO", "MANUAL"] },
              encryptionKey: { type: "string", description: "Required when encryptionMode is MANUAL" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Organization created" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
