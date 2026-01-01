import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { updateMemberRoleSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  const memberId = getRouterParam(event, "member")
  if (!orgId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID and Member ID are required" })
  }

  const userMembership = await requireRole(user.id, { type: "organization", orgId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateMemberRoleSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  const targetRole = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: memberId, orgId } },
  })
  if (!targetRole) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in organization" })
  }

  // Prevent non-owners from promoting to owner or demoting an owner
  if (userMembership.role !== "OWNER" && (result.data.role === "OWNER" || targetRole.role === "OWNER")) {
    throw createError({ statusCode: 403, statusMessage: "You do not have permission to change this member's role." })
  }

  // Prevent users from changing their own role
  if (memberId === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role." })
  }

  // Prevent demoting the last owner
  if (targetRole.role === "OWNER" && result.data.role !== "OWNER") {
    const ownerCount = await db.orgMembership.count({
      where: { orgId, role: "OWNER" },
    })
    if (ownerCount === 1) {
      throw createError({ statusCode: 400, statusMessage: "Cannot demote the last owner." })
    }
  }

  const updatedMembership = await db.orgMembership.update({
    where: { userId_orgId: { userId: memberId, orgId } },
    data: { role: result.data.role },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
      org: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId,
    action: "UPDATE.ORG_MEMBER_ROLE",
    resource: "organization_member",
    description: `Updated ${updatedMembership.user.name} (${updatedMembership.user.email}) role from ${targetRole.role} to ${updatedMembership.role} in organization "${updatedMembership.org.name}"`,
    metadata: {
      userId: updatedMembership.user.id,
      userEmail: updatedMembership.user.email,
      userName: updatedMembership.user.name,
      oldRole: targetRole.role,
      newRole: updatedMembership.role,
      orgId: updatedMembership.org.id,
      orgName: updatedMembership.org.name,
    },
  })

  return { updatedMembership }
})
