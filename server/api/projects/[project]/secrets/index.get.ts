import db from "#server/lib/db"
import { decrypt } from "#server/lib/encryption"
import { getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId: project }, ["OWNER", "ADMIN", "MEMBER"])

  const secrets = await db.secret.findMany({
    where: { projectId: project },
    include: {
      values: {
        orderBy: {
          environment: "asc",
        },
      },
      project: true,
    },
    orderBy: {
      key: "asc",
    },
  })

  const decryptedSecrets = secrets.map(secret => ({
    ...secret,
    values: secret.values.map(val => ({
      ...val,
      value: decrypt(val.value),
    })),
  }))

  return decryptedSecrets
})
