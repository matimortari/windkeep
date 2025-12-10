import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  const secret = getRouterParam(event, "secret")
  if (!project || !secret) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  await requireRole(user.id, { type: "project", projectId: project }, ["OWNER", "ADMIN"])

  const secretData = await db.secret.findUnique({
    where: { id: secret },
    select: {
      id: true,
      key: true,
      projectId: true,
      project: {
        select: {
          name: true,
          orgId: true,
        },
      },
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

  await createAuditLog({
    userId: user.id,
    orgId: secretData.project.orgId,
    projectId: project,
    action: "secret.deleted",
    resource: "secret",
    metadata: {
      secretId: secretData.id,
      secretKey: secretData.key,
      projectName: secretData.project.name,
      valuesDeleted: secretData._count.values,
    },
    description: `Deleted secret "${secretData.key}" from project "${secretData.project.name}" (${secretData._count.values} value(s) deleted)`,
    event,
  })

  return {
    success: true,
    message: `Secret "${secretData.key}" deleted successfully`,
    valuesDeleted: secretData._count.values,
  }
})
