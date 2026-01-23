import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId }, ["OWNER"])

  // Clear active memberships for users who had this org active
  await db.orgMembership.updateMany({
    where: { orgId, isActive: true },
    data: { isActive: false },
  })

  // Delete invitations
  await db.invitation.deleteMany({
    where: { orgId },
  })

  await db.organization.delete({
    where: { id: orgId },
  })

  return { success: true, message: "Organization deleted successfully" }
})
