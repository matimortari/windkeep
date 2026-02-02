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

  const existingProject = await db.project.findUnique({ where: { id: projectId }, select: { name: true, slug: true, description: true, orgId: true } })
  if (!existingProject) {
    throw createError({ status: 404, statusText: "Project not found" })
  }

  // Check if project with same name or slug already exists in this organization
  if (result.data.name || result.data.slug) {
    const conflictingProject = await db.project.findFirst({
      where: {
        orgId: existingProject.orgId,
        OR: [...(result.data.name ? [{ name: result.data.name }] : []), ...(result.data.slug ? [{ slug: result.data.slug }] : [])],
        NOT: { id: projectId },
      },
    })
    if (conflictingProject) {
      const conflictField = conflictingProject.slug === result.data.slug ? "slug" : "name"
      throw createError({ status: 409, statusText: `A project with this ${conflictField} already exists in the organization` })
    }
  }

  const updatedProject = await db.project.update({ where: { id: projectId }, data: result.data, include: { org: true } })

  const changes = []
  if (result.data.name && result.data.name !== existingProject.name) {
    changes.push(`name to "${result.data.name}"`)
  }
  if (result.data.slug && result.data.slug !== existingProject.slug) {
    changes.push(`slug to "${result.data.slug}"`)
  }
  if (result.data.description !== undefined && result.data.description !== existingProject.description) {
    changes.push(`description`)
  }

  await createAuditLog({
    event,
    userId: user.id,
    orgId: updatedProject.org.id,
    projectId,
    action: "UPDATE.PROJECT",
    resource: "project",
    description: `Updated project "${updatedProject.name}"${changes.length ? ` (${changes.join(", ")})` : ""}`,
    metadata: {
      projectId,
      projectName: updatedProject.name,
      oldName: existingProject.name === updatedProject.name ? undefined : existingProject.name,
      oldSlug: existingProject.slug === updatedProject.slug ? undefined : existingProject.slug,
      descriptionChanged: result.data.description !== undefined && result.data.description !== existingProject.description,
      orgId: updatedProject.org.id,
      orgName: updatedProject.org.name,
    },
  })

  // Invalidate cache for user projects and org data
  await deleteCached(CacheKeys.userProjects(user.id), CacheKeys.orgData(user.id, updatedProject.org.id))

  return { project: updatedProject }
})
