import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  const member = getRouterParam(event, "member")
  if (!org || !member) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID and Member ID are required" })
  }

  const targetMembership = await db.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: member, organizationId: org } },
  })
  if (!targetMembership) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in organization" })
  }

  // Allow self-removal (unless user is last owner)
  if (member === user.id) {
    const membership = await db.organizationMembership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: org } },
    })
    if (membership?.role === "OWNER") {
      const ownerCount = await db.organizationMembership.count({
        where: { organizationId: org, role: "OWNER" },
      })
      if (ownerCount === 1) {
        throw createError({ statusCode: 400, statusMessage: "Cannot leave organization as the last owner." })
      }
    }
  }
  else {
    const userRole = await requireOrgRole(user.id, org, ["OWNER", "ADMIN"])
    if (targetMembership.role === "OWNER" && userRole.role !== "OWNER") {
      throw createError({ statusCode: 403, statusMessage: "Organization owners cannot be removed." })
    }
  }

  await db.organizationMembership.delete({
    where: { userId_organizationId: { userId: member, organizationId: org } },
  })

  return { success: true, message: "Member removed successfully" }
})
