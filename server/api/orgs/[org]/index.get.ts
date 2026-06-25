export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 200 requests per hour per user
  await enforceRateLimit(event, `org:switch:${sessionUser.id}`, 200)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER", "ADMIN", "MEMBER"])

  // Set this org as active and deactivate others
  await db.$transaction([
    db.orgMembership.updateMany({ where: { userId: sessionUser.id, isActive: true }, data: { isActive: false } }),
    db.orgMembership.update({ where: { userId_orgId: { userId: sessionUser.id, orgId } }, data: { isActive: true } }),
  ])

  const membership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: sessionUser.id, orgId } },
    select: {
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
    },
  })
  if (!membership) {
    throw createError({ status: 404, statusText: "Organization not found" })
  }

  await deleteCached(CacheKeys.userData(sessionUser.id), CacheKeys.userProjects(sessionUser.id, orgId))

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
