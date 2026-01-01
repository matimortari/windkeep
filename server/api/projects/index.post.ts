import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"
import { createProjectSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const body = await readBody(event)

  const result = createProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message || "Invalid input" })
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
    throw createError({ statusCode: 409, statusMessage: "A project with this name or slug already exists in the organization" })
  }

  const newProject = await db.project.create({
    data: {
      name: result.data.name,
      slug: result.data.slug!,
      description: result.data.description ?? null,
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
    orgId: newProject.orgId,
    projectId: newProject.id,
    action: "CREATE.PROJECT",
    resource: "project",
    description: `Created project "${newProject.name}" (${newProject.slug}) in organization "${newProject.org.name}"`,
    metadata: {
      projectId: newProject.id,
      projectName: newProject.name,
      projectSlug: newProject.slug,
      orgId: newProject.org.id,
      orgName: newProject.org.name,
      creatorId: user.id,
      creatorEmail: user.email,
      creatorName: user.name,
    },
  })

  return { project: newProject }
})
