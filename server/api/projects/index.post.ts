import db from "#server/utils/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/utils/helpers"
import { CacheKeys, deleteCached } from "#server/utils/redis"
import { createProjectSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)
  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  await requireRole(user.id, { type: "org", orgId: result.data.orgId }, ["OWNER", "ADMIN"])

  const conflictingProject = await db.project.findFirst({ where: { orgId: result.data.orgId, name: result.data.name } })
  if (conflictingProject) {
    throw createError({ status: 409, statusText: "A project with this name already exists in the organization" })
  }

  const newProject = await db.project.create({
    data: {
      name: result.data.name,
      slug: result.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").substring(0, 50),
      description: result.data.description ?? null,
      orgId: result.data.orgId,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
    include: { org: { select: { id: true, name: true } }, memberships: {
      include: { user: { select: { id: true, email: true, name: true, image: true } } },
    }, _count: { select: { secrets: true } } },
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: newProject.orgId,
    projectId: newProject.id,
    action: "CREATE.PROJECT",
    resource: "project",
    description: `Created project "${newProject.name}" (${newProject.slug}) in organization "${newProject.org.name}"`,
    metadata: {
      projectId: newProject.id,
      projectName: newProject.name,
      orgId: newProject.org.id,
      orgName: newProject.org.name,
    },
  })

  // Invalidate cache for user projects and org data
  await deleteCached(CacheKeys.userProjects(user.id), CacheKeys.orgData(user.id, newProject.orgId))

  return { project: newProject }
})
