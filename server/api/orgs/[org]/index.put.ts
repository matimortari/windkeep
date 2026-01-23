import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { updateOrgSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "organization", orgId }, ["OWNER"])

  const body = await readBody(event)
  const result = updateOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingOrg = await db.organization.findUnique({
    where: { id: orgId },
    select: Object.keys(result.data).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, true>),
  }) as Record<string, unknown> | null

  const updatedOrg = await db.organization.update({
    where: { id: orgId },
    data: { name: result.data.name },
  })

  const changes = Object.entries(result.data).map(([key, newValue]) => {
    return `${key} from "${existingOrg?.[key]}" to "${newValue}"`
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId,
    action: "UPDATE.ORG",
    resource: "organization",
    description: `Updated organization ${changes.join(", ")}`,
    metadata: {
      orgId,
      orgName: updatedOrg.name,
      changes: Object.fromEntries(Object.entries(result.data).map(([key, value]) => [key, { from: existingOrg?.[key], to: value }])),
    },
  })

  return { updatedOrg }
})
