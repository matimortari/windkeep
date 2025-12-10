import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  const member = getRouterParam(event, "member")
  if (!org || !member) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID and Member ID are required" })
  }

  const targetMembership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: member, orgId: org } },
    include: {
      user: { select: { id: true, email: true, name: true } },
      org: { select: { name: true } },
    },
  })
  if (!targetMembership) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in organization" })
  }

  // Self-removal logic
  if (member === user.id) {
    if (targetMembership.role === "OWNER") {
      const ownerCount = await db.orgMembership.count({
        where: { orgId: org, role: "OWNER" },
      })
      if (ownerCount === 1) {
        throw createError({ statusCode: 400, statusMessage: "Cannot leave organization as the last owner." })
      }
    }
  }
  else {
    const userRole = await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER", "ADMIN"])
    if (targetMembership.role === "OWNER" && userRole.role !== "OWNER") {
      throw createError({ statusCode: 403, statusMessage: "Organization owners cannot be removed." })
    }
  }

  // Ensure no dangling active org
  if (targetMembership.isActive) {
    await db.orgMembership.update({
      where: { userId_orgId: { userId: member, orgId: org } },
      data: { isActive: false },
    })

    // Switch to another org if possible
    const next = await db.orgMembership.findFirst({
      where: { userId: member, orgId: { not: org } },
      orderBy: { createdAt: "asc" },
    })

    if (next) {
      await db.orgMembership.update({
        where: { userId_orgId: { userId: member, orgId: next.orgId } },
        data: { isActive: true },
      })
    }
  }

  await db.orgMembership.delete({
    where: { userId_orgId: { userId: member, orgId: org } },
  })

  await createAuditLog({
    userId: user.id,
    orgId: org,
    action: "organization.member.removed",
    resource: "organization_member",
    metadata: {
      targetUserId: targetMembership.user.id,
      targetUserEmail: targetMembership.user.email,
      targetUserName: targetMembership.user.name,
      role: targetMembership.role,
      organizationName: targetMembership.org.name,
      selfRemoval: member === user.id,
    },
    description:
      member === user.id
        ? `${targetMembership.user.name} left organization "${targetMembership.org.name}"`
        : `Removed ${targetMembership.user.name} from organization "${targetMembership.org.name}"`,
    event,
  })

  return { success: true, message: "Member removed successfully" }
})
