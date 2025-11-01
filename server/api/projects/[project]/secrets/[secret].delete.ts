import db from "#server/lib/db"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  const secret = getRouterParam(event, "secret")
  if (!project || !secret) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  await requireProjectRole(user.id, project, ["OWNER", "ADMIN"])

  const secretData = await db.secret.findUnique({
    where: { id: secret },
    select: {
      id: true,
      key: true,
      projectId: true,
      _count: {
        select: {
          values: true,
        },
      },
    },
  })
  if (!secretData) {
    throw createError({ statusCode: 404, statusMessage: "Secret not found" })
  }
  if (secretData.projectId !== project) {
    throw createError({ statusCode: 403, statusMessage: "Secret does not belong to this project" })
  }

  // Delete the secret (cascade will handle secret values)
  await db.secret.delete({
    where: { id: secret },
  })

  return {
    success: true,
    message: `Secret "${secretData.key}" deleted successfully`,
    valuesDeleted: secretData._count.values,
  }
})
