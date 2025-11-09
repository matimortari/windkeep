import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { updateProjectMemberSchema } from "#shared/schemas/project-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  const member = getRouterParam(event, "member")
  if (!project || !member) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Member ID are required" })
  }

  const userRole = await requireProjectRole(user.id, project, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const targetRole = await db.projectRole.findUnique({
    where: { userId_projectId: { userId: member, projectId: project } },
  })
  if (!targetRole) {
    throw createError({ statusCode: 404, statusMessage: "Member not found in project" })
  }

  // Prevent non-owners from promoting to OWNER or demoting an OWNER
  if (userRole.role !== "OWNER" && (result.data.role === "OWNER" || targetRole.role === "OWNER")) {
    throw createError({ statusCode: 403, statusMessage: "You do not have permission to change this member's role." })
  }

  // Prevent users from changing their own role
  if (member === user.id) {
    throw createError({ statusCode: 400, statusMessage: "You cannot change your own role" })
  }

  if (targetRole.role === "OWNER" && result.data.role !== "OWNER") {
    const ownerCount = await db.projectRole.count({
      where: {
        projectId: project,
        role: "OWNER",
      },
    })
    if (ownerCount === 1) {
      throw createError({ statusCode: 400, statusMessage: "Cannot demote the last owner." })
    }
  }

  const updatedRole = await db.projectRole.update({
    where: { userId_projectId: { userId: member, projectId: project } },
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
          organizationId: true,
        },
      },
    },
  })

  await createAuditLog({
    userId: user.id,
    organizationId: updatedRole.project.organizationId,
    projectId: project,
    action: "project.member.role_updated",
    resource: "project_member",
    metadata: {
      targetUserId: updatedRole.user.id,
      targetUserEmail: updatedRole.user.email,
      targetUserName: updatedRole.user.name,
      oldRole: targetRole.role,
      newRole: updatedRole.role,
      projectName: updatedRole.project.name,
    },
    description: `Updated ${updatedRole.user.name} (${updatedRole.user.email}) role from ${targetRole.role} to ${updatedRole.role} in project "${updatedRole.project.name}"`,
    event,
  })

  return updatedRole
})
