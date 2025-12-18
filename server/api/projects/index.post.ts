import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { createProjectSchema } from "#shared/schemas/project-schema"
import z from "zod"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: z.treeifyError(result.error),
    })
  }

  await requireRole(user.id, { type: "organization", orgId: result.data.orgId }, ["OWNER", "ADMIN"])

  // Check if project with same name or slug already exists in this organization
  const conflictingProject = await db.project.findFirst({
    where: {
      orgId: result.data.orgId,
      OR: [
        { name: result.data.name },
        { slug: result.data.slug },
      ],
    },
  })
  if (conflictingProject) {
    if (conflictingProject.slug === result.data.slug) {
      throw createError({
        statusCode: 409,
        statusMessage: "A project with this slug already exists in the organization",
      })
    }
    throw createError({
      statusCode: 409,
      statusMessage: "A project with this name already exists in the organization",
    })
  }

  const project = await db.project.create({
    data: {
      name: result.data.name,
      slug: result.data.slug,
      description: result.data.description,
      orgId: result.data.orgId,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
        },
      },
      memberships: {
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
    event,
    userId: user.id,
    orgId: project.orgId,
    projectId: project.id,
    action: "CREATE.PROJECT",
    resource: "project",
    description: `Created project "${project.name}" (${project.slug}) in organization "${project.org.name}"`,
    metadata: {
      projectId: project.id,
      projectName: project.name,
      projectSlug: project.slug,
      orgId: project.org.id,
      orgName: project.org.name,
      creatorId: user.id,
      creatorEmail: user.email,
      creatorName: user.name,
    },
  })

  return project
})
