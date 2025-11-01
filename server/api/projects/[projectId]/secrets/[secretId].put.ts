import db from "#server/lib/db"
import { encrypt } from "#server/lib/encryption"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { updateSecretSchema } from "#shared/lib/schemas/secret"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "projectId")
  const secretId = getRouterParam(event, "secretId")
  if (!projectId || !secretId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  await requireProjectRole(user.id, projectId, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateSecretSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: result.error.flatten().fieldErrors,
    })
  }

  const existingSecret = await db.secret.findUnique({
    where: { id: secretId },
    select: { projectId: true },
  })
  if (!existingSecret) {
    throw createError({ statusCode: 404, statusMessage: "Secret not found" })
  }
  if (existingSecret.projectId !== projectId) {
    throw createError({ statusCode: 403, statusMessage: "Secret does not belong to this project" })
  }

  const updateData: any = {}
  if (result.data.description !== undefined) {
    updateData.description = result.data.description
  }

  if (body.values && Array.isArray(body.values)) {
    for (const val of body.values) {
      if (!val.environment || !val.value) {
        continue
      }

      await db.secretValue.upsert({
        where: {
          secretId_environment: {
            secretId,
            environment: val.environment,
          },
        },
        update: {
          value: encrypt(val.value),
        },
        create: {
          secretId,
          environment: val.environment,
          value: encrypt(val.value),
        },
      })
    }
  }

  const updatedSecret = await db.secret.update({
    where: { id: secretId },
    data: updateData,
    include: {
      values: {
        select: {
          id: true,
          environment: true,
          createdAt: true,
          updatedAt: true,
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

  return updatedSecret
})
