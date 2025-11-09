import createAuditLog from "#server/lib/audit"
import db from "#server/lib/db"
import { getUserFromSession, requireOrgRole } from "#server/lib/utils"
import { createProjectSchema } from "#shared/schemas/project-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid input", data: z.treeifyError(result.error) })
  }

  await requireOrgRole(user.id, result.data.organizationId, ["OWNER", "ADMIN"])

  // Check if project with same name or slug already exists in this organization
  const conflictingProject = await db.project.findFirst({
    where: {
      organizationId: result.data.organizationId,
      OR: [
        { name: result.data.name },
        { slug: result.data.slug },
      ],
    },
  })
  if (conflictingProject) {
    if (conflictingProject.slug === result.data.slug) {
      throw createError({ statusCode: 409, statusMessage: "A project with this slug already exists in the organization" })
    }
    throw createError({ statusCode: 409, statusMessage: "A project with this name already exists in the organization" })
  }

  const project = await db.project.create({
    data: {
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description,
      organizationId: result.data.organizationId,
      roles: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      roles: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          secrets: true,
        },
      },
    },
  })

  await createAuditLog({
    userId: user.id,
    organizationId: project.organizationId,
    projectId: project.id,
    action: "project.created",
    resource: "project",
    metadata: {
      projectName: project.name,
      projectSlug: project.slug,
      organizationName: project.organization.name,
    },
    description: `Created project "${project.name}" (${project.slug}) in organization "${project.organization.name}"`,
    event,
  })

  return project
})
