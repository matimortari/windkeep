import { createOrgSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const organization = await db.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: result.data.name, memberships: { create: { userId: user.id, role: "OWNER", isActive: true } } },
    })

    // Deactivate all other orgs for the user
    await tx.orgMembership.updateMany({
      where: { userId: user.id, orgId: { not: org.id }, isActive: true },
      data: { isActive: false },
    })

    return tx.organization.findUniqueOrThrow({ where: { id: org.id } })
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: organization.id,
    action: "CREATE.ORG",
    resource: "organization",
    description: `Created organization "${organization.name}"`,
    metadata: {
      orgId: organization.id,
      orgName: organization.name,
    },
  })

  // Invalidate cache for user data
  await deleteCached(CacheKeys.userData(user.id))

  return { organization }
})
