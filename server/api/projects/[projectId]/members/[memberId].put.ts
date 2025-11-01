import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { updateProjectMemberSchema } from "#shared/lib/schemas/project"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "projectId")
  const memberId = getRouterParam(event, "memberId")
  if (!projectId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Member ID are required" })
  }

  const userRole = await requireProjectRole(user.id, projectId, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const targetRole = await db.projectRole.findUnique({
    where: { userId_projectId: { userId: memberId, projectId } },
  })
  if (!targetRole) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }

  // Prevent non-owners from promoting to OWNER or demoting an OWNER
  if (userRole.role !== "OWNER" && (result.data.role === "OWNER" || targetRole.role === "OWNER")) {
    throw createError({ statusCode: 403, statusMessage: "You do not have permission to change this member's role." })
  }

  // Prevent users from changing their own role
  if (memberId === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role" })
  }

  if (targetRole.role === "OWNER" && result.data.role !== "OWNER") {
    const ownerCount = await db.projectRole.count({
      where: {
        projectId,
        role: "OWNER",
      },
    })
    if (ownerCount === 1) {
      throw createError({ statusCode: 400, statusMessage: "Cannot demote the last owner." })
    }
  }

  const updatedRole = await db.projectRole.update({
    where: { userId_projectId: { userId: memberId, projectId } },
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
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return updatedRole
})
