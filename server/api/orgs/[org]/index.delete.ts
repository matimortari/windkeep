import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER"])

  // Clear active memberships for users who had this org active
  await db.orgMembership.updateMany({
    where: { orgId: org, isActive: true },
    data: { isActive: false },
  })

  // Delete invitations
  await db.invitation.deleteMany({
    where: { orgId: org },
  })

  await db.organization.delete({
    where: { id: org },
  })

  return { success: true, message: "Organization deleted successfully" }
})
