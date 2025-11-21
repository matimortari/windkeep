import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"
import { updateMemberRoleSchema } from "#shared/schemas/org-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  const member = getRouterParam(event, "member")

  if (!org || !member) {
    throw createError({
      statusCode: 400,
      statusMessage: "Organization ID and Member ID are required",
    })
  }

  const userMembership = await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateMemberRoleSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const targetMembership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: member, orgId: org } },
  })
  if (!targetMembership) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in organization" })
  }

  // Prevent non-owners from promoting to OWNER or demoting an OWNER
  if (userMembership.role !== "OWNER" && (result.data.role === "OWNER" || targetMembership.role === "OWNER")) {
    throw createError({ statusCode: 403, statusMessage: "You do not have permission to change this member's role." })
  }

  // Prevent users from changing their own role
  if (member === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role." })
  }

  // Prevent demoting the last OWNER
  if (targetMembership.role === "OWNER" && result.data.role !== "OWNER") {
    const ownerCount = await db.orgMembership.count({
      where: { orgId: org, role: "OWNER" },
    })
    if (ownerCount === 1) {
      throw createError({ statusCode: 400, statusMessage: "Cannot demote the last owner." })
    }
  }

  const updatedMembership = await db.orgMembership.update({
    where: { userId_orgId: { userId: member, orgId: org } },
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
      org: { select: { name: true } },
    },
  })

  await createAuditLog({
    userId: user.id,
    orgId: org,
    action: "organization.member.role_updated",
    resource: "organization_member",
    metadata: {
      targetUserId: updatedMembership.user.id,
      targetUserEmail: updatedMembership.user.email,
      targetUserName: updatedMembership.user.name,
      oldRole: targetMembership.role,
      newRole: updatedMembership.role,
      organizationName: updatedMembership.org.name,
    },
    description: `Updated ${updatedMembership.user.name} (${updatedMembership.user.email}) role from ${targetMembership.role} to ${updatedMembership.role} in organization "${updatedMembership.org.name}"`,
    event,
  })

  return updatedMembership
})
