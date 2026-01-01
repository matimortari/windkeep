import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { updateProjectMemberSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  const memberId = getRouterParam(event, "member")
  if (!projectId || !memberId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Member ID are required" })
  }

  const userRole = await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
  }

  const targetRole = await db.projectMembership.findUnique({
    where: { userId_projectId: { userId: memberId, projectId } },
  })
  if (!targetRole) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }

  // Prevent non-owners from promoting to owner or demoting an owner
  if (userRole.role !== "OWNER" && (result.data.role === "OWNER" || targetRole.role === "OWNER")) {
    throw createError({ statusCode: 403, statusMessage: "You do not have permission to change this member's role." })
  }

  // Prevent users from changing their own role
  if (memberId === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role" })
  }

  // Prevent demoting the last owner
  if (targetRole.role === "OWNER" && result.data.role !== "OWNER") {
    const ownerCount = await db.projectMembership.count({
      where: {
        projectId,
        role: "OWNER",
      },
    })
    if (ownerCount === 1) {
      throw createError({ statusCode: 400, statusMessage: "Cannot demote the last owner." })
    }
  }

  const updatedRole = await db.projectMembership.update({
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
          org: { select: { id: true, name: true } },
        },
      },
    },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: updatedRole.project.org.id,
    projectId,
    action: "UPDATE.PROJECT_MEMBER_ROLE",
    resource: "project_member",
    description: `Updated ${updatedRole.user.name} (${updatedRole.user.email}) role from ${targetRole.role} to ${updatedRole.role} in project "${updatedRole.project.name}"`,
    metadata: {
      userId: updatedRole.user.id,
      userEmail: updatedRole.user.email,
      userName: updatedRole.user.name,
      oldRole: targetRole.role,
      newRole: updatedRole.role,
      projectId: updatedRole.project.id,
      projectName: updatedRole.project.name,
      orgId: updatedRole.project.org.id,
      orgName: updatedRole.project.org.name,
    },
  })

  return { updatedRole }
})
