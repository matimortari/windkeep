import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "orgId")
  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireOrgRole(user.id, orgId, ["OWNER"])

  // Delete all pending invitations
  await db.invitation.deleteMany({
    where: { organizationId: orgId },
  })

  // Delete the organization (cascade will handle projects, memberships and audit logs)
  await db.organization.delete({
    where: { id: orgId },
  })

  return { success: true, message: "Organization deleted successfully" }
})
