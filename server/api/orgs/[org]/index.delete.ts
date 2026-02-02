import db from "#server/utils/db"
import { getUserFromSession, requireRole } from "#server/utils/helpers"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "org", orgId }, ["OWNER"])

  await db.orgMembership.updateMany({ where: { orgId, isActive: true }, data: { isActive: false } })
  await db.invitation.deleteMany({ where: { orgId } })
  await db.organization.delete({ where: { id: orgId } })

  return { success: true, message: "Organization deleted successfully" }
})
