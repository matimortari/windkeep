import db from "#server/lib/db"
import { createAuditLog, getUserFromSession, requireRole } from "#server/lib/utils"

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)
  const project = getRouterParam(event, "project")
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: "Project ID is required" })
  }

  await requireRole(user.id, { type: "project", projectId: project }, ["OWNER"])

  const projectData = await db.project.findUnique({
    where: { id: project },
    select: {
      id: true,
      name: true,
      slug: true,
      orgId: true,
      org: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          secrets: true,
          memberships: true,
        },
      },
    },
  })
  if (!projectData) {
    throw createError({ statusCode: 404, statusMessage: "Project not found" })
  }

  // Create audit log before deletion
  await createAuditLog({
    event,
    userId: user.id,
    orgId: projectData.orgId,
    projectId: project,
    action: "DELETE.PROJECT",
    resource: "project",
    description: `Deleted project "${projectData.name}" (${projectData.slug}) from organization "${projectData.org.name}" (${projectData._count.secrets} secret(s), ${projectData._count.memberships} member(s))`,
    metadata: {
      projectId: projectData.id,
      projectName: projectData.name,
      projectSlug: projectData.slug,
      orgId: projectData.orgId,
      orgName: projectData.org.name,
      secretsDeleted: projectData._count.secrets,
      membersRemoved: projectData._count.memberships,
    },
  })

  await db.project.delete({
    where: { id: project },
  })

  return {
    success: true,
    message: `Project "${projectData.name}" deleted successfully`,
    secretsDeleted: projectData._count.secrets,
  }
})
