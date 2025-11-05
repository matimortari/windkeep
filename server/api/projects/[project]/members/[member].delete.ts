import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  const member = getRouterParam(event, "member")

  if (!project || !member) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Member ID are required" })
  }

  // Check if the member exists in the project
  const targetRole = await db.projectRole.findUnique({
    where: { userId_projectId: { userId: member, projectId: project } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          organizationId: true,
        },
      },
    },
  })

  if (!targetRole) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }

  // Allow self-removal (unless user is last owner)
  if (member === user.id) {
    if (targetRole.role === "OWNER") {
      const ownerCount = await db.projectRole.count({
        where: {
          projectId: project,
          role: "OWNER",
        },
      })
      if (ownerCount === 1) {
        throw createError({ statusCode: 400, statusMessage: "Cannot leave project as the last owner." })
      }
    }
  }
  else {
    const userRole = await requireProjectRole(user.id, project, ["OWNER", "ADMIN"])
    if (userRole.role !== "OWNER" && targetRole.role === "OWNER") {
      throw createError({ statusCode: 403, statusMessage: "Only owners can remove other owners" })
    }
  }

  await db.projectRole.delete({
    where: { userId_projectId: { userId: member, projectId: project } },
  })

  await createAuditLog({
    userId: user.id,
    organizationId: targetRole.project.organizationId,
    projectId: project,
    action: "project.member.removed",
    resource: "project_member",
    metadata: {
      targetUserId: targetRole.user.id,
      targetUserEmail: targetRole.user.email,
      targetUserName: targetRole.user.name,
      role: targetRole.role,
      projectName: targetRole.project.name,
      selfRemoval: member === user.id,
    },
    description: member === user.id
      ? `${targetRole.user.name} (${targetRole.user.email}) left project "${targetRole.project.name}"`
      : `Removed ${targetRole.user.name} (${targetRole.user.email}) from project "${targetRole.project.name}"`,
    event,
  })

  return { success: true, message: "Member removed successfully" }
})
