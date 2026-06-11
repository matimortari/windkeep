export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  // Rate limit: 5 requests per hour per user
  await enforceRateLimit(event, `org:delete:${sessionUser.id}`, 5)

  await requireRole(sessionUser.id, { type: "org", orgId }, ["OWNER"])

  await db.orgMembership.updateMany({ where: { orgId, isActive: true }, data: { isActive: false } })
  await db.invitation.deleteMany({ where: { orgId } })
  await db.organization.delete({ where: { id: orgId } })

  return { success: true, message: "Organization deleted successfully" }
})
