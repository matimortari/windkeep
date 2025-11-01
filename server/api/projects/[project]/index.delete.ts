import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireProjectRole(user.id, project, ["OWNER"])

  const projectData = await db.project.findUnique({
    where: { id: project },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          secrets: true,
        },
      },
    },
  })
  if (!projectData) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  // Delete the project (cascade will handle secrets, secret values, roles, and audit logs)
  await db.project.delete({
    where: { id: project },
  })

  return {
    success: true,
    message: `Project "${projectData.name}" deleted successfully`,
    secretsDeleted: projectData._count.secrets,
  }
})
