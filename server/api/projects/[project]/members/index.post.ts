import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession, requireRole } from "#server/lib/utils"
import { addProjectMemberSchema } from "#shared/schemas/project-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = addProjectMemberSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      orgId: true,
    },
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  const targetUser = await db.user.findUnique({
    where: { id: result.data.userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  })
  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: "User not found" })
  }

  const orgMembership = await db.orgMembership.findUnique({
    where: {
      userId_orgId: {
        userId: result.data.userId,
        orgId: project.orgId,
      },
    },
  })
  if (!orgMembership) {
    throw createError({ statusCode: 403, statusMessage: "User must be a member of the organization first" })
  }

  const existingRole = await db.projectMembership.findUnique({
    where: {
      userId_projectId: {
        userId: result.data.userId,
        projectId,
      },
    },
  })
  if (existingRole) {
    throw createError({ statusCode: 409, statusMessage: "User is already a member of this project" })
  }

  const projectRole = await db.projectMembership.create({
    data: {
      userId: result.data.userId,
      projectId,
      role: result.data.role || "MEMBER",
    },
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

  await createAuditLog({
    userId: user.id,
    orgId: project.orgId,
    projectId,
    action: "project.member.added",
    resource: "project_member",
    metadata: {
      targetUserId: projectRole.user.id,
      targetUserEmail: projectRole.user.email,
      targetUserName: projectRole.user.name,
      role: projectRole.role,
      projectName: projectRole.project.name,
    },
    description: `Added ${projectRole.user.name} (${projectRole.user.email}) as ${projectRole.role} to project "${projectRole.project.name}"`,
    event,
  })

  return projectRole
})
