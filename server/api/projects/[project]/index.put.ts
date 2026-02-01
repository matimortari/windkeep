import db from "#server/utils/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/utils/helpers"
import { CacheKeys, deleteCached } from "#server/utils/redis"
import { updateProjectSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ status: 400, statusText: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId }, ["OWNER"])

  const body = await readBody(event)
  const result = updateProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({ status: 400, statusText: result.error.issues[0]?.message || "Invalid input" })
  }

  const existingProject = await db.project.findUnique({
    where: { id: projectId },
    select: Object.keys(result.data).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, true>),
  }) as Record<string, unknown> | null
  if (!existingProject) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  // Check if project with same name or slug already exists in this organization
  if (result.data.name || result.data.slug) {
    const projectWithConflict = await db.project.findFirst({
      where: {
        orgId: existingProject.orgId as string,
        OR: [
          result.data.name ? { name: result.data.name } : {},
          result.data.slug ? { slug: result.data.slug } : {},
        ].filter(Boolean),
        NOT: { id: projectId },
      },
    })

    if (projectWithConflict) {
      if (projectWithConflict.slug === result.data.slug) {
        throw createError({ status: 409, statusText: "A project with this slug already exists in the organization" })
      }
      throw createError({ status: 409, statusText: "A project with this name already exists in the organization" })
    }
  }

  const updatedProject = await db.project.update({
    where: { id: projectId },
    data: result.data,
    include: { org: true },
  })

  const changes = Object.entries(result.data).map(([key, newValue]) => {
    return `${key} from "${existingProject[key]}" to "${newValue}"`
  })

  await createAuditLog({
    event,
    userId: user.id,
    orgId: updatedProject.org.id,
    projectId,
    action: "UPDATE.PROJECT",
    resource: "project",
    description: `Updated project ${changes.join(", ")}`,
    metadata: {
      projectId,
      projectName: updatedProject.name,
      changes: Object.fromEntries(
        Object.entries(result.data).map(([key, value]) => [
          key,
          { from: existingProject[key], to: value },
        ]),
      ),
      orgId: updatedProject.org.id,
      orgName: updatedProject.org.name,
    },
  })

  // Invalidate cache for user projects and org data
  await deleteCached(CacheKeys.userProjects(user.id), CacheKeys.orgData(user.id, updatedProject.org.id))

  return { project: updatedProject }
})
