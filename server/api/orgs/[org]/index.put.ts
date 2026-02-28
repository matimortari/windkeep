import { updateOrgSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "org", orgId }, ["OWNER"])

  const body = await readBody(event)
  const result = updateOrgSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingOrg = await db.organization.findUnique({ where: { id: orgId }, select: { name: true } })
  if (!existingOrg) {
    throw createError({ status: 404, statusText: "Organization not found" })
  }

  const updatedOrg = await db.organization.update({ where: { id: orgId }, data: { name: result.data.name } })

  await createAuditLog({
    event,
    userId: user.id,
    orgId,
    action: "UPDATE.ORG",
    resource: "organization",
    description: `Updated organization "${updatedOrg.name}"`,
    metadata: {
      orgId,
      oldName: existingOrg.name,
      newName: updatedOrg.name,
    },
  })

  // Invalidate cache for org data
  await deleteCached(CacheKeys.orgData(user.id, orgId))

  return { updatedOrg }
})
