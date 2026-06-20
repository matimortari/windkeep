export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 5 requests per hour per user
  await enforceRateLimit(event, `org:delete:${sessionUser.id}`, 5)
  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER"])

  const org = await db.organization.findUnique({ where: { id: orgId }, select: { id: true, name: true } })
  if (!org) {
    throw createError({ status: 404, statusText: "Organization not found" })
  }

  // Delete the organization (cascade will handle related records)
  await db.organization.delete({ where: { id: orgId } })

  await deleteCached(CacheKeys.userData(sessionUser.id), CacheKeys.userProjects(sessionUser.id, orgId))

  return { success: true, message: "Organization deleted successfully" }
})

defineRouteMeta({
  openAPI: {
    summary: "Delete organization",
    description: "Permanently deletes the organization and all related data. Requires OWNER role.",
    tags: ["Organizations"],
    parameters: [{ in: "path", name: "org", required: true, schema: { type: "string" }, description: "Organization ID" }],
    responses: {
      200: { description: "Organization deleted" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role — requires OWNER" },
      404: { description: "Organization not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
