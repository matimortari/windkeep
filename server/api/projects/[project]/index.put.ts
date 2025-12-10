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
    select: {
      orgId: true,
      name: true,
      slug: true,
      description: true,
    },
  })
  if (!existingProject) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  // Check if project with same name or slug already exists in this organization
  if (result.data.name || result.data.slug) {
    const conflictingProject = await db.project.findFirst({
      where: {
        orgId: existingProject.orgId,
        OR: [
          result.data.name ? { name: result.data.name } : {},
          result.data.slug ? { slug: result.data.slug } : {},
        ].filter(condition => Object.keys(condition).length > 0),
        NOT: { id: project },
      },
    })
    if (conflictingProject) {
      if (conflictingProject.slug === result.data.slug) {
        throw createError({ statusCode: 409, statusMessage: "A project with this slug already exists in the organization" })
      }
      throw createError({ statusCode: 409, statusMessage: "A project with this name already exists in the organization" })
    }
  }

  const updatedProject = await db.project.update({
    where: { id: project },
    data: {
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description,
    },
    include: {
      org: true,
    },
  })

  const changes = []
  if (result.data.name && result.data.name !== existingProject.name) {
    changes.push(`name: "${existingProject.name}" → "${result.data.name}"`)
  }
  if (result.data.slug && result.data.slug !== existingProject.slug) {
    changes.push(`slug: "${existingProject.slug}" → "${result.data.slug}"`)
  }
  if (result.data.description !== undefined && result.data.description !== existingProject.description) {
    changes.push("description")
  }

  await createAuditLog({
    userId: user.id,
    orgId: updatedProject.orgId,
    projectId: project,
    action: "project.updated",
    resource: "project",
    metadata: {
      projectName: updatedProject.name,
      oldName: existingProject.name,
      newName: result.data.name,
      oldSlug: existingProject.slug,
      newSlug: result.data.slug,
      changedFields: changes,
    },
    description: `Updated project "${updatedProject.name}" (${changes.length > 0 ? changes.join(", ") : "no changes"})`,
    event,
  })

  return updatedProject
})
