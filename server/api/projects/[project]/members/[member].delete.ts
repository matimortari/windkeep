import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const memberId = getRouterParam(event, "member")
  if (!projectId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Member ID are required" })
  }

  const targetRole = await db.projectMembership.findUnique({
    where: { userId_projectId: { userId: memberId, projectId } },
    include: {
      user: { select: { id: true, email: true, name: true } },
      project: { select: { id: true, name: true, org: { select: { id: true, name: true } } } },
    },
  })
  if (!targetRole) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }

  // If self-removal, allow always but check for last owner
  if (memberId === user.id) {
    if (targetRole.role === "OWNER") {
      const ownerCount = await db.projectMembership.count({
        where: { projectId, role: "OWNER" },
      })
      if (ownerCount === 1) {
        throw createError({ statusCode: 400, statusMessage: "Cannot leave project as the last owner." })
      }
    }
  }
  else {
    const userRole = await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])
    if (userRole.role !== "OWNER" && targetRole.role === "OWNER") {
      throw createError({ statusCode: 403, statusMessage: "Only owners can remove other owners" })
    }
  }

  await db.projectMembership.delete({
    where: { userId_projectId: { userId: memberId, projectId } },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: targetRole.project.org.id,
    projectId,
    action: "REMOVE.PROJECT_MEMBER",
    resource: "project_member",
    description: memberId === user.id ? `${targetRole.user.name} (${targetRole.user.email}) left project "${targetRole.project.name}"` : `Removed ${targetRole.user.name} (${targetRole.user.email}) from project "${targetRole.project.name}"`,
    metadata: {
      userId: targetRole.user.id,
      userEmail: targetRole.user.email,
      userName: targetRole.user.name,
      userRole: targetRole.role,
      selfRemoval: memberId === user.id,
      projectId: targetRole.project.id,
      projectName: targetRole.project.name,
      orgId: targetRole.project.org.id,
      orgName: targetRole.project.org.name,
    },
  })

  return { success: true, message: "Member removed successfully" }
})
