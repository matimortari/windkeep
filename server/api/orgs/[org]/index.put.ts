import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { updateOrgSchema } from "#shared/schemas/org-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const org = getRouterParam(event, "org")
  if (!org) {
    throw createError({ statusCode: 400, statusMessage: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId: org }, ["OWNER"])

  const body = await readBody(event)
  const result = updateOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const existingOrg = await db.organization.findUnique({
    where: { id: org },
    select: Object.keys(result.data).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, true>),
  }) as Record<string, unknown> | null

  const updatedOrg = await db.organization.update({
    where: { id: org },
    data: { name: result.data.name },
  })

  const changes = Object.entries(result.data).map(([key, newValue]) => {
    return `${key} from "${existingOrg?.[key]}" to "${newValue}"`
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: org,
    action: "UPDATE.ORG",
    resource: "organization",
    description: `Updated organization ${changes.join(", ")}`,
    metadata: {
      orgId: org,
      orgName: updatedOrg.name,
      changes: Object.fromEntries(Object.entries(result.data).map(([key, value]) => [key, { from: existingOrg?.[key], to: value }])),
    },
  })

  return updatedOrg
})
