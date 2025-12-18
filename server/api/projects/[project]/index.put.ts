import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { updateProjectSchema } from "#shared/schemas/project-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId: project }, ["OWNER"])

  const body = await readBody(event)
  const result = updateProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  const existingProject = await db.project.findUnique({
    where: { id: project },
    select: Object.keys(result.data).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, true>),
  }) as Record<string, unknown> | null
  if (!existingProject) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
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
        NOT: { id: project },
      },
    })

    if (projectWithConflict) {
      if (projectWithConflict.slug === result.data.slug) {
        throw createError({ statusCode: 409, statusMessage: "A project with this slug already exists in the organization" })
      }
      throw createError({ statusCode: 409, statusMessage: "A project with this name already exists in the organization" })
    }
  }

  const updatedProject = await db.project.update({
    where: { id: project },
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
    projectId: project,
    action: "UPDATE.PROJECT",
    resource: "project",
    description: `Updated project ${changes.join(", ")}`,
    metadata: {
      projectId: project,
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

  return updatedProject
})
