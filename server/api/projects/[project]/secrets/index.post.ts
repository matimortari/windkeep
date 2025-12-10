import db from "#server/lib/db"
import { decrypt, encrypt } from "#server/lib/encryption"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { createSecretSchema } from "#shared/schemas/secret-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId: project }, ["OWNER", "ADMIN"])

  const body = await readBody(event)
  const result = createSecretSchema.safeParse({
    ...body,
    projectId: project,
  })
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const existingSecret = await db.secret.findUnique({
    where: {
      key_projectId: {
        key: result.data.key,
        projectId: project,
      },
    },
  })
  if (existingSecret) {
    throw createError({ statusCode: 409, statusMessage: "A secret with this key already exists in the project" })
  }

  const secretData: any = {
    key: result.data.key,
    description: result.data.description,
    projectId: project,
  }

  if (result.data.values && Array.isArray(result.data.values)) {
    secretData.values = {
      create: result.data.values.map((val: any) => ({
        environment: val.environment,
        value: encrypt(val.value),
      })),
    }
  }

  const secret = await db.secret.create({
    data: secretData,
    include: {
      values: true,
      project: {
        select: {
          id: true,
          name: true,
          orgId: true,
        },
      },
    },
  })

  await createAuditLog({
    userId: user.id,
    orgId: secret.project.orgId,
    projectId: project,
    action: "secret.created",
    resource: "secret",
    metadata: {
      secretId: secret.id,
      secretKey: secret.key,
      projectName: secret.project.name,
      environmentCount: secret.values.length,
      environments: secret.values.map(v => v.environment),
    },
    description: `Created secret "${secret.key}" in project "${secret.project.name}" with ${secret.values.length} environment(s)`,
    event,
  })

  return {
    ...secret,
    values: secret.values.map(val => ({
      ...val,
      value: decrypt(val.value),
    })),
  }
})
