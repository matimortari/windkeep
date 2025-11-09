import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { decrypt, encrypt } from "#server/lib/encryption"
import { getUserFromSession, requireProjectRole } from "#server/lib/utils"
import { updateSecretSchema } from "#shared/schemas/secret-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  const secret = getRouterParam(event, "secret")
  if (!project || !secret) {
    throw createError({ statusCode: 400, statusMessage: "Project ID and Secret ID are required" })
  }

  await requireProjectRole(user.id, project, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = updateSecretSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const existingSecret = await db.secret.findUnique({
    where: { id: secret },
    select: {
      projectId: true,
      key: true,
      description: true,
    },
  })
  if (!existingSecret) {
    throw createError({ statusCode: 404, statusMessage: "Secret not found" })
  }
  if (existingSecret.projectId !== project) {
    throw createError({ statusCode: 403, statusMessage: "Secret does not belong to this project" })
  }

  const updateData: any = {}
  if (result.data.description !== undefined) {
    updateData.description = result.data.description
  }

  if (result.data.values && Array.isArray(result.data.values)) {
    for (const val of result.data.values) {
      if (!val.environment || !val.value) {
        continue
      }

      await db.secretValue.upsert({
        where: {
          secretId_environment: {
            secretId: secret,
            environment: val.environment,
          },
        },
        update: {
          value: encrypt(val.value),
        },
        create: {
          secretId: secret,
          environment: val.environment,
          value: encrypt(val.value),
        },
      })
    }
  }

  const updatedSecret = await db.secret.update({
    where: { id: secret },
    data: updateData,
    include: {
      values: true,
      project: {
        select: {
          id: true,
          name: true,
          organizationId: true,
        },
      },
    },
  })

  const changes = []
  if (result.data.description !== undefined && result.data.description !== existingSecret.description) {
    changes.push("description")
  }
  if (result.data.values && result.data.values.length > 0) {
    changes.push(`${result.data.values.length} environment value(s)`)
  }

  await createAuditLog({
    userId: user.id,
    organizationId: updatedSecret.project.organizationId,
    projectId: project,
    action: "secret.updated",
    resource: "secret",
    metadata: {
      secretId: updatedSecret.id,
      secretKey: updatedSecret.key,
      projectName: updatedSecret.project.name,
      changedFields: changes,
      updatedEnvironments: result.data.values?.map(v => v.environment) || [],
    },
    description: `Updated secret "${updatedSecret.key}" in project "${updatedSecret.project.name}" (${changes.join(", ")})`,
    event,
  })

  return {
    ...updatedSecret,
    values: updatedSecret.values.map(val => ({
      ...val,
      value: decrypt(val.value),
    })),
  }
})
