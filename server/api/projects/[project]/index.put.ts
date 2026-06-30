import { updateProjectSchema } from "#shared/schemas/project-schema"

export default defineEventHandler(async (event) => {
  const sessionUser = await getUserFromSession(event)
  const projectId = getRouterParam(event, "project")
  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  // Rate limit: 30 requests per hour per user
  await enforceRateLimit(event, `project:update:${sessionUser.id}`, 30)
  await requireRole(sessionUser.id, { type: "project", projectId }, ["OWNER"])

  const body = await readBody(event)
  const result = updateProjectSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: result.error.issues[0]?.message ?? "Invalid input" })
  }

  const existingProject = await db.project.findUnique({
    where: { id: projectId },
    select: { name: true, slug: true, description: true, website: true, orgId: true },
  })
  if (!existingProject) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  if (result.data.name || result.data.slug) {
    const conflictingProject = await db.project.findFirst({
      where: {
        orgId: existingProject.orgId,
        OR: [
          ...(result.data.name ? [{ name: result.data.name }] : []),
          ...(result.data.slug ? [{ slug: result.data.slug }] : []),
        ],
        NOT: { id: projectId },
      },
    })
    if (conflictingProject) {
      const conflictField = conflictingProject.slug === result.data.slug ? "slug" : "name"
      throw createError({ statusCode: 409, statusMessage: `A project with this ${conflictField} already exists in the organization` })
    }
  }

  const updatedProject = await db.project.update({
    where: { id: projectId },
    data: result.data,
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
  if (result.data.website !== undefined && result.data.website !== existingProject.website) {
    changes.push(`website`)
  }

  await createAuditLog({
    event,
    userId: sessionUser.id,
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
      oldWebsite: existingProject.website === updatedProject.website ? undefined : existingProject.website,
      newWebsite: updatedProject.website,
      orgId: updatedProject.org.id,
      orgName: updatedProject.org.name,
    },
  })

  await deleteCached(CacheKeys.userProjects(sessionUser.id, existingProject.orgId))

  const { org: _org, ...project } = updatedProject

  return { project }
})

defineRouteMeta({
  openAPI: {
    summary: "Update project",
    description: "Updates project metadata. Name and slug must be unique within the organization. Requires project OWNER role.",
    tags: ["Projects"],
    parameters: [
      { in: "path", name: "project", required: true, schema: { type: "string" }, description: "Project ID" },
    ],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Project name" },
              slug: { type: "string", description: "Project slug" },
              description: { type: "string", description: "Project description (optional)" },
              website: { type: "string", description: "Project website (optional)" },
            },
          },
        },
      },
    },
    responses: {
      200: { description: "Project updated" },
      400: { description: "Validation error" },
      401: { description: "Unauthenticated" },
      403: { description: "Insufficient role" },
      404: { description: "Project not found" },
      409: { description: "Name or slug already taken in the organization" },
      429: { description: "Rate limit exceeded" },
    },
  },
})
