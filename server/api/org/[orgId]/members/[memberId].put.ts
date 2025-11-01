import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"
import { updateMemberRoleSchema } from "#shared/lib/schemas/org"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "orgId")
  const memberId = getRouterParam(event, "memberId")
  if (!orgId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID and Member ID are required" })
  }

  const userMembership = await requireOrgRole(user.id, orgId, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateMemberRoleSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const targetMembership = await db.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: memberId, organizationId: orgId } },
  })
  if (!targetMembership) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in organization" })
  }

  // Prevent non-owners from promoting to OWNER or demoting an OWNER
  if (userMembership.role !== "OWNER" && (result.data.role === "OWNER" || targetMembership.role === "OWNER")) {
    throw createError({ statusCode: 403, statusMessage: "You do not have permission to change this member's role." })
  }
  if (memberId === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role." })
  }

  if (targetMembership.role === "OWNER" && result.data.role !== "OWNER") {
    const ownerCount = await db.organizationMembership.count({
      where: { organizationId: orgId, role: "OWNER" },
    })
    if (ownerCount === 1) {
      throw createError({ statusCode: 400, statusMessage: "Cannot demote the last owner." })
    }
  }

  const updatedMembership = await db.organizationMembership.update({
    where: { userId_organizationId: { userId: memberId, organizationId: orgId } },
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
    },
  })

  return updatedMembership
})
