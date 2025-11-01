import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, org, ["OWNER"])

  // Delete all pending invitations
  await db.invitation.deleteMany({
    where: { organizationId: org },
  })

  // Delete the organization (cascade will handle projects, memberships and audit logs)
  await db.organization.delete({
    where: { id: org },
  })

  return { success: true, message: "Organization deleted successfully" }
})
