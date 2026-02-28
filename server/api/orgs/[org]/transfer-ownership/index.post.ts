import { transferOwnershipSchema } from "#shared/schemas/org-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const orgId = getRouterParam(event, "org")
  if (!orgId) {
    throw createError({ status: 400, statusText: "Organization ID is required" })
  }

  await requireRole(user.id, { type: "org", orgId }, ["OWNER"])

  const body = await readBody(event)
  const result = transferOwnershipSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }
  if (result.data.newOwnerId === user.id) {
    throw createError({ status: 400, statusText: "Cannot transfer ownership to yourself" })
  }

  const newOwnerMembership = await db.orgMembership.findUnique({
    where: { userId_orgId: { userId: result.data.newOwnerId, orgId } },
    include: { user: { select: { id: true, email: true, name: true } } },
  })
  if (!newOwnerMembership) {
    throw createError({ status: 404, statusText: "New owner is not a member of this organization" })
  }
  if (newOwnerMembership.role === "OWNER") {
    throw createError({ status: 400, statusText: "User is already an owner of this organization" })
  }

  const currentOwner = await db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true } })
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { name: true } })

  // Make new owner and demote current owner to admin
  await db.$transaction([
    db.orgMembership.update({
      where: { userId_orgId: { userId: result.data.newOwnerId, orgId } },
      data: { role: "OWNER" },
    }),
    db.orgMembership.update({
      where: { userId_orgId: { userId: user.id, orgId } },
      data: { role: "ADMIN" },
    }),
  ])

  await createAuditLog({
    event,
    userId: user.id,
    orgId,
    action: "TRANSFER.ORG_OWNERSHIP",
    resource: "organization",
    description: `${currentOwner?.name} (${currentOwner?.email}) transferred ownership of "${org?.name}" to ${newOwnerMembership.user.name} (${newOwnerMembership.user.email})`,
    metadata: {
      fromUserId: user.id,
      fromUserName: currentOwner?.name,
      fromUserEmail: currentOwner?.email,
      toUserId: result.data.newOwnerId,
      toUserName: newOwnerMembership.user.name,
      toUserEmail: newOwnerMembership.user.email,
      orgId,
      orgName: org?.name,
    },
  })

  // Invalidate cache for both users
  await deleteCached(CacheKeys.userData(user.id), CacheKeys.userData(result.data.newOwnerId))

  return {
    success: true,
    message: `Ownership transferred to ${newOwnerMembership.user.name}`,
    newOwner: { id: newOwnerMembership.user.id, name: newOwnerMembership.user.name, email: newOwnerMembership.user.email },
  }
})
