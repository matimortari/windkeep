export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 5 requests per hour per user
  await enforceRateLimit(event, `user:delete:${sessionUser.id}`, 5)

  // Gather identity metadata before dropping database records
  const accountData = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { image: true, orgMemberships: {
      where: { role: "OWNER" },
      select: { org: { select: { id: true, name: true, _count: { select: { memberships: true } } } } },
    } },
  },
  )
  if (!accountData) {
    throw createError({ status: 404, statusText: "User account not found" })
  }

  // Block deletion if user owns orgs with other members
  const orphanedOrgs = accountData.orgMemberships.filter(m => m.org._count.memberships > 1).map(m => m.org.name)
  if (orphanedOrgs.length > 0) {
    throw createError({ status: 400, statusText: `Transfer ownership or delete these organizations first: ${orphanedOrgs.join(", ")}` })
  }

  // Delete solo-owned orgs, which will cascade delete projects and memberships
  const soloOwnedOrgs = accountData.orgMemberships.filter(m => m.org._count.memberships === 1).map(m => m.org.id)
  if (soloOwnedOrgs.length > 0) {
    await db.organization.deleteMany({ where: { id: { in: soloOwnedOrgs } } })
  }
  if (accountData.image) {
    await deleteFile(accountData.image)
  }

  // Delete the user (cascade will handle related records) and clear session cookies
  await db.user.delete({ where: { id: sessionUser.id } })
  await clearUserSession(event)

  await deleteCached(CacheKeys.userData(sessionUser.id))

  return { success: true, message: "Your account and all associated data have been permanently deleted." }
})

defineRouteMeta({
  openAPI: {
    summary: "Delete user account",
    description: "Permanently deletes the user's account. Blocks if the user owns organizations with other members.",
    tags: ["User"],
    responses: {
      200: { description: "User account and all associated data deleted" },
      400: { description: "Current user owns organizations with other members" },
      401: { description: "Unauthenticated" },
      404: { description: "User not found" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
