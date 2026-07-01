export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  // Rate limit: 5 requests per hour per user
  await enforceRateLimit(event, `org:delete:${sessionUser.id}`, 5)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER"])

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true } })
  if (!org) {
    throw createError({ statusCode: 404, statusMessage: "Organization not found" })
  }

  // Delete the organization (cascade will handle related records)
  await db.organization.delete({ where: { id: orgId } })

  await deleteCached(CacheKeys.userData(sessionUser.id), CacheKeys.userProjects(sessionUser.id))

  return { success: true, message: "Organization deleted successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Delete organization",
    description: "Deletes the organization and all related data. Requires organization OWNER role.",
    tags: ["Organizations"],
    parameters: [{ in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" }],
    responses: {
      200: { description: "Organization deleted" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Organization not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
