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

  await requireRole(user.id, { type: "organization", orgId }, ["OWNER", "ADMIN"])

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

  // Prevent changing OWNER roles
  if (targetRole.role === "OWNER") {
    throw createError({ statusCode: 403, statusMessage: "Cannot change the role of organization owners" })
  }

  // Prevent users from changing their own role
  if (memberId === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role" })
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
