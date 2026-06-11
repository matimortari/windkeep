import { createProjectSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `project:create:${sessionUser.id}`, 30)

  const body = await readBody(event)
  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid input" })
  }

  await requireRole(sessionUser.id, { type: "org", orgId: result.data.orgId }, ["OWNER", "ADMIN"])

  const slug = await generateSlug(result.data.name, result.data.orgId)

  const newProject = await db.project.create({
    data: {
      name: result.data.name,
      slug,
      description: result.data.description ?? null,
      website: result.data.website ?? null,
      orgId: result.data.orgId,
      memberships: { create: { userId: sessionUser.id, role: "OWNER" } },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      orgId: true,
      createdAt: true,
      updatedAt: true,
      org: { select: { id: true, name: true } },
      _count: { select: { secrets: true } },
      memberships: { select: { userId: true, role: true, user: { select: { id: true, name: true, image: true } } } },
    },
  })

  await createAuditLog({
    event,
    userId: sessionUser.id,
    orgId: newProject.orgId,
    projectId: newProject.id,
    action: "CREATE.PROJECT",
    resource: "project",
    description: `Created project "${newProject.name}" in organization "${newProject.org.name}"`,
    metadata: {
      projectId: newProject.id,
      projectName: newProject.name,
      orgId: newProject.org.id,
      orgName: newProject.org.name,
    },
  })

  await deleteCached(CacheKeys.userProjects(sessionUser.id, result.data.orgId))

  return { project: newProject }
})
