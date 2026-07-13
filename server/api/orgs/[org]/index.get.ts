export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `org:switch:${sessionUser.id}`, 200)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN", "MEMBER"])

  const membershipSelect = {
    role: true,
    isActive: true,
    org: {
      select: {
        id: true,
        name: true,
        description: true,
        website: true,
        encryptionKeyVersion: true,
        encryptionKeyUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            userId: true,
            role: true,
            isActive: true,
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    },
  } as const

  let membership = await db.orgMembership.findUnique({ where: { userId_orgId: { userId: sessionUser.id, orgId } }, select: membershipSelect })
  if (!membership) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" })
  }

  // Only write when switching to a new org or refreshing the current org
  if (!membership.isActive) {
    await db.$transaction(async (tx) => {
      await tx.orgMembership.updateMany({ where: { userId: sessionUser.id, isActive: true }, data: { isActive: false } })
      await tx.orgMembership.update({ where: { userId_orgId: { userId: sessionUser.id, orgId } }, data: { isActive: true } })
    })

    await deleteCached(CacheKeys.userData(sessionUser.id), CacheKeys.userProjects(sessionUser.id))

    membership = await db.orgMembership.findUniqueOrThrow({ where: { userId_orgId: { userId: sessionUser.id, orgId } }, select: membershipSelect })
  }

  return { organization: { ...membership.org, role: membership.role, isActive: membership.isActive } }
})

defineRouteMeta({
  openAPI: {
    summary: "Get organization details",
    description: "Switches the active organization to the given one and returns its details and full membership list.",
    tags: ["Organizations"],
    parameters: [{ in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" }],
    responses: {
      200: { description: "Organization details, memberships, and current user role" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Organization not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
