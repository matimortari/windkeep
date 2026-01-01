import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  const memberId = getRouterParam(event, "member")
  if (!orgId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID and Member ID are required" })
  }

  const targetRole = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: memberId, orgId } },
    include: {
      user: { select: { id: true, email: true, name: true } },
      org: { select: { id: true, name: true } },
    },
  })
  if (!targetRole) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in organization" })
  }

  // If self-removal, allow always but check for last owner
  if (memberId === user.id) {
    if (targetRole.role === "OWNER") {
      const ownerCount = await db.orgMembership.count({
        where: { orgId, role: "OWNER" },
      })
      if (ownerCount === 1) {
        throw createError({ statusCode: 400, statusMessage: "Cannot leave organization as the last owner." })
      }
    }
  }
  else {
    const userRole = await requireRole(user.id, { type: "organization", orgId }, ["OWNER", "ADMIN"])
    if (targetRole.role === "OWNER" && userRole.role !== "OWNER") {
      throw createError({ statusCode: 403, statusMessage: "Organization owners cannot be removed." })
    }
  }

  // Ensure no dangling active org
  if (targetRole.isActive) {
    await db.orgMembership.update({
      where: { userId_orgId: { userId: memberId, orgId } },
      data: { isActive: false },
    })

    // Switch to another org if possible
    const next = await db.orgMembership.findFirst({
      where: { userId: memberId, orgId: { not: orgId } },
      orderBy: { createdAt: "asc" },
    })

    if (next) {
      await db.orgMembership.update({
        where: { userId_orgId: { userId: memberId, orgId: next.orgId } },
        data: { isActive: true },
      })
    }
  }

  await db.orgMembership.delete({
    where: { userId_orgId: { userId: memberId, orgId } },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId,
    action: "REMOVE.ORG_MEMBER",
    resource: "organization_member",
    description: memberId === user.id ? `${targetRole.user.name} left organization "${targetRole.org.name}"` : `Removed ${targetRole.user.name} from organization "${targetRole.org.name}"`,
    metadata: {
      userId: targetRole.user.id,
      userEmail: targetRole.user.email,
      userName: targetRole.user.name,
      userRole: targetRole.role,
      selfRemoval: memberId === user.id,
      orgId: targetRole.org.id,
      orgName: targetRole.org.name,
    },
  })

  return { success: true, message: "Member removed successfully" }
})
